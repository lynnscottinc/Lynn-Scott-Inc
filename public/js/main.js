/* ============================================================
   main.js — Lynn Scott Inc. (LSI)
   ============================================================ */
'use strict';

// ── Reduced-motion guard ─────────────────────────────────────
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Simple debounce
const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

/* ============================================================
   Custom Cursor
   ============================================================ */
function initCursor() {
  const dot = document.getElementById('cursorDot');
  if (!dot) return;

  // Position cursor on every mouse move
  document.addEventListener('mousemove', e => {
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';
  });

  // Grow on interactive elements
  const targets = document.querySelectorAll(
    'a, button, [tabindex="0"], .service-card, .work-card'
  );
  targets.forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => dot.classList.remove('is-hovering'));
  });

  // Click feedback
  document.addEventListener('mousedown', () => dot.classList.add('is-clicking'));
  document.addEventListener('mouseup',   () => dot.classList.remove('is-clicking'));

  // Hide on touch
  document.addEventListener('touchstart', () => dot.classList.add('is-hidden'), { once: true });

  // Show cursor when entering window
  document.documentElement.addEventListener('mouseleave', () => dot.classList.add('is-hidden'));
  document.documentElement.addEventListener('mouseenter', () => dot.classList.remove('is-hidden'));
}

/* ============================================================
   Preloader
   ============================================================ */
function initPreloader(onDone) {
  const loader = document.getElementById('preloader');
  const fill   = document.getElementById('preloaderFill');
  const mark   = loader && loader.querySelector('.preloader-mark');

  if (!loader || reducedMotion) {
    if (loader) loader.style.display = 'none';
    onDone();
    return;
  }

  // Animate "LSI" mark in
  gsap.fromTo(mark,
    { opacity: 0, y: 22 },
    { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', delay: 0.1 }
  );

  // Fake incremental progress
  let progress = 0;

  function step() {
    progress += Math.random() * 20 + 5;
    if (progress >= 100) {
      progress = 100;
      fill.style.width = '100%';

      setTimeout(() => {
        gsap.to(loader, {
          opacity: 0,
          duration: 0.55,
          ease: 'power2.inOut',
          onComplete: () => {
            loader.style.display = 'none';
            onDone();
          }
        });
      }, 320);
    } else {
      fill.style.width = progress + '%';
      setTimeout(step, Math.random() * 160 + 70);
    }
  }

  setTimeout(step, 280);
}

/* ============================================================
   Lenis Smooth Scroll
   ============================================================ */
let lenis;

function initLenis() {
  if (reducedMotion || typeof Lenis === 'undefined') return;

  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add(time => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ============================================================
   Navigation — transparent → frosted on scroll
   ============================================================ */
function initNav() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  const update = () =>
    nav.classList.toggle('is-scrolled', window.scrollY > 60);

  window.addEventListener('scroll', debounce(update, 8), { passive: true });
  update();

  // Anchor clicks → Lenis smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();

      if (lenis) {
        lenis.scrollTo(target, {
          duration: 1.4,
          easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/* ============================================================
   Manual text splitter
   Wraps each character in:
     <span class="char">
       <span class="char-inner">X</span>
     </span>
   The outer clips; the inner starts translateY(110%) and
   is animated up by GSAP.
   ============================================================ */
function splitText(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text); // preserve accessible label
  el.textContent = '';

  return [...text].map(char => {
    const outer = document.createElement('span');
    outer.className = 'char';
    outer.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('span');
    inner.className = 'char-inner';
    inner.textContent = char === ' ' ? ' ' : char;

    outer.appendChild(inner);
    el.appendChild(outer);
    return inner;
  });
}

/* ============================================================
   Hero entrance animation (runs after preloader exits)
   ============================================================ */
function initHeroAnimation() {
  if (reducedMotion) {
    document.querySelectorAll('.hero-label, .hero-sub, .scroll-hint')
      .forEach(el => { el.style.opacity = '1'; });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  // Label fade-up
  tl.to('.hero-label', { opacity: 1, y: 0, duration: 0.5 }, 0);

  // Staggered character reveals on both headline lines
  document.querySelectorAll('.split-line').forEach((line, i) => {
    const chars = splitText(line);
    tl.fromTo(
      chars,
      { y: '115%' },
      { y: '0%', duration: 0.85, stagger: 0.022, ease: 'power4.out' },
      0.18 + i * 0.1
    );
  });

  // Tagline + CTA
  tl.to('.hero-sub', { opacity: 1, y: 0, duration: 0.65 }, 0.7);

  // Scroll hint
  tl.to('.scroll-hint', { opacity: 1, duration: 0.5 }, 1.05);
}

/* ============================================================
   Scroll-triggered reveals (all .reveal-up elements)
   ============================================================ */
function initScrollReveals() {
  if (reducedMotion) {
    document.querySelectorAll('.reveal-up').forEach(el => {
      el.style.opacity   = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // Generic staggered batches by parent
  const batches = new Map();

  gsap.utils.toArray('.reveal-up').forEach(el => {
    const parent = el.parentElement;
    if (!batches.has(parent)) batches.set(parent, []);
    batches.get(parent).push(el);
  });

  batches.forEach(els => {
    gsap.to(els, {
      opacity: 1,
      y: 0,
      duration: 0.75,
      stagger: 0.09,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: els[0],
        start: 'top 87%',
        toggleActions: 'play none none none',
      }
    });
  });

  // ── Contact heading big char reveal ────────────────────────
  const contactH = document.querySelector('.js-split-contact');
  if (contactH) {
    const chars = splitText(contactH);
    // Remove the .reveal-up class so the generic reveal doesn't fight
    contactH.classList.remove('reveal-up');
    gsap.set(contactH, { opacity: 1 });

    gsap.fromTo(
      chars,
      { y: '110%' },
      {
        y: '0%',
        duration: 0.8,
        stagger: 0.03,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: contactH,
          start: 'top 85%',
          toggleActions: 'play none none none',
        }
      }
    );
  }
}

/* ============================================================
   Magnetic buttons
   ============================================================ */
function initMagnetic() {
  if (reducedMotion) return;

  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const { left, top, width, height } = el.getBoundingClientRect();
      const dx = (e.clientX - left - width  / 2) * 0.32;
      const dy = (e.clientY - top  - height / 2) * 0.32;

      gsap.to(el, { x: dx, y: dy, duration: 0.35, ease: 'power2.out' });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, 0.45)' });
    });
  });
}

/* ============================================================
   Work card image zoom on hover
   ============================================================ */
function initWorkHover() {
  if (reducedMotion) return;

  document.querySelectorAll('.work-card').forEach(card => {
    const img = card.querySelector('.work-card-img');

    card.addEventListener('mouseenter', () =>
      gsap.to(img, { scale: 1.05, duration: 0.55, ease: 'power2.out' }));
    card.addEventListener('mouseleave', () =>
      gsap.to(img, { scale: 1,    duration: 0.55, ease: 'power2.out' }));
  });
}

/* ============================================================
   Boot sequence
   ============================================================ */
function boot() {
  gsap.registerPlugin(ScrollTrigger);

  initCursor();

  initPreloader(() => {
    initLenis();
    initNav();
    initHeroAnimation();
    initScrollReveals();
    initMagnetic();
    initWorkHover();
  });
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
