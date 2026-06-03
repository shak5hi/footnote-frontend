// Curtain Logic
const curtain = document.getElementById('fn-curtain');
const page = document.getElementById('fn-page');

function liftCurtain() {
  if (!curtain || curtain.classList.contains('is-lifting')) return;
  curtain.classList.add('is-lifting');
  if (page) page.classList.add('is-revealed');

  setTimeout(() => {
    curtain.classList.add('is-gone');
    document.body.style.overflow = '';
  }, 2000);

}

if (curtain) {
  curtain.addEventListener('click', liftCurtain);
  const autoLift = setTimeout(liftCurtain, 6000);
  curtain.addEventListener('click', () => clearTimeout(autoLift), { once: true });
  document.body.style.overflow = 'hidden';
}


    document.addEventListener('DOMContentLoaded', () => {
      // Nav fade on scroll
      const nav = document.querySelector('.nav');
      window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      });

      // Complex Pull Quote Animation (Split words)
      const pullQuote = document.getElementById('pull-quote');
      if (pullQuote) {
        // preserve line breaks
        const htmlLines = pullQuote.innerHTML.split(/<br\s*\/?>/gi);
        let newHtml = '';
        htmlLines.forEach((line, i) => {
          const words = line.trim().split(' ');
          words.forEach(word => {
            if (word.length > 0) {
              newHtml += `<span>${word}</span> `;
            }
          });
          if (i < htmlLines.length - 1) {
            newHtml += '<br>';
          }
        });
        pullQuote.innerHTML = newHtml;
      }

      // (Editorial carousel removed — replaced by 3D vinyl hero)
      // (Hero scroll animation removed — replaced by GSAP ScrollTrigger in heroMain.js)

      // Intersection Observer
      const observerOptions = {
        rootMargin: '0px',
        threshold: 0.12
      };

      let quoteAnimated = false;

      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);

            if (entry.target.classList.contains('observer-trigger') && !quoteAnimated) {
              quoteAnimated = true;
              const spans = entry.target.querySelectorAll('.pull-quote span');
              spans.forEach((span, i) => {
                setTimeout(() => {
                  span.style.opacity = '1';
                }, i * 30);
              });
            }
          }
        });
      }, observerOptions);

      document.querySelectorAll('.anim-fade-up, .anim-slide-left, .anim-slide-right, .anim-scale, .observer-trigger').forEach(el => {
        observer.observe(el);
      });

      // Cinematic Scroll Logic
      const cScroll = document.getElementById('cinematic-interlude');
      const cImg = document.querySelector('.cinematic-img');
      const cTexts = document.querySelectorAll('.cinematic-text');

      if (cScroll && cImg && cTexts.length > 0) {
        window.addEventListener('scroll', () => {
          const rect = cScroll.getBoundingClientRect();
          const maxScroll = cScroll.scrollHeight - window.innerHeight;

          if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
            const progress = Math.min(1, Math.max(0, Math.abs(rect.top) / maxScroll));
            
            // Image subtle zoom
            const scale = 1.05 - (progress * 0.05);
            cImg.style.transform = `scale(${scale})`;

            // Text Stage sequence logic
            cTexts.forEach((text, index) => {
              let fade = 0;
              let y = 20;

              if (index === 0) {
                // Line 0: "You don't just read here—" (Stage 1)
                if (progress < 0.05) { fade = progress / 0.05; y = 20 * (1 - fade); }
                else if (progress <= 0.25) { fade = 1; y = 0; }
                else if (progress <= 0.35) { fade = 1 - ((progress - 0.25) / 0.10); y = -20 * ((progress - 0.25) / 0.10); }
                else { fade = 0; y = -20; }
              } 
              else if (index === 1) {
                // Line 1: "you listen." (Stage 2)
                if (progress < 0.30) { fade = 0; y = 20; }
                else if (progress <= 0.40) { fade = (progress - 0.30) / 0.10; y = 20 * (1 - fade); }
                else if (progress <= 0.65) { fade = 1; y = 0; }
                else if (progress <= 0.80) { 
                  // Softens to 0.6
                  const t = (progress - 0.65) / 0.15;
                  fade = 1 - (t * 0.4); // 1.0 down to 0.6
                  y = 0; 
                }
                else { fade = 0.6; y = 0; } // holds until section exits
              }
              else if (index === 2) {
                // Line 2: "Enter the Frequency" (Stage 3)
                // Appears below line 1 (no need to translate line 1 up, just fade this in)
                if (progress < 0.70) { fade = 0; y = 20; }
                else if (progress <= 0.85) { fade = (progress - 0.70) / 0.15; y = 20 * (1 - fade); }
                else { fade = 1; y = 0; }
              }

              text.style.opacity = fade.toString();
              text.style.transform = `translateY(${y}px)`;
            });
          } else if (rect.top > 0) {
            // Above the section
            cImg.style.transform = 'scale(1.05)';
            cTexts.forEach(t => { t.style.opacity = '0'; t.style.transform = 'translateY(30px)'; });
          } else {
            // Below the section
            cImg.style.transform = 'scale(1.0)';
            cTexts.forEach(t => { t.style.opacity = '0'; t.style.transform = 'translateY(-30px)'; });
          }
        }, { passive: true });
      }
    });
