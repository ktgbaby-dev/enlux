/* ENLUX — interactions
   Motion is slow and scroll-led. Everything degrades to a fully visible,
   static page without JS or with prefers-reduced-motion. */
(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- Entrance ---------- */

  const heroLogo = document.querySelector('.hero-logo img');
  const waitFor = [
    document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : null,
    heroLogo && heroLogo.decode ? heroLogo.decode().catch(() => {}) : null,
  ].filter(Boolean);

  Promise.race([
    Promise.all(waitFor),
    new Promise((resolve) => setTimeout(resolve, 1600)),
  ]).then(() => {
    // one frame so the hidden starting states are painted before transitioning
    setTimeout(() => root.classList.add('is-ready'), 40);
  });

  /* ---------- Year ---------- */

  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Menu ---------- */

  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('menu');
  const toggleText = toggle ? toggle.querySelector('.menu-toggle-text') : null;

  function setMenu(open) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(open));
    if (toggleText) toggleText.textContent = open ? 'Close' : 'Menu';
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    if (open) menu.removeAttribute('inert');
    else menu.setAttribute('inert', '');
    root.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      const first = menu.querySelector('a');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 80);
    }
  }

  if (toggle && menu) {
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => {
      if (e.matches) setMenu(false);
    });
  }

  /* ---------- Scroll reveals ---------- */

  const revealEls = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Starfields ---------- */

  function Starfield(canvas, opts) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    let w = 0, h = 0, dpr = 1, stars = [], flares = [];
    let running = false, raf = 0, visible = false;
    let px = 0, py = 0, tx = 0, ty = 0;

    // small deterministic generator so the sky is the same on every visit
    let seed = opts.seed || 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    function build() {
      seed = opts.seed || 7;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(clamp((w * h) / opts.density, 36, 190));
      stars = [];
      for (let i = 0; i < count; i++) {
        const big = rand() > 0.92;
        stars.push({
          x: rand() * w,
          y: rand() * h,
          r: big ? 0.9 + rand() * 0.7 : 0.35 + rand() * 0.55,
          a: big ? 0.55 + rand() * 0.35 : 0.18 + rand() * 0.45,
          s: 0.0004 + rand() * 0.0013,
          ph: rand() * Math.PI * 2,
          d: 0.2 + rand() * 0.8,
        });
      }
      const small = w < 720;
      flares = opts.flares
        .filter((f) => !(small && f.desktopOnly))
        .map((f) => ({ x: f.x * w, y: f.y * h, len: f.len * (small ? 0.75 : 1), s: f.s, ph: f.ph }));
      draw(performance.now());
    }

    function flare(x, y, len, a) {
      ctx.globalAlpha = a;
      const core = ctx.createRadialGradient(x, y, 0, x, y, len * 0.4);
      core.addColorStop(0, 'rgba(255,255,255,1)');
      core.addColorStop(0.08, 'rgba(255,255,255,0.7)');
      core.addColorStop(0.3, 'rgba(226,232,255,0.16)');
      core.addColorStop(1, 'rgba(226,232,255,0)');
      ctx.fillStyle = core;
      ctx.fillRect(x - len * 0.4, y - len * 0.4, len * 0.8, len * 0.8);
      const hr = ctx.createLinearGradient(x - len, y, x + len, y);
      hr.addColorStop(0, 'rgba(255,255,255,0)');
      hr.addColorStop(0.5, 'rgba(255,255,255,0.95)');
      hr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hr;
      ctx.fillRect(x - len, y - 0.5, len * 2, 1);
      const vl = len * 0.72;
      const vr = ctx.createLinearGradient(x, y - vl, x, y + vl);
      vr.addColorStop(0, 'rgba(255,255,255,0)');
      vr.addColorStop(0.5, 'rgba(255,255,255,0.95)');
      vr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = vr;
      ctx.fillRect(x - 0.5, y - vl, 1, vl * 2);
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      px += (tx - px) * 0.035;
      py += (ty - py) * 0.035;
      ctx.fillStyle = '#fff';
      for (const s of stars) {
        const tw = reduceMotion ? 0.8 : 0.5 + 0.5 * Math.sin(t * s.s + s.ph);
        ctx.globalAlpha = s.a * (0.35 + 0.65 * tw);
        ctx.beginPath();
        ctx.arc(s.x + px * s.d * 14, s.y + py * s.d * 14, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const f of flares) {
        const pulse = reduceMotion ? 0.8 : 0.55 + 0.45 * Math.sin(t * f.s + f.ph);
        flare(f.x + px * 18, f.y + py * 18, f.len * (0.8 + pulse * 0.2), 0.35 + pulse * 0.55);
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      draw(t);
      raf = running ? requestAnimationFrame(loop) : 0;
    }
    function start() {
      if (running || reduceMotion) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    build();

    let resizeTimer = 0;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 180);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      }).observe(canvas);
    } else {
      visible = true;
      start();
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (visible) start();
    });

    if (finePointer && opts.parallax) {
      const host = canvas.parentElement;
      host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      host.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
    }
    return { build };
  }

  const heroCanvas = document.querySelector('.hero-stars');
  if (heroCanvas) {
    Starfield(heroCanvas, {
      seed: 11,
      density: 8500,
      parallax: true,
      flares: [
        { x: 0.12, y: 0.2, len: 30, s: 0.0007, ph: 0.4 },
        { x: 0.88, y: 0.16, len: 38, s: 0.0005, ph: 2.1 },
        { x: 0.86, y: 0.7, len: 22, s: 0.0009, ph: 4.2, desktopOnly: true },
        { x: 0.1, y: 0.6, len: 24, s: 0.0006, ph: 1.3, desktopOnly: true },
      ],
    });
  }

  const lightCanvas = document.querySelector('.light-stars');
  if (lightCanvas) {
    Starfield(lightCanvas, {
      seed: 29,
      density: 6000,
      parallax: false,
      flares: [
        { x: 0.1, y: 0.28, len: 26, s: 0.0006, ph: 1.1 },
        { x: 0.9, y: 0.72, len: 30, s: 0.0005, ph: 3.3 },
        { x: 0.78, y: 0.2, len: 18, s: 0.0008, ph: 5.2, desktopOnly: true },
      ],
    });
  }

  /* ---------- "Trend is temporary": letters that dissolve ---------- */

  const dissolveEl = document.querySelector('[data-dissolve]');
  const dissolveChars = [];
  if (dissolveEl && !reduceMotion) {
    const text = dissolveEl.textContent.trim();
    dissolveEl.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'visually-hidden';
    sr.textContent = text;
    dissolveEl.appendChild(sr);
    const words = text.split(' ');
    let i = 0;
    words.forEach((word, wi) => {
      const w = document.createElement('span');
      w.className = 'dw';
      w.setAttribute('aria-hidden', 'true');
      for (const ch of word) {
        const c = document.createElement('span');
        c.className = 'dc';
        c.textContent = ch;
        // golden-ratio scatter: an irregular but repeatable order of fading
        c.dataset.t = String(((i * 0.618034) % 1) * 0.62);
        w.appendChild(c);
        dissolveChars.push(c);
        i++;
      }
      dissolveEl.appendChild(w);
      if (wi < words.length - 1) dissolveEl.appendChild(document.createTextNode(' '));
    });
    dissolveChars.forEach((c) => { c._t = parseFloat(c.dataset.t); });
  }
  const identityEl = document.querySelector('.philo-identity');

  /* ---------- Scroll-driven scenes ---------- */

  const hero = document.querySelector('.hero');
  const heroInner = document.querySelector('.hero-inner');
  const heroHorizon = document.querySelector('.horizon-disc');
  const manifesto = document.querySelector('.manifesto');
  const mfStage = manifesto ? manifesto.querySelector('.manifesto-stage') : null;
  const mfLines = manifesto ? manifesto.querySelectorAll('.mf-line') : [];
  const mfTimeless = manifesto ? manifesto.querySelector('.mf-timeless') : null;
  const mfFlare = manifesto ? manifesto.querySelector('.mf-flare') : null;
  const mfCaption = manifesto ? manifesto.querySelector('.mf-caption') : null;

  let ticking = false;

  function update() {
    ticking = false;
    const y = window.scrollY || window.pageYOffset;
    const vh = window.innerHeight;

    root.classList.toggle('is-scrolled', y > 30);
    if (hero) root.classList.toggle('past-hero', y > hero.offsetHeight * 0.55);

    if (reduceMotion) return;

    // Hero: the logo drifts back into the dark, the horizon rises
    if (hero && heroInner && y < hero.offsetHeight * 1.1) {
      const k = clamp(y / hero.offsetHeight, 0, 1);
      heroInner.style.transform = `translate3d(0, ${(y * 0.28).toFixed(1)}px, 0)`;
      heroInner.style.opacity = String(1 - easeOut(k) * 1.1);
      if (heroHorizon) heroHorizon.style.transform = `translate3d(-50%, ${(-y * 0.16).toFixed(1)}px, 0)`;
    }

    // Philosophy: "Trend is temporary" falls apart; "timeless" gathers light
    if (dissolveEl && dissolveChars.length) {
      const r = dissolveEl.getBoundingClientRect();
      if (r.bottom > -200 && r.top < vh + 200) {
        const p = clamp((vh * 0.72 - r.top) / (vh * 0.5), 0, 1);
        for (const c of dissolveChars) {
          const l = easeInOut(seg(p, c._t, c._t + 0.38));
          c.style.opacity = String(1 - l * 0.88);
          c.style.transform = l ? `translate3d(0, ${(-l * 0.18).toFixed(3)}em, 0)` : '';
          if (finePointer) c.style.filter = l ? `blur(${(l * 5).toFixed(2)}px)` : '';
        }
        if (identityEl) identityEl.style.setProperty('--id', easeOut(seg(p, 0.35, 1)).toFixed(3));
      }
    }

    // Manifesto: PAIN / made me / TIMELESS, then light
    if (manifesto && mfStage) {
      const r = manifesto.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const total = r.height - vh;
        const p = total > 0 ? clamp(-r.top / total, 0, 1) : 1;
        const steps = [seg(p, 0.02, 0.17), seg(p, 0.15, 0.3), seg(p, 0.28, 0.44)];
        mfLines.forEach((line, i) => {
          const v = easeOut(steps[i] || 0);
          line.style.setProperty('--r', v.toFixed(3));
          // once fully risen, let the glow spill past the mask
          line.classList.toggle('is-open', v > 0.999);
        });
        if (mfTimeless) mfTimeless.style.setProperty('--lit', easeInOut(seg(p, 0.46, 0.7)).toFixed(3));
        if (mfFlare) mfFlare.style.setProperty('--fl', easeOut(seg(p, 0.66, 0.78)).toFixed(3));
        if (mfCaption) mfCaption.style.setProperty('--cap', easeOut(seg(p, 0.72, 0.86)).toFixed(3));
        mfStage.style.setProperty('--glow-o', easeInOut(seg(p, 0.44, 0.9)).toFixed(3));
      }
    }
  }

  function requestUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();

  /* ---------- Find your light: a lamp in the dark ---------- */

  const lightSection = document.querySelector('.light');
  const lamp = lightSection ? lightSection.querySelector('.light-lamp') : null;
  if (lightSection && lamp) {
    let lx = 0.5, ly = 0.5, tx = 0.5, ty = 0.5, hasPointer = false, raf = 0, visible = false;

    const place = () => {
      const r = lightSection.getBoundingClientRect();
      lamp.style.transform = `translate3d(${(lx * r.width).toFixed(1)}px, ${(ly * r.height).toFixed(1)}px, 0)`;
    };

    const tick = (t) => {
      if (!hasPointer) {
        // an unhurried drift when no one is steering
        tx = 0.5 + 0.26 * Math.sin(t * 0.00021);
        ty = 0.5 + 0.2 * Math.sin(t * 0.00029 + 1.3);
      }
      lx += (tx - lx) * 0.05;
      ly += (ty - ly) * 0.05;
      place();
      raf = visible ? requestAnimationFrame(tick) : 0;
    };

    if (reduceMotion) {
      place();
    } else {
      if (finePointer) {
        lightSection.addEventListener('pointermove', (e) => {
          const r = lightSection.getBoundingClientRect();
          tx = (e.clientX - r.left) / r.width;
          ty = (e.clientY - r.top) / r.height;
          hasPointer = true;
        });
        lightSection.addEventListener('pointerleave', () => { hasPointer = false; });
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible && !raf) raf = requestAnimationFrame(tick);
        }).observe(lightSection);
      }
      place();
    }
  }

  /* ---------- Collection grid (from js/collection.js) ---------- */

  const grid = document.querySelector('[data-collection-grid]');
  const collectionSection = document.getElementById('collection');
  const email = collectionSection ? collectionSection.dataset.email : '';
  const products = Array.isArray(window.ENLUX_COLLECTION)
    ? window.ENLUX_COLLECTION.filter((p) => p && p.name && p.image)
    : [];

  if (grid && products.length) {
    const frag = document.createDocumentFragment();
    products.forEach((p) => {
      const card = document.createElement('article');
      card.className = 'product';

      const media = document.createElement('div');
      media.className = 'product-media';
      const img = document.createElement('img');
      img.src = p.image;
      img.alt = p.alt || p.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 800;
      img.height = 1000;
      media.appendChild(img);

      const meta = document.createElement('div');
      meta.className = 'product-meta';
      const name = document.createElement('h3');
      name.className = 'product-name';
      name.textContent = p.name;
      meta.appendChild(name);
      if (p.price) {
        const price = document.createElement('span');
        price.className = 'product-price label';
        price.textContent = p.price;
        meta.appendChild(price);
      }

      card.append(media, meta);

      if (p.description) {
        const desc = document.createElement('p');
        desc.className = 'product-desc';
        desc.textContent = p.description;
        card.appendChild(desc);
      }

      if (email) {
        const order = document.createElement('a');
        order.className = 'text-link';
        order.href = `mailto:${email}?subject=${encodeURIComponent(`ENLUX order — ${p.name}`)}`;
        order.textContent = 'Order';
        card.appendChild(order);
      }

      frag.appendChild(card);
    });
    grid.appendChild(frag);
    grid.hidden = false;
  }

  /* ---------- Copy email ---------- */

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.querySelector('.copy-label');
    const original = label ? label.textContent : '';
    let timer = 0;
    btn.addEventListener('click', async () => {
      const value = btn.dataset.copy;
      let ok = false;
      try {
        await navigator.clipboard.writeText(value);
        ok = true;
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
        ta.remove();
      }
      if (label) {
        label.textContent = ok ? 'Address copied' : 'Select the address to copy';
        clearTimeout(timer);
        timer = setTimeout(() => { label.textContent = original; }, 2400);
      }
    });
  });
})();
