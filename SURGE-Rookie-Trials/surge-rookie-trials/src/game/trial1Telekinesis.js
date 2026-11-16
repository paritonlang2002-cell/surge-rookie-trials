import * as THREE from 'three';
import { COLORS, GAME } from '../config.js';
import { toonMaterial, addOutline } from '../fx/comicStyle.js';

const CRATES = [
  { label: 'LIGHT', mass: 1, color: '#22e6ff', x: -0.31, size: 0.085 },
  { label: 'MEDIUM', mass: 2, color: '#ffe14a', x: -0.06, size: 0.105 },
  { label: 'HEAVY', mass: 4, color: '#ff2e9a', x: 0.22, size: 0.13 }
];

export function createTrial1(scene, audio, particles) {
  const group = new THREE.Group(); scene.add(group);
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const crates = [];
  const ringGeo = new THREE.TorusGeometry(0.09, 0.008, 8, 40);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: COLORS.cyan }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(0.32, GAME.deskHeight + 0.012, -0.37); group.add(ring);
  const ringGlow = new THREE.Mesh(new THREE.CircleGeometry(0.09, 40), new THREE.MeshBasicMaterial({ color: COLORS.cyan, transparent: true, opacity: 0.13 }));
  ringGlow.rotation.x = -Math.PI / 2; ringGlow.position.copy(ring.position); ringGlow.position.y -= 0.002; group.add(ringGlow);

  CRATES.forEach((data, i) => {
    const mesh = new THREE.Mesh(geometry, toonMaterial(data.color));
    mesh.scale.setScalar(data.size);
    mesh.position.set(data.x, GAME.deskHeight + data.size / 2, -0.36);
    mesh.userData = { ...data, delivered: false, start: mesh.position.clone() };
    addOutline(mesh); group.add(mesh); crates.push(mesh);
  });
  let held = null, focus = 100, score = 0, time = GAME.trial1Seconds, finished = false;
  const handTarget = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const pickables = crates;

  function beginPinch(ray, origin) {
    if (held || finished) return;
    if (ray) raycaster.copy(ray);
    else if (origin) raycaster.set(origin, new THREE.Vector3(0, 0, -1));
    const hits = raycaster.intersectObjects(pickables, false);
    const candidate = hits.find(hit => !hit.object.userData.delivered);
    if (candidate) {
      held = candidate.object; audio.play('grab', held); audio.play('whoosh', held);
      particles.burst(held.position, 12, COLORS.cyan);
    }
  }
  function setTarget(point) { if (held && point) handTarget.copy(point); }
  function endPinch() {
    if (!held) return;
    const distance = held.position.distanceTo(ring.position);
    if (distance < 0.15) {
      held.userData.delivered = true; held.visible = false; score += held.userData.mass * 10;
      particles.burst(ring.position, 24, COLORS.yellow); audio.play('success', ring);
    }
    held = null;
  }
  function update(dt, ray, pointerOrigin) {
    if (finished) return;
    time = Math.max(0, time - dt);
    if (held) {
      focus = Math.max(0, focus - held.userData.mass * GAME.focusDrainPerSecond * dt);
      if (pointerOrigin) {
        const direction = ray?.direction || new THREE.Vector3(0, 0, -1);
        handTarget.copy(pointerOrigin).addScaledVector(direction, 0.27);
        handTarget.y = Math.max(GAME.deskHeight + 0.08, Math.min(GAME.deskHeight + 0.34, handTarget.y));
      }
      held.position.lerp(handTarget, GAME.followLerp);
      if (focus <= 0) held = null;
    } else focus = Math.min(100, focus + GAME.focusRecoverPerSecond * dt);
    if (time <= 0 || crates.every(c => c.userData.delivered)) finished = true;
    return { focus, score, time, done: finished };
  }
  function reset() {
    held = null; focus = 100; score = 0; time = GAME.trial1Seconds; finished = false;
    crates.forEach(c => { c.visible = true; c.userData.delivered = false; c.position.copy(c.userData.start); });
  }
  function findNearest(point, maxDistance = 0.24) {
    let best = null, distance = maxDistance;
    crates.forEach(c => {
      if (c.visible && !c.userData.delivered) {
        const d = c.position.distanceTo(point);
        if (d < distance) { distance = d; best = c; }
      }
    });
    return best;
  }
  return {
    group, crates, ring, beginPinch, endPinch, setTarget, update, reset,
    findNearest, get held() { return held; }, get score() { return score; }
  };
}