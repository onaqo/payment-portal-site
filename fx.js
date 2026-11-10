// AQ Pay motion system: decorates the rendered page (cards, buttons, reveals) and adds scroll/cursor effects.
(function () {
  if (window.__fx) return; window.__fx = true;
  var d = document, fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  function el(tag, cls) { var e = d.createElement(tag); e.className = cls; d.body.appendChild(e); return e; }
  var bar = el('div', 'fx-bar'), glow = fine ? el('div', 'fx-glow') : null, top = el('button', 'fx-top');
  top.setAttribute('aria-label', 'Back to top'); top.textContent = '↑'; top.onclick = function () { scrollTo({ top: 0, behavior: 'smooth' }); };
  var lastY = 0, ticking = false;
  function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false;
    var y = scrollY, max = d.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    top.classList.toggle('on', y > 900);
    var h = d.querySelector('#dc-root header'); if (h) { h.classList.add('fx-nav'); var menuOpen = !!d.querySelector('[role="dialog"][aria-label="Menu"]') || !!h.querySelector('[aria-expanded="true"]'); h.classList.toggle('fx-hide', !menuOpen && y > 500 && y > lastY + 4 ? true : (y < lastY - 4 || y < 500 || menuOpen ? false : h.classList.contains('fx-hide'))); }
    lastY = y; }); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (fine) addEventListener('pointermove', function (e) { glow.style.opacity = 1; glow.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    var c = e.target.closest && e.target.closest('.fx-card'); if (c) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); } }, { passive: true });
  function decorate() {
    d.querySelectorAll('#dc-root [style*="rgba(19, 29, 54, 0.42)"]:not(.fx-card)').forEach(function (c) { var s = c.style; if (parseFloat(s.borderRadius) >= 14 && !c.closest('.hx-frame') && c.tagName !== 'DETAILS' && !c.querySelector('button[aria-expanded]')) c.classList.add('fx-card'); });
    d.querySelectorAll('#dc-root a[style*="border-radius: 999px"][style*="font-weight: 700"]:not(.fx-btn), #dc-root button[type="submit"]:not(.fx-btn)').forEach(function (b) { if (/rgb\((110, 155, 255|61, 220, 151|230, 194, 122)\)/.test(b.style.background || b.style.backgroundColor)) b.classList.add('fx-btn'); });
    d.querySelectorAll('#dc-root [data-reveal]:not(.fx-seen)').forEach(function (g) { g.classList.add('fx-seen'); if (g.children.length >= 3 && /grid/.test(getComputedStyle(g).display) && !g.classList.contains('in')) { g.classList.add('fx-stagger'); for (var i = 0; i < g.children.length; i++) g.children[i].style.setProperty('--i', Math.min(i, 8)); } });
    d.querySelectorAll('#dc-root section[data-screen-label="Hero"]:not(.hx):not(.fx-hero)').forEach(function (s) { s.classList.add('fx-hero'); });
    d.querySelectorAll('#dc-root a[href^="https://demo.aqpay.services"]:not([target])').forEach(function (a) { a.target = '_blank'; a.rel = 'noopener'; });
  }
  var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(decorate, 120); }).observe(d.documentElement, { childList: true, subtree: true }); decorate();
})();
