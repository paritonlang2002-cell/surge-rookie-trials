import * as THREE from 'three';
import { GESTURES } from '../config.js';

export const PINCH_START = GESTURES.PINCH_START;
export const PINCH_END = GESTURES.PINCH_END;
export const PALM_EXTEND = GESTURES.PALM_EXTEND;
const JOINTS = ['wrist', 'thumb-tip', 'index-finger-tip', 'middle-finger-tip', 'ring-finger-tip', 'pinky-finger-tip'];

function joint(hand, name) {
  return hand.getObjectByName(name) || hand.getObjectByName(name.replaceAll('-', '_'));
}

export function createGestureTracker(onEvent = () => {}) {
  const scratchA = new THREE.Vector3(), scratchB = new THREE.Vector3();
  const handStates = [0, 1].map(() => ({
    found: false, pinch: false, palm: false, samples: [], average: 1,
    tip: new THREE.Vector3(), wrist: new THREE.Vector3()
  }));
  function emit(type, handIndex, data = {}) { onEvent({ type, handIndex, ...data }); }

  function update(hands) {
    hands.forEach((hand, index) => {
      const s = handStates[index];
      const wrist = joint(hand, 'wrist');
      const thumb = joint(hand, 'thumb-tip');
      const indexTip = joint(hand, 'index-finger-tip');
      const middle = joint(hand, 'middle-finger-tip');
      const ring = joint(hand, 'ring-finger-tip');
      const pinky = joint(hand, 'pinky-finger-tip');
      const visible = !!(wrist && thumb && indexTip && wrist.visible && indexTip.visible);
      if (visible && !s.found) { s.found = true; emit('handFound', index); }
      if (!visible && s.found) {
        s.found = false; s.pinch = false; s.palm = false; emit('handLost', index);
      }
      if (!visible) return;
      hand.updateMatrixWorld(true);
      wrist.getWorldPosition(s.wrist);
      indexTip.getWorldPosition(s.tip);
      thumb.getWorldPosition(scratchA);
      indexTip.getWorldPosition(scratchB);
      const distance = scratchA.distanceTo(scratchB);
      s.samples.push(distance);
      if (s.samples.length > GESTURES.SMOOTH_FRAMES) s.samples.shift();
      s.average = s.samples.reduce((a, b) => a + b, 0) / s.samples.length;
      const nextPinch = s.pinch ? s.average < PINCH_END : s.average < PINCH_START;
      if (nextPinch !== s.pinch) {
        s.pinch = nextPinch; emit(nextPinch ? 'pinchStart' : 'pinchEnd', index, { position: s.tip.clone() });
      }
      const tips = [indexTip, middle, ring, pinky];
      const extended = tips.every(t => {
        if (!t || !t.visible) return false;
        t.getWorldPosition(scratchA);
        return scratchA.distanceTo(s.wrist) > PALM_EXTEND;
      });
      const nextPalm = extended && !s.pinch;
      if (nextPalm !== s.palm) {
        s.palm = nextPalm; emit(nextPalm ? 'palmOpen' : 'palmClose', index);
      }
    });
  }
  return {
    update,
    get states() { return handStates; },
    get anyHandFound() { return handStates.some(s => s.found); },
    get anyPinching() { return handStates.some(s => s.pinch); },
    get anyPalmOpen() { return handStates.some(s => s.palm); },
    get primaryTip() { return handStates.find(s => s.found)?.tip || null; },
    get primaryWrist() { return handStates.find(s => s.found)?.wrist || null; }
  };
}