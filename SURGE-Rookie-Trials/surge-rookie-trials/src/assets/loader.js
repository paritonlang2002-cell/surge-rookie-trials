import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { toonMaterial, addOutline } from '../fx/comicStyle.js';
import { COLORS } from '../config.js';

const loader = new GLTFLoader();

export async function loadOptionalModel(path, fallbackFactory, targetHeight = 0.15) {
  try {
    const gltf = await loader.loadAsync(`/${path}`);
    const model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3(); bounds.getSize(size);
    const largest = Math.max(size.x, size.y, size.z) || 1;
    model.scale.multiplyScalar(targetHeight / largest);
    model.traverse(child => {
      if (child.isMesh) {
        child.castShadow = false; child.receiveShadow = false;
        if (child.material?.isMeshStandardMaterial) {
          child.material = toonMaterial(child.material.color || COLORS.cyan);
        }
      }
    });
    return model;
  } catch {
    return fallbackFactory();
  }
}

export function makeCrateFallback(color = COLORS.crate) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), toonMaterial(color));
  addOutline(mesh);
  return mesh;
}

export async function addOptionalProp(scene, path, fallbackFactory, position, targetHeight) {
  const model = await loadOptionalModel(path, fallbackFactory, targetHeight);
  model.position.copy(position); scene.add(model); return model;
}