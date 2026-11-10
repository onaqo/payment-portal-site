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
  return function () { io.disconnect(); };
}
