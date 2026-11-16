import * as THREE from 'three';

// Desktop pointer is a camera ray. Space is held, not toggled, for open palm.
export function createDesktopFallback(renderer, camera, canvas, onGesture) {
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let pinch = false, palm = false, enabled = true;
  function move(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  function down() { if (!enabled || pinch) return; pinch = true; onGesture({ type: 'pinchStart', desktop: true }); }
  function up() { if (!pinch) return; pinch = false; onGesture({ type: 'pinchEnd', desktop: true }); }
  function keyDown(e) {
    if (e.code === 'Space' && !e.repeat) { e.preventDefault(); palm = true; onGesture({ type: 'palmOpen', desktop: true }); }
  }
  function keyUp(e) {
    if (e.code === 'Space' && palm) { palm = false; onGesture({ type: 'palmClose', desktop: true }); }
  }
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerdown', down);
  window.addEventListener('pointerup', up);
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  return {
    update() {},
    get ray() { camera.updateMatrixWorld(); raycaster.setFromCamera(pointer, camera); return raycaster; },
    get pinching() { return pinch; }, get palmOpen() { return palm; },
    setEnabled(value) { enabled = value; if (!value) { up(); if (palm) { palm = false; onGesture({ type: 'palmClose', desktop: true }); } } },
    dispose() {
      canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up); window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp);
    }
  };
}