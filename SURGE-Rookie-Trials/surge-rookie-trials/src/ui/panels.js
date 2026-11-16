import * as THREE from 'three';
import { COLORS, GAME } from '../config.js';

const $ = id => document.getElementById(id);

export function createPanels(stateMachine, callbacks, camera) {
  const overlay = $('screen-overlay'), title = $('panel-title'), subtitle = $('panel-subtitle');
  const content = $('panel-content'), actions = $('panel-actions');

  // A camera-anchored plane is fixed 0.8 m ahead: it stays in the seated play area.
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 768;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const worldGroup = new THREE.Group();
  worldGroup.position.set(0, GAME.panelYOffset, -GAME.panelDistance);
  camera.add(worldGroup);
  const panelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.585),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
  );
  worldGroup.add(panelMesh);
  worldGroup.visible = false;
  const worldRaycaster = new THREE.Raycaster();
  let worldState = 'START';
  let worldActions = [];

  function drawWorld(state, data = {}) {
    worldState = state;
    worldActions = [];
    ctx.clearRect(0, 0, 1024, 768);
    ctx.fillStyle = COLORS.panel; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.roundRect(14, 14, 996, 740, 48); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    for (let y = 40; y < 750; y += 34) for (let x = 35; x < 1000; x += 34) {
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
    }
    const text = (value, y, size, color = COLORS.paper, font = '900') => {
      ctx.fillStyle = color; ctx.font = `${font} ${size}px system-ui, sans-serif`;
      ctx.textAlign = 'center'; ctx.fillText(value, 512, y);
    };
    const btn = (label, x, y, width, callback) => {
      ctx.fillStyle = COLORS.magenta; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.roundRect(x, y, width, 112, 24); ctx.fill(); ctx.stroke();
      ctx.fillStyle = COLORS.paper; ctx.font = '900 42px Impact, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label, x + width / 2, y + 69);
      worldActions.push({ x, y, width, height: 112, callback });
    };
    text('ROOKIE HERO ACADEMY', 105, 30, COLORS.cyan);
    if (state === 'START') {
      text('SURGE', 290, 150, COLORS.yellow, '1000');
      text('ROOKIE TRIALS', 370, 64, COLORS.cyan);
      text('Sit back. Everything happens within arm’s reach.', 475, 30);
      text('Pinch to grab · Open palm to slow time', 530, 27, COLORS.cyan);
      btn('PINCH TO BEGIN', 242, 590, 540, callbacks.startTutorial);
    } else if (state === 'TUTORIAL') {
      text('TWO POWERS', 240, 78, COLORS.yellow);
      text('PINCH = GRAB', 360, 48, COLORS.cyan);
      text('Pinch thumb and index finger to lift objects.', 415, 27);
      text('OPEN PALM = SLOW TIME', 490, 44, COLORS.cyan);
      text('Spread all four fingers to slow falling objects.', 540, 26);
      btn('START TRIAL 1', 242, 610, 540, callbacks.startTrial1);
    } else if (state === 'PAUSED') {
      text('SHOW YOUR HANDS', 300, 76, COLORS.yellow);
      text('Training paused. Bring your hands back to continue.', 400, 28);
      btn('RESTART', 340, 590, 340, callbacks.restart);
    } else if (state === 'RESULTS') {
      text('HERO RANK', 190, 66, COLORS.cyan);
      text('ROOKIE', 330, 120, COLORS.yellow, '1000');
      const stars = Math.max(1, Math.min(3, Math.ceil(((data.score1 || 0) / 60 + (data.caught || 0) / 8) / 2)));
      text('★ '.repeat(stars).trim(), 415, 72, COLORS.yellow);
      text('MASS AND FORCE', 495, 31, COLORS.cyan);
      text('Heavier things need more force to lift.', 535, 24);
      text('SPEED AND REACTION', 585, 29, COLORS.cyan);
      text('Slowing time gives you more time to react.', 620, 22);
      btn('PLAY AGAIN', 90, 660, 390, callbacks.playAgain);
      btn('RESTART', 544, 660, 390, callbacks.restart);
    }
    texture.needsUpdate = true;
  }

  function button(label, fn, alt = false) {
    const el = document.createElement('button');
    el.className = `game-button${alt ? ' alt' : ''}`;
    el.textContent = label; el.addEventListener('click', fn); actions.appendChild(el);
  }
  function show(state, data = {}) {
    overlay.classList.remove('hidden');
    actions.replaceChildren(); content.replaceChildren();
    const addText = (value, className = 'body-copy') => {
      const p = document.createElement('p'); p.className = className; p.textContent = value; content.appendChild(p);
    };
    if (state === 'START') {
      title.textContent = 'SURGE'; subtitle.textContent = 'ROOKIE TRIALS';
      addText('Sit back. Everything happens within arm’s reach.');
      addText('Pinch to grab. Open your palm to slow time.', 'hint-copy');
      button('PINCH TO BEGIN', callbacks.startTutorial);
    } else if (state === 'TUTORIAL') {
      title.textContent = 'TWO POWERS'; subtitle.textContent = 'YOUR TRAINING STARTS NOW';
      addText('PINCH = GRAB', 'feature-title'); addText('Pinch thumb and index finger to lift objects.');
      addText('OPEN PALM = SLOW TIME', 'feature-title'); addText('Spread all four fingers to slow falling objects.');
      button('START TRIAL 1', callbacks.startTrial1, true);
    } else if (state === 'PAUSED') {
      title.textContent = 'SHOW YOUR HANDS'; subtitle.textContent = 'TRAINING PAUSED';
      addText('Hold your hands in front of you to continue.');
      button('RESTART', callbacks.restart);
    } else if (state === 'RESULTS') {
      title.textContent = 'HERO RANK'; subtitle.textContent = 'ROOKIE';
      const stars = Math.max(1, Math.min(3, Math.ceil(((data.score1 || 0) / 60 + (data.caught || 0) / 8) / 2)));
      addText('★ '.repeat(stars).trim(), 'stars');
      addText(`TELEKINESIS SCORE: ${data.score1 || 0} · ORBS CAUGHT: ${data.caught || 0}`, 'hint-copy');
      addText('MASS AND FORCE', 'feature-title'); addText('Heavier things need more force to lift.');
      addText('SPEED AND REACTION', 'feature-title'); addText('Slowing time gives you more time to react.');
      button('PLAY AGAIN', callbacks.playAgain, true); button('RESTART', callbacks.restart);
    }
    drawWorld(state, data);
    worldGroup.visible = true;
  }
  function hide() { overlay.classList.add('hidden'); worldGroup.visible = false; }
  function setXR(active) {
    overlay.classList.toggle('hidden', active);
    if (active && worldState) worldGroup.visible = true;
    if (!active) worldGroup.visible = false;
  }
  function activate(ray) {
    if (!worldGroup.visible || !ray) return false;
    worldGroup.updateMatrixWorld(true);
    worldRaycaster.set(ray.origin, ray.direction);
    const hit = worldRaycaster.intersectObject(panelMesh, false)[0];
    if (!hit) return false;
    const uv = hit.uv;
    const x = uv.x * canvas.width, y = (1 - uv.y) * canvas.height;
    const target = worldActions.find(a => x >= a.x && x <= a.x + a.width && y >= a.y && y <= a.y + a.height);
    if (target) { target.callback(); return true; }
    return false;
  }
  return { show, hide, setXR, activate, overlay };
}