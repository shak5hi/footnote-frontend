import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { init as initScene, resize as resizeScene } from './scene.js';
import { initScrollRig } from './scrollRig.js';

gsap.registerPlugin(ScrollTrigger);

// ── Mobile check: skip Three.js on small screens ──
const isMobile = window.innerWidth < 768;

if (!isMobile) {
  // ── Lenis smooth scroll ──
  const lenis = new Lenis({
    lerp: 0.08,
    smoothWheel: true,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // ── Lazy-load after LCP ──
  function startHero() {
    const canvas = document.getElementById('hero-vinyl-canvas');
    if (!canvas) return;

    initScene(canvas)
      .then(({ modelGroup }) => {
        initScrollRig(modelGroup);
        resizeScene();
      })
      .catch((err) => {
        console.error('Failed to initialize 3D hero:', err);
      });
  }

  // Wait for Largest Contentful Paint before loading heavy 3D assets
  if ('PerformanceObserver' in window) {
    let lcpFired = false;
    const observer = new PerformanceObserver((list) => {
      if (lcpFired) return;
      lcpFired = true;
      observer.disconnect();
      startHero();
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    // Fallback: if LCP doesn't fire within 3s, start anyway
    setTimeout(() => {
      if (!lcpFired) {
        lcpFired = true;
        observer.disconnect();
        startHero();
      }
    }, 3000);
  } else {
    // No PerformanceObserver, just start after a short delay
    window.addEventListener('load', () => {
      setTimeout(startHero, 300);
    });
  }
}
