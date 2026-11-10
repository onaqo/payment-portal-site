// AQ Pay homepage behaviour: reveals, counters and the looping portal mockups. No dependencies.
export function init() {
  const root = document.querySelector('#dc-root .aq') || document.querySelector('.aq'); if (!root) return () => {};
  const $ = (s, r = root) => r.querySelector(s), $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const still = !!window.__prerender, rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timers = new Set(), obs = [], offs = [];
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
  const sleep = ms => new Promise(r => later(r, ms));

  // pseudo QR (decorative, not scannable)
  $$('.qr').forEach((q, qi) => { let s = 7 + qi * 13, r = '', N = 21; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const finder = (x, y) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (finder(x, y)) continue; if (rnd() > .52) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }
    for (const [x, y] of [[0, 0], [14, 0], [0, 14]]) r += `<path d="M${x} ${y}h7v7h-7z M${x + 1} ${y + 1}v5h5v-5z M${x + 2} ${y + 2}h3v3h-3z" fill-rule="evenodd"/>`;
    q.innerHTML = `<svg viewBox="0 0 21 21" fill="#060A14" shape-rendering="crispEdges">${r}</svg>`; });

  // code panel text
  const REQ = `{\n  "amount": "49900",\n  "currency": "INR",\n  "paymentMethodType": "UPI",\n  "upi": { "flow": "intent" },\n  "confirm": true\n}`;
  const RES = `{\n  "status": "REQUIRES_ACTION",\n  "nextAction": {\n    "type": "upi_intent",\n    "uri": "upi://pay?…"\n  }\n}`;
  const HOOK = `{ "type": "payment_intent.succeeded" }`;
  const paint = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/("[^"]*")(\s*:)?/g, (m, a, b) => b ? `<span class="k">${a}</span>${b}` : `<span class="v">${a}</span>`).replace(/\b(true|false)\b/g, '<span class="m">$1</span>');
  const cReq = $('#c-req'), cRes = $('#c-res'), cHook = $('#c-hook');
  if (cReq) { cReq.innerHTML = paint(REQ); cRes.innerHTML = paint(RES); cHook.innerHTML = paint(HOOK); }

  if (still) { $$('.blk.wait').forEach(b => b.classList.remove('wait')); return () => {}; }
  root.classList.add('aq-js');

  // run `start` when visible, `stop` when not
  const watch = (el, start, stop, th = .3) => { if (!el) return; const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop && stop()), { threshold: th }); io.observe(el); obs.push(io); };
  const loop = (el, body) => { let on = false, gen = 0; watch(el, () => { if (on) return; on = true; const g = ++gen; (async () => { while (on && g === gen) await body(() => on && g === gen); })(); }, () => { on = false; }); };

  // reveal
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }); obs.push(rio);
  $$('.rv, .link').forEach(e => { if (e.classList.contains('st')) [...e.children].forEach((c, i) => c.style.setProperty('--i', i)); rio.observe(e); });

  // counters
  const fmt = (v, el) => (el.dataset.pre || '') + (el.dataset.dec ? v.toFixed(+el.dataset.dec) : Math.round(v).toLocaleString('en-IN')) + (el.dataset.suf || '');
  let counted = false; watch($('#hero-dash'), () => { if (counted || rm) return; counted = true; $$('[data-count]').forEach(el => { const to = +el.dataset.count, t0 = performance.now(); const tick = now => { const p = Math.min(1, (now - t0) / 900), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p); el.textContent = fmt(to * e, el); if (p < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }); }, null, .2);
  const toast = $('#hero-toast'); if (toast) later(() => toast.classList.add('show'), rm ? 0 : 2500);

  // magnetic CTA
  if (!rm && matchMedia('(pointer:fine)').matches) $$('.mag').forEach(b => { const mv = e => { const r = b.getBoundingClientRect(), x = (e.clientX - r.left - r.width / 2) / (r.width / 2), y = (e.clientY - r.top - r.height / 2) / (r.height / 2); b.style.transitionDuration = '.12s'; b.style.transform = `translate(${Math.max(-1, Math.min(1, x)) * 6}px,${Math.max(-1, Math.min(1, y)) * 6}px)`; }, out = () => { b.style.transitionDuration = ''; b.style.transform = ''; }; b.addEventListener('pointermove', mv); b.addEventListener('pointerleave', out); });

  // C. checkout flow
  const co = $('#co'); if (co) { const steps = $$('.step', co), dots = $$('.dots button', co), tEl = $('#co-t'), ok = $('#co-ok'); let i = 0, secs = 892, hold = 0;
    const show = n => { i = n; steps.forEach((s, k) => s.classList.toggle('on', k === n)); dots.forEach((d, k) => { d.classList.toggle('on', k === n); d.setAttribute('aria-pressed', k === n); }); if (n === 2 && ok) { ok.classList.remove('pop'); void ok.offsetWidth; ok.classList.add('pop'); } if (n === 1) secs = 892; };
    dots.forEach((d, k) => d.addEventListener('click', () => { hold = Date.now() + 8000; show(k); }));
    const iv = setInterval(() => { if (i === 1 && tEl) { secs = Math.max(0, secs - 1); tEl.textContent = String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0'); } }, 1000); offs.push(() => clearInterval(iv));
    if (!rm) loop(co, async alive => { await sleep(3200); if (alive() && Date.now() > hold) show((i + 1) % 3); }); }

  // D. routing flow
  const flow = $('#flow'); if (flow) { const N = {}; $$('[data-n]', flow).forEach(n => N[n.dataset.n] = n); const dot = $('.dot', flow); const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'wires'); svg.setAttribute('aria-hidden', 'true'); flow.insertBefore(svg, flow.firstChild); const P = {};
    const draw = () => { const fr = flow.getBoundingClientRect(); svg.innerHTML = ''; const box = n => { const r = N[n].getBoundingClientRect(); return { l: r.left - fr.left, r: r.right - fr.left, t: r.top - fr.top, b: r.bottom - fr.top, cx: r.left - fr.left + r.width / 2, cy: r.top - fr.top + r.height / 2 }; };
      for (const [a, b] of [['pay', 'risk'], ['risk', 'rules'], ['rules', 'p1'], ['rules', 'p2'], ['rules', 'p3']]) { const A = box(a), B = box(b), horiz = B.l > A.r - 4; let d;
        if (horiz) { const m = (A.r + B.l) / 2; d = `M${A.r} ${A.cy} C${m} ${A.cy},${m} ${B.cy},${B.l} ${B.cy}`; } else { const sx = b === 'p1' ? A.cx : b === 'p2' ? A.l + 22 : A.l + 8, ex = b === 'p1' ? B.cx : B.l; d = b === 'p1' || a !== 'rules' ? `M${A.cx} ${A.b} L${B.cx} ${B.t}` : `M${sx} ${A.b} C${sx - 14} ${A.b + 20},${ex - 16} ${B.cy},${ex} ${B.cy}`; }
        const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); if (b === 'p3') p.setAttribute('class', 'dash'); svg.appendChild(p); P[a + '>' + b] = p; } };
    draw(); const ro = new ResizeObserver(draw); ro.observe(flow); offs.push(() => ro.disconnect());
    const pts = (key, from = 0, to = 1, n = 14) => { const p = P[key], L = p.getTotalLength(), out = []; for (let k = 0; k <= n; k++) { const q = p.getPointAtLength(L * (from + (to - from) * k / n)); out.push(`translate(${q.x}px,${q.y}px)`); } return out; };
    const go = (frames, ms) => dot.animate(frames.map(t => ({ transform: t })), { duration: ms, easing: 'linear', fill: 'forwards' }).finished.catch(() => {});
    const flash = (n, c, ms) => { N[n].classList.add(c); later(() => N[n].classList.remove(c), ms); };
    let k = 0; if (!rm) loop(flow, async alive => { const mode = k++ % 3; dot.style.opacity = 1;
      await go([...pts('pay>risk'), ...pts('risk>rules')], 1100); if (!alive()) return;
      if (mode === 2) { flash('p1', 'down', 2600); await go(pts('rules>p1', 0, .7), 500); await go(pts('rules>p1', .7, 0), 450); if (!alive()) return; flash('p2', 'fb', 2200); await go(pts('rules>p2'), 700); flash('p2', 'hit', 700); }
      else { const t = mode === 0 ? 'p1' : 'p2'; await go(pts('rules>' + t), 700); flash(t, 'hit', 700); }
      await sleep(350); dot.style.opacity = 0; await sleep(mode === 2 ? 1700 : 850); }); }

  // E. processors page
  const pr = $('#procs'); if (pr && !rm) { const sw = $('#pr-sw'), badge = $('#pr-badge'), test = $('#pr-test'), res = $('#pr-res');
    const set = on => { sw.classList.toggle('off', !on); sw.setAttribute('aria-label', on ? 'Processor on' : 'Processor paused'); badge.textContent = on ? 'Active' : 'Paused by you'; badge.className = 'chip ' + (on ? 'ok' : 'warn') + ' pop'; };
    loop(pr, async alive => { await sleep(1600); if (!alive()) return; set(false); await sleep(1700); if (!alive()) return; set(true); await sleep(1300); if (!alive()) return; test.classList.add('press'); await sleep(350); test.classList.remove('press'); await sleep(500); res.classList.add('show'); await sleep(2600); res.classList.remove('show'); await sleep(600); }); }

  // F. go live
  const lv = $('#live'); if (lv && !rm) { const sp = $$('.sp', lv), badge = $('#live-badge'), btn = $('#live-btn');
    const state = n => { sp.forEach((s, i) => s.classList.toggle('on', i <= n)); const live = n >= 2; badge.textContent = live ? 'Live active' : 'Pending approval'; badge.className = 'chip ' + (live ? 'ok pop' : 'warn'); };
    loop(lv, async alive => { state(0); await sleep(1300); if (!alive()) return; state(1); await sleep(1300); if (!alive()) return; btn.classList.add('press'); await sleep(350); btn.classList.remove('press'); state(2); await sleep(3200); }); }

  // G. white-label
  const wl = $('#wl'); if (wl) { const cards = $$('.wl-card', wl), picks = $$('.pick button', wl); let i = 0, hold = 0; const show = n => { i = n; cards.forEach((c, k) => c.classList.toggle('on', k === n)); picks.forEach((p, k) => { p.classList.toggle('on', k === n); p.setAttribute('aria-pressed', k === n); }); };
    picks.forEach((p, k) => p.addEventListener('click', () => { hold = Date.now() + 8000; show(k); })); if (!rm) loop(wl, async alive => { await sleep(3000); if (alive() && Date.now() > hold) show((i + 1) % 3); }); }

  // H. code typing (~30 chars/second)
  const code = $('#code'); if (code && !rm) { const bRes = $('#b-res'), bHook = $('#b-hook'); let done = false;
    watch(code, async () => { if (done) return; done = true; cReq.textContent = ''; cReq.classList.add('caret'); for (let n = 1; n <= REQ.length; n++) { cReq.innerHTML = paint(REQ.slice(0, n)); await sleep(33); } cReq.classList.remove('caret'); await sleep(450); bRes.classList.remove('wait'); await sleep(1100); bHook.classList.remove('wait'); }, null, .35); }
  else $$('.blk.wait').forEach(b => b.classList.remove('wait'));

  return () => { timers.forEach(clearTimeout); obs.forEach(o => o.disconnect()); offs.forEach(f => f()); };
}
