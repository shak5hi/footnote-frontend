'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function useVinylScrollRig(groupRef, scrollTrackRef, nextContentRef) {
  useEffect(() => {
    const checkReady = setInterval(() => {
      if (groupRef.current && groupRef.current.userData.baseScale) {
        clearInterval(checkReady);
        buildVinylTimeline(groupRef, scrollTrackRef, nextContentRef);
      }
    }, 50);
    return () => clearInterval(checkReady);
  }, [groupRef, scrollTrackRef, nextContentRef]);
}

export function buildVinylTimeline(groupRef, scrollTrackRef, nextContentRef) {
  if (!groupRef.current || !scrollTrackRef.current) return;

  const group = groupRef.current;
  const base = group.userData.baseScale;

  // ── Page load entrance: vinyl drops from above ──
  group.position.set(0, 9, 0);
  group.rotation.set(0, 0, 0);
  group.scale.setScalar(base);

  gsap.to(group.position, {
    y: 0,
    duration: 2.4,
    ease: 'power3.out',
    delay: 0.3,
  });

  // ── Main Scroll Timeline (450vh track) ──
  // Phase boundaries:
  //   0.00 → 0.38 : Hero section visible   → vinyl STRAIGHT DOWN + spin only
  //   0.38 → 0.82 : Hero scrolling away    → vinyl sweeps LEFT + grows
  //   0.82 → 1.00 : Settled on left        → slow spin, next content visible

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: scrollTrackRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 2.2,
    },
  });

  // ── PHASE 1 (0 → 0.38): STRAIGHT DOWN, no horizontal movement ──
  tl.to(group.position, {
    y: -0.3,   // Barely moves — settles gently into center
    x: 0,      // ← LOCKED: no left/right movement here
    ease: 'power1.inOut',
    duration: 0.38,
  }, 0);

  tl.to(group.rotation, {
    y: Math.PI * 1.2,
    ease: 'none',
    duration: 0.38,
  }, 0);

  // ── PHASE 2 (0.38 → 0.82): SWEEP LEFT + GROW ──
  // Final x/y position aligns vinyl with 'Enter the Frequency' heading:
  // - x: -2.0 keeps ~60% of the vinyl visible on the left
  // - y: 0.15 aligns with the vertically-centered heading on the right
  tl.to(group.position, {
    x: -2.0,   // Left side — vinyl rests here
    y: 0.15,   // Vertically aligned with the 'Enter the Frequency' heading
    ease: 'power2.inOut',
    duration: 0.44,
  }, 0.38);

  // Continues spinning during sweep
  tl.to(group.rotation, {
    y: Math.PI * 3.8,
    ease: 'none',
    duration: 0.44,
  }, 0.38);

  // Grows 42% bigger as it becomes the side anchor element
  tl.to(group.scale, {
    x: base * 1.42,
    y: base * 1.42,
    z: base * 1.42,
    ease: 'power2.inOut',
    duration: 0.44,
  }, 0.38);

  // ── PHASE 3 (0.82 → 1.0): Settled ──
  // Slow the spin, stay put
  tl.to(group.rotation, {
    y: Math.PI * 4.3,
    ease: 'power3.out',
    duration: 0.18,
  }, 0.82);

  // ── Fade in next section content in sync with Phase 2 ──
  if (nextContentRef?.current) {
    tl.to(
      nextContentRef.current,
      {
        opacity: 1,
        ease: 'power2.out',
        duration: 0.30,
      },
      0.52  // Starts fading in halfway through Phase 2
    );
  }

  return tl;
}
