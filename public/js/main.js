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

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* ============================================================
   HEXAGON BACKGROUND SYSTEM  (Canvas)
   ------------------------------------------------------------
   • On load  : hexagons rise from below the viewport like an
     ocean wave — staggered, eased, with a horizontal sway.
   • Settled  : gentle infinite bobbing / breathing loop.
   • On scroll: depth-based parallax, slow rotation, and a
     transient horizontal drift driven by scroll velocity.
   ------------------------------------------------------------
   TUNING — see HEX_CONFIG below:
     count        total hexagons (40–80 recommended)
     riseDuration per-hexagon rise time (ms)
     riseStagger  spread of staggered start times (ms)
     parallax     scroll parallax strength
   ============================================================ */
const HEX_CONFIG = {
  count:        62,     // total hexagons — keep 40–80 for good perf
  riseDuration: 1500,   // ms for one hexagon to rise into place
  riseStagger:  1200,   // ms — spread of staggered rise start times
  parallax:     0.22,   // scroll parallax strength (higher = more drift)
  goldRatio:    0.55,   // fraction of hexagons that are gold (vs navy)
};

function initHexagons(startRiseNow) {
  const canvas = document.getElementById('hexCanvas');
  if (!canvas) return { startRise() {} };
  const ctx = canvas.getContext('2d');

  // Colours (rgb triplets — alpha applied per-frame)
  const GOLD = '232, 197, 71';
  const NAVY = '116, 124, 168';   // smoky purple-navy

  let W, H, DPR;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();

  // ── Build the hexagon field ────────────────────────────────
  const hexes = [];
  for (let i = 0; i < HEX_CONFIG.count; i++) {
    const depth   = Math.random();                 // 0 = far, 1 = near
    const isGold  = Math.random() < HEX_CONFIG.goldRatio;
    hexes.push({
      x:        Math.random() * W,                  // resting x
      restY:    Math.random() * H,                  // resting y (viewport space)
      size:     12 + depth * 64,                    // near hexagons are larger
      depth,
      color:    isGold ? GOLD : NAVY,
      filled:   Math.random() < 0.32,               // some filled, most outline
      glow:     isGold && Math.random() < 0.5,      // ~half the gold ones glow
      opacity:  0.05 + depth * 0.35,                // 5%–40% depth opacity
      rotation: Math.random() * Math.PI,
      rotSpeed: (Math.random() - 0.5) * 0.00045,    // slow drift rotation
      bobAmp:   5 + depth * 13,                     // settled bob amplitude
      bobSpeed: 0.0004 + Math.random() * 0.0006,
      bobPhase: Math.random() * Math.PI * 2,
      swayAmp:  26 + Math.random() * 64,            // rise-time horizontal sway
      riseDelay: Math.random() * HEX_CONFIG.riseStagger,
    });
  }

  const RISE_OFFSET = H + 160;                      // start fully below viewport
  const WRAP_MARGIN = 160;
  const WRAP_SPAN   = H + WRAP_MARGIN * 2;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  // ── Scroll tracking (cheap listener, work happens in rAF) ───
  let scrollY = window.scrollY || 0;
  let lastScrollY = scrollY;
  let scrollVel = 0;
  window.addEventListener('scroll',
    () => { scrollY = window.scrollY || 0; },
    { passive: true });

  // ── Hexagon path + draw ─────────────────────────────────────
  function drawHex(h, cx, cy, opacity) {
    if (opacity <= 0.003) return;
    ctx.save();
    ctx.globalAlpha = opacity;

    if (h.glow) {
      ctx.shadowColor = 'rgba(232, 197, 71, 0.65)';
      ctx.shadowBlur  = 16;
    }

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + h.rotation;
      const px = cx + h.size * Math.cos(a);
      const py = cy + h.size * Math.sin(a);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();

    if (h.filled) {
      ctx.fillStyle = `rgb(${h.color})`;
      ctx.fill();
    } else {
      ctx.lineWidth   = 1.4;
      ctx.strokeStyle = `rgb(${h.color})`;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Animation state ─────────────────────────────────────────
  let riseStart = null;   // timestamp when the rise wave begins
  let rafId = null;

  function frame(now) {
    const elapsed = riseStart === null ? 0 : now - riseStart;

    // Smooth scroll velocity (transient — decays to 0 when idle)
    scrollVel += ((scrollY - lastScrollY) - scrollVel) * 0.18;
    lastScrollY = scrollY;

    ctx.clearRect(0, 0, W, H);

    for (const h of hexes) {
      // Rise progress 0 → 1, eased
      const raw    = riseStart === null
        ? 0
        : clamp((elapsed - h.riseDelay) / HEX_CONFIG.riseDuration, 0, 1);
      const eased  = easeOutCubic(raw);
      const settled = raw >= 1;

      // Slow continuous rotation
      h.rotation += h.rotSpeed * 16;

      // Settled breathing bob
      const bob = Math.sin(now * h.bobSpeed + h.bobPhase) * h.bobAmp;

      // Horizontal sway while rising (fades out as it settles)
      const sway = (1 - eased) *
        Math.sin(elapsed * 0.0038 + h.bobPhase) * h.swayAmp;

      // Scroll parallax — nearer hexagons move faster
      const parallax = scrollY * h.depth * HEX_CONFIG.parallax;

      // Transient horizontal drift from scroll velocity
      const drift = scrollVel * h.depth * 1.4;

      const cx = h.x + sway + drift;

      let cy;
      if (settled) {
        // Wrap vertically so hexagons keep covering the page as you scroll
        cy = h.restY + bob - parallax;
        cy = ((cy + WRAP_MARGIN) % WRAP_SPAN + WRAP_SPAN) % WRAP_SPAN - WRAP_MARGIN;
      } else {
        // Rising — straight interpolation from below the viewport
        cy = h.restY + (1 - eased) * RISE_OFFSET + bob;
      }

      // Fade in along with the rise
      drawHex(h, cx, cy, h.opacity * (settled ? 1 : eased));
    }

    rafId = requestAnimationFrame(frame);
  }

  // ── Reduced motion: draw one static frame, no loop ──────────
  function drawStatic() {
    ctx.clearRect(0, 0, W, H);
    for (const h of hexes) drawHex(h, h.x, h.restY, h.opacity);
  }

  // Re-init field positions on resize
  window.addEventListener('resize', debounce(() => {
    resize();
    if (reducedMotion) drawStatic();
  }, 200));

  if (reducedMotion) {
    drawStatic();
    return { startRise() {} };
  }

  // Begin the rAF loop immediately (hexagons sit off-screen until
  // startRise() sets the timeline origin).
  rafId = requestAnimationFrame(frame);

  const api = {
    startRise() { if (riseStart === null) riseStart = performance.now(); },
  };
  if (startRiseNow) api.startRise();
  return api;
}

/* ============================================================
   Custom Cursor
   ============================================================ */
function initCursor() {
  const dot = document.getElementById('cursorDot');
  if (!dot) return;

  document.addEventListener('mousemove', e => {
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';
  });

  const targets = document.querySelectorAll(
    'a, button, [tabindex="0"], .service-card'
  );
  targets.forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('is-hovering'));
    el.addEventListener('mouseleave', () => dot.classList.remove('is-hovering'));
  });

  document.addEventListener('mousedown', () => dot.classList.add('is-clicking'));
  document.addEventListener('mouseup',   () => dot.classList.remove('is-clicking'));

  document.addEventListener('touchstart', () => dot.classList.add('is-hidden'), { once: true });
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

  gsap.fromTo(mark,
    { opacity: 0, y: 22 },
    { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', delay: 0.1 }
  );

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
     <span class="char"><span class="char-inner">X</span></span>
   The outer clips; the inner is animated up by GSAP.
   ============================================================ */
function splitText(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);  // preserve accessible label
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

  tl.to('.hero-label', { opacity: 1, y: 0, duration: 0.5 }, 0);

  document.querySelectorAll('.split-line').forEach((line, i) => {
    const chars = splitText(line);
    tl.fromTo(
      chars,
      { y: '115%' },
      { y: '0%', duration: 0.85, stagger: 0.022, ease: 'power4.out' },
      0.18 + i * 0.1
    );
  });

  tl.to('.hero-sub',     { opacity: 1, y: 0, duration: 0.65 }, 0.7);
  tl.to('.scroll-hint',  { opacity: 1, duration: 0.5 }, 1.05);
}

/* ============================================================
   Scroll-triggered reveals (all .reveal-up elements)
   ============================================================ */
function initScrollReveals() {
  if (reducedMotion) {
    document.querySelectorAll('.reveal-up').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // Staggered batches grouped by parent element
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

  // Contact heading — big char reveal
  const contactH = document.querySelector('.js-split-contact');
  if (contactH) {
    const chars = splitText(contactH);
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
   Boot sequence
   ============================================================ */
function boot() {
  gsap.registerPlugin(ScrollTrigger);

  initCursor();

  // Build the hexagon field up front; the rise wave is triggered
  // the moment the preloader finishes so it's fully visible.
  const hex = initHexagons(false);

  initPreloader(() => {
    hex.startRise();          // launch the hexagon wave
    initLenis();
    initNav();
    initHeroAnimation();
    initScrollReveals();
    initMagnetic();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
