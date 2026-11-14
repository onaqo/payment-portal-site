export function init() {
  var root = document.querySelector('#dc-root .aqh') || document.querySelector('.aqh');
  if (!root || window.__prerender || !('IntersectionObserver' in window)) return function () {};
  root.classList.add('js');
  var els = root.querySelectorAll('.rv');
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(el); });
  return function () { io.disconnect(); };
}
