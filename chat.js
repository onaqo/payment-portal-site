// AQ Pay website chat: a chat box at the bottom right of every page. An AI assistant in the sales portal answers;
// this file only shows the conversation. It appears only while the chat is switched on in the portal (/api/chat says so).
// Everything a visitor or the assistant writes is put on the page as plain text, never as HTML.
(function () {
  if (window.__aqChat) return; window.__aqChat = true;
  var d = document, API = '/api/chat', KEY = 'aq-chat-v1';
  var state = { sessionId: '', messages: [], captured: false, form: false, open: false };
  function load() { try { var s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (s && typeof s.sessionId === 'string' && Array.isArray(s.messages)) state = { sessionId: s.sessionId, messages: s.messages.slice(-60), captured: !!s.captured, form: !!s.form, open: !!s.open }; } catch (e) {} }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function newId() { try { if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, ''); var a = new Uint8Array(16); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); } catch (e) { return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); } }
  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function post(body) { return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); }); }

  var CSS = [
    '.aqc-btn{position:fixed;right:18px;bottom:18px;z-index:75;width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;background:#6E9BFF;color:#060A14;box-shadow:0 12px 32px rgba(0,0,0,.45);display:grid;place-items:center;transition:transform .2s}',
    '.aqc-btn:hover{transform:scale(1.06)}.aqc-btn svg{width:26px;height:26px}',
    '.aqc-btn:focus-visible,.aqc-panel button:focus-visible,.aqc-panel input:focus-visible,.aqc-panel textarea:focus-visible,.aqc-panel a:focus-visible{outline:2px solid #F4F7FC;outline-offset:2px}',
    'html.aqc-on .fx-top{bottom:86px}',
    '.aqc-panel{position:fixed;right:18px;bottom:86px;z-index:90;width:380px;max-width:calc(100vw - 24px);height:560px;max-height:calc(100dvh - 110px);display:flex;flex-direction:column;background:#0B1324;color:#F4F7FC;border:1px solid rgba(244,247,252,.16);border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.55);font-family:Geist,system-ui,-apple-system,Segoe UI,sans-serif;font-size:14.5px;line-height:1.5;overflow:hidden}',
    '.aqc-panel[hidden]{display:none}',
    '.aqc-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(244,247,252,.12)}',
    '.aqc-head h2{margin:0;font-size:15px;font-weight:600;flex:1}.aqc-tag{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#060A14;background:#3DDC97;border-radius:999px;padding:2px 8px}',
    '.aqc-x{width:36px;height:36px;border-radius:10px;border:0;background:transparent;color:#F4F7FC;cursor:pointer;font-size:20px;line-height:1}.aqc-x:hover{background:rgba(244,247,252,.1)}',
    '.aqc-log{flex:1;min-height:0;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px}',
    '.aqc-m{max-width:86%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}',
    '.aqc-a{align-self:flex-start;background:rgba(244,247,252,.08);border:1px solid rgba(244,247,252,.1)}.aqc-v{align-self:flex-end;background:#6E9BFF;color:#060A14}',
    '.aqc-wait{align-self:flex-start;color:rgba(244,247,252,.7);font-size:13px}',
    '.aqc-err{align-self:stretch;color:#FFB4A8;font-size:13px}',
    '.aqc-form{align-self:stretch;padding:12px;border:1px solid rgba(110,155,255,.5);border-radius:14px;display:grid;gap:8px;background:rgba(110,155,255,.08)}',
    '.aqc-form[hidden]{display:none}.aqc-form p{margin:0;font-size:13px;color:rgba(244,247,252,.85)}',
    '.aqc-form label{display:grid;gap:3px;font-size:12.5px;color:rgba(244,247,252,.8)}',
    '.aqc-panel input[type=text],.aqc-panel input[type=email],.aqc-panel textarea{font:inherit;color:#F4F7FC;background:#060A14;border:1px solid rgba(244,247,252,.22);border-radius:10px;padding:9px 11px;width:100%;box-sizing:border-box}',
    '.aqc-check{display:flex!important;grid-template-columns:none;align-items:flex-start;gap:8px}.aqc-check input{width:18px;height:18px;margin-top:1px;accent-color:#6E9BFF;flex:none}',
    '.aqc-go{font:inherit;font-weight:600;min-height:42px;border-radius:999px;border:0;background:#6E9BFF;color:#060A14;cursor:pointer;padding:0 16px}.aqc-go:disabled{opacity:.55;cursor:default}',
    '.aqc-link{font:inherit;font-size:13px;background:none;border:0;padding:0;color:#6E9BFF;cursor:pointer;text-decoration:underline;text-underline-offset:2px;align-self:flex-start}',
    '.aqc-foot{padding:10px 16px 12px;border-top:1px solid rgba(244,247,252,.12)}',
    '.aqc-row{display:flex;gap:8px;align-items:flex-end}.aqc-row textarea{resize:none;min-height:42px;max-height:110px}',
    '.aqc-send{flex:none;width:42px;height:42px;border-radius:50%;border:0;background:#6E9BFF;color:#060A14;cursor:pointer;font-size:18px;font-weight:700}.aqc-send:disabled{opacity:.5;cursor:default}',
    '.aqc-note{margin:8px 0 0;font-size:11.5px;line-height:1.45;color:rgba(244,247,252,.62)}.aqc-note a{color:#6E9BFF}',
    '.aqc-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}',
    '@media (max-width:520px){.aqc-panel{right:12px;left:12px;width:auto;max-width:none;bottom:82px}}',
    // On a phone the cookie notice fills the bottom of the screen until it is answered; the button waits above it.
    '@media (max-width:640px){body:has(.fx-ck) .aqc-btn{bottom:184px}}',
    '@media (prefers-reduced-motion:reduce){.aqc-btn{transition:none}.aqc-btn:hover{transform:none}}'
  ].join('\n');

  function start(cfg) {
    load(); if (!state.sessionId) { state.sessionId = newId(); save(); }
    var max = cfg.maxLength || 600, busy = false;
    var style = el('style'); style.textContent = CSS; d.head.appendChild(style);
    d.documentElement.classList.add('aqc-on');

    var btn = el('button', 'aqc-btn'); btn.type = 'button'; btn.setAttribute('aria-controls', 'aqc-panel');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.1A8.5 8.5 0 1 1 21 12Z"/></svg>';
    var panel = el('section', 'aqc-panel'); panel.id = 'aqc-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Chat with AQ Pay'); panel.hidden = true;
    var head = el('div', 'aqc-head'); head.appendChild(el('h2', '', 'AQ Pay')); head.appendChild(el('span', 'aqc-tag', 'AI assistant'));
    var x = el('button', 'aqc-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close the chat'); head.appendChild(x);
    var log = el('div', 'aqc-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite'); log.setAttribute('aria-label', 'Conversation');

    var form = el('form', 'aqc-form'); form.noValidate = true;
    form.appendChild(el('p', '', 'Leave your details and a colleague will get back to you by email.'));
    function field(label, type, name, auto, required) { var l = el('label', '', label); var i = el('input'); i.type = type; i.name = name; i.autocomplete = auto; if (required) i.required = true; i.maxLength = 200; l.appendChild(i); form.appendChild(l); return i; }
    var fName = field('Your name', 'text', 'name', 'name', true), fEmail = field('Work email', 'email', 'email', 'email', true), fCompany = field('Company (optional)', 'text', 'company', 'organization', false);
    var hp = el('input', 'aqc-hp'); hp.type = 'text'; hp.name = 'hp'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true'); form.appendChild(hp);
    var cl = el('label', 'aqc-check'); var consent = el('input'); consent.type = 'checkbox'; consent.name = 'consent'; consent.required = true; cl.appendChild(consent); cl.appendChild(el('span', '', 'You may contact me about this request.')); form.appendChild(cl);
    var fErr = el('p', 'aqc-err'); fErr.setAttribute('role', 'alert'); fErr.hidden = true; form.appendChild(fErr);
    var go = el('button', 'aqc-go', 'Send my details'); go.type = 'submit'; form.appendChild(go);

    var foot = el('div', 'aqc-foot'); var row = el('form', 'aqc-row');
    var input = el('textarea'); input.rows = 1; input.maxLength = max; input.placeholder = 'Type your question'; input.setAttribute('aria-label', 'Your message');
    var send = el('button', 'aqc-send', '↑'); send.type = 'submit'; send.setAttribute('aria-label', 'Send');
    row.appendChild(input); row.appendChild(send); foot.appendChild(row);
    var leave = el('button', 'aqc-link', 'Leave your details instead'); leave.type = 'button';
    var note = el('p', 'aqc-note'); note.appendChild(d.createTextNode('You are talking to an AI assistant, not a person. It can be wrong; a colleague confirms anything important. Messages are kept so our team can follow up. See our ')); var pl = el('a', '', 'Privacy Policy'); pl.href = '/privacy'; note.appendChild(pl); note.appendChild(d.createTextNode('.'));
    foot.appendChild(note);
    panel.appendChild(head); panel.appendChild(log); panel.appendChild(foot);
    d.body.appendChild(btn); d.body.appendChild(panel);

    var waitEl = null, errEl = null;
    function bottom() { log.scrollTop = log.scrollHeight; }
    function bubble(m) { log.appendChild(el('div', 'aqc-m ' + (m.who === 'v' ? 'aqc-v' : 'aqc-a'), m.text)); }
    function render() {
      log.textContent = ''; bubble({ who: 'a', text: cfg.greeting || 'Hello. How can we help?' });
      state.messages.forEach(bubble);
      // The form for the visitor's details sits in the conversation, under the answer that offered it.
      if (!state.captured) log.appendChild(state.form ? form : leave);
      form.hidden = false; bottom();
    }
    function add(who, text) { state.messages.push({ who: who, text: text }); if (state.messages.length > 60) state.messages = state.messages.slice(-60); save(); render(); }
    function waiting(on) { busy = on; send.disabled = on; go.disabled = on; if (waitEl) { waitEl.remove(); waitEl = null; } if (on) { waitEl = el('div', 'aqc-wait', 'Writing…'); log.appendChild(waitEl); bottom(); } }
    function problem(text) { if (errEl) errEl.remove(); errEl = null; if (text) { errEl = el('div', 'aqc-err', text); errEl.setAttribute('role', 'alert'); log.appendChild(errEl); bottom(); } }
    function setOpen(on, focus) {
      state.open = on; save(); panel.hidden = !on; btn.setAttribute('aria-expanded', on ? 'true' : 'false'); btn.setAttribute('aria-label', on ? 'Close the chat' : 'Chat with us');
      if (on) { render(); if (focus) (state.form && !state.captured ? fName : input).focus(); } else if (focus) btn.focus();
    }
    function showForm() { state.form = true; save(); render(); }

    row.addEventListener('submit', function (e) {
      e.preventDefault(); var text = input.value.trim().slice(0, max); if (!text || busy) return;
      input.value = ''; input.style.height = ''; problem(''); add('v', text); waiting(true);
      post({ sessionId: state.sessionId, message: text }).then(function (r) {
        waiting(false);
        if (!r.ok || !r.body.reply) { problem(r.body.error || 'That did not go through. Please try again, or use the contact form.'); return; }
        if (r.body.captured) state.captured = true;
        if (r.body.askContact && !state.captured) state.form = true;
        add('a', r.body.reply);
      }).catch(function () { waiting(false); problem('That did not go through. Please check your connection and try again.'); });
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); row.requestSubmit ? row.requestSubmit() : send.click(); } });
    input.addEventListener('input', function () { input.style.height = ''; input.style.height = Math.min(110, input.scrollHeight) + 'px'; });
    leave.addEventListener('click', function () { showForm(); fName.focus(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (busy) return; fErr.hidden = true;
      var name = fName.value.trim(), email = fEmail.value.trim();
      function bad(msg, f) { fErr.textContent = msg; fErr.hidden = false; f.focus(); }
      if (name.length < 2) return bad('Please enter your name.', fName);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('Please enter a valid email address.', fEmail);
      if (!consent.checked) return bad('Please tick the box so we may contact you about this request.', consent);
      waiting(true);
      post({ action: 'contact', sessionId: state.sessionId, name: name, email: email, company: fCompany.value.trim(), consent: true, hp: hp.value }).then(function (r) {
        waiting(false);
        if (!r.ok) { fErr.textContent = r.body.error || 'That did not go through. Please try again.'; fErr.hidden = false; return; }
        state.captured = true; state.form = false; add('a', r.body.reply || 'Thank you. A colleague will get back to you by email.'); input.focus();
      }).catch(function () { waiting(false); fErr.textContent = 'That did not go through. Please check your connection and try again.'; fErr.hidden = false; });
    });
    btn.addEventListener('click', function () { setOpen(panel.hidden, true); });
    x.addEventListener('click', function () { setOpen(false, true); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) setOpen(false, true); });
    // A conversation that was open on the last page stays open on this one.
    setOpen(state.open, false);
  }

  function boot() {
    fetch(API, { headers: { Accept: 'application/json' } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (cfg) { if (cfg && cfg.enabled) start(cfg); }).catch(function () {});
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
