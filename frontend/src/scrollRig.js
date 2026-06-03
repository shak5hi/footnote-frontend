import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let floatTween = null;

export function initScrollRig(modelGroup) {
  const targetScale = modelGroup.userData.targetScale || 1;
  
  // Set initial state for the model
  // Start it slightly higher up so it "comes down" while rotating
  gsap.set(modelGroup.position, {
    x: 0,
    y: 1.5, // Starts higher up
    z: 0
  });
  
  gsap.set(modelGroup.rotation, {
    x: 0,
    y: 0,
    z: 0
  });
  
  gsap.set(modelGroup.scale, {
    x: targetScale,
    y: targetScale,
    z: targetScale
  });

  // Pin the canvas wrapper so it stays fixed to the screen
  // while the text sections underneath scroll naturally up.
  ScrollTrigger.create({
    trigger: '#hero-scroll-track',
    start: 'top top',
    end: 'bottom bottom',
    pin: '#hero-canvas-wrap',
    pinSpacing: false // The sections provide the height naturally
  });

  // Create a timeline that scrubs smoothly with scroll
  // over the entire height of the scroll track (Section 1 + Blank Section)
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero-scroll-track',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5, // Smooth scrubbing
      onUpdate: (self) => {
        const p = self.progress;
        // Handle the idle float logic at the very end
        if (p >= 0.98 && !floatTween) {
          startFloat(modelGroup);
        } else if (p < 0.95 && floatTween) {
          stopFloat(modelGroup);
        }
      }
    }
  });

  // Animate the vinyl: come down, move left, and rotate simultaneously
  tl.to(modelGroup.position, {
    y: 0,           // Comes down to center
    x: -2.5,        // Moves to the left
    ease: 'power2.inOut',
    duration: 1
  }, 0)
  .to(modelGroup.rotation, {
    y: Math.PI * 2, // Full 360 degree spin
    x: 0.15,        // Slight tilt at the end
    ease: 'power2.inOut',
    duration: 1
  }, 0);
}

function startFloat(modelGroup) {
  if (floatTween) return;
  floatTween = gsap.to(modelGroup.position, {
    y: 0.08,
    yoyo: true,
    repeat: -1,
    duration: 2.2,
    ease: 'sine.inOut',
  });
}

function stopFloat(modelGroup) {
  if (!floatTween) return;
  floatTween.kill();
  floatTween = null;
  gsap.to(modelGroup.position, { y: 0, duration: 0.5, ease: 'power2.out' });
}
