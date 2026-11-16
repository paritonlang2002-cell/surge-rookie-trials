import * as THREE from 'three';
import { COLORS, GAME } from '../config.js';

let gradientTexture;
export function getGradientTexture() {
  if (gradientTexture) return gradientTexture;
  const data = new Uint8Array([70,70,70,255, 160,160,160,255, 255,255,255,255]);
  gradientTexture = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradientTexture.magFilter = THREE.NearestFilter;
  gradientTexture.minFilter = THREE.NearestFilter;
  gradientTexture.generateMipmaps = false;
  gradientTexture.needsUpdate = true;
  return gradientTexture;
}

export function toonMaterial(color, extra = {}) {
  return new THREE.MeshToonMaterial({
    color, gradientMap: getGradientTexture(), ...extra
  });
}

export function addOutline(mesh, color = COLORS.ink) {
  const outline = new THREE.Mesh(
    mesh.geometry,
    new THREE.MeshBasicMaterial({ color, side: THREE.BackSide })
  );
  outline.scale.setScalar(GAME.outlineScale);
  outline.name = 'comic-outline';
  mesh.add(outline);
  return outline;
}

export function makePopSprite(label, color = COLORS.yellow) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 192;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 192);
  ctx.save();
  ctx.translate(256, 96); ctx.rotate(-0.07);
  ctx.fillStyle = color; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.ellipse(0, 0, 220, 72, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COLORS.ink; ctx.font = 'bold 64px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 3);
  ctx.restore();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(0.42, 0.16, 1);
  sprite.userData.life = 0;
  return sprite;
}

export function showPopup(scene, label, position, color) {
  const sprite = makePopSprite(label, color);
  sprite.position.copy(position);
  sprite.userData.life = 1.05;
  scene.add(sprite);
  return sprite;
}