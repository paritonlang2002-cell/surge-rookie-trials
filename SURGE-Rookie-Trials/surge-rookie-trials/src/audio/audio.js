import * as THREE from 'three';
import { ASSET_PATHS } from '../config.js';

export function createAudio(camera) {
  const listener = new THREE.AudioListener();
  camera.add(listener);
  const loader = new THREE.AudioLoader();
  const sounds = new Map();
  let unlocked = false;
  const positions = new Map();

  function unlock() {
    if (unlocked) return;
    unlocked = true;
    try { if (listener.context.state !== 'running') listener.context.resume(); } catch {}
  }
  function load(name, path) {
    const sound = new THREE.PositionalAudio(listener);
    sound.setRefDistance(0.7);
    sound.setVolume(name === 'slow' ? 0.12 : 0.35);
    sounds.set(name, sound);
    loader.load(path, buffer => sound.setBuffer(buffer), undefined, () => {
      // Optional clips may be absent. Keep the game playable without them.
    });
  }
  Object.entries(ASSET_PATHS).filter(([name]) => ['grab', 'whoosh', 'success', 'slow'].includes(name))
    .forEach(([name, path]) => load(name, `/${path}`));

  function play(name, parent) {
    unlock();
    const sound = sounds.get(name);
    if (!sound?.buffer) return;
    try {
      if (parent && !sound.parent) parent.add(sound);
      if (sound.isPlaying) sound.stop();
      sound.play();
    } catch {}
  }
  function setSlow(active, scene) {
    const sound = sounds.get('slow');
    if (!sound?.buffer) return;
    if (active) {
      if (!sound.parent) scene.add(sound);
      if (!sound.isPlaying) { try { sound.play(); } catch {} }
    } else if (sound.isPlaying) sound.stop();
  }
  return { listener, unlock, play, setSlow };
}