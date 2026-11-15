export function init() {
  var root = document.querySelector('#dc-root .aqh') || document.querySelector('.aqh');
  if (!root || window.__prerender || !('IntersectionObserver' in window)) return function () {};
  root.classList.add('js');
  var els = root.querySelectorAll('.rv');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(el); });
  var hv = root.querySelector('.hv'), mid = root.querySelector('.hmid');
  if (hv && mid && window.matchMedia && matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hv.addEventListener('pointermove', function (e) { var r = hv.getBoundingClientRect(); var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; mid.style.transform = 'rotateY(' + (x * 14).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg)'; });
    hv.addEventListener('pointerleave', function () { mid.style.transform = ''; });
  }
  var wires = function () {
    var svg = root.querySelector('.hwires'), phone = root.querySelector('.hmid .phone'); if (!hv || !svg || !phone) return;
    var at = function (el) { var x = 0, y = 0, n = el; while (n && n !== hv) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; } return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight }; };
    var p = at(phone), ys = [0.3, 0.43, 0.56, 0.69];
    var set = function (sel, chips, left) { var paths = svg.querySelectorAll(sel); chips.forEach(function (c, i) { var b = at(c), cy = b.y + b.h / 2, py = p.y + p.h * ys[i], d;
      if (left) { var sx = b.x + b.w, ex = p.x - 4, k = (ex - sx) * 0.55; d = 'M' + sx + ' ' + cy + ' C' + (sx + k) + ' ' + cy + ',' + (ex - k) + ' ' + py + ',' + ex + ' ' + py; }
      else { var s2 = p.x + p.w + 4, e2 = b.x, k2 = (e2 - s2) * 0.55; d = 'M' + s2 + ' ' + py + ' C' + (s2 + k2) + ' ' + py + ',' + (e2 - k2) + ' ' + cy + ',' + e2 + ' ' + cy; }
      if (paths[i]) { paths[i].setAttribute('d', d); paths[i].style.setProperty('--len', Math.ceil(paths[i].getTotalLength())); } }); };
    var L = [].slice.call(root.querySelectorAll('.hl .hchip')), R = [].slice.call(root.querySelectorAll('.hr .hchip'));
    set('.wire.wl', L, true); set('.wflow.wl', L, true); set('.wire.wr', R, false); set('.wflow.wr', R, false);
  };
  wires(); if (window.ResizeObserver && hv) { var ro = new ResizeObserver(wires); ro.observe(hv); } if (document.fonts && document.fonts.ready) document.fonts.ready.then(wires);
  const stopSlides = initSlides(root);
  return function () { io.disconnect(); stopSlides(); };
}

function initSlides(root) {
  const section = root.querySelector('.home-reading:not(.reading-feature)');
  if (!section) return () => {};
  const track = section.querySelector('.reading-grid');
  const controls = section.querySelector('.slide-controls');
  const cards = Array.from(track.children);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const pauseButton = controls.querySelector('[data-slide="pause"]');
  let paused = motion.matches;
  let visible = false;
  let hovered = false;
  let timer;
  function advance(direction) {
    const max = track.scrollWidth - track.clientWidth;
    const positions = [...new Set(cards.map(card => Math.min(max, card.offsetLeft - cards[0].offsetLeft)))];
    const x = track.scrollLeft;
    const next = direction > 0 ? positions.find(p => p > x + 2) ?? 0 : positions.filter(p => p < x - 2).pop() ?? max;
    track.scrollTo({left: next, behavior: motion.matches ? 'instant' : 'smooth'});
  }
  function schedule() {
    clearInterval(timer);
    controls.hidden = track.scrollWidth <= track.clientWidth + 2;
    pauseButton.textContent = paused ? 'Play slideshow' : 'Pause slideshow';
    if (!paused && !hovered && visible && !document.hidden && !controls.hidden) timer = setInterval(() => advance(1), 5000);
  }
  const listeners = new AbortController();
  const on = (target, name, fn) => target.addEventListener(name, fn, {signal: listeners.signal});
  on(controls, 'click', event => {
    const action = event.target.closest('button')?.dataset.slide;
    if (!action) return;
    if (action === 'pause') paused = !paused;
    else { paused = true; advance(action === 'next' ? 1 : -1); }
    schedule();
  });
  on(section, 'pointerenter', e => { hovered = e.pointerType === 'mouse'; schedule(); });
  on(section, 'pointerleave', () => { hovered = false; schedule(); });
  on(track, 'pointerdown', () => { paused = true; schedule(); });
  on(section, 'focusin', e => { if (e.target.matches(':focus-visible')) { paused = true; schedule(); } });
  on(motion, 'change', () => { paused = motion.matches; schedule(); });
  on(document, 'visibilitychange', schedule);
  const view = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
  const size = new ResizeObserver(schedule);
  view.observe(track);
  size.observe(track);
  schedule();
  return () => { clearInterval(timer); listeners.abort(); view.disconnect(); size.disconnect(); };
}
