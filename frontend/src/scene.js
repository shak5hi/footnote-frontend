import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

let scene, camera, renderer, modelGroup;
let animationId = null;
let isHidden = false;

/**
 * Initialize the Three.js scene inside the given canvas.
 */
export async function init(canvas) {
  // ── Renderer ──
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  resize();

  // ── Scene ──
  scene = new THREE.Scene();
  scene.background = null;

  // ── Camera ──
  camera = new THREE.PerspectiveCamera(35, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  // ── Lights ──
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
  keyLight.position.set(3, 4, 3);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xb0c8e8, 1.0);
  rimLight.position.set(-3, 1, -4);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
  fillLight.position.set(0, 2, 5);
  scene.add(fillLight);

  const bottomLight = new THREE.DirectionalLight(0xffffff, 0.4);
  bottomLight.position.set(0, -3, 2);
  scene.add(bottomLight);

  // ── HDR Environment Map ──
  try {
    const hdrTexture = await new Promise((resolve, reject) => {
      new RGBELoader().load(
        'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr',
        resolve,
        undefined,
        reject
      );
    });
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
    scene.environment = envMap;
    hdrTexture.dispose();
    pmremGenerator.dispose();
  } catch (e) {
    console.warn('HDR env map failed, continuing:', e);
  }

  // ── GLB Model ──
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  const gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  const gltf = await new Promise((resolve, reject) => {
    gltfLoader.load('/models/cdfinal.glb', resolve, undefined, reject);
  });

  // Parent group for all transforms
  modelGroup = new THREE.Group();

  // Center the model geometry
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const center = box.getCenter(new THREE.Vector3());
  gltf.scene.position.sub(center);
  
  // ── FIX ORIENTATION ──
  // Vinyl records from Blender are typically flat on the XZ plane (Y-up).
  // We need to rotate so the face of the disc points toward the camera (Z axis).
  // Tilt it ~70 degrees so we see the face with a slight perspective angle.
  gltf.scene.rotation.x = -Math.PI / 2.5; // ~72 degrees tilt toward camera
  
  modelGroup.add(gltf.scene);

  // ── SCALE — make it BIG, fill ~70% of viewport height ──
  const sizeAfterRotation = new THREE.Box3().setFromObject(modelGroup);
  const dims = sizeAfterRotation.getSize(new THREE.Vector3());
  const maxDim = Math.max(dims.x, dims.y, dims.z);
  const fovRad = (camera.fov * Math.PI) / 180;
  const visibleHeight = 2 * Math.tan(fovRad / 2) * camera.position.z;
  const desiredSize = visibleHeight * 0.5; // 50% of viewport height (reduced size)
  const scale = desiredSize / maxDim;
  modelGroup.scale.setScalar(scale);
  modelGroup.userData.targetScale = scale;

  // Fix materials — preserve Blender export, just boost env reflections
  gltf.scene.traverse((child) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((mat) => {
        if (mat.envMapIntensity !== undefined) {
          mat.envMapIntensity = 1.5;
        }
        mat.needsUpdate = true;
      });
    }
  });

  scene.add(modelGroup);

  // ── Visibility Pause ──
  document.addEventListener('visibilitychange', () => {
    isHidden = document.hidden;
    if (!isHidden && !animationId) animate();
  });

  // ── Resize ──
  window.addEventListener('resize', resize);

  // ── Start render loop ──
  animate();

  return { scene, camera, renderer, modelGroup };
}

function animate() {
  if (isHidden) { animationId = null; return; }
  animationId = requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

export function resize() {
  if (!renderer) return;
  const canvas = renderer.domElement;
  const wrap = canvas.parentElement;
  if (!wrap) return;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  renderer.setSize(w, h);
  if (camera) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

export { scene, camera, renderer, modelGroup };
