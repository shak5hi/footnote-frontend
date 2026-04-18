/**
 * pages.js — Shared script for all FootNote inner pages
 */

// ── Custom Cursor ──────────────────────────────────────────────
const dot  = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');

if (dot && ring) {
  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px)`;
  });

  (function loop() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('.has-hover, a, button, input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.classList.add('hovered');
      dot.classList.add('hovered');
    });
    el.addEventListener('mouseleave', () => {
      ring.classList.remove('hovered');
      dot.classList.remove('hovered');
    });
  });
}

// ── Staggered reveal on load ───────────────────────────────────
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('.reveal-item').forEach(el => el.classList.add('is-visible'));
  }, 80);
});

// ── Theme Toggle ───────────────────────────────────────────────
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  const saved = localStorage.getItem('fn-theme');
  if (saved === 'deep') {
    document.body.classList.add('deep-mode');
    themeToggle.textContent = 'light';
  } else {
    themeToggle.textContent = 'deep';
  }

  themeToggle.addEventListener('click', () => {
    const isDeep = document.body.classList.toggle('deep-mode');
    themeToggle.textContent = isDeep ? 'light' : 'deep';
    localStorage.setItem('fn-theme', isDeep ? 'deep' : 'light');
  });
}
