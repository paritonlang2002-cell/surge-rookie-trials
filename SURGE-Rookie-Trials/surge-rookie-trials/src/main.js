import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { COLORS, GAME, ASSET_PATHS } from './config.js';
import './style.css';
import { createStateMachine, STATES } from './game/state.js';
import { createGestureTracker } from './input/gestures.js';
import { createDesktopFallback } from './input/desktopFallback.js';
import { createTrial1 } from './game/trial1Telekinesis.js';
import { createTrial2 } from './game/trial2TimeSlow.js';
import { createPanels } from './ui/panels.js';
import { createParticles } from './fx/particles.js';
import { toonMaterial, addOutline, showPopup } from './fx/comicStyle.js';
import { createAudio } from './audio/audio.js';
import { addOptionalProp, makeCrateFallback } from './assets/loader.js';

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.navy);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.03, 10);
camera.position.set(0, 1.58, 0.08);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, GAME.maxPixelRatio));
renderer.setSize(innerWidth, innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFoveation?.(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
renderer.domElement.id = 'game-canvas';

const hemi = new THREE.HemisphereLight(0x9bbcff, 0x211333, 1.35); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(-0.4, 1.8, 0.7); scene.add(key);

function box(w, h, d, color, position, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toonMaterial(color));
  mesh.position.set(...position); addOutline(mesh); parent.add(mesh); return mesh;
}
function sphere(radius, color, position) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 16, 12), toonMaterial(color));
  mesh.position.set(...position); addOutline(mesh); scene.add(mesh); return mesh;
}
function makeHalftone() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COLORS.navy; ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = 'rgba(34,230,255,.17)';
  for (let y = 3; y < 64; y += 12) for (let x = 3; x < 64; x += 12) {
    ctx.beginPath(); ctx.arc(x, y, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 3); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function buildRoom() {
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ map: makeHalftone() }));
  wall.position.set(0, 1.45, -0.82); scene.add(wall);
  box(1.45, 0.07, 0.72, COLORS.wood, [0, GAME.deskHeight - 0.035, -0.27]);
  box(1.3, 0.035, 0.65, COLORS.woodLight, [0, GAME.deskHeight + 0.018, -0.27]);
  box(0.07, 0.7, 0.07, COLORS.wood, [-0.61, 0.36, -0.02]);
  box(0.07, 0.7, 0.07, COLORS.wood, [0.61, 0.36, -0.02]);
  box(0.07, 0.7, 0.07, COLORS.wood, [-0.61, 0.36, -0.57]);
  box(0.07, 0.7, 0.07, COLORS.wood, [0.61, 0.36, -0.57]);
  sphere(0.055, COLORS.magenta, [-0.53, 1.08, -0.68]);
  sphere(0.045, COLORS.cyan, [0.54, 1.18, -0.67]);
  const badge = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 32), new THREE.MeshBasicMaterial({ color: COLORS.yellow }));
  badge.position.set(0, 1.25, -0.79); scene.add(badge);
}
buildRoom();

const audio = createAudio(camera);
const particles = createParticles(scene);
const trial1 = createTrial1(scene, audio, particles);
const trial2 = createTrial2(scene, audio, particles);
const state = createStateMachine();
const panels = createPanels(state, {
  startTutorial: () => { audio.unlock(); state.transition(STATES.TUTORIAL); panels.show(STATES.TUTORIAL); },
  startTrial1: () => startTrial1(),
  restart: () => restart(),
  playAgain: () => startTrial1()
}, camera);

function startTrial1() {
  trial1.reset(); trial2.reset(); state.transition(STATES.TRIAL_1); panels.hide();
  $('hud').classList.remove('hidden'); $('phase-label').textContent = 'TRIAL 1 · TELEKINESIS';
  $('meter-label').textContent = 'FOCUS'; $('score-label').innerHTML = 'SCORE <b id="score">0</b>';
}
function startTrial2() {
  trial2.reset(); state.transition(STATES.TRIAL_2); panels.hide();
  $('phase-label').textContent = 'TRIAL 2 · TIME SLOW'; $('meter-label').textContent = 'TIME';
  $('score-label').innerHTML = 'CAUGHT <b id="score">0</b>';
}
function restart() {
  trial1.reset(); trial2.reset(); $('hud').classList.add('hidden');
  state.transition(STATES.START); panels.show(STATES.START);
}
function showResults() {
  $('hud').classList.add('hidden'); state.transition(STATES.RESULTS);
  panels.show(STATES.RESULTS, { score1: trial1.score, caught: trial2.caught });
}
panels.show(STATES.START);
$('loading')?.remove();

const handFactory = new XRHandModelFactory();
const hands = [renderer.xr.getHand(0), renderer.xr.getHand(1)];
hands.forEach((hand, i) => {
  scene.add(hand);
  try { hand.add(handFactory.createHandModel(hand, 'mesh')); } catch {}
});
let desktop;
const gestureTracker = createGestureTracker(event => handleGesture(event));
function handleGesture(event) {
  if (event.type === 'pinchStart') {
    audio.unlock();
    if (renderer.xr.isPresenting && (state.current === STATES.START || state.current === STATES.TUTORIAL || state.current === STATES.PAUSED || state.current === STATES.RESULTS)) {
      const tip = gestureTracker.primaryTip;
      if (tip) { camera.getWorldDirection(forward); if (panels.activate({ origin: tip, direction: forward })) return; }
    }
    if (state.current === STATES.START) { if (event.desktop && panels.activate(desktop.ray)) return; state.transition(STATES.TUTORIAL); panels.show(STATES.TUTORIAL); return; }
    if (event.desktop && [STATES.TUTORIAL, STATES.PAUSED, STATES.RESULTS].includes(state.current) && panels.activate(desktop.ray)) return;
    if (state.current === STATES.TRIAL_1) {
      if (event.desktop) {
        const ray = desktop.ray;
        trial1.beginPinch(ray);
      } else {
        const tip = gestureTracker.primaryTip;
        if (tip) trial1.beginPinch(null, tip);
      }
    } else if (state.current === STATES.TRIAL_2) {
      if (event.desktop) trial2.catchAt(null, desktop.ray);
      else trial2.catchAt(gestureTracker.primaryTip);
    }
  }
  if (event.type === 'pinchEnd' && state.current === STATES.TRIAL_1) trial1.endPinch();
  if (event.type === 'palmOpen') audio.setSlow(true, scene);
  if (event.type === 'palmClose') audio.setSlow(false, scene);
  if (event.type === 'handLost' && (state.current === STATES.TRIAL_1 || state.current === STATES.TRIAL_2)) {
    state.transition(STATES.PAUSED); panels.show(STATES.PAUSED);
  }
  if (event.type === 'handFound' && state.current === STATES.PAUSED) {
    state.resume(); panels.hide();
  }
}
desktop = createDesktopFallback(renderer, camera, renderer.domElement, handleGesture);

const enterVR = VRButton.createButton(renderer, {
  requiredFeatures: [],
  optionalFeatures: ['hand-tracking', 'local-floor']
});
enterVR.textContent = 'ENTER VR';
document.body.appendChild(enterVR);
renderer.xr.addEventListener('sessionstart', () => {
  panels.setXR(true);
  desktop.setEnabled(false); audio.unlock(); $('desktop-help').classList.add('hidden');
});
renderer.xr.addEventListener('sessionend', () => {
  panels.setXR(false);
  desktop.setEnabled(true);
  if (state.current === STATES.TRIAL_1 || state.current === STATES.TRIAL_2) {
    state.transition(STATES.PAUSED); panels.show(STATES.PAUSED);
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (state.current === STATES.TRIAL_1 || state.current === STATES.TRIAL_2)) {
    state.transition(STATES.PAUSED); panels.show(STATES.PAUSED);
  }
});

const raycaster = new THREE.Raycaster();
const forward = new THREE.Vector3();
const tempTarget = new THREE.Vector3();
let lastTime = performance.now(), fpsFrames = 0, fpsTime = 0, fps = 0;
let popupTimer = 0, currentPopup = null;
function updateHud(meter, score, time) {
  const fill = $('meter-fill'); if (fill) fill.style.width = `${Math.max(0, meter)}%`;
  const scoreEl = $('score'); if (scoreEl) scoreEl.textContent = score;
  $('timer').textContent = Math.ceil(time);
}
function getXRPointer() {
  const tip = gestureTracker.primaryTip;
  if (!tip) return null;
  camera.getWorldDirection(forward);
  return { origin: tip, direction: forward };
}
function animate() {
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastTime) / 1000); lastTime = now;
  const inXR = renderer.xr.isPresenting;
  if (inXR) gestureTracker.update(hands);
  else desktop.update();

  const pointer = inXR ? getXRPointer() : null;
  if (state.current === STATES.TRIAL_1) {
    if (pointer && trial1.held) trial1.setTarget(pointer.origin.clone().addScaledVector(pointer.direction, 0.27));
    const desktopRay = !inXR && desktop.pinching ? desktop.ray : null;
    const desktopOrigin = desktopRay ? camera.getWorldPosition(tempTarget).clone() : null;
    const result = trial1.update(dt, desktopRay, pointer?.origin || desktopOrigin);
    if (result) {
      updateHud(result.focus, result.score, result.time);
      if (result.done) startTrial2();
    }
  } else if (state.current === STATES.TRIAL_2) {
    const palm = inXR ? gestureTracker.anyPalmOpen : desktop.palmOpen;
    const result = trial2.update(dt, palm);
    updateHud(result.gauge, result.caught, result.timeLeft);
    audio.setSlow(palm, scene);
    if (result.done) showResults();
  }
  particles.update(dt);
  if (currentPopup) {
    currentPopup.userData.life -= dt;
    currentPopup.scale.multiplyScalar(1 + dt * 0.35);
    if (currentPopup.userData.life <= 0) { scene.remove(currentPopup); currentPopup = null; }
  }
  fpsFrames++; fpsTime += dt;
  if (fpsTime >= 0.5) { fps = Math.round(fpsFrames / fpsTime); fpsFrames = 0; fpsTime = 0; }
  const handVisible = inXR ? gestureTracker.anyHandFound : true;
  const gesture = inXR ? (gestureTracker.anyPinching ? 'PINCH' : gestureTracker.anyPalmOpen ? 'OPEN PALM' : 'READY')
    : (desktop.pinching ? 'PINCH' : desktop.palmOpen ? 'OPEN PALM' : 'READY');
  $('gesture-label').textContent = inXR ? `HAND GESTURE: ${gesture}` : `DESKTOP: CLICK = PINCH · SPACE = OPEN PALM · ${gesture}`;
  $('debug').textContent = `FPS ${fps} · HAND ${handVisible ? 'YES' : 'NO'} · ${gesture}`;
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, GAME.maxPixelRatio));
});

// Optional GLBs automatically fall back to locally generated primitives.
addOptionalProp(scene, ASSET_PATHS.crystal, () => makeCrateFallback(COLORS.cyan),
  new THREE.Vector3(-0.48, GAME.deskHeight + 0.1, -0.36), 0.12).catch(() => {});
