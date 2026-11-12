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
  return function () { io.disconnect(); };
}
