import * as THREE from 'three';
import { COLORS, GAME } from '../config.js';
import { toonMaterial, addOutline } from '../fx/comicStyle.js';

export function createTrial2(scene, audio, particles) {
  const group = new THREE.Group(); scene.add(group);
  const geometry = new THREE.SphereGeometry(0.035, 12, 10);
  const material = toonMaterial(COLORS.yellow);
  const orbs = [];
  let spawnTimer = 0, timeLeft = GAME.trial2Seconds, timeScale = 1, gauge = 100, caught = 0, finished = false;
  const raycaster = new THREE.Raycaster();

  function spawn() {
    const orb = new THREE.Mesh(geometry, material);
    orb.position.set((Math.random() - 0.5) * 0.65, GAME.deskHeight + 0.43 + Math.random() * 0.08, -0.36);
    orb.userData.velocity = new THREE.Vector3((Math.random() - 0.5) * 0.08, -0.1, 0);
    addOutline(orb); group.add(orb); orbs.push(orb);
  }
  function catchAt(point, ray) {
    if (finished) return;
    let target = null, best = 0.11;
    if (point) {
      orbs.forEach(orb => { const d = orb.position.distanceTo(point); if (d < best) { best = d; target = orb; } });
    } else if (ray) {
      raycaster.copy(ray);
      const hit = raycaster.intersectObjects(orbs, false)[0];
      if (hit && hit.distance < 0.65) target = hit.object;
    }
    if (target) {
      target.visible = false; caught++; audio.play('success', target);
      particles.burst(target.position, 14, COLORS.yellow);
    }
  }
  function update(dt, palmOpen) {
    if (finished) return;
    timeLeft = Math.max(0, timeLeft - dt);
    const targetScale = palmOpen && gauge > 0 ? GAME.slowTimeScale : GAME.normalTimeScale;
    timeScale += (targetScale - timeScale) * Math.min(1, dt * 6);
    gauge = Math.max(0, Math.min(100, gauge + (palmOpen && gauge > 0 ? -GAME.timeDrainPerSecond : GAME.timeRecoverPerSecond) * dt));
    spawnTimer -= dt;
    if (spawnTimer <= 0 && orbs.filter(o => o.visible).length < 9) { spawn(); spawnTimer = 0.72; }
    // Time scaling is deliberately applied only to the falling objects.
    const objectDt = dt * timeScale;
    for (const orb of orbs) {
      if (!orb.visible) continue;
      orb.userData.velocity.y -= GAME.gravity * objectDt;
      orb.position.addScaledVector(orb.userData.velocity, objectDt);
      if (orb.position.y < GAME.deskHeight + 0.025) orb.visible = false;
    }
    if (timeLeft <= 0) finished = true;
    return { timeLeft, timeScale, gauge, caught, done: finished };
  }
  function reset() {
    orbs.forEach(o => group.remove(o)); orbs.length = 0;
    spawnTimer = 0; timeLeft = GAME.trial2Seconds; timeScale = 1; gauge = 100; caught = 0; finished = false;
  }
  return { group, update, catchAt, reset, get caught() { return caught; }, get timeScale() { return timeScale; } };
}