// AQ Pay visitor analytics: tells the site's own server (/api/t) which page was opened, so the sales portal can count it.
// Nothing is sent to anyone else. No cookie is set. A visitor who chose "Essential only", or has not chosen, is counted
// without anything being stored in their browser. Only after "Accept all" does the browser keep a random id, so a
// return visit is recognised. Browsers that ask not to be tracked (Do Not Track, Global Privacy Control) are not counted.
// Neither is a browser of our own team that was opened once with ?aq-team=1.
(function () {
  if (window.__aqTrack) return; window.__aqTrack = true;
  var d = document, n = navigator, API = '/api/t', VID = 'aq-vid', TEAM = 'aq-team', team = false;
  // The team's own browsers are left out of the figures. Opening any page once with ?aq-team=1 switches counting off
  // for that browser, and ?aq-team=0 switches it back on. Only that browser remembers the choice; nothing is sent.
  function note(text) {
    function show() { try { var el = d.createElement('div'); el.setAttribute('role', 'status'); el.textContent = text; el.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:2147483000;max-width:320px;padding:12px 16px;border-radius:12px;background:#0b1220;color:#fff;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35)'; d.body.appendChild(el); setTimeout(function () { el.remove(); }, 7000); } catch (e) {} }
    if (d.body) show(); else d.addEventListener('DOMContentLoaded', show);
  }
  try {
    var here = new URL(location.href), choice = here.searchParams.get(TEAM);
    if (choice === '1' || choice === '0') {
      if (choice === '1') localStorage.setItem(TEAM, '1'); else localStorage.removeItem(TEAM);
      here.searchParams.delete(TEAM); history.replaceState(history.state, '', here.pathname + here.search + here.hash);
      note(choice === '1' ? 'Visits from this browser are no longer counted.' : 'Visits from this browser are counted again.');
    }
    team = localStorage.getItem(TEAM) === '1';
  } catch (e) {}
  if (team || n.webdriver || n.doNotTrack === '1' || window.doNotTrack === '1' || n.globalPrivacyControl === true) { window.aqTrack = function () {}; window.aqConversion = function () {}; window.aqVisitorId = function () {}; return; }
  function consented() { try { return localStorage.getItem('tpp-cookie-consent') === 'all'; } catch (e) { return false; } }
  // The id exists only with consent; if the choice is not "Accept all", any id left from before is removed.
  function visitorId() {
    try {
      if (!consented()) { localStorage.removeItem(VID); return undefined; }
      var id = localStorage.getItem(VID);
      if (!/^[A-Za-z0-9_-]{16,64}$/.test(id || '')) { var b = new Uint8Array(18); crypto.getRandomValues(b); id = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); localStorage.setItem(VID, id); }
      return id;
    } catch (e) { return undefined; }
  }
  var path = location.pathname + location.search, sent = 0;
  function send(t, extra) {
    if (sent++ > 120) return;
    var body = { t: t, path: path, consent: consented(), visitorId: visitorId() };
    for (var k in extra) if (extra[k] !== undefined && extra[k] !== '') body[k] = extra[k];
    var text = JSON.stringify(body);
    try { if (n.sendBeacon && n.sendBeacon(API, new Blob([text], { type: 'text/plain' }))) return; } catch (e) {}
    try { fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: text, keepalive: true }).catch(function () {}); } catch (e) {}
  }
  // Time counts only while the page is in view.
  var since = d.visibilityState === 'visible' ? Date.now() : 0, seconds = 0, scroll = 0, pings = 0;
  function tally() { if (since) { seconds += (Date.now() - since) / 1000; since = d.visibilityState === 'visible' ? Date.now() : 0; } }
  var lastLeft = 0;
  // A browser says "hidden" and "leaving" in the same moment: one report is enough.
  function report(t) { if (t === 'leave') { if (Date.now() - lastLeft < 1000) return; lastLeft = Date.now(); } tally(); send(t, { seconds: Math.round(seconds), scroll: scroll }); }
  function onScroll() { var h = d.documentElement, depth = h.scrollHeight - h.clientHeight; scroll = Math.max(scroll, depth > 0 ? Math.min(100, Math.round((h.scrollTop / depth) * 100)) : 100); }

  send('page', { title: d.title.slice(0, 200), referrer: d.referrer, language: n.language, screenWidth: window.screen && screen.width });
  // A link from one of our emails carries a value saying who followed it. Once reported it is taken out of the address bar.
  try { var u = new URL(location.href); if (u.searchParams.has('aqv')) { u.searchParams.delete('aqv'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); path = u.pathname + u.search; } } catch (e) {}

  d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') report('leave'); else since = Date.now(); });
  addEventListener('pagehide', function () { report('leave'); });
  addEventListener('scroll', onScroll, { passive: true });
  setInterval(function () { if (d.visibilityState === 'visible' && pings++ < 40) report('ping'); }, 30000);

  // What visitors do: named once here, so pages only say window.aqTrack('name').
  window.aqTrack = function (name) { if (/^[a-z0-9][a-z0-9_:-]{0,39}$/.test(name || '')) send('event', { name: name }); };
  window.aqVisitorId = visitorId;
  window.aqConversion = function (name) {
    window.aqTrack(name);
    if (window.__gtm) window.dataLayer.push({ event: name, page_path: location.pathname });
  };
  d.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
    var href = a.getAttribute('href') || '';
    if (d.querySelector('meta[property="og:type"][content="article"]') && a.closest('.prose')) {
      var service = /^\/(white-label-gateway|payment-orchestration|merchant-services|high-risk-processing|partner-program)(?:[?#]|$)/.exec(href);
      if (service) window.aqConversion('article_to_' + service[1].replace(/-/g, '_'));
    }
    if (/^mailto:/i.test(href)) return window.aqTrack('mail_click');
    if (/^tel:/i.test(href)) return window.aqTrack('phone_click');
    if (/\.(pdf|docx?|xlsx?|pptx?|zip|csv)(\?|#|$)/i.test(href)) return window.aqTrack('file_download');
    try { var to = new URL(href, location.href); if (/^https?:$/.test(to.protocol) && to.host !== location.host) return window.aqTrack('outbound_click'); if (to.host === location.host && /^\/book-a-demo\/?$/.test(to.pathname) && location.pathname !== to.pathname) return window.aqTrack('demo_click'); } catch (x) {}
  }, true);
})();
