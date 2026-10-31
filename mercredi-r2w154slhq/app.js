'use strict';
/* =========================================================
   Un mercredi soir — une page de Yohann pour Dina
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);
const cap = t => t.replace(/^(un|une|des) /, '').replace(/^./, c => c.toUpperCase());
const PHONE = '33646307810';
const wa = txt => `https://wa.me/${PHONE}?text=${encodeURIComponent(txt)}`;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};

/* =========================================================
   SON — tout est généré en direct (Web Audio), aucun fichier
   ========================================================= */
const A = {
  ctx: null, master: null, music: null, sfx: null, rev: null, noise: null,
  muted: store.get('dina_mute', false), mode: 'lounge', timer: null, step: 0, nextT: 0,
  murmur: null, ringTimer: null,
  init() {
    if (this.ctx) { this.ctx.resume && this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const c = this.ctx = new AC();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3;
    this.master = c.createGain(); this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(comp); comp.connect(c.destination);
    this.music = c.createGain(); this.music.gain.value = 0; this.music.connect(this.master);
    this.sfx = c.createGain(); this.sfx.gain.value = 0.8; this.sfx.connect(this.master);
    // réverbe de salle feutrée
    const len = c.sampleRate * 2.6, ir = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.rev = c.createConvolver(); this.rev.buffer = ir;
    const rg = c.createGain(); rg.gain.value = 0.45; this.rev.connect(rg); rg.connect(this.master);
    const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    this.noise = nb;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else this.ctx.resume();
    });
  },
  setMute(m) {
    this.muted = m; store.set('dina_mute', m);
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.08);
    drawMute();
  },
  f: m => 440 * Math.pow(2, (m - 69) / 12),
  out(node, send = 0.3) {
    node.connect(this.music);
    if (send) { const g = this.ctx.createGain(); g.gain.value = send; node.connect(g); g.connect(this.rev); }
  },
  /* piano électrique doux */
  ep(m, t, vel = 0.12, dur = 2.6) {
    const c = this.ctx, f = this.f(m);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.012);
    g.gain.exponentialRampToValueAtTime(vel * 0.32, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
    const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 4.01;
    const g2 = c.createGain(); g2.gain.setValueAtTime(vel * 0.5, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    const o3 = c.createOscillator(); o3.type = 'triangle'; o3.frequency.value = f * 2.002;
    const g3 = c.createGain(); g3.gain.value = 0.18;
    o1.connect(g); o3.connect(g3); g3.connect(g); o2.connect(g2); g2.connect(g);
    this.out(g, 0.35);
    [o1, o2, o3].forEach(o => { o.start(t); o.stop(t + dur + 0.05); });
  },
  bass(m, t, dur = 1.2, vel = 0.22) {
    const c = this.ctx;
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = this.f(m);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); this.out(g, 0.05); o.start(t); o.stop(t + dur + 0.05);
  },
  brush(t, vel = 0.025, dur = 0.12) {
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 7000; bp.Q.value = 0.6;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp); bp.connect(g); this.out(g, 0.15); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  },
  chords: [
    { n: [55, 59, 62, 66, 69], b: 43 }, // Gmaj9
    { n: [54, 57, 61, 64, 69], b: 42 }, // F#m7
    { n: [52, 55, 59, 62, 66], b: 40 }, // Em9
    { n: [57, 61, 64, 66, 67], b: 45 }, // A13
    { n: [55, 59, 62, 66, 71], b: 43 },
    { n: [59, 62, 66, 69, 73], b: 47 }, // Bm9
    { n: [52, 55, 59, 62, 64], b: 40 },
    { n: [57, 60, 64, 67, 69], b: 45 }  // A7sus
  ],
  scale: [74, 76, 78, 81, 83, 86, 88],
  startMusic() {
    if (!this.ctx || this.timer) return;
    this.music.gain.cancelScheduledValues(this.ctx.currentTime);
    this.music.gain.setTargetAtTime(0.85, this.ctx.currentTime, 1.2);
    this.nextT = this.ctx.currentTime + 0.1; this.step = 0;
    this.timer = setInterval(() => this.tick(), 90);
  },
  tick() {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const e = 60 / 68 / 2; // croche à 68 bpm
    while (this.nextT < c.currentTime + 0.35) {
      const t = this.nextT, s = this.step, ci = Math.floor(s / 16) % this.chords.length, k = s % 16, ch = this.chords[ci];
      const final = this.mode === 'final';
      if (k === 0) { ch.n.forEach((m, i) => this.ep(m, t + i * 0.025 + rand(0, .01), 0.07, 4)); this.bass(ch.b, t, final ? 3 : 1.4, final ? .16 : .22); }
      if (k === 8) ch.n.slice(1).forEach((m, i) => this.ep(m, t + i * 0.02, 0.045, 3));
      if (!final) {
        if (k === 6 || k === 11) this.bass(ch.b + (k === 6 ? 7 : 12), t, 0.6, 0.14);
        if (k === 10) this.bass(ch.b, t, 1.0, 0.18);
        if (k % 4 === 2) this.brush(t, 0.03, 0.18);
        if (k % 2 === 1) this.brush(t + e * 0.18, 0.009, 0.05);
      }
      const p = final ? 0.18 : 0.26;
      if (k % 2 === 1 && Math.random() < p) this.ep(this.scale[Math.floor(Math.random() * this.scale.length)] - (final ? 0 : 12), t + e * 0.15, 0.05, 2);
      this.nextT += e; this.step++;
    }
  },
  duck(on) { if (this.music) this.music.gain.setTargetAtTime(on ? 0.12 : 0.85, this.ctx.currentTime, 0.3); },
  /* ---------- bruitages ---------- */
  env(node, t, a, peak, d) { const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); node.connect(g); return g; },
  tone(f, t, peak, d, type = 'sine', send = 0.2, a = 0.005) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f;
    const g = this.env(o, t, a, peak, d); g.connect(this.sfx);
    if (send) { const s = this.ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(this.rev); }
    o.start(t); o.stop(t + a + d + 0.05); return o;
  },
  noiseHit(t, type, freq, q, peak, d, a = 0.004) {
    if (!this.ctx) return;
    const s = this.ctx.createBufferSource(); s.buffer = this.noise;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    s.connect(f); const g = this.env(f, t, a, peak, d); g.connect(this.sfx);
    s.start(t, Math.random()); s.stop(t + a + d + 0.05); return f;
  },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  tap() { if (!this.ctx) return; this.tone(1320, this.now(), 0.05, 0.08, 'sine', 0); },
  paper() { if (!this.ctx) return; const t = this.now(); for (let i = 0; i < 7; i++) this.noiseHit(t + i * 0.05 + rand(0, .03), 'highpass', 1800 + rand(0, 2000), 0.7, 0.12, 0.06); },
  seal() { if (!this.ctx) return; const t = this.now(); this.noiseHit(t, 'bandpass', 1200, 1, 0.5, 0.08); this.tone(110, t, 0.3, 0.2, 'sine', 0); },
  whoosh(up = true) {
    if (!this.ctx) return; const t = this.now();
    const f = this.noiseHit(t, 'bandpass', up ? 300 : 2400, 1.2, 0.18, 0.9, 0.35);
    f.frequency.exponentialRampToValueAtTime(up ? 2600 : 300, t + 1.1);
  },
  click() { if (!this.ctx) return; const t = this.now(); this.noiseHit(t, 'highpass', 2500, 0.8, 0.35, 0.025); this.tone(140, t, 0.25, 0.09, 'sine', 0.1); },
  chime(base = 76) { if (!this.ctx) return; const t = this.now(); [0, 4, 7, 12, 16].forEach((d, i) => this.tone(this.f(base + d), t + i * 0.09, 0.07, 1.6, 'sine', 0.5)); },
  sparkle() { if (!this.ctx) return; const t = this.now(); for (let i = 0; i < 9; i++) this.tone(this.f(this.scale[Math.floor(rand(0, 7))] + 12), t + i * 0.06, 0.035, 0.6, 'sine', 0.6); },
  clink() { if (!this.ctx) return; const t = this.now(); [2380, 3510, 5120].forEach(f => { this.tone(f, t, 0.08, 1.2, 'sine', 0.4); this.tone(f * 1.01, t + 0.11, 0.05, 1, 'sine', 0.4); }); },
  shing() { if (!this.ctx) return; const t = this.now(); [1830, 2740, 4115, 5600].forEach(f => this.tone(f, t, 0.045, 1.8, 'sine', 0.5)); this.whoosh(true); },
  pour() {
    if (!this.ctx) return; const t = this.now();
    const f = this.noiseHit(t, 'bandpass', 700, 4, 0.22, 2.2, 0.15); f.frequency.exponentialRampToValueAtTime(1900, t + 2.3);
    for (let i = 0; i < 14; i++) this.tone(rand(500, 1300), t + i * 0.15 + rand(0, .08), 0.02, 0.08, 'sine', 0);
  },
  heartbeat(n = 3) { if (!this.ctx) return; const t = this.now(); for (let i = 0; i < n; i++) { const b = t + i * 0.85; [0, 0.22].forEach((d, j) => { const o = this.tone(70, b + d, j ? .3 : .45, 0.22, 'sine', 0); o && o.frequency.exponentialRampToValueAtTime(38, b + d + 0.2); }); } },
  ring(on) {
    clearInterval(this.ringTimer); this.ringTimer = null;
    if (!on || !this.ctx) return;
    const pat = [79, 84, 88, 84, 79, 84, 91, 88];
    const play = () => { const t = this.now(); pat.forEach((m, i) => { this.tone(this.f(m), t + i * 0.13, 0.12, 0.25, 'sine', 0.1); this.tone(this.f(m + 12), t + i * 0.13, 0.03, 0.1, 'sine', 0); }); };
    play(); this.ringTimer = setInterval(play, 2300);
  },
  hangup() { if (!this.ctx) return; const t = this.now(); [0, .25, .5].forEach(d => this.tone(480, t + d, 0.06, 0.15, 'sine', 0)); },
  startMurmur() {
    if (!this.ctx || this.murmur) return;
    const c = this.ctx, g = c.createGain(); g.gain.value = 0.0001; g.connect(this.sfx);
    const srcs = [];
    [[380, 0.9], [820, 1.4], [1500, 2]].forEach(([fr, q], i) => {
      const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr; bp.Q.value = q;
      const vg = c.createGain(); vg.gain.value = 0.5;
      const lfo = c.createOscillator(); lfo.frequency.value = 2.3 + i * 1.7; const lg = c.createGain(); lg.gain.value = 0.35;
      lfo.connect(lg); lg.connect(vg.gain); lfo.start();
      s.connect(bp); bp.connect(vg); vg.connect(g); s.start(0, Math.random()); srcs.push(s, lfo);
    });
    g.gain.setTargetAtTime(0.32, c.currentTime, 0.8);
    const clinks = setInterval(() => { if (Math.random() < 0.5) this.tone(rand(2200, 3800), this.now(), 0.012 * (this.murmurLevel || 1), 0.5, 'sine', 0.4); }, 900);
    this.murmur = { g, srcs, clinks }; this.murmurLevel = 1;
  },
  murmurTo(level) { if (!this.murmur) return; this.murmurLevel = level; this.murmur.g.gain.setTargetAtTime(Math.max(0.0001, 0.32 * level), this.now(), 0.25); },
  stopMurmur() {
    if (!this.murmur) return; const m = this.murmur; this.murmur = null;
    clearInterval(m.clinks); m.g.gain.setTargetAtTime(0.0001, this.now(), 0.4);
    setTimeout(() => m.srcs.forEach(s => { try { s.stop(); } catch (e) {} }), 2500);
  }
};

const muteBtn = $('#muteBtn');
function drawMute() {
  muteBtn.innerHTML = A.muted
    ? '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  muteBtn.setAttribute('aria-label', A.muted ? 'Remettre le son' : 'Couper le son');
}
drawMute();
muteBtn.addEventListener('click', () => { A.init(); A.setMute(!A.muted); toast(A.muted ? 'Son coupé' : 'Son remis ♪'); });

/* =========================================================
   PARTICULES (poussière d'or, cœurs, pétales)
   ========================================================= */
const fx = $('#fx'), g2 = fx.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize() { DPR = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; fx.width = W * DPR; fx.height = H * DPR; g2.setTransform(DPR, 0, 0, DPR, 0, 0); }
resize(); addEventListener('resize', resize);
const dust = Array.from({ length: 34 }, () => ({ x: rand(0, 1), y: rand(0, 1), r: rand(0.6, 2), v: rand(0.00004, 0.00016), p: rand(0, 6.28) }));
let parts = [];
function heartPath(c, s) { c.beginPath(); c.moveTo(0, s * 0.3); c.bezierCurveTo(-s, -s * 0.4, -s * 0.5, -s * 1.1, 0, -s * 0.5); c.bezierCurveTo(s * 0.5, -s * 1.1, s, -s * 0.4, 0, s * 0.3); c.fill(); }
function burst(x, y, n = 24, kind = 'heart') {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), sp = rand(1.5, 5.5);
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2.5, life: 1, s: rand(5, 11), rot: rand(0, 6), vr: rand(-.1, .1), kind,
      col: kind === 'heart' ? ['#e04a64', '#f2d898', '#b8243f', '#ff8fa3'][i % 4] : ['#f2d898', '#e9c983', '#fff1c9'][i % 3] });
  }
}
function rain(n = 40, kind = 'petal') {
  for (let i = 0; i < n; i++) parts.push({ x: rand(0, W), y: rand(-H * 0.6, -10), vx: rand(-.6, .6), vy: rand(1, 2.4), life: 1.6, s: rand(5, 10), rot: rand(0, 6), vr: rand(-.05, .05), kind, slow: true,
    col: kind === 'petal' ? ['#b8243f', '#e04a64', '#8e1f35', '#f2d898'][i % 4] : ['#3c6b3a', '#d8b36a', '#5c8a4a'][i % 3] });
}
let lastF = 0;
function frame(ts) {
  requestAnimationFrame(frame);
  if (document.hidden || ts - lastF < 30) return; lastF = ts;
  g2.clearRect(0, 0, W, H);
  for (const d of dust) {
    d.y -= d.v * 16; d.p += 0.03; if (d.y < -0.02) { d.y = 1.02; d.x = rand(0, 1); }
    g2.globalAlpha = 0.25 + 0.35 * Math.sin(d.p) ** 2; g2.fillStyle = '#f2d898';
    g2.beginPath(); g2.arc(d.x * W + Math.sin(d.p * 0.5) * 8, d.y * H, d.r, 0, 6.28); g2.fill();
  }
  parts = parts.filter(p => p.life > 0 && p.y < H + 40);
  for (const p of parts) {
    if (p.slow) { p.x += p.vx + Math.sin(p.y / 40) * 0.6; p.y += p.vy; p.life -= 0.004; }
    else { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.985; p.life -= 0.012; }
    p.rot += p.vr; g2.globalAlpha = Math.max(0, Math.min(1, p.life)); g2.fillStyle = p.col;
    g2.save(); g2.translate(p.x, p.y); g2.rotate(p.rot);
    if (p.kind === 'heart') heartPath(g2, p.s);
    else if (p.kind === 'petal' || p.kind === 'leaf') { g2.beginPath(); g2.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, 6.28); g2.fill(); }
    else { g2.beginPath(); g2.arc(0, 0, p.s * 0.35, 0, 6.28); g2.fill(); }
    g2.restore();
  }
  g2.globalAlpha = 1;
}
requestAnimationFrame(frame);
const centerOf = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

/* =========================================================
   OUTILS
   ========================================================= */
let toastT;
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }
let notifT;
function notif(msg) { $('#notifTxt').textContent = msg; $('#notif').classList.add('show'); A.tone(1568, A.now(), 0.06, 0.15, 'sine', 0); A.tone(2093, A.now() + 0.12, 0.06, 0.2, 'sine', 0); clearTimeout(notifT); notifT = setTimeout(() => $('#notif').classList.remove('show'), 4800); }
$('#notif').addEventListener('click', () => $('#notif').classList.remove('show'));
function go(id) {
  const cur = $('.scene.active'); if (cur) cur.classList.remove('active');
  const nx = $('#' + id); nx.scrollTop = 0; nx.classList.add('active');
  A.whoosh(true);
}
function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

/* ---------- dessins ---------- */
function cedar(fill = '#f2d898') {
  const tiers = [[20, 9], [31, 17], [43, 26], [55, 34], [67, 42]];
  let d = `<path d="M50 6 L56 16 L44 16 Z" fill="${fill}"/>`;
  tiers.forEach(([y, w]) => { d += `<path d="M${50 - w} ${y} Q50 ${y - 10} ${50 + w} ${y} Q${50 + w * .55} ${y + 5} 50 ${y + 3} Q${50 - w * .55} ${y + 5} ${50 - w} ${y} Z" fill="${fill}"/>`; });
  d += `<rect x="47" y="64" width="6" height="26" rx="2" fill="${fill}"/><path d="M36 92 Q50 86 64 92" stroke="${fill}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return d;
}
function wobble(cx, cy, r) { let d = ''; for (let i = 0; i <= 60; i++) { const a = i / 60 * 6.283; const rr = r + Math.sin(a * 7) * 2.6 + Math.sin(a * 11 + 1) * 1.8 + Math.sin(a * 3) * 2; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return d + 'Z'; }
$('#seal').innerHTML = `<svg viewBox="0 0 100 100"><defs><radialGradient id="wax" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#c2354e"/><stop offset=".5" stop-color="#8e1f35"/><stop offset="1" stop-color="#3f0715"/></radialGradient></defs>
  <path d="${wobble(50, 50, 45)}" fill="url(#wax)"/><circle cx="50" cy="50" r="34" fill="none" stroke="rgba(30,0,8,.45)" stroke-width="2.5"/><circle cx="49.3" cy="49.3" r="34" fill="none" stroke="rgba(255,190,190,.25)" stroke-width="1"/>
  <g transform="translate(25 23) scale(.5)" opacity=".95"><g transform="translate(1.5 1.5)">${cedar('rgba(30,0,8,.5)')}</g>${cedar('#e9c983')}</g>
  <ellipse cx="34" cy="28" rx="13" ry="6" fill="rgba(255,255,255,.18)" transform="rotate(-30 34 28)"/></svg>`;
$('#cedarMini').innerHTML = cedar('#8e1f35');

function paella() {
  const r = rng(42); let s = '';
  s += `<defs><radialGradient id="rice" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#f6cf5a"/><stop offset="1" stop-color="#d48d1e"/></radialGradient></defs>`;
  s += `<ellipse cx="8" cy="86" rx="10" ry="5" fill="#2a2725"/><ellipse cx="192" cy="86" rx="10" ry="5" fill="#2a2725"/>`;
  s += `<ellipse cx="100" cy="90" rx="92" ry="38" fill="#1f1d1c"/><ellipse cx="100" cy="86" rx="92" ry="38" fill="#3a3633"/><ellipse cx="100" cy="86" rx="84" ry="32" fill="url(#rice)"/>`;
  const inE = () => { let x, y; do { x = r() * 2 - 1; y = r() * 2 - 1; } while (x * x + y * y > .8); return [100 + x * 84, 86 + y * 32]; };
  for (let i = 0; i < 150; i++) { const [x, y] = inE(); s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.6" ry=".8" fill="${r() < .5 ? '#fbe08a' : '#c07e18'}" transform="rotate(${(r() * 180) | 0} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }
  for (let i = 0; i < 7; i++) { const [x, y] = inE(); s += `<path d="M${x} ${y} l${8 + r() * 6} ${r() * 4 - 2}" stroke="#c8321e" stroke-width="3" stroke-linecap="round"/>`; }
  for (let i = 0; i < 16; i++) { const [x, y] = inE(); s += `<circle cx="${x}" cy="${y}" r="2.6" fill="#6fa83a"/>`; }
  for (let i = 0; i < 5; i++) { const [x, y] = inE(); s += `<g transform="rotate(${(r() * 360) | 0} ${x} ${y})"><ellipse cx="${x}" cy="${y}" rx="8" ry="4.5" fill="#1e1d2b" stroke="#4a4a66" stroke-width="1"/><ellipse cx="${x + 1}" cy="${y}" rx="4" ry="2" fill="#f0a35a"/></g>`; }
  for (let i = 0; i < 5; i++) { const [x, y] = inE(); s += `<g transform="rotate(${(r() * 360) | 0} ${x} ${y})"><path d="M${x - 7} ${y} a7 6 0 1 1 9 5" stroke="#f07a45" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${x + 2} ${y + 5} l4 3 l-1 -5z" fill="#e25a2a"/></g>`; }
  s += `<path d="M150 70 a12 12 0 0 1 22 8 z" fill="#f5e15a" stroke="#fff6c0" stroke-width="1.5"/><path d="M34 92 a12 12 0 0 0 20 10 z" fill="#f5e15a" stroke="#fff6c0" stroke-width="1.5"/>`;
  s += `<ellipse cx="100" cy="86" rx="91" ry="37" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/>`;
  return s;
}
$('#paellaSvg').innerHTML = paella();

/* silhouettes du bar */
const SIL = {
  m: 'M50 15a13 13 0 1 1 0 26a13 13 0 1 1 0-26Z M50 44C30 44 22 52 20 66L15 150L25 152L28 112L30 260H48L50 165L52 260H70L72 112L75 152L85 150L80 66C78 52 70 44 50 44Z',
  w: 'M50 16a12 13 0 1 1 0 26a12 13 0 1 1 0-26Z M36 28C34 10 66 10 64 28C66 40 68 50 66 58L34 58C32 50 34 40 36 28Z M50 50C38 50 33 56 32 66L28 100C30 106 34 110 37 114L33 140L18 260H82L67 140L63 114C66 110 70 106 72 100L68 66C67 56 62 50 50 50Z',
  dina: 'M50 16a12 13.5 0 1 1 0 27a12 13.5 0 1 1 0-27Z M37 30C33 8 68 6 64 30C66 46 74 62 71 80C66 72 62 66 60 60L40 60C38 66 34 72 29 80C26 62 34 46 37 30Z M50 52C39 52 34 57 33 66L30 98C31 104 35 109 38 113L35 138L22 258C40 262 60 262 78 258L65 138L62 113C65 109 69 104 70 98L67 66C66 57 61 52 50 52Z'
};
function buildBar() {
  const bk = $('#bokehs'); bk.innerHTML = '';
  const cols = ['255,190,110', '255,140,120', '242,216,152', '255,110,140', '255,220,170'];
  for (let i = 0; i < 16; i++) {
    const d = document.createElement('div'); d.className = 'bokeh'; const sz = rand(30, 120);
    Object.assign(d.style, { width: sz + 'px', height: sz + 'px', left: rand(-5, 95) + '%', top: rand(2, 62) + '%', opacity: rand(.35, .8), animationDelay: -rand(0, 7) + 's',
      background: `radial-gradient(circle, rgba(${cols[i % 5]},.9) 0%, rgba(${cols[i % 5]},.35) 45%, transparent 70%)` });
    bk.appendChild(d);
  }
  const crowd = $('#crowd'); $$('.person', crowd).forEach(p => p.remove());
  const layout = [[-4, 'm', .82, 0], [8, 'w', .74, 1], [20, 'm', .9, 0], [31, 'w', .8, 1], [42, 'dina', .88, 2], [56, 'm', .86, 0], [67, 'w', .78, 1], [78, 'm', .92, 0], [89, 'w', .76, 1]];
  layout.forEach(([x, k, h, z], i) => {
    const p = document.createElement('div'); p.className = 'person sway' + (k === 'dina' ? ' her' : '');
    Object.assign(p.style, { left: x + '%', width: '16%', height: (h * 100) + '%', zIndex: z, animationDelay: -rand(0, 3) + 's', animationDuration: rand(2.6, 4) + 's' });
    const fill = k === 'dina' ? 'url(#herG)' : ['#2a1218', '#331722', '#24100f'][i % 3];
    p.innerHTML = `<svg viewBox="0 0 100 260" preserveAspectRatio="xMidYMax meet">${k === 'dina' ? '<defs><linearGradient id="herG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1018"/><stop offset="1" stop-color="#1a070d"/></linearGradient></defs>' : ''}<path d="${SIL[k]}" fill="${fill}" ${k === 'dina' ? 'stroke="#d8b36a" stroke-width="0" class="herpath"' : ''}/></svg>`;
    crowd.appendChild(p);
  });
}

/* =========================================================
   0. ENVELOPPE
   ========================================================= */
let opened = false;
async function openEnvelope() {
  if (opened) return; opened = true;
  A.init(); A.seal();
  $('#envelope').classList.add('opened'); $('#envHint').style.opacity = 0;
  setTimeout(() => A.paper(), 450);
  A.startMusic(); muteBtn.classList.add('show');
  burst(...centerOf($('#seal')), 26, 'gold');
  await sleep(2900);
  startBar();
}
$('#seal').addEventListener('click', openEnvelope);
$('#envelope').addEventListener('click', openEnvelope);

/* =========================================================
   1. MERCREDI SOIR
   ========================================================= */
async function startBar() {
  buildBar(); go('s-bar');
  A.startMurmur();
  await sleep(1200); $('[data-l="1"]').classList.add('on');
  await sleep(1600); $('[data-l="2"]').classList.add('on');
  await sleep(1400); const b = $('#barBtn'); b.style.opacity = 1; b.textContent = 'Et puis…'; b.onclick = lightsOut;
}
let lightsDone = false;
async function lightsOut() {
  const b = $('#barBtn'); b.onclick = null; b.style.opacity = 0; A.tap();
  A.duck(true);
  $$('[data-l="1"],[data-l="2"]').forEach(e => e.classList.remove('on'));
  const bok = $$('.bokeh').sort(() => Math.random() - .5);
  const ppl = $$('.person:not(.her)').sort(() => Math.random() - .5);
  const total = bok.length;
  for (let i = 0; i < total; i++) {
    bok[i].classList.add('off'); A.click(); A.murmurTo(1 - (i + 1) / total);
    if (i % 2 === 1 && ppl.length) ppl.pop().classList.add('gone');
    await sleep(i < 4 ? 520 : 300);
  }
  ppl.forEach(p => p.classList.add('gone'));
  A.stopMurmur();
  await sleep(900);
  $('#spot').classList.add('on'); A.chime(74);
  const her = $('.person.her'); her.classList.add('lit'); her.classList.remove('sway');
  $('.herpath').setAttribute('stroke-width', '1.2');
  await sleep(900); $('[data-l="3"]').classList.add('on');
  await sleep(1800); $('[data-l="4"]').classList.add('on');
  await sleep(1400); $('#herName').classList.add('on'); A.sparkle();
  A.duck(false); lightsDone = true;
  await sleep(1400); b.textContent = 'Yalla, on continue'; b.style.opacity = 1; b.onclick = () => { b.onclick = null; A.tap(); go('s-resto'); };
}
document.addEventListener('click', e => {
  const her = e.target.closest('.person.her');
  if (her && lightsDone) { burst(e.clientX, e.clientY, 22, 'heart'); A.sparkle(); toast('Oui, c\'est bien toi. ✨'); }
});

/* =========================================================
   2. LE RESTAURANT
   ========================================================= */
const order = {};
$$('.menu-items').forEach(ul => ul.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('button', ul).forEach(x => x.classList.remove('sel')); b.classList.add('sel'); A.tap();
  order[ul.dataset.group] = b.dataset.v;
  const ok = order.drink && order.dish; const ob = $('#orderBtn'); ob.disabled = !ok; ob.classList.toggle('solid', !!ok);
}));
let candleTaps = 0;
$('#candle').addEventListener('click', () => {
  candleTaps++; A.tap();
  if (candleTaps === 3) {
    const c = $('#candle'); c.classList.add('out'); A.noiseHit(A.now(), 'lowpass', 600, .5, .25, .3);
    toast('Même la bougie a le trac.'); setTimeout(() => { c.classList.remove('out'); A.sparkle(); }, 1800); candleTaps = 0;
  }
});
const story = $('#story');
const say = (html, cls = '') => { const p = document.createElement('p'); p.className = 'fade-line ' + cls; p.innerHTML = html; story.appendChild(p); requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('on'))); return p; };
async function typeInto(el, text, speed = 42) { el.classList.add('typing'); for (const ch of text) { el.lastChild.textContent += ch; await sleep(ch === ',' ? 260 : ch === '.' ? 360 : speed); } el.classList.remove('typing'); }

$('#orderBtn').addEventListener('click', async () => {
  A.tap();
  const menu = $('#menu'); menu.style.transition = 'opacity .8s, transform .8s'; menu.style.opacity = 0; menu.style.transform = 'translateY(30px)';
  await sleep(800); menu.style.display = 'none';
  const tv = $('#tableView'); tv.style.display = 'flex'; $('#s-resto').scrollTop = 0;
  say(`<em>Le serveur note :</em> « ${order.drink} et ${order.dish}. Très bien, madame. »`);
  await sleep(2600);
  say('…');
  await sleep(1300);
  $('#glass').classList.add('in'); A.whoosh(false);
  await sleep(1300); $('#glass').classList.add('filled'); A.pour();
  await sleep(1400); $('#plate').classList.add('in'); A.whoosh(false);
  await sleep(1700); $('#cloche').classList.add('up'); A.shing(); $('#servedRow').classList.add('served');
  burst(...centerOf($('#plate')), 18, 'gold');
  story.innerHTML = '';
  say('Un verre de <b>vin blanc</b>. Une <b>paella</b>.');
  await sleep(1500);
  say('<span class="script" style="font-size:34px">Sahtein !</span> <small style="color:var(--muted)">(bon appétit)</small>');
  await sleep(1800);
  say('Mais… ce n\'est pas du tout ce que tu as commandé.');
  await sleep(2000);
  A.noiseHit(A.now(), 'highpass', 3500, .5, .07, 1.2, .5);
  const w = document.createElement('div'); w.className = 'whisper fade-line'; w.innerHTML = '<span class="who">Le serveur, à ton oreille</span><span></span>';
  story.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  await sleep(500);
  await typeInto(w, "C'est le jeune homme derrière vous qui a changé le menu, il y a dix minutes, pour vous.");
  await sleep(900);
  const p = say('<button class="btn solid pulse" id="turnBtn">Te retourner</button>');
  $('#turnBtn').addEventListener('click', turnAround, { once: true });
});

let called = false;
async function turnAround() {
  A.tap();
  if (!called) { called = true; A.heartbeat(2); await sleep(900); await aminataCall(); }
  A.heartbeat(3);
  const b = $('#turnBtn'); if (b) b.remove();
  $('#s-resto').classList.add('turning');
  await sleep(1500);
  $('#s-resto').classList.remove('turning');
  go('s-reveal'); A.clink();
  await sleep(600); burst(W / 2, H * 0.32, 30, 'gold');
}
/* photo optionnelle : déposer yohann.jpg à côté de index.html */
const img = $('#himPhoto');
img.addEventListener('load', () => { img.hidden = false; $('#himSvg').style.display = 'none'; });
let himTaps = 0;
$('#him').addEventListener('click', () => {
  const lines = ['Non, je ne montre pas mes pieds. Pas au premier rendez-vous. Enfin… plus.', 'Toujours pas.', 'Insistante, hein ? J\'aime bien.', 'Bon. Peut-être au deuxième rendez-vous. 🦶'];
  toast(lines[Math.min(himTaps++, lines.length - 1)], 3200); A.tap();
});
$('#toHub').addEventListener('click', () => { A.tap(); buildHub(); go('s-hub'); });

/* ---------- l'appel d'Aminata (au pire moment) ---------- */
function aminataCall() {
  return new Promise(resolve => {
    const call = $('#call'), msg = $('#callMsg'), btns = $('#callBtns');
    msg.textContent = ''; btns.style.display = ''; $('#callSub').textContent = 'appel audio WhatsApp…';
    call.classList.add('show'); A.duck(true); A.ring(true);
    if (navigator.vibrate) try { navigator.vibrate([400, 200, 400]); } catch (e) {}
    const end = async (lines, sub) => {
      A.ring(false); btns.style.display = 'none';
      for (const l of lines) { msg.textContent = l; A.tap(); await sleep(Math.max(2000, l.length * 55)); }
      A.hangup(); $('#callSub').textContent = sub; await sleep(1200);
      call.classList.remove('show'); A.duck(false);
      toast('Où en étions-nous ? Ah oui… derrière toi.', 3000);
      await sleep(700); resolve();
    };
    $('#callYes').onclick = () => { $('#callSub').textContent = 'en cours · 00:0' + Math.ceil(rand(1, 9)); end([
      '« Allôôô ?! Alors, raconte, il est comment ? »',
      '« Attends… t\'es dans un restaurant, là ? Et tu décroches ?! »',
      '« Bon je te laisse. On s\'appelle ce soir : trois heures minimum, comme d\'hab. Bisous ! »'
    ], 'Appel terminé'); };
    $('#callNo').onclick = () => end([
      'Appel refusé.',
      'Aminata vous a laissé un message vocal.\nDurée : 2 h 47 min.',
      '(Tu l\'écouteras plus tard. Pour l\'instant, quelqu\'un t\'attend.)'
    ], 'Message vocal reçu');
  });
}

/* =========================================================
   3. LE SALON DES SURPRISES
   ========================================================= */
const CEDAR_ICO = `<svg viewBox="0 0 100 100" width="38" height="38">${cedar('#e9c983')}</svg>`;
const CARDS = [
  { id: 'psy', ico: '🛋️', t: 'Le divan', s: 'Séance de psy inversée' },
  { id: 'compat', ico: '💞', t: 'Compatibilité', s: 'Calcul 100 % scientifique' },
  { id: 'feet', ico: '🦶', t: 'Le test des pieds', s: 'Égyptien, grec ou romain ?' },
  { id: 'video', ico: '💃', t: 'La vidéo de danse', s: 'Enfin ?' },
  { id: 'juke', ico: '🎶', t: 'Le juke-box', s: 'Les musiques du matin' },
  { id: 'liban', ico: CEDAR_ICO, t: 'Leçon de libanais', s: 'Niveau : très débutant' },
  { id: 'thalia', ico: '🌸', t: 'Petite parenthèse', s: 'Un prénom qui fleurit' },
  { id: 'bill', ico: '🧾', t: 'L\'addition', s: '…et un dernier mot', wide: true }
];
const done = new Set();
let hubBuilt = false;
function buildHub() {
  if (hubBuilt) return; hubBuilt = true;
  const box = $('#cards');
  CARDS.forEach((c, i) => {
    const b = document.createElement('button'); b.className = 'card' + (c.wide ? ' wide' : ''); b.dataset.id = c.id;
    b.style.animationDelay = (i * 0.09) + 's';
    b.innerHTML = `<span class="ico">${c.ico}</span><b>${c.t}</b><small>${c.s}</small>`;
    b.addEventListener('click', () => openModal(c.id));
    box.appendChild(b);
  });
}
function markDone(id) {
  if (done.has(id)) return; done.add(id);
  const c = $(`.card[data-id="${id}"]`); if (c) c.classList.add('done');
  const n = [...done].filter(x => x !== 'bill').length;
  $('#prog').style.width = (n / 7 * 100) + '%';
  if (n >= 4) $('.card.wide').classList.add('ready');
}
let opens = 0;
function openModal(id) {
  A.tap(); opens++;
  const body = $('#mBody'); body.innerHTML = '';
  $('#modal').classList.add('show'); $('#modal .sheet').scrollTop = 0;
  MODALS[id](body);
  if (id !== 'bill') markDone(id);
}
function closeModal() {
  $('#modal').classList.remove('show'); $('#mBody').innerHTML = ''; A.tap();
  if (opens === 2 && !notified.a) { notified.a = 1; setTimeout(() => notif('Alors ?? Raconte-moi TOUT 👀'), 900); }
  if (done.size >= 5 && !notified.b) { notified.b = 1; setTimeout(() => notif('Je t\'appelle dans 5 min. Ou dans 3 heures, on verra 📞'), 900); }
}
const notified = {};
$('#modal .close').addEventListener('click', closeModal);
$('#modal .backdrop').addEventListener('click', closeModal);

const MODALS = {
  /* ----- séance de psy inversée ----- */
  psy(b) {
    const Q = [
      { q: 'Installez-vous. Depuis quand ressentez-vous ces symptômes ?', a: [
        ['Depuis un mercredi soir', 'Intéressant. Le mercredi, en milieu de semaine. Le cœur n\'a même pas attendu le week-end.'],
        ['Depuis à peu près une semaine', 'Une semaine… et déjà installée sur le divan. Je note : évolution rapide.'],
        ['Je ne vois pas de quoi vous parlez', 'Déni classique. Votre sourire vous trahit, madame.']] },
      { q: 'Le matin, quand votre téléphone vibre, vous ressentez…', a: [
        ['Un petit sourire', 'Réflexe conditionné. Pavlov serait fier, et moi aussi.'],
        ['Une envie de musique', 'Normal : la dose quotidienne est livrée chaque matin.'],
        ['De l\'agacement', 'Mensonge détecté. Le stylo a fait un bond.']] },
      { q: 'Associations libres. Je dis « pieds », vous pensez…', a: [
        ['Égyptiens', 'Hmm. Ce sujet semble beaucoup intéresser… quelqu\'un.'],
        ['Danger', 'Réaction saine. Il les a montrés dès le premier soir.'],
        ['Je refuse de répondre', 'Refoulement. On en reparlera à la prochaine séance.']] },
      { q: 'Combien d\'heures par jour passez-vous au téléphone avec Aminata ?', a: [
        ['Une petite heure', 'Je vais écrire « trois ». Pour l\'honnêteté du dossier.'],
        ['Trois heures, facile', 'Merci pour cette franchise. Le forfait illimité vous remercie.'],
        ['La question est indiscrète', 'Elle l\'est. Mais vous avez souri en lisant le nom.']] },
      { q: 'Et ce monsieur qui chante au karaoké le jeudi soir…', a: [
        ['Il chante bien', 'Je transmets. Il va être insupportable.'],
        ['Il chante fort', 'C\'est ce qu\'on appelle de la conviction.'],
        ['Il chante… surtout', 'Diagnostic : complicité avancée. Taquinerie chronique.']] }
    ];
    let i = 0;
    b.innerHTML = `<p class="kicker" style="text-align:left">Cabinet du Dr Yohann · diplômé de rien</p>
      <h3 class="m-title">Séance de psy inversée</h3>
      <p class="m-sub">Pour une fois, c'est toi sur le divan. Détends-toi, je prends des notes.</p>
      <svg class="divan" viewBox="0 0 300 110" aria-hidden="true">
        <path d="M30 70 C30 40 50 30 70 34 L80 70 Z" fill="#8e1f35"/><rect x="40" y="66" width="230" height="22" rx="8" fill="#6b1426"/>
        <rect x="70" y="56" width="200" height="16" rx="7" fill="#8e1f35"/><ellipse cx="62" cy="52" rx="16" ry="9" fill="#f3e6c9"/>
        <rect x="52" y="86" width="6" height="16" fill="#d8b36a"/><rect x="254" y="86" width="6" height="16" fill="#d8b36a"/>
        <path d="M30 70 C30 40 50 30 70 34" stroke="#d8b36a" stroke-width="1.5" fill="none"/></svg>
      <div id="psyQ"></div>`;
    const box = $('#psyQ', b);
    const show = () => {
      const q = Q[i];
      box.innerHTML = `<p class="step-count">Question ${i + 1} / ${Q.length}</p><p style="font-size:21px;margin:.3em 0">${q.q}</p><div class="choices">${q.a.map((x, k) => `<button class="choice" data-k="${k}">${x[0]}</button>`).join('')}</div><div id="psyN"></div>`;
      $$('.choice', box).forEach(c => c.addEventListener('click', () => {
        if (box.dataset.lock) return; box.dataset.lock = 1; c.classList.add('picked'); A.tap();
        $('#psyN', box).innerHTML = `<div class="doc-note">✎ ${q.a[c.dataset.k][1]}</div><button class="btn" id="psyNext">${i < Q.length - 1 ? 'Question suivante' : 'Voir le diagnostic'}</button>`;
        $('#psyNext', box).addEventListener('click', () => { delete box.dataset.lock; A.tap(); i++; i < Q.length ? show() : diag(); });
      }));
    };
    const diag = () => {
      A.chime(72);
      box.innerHTML = `<div class="prescription">
        <h4>Ordonnance</h4>
        <p><b>Patiente :</b> Dina, 42 ans. Psychologue (oui, je sais).</p>
        <p><b>Diagnostic :</b> coup de foudre, forme aiguë, probablement contagieuse.</p>
        <p><b>Pronostic :</b> excellent.</p>
        <p><b>Traitement :</b> une chanson chaque matin, à prendre avant le café.</p>
        <p><b>Effets secondaires :</b> sourires inexpliqués devant son téléphone.</p>
        <p><b>Contre-indications :</b> aucune connue à ce jour.</p>
        <p><b>Prochaine séance :</b> à convenir. Honoraires : un verre de vin blanc.</p>
        <div class="sig">Dr Yohann</div>
        <div class="stamp">Pronostic<br>excellent</div></div>
        <p class="center m-sub">Tu peux reprendre ton fauteuil de psy, j'ai fini.</p>`;
      setTimeout(() => burst(W / 2, H * 0.5, 26, 'heart'), 700);
    };
    show();
  },

  /* ----- calculateur de compatibilité (truqué) ----- */
  compat(b) {
    b.innerHTML = `<h3 class="m-title">Calculateur de compatibilité</h3>
      <p class="m-sub">Méthode certifiée par aucun laboratoire.</p>
      <div class="compat-fields"><input id="n1" value="Dina" maxlength="18" aria-label="Premier prénom"><span>♥</span><input id="n2" value="Yohann" maxlength="18" aria-label="Second prénom"></div>
      <p class="center"><button class="btn solid" id="calc">Calculer</button></p>
      <div class="gauge"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" stroke="rgba(216,179,106,.18)" stroke-width="7" fill="none"/>
        <circle id="arc" cx="50" cy="50" r="44" stroke="url(#gg)" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="276.5"/>
        <defs><linearGradient id="gg"><stop offset="0" stop-color="#8e1f35"/><stop offset="1" stop-color="#f2d898"/></linearGradient></defs></svg><div class="val" id="pct">?</div></div>
      <div class="calc-lines" id="lines"></div>`;
    let busy = false;
    $('#calc', b).addEventListener('click', async () => {
      if (busy) return; busy = true; A.tap();
      const n1 = $('#n1', b).value.trim(), n2 = $('#n2', b).value.trim();
      const all = (n1 + ' ' + n2).toLowerCase();
      const lines = $('#lines', b); lines.innerHTML = '';
      const add = async (t, ms = 800) => { const d = document.createElement('div'); d.textContent = t; lines.appendChild(d); A.tone(A.f(rand(76, 88) | 0), A.now(), .04, .2, 'sine', .2); await sleep(ms); };
      $('#pct', b).textContent = '…'; $('#arc', b).style.transition = 'none'; $('#arc', b).style.strokeDashoffset = 276.5;
      if (all.includes('jordan')) {
        await add('Prénom détecté : Jordan.', 1100);
        await add('Coucou Jordan 👋 rien de personnel :', 1000);
        await add('cette machine a été programmée un mercredi soir.', 1300);
        await add('Retour aux valeurs d\'usine : Dina ♥ Yohann.', 900);
        $('#n1', b).value = 'Dina'; $('#n2', b).value = 'Yohann';
      } else if (!/dina/.test(all) || !/yohann|yoh/.test(all)) {
        await add('Hmm. Ces prénoms ne sont pas dans la base.', 1000);
        await add('La machine ne connaît que deux prénoms. Correction automatique…', 1100);
        $('#n1', b).value = 'Dina'; $('#n2', b).value = 'Yohann';
      }
      await add('42 + 42 = 84');
      await add('8 + 4 = 12, comme les douze coups de minuit');
      await add('Mercredi × coup de foudre = ∞');
      await add('Bonus pieds égyptiens : + 0,01 %');
      await add('Arrondi par un chanteur de karaoké…', 600);
      const arc = $('#arc', b); arc.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(.3,.7,.2,1)'; arc.style.strokeDashoffset = 0;
      const pct = $('#pct', b); const t0 = performance.now();
      await new Promise(res => { const st = () => { const k = Math.min(1, (performance.now() - t0) / 2200); const v = Math.round(100 * (1 - Math.pow(1 - k, 3))); pct.textContent = v + ' %'; if (k < 1) requestAnimationFrame(st); else res(); }; st(); });
      A.chime(76); burst(...centerOf(pct), 34, 'heart');
      await add('Résultat garanti. Marge d\'erreur : 0 %. Recours : aucun.', 0);
      busy = false;
    });
  },

  /* ----- test des pieds ----- */
  feet(b) {
    const foot = (o, lab) => { const xs = [20, 36, 50, 62, 72], rs = [8, 6.2, 5.6, 5, 4.4]; let s = `<path d="M10 40 Q12 26 46 24 Q80 22 80 40 Q78 58 45 58 Q14 58 10 40Z" fill="#8e1f35" stroke="#d8b36a" stroke-width="1"/>`; xs.forEach((x, i) => { s += `<circle cx="${x}" cy="${18 + o[i]}" r="${rs[i]}" fill="#f3e6c9" stroke="#d8b36a" stroke-width="1"/>`; }); return `<figure><svg viewBox="0 0 90 62">${s}</svg>${lab}</figure>`; };
    b.innerHTML = `<h3 class="m-title">Quel type de pieds as-tu ?</h3>
      <p class="m-sub">Un test très sérieux, conçu par un spécialiste autoproclamé.</p>
      <div class="feet">${foot([0, 4, 8, 12, 16], 'Égyptien')}${foot([4, 0, 6, 11, 16], 'Grec')}${foot([0, 0, 1, 8, 15], 'Romain')}</div>
      <div id="fq"></div>`;
    const Q = [
      { q: 'Regarde tes pieds (oui, maintenant). Quel orteil est le plus long ?', a: [['Le gros orteil, et les autres descendent en pente douce', 'e'], ['Le deuxième, il dépasse tout le monde', 'g'], ['Les trois premiers, presque à égalité', 'r']] },
      { q: 'Tes chaussures idéales pour un mercredi soir ?', a: [['Des sandales élégantes', 'e'], ['Des escarpins', 'g'], ['Pieds nus, pour danser', 'r']] },
      { q: 'Selon toi, un pied, c\'est fait pour…', a: [['Danser', 'r'], ['Marcher sur la plage', 'g'], ['Être montré à une inconnue dans un bar', 'e']] }
    ];
    const score = { e: 0, g: 0, r: 0 }; let i = 0; const box = $('#fq', b);
    const show = () => {
      const q = Q[i];
      box.innerHTML = `<p class="step-count">Question ${i + 1} / 3</p><p style="font-size:21px;margin:.3em 0">${q.q}</p><div class="choices">${q.a.map(x => `<button class="choice" data-v="${x[1]}">${x[0]}</button>`).join('')}</div>`;
      $$('.choice', box).forEach(c => c.addEventListener('click', async () => {
        c.classList.add('picked'); A.tap(); score[c.dataset.v] += i === 0 ? 3 : 1; await sleep(350); i++; i < Q.length ? show() : res();
      }));
    };
    const res = () => {
      const k = Object.keys(score).sort((x, y) => score[y] - score[x])[0];
      const R = {
        e: ['Pied égyptien', 'Les orteils descendent en pente douce, comme sur les fresques des pharaons. Statistiquement le plus répandu. Scientifiquement le plus apprécié par un certain Yohann.', 'Jackpot. Quelqu\'un, quelque part, vient de sourire très fort.'],
        g: ['Pied grec', 'Le deuxième orteil dépasse : le pied des statues antiques et des déesses. Très élégant.', 'Yohann est en train de reconsidérer toutes ses préférences.'],
        r: ['Pied romain', 'Trois orteils presque alignés : un pied solide, carré, taillé pour danser des heures.', 'Yohann note : « intéressant… très intéressant ». Il demande une démonstration. En vidéo, par exemple.']
      }[k];
      A.chime(74); burst(W / 2, H * 0.45, 24, 'gold');
      box.innerHTML = `<p class="kicker" style="margin-top:14px">Résultat</p><div class="result-big">${R[0]}</div><p>${R[1]}</p><div class="doc-note">${R[2]}</div>
        <p class="m-sub center" style="margin-top:14px">Pour info, le jury est composé d'un seul membre, et il est très partial.</p>`;
    };
    show();
  },

  /* ----- le bouton de la vidéo qui s'enfuit ----- */
  video(b) {
    b.innerHTML = `<h3 class="m-title">La fameuse vidéo de danse</h3>
      <p class="m-sub">Tournée. Jamais envoyée. Toujours réclamée. Le moment est venu : il suffit d'appuyer.</p>
      <div class="flee-zone" id="zone"><button class="btn solid" id="fleeBtn">Envoyer enfin la vidéo de danse 💃</button><div class="flee-msg" id="fleeMsg"></div></div>
      <div id="fleeEnd"></div>`;
    const zone = $('#zone', b), btn = $('#fleeBtn', b), msg = $('#fleeMsg', b);
    const M = ['Presque !', 'Trop lente 😏', 'Le bouton est timide…', 'Il a vu la vidéo, il est impressionné.', 'Ce bouton danse mieux que moi.', 'Encore un petit effort…', 'Ok, ok… il commence à fatiguer.'];
    let n = 0, tired = false;
    const flee = e => {
      if (tired) return; if (e) { e.preventDefault(); e.stopPropagation(); }
      const zr = zone.getBoundingClientRect(), br = btn.getBoundingClientRect();
      const mx = Math.max(10, zr.width - br.width - 10), my = Math.max(10, zr.height - br.height - 50);
      let x, y, tries = 0; const cx = br.left - zr.left, cy = br.top - zr.top;
      do { x = rand(10, mx); y = rand(10, my); tries++; } while (Math.hypot(x - cx, y - cy) < 110 && tries < 20);
      btn.style.transform = `rotate(${rand(-8, 8)}deg)`; btn.style.left = x + 'px'; btn.style.top = y + 'px';
      A.tone(A.f(84 + (n % 5) * 2), A.now(), .06, .12, 'triangle', 0); A.tone(A.f(91 + (n % 5)), A.now() + .06, .05, .1, 'triangle', 0);
      msg.textContent = M[Math.min(n, M.length - 1)]; n++;
      if (n >= 8) giveUp();
    };
    const giveUp = async () => {
      tired = true; await sleep(350);
      btn.style.left = '50%'; btn.style.top = '45%'; btn.style.transform = 'translate(-50%,-50%) rotate(-4deg)';
      btn.textContent = 'Bon. J\'abandonne. 😮‍💨'; btn.classList.remove('solid'); btn.style.pointerEvents = 'none';
      msg.textContent = 'Le bouton a déclaré forfait. Il te laisse faire le reste toi-même…';
      A.hangup();
      await sleep(900);
      $('#fleeEnd', b).innerHTML = `<p class="center"><a class="btn solid pulse" href="${wa('Bon… d\'accord. Voici la vidéo de danse 💃 (le bouton a gagné)')}" target="_blank" rel="noopener">Envoyer la vidéo, pour de vrai</a></p>
        <p class="center m-sub">(Ce bouton-là ne s'enfuit pas. Aucune excuse.)</p>`;
    };
    btn.addEventListener('pointerdown', flee);
    let lastFlee = 0;
    zone.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || tired || performance.now() - lastFlee < 350) return;
      const r = btn.getBoundingClientRect();
      if (e.clientX > r.left - 30 && e.clientX < r.right + 30 && e.clientY > r.top - 30 && e.clientY < r.bottom + 30) { lastFlee = performance.now(); flee(); }
    });
    btn.addEventListener('click', e => { e.preventDefault(); flee(e); });
    btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') flee(e); });
  },

  /* ----- juke-box des musiques du matin ----- */
  juke(b) {
    const T = [
      { n: 'N° 1', t: 'Dansé', a: 'Kemmler', q: 'Kemmler Dansé' },
      { n: 'N° 2', t: 'Put*** Désolé', a: 'Kemmler', q: 'Kemmler Désolé' }
    ];
    b.innerHTML = `<h3 class="m-title">Le juke-box du matin</h3>
      <p class="m-sub">Chaque matin, une musique. Certaines choses se disent mieux en mélodie.</p>
      <div class="jukebox"><div class="body"><div class="arch"><div class="vinyl" id="vinyl"></div></div><div class="grille"></div></div></div>
      <div class="tracks">${T.map((x, i) => `<button class="track" data-i="${i}"><span class="num">${x.n}</span><span><b>${x.t}</b><span>${x.a}</span></span></button>`).join('')}</div>
      <div class="now" id="now"><span class="m-sub">Choisis un morceau…</span></div>
      <div class="ticket" id="ticket"><div class="main"><small>Admet une danseuse</small><h4>Karaoké, jeudi soir</h4><p>Tu danses, je chante.</p><div class="fine">Valable tous les jeudis · non remboursable · fortement recommandé</div></div><div class="stub">Touche<br>pour<br>valider</div></div>
      <p class="center m-sub" style="font-size:15px">Les prochaines musiques ? Demain matin, comme d'habitude.</p>`;
    $$('.track', b).forEach(tr => tr.addEventListener('click', () => {
      $$('.track', b).forEach(x => x.classList.remove('on')); tr.classList.add('on');
      const x = T[tr.dataset.i]; $('#vinyl', b).classList.add('spin'); A.tap();
      A.noiseHit(A.now(), 'lowpass', 900, .5, .05, .4);
      $('#now', b).innerHTML = `<p class="kicker">Musique du matin ${x.n}</p><p style="margin:0 0 8px"><b>${x.a}</b> · ${x.t}</p><a class="btn" href="https://www.youtube.com/results?search_query=${encodeURIComponent(x.q)}" target="_blank" rel="noopener">Écouter sur YouTube ↗</a>`;
    }));
    $('#ticket', b).addEventListener('click', e => {
      const t = e.currentTarget; if (t.classList.contains('torn')) return;
      t.classList.add('torn'); A.paper(); A.sparkle(); burst(...centerOf(t), 20, 'gold');
      toast('Ticket validé. Rendez-vous jeudi 🎤', 3000);
    });
  },

  /* ----- leçon de libanais ----- */
  liban(b) {
    const L = [
      ['Yalla', 'يلّا', '« Allez, on y va ! » Le mot que j\'ai glissé sur les boutons de cette page.'],
      ['Sahtein', 'صحتين', '« Bon appétit », littéralement « deux santés ». Prononcé au moment de la paella.'],
      ['Kifik ?', 'كيفك', '« Comment tu vas ? », au féminin. J\'ai vérifié.'],
      ['Tikram 3aynik', 'تكرم عينك', '« Pour tes beaux yeux ». C\'est exactement pour ça que le menu a changé.']
    ];
    b.innerHTML = `<svg class="cedar-big" viewBox="0 0 100 100" aria-hidden="true">${cedar('#d8b36a')}</svg>
      <h3 class="m-title center">Leçon de libanais</h3>
      <p class="m-sub center">Niveau : très débutant. Touche un mot pour sa traduction.</p>
      <div class="lex">${L.map(x => `<button><span class="ar">${x[1]}</span><span class="w">${x[0]}</span><div class="def">${x[2]}</div></button>`).join('')}</div>
      <div class="doc-note">Accent de Yohann : approximatif. Bonne volonté : totale.</div>`;
    $$('.lex button', b).forEach(x => x.addEventListener('click', () => { x.classList.toggle('open'); A.tap(); }));
  },

  /* ----- Thalia ----- */
  thalia(b) {
    let petals = '';
    for (let i = 0; i < 6; i++) petals += `<g transform="rotate(${i * 60} 100 92)"><path class="petal" style="transition-delay:${i * .08}s" d="M100 92 C84 70 86 46 100 36 C114 46 116 70 100 92Z" fill="${i % 2 ? '#e8899b' : '#f1a7b5'}" stroke="#b8243f" stroke-width=".8"/></g>`;
    b.innerHTML = `<h3 class="m-title center">Une petite parenthèse</h3>
      <p class="m-sub center">Touche le bouton de fleur.</p>
      <svg class="bloom" id="bloom" viewBox="0 0 200 200" aria-hidden="true">
        <path d="M100 100 C98 140 102 165 100 196" stroke="#5c8a4a" stroke-width="4" fill="none"/>
        <path d="M100 150 C80 140 70 146 64 156 C78 162 90 160 100 150Z" fill="#5c8a4a"/><path d="M101 170 C120 160 132 164 138 174 C124 180 110 178 101 170Z" fill="#5c8a4a"/>
        ${petals}<circle cx="100" cy="92" r="9" fill="#f2d898" stroke="#d8b36a"/></svg>
      <div class="thalia-text center">
        <p class="kicker">Thalia</p>
        <p>Comme la Muse de la comédie, et l'une des trois Grâces, filles de Zeus.</p>
        <p>Son prénom vient d'un mot grec qui veut dire <em>« fleurir »</em>.</p>
        <p style="color:var(--gold-2)">Quatre ans, un prénom qui fait fleurir les journées… elle tient sûrement ça de sa maman.</p>
      </div>`;
    const bl = $('#bloom', b);
    bl.addEventListener('click', () => { if (bl.classList.contains('open')) return; bl.classList.add('open'); A.sparkle(); setTimeout(() => rain(26, 'petal'), 500); });
  },

  /* ----- l'addition ----- */
  bill(b) {
    const drink = order.drink || 'un Coca', dish = order.dish || 'une pizza';
    b.innerHTML = `<h3 class="m-title center">L'addition</h3>
      <div class="receipt">
        <h4>LE MERCREDI</h4><p class="c">Table 1 · Dina · servie par Yohann</p>
        <div class="row"><span>${cap(drink)} + ${dish}</span><span>annulé</span></div>
        <div class="row"><span>Vin blanc, cuvée spéciale</span><span>offert</span></div>
        <div class="row"><span>Paella</span><span>offerte</span></div>
        <div class="row"><span>Menu réécrit (10 min)</span><span>offert</span></div>
        <div class="row"><span>Séance sur le divan</span><span>gratuite</span></div>
        <div class="row"><span>Appel d'Aminata</span><span>2 h 47</span></div>
        <div class="row"><span>Vidéo de danse</span><span>en attente</span></div>
        <div class="row"><span>Coup de foudre</span><span>inestimable</span></div>
        <hr><div class="row tot"><span>TOTAL</span><span>1 sourire</span></div>
        <p class="c" style="margin-top:12px">Paiement accepté : une réponse sur WhatsApp.<br>Merci de votre visite. Revenez quand vous voulez.</p>
      </div>
      <p class="center"><button class="btn solid pulse" id="pay">Lire le dernier mot</button></p>`;
    A.paper();
    $('#pay', b).addEventListener('click', () => { closeModal(); toFinal(); });
  }
};

/* =========================================================
   4. FINAL
   ========================================================= */
const LETTER = [
  "Il y a des rencontres qu'on n'explique pas. Des instants qui ne durent que quelques secondes, mais qui changent quelque chose sans même nous demander notre avis.",
  "Ce mercredi soir, je ne savais pas que j'allais te rencontrer. Je ne savais pas non plus qu'en quelques minutes, quelqu'un pourrait prendre autant de place dans mes pensées.",
  "Depuis un peu plus d'une semaine, tu es devenue cette petite lumière dans mes journées. Celle qui me fait sourire en regardant mon téléphone, qui fait battre mon cœur à chaque notification et qui peut transformer une journée ordinaire en une belle journée.",
  "Tu es mon rayon de soleil, ma bonne humeur, cette jolie parenthèse que j'attends avec impatience chaque matin. Et si je t'envoie une musique tous les jours, c'est peut-être parce que certaines émotions sont plus faciles à partager en mélodie qu'avec des mots.",
  "Je ne sais pas de quoi demain sera fait, et je ne prétends pas connaître la suite de notre histoire. Mais je sais que cette rencontre m'a touché bien plus que je ne l'aurais imaginé.",
  "Tu as ce quelque chose qui ne ressemble à personne d'autre. Ton sourire, ton énergie, ta façon de parler, nos échanges, nos petites taquineries… Tout cela me plaît énormément.",
  "Alors je voulais simplement te dire merci. Merci pour ces sourires, cette complicité naissante et cette sensation délicieuse de découvrir quelqu'un qui nous fait du bien.",
  "Je ne sais pas si c'est le destin, le hasard ou simplement un mercredi soir qui avait décidé de me réserver une jolie surprise…",
  "Mais je suis sacrément heureux que nos chemins se soient croisés.",
  "Et entre nous, si je pouvais revivre cette soirée, je ne changerais absolument rien. Enfin… peut-être que je garderais mes pieds égyptiens pour une deuxième rencontre. ❤️"
];
$('#letterBody').innerHTML = LETTER.map(p => `<p>${p}</p>`).join('');
$('#waBtn').href = wa('Yohann… je viens d\'ouvrir ta lettre 💌 ');
let finalShown = false;
function toFinal() {
  go('s-final'); A.mode = 'final';
  if (!done.has('video')) $('#ps').textContent = 'P.-S. Il reste une surprise que tu n\'as pas ouverte dans le salon… celle avec la vidéo de danse. Je dis ça, je dis rien.';
  if (finalShown) return; finalShown = true;
  setTimeout(() => { rain(40, 'petal'); A.chime(74); }, 900);
  const scene = $('#s-final');
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { root: scene, threshold: 0.15 }) : null;
  $$('#letterBody p').forEach((p, i) => { if (io) io.observe(p); else p.classList.add('on'); });
  setTimeout(() => $$('#letterBody p').slice(0, 2).forEach(p => p.classList.add('on')), 1200);
}
$('#cedarMini').addEventListener('click', () => { rain(30, 'leaf'); A.sparkle(); toast('Kifik ya Dina ? (« Comment tu vas, Dina ? »)', 3200); });
$('#waBtn').addEventListener('click', () => { burst(...centerOf($('#waBtn')), 30, 'heart'); A.chime(79); });
$('#replay').addEventListener('click', () => location.reload());

/* accès direct pour vérification : ?scene=hub / ?scene=final */
const SC = new URLSearchParams(location.search).get('scene');
if (SC === 'hub') { buildHub(); go('s-hub'); muteBtn.classList.add('show'); }
if (SC === 'final') { buildHub(); toFinal(); muteBtn.classList.add('show'); }
if (SC === 'resto') { go('s-resto'); muteBtn.classList.add('show'); }
