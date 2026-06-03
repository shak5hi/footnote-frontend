'use client';

import { useRef, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './VinylHero.module.css';

gsap.registerPlugin(ScrollTrigger);

const VinylScene = dynamic(() => import('./VinylScene'), { ssr: false });

export default function VinylHero() {
  const groupRef    = useRef(null);
  const vinylInnerRef = useRef(null); // Reference to the actual mesh for spinning
  const tonearmRef  = useRef(null);
  const heroTextRef = useRef(null);
  const nextTextRef = useRef(null);
  const coverRef = useRef(null);
  const manifestoRef = useRef(null);
  const section2Ref = useRef(null);
  const articlesTrackRef = useRef(null);
  const containerRef = useRef(null);
  const stickyTrackRef = useRef(null);
  const timelineBuilt = useRef(false);

  // Controls for VinylScene useFrame loops
  const isBreathing = useRef(true); // Enabled subtle ambient floating/breathing per layout guidelines
  const swayRef = useRef(false);  // Tonearm tracking starts when settled

  useEffect(() => {
    // Elegant intersection observer to trigger high-end slow print fade-in animations on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.isVisible);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -80px 0px' } // Pre-triggers slightly before coming fully into view
    );

    const animatedElements = document.querySelectorAll(
      `.${styles.animFadeUp}, .${styles.animSlideRight}`
    );
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (
        groupRef.current &&
        groupRef.current.userData.baseScale &&
        tonearmRef.current &&
        tonearmRef.current.userData.baseScale &&
        coverRef.current &&
        stickyTrackRef.current &&
        !timelineBuilt.current
      ) {
        timelineBuilt.current = true;
        clearInterval(id);

        const group   = groupRef.current;
        const tonearm = tonearmRef.current;
        const base    = group.userData.baseScale;
        const tBase   = tonearm.userData.baseScale;

        // ── SECTION 3 DYNAMIC ALIGNMENT ──
        // Read the DOM bounds of the HTML cover element to align the Three.js scene dynamically
        const coverRect = coverRef.current.getBoundingClientRect();
        
        // Calculate Three.js viewport dimensions at Z=0
        const fov = 12.5; // Matches R3F Canvas camera fov
        const dist = 10;  // Matches R3F Canvas camera distance
        const visH = 2 * Math.tan((fov / 2) * Math.PI / 180) * dist; // Viewport height in Three.js units (2.1904)
        const visW = visH * (window.innerWidth / window.innerHeight);

        // Map cover center from screen pixels to Three.js coordinates
        const coverCenterX = coverRect.left + coverRect.width / 2;
        const coverCenterY = coverRect.top + coverRect.height / 2;
        
        const coverX = (coverCenterX / window.innerWidth - 0.5) * visW;
        const coverY = -(coverCenterY / window.innerHeight - 0.5) * visH;

        // Convert cover dimensions and margins from screen pixels to Three.js units.
        const coverRadiusPx = coverRect.height / 2;
        const targetVinylRadiusPx = Math.max(coverRadiusPx - 15, 40); // 15px smaller in radius than cover
        const targetVinylRadius = (targetVinylRadiusPx / window.innerHeight) * visH;

        // Base vinyl model's actual radius at baseScale is (visH * 0.20) because the model's base targetSize (visH * 0.40) is the diameter.
        const targetVinylScale = targetVinylRadius / (visH * 0.20);

        // Shift vinyl center so that 40% of its diameter is exposed on the left side of the cover.
        const coverLeftX = (coverRect.left / window.innerWidth - 0.5) * visW;
        const targetVinylX = coverLeftX + 0.20 * targetVinylRadius;
        const targetVinylY = coverY;

        // ── 1. INITIAL POSITIONS ──
        
        // Vinyl starts on the right of the Hero Section
        group.position.set(1.2, -0.1, 0); 
        group.rotation.set(0, 0, Math.PI / 2); // Base rotation rotated 90 degrees (Math.PI / 2), 100% circle
        group.scale.setScalar(base * 1.05); 
        group.visible = true;

        // Tonearm starts off-screen left
        tonearm.position.set(-5, 0.70, 0.5); 
        tonearm.rotation.set(0, 0, 0.4); // Swung out
        tonearm.scale.setScalar(tBase * 2.2); 
        tonearm.visible = true;

        // ── 2. ON-LOAD ANIMATION ──
        
        // Vinyl drops into the hero layout
        gsap.from(group.position, {
          y: 5, // Drops from above
          duration: 2.5,
          ease: 'power2.inOut',
          delay: 0.2,
        });

        // ── 3. SCROLL TIMELINE ──
        // Binds ScrollTrigger exclusively to the 700vh sticky track so height is correct
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stickyTrackRef.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 2.0, // Smooth scrub
            onUpdate: (self) => {
              if (self.progress >= 0.28 && self.progress <= 0.76) {
                // Section 2 Playing State
                isBreathing.current = false;
                swayRef.current = true;
                if (!tonearm.userData.restY) {
                  tonearm.userData.restY = tonearm.position.y;
                }
              } else {
                // Subtle breathing continues in Section 1, Section 3, and transitions
                isBreathing.current = true;
                swayRef.current = false;
              }
            },
          },
        });

        // Setup texts and sections
        gsap.set(heroTextRef.current, { y: 0, opacity: 1 });
        gsap.set(section2Ref.current, { y: 50, opacity: 0 });
        gsap.set(nextTextRef.current, { y: 0, opacity: 1 });
        if (nextTextRef.current.children && nextTextRef.current.children.length >= 3) {
          gsap.set(nextTextRef.current.children, { opacity: 0, y: 40 });
        }
        gsap.set(coverRef.current, { y: 40, opacity: 0 });
        gsap.set(manifestoRef.current, { y: 40, opacity: 0 });

        // Setup absolute stacked cards initial states
        const cards = articlesTrackRef.current.children;
        gsap.set(cards[0], { opacity: 1, x: 0, pointerEvents: 'auto' });
        gsap.set([cards[1], cards[2], cards[3], cards[4]], { opacity: 0, x: 50, pointerEvents: 'none' });

        // ── PHASE 1 (0% to 10%): LOCK STATE ──
        // Lock Section 1 landing states
        tl.fromTo(group.position,
          { x: 1.2, y: -0.1, z: 0 },
          { x: 1.2, y: -0.1, z: 0, ease: 'none', duration: 0.10 },
          0
        );
        tl.fromTo(group.scale,
          { x: base * 1.05, y: base * 1.05, z: base * 1.05 },
          { x: base * 1.05, y: base * 1.05, z: base * 1.05, ease: 'none', duration: 0.10 },
          0
        );
        // Explicitly lock X, Y, and Z rotations at progress 0 to 0.10
        tl.fromTo(group.rotation,
          { x: 0, y: 0, z: Math.PI / 2 },
          { x: 0, y: 0, z: Math.PI / 2, ease: 'none', duration: 0.10 },
          0
        );

        // ── PHASE 2 (10% to 22%): TRANSITION TO SECTION 2 ──
        // 1. Hero Text exits up first and fades out completely (done by 0.13 to prevent overlap)
        tl.to(heroTextRef.current, { y: -150, opacity: 0, ease: 'power2.in', duration: 0.05 }, 0.08);

        // 2. Vinyl moves from the right (X = 1.2) to the left (X = -1.8) and scales up to base * 2.2
        tl.to(group.position, { x: 1.3, ease: 'power1.out', duration: 0.03 }, 0.10);
        tl.to(group.position, { x: -1.8, ease: 'sine.inOut', duration: 0.09 }, 0.13);
        tl.to(group.position, { y: 0.4, ease: 'power1.out', duration: 0.06 }, 0.10);
        tl.to(group.position, { y: 0.0, ease: 'power1.in', duration: 0.06 }, 0.16);

        // Vinyl 3D tumble flip and spin
        tl.to(group.rotation, { z: Math.PI / 2 - 0.4, ease: 'sine.inOut', duration: 0.03 }, 0.10);
        tl.to(group.rotation, { z: Math.PI / 2 + Math.PI * 2, ease: 'sine.inOut', duration: 0.09 }, 0.13);
        tl.to(group.rotation, { y: Math.PI * 2, ease: 'sine.inOut', duration: 0.12 }, 0.10);
        tl.to(group.rotation, { x: 0.25, ease: 'power1.out', duration: 0.06 }, 0.10);
        tl.to(group.rotation, { x: 0.0, ease: 'power1.in', duration: 0.06 }, 0.16);

        // Scale swoop
        tl.to(group.scale, { x: base * 2.2, y: base * 2.2, z: base * 2.2, ease: 'sine.inOut', duration: 0.12 }, 0.10);

        // 3. Section 2 elements enter (fade in and slide up - starts at 0.16 after Hero text has cleared)
        tl.to(section2Ref.current, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.06 }, 0.16);

        // ── PHASE 3 (22% to 28%): TONEARM ENTERS ──
        // 1. Tonearm slides in from left to its mounting chassis position
        tl.to(tonearm.position, { x: -2.25, ease: 'power2.out', duration: 0.04 }, 0.22);
        // 2. Swing toward the outer groove (pivots flat)
        tl.to(tonearm.rotation, { z: -0.15, ease: 'power2.inOut', duration: 0.02 }, 0.26);
        // 3. Lower onto the vinyl along the Z-axis (needle drop)
        tl.to(tonearm.position, { z: 0.05, ease: 'power1.inOut', duration: 0.02 }, 0.28);

        // ── PHASE 4 (28% to 76%): HORIZONTAL CARD SLIDESHOW (ONE-BY-ONE FADE AND SLIDE) ──
        
        // Card 1 Exits: progress 0.28 to 0.34
        tl.to(cards[0], { opacity: 0, x: -50, pointerEvents: 'none', ease: 'power2.inOut', duration: 0.06 }, 0.28);
        
        // Card 2 Enters: progress 0.34 to 0.40
        tl.fromTo(cards[1],
          { opacity: 0, x: 50, pointerEvents: 'none' },
          { opacity: 1, x: 0, pointerEvents: 'auto', ease: 'power2.out', duration: 0.06 },
          0.34
        );
        // Card 2 Exits: progress 0.40 to 0.46
        tl.to(cards[1], { opacity: 0, x: -50, pointerEvents: 'none', ease: 'power2.inOut', duration: 0.06 }, 0.40);
        
        // Card 3 Enters: progress 0.46 to 0.52
        tl.fromTo(cards[2],
          { opacity: 0, x: 50, pointerEvents: 'none' },
          { opacity: 1, x: 0, pointerEvents: 'auto', ease: 'power2.out', duration: 0.06 },
          0.46
        );
        // Card 3 Exits: progress 0.52 to 0.58
        tl.to(cards[2], { opacity: 0, x: -50, pointerEvents: 'none', ease: 'power2.inOut', duration: 0.06 }, 0.52);
        
        // Card 4 Enters: progress 0.58 to 0.64
        tl.fromTo(cards[3],
          { opacity: 0, x: 50, pointerEvents: 'none' },
          { opacity: 1, x: 0, pointerEvents: 'auto', ease: 'power2.out', duration: 0.06 },
          0.58
        );
        // Card 4 Exits: progress 0.64 to 0.70
        tl.to(cards[3], { opacity: 0, x: -50, pointerEvents: 'none', ease: 'power2.inOut', duration: 0.06 }, 0.64);
        
        // Card 5 Enters: progress 0.70 to 0.76
        tl.fromTo(cards[4],
          { opacity: 0, x: 50, pointerEvents: 'none' },
          { opacity: 1, x: 0, pointerEvents: 'auto', ease: 'power2.out', duration: 0.06 },
          0.70
        );

        // ── PHASE 5 (76% to 82%): TONEARM LIFT & EXIT ──
        // 1. Needle lifts along the Z-axis
        tl.to(tonearm.position, { z: 0.5, ease: 'power1.inOut', duration: 0.02 }, 0.76);
        // 2. Swing back out of the record
        tl.to(tonearm.rotation, { z: 0.4, ease: 'power2.inOut', duration: 0.02 }, 0.78);
        // 3. Slide off-screen left
        tl.to(tonearm.position, { x: -5, ease: 'power2.in', duration: 0.02 }, 0.80);

        // ── PHASE 6 (80% to 100%): TRANSITION TO SECTION 3 ──
        // 1. Section 2 Header and Card 5 exit (fade out and slide up)
        tl.to(cards[4], { opacity: 0, x: -50, ease: 'power2.in', duration: 0.04 }, 0.80);
        tl.to(section2Ref.current, { opacity: 0, y: -50, ease: 'power2.in', duration: 0.04 }, 0.80);

        // 2. Cover and Manifesto enter early and smoothly (starts at 0.80, completes by 0.84)
        tl.to(coverRef.current, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.04 }, 0.80);
        tl.to(manifestoRef.current, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.04 }, 0.80);

        // 3. Vinyl record first aligns vertically and scales at X = -1.7 (left of the cover) during 0.80 to 0.86 (Slower)
        tl.to(group.position, { x: -1.7, y: targetVinylY, ease: 'sine.inOut', duration: 0.06 }, 0.80);
        tl.to(group.scale, { x: base * targetVinylScale, y: base * targetVinylScale, z: base * targetVinylScale, ease: 'sine.inOut', duration: 0.06 }, 0.80);

        // Vinyl 3D tumble flip and spin (prep phase 0.80 to 0.86)
        tl.to(group.rotation, { z: Math.PI / 2 + Math.PI * 2 - 0.4, ease: 'sine.inOut', duration: 0.06 }, 0.80);
        tl.to(group.rotation, { y: Math.PI * 4, ease: 'sine.inOut', duration: 0.12 }, 0.80);
        tl.to(group.rotation, { x: 0.25, ease: 'power1.out', duration: 0.06 }, 0.80);

        // 4. Vinyl record slides horizontally to its settled resting place behind the cover during 0.86 to 0.92 (Slower)
        tl.to(group.position, { x: targetVinylX, z: -0.15, ease: 'sine.inOut', duration: 0.06 }, 0.86);
        tl.to(group.rotation, { z: Math.PI / 2 + Math.PI * 4, ease: 'sine.inOut', duration: 0.06 }, 0.86);
        tl.to(group.rotation, { x: 0.0, ease: 'power1.in', duration: 0.06 }, 0.86);

        // 5. Staggered reveal of left-side curation blocks after vinyl record has completed its slide behind the cover (starts at 0.92)
        if (nextTextRef.current && nextTextRef.current.children && nextTextRef.current.children.length >= 3) {
          const blocks = nextTextRef.current.children;
          tl.to(blocks[0], { opacity: 1, y: 0, ease: 'power2.out', duration: 0.02 }, 0.92);
          tl.to(blocks[1], { opacity: 1, y: 0, ease: 'power2.out', duration: 0.02 }, 0.94);
          tl.to(blocks[2], { opacity: 1, y: 0, ease: 'power2.out', duration: 0.02 }, 0.96);
        }

      }
    }, 100);

    return () => clearInterval(id);
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      
      {/* ── Isolated 700vh Pinned Scroll Track for Section 1, 2, and 3 ── */}
      <div ref={stickyTrackRef} className={styles.stickyTrack}>
        <div className={styles.stickyViewport}>

          {/* ── Minimalist Top Navigation Header ── */}
          <header className={styles.headerBar}>
            <div className={styles.headerWordmark}>FOOTNOTE</div>
            <div className={styles.headerRight}>
              <span className={styles.themeText}>THEME</span>
              <div className={styles.hamburgerMenu}>
                <div className={styles.hamburgerLine} />
                <div className={styles.hamburgerLine} />
              </div>
            </div>
          </header>

          {/* ── Hero Text (Section 1) ── */}
          <div ref={heroTextRef} className={styles.heroText}>
            <p className={styles.eyebrow}>A Reading Companion</p>
            <h1 className={styles.headline}>
              <span className={styles.line1}>Architecture</span>
              <span className={styles.line2}>of Sound</span>
            </h1>
            <div className={styles.rule} />
            <p className={styles.body}>
              For those who think in long-form. FootNote is the sound
              <br />
              of deep focus &mdash; and the space to actually read.
            </p>
            <a href="/login" className={styles.cta}>
              ENTER FR <span className={styles.ctaArrow}>&rarr;</span>
            </a>
          </div>

          {/* ── Side Label (bottom left) ── */}
          <div className={styles.heroSideLabel}>
            <div className={styles.heroSideLabelLine} />
            <span className={styles.heroSideLabelText}>Issue 59 &mdash; 2025</span>
          </div>

          {/* ── Scroll Indicator ── */}
          <div className={styles.scrollIndicator}>
            <div className={styles.scrollDot} />
            <div className={styles.scrollLine} />
          </div>

          {/* ── Issue Badge (bottom right) ── */}
          <div className={styles.heroIssueBadge}>
            <div className={styles.heroIssueBadgeDot} />
            <span className={styles.heroIssueBadgeText}>Now Playing</span>
          </div>

          {/* ── Horizontal Articles Grid (Section 2) ── */}
          <div ref={section2Ref} className={styles.magazineIssue}>
            <div className={styles.magazineContainer}>
              <div className={styles.magazineHeader}>
                <h2 className={styles.magazineTitle}>Enter the Frequency</h2>
                <a href="/login" className={styles.magazineViewAll}>View All</a>
              </div>
              <div className={styles.magazineDivider} />
              <div className={styles.magazineGridWrapper}>
                <div ref={articlesTrackRef} className={styles.magazineGrid}>
                  
                  {/* Card 1 */}
                  <article className={styles.magazineCard}>
                    <div className={styles.magazineCardText}>
                      <div className={styles.magazineMeta}>ARTS &amp; CULTURE, ISSUE 59</div>
                      <h3 className={styles.magazineCardTitle}>COMING CLEAN</h3>
                      <p className={styles.magazineDesc}>On the merits of owning up.</p>
                    </div>
                    <div className={styles.magazineImgWrapper}>
                      <img src="/images/image1.jpg" alt="COMING CLEAN" className={styles.magazineImg} />
                    </div>
                  </article>

                  {/* Card 2 */}
                  <article className={styles.magazineCard}>
                    <div className={styles.magazineCardText}>
                      <div className={styles.magazineMeta}>INTERIORS, ISSUE 59</div>
                      <h3 className={styles.magazineCardTitle}>SILENT SPACES</h3>
                      <p className={styles.magazineDesc}>Defining the aesthetics of emptiness.</p>
                    </div>
                    <div className={styles.magazineImgWrapper}>
                      <img src="/images/image2.jpg" alt="SILENT SPACES" className={styles.magazineImg} />
                    </div>
                  </article>

                  {/* Card 3 */}
                  <article className={styles.magazineCard}>
                    <div className={styles.magazineCardText}>
                      <div className={styles.magazineMeta}>SOUND DESIGN, ISSUE 59</div>
                      <h3 className={styles.magazineCardTitle}>DIRTY TALK</h3>
                      <p className={styles.magazineDesc}>The frequencies of candid conversation.</p>
                    </div>
                    <div className={styles.magazineImgWrapper}>
                      <img src="/images/image3.jpg" alt="DIRTY TALK" className={styles.magazineImg} />
                    </div>
                  </article>

                  {/* Card 4 */}
                  <article className={styles.magazineCard}>
                    <div className={styles.magazineCardText}>
                      <div className={styles.magazineMeta}>LITERATURE, ISSUE 59</div>
                      <h3 className={styles.magazineCardTitle}>HOLLY WHITAKER</h3>
                      <p className={styles.magazineDesc}>In conversation with the radical author.</p>
                    </div>
                    <div className={styles.magazineImgWrapper}>
                      <img src="/images/image4.jpg" alt="HOLLY WHITAKER" className={styles.magazineImg} />
                    </div>
                  </article>

                  {/* Card 5 */}
                  <article className={styles.magazineCard}>
                    <div className={styles.magazineCardText}>
                      <div className={styles.magazineMeta}>ESSAY, ISSUE 59</div>
                      <h3 className={styles.magazineCardTitle}>RECLAIMING TIME</h3>
                      <p className={styles.magazineDesc}>A defense of doing absolutely nothing.</p>
                    </div>
                    <div className={styles.magazineImgWrapper}>
                      <img src="/images/image1.jpg" alt="RECLAIMING TIME" className={styles.magazineImg} />
                    </div>
                  </article>

                </div>
              </div>
            </div>
          </div>

          {/* ── Curation Stack on Left (Section 3) ── */}
          <div 
            ref={nextTextRef} 
            className={styles.featuresStack}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Block 1 */}
            <article className={styles.featureBlock}>
              <span className={styles.featureMicro}>01 &mdash; CURATION</span>
              <h3 className={styles.featureTitle}>Curated Frequencies</h3>
              <p className={styles.featureDesc}>Each piece arrives with a soundscape&mdash;considered, not suggested.</p>
            </article>

            {/* Block 2 */}
            <article className={styles.featureBlock}>
              <span className={styles.featureMicro}>02 &mdash; IMMERSION</span>
              <h3 className={styles.featureTitle}>Reading, Reimagined</h3>
              <p className={styles.featureDesc}>Reading becomes spatial, not silent. A second layer of editorial intention.</p>
              <a href="/login" className={styles.featureLink}>Explore &rarr;</a>
            </article>

            {/* Block 3 */}
            <article className={styles.featureBlock}>
              <span className={styles.featureMicro}>03 &mdash; ATMOSPHERE</span>
              <h3 className={styles.featureTitle}>Silence, Designed</h3>
              <p className={styles.featureDesc}>We treat audio like light: shaping mood, not filling gaps.</p>
            </article>
          </div>

          {/* ── Right Side Vinyl Cover (Section 3) ── */}
          <div ref={coverRef} className={styles.vinylCoverContainer}>
            <img src="/images/vinlycover.png" alt="Vinyl Cover" className={styles.vinylCoverImg} />
          </div>

          {/* ── Right Side Manifesto Overlay (Section 3) ── */}
          <h2 ref={manifestoRef} className={styles.featuresManifesto}>
            Sound, not as distraction&mdash;<br />
            <span className={styles.italic}>but as architecture.</span>
          </h2>

          {/* ── R3F Canvas Wrapper ── */}
          <div className={styles.canvasWrap}>
            <Suspense fallback={null}>
              <VinylScene
                groupRef={groupRef}
                vinylInnerRef={vinylInnerRef}
                tonearmRef={tonearmRef}
                swayRef={swayRef}
                isBreathing={isBreathing}
              />
            </Suspense>
          </div>

        </div>
      </div>

      {/* ── Section 4: Atmospheres Library List (Stacked below the sticky track) ── */}
      <section className={styles.atmospheresSection}>
        <div className={styles.atmospheresContainer}>
          {/* Header */}
          <div className={`${styles.atmospheresHeader} ${styles.animFadeUp}`}>
            <h2 className={styles.atmospheresTitle}>Your Atmospheres</h2>
            <span className={styles.atmospheresSubtitle}>Recent</span>
          </div>
  
          {/* List */}
          <ul className={styles.atmospheresList}>
            <li className={`${styles.atmosphereRow} ${styles.animFadeUp} ${styles.stagger1}`}>
              <span className={styles.atmosphereName}>The White Album</span>
              <span className={styles.atmosphereMood}>Melancholic &middot; Sparse</span>
              <span className={styles.atmosphereDuration}>14:02</span>
            </li>
            <li className={`${styles.atmosphereRow} ${styles.animFadeUp} ${styles.stagger2}`}>
              <span className={styles.atmosphereName}>Notes on Camp</span>
              <span className={styles.atmosphereMood}>Playful &middot; Rhythmic</span>
              <span className={styles.atmosphereDuration}>22:15</span>
            </li>
            <li className={`${styles.atmosphereRow} ${styles.animFadeUp} ${styles.stagger3}`}>
              <span className={styles.atmosphereName}>Towards a New Architecture</span>
              <span className={styles.atmosphereMood}>Structured &middot; Ambient</span>
              <span className={styles.atmosphereDuration}>45:00</span>
            </li>
          </ul>
  
          {/* Bottom CTA */}
          <div className={`${styles.atmospheresCta} ${styles.animFadeUp} ${styles.stagger4}`}>
            <a href="/login" className={styles.atmospheresLink}>View Full Collection &rarr;</a>
          </div>
        </div>
      </section>

      {/* ── Section 5: Featured Essays (Stacked below the atmospheres) ── */}
      <section className={styles.essaysSection}>
        <div className={styles.essaysContainer}>
          <div className={`${styles.essaysHeader} ${styles.animFadeUp}`}>
            <span className={styles.essaysEyebrow}>FEATURED READING</span>
            <h2 className={styles.essaysTitle}>"The article blues"</h2>
          </div>
          <div className={styles.essaysGrid}>
            
            {/* Essay 1 */}
            <article className={`${styles.essayCard} ${styles.animSlideRight} ${styles.delay2}`}>
              <div className={styles.essayImgBox}>
                <img src="/images/articleblue1.jpg" alt="On the sound of concentration" className={styles.essayImg} />
              </div>
              <div className={styles.essayContent}>
                <span className={styles.essayTag}>FOCUS &middot; WRITING</span>
                <h3 className={styles.essayTitle}>On the sound of concentration</h3>
                <p className={styles.essayExcerpt}>What does it mean to choose silence &mdash; and when does silence become its own distraction?</p>
              </div>
            </article>
  
            {/* Essay 2 */}
            <article className={`${styles.essayCard} ${styles.animSlideRight} ${styles.stagger1}`}>
              <div className={styles.essayImgBox}>
                <img src="/images/articleblue2.jpg" alt="The room where I finally wrote" className={styles.essayImg} />
              </div>
              <div className={styles.essayContent}>
                <span className={styles.essayTag}>ENVIRONMENT &middot; SPACE</span>
                <h3 className={styles.essayTitle}>The room where I finally wrote</h3>
                <p className={styles.essayExcerpt}>A small study, a particular light, a sound that was neither music nor silence. Some rooms think for you.</p>
              </div>
            </article>
  
            {/* Essay 3 */}
            <article className={`${styles.essayCard} ${styles.animSlideRight} ${styles.stagger2}`}>
              <div className={styles.essayImgBox}>
                <img src="/images/articleblue3.jpg" alt="Reading as a physical act" className={styles.essayImg} />
              </div>
              <div className={styles.essayContent}>
                <span className={styles.essayTag}>PRACTICE &middot; RITUAL</span>
                <h3 className={styles.essayTitle}>Reading as a physical act</h3>
                <p className={styles.essayExcerpt}>We have forgotten that reading requires a body. Posture, breath, temperature &mdash; all of it is the practice.</p>
              </div>
            </article>
  
            {/* Essay 4 */}
            <article className={`${styles.essayCard} ${styles.animSlideRight} ${styles.stagger3}`}>
              <div className={styles.essayImgBox}>
                <img src="/images/articleblue4.jpg" alt="Why lyrics break the spell" className={styles.essayImg} />
              </div>
              <div className={styles.essayContent}>
                <span className={styles.essayTag}>SOUND &middot; FREQUENCY</span>
                <h3 className={styles.essayTitle}>Why lyrics break the spell</h3>
                <p className={styles.essayExcerpt}>Language cannot be background. The moment a word reaches you, you are reading it &mdash; not the page.</p>
              </div>
            </article>
  
            {/* Essay 5 */}
            <article className={`${styles.essayCard} ${styles.animSlideRight} ${styles.stagger4}`}>
              <div className={styles.essayImgBox}>
                <img src="/images/articleblue5.jpg" alt="The lost art of doing nothing" className={styles.essayImg} />
              </div>
              <div className={styles.essayContent}>
                <span className={styles.essayTag}>CULTURE &middot; LIFESTYLE</span>
                <h3 className={styles.essayTitle}>The lost art of doing nothing</h3>
                <p className={styles.essayExcerpt}>In a world optimized for relentless productivity, sitting still has become a radical act of defiance.</p>
              </div>
            </article>
  
            {/* Essay 6 */}
            <article className={`${styles.essayCard} ${styles.animSlideRight} ${styles.stagger5}`}>
              <div className={styles.essayImgBox}>
                <img src="/images/articleblue6.jpg" alt="Defining the modern minimum" className={styles.essayImg} />
              </div>
              <div className={styles.essayContent}>
                <span className={styles.essayTag}>AESTHETICS &middot; DESIGN</span>
                <h3 className={styles.essayTitle}>Defining the modern minimum</h3>
                <p className={styles.essayExcerpt}>Why stripping away the unnecessary isn't about having less, but making room for what truly matters.</p>
              </div>
            </article>

          </div>
        </div>
      </section>

      {/* ── Section 6: Footer ── */}
      <footer className={styles.footerSection}>
        <div className={styles.footerContainer}>
          <div className={`${styles.footerTop} ${styles.animFadeUp}`}>
            <div className={styles.footerLeft}>
              <div className={styles.footerWordmark}>FootNote</div>
              <div className={styles.footerMotto}>"No ads. No algorithms. No noise."</div>
            </div>
            <div className={styles.footerRight}>
              <div className={styles.footerCol}>
                <a href="/login" className={styles.footerLink}>Listen</a>
                <a href="/login" className={styles.footerLink}>Read</a>
                <a href="/login" className={styles.footerLink}>Archive</a>
                <a href="/login" className={styles.footerLink}>About</a>
                <a href="/login" className={styles.footerLink}>Manifesto</a>
              </div>
            </div>
          </div>
          <div className={`${styles.footerRule} ${styles.animFadeUp} ${styles.stagger1}`} />
          <div className={`${styles.footerBottom} ${styles.animFadeUp} ${styles.stagger2}`}>
            <div className={styles.footerCopy}>&copy; 2025 FootNote</div>
            <div className={styles.footerLegal}>
              <a href="#" className={styles.legalLink}>Privacy</a>
              <span className={styles.legalSep}>&middot;</span>
              <a href="#" className={styles.legalLink}>Terms</a>
              <span className={styles.legalSep}>&middot;</span>
              <a href="#" className={styles.legalLink}>Contact</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
