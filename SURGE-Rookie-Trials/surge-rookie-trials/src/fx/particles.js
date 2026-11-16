import * as THREE from 'three';
import { COLORS, GAME } from '../config.js';

export function createParticles(scene) {
  const count = GAME.particleCap;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const life = new Float32Array(count);
  for (let i = 0; i < count; i++) life[i] = -1;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLORS.cyan, size: 0.012, transparent: true,
    opacity: 0.9, depthWrite: false, sizeAttenuation: true
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);
  let cursor = 0;

  function burst(position, amount = 16, color = COLORS.cyan) {
    material.color.set(color);
    for (let n = 0; n < amount; n++) {
      const i = cursor++ % count, p = i * 3;
      positions[p] = position.x; positions[p + 1] = position.y; positions[p + 2] = position.z;
      velocities[p] = (Math.random() - 0.5) * 0.8;
      velocities[p + 1] = Math.random() * 0.8;
      velocities[p + 2] = (Math.random() - 0.5) * 0.8;
      life[i] = 0.55 + Math.random() * 0.55;
    }
    geometry.attributes.position.needsUpdate = true;
  }
  function update(dt) {
    for (let i = 0; i < count; i++) {
      if (life[i] <= 0) continue;
      const p = i * 3;
      positions[p] += velocities[p] * dt;
      positions[p + 1] += velocities[p + 1] * dt;
      positions[p + 2] += velocities[p + 2] * dt;
      velocities[p + 1] -= 1.1 * dt;
      life[i] -= dt;
      if (life[i] <= 0) positions[p + 1] = -10;
    }
    geometry.attributes.position.needsUpdate = true;
  }
  return { burst, update, points };
}