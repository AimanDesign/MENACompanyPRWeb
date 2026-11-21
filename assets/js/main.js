/* MENA Company PR — interactions & motion
   GSAP + ScrollTrigger (+ Lenis smooth scroll) when available; the page is fully readable without them. */
(() => {
  'use strict';
  const CONTACT = { email: 'info@menacompanypr.com', whatsapp: '' }; // whatsapp: digits only, e.g. '2010xxxxxxxx' — empty hides WhatsApp actions

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  // Motion is on by default (many Windows PCs report 'reduce motion' system-wide); visitors can switch it off with the footer toggle.
  const RM = store.get('mena-motion') === 'off';
  if (RM) html.classList.add('reduce');
  const G = window.gsap, ST = window.ScrollTrigger;
  const MOTION = !!(G && ST) && !RM;
  const I = window.I18N || { ar: {}, js: { en: {}, ar: {} }, meta: { en: {}, ar: {} }, cities: [] };
  let LANG = 'en', lenis = null;
  if (MOTION) { html.classList.add('motion'); G.registerPlugin(ST); }

  /* ================= i18n ================= */
  const EN = {}, EN_ALT = {}, EN_ARIA = {};
  $$('[data-i18n],[data-i18n-html]').forEach(el => { const k = el.dataset.i18n || el.dataset.i18nHtml; if (!(k in EN)) EN[k] = el.innerHTML; });
  $$('[data-i18n-alt]').forEach(el => { EN_ALT[el.dataset.i18nAlt] = el.alt; });
  $$('[data-i18n-aria]').forEach(el => { EN_ARIA[el.dataset.i18nAria] = el.getAttribute('aria-label'); });
  const J = () => I.js[LANG] || I.js.en;

  function applyLang(lang) {
    LANG = lang === 'ar' ? 'ar' : 'en';
    const ar = LANG === 'ar';
    $$('[data-i18n],[data-i18n-html]').forEach(el => { const k = el.dataset.i18n || el.dataset.i18nHtml; const v = ar ? I.ar[k] : EN[k]; if (v != null) el.innerHTML = v; });
    $$('[data-i18n-alt]').forEach(el => { const k = el.dataset.i18nAlt; el.alt = ar ? (I.ar[k] || EN_ALT[k]) : EN_ALT[k]; });
    $$('[data-i18n-aria]').forEach(el => { const k = el.dataset.i18nAria; el.setAttribute('aria-label', ar ? (I.ar[k] || EN_ARIA[k]) : EN_ARIA[k]); });
    html.lang = LANG; html.dir = ar ? 'rtl' : 'ltr';
    const m = I.meta[LANG] || {}; if (m.title) document.title = m.title;
    const md = $('meta[name="description"]'); if (md && m.desc) md.setAttribute('content', m.desc);
    $$('.lang__btn').forEach(b => { const on = b.dataset.lang === LANG; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); });
    $$('.pillar__key').forEach((k, i) => { k.textContent = ar ? ['أ', 'ب', 'ج', 'د', 'هـ'][i] : 'ABCDE'[i]; });
    store.set('mena-lang', LANG);
    splitHero(); splitStatement(); renderCorridor(); maps.forEach(mp => mp.relabel());
  }

  /* ================= word splitting (keeps inline markup such as <em>) ================= */
  function splitWords(el) {
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w'; const i = document.createElement('i'); i.textContent = p; w.appendChild(i); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    };
    walk(el); return $$('.w > i', el);
  }
  let heroWords = [], stWords = [];
  function splitHero() { const t = $('.hero__title [data-i18n]'); if (t) heroWords = splitWords(t); }
  function splitStatement() { const t = $('.statement [data-i18n]'); if (t) stWords = splitWords(t); }
  function statementTrigger() { // words light up one by one as the statement scrolls through
    ST.create({ trigger: '.statement', start: 'top 80%', end: 'bottom 40%', scrub: true,
      onUpdate: s => { const p = s.progress * (stWords.length + 2); stWords.forEach((w, i) => { w.style.opacity = Math.min(1, Math.max(.16, .16 + (p - i) * .84)); }); } });
  }

  /* ================= header, drawer, nav ================= */
  const hdr = $('#hdr'), burger = $('#burger'), drawer = $('#drawer');
  let lastY = 0;
  function onScroll(y) {
    hdr.classList.toggle('is-floating', y > 60);
    const down = y > lastY + 4, up = y < lastY - 4;
    if (down && y > 700 && !drawer.classList.contains('is-open')) hdr.classList.add('is-hidden');
    if (up || y < 700) hdr.classList.remove('is-hidden');
    lastY = y;
  }
  addEventListener('scroll', () => onScroll(scrollY), { passive: true }); onScroll(scrollY);
  function toggleDrawer(open) {
    if (open) { drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('is-open')); document.body.style.overflow = 'hidden'; if (lenis) lenis.stop(); }
    else { drawer.classList.remove('is-open'); document.body.style.overflow = ''; if (lenis) lenis.start(); setTimeout(() => { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 700); }
    burger.setAttribute('aria-expanded', open); hdr.classList.toggle('is-drawer', open);
  }
  burger.addEventListener('click', () => toggleDrawer(burger.getAttribute('aria-expanded') !== 'true'));
  addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) toggleDrawer(false); });
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); const t = id.length > 1 && $(id); if (!t) return;
    e.preventDefault(); if (drawer.classList.contains('is-open')) toggleDrawer(false);
    if (lenis) lenis.scrollTo(t, { offset: id === '#top' ? 0 : -10, duration: 1.4 }); else t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  }));
  const navLinks = $$('.hdr__nav a');
  const secObs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('is-on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'services', 'reach', 'approach', 'work'].forEach(id => { const s = document.getElementById(id); if (s) secObs.observe(s); });

  /* ================= cursor + magnetic + tilt ================= */
  if (MOTION && FINE) {
    const cur = $('#cursor'); const qx = G.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), qy = G.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    addEventListener('pointermove', e => { qx(e.clientX); qy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', e => { cur.classList.toggle('is-big', !!e.target.closest('a,button,.tilt,.corr,label,canvas.reach__map')); });
    $$('.mag').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); G.to(el, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .4, ease: 'power3' }); });
      el.addEventListener('pointerleave', () => G.to(el, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1,.4)' }));
    });
    $$('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; G.to(el, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 800, duration: .5, ease: 'power2' }); });
      el.addEventListener('pointerleave', () => G.to(el, { rotateX: 0, rotateY: 0, duration: .9, ease: 'elastic.out(1,.5)' }));
    });
  }

  /* ================= dot map engine (hero ambient + reach interactive) ================= */
  const MAP = window.MENA_MAP, K = Math.cos(28 * Math.PI / 180), HUB = [31.24, 30.04];
  const VIEWS = { 0: [-18, 62, 6, 46.5], 1: [20, 42, 19, 34], 2: [33, 62, 11, 32], 3: [31, 50, 27.5, 38.5], 4: [-18, 40, 8, 39], 5: [-11, 37, 33, 46.5] };
  const maps = [];
  class DotMap {
    constructor(canvas, mode) {
      this.c = canvas; this.ctx = canvas.getContext('2d'); this.mode = mode; this.sel = 0; this.hover = null; this.mouse = { x: -9999, y: -9999 };
      this.dots = []; const d = MAP.d;
      for (let i = 0; i < d.length; i += 3) this.dots.push({ lon: MAP.lon0 + d[i] * MAP.step, lat: MAP.lat1 - d[i + 1] * MAP.step, k: d[i + 2], v: 0, ph: Math.random() * 6.28 });
      this.cities = I.cities.map(c => ({ lon: c[0], lat: c[1], k: c[2], en: c[3], ar: c[4] }));
      this.view = null; this.target = null; this.arcs = []; this.next = 0; this.visible = false; this.t0 = performance.now();
      this.sprite = this.makeSprite();
      this.resize(); addEventListener('resize', () => this.resize());
      canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); this.mouse.x = e.clientX - r.left; this.mouse.y = e.clientY - r.top; });
      canvas.addEventListener('pointerleave', () => { this.mouse.x = this.mouse.y = -9999; this.hover = null; });
      if (mode === 'reach') canvas.addEventListener('click', () => { if (this.hover) selectCorridor(this.hover); });
      new IntersectionObserver(es => es.forEach(e => { this.visible = e.isIntersecting; if (this.visible) this.loop(); }), { threshold: 0 }).observe(canvas);
      if (!MOTION) setTimeout(() => this.frame(performance.now() + 6000), 60);
    }
    makeSprite() { const s = document.createElement('canvas'); s.width = s.height = 32; const g = s.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,1)'); gr.addColorStop(.6, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return s; }
    rect() {
      const w = this.w, h = this.h;
      if (this.mode === 'hero') { if (w < 900) return [0, h * .30, w, h * .62]; return LANG === 'ar' ? [w * .02, h * .1, w * .6, h * .82] : [w * .38, h * .1, w * .6, h * .82]; }
      return [w * .04, h * .06, w * .92, h * .80];
    }
    fit(b) { const [x, y, w, h] = this.rect(); const s = Math.min(w / ((b[1] - b[0]) * K), h / (b[3] - b[2])); return { lon: (b[0] + b[1]) / 2, lat: (b[2] + b[3]) / 2, s, cx: x + w / 2, cy: y + h / 2 }; }
    resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2), r = this.c.getBoundingClientRect(); this.w = r.width; this.h = r.height;
      this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr); this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.target = this.fit(VIEWS[this.mode === 'hero' ? 0 : this.sel]); if (!this.view) this.view = Object.assign({}, this.target); else Object.assign(this.view, this.target); this.baked = false;
      if (!MOTION || !this.visible) this.frame(performance.now());
    }
    relabel() { if (this.mode === 'hero') { this.target = this.fit(VIEWS[0]); Object.assign(this.view, this.target); this.baked = false; } if (!MOTION) this.frame(performance.now() + 6000); }
    setSel(k) { this.sel = k; this.target = this.fit(VIEWS[k]); this.arcs = []; this.next = 0; if (!MOTION) { Object.assign(this.view, this.target); this.frame(performance.now() + 6000); } }
    P(lon, lat) { const v = this.view; return [v.cx + (lon - v.lon) * K * v.s, v.cy - (lat - v.lat) * v.s]; }
    loop() { if (this.raf || !MOTION) return; const tick = t => { this.raf = null; if (!this.visible) return; this.frame(t); this.raf = requestAnimationFrame(tick); }; this.raf = requestAnimationFrame(tick); }
    spawn(t) {
      const pool = this.cities.filter(c => c.en !== 'Cairo' && (this.mode === 'hero' || this.sel === 0 || c.k === this.sel));
      if (this.mode === 'reach') { // reach: one arc per city of the selected corridor, drawn in sequence and kept
        if (this.arcs.length) return; pool.forEach((c, i) => this.arcs.push({ c, t0: t + i * 140, dur: 1100, keep: true }));
        return;
      }
      if (t < this.next) return; const c = pool[Math.floor(Math.random() * pool.length)];
      this.arcs.push({ c, t0: t, dur: 1500 + Math.random() * 600, keep: false }); this.next = t + 520;
      if (this.arcs.length > 9) this.arcs.shift();
    }
    style(d) { // base intensity + colour of a dot for the current mode/selection
      if (this.mode === 'hero') return d.k === 1 ? [1, 'r'] : [d.k ? .58 : .22, 'c'];
      const on = this.sel === 0 ? d.k > 0 : d.k === this.sel;
      return [on ? .95 : d.k ? .3 : .12, on ? (this.sel === 0 && d.k !== 1 ? 'c' : 'r') : 'c'];
    }
    bake() { // hero: draw the static dot field once; frames then only add the cursor spotlight
      const dpr = Math.min(devicePixelRatio || 1, 2), L = this.layer || (this.layer = document.createElement('canvas'));
      L.width = Math.round(this.w * dpr); L.height = Math.round(this.h * dpr); const g = L.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const dot = Math.max(1.6, MAP.step * this.view.s * K * .36) * 2.2;
      for (const d of this.dots) { const [x, y] = this.P(d.lon, d.lat); if (x < -10 || y < -10 || x > this.w + 10 || y > this.h + 10) continue;
        const [a, col] = this.style(d); g.globalAlpha = a * (d.k ? 1 : Math.min(1, Math.max(0, (d.lat - 6) / 10))); g.drawImage(col === 'r' ? this.redSprite() : this.sprite, x - dot / 2, y - dot / 2, dot, dot); }
      this.baked = true;
    }
    frame(t) {
      const ctx = this.ctx, w = this.w, h = this.h, v = this.view, tg = this.target; if (!w || !h) return;
      const dt = Math.min(.1, Math.max(0, (t - (this.lastT || t)) / 1000)); this.lastT = t;
      const e = MOTION ? 1 - Math.exp(-dt * 5) : 1, ed = MOTION ? 1 - Math.exp(-dt * 4) : 1; // frame-rate independent easing
      for (const k of ['lon', 'lat', 's', 'cx', 'cy']) v[k] += (tg[k] - v[k]) * e;
      ctx.clearRect(0, 0, w, h);
      const dot = Math.max(1.6, MAP.step * v.s * K * .36), mx = this.mouse.x, my = this.mouse.y, R = this.mode === 'hero' ? 150 : 110;
      const time = (t - this.t0) / 1000; let hov = null, hovD = 1e9;
      if (this.mode === 'hero') {
        if (!this.baked) this.bake();
        ctx.globalAlpha = MOTION ? .9 + .1 * Math.sin(time * 1.2) : 1; ctx.drawImage(this.layer, 0, 0, w, h);
        if (mx > -999) for (const d of this.dots) { // spotlight: only the dots near the pointer are redrawn
          const [x, y] = this.P(d.lon, d.lat), dx = x - mx, dy = y - my, dd = dx * dx + dy * dy; if (dd >= R * R) continue;
          const f = 1 - Math.sqrt(dd) / R, [a, col] = this.style(d), s = dot * (1 + f * .9) * 2.2;
          ctx.globalAlpha = Math.min(1, f * .75 + a * .2); ctx.drawImage(col === 'r' ? this.redSprite() : this.sprite, x - s / 2, y - s / 2, s, s);
        }
      } else for (const d of this.dots) {
        const [x, y] = this.P(d.lon, d.lat); if (x < -10 || y < -10 || x > w + 10 || y > h + 10) continue;
        const [target, col] = this.style(d);
        d.v += (target - d.v) * ed;
        let a = d.v * (d.k ? 1 : Math.min(1, Math.max(0, (d.lat - 6) / 10))), sc = 1;
        const dx = x - mx, dy = y - my, dd = dx * dx + dy * dy;
        if (dd < R * R) { const f = 1 - Math.sqrt(dd) / R; a = Math.min(1, a + f * .7); sc = 1 + f * .9; if (d.k && dd < hovD) { hovD = dd; hov = d.k; } }
        if (MOTION) a *= .86 + .14 * Math.sin(time * 1.6 + d.ph);
        ctx.globalAlpha = a; const s = dot * sc * 2.2;
        ctx.drawImage(col === 'r' ? this.redSprite() : this.sprite, x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      if (this.mode === 'reach') { this.hover = hovD < 18 * 18 ? hov : null; this.c.style.cursor = this.hover ? 'pointer' : 'crosshair'; }
      // arcs
      if (MOTION) this.spawn(t); else if (!this.arcs.length) this.spawn(t - 9e4);
      const [hx, hy] = this.P(HUB[0], HUB[1]);
      for (const a of this.arcs) {
        const p = MOTION ? Math.min(1, Math.max(0, (t - a.t0) / a.dur)) : 1; if (p <= 0) continue;
        const life = a.keep ? 1 : Math.max(0, 1 - Math.max(0, (t - a.t0 - a.dur - 900) / 900));
        if (life <= 0) continue;
        const [cx, cy] = this.P(a.c.lon, a.c.lat), mxp = (hx + cx) / 2, myp = (hy + cy) / 2, len = Math.hypot(cx - hx, cy - hy);
        const qx = mxp, qy = myp - len * .32; // arcs bow upwards like flight paths
        const ep = 1 - Math.pow(1 - p, 3);
        ctx.beginPath(); ctx.moveTo(hx, hy); const N = 36;
        for (let i = 1; i <= N * ep; i++) { const u = i / N, x = (1 - u) * (1 - u) * hx + 2 * (1 - u) * u * qx + u * u * cx, y = (1 - u) * (1 - u) * hy + 2 * (1 - u) * u * qy + u * u * cy; ctx.lineTo(x, y); }
        const g = ctx.createLinearGradient(hx, hy, cx, cy); g.addColorStop(0, 'rgba(213,68,45,0)'); g.addColorStop(1, 'rgba(240,120,90,' + (.95 * life) + ')');
        ctx.strokeStyle = g; ctx.lineWidth = this.mode === 'hero' ? 1.7 : 1.9; ctx.stroke();
        // travelling pulse
        const u = a.keep ? ((t - a.t0) / 1800) % 1 : ep; if (MOTION && p > 0) { const x = (1 - u) * (1 - u) * hx + 2 * (1 - u) * u * qx + u * u * cx, y = (1 - u) * (1 - u) * hy + 2 * (1 - u) * u * qy + u * u * cy; ctx.globalAlpha = life; ctx.drawImage(this.redSprite(), x - 6, y - 6, 12, 12); ctx.globalAlpha = 1; }
        if (p >= 1) { // arrival ring + label
          const rp = MOTION ? ((t - a.t0 - a.dur) / 1400) % 1 : .3; ctx.strokeStyle = 'rgba(240,120,90,' + (1 - rp) * .8 * life + ')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, 3 + rp * 14, 0, 6.283); ctx.stroke();
          ctx.fillStyle = 'rgba(252,239,228,' + life + ')'; ctx.beginPath(); ctx.arc(cx, cy, 2.6, 0, 6.283); ctx.fill();
          if (!(this.mode === 'reach' && this.sel === 0 && this.w < 700)) this.label(a.c, cx, cy, life * (this.mode === 'hero' ? .85 : 1));
        }
      }
      // hub
      const hp = MOTION ? (time % 2.2) / 2.2 : .4; ctx.strokeStyle = 'rgba(213,68,45,' + (1 - hp) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx, hy, 5 + hp * 26, 0, 6.283); ctx.stroke();
      ctx.fillStyle = '#d5442d'; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, 6.283); ctx.fill(); ctx.fillStyle = '#fcefe4'; ctx.beginPath(); ctx.arc(hx, hy, 2, 0, 6.283); ctx.fill();
      this.label(this.cities[0], hx, hy, 1, true);
    }
    redSprite() { if (!this._red) { const s = document.createElement('canvas'); s.width = s.height = 32; const g = s.getContext('2d'); g.drawImage(this.sprite, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#e8573d'; g.fillRect(0, 0, 32, 32); this._red = s; } return this._red; }
    label(c, x, y, a, hub) {
      const ctx = this.ctx, ar = LANG === 'ar'; ctx.globalAlpha = a;
      ctx.font = (hub ? '600 ' : '500 ') + (hub ? 13 : 11.5) + 'px ' + (ar ? "'IBM Plex Sans Arabic','SF Arabic',sans-serif" : "'Anybody',sans-serif");
      ctx.fillStyle = hub ? '#fcefe4' : 'rgba(252,239,228,.85)'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const txt = ar ? c.ar : (hub ? c.en.toUpperCase() : c.en); ctx.fillText(txt, x + 9, y - (hub ? 12 : 9)); ctx.globalAlpha = 1;
    }
  }
  const heroMap = $('#heroMap') && MAP ? new DotMap($('#heroMap'), 'hero') : null;
  const reachMap = $('#reachMap') && MAP ? new DotMap($('#reachMap'), 'reach') : null;
  if (heroMap) maps.push(heroMap); if (reachMap) maps.push(reachMap);
  if (heroMap && MOTION && FINE) { // the whole hero reacts to the pointer, not only the canvas
    $('.hero').addEventListener('pointermove', e => { const r = heroMap.c.getBoundingClientRect(); heroMap.mouse.x = e.clientX - r.left; heroMap.mouse.y = e.clientY - r.top; });
  }

  /* ================= corridors ================= */
  let corrSel = 0;
  function renderCorridor() {
    const c = (J().corr || [])[corrSel]; if (!c) return;
    const t = $('#corrTitle'), p = $('#corrText'); if (t) t.textContent = c[0]; if (p) p.textContent = c[1];
  }
  function selectCorridor(k) {
    corrSel = +k; $$('.corr').forEach(b => { const on = +b.dataset.k === corrSel; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
    if (reachMap) reachMap.setSel(corrSel);
    const card = $('#corrCard');
    if (MOTION && card) G.timeline().to(card, { opacity: 0, y: 10, duration: .18 }).add(renderCorridor).to(card, { opacity: 1, y: 0, duration: .45, ease: 'power3' }); else renderCorridor();
  }
  $$('.corr').forEach(b => { b.addEventListener('click', () => selectCorridor(b.dataset.k)); b.addEventListener('keydown', e => {
    if (!/Arrow(Left|Right|Up|Down)/.test(e.key)) return; e.preventDefault(); const list = $$('.corr'); const i = list.indexOf(b); const fwd = /Down|Right/.test(e.key) !== (LANG === 'ar' && /Left|Right/.test(e.key));
    const n = list[(i + (fwd ? 1 : -1) + list.length) % list.length]; n.focus(); selectCorridor(n.dataset.k); }); });

  /* ================= counters ================= */
  function runCount(el) {
    const to = +el.dataset.to, from = +(el.dataset.from || 0), pad = +(el.dataset.pad || 0), o = { v: from };
    const fmt = v => String(Math.round(v)).padStart(pad, '0');
    if (!MOTION) { el.textContent = fmt(to); return; }
    G.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(o.v); } });
  }

  /* ================= contact ================= */
  const tEl = $('#cairoTime');
  const clock = () => { try { tEl.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()); } catch (e) {} };
  if (tEl) { clock(); setInterval(clock, 15000); }
  if (CONTACT.whatsapp) { const ph = $('#cPhone'); if (ph) ph.href = 'https://wa.me/' + CONTACT.whatsapp; }
  const form = $('#cform'), msg = $('#cformMsg');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(form); const name = (f.get('name') || '').trim(), email = (f.get('email') || '').trim();
    const bad = []; if (!name) bad.push(form.name); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) bad.push(form.email);
    $$('input,textarea', form).forEach(i => i.removeAttribute('aria-invalid')); bad.forEach(i => i.setAttribute('aria-invalid', 'true'));
    if (bad.length) { msg.textContent = J().need; bad[0].focus(); return; }
    const svc = f.getAll('svc').join(', '), sel = form.market.options[form.market.selectedIndex].text;
    const body = [name + (f.get('company') ? ' — ' + f.get('company') : ''), email, '', sel + (svc ? ' · ' + svc : ''), '', (f.get('msg') || '')].join('\n');
    const subject = J().subject + (f.get('company') || name);
    const mail = 'mailto:' + CONTACT.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    msg.innerHTML = ''; msg.append(J().ok); const a = document.createElement('a'); a.href = mail; a.textContent = CONTACT.email; a.dir = 'ltr'; msg.append(a, '.');
    if (CONTACT.whatsapp) { const w = document.createElement('a'); w.href = 'https://wa.me/' + CONTACT.whatsapp + '?text=' + encodeURIComponent(subject + '\n' + body); w.target = '_blank'; w.rel = 'noopener'; w.textContent = ' ' + J().wa; msg.append(w); }
    location.href = mail;
  });
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();
  const mt = $('#motionToggle'); if (mt) { mt.setAttribute('aria-pressed', RM); mt.addEventListener('click', () => { store.set('mena-motion', RM ? 'on' : 'off'); location.reload(); }); }

  /* ================= marquee ================= */
  const mq = $('#marquee'); let mqTl = null;
  function buildMarquee() {
    if (!mq) return; if (mqTl) { mqTl.kill(); mqTl = null; }
    $$('.mq-clone', mq).forEach(n => n.remove());
    const kids = Array.from(mq.children); for (let r = 0; r < 3; r++) kids.forEach(k => { const c = k.cloneNode(true); c.classList.add('mq-clone'); c.removeAttribute('data-i18n'); mq.appendChild(c); });
    if (!MOTION) return; G.set(mq, { xPercent: 0 });
    mqTl = G.to(mq, { xPercent: LANG === 'ar' ? 25 : -25, duration: 22, ease: 'none', repeat: -1 });
  }

  /* ================= scroll motion ================= */
  let scrollCtx = null;
  function buildServices() {
    const track = $('#svcTrack'), bar = $('#svcBar'); if (!track) return;
    $$('.pillar__img img').forEach(i => { i.style.transform = ''; });
    if (innerWidth < 901) { if (bar) bar.style.transform = 'scaleX(1)'; return; }
    const dist = () => Math.max(0, track.scrollWidth - html.clientWidth);
    const sign = LANG === 'ar' ? 1 : -1, imgs = $$('.pillar__img img'), vw = () => html.clientWidth;
    G.to(track, { x: () => sign * dist(), ease: 'none', scrollTrigger: {
      trigger: '#services', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      onUpdate: s => { if (bar) bar.style.transform = 'scaleX(' + s.progress + ')'; imgs.forEach(img => { const r = img.parentNode.getBoundingClientRect(); const off = ((r.left + r.width / 2) - vw() / 2) / vw(); img.style.transform = 'scale(1.12) translateX(' + (off * -7).toFixed(2) + '%)'; }); } } });
  }

  function buildScroll() { scrollCtx = G.context(scrollScene); }
  function scrollScene() {
    // headings: the brand's expanded width grows in as each line enters
    $$('.h2.xp').forEach(h => {
      const lines = $$('.ln', h); if (!lines.length) return;
      const ar = LANG === 'ar';
      G.fromTo(lines, ar ? { opacity: 0, y: 40 } : { opacity: 0, y: 40, '--w': 72 }, Object.assign({ opacity: 1, y: 0, duration: 1.3, ease: 'expo.out', stagger: .12, scrollTrigger: { trigger: h, start: 'top 86%' } }, ar ? {} : { '--w': 150 }));
    });
    $$('.reveal').forEach(el => G.to(el, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
    $$('.stagger').forEach(el => G.to(el.children, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: el, start: 'top 86%' } }));
    $$('.reveal-img').forEach(el => {
      const img = $('img', el);
      G.to(el, { clipPath: LANG === 'ar' ? 'polygon(0% 0,100% 0,100% 100%,12% 100%)' : 'polygon(0 0,100% 0,88% 100%,0 100%)', duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 82%' } });
      if (img) G.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 82%' } });
    });
    // parallax on the about photo
    const ap = $('.about__photo img'); if (ap) G.fromTo(ap, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.about__photo', start: 'top bottom', end: 'bottom top', scrub: true } });
    // glance art
    const gt = G.timeline({ scrollTrigger: { trigger: '.glance', start: 'top 65%' } });
    gt.from('.glance__circle', { scale: 0, duration: 1.2, ease: 'back.out(1.4)' })
      .from('.glance__portrait', { yPercent: 25, opacity: 0, duration: 1.3, ease: 'expo.out' }, '-=.8')
      .from('.glance__chev', { rotate: -90, scale: 0, duration: .9, ease: 'back.out(2)' }, '-=1');
    G.to('.glance__circle', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.glance', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('.count').forEach(el => ST.create({ trigger: el, start: 'top 88%', once: true, onEnter: () => runCount(el) }));
    // process line + steps
    const steps = $$('.step');
    G.to('#processFill', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '#process', start: 'top 75%', end: 'bottom 55%', scrub: true,
      onUpdate: s => steps.forEach((st, i) => st.classList.toggle('is-on', s.progress >= i / steps.length + .02)) } });
    // audience cards rise in sequence
    G.from('.acard', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .14, scrollTrigger: { trigger: '.aud__grid', start: 'top 85%' } });
    // giant footer word expands to the brand's Extra Expanded width
    G.fromTo('#giant', { '--w': 50 }, { '--w': 150, ease: 'none', scrollTrigger: { trigger: '.ftr', start: 'top bottom', end: 'bottom bottom', scrub: true } });
    // hero map drifts as you leave
    G.to('#heroMap', { yPercent: 18, opacity: .35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero__wrap', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    // marquee speeds up with scroll velocity
    ST.create({ trigger: 'body', start: 0, end: 'max', onUpdate: s => { if (!mqTl) return; const v = Math.min(Math.abs(s.getVelocity()) / 500, 5); G.to(mqTl, { timeScale: 1 + v, duration: .2, overwrite: true, onComplete: () => G.to(mqTl, { timeScale: 1, duration: 1.2 }) }); } });
    G.set(stWords, { opacity: .16 }); statementTrigger();
    buildServices();
  }

  function rebuildAll() { // used after a language switch or a layout breakpoint change
    buildMarquee();
    if (!MOTION) return;
    if (scrollCtx) scrollCtx.revert();
    buildScroll(); ST.refresh();
  }

  /* ================= language switch with curtain ================= */
  function switchLang(lang) {
    if (lang === LANG) return;
    if (!MOTION) { applyLang(lang); rebuildAll(); return; }
    const cur = $('#curtain'), o = { p: 0 }, toAr = lang === 'ar';
    const poly = (p, phase) => { // phase 0: cover sweeping in, 1: uncover sweeping out (same direction)
      const e = 18; let L, R;
      if (phase === 0) { L = toAr ? 100 - p * (100 + e) : -e; R = toAr ? 100 + e : -e + p * (100 + 2 * e); }
      else { L = toAr ? -e : -e + p * (100 + 2 * e); R = toAr ? 100 + e - p * (100 + 2 * e) : 100 + e; }
      return toAr ? `polygon(${L + e}% 0,${R}% 0,${R}% 100%,${L}% 100%)` : `polygon(${L}% 0,${R}% 0,${R - e}% 100%,${L}% 100%)`;
    };
    G.timeline()
      .to(o, { p: 1, duration: .65, ease: 'power3.inOut', onUpdate: () => { cur.style.clipPath = poly(o.p, 0); } })
      .add(() => { const y = scrollY; applyLang(lang); rebuildAll(); if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); introHero(true); })
      .set(o, { p: 0 })
      .to(o, { p: 1, duration: .75, ease: 'power3.inOut', delay: .12, onUpdate: () => { cur.style.clipPath = poly(o.p, 1); } })
      .set(cur, { clearProps: 'clipPath' });
  }
  $$('.lang__btn').forEach(b => b.addEventListener('click', () => switchLang(b.dataset.lang)));

  /* ================= hero intro + loader ================= */
  function introHero(quick) {
    if (!MOTION) return;
    const tl = G.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo(heroWords, { yPercent: 110 }, { yPercent: 0, duration: quick ? .9 : 1.3, stagger: quick ? .03 : .07 })
      .fromTo(['.hero__eyebrow', '.hero__sub', '.hero__ctas', '.hero__facts li', '.hero__legend', '.hero__scroll'], { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: .07 }, quick ? 0 : .25);
    if (!quick) tl.fromTo('#heroMap', { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 2.2 }, 0);
    return tl;
  }
  function runLoader() {
    const ld = $('#loader'); if (!ld) return Promise.resolve();
    const seen = (() => { try { return sessionStorage.getItem('mena-seen'); } catch (e) { return null; } })();
    if (!MOTION || seen) { ld.remove(); return Promise.resolve(); }
    try { sessionStorage.setItem('mena-seen', '1'); } catch (e) {}
    return new Promise(res => {
      const polys = $$('polygon', ld); polys.forEach(p => { const L = p.getTotalLength ? p.getTotalLength() : 600; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
      const tl = G.timeline({ onComplete: () => { ld.remove(); res(); } });
      tl.to(polys, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut', stagger: .15 })
        .to('.lm-red', { fill: '#d5442d', duration: .35 }, '-=.15').to('.lm-ink', { fill: '#fcefe4', duration: .35 }, '<')
        .fromTo('.loader__word', { opacity: 0, '--w': 50 }, { opacity: 1, '--w': 150, duration: 1, ease: 'expo.out' }, '-=.3')
        .to('.loader__sub', { opacity: 1, duration: .5 }, '-=.6')
        .to('.loader__inner', { opacity: 0, y: -20, duration: .45, ease: 'power2.in' }, '+=.25')
        .to('.loader__half--a', { xPercent: -105, duration: 1, ease: 'expo.inOut' }, '-=.1')
        .to('.loader__half--b', { xPercent: 105, duration: 1, ease: 'expo.inOut' }, '<')
        .add(() => introHero(false), '-=.75');
    });
  }

  /* ================= boot ================= */
  const urlLang = new URLSearchParams(location.search).get('lang');
  const startLang = urlLang || store.get('mena-lang') || ((navigator.language || '').toLowerCase().startsWith('ar') ? 'ar' : 'en');
  applyLang(startLang);
  if (MOTION && window.Lenis) {
    lenis = new window.Lenis({ lerp: .1, smoothWheel: true });
    lenis.on('scroll', ST.update); G.ticker.add(t => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0);
  }
  buildMarquee();
  if (MOTION) {
    G.set(heroWords, { yPercent: 110 }); G.set(['.hero__eyebrow', '.hero__sub', '.hero__ctas', '.hero__facts li', '.hero__legend', '.hero__scroll'], { opacity: 0 });
    buildScroll();
  }
  const seenLoader = (() => { try { return sessionStorage.getItem('mena-seen'); } catch (e) { return null; } })();
  runLoader().then(() => { if (seenLoader) introHero(false); });
  let rw = innerWidth, rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const cross = (rw < 901) !== (innerWidth < 901); rw = innerWidth; if (cross) rebuildAll(); }, 200); });
  addEventListener('load', () => { if (MOTION) ST.refresh(); });
})();
