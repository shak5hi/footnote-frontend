'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

useGLTF.preload('/models/vinly.glb');
useGLTF.preload('/models/tonearm.glb');

function VinylModel({ groupRef, vinylInnerRef, isBreathing }) {
  const { scene: gltfScene } = useGLTF('/models/vinly.glb');
  const breathRef = useRef();
  const { gl, scene } = useThree();

  useEffect(() => {
    if (!vinylInnerRef.current || !groupRef.current) return;

    // Start invisible — parent will reveal after positioning
    groupRef.current.visible = false;

    // Center the model on its own origin
    const box = new THREE.Box3().setFromObject(vinylInnerRef.current);
    const center = box.getCenter(new THREE.Vector3());
    vinylInnerRef.current.position.sub(center);

    // Initial rotation is now handled by GSAP in VinylHero

    // Scale so the vinyl dominates composition
    const fov = 12.5 * (Math.PI / 180); // Weak FOV for zero vertical/horizontal perspective distortion
    const distToCamera = 10;
    const visH = 2 * Math.tan(fov / 2) * distToCamera;
    const bounds = new THREE.Box3().setFromObject(groupRef.current);
    const dims = bounds.getSize(new THREE.Vector3());
    const maxDim = Math.max(dims.x, dims.y, dims.z);
    const targetSize = visH * 0.40; // ~40% of viewport height
    const s = maxDim > 0 ? targetSize / maxDim : 1;
    groupRef.current.scale.setScalar(s);
    groupRef.current.userData.baseScale = s;
    groupRef.current.userData.vinylRadius = targetSize; // World-space radius at baseScale

    // Rotate model to stand up and face the front camera perfectly (X-Y plane)
    vinylInnerRef.current.rotation.x = Math.PI / 2;

    // Premium material pass
    vinylInnerRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          if (m.envMapIntensity !== undefined) m.envMapIntensity = 2.2;
          m.needsUpdate = true;
        });
      }
    });

    // Studio HDR environment
    new RGBELoader().load(
      'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr',
      (hdr) => {
        const pmrem = new THREE.PMREMGenerator(gl);
        pmrem.compileEquirectangularShader();
        const envMap = pmrem.fromEquirectangular(hdr).texture;
        scene.environment = envMap;
        hdr.dispose();
        pmrem.dispose();
      }
    );
  }, [gl, scene, groupRef, vinylInnerRef]);

  useFrame((state) => {
    if (breathRef.current) {
      if (isBreathing.current) {
        // Very light, expensive, ambient Z-rotation drift and micro-movement (extremely subtle)
        const t = state.clock.elapsedTime * 0.3; 
        breathRef.current.position.x = Math.sin(t * 0.7) * 0.02; // very subtle horizontal drift (~±8px)
        breathRef.current.position.y = Math.cos(t * 1.1) * 0.01; // very subtle vertical drift (~±4px)
        breathRef.current.rotation.z = Math.sin(t * 0.8) * 0.04; // micro Z-rotation tilt (~±2.3°)
      } else {
        // Playing state in Section 2: slow, smooth, vertical warp wobble (no spinning)
        // Made wobble significantly more prominent and visible per user request
        const t = state.clock.elapsedTime * 2.2; 
        breathRef.current.position.x = THREE.MathUtils.lerp(breathRef.current.position.x, 0, 0.05);
        breathRef.current.position.y = Math.sin(t) * 0.045; // smooth slow up and down warp (±11px)
        breathRef.current.rotation.z = THREE.MathUtils.lerp(breathRef.current.rotation.z, 0, 0.05);
      }
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={breathRef}>
        <primitive ref={vinylInnerRef} object={gltfScene} />
      </group>
    </group>
  );
}

function TonearmModel({ tonearmRef, swayRef }) {
  const { scene: gltfScene } = useGLTF('/models/tonearm.glb');
  const innerRef = useRef();
  const { gl } = useThree();

  useEffect(() => {
    if (!innerRef.current || !tonearmRef.current) return;

    // Center geometry
    const box = new THREE.Box3().setFromObject(innerRef.current);
    const center = box.getCenter(new THREE.Vector3());
    innerRef.current.position.sub(center);

    // Offset inner mesh so the PIVOT END sits at the group origin.
    // This enables realistic arc-pivot rotation of the group.
    const bounds = new THREE.Box3().setFromObject(innerRef.current);
    const size = bounds.getSize(new THREE.Vector3());
    // Shift so one end (pivot) is at local origin
    innerRef.current.position.x += size.x * 0.48;

    // Scale: tonearm is ~1/3 of vinyl diameter — real-world proportion
    const fov = 12.5 * (Math.PI / 180); // Match vinyl FOV
    const dist = 10;
    const visH = 2 * Math.tan(fov / 2) * dist;
    const sizeAfter = new THREE.Box3().setFromObject(tonearmRef.current);
    const dims = sizeAfter.getSize(new THREE.Vector3());
    const maxDim = Math.max(dims.x, dims.y, dims.z);
    // Target: roughly 1/3 of (vinyl targetSize * 2) = 0.40 * visH * 2 / 3 ≈ 0.267 * visH
    const targetSize = visH * 0.27;
    const s = maxDim > 0 ? targetSize / maxDim : 1;
    tonearmRef.current.scale.setScalar(s);
    tonearmRef.current.userData.baseScale = s;

    // Rotate model to stand up and face the front camera perfectly (X-Y plane)
    // Reversed X flip and flipped on the Y-axis per layout guidelines
    innerRef.current.rotation.x = Math.PI / 2;
    innerRef.current.rotation.y = Math.PI;

    innerRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => {
          if (m.envMapIntensity !== undefined) m.envMapIntensity = 2.2;
          m.needsUpdate = true;
        });
      }
    });
  }, [gl, tonearmRef]);

  // Synchronized playing wobble and micro-stylus tracking
  useFrame((state) => {
    if (tonearmRef.current && swayRef.current) {
      const t = state.clock.elapsedTime * 2.2;
      // Synchronized vertical warp wobble (riding the record's wave with a phase lag)
      // and microscopic stylus vibration (speed 8) combined. Amplified for prominent visibility.
      tonearmRef.current.position.y =
        (tonearmRef.current.userData.restY || 0.70) +
        Math.sin(t - 0.15) * 0.040 + // record warp ride
        Math.sin(state.clock.elapsedTime * 8) * 0.0006; // micro groove vibration
    }
  });

  return (
    <group ref={tonearmRef}>
      <primitive ref={innerRef} object={gltfScene} />
    </group>
  );
}

export default function VinylScene({ groupRef, tonearmRef, vinylInnerRef, swayRef, isBreathing }) {
  return (
    <Canvas
      gl={{
        antialias: true,
        alpha: true,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.35,
      }}
      dpr={[1, 2]}
      // Camera perfectly centered and pointing straight along the Z axis (Y=0, X=0)
      // Weak FOV (12.5) at position [0, 0, 10] matches the visual size exactly
      // but reduces perspective distortion to practically zero, keeping the vinyl a perfect circle.
      camera={{ position: [0, 0, 10], fov: 12.5, near: 0.1, far: 100 }}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      {/* Studio lighting — from above-right, mimics a light box setup */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 10, 4]} intensity={2.2} />
      <directionalLight position={[-4, 8, -2]} color="#ddeeff" intensity={0.9} />
      <directionalLight position={[0, 12, 0]} intensity={1.0} />
      <pointLight position={[2, 5, 3]} intensity={0.5} color="#fff9f0" />

      <VinylModel groupRef={groupRef} vinylInnerRef={vinylInnerRef} isBreathing={isBreathing} />
      <TonearmModel tonearmRef={tonearmRef} swayRef={swayRef} />
    </Canvas>
  );
}
