// AQ Pay website chat: a chat box at the bottom right of every page. An AI assistant in the sales portal answers,
// and a visitor can ask for a person, who then answers in the same box. This file only shows the conversation.
// It appears only while the chat is switched on in the portal (/api/chat says so).
// Everything a visitor, the assistant or a colleague writes is put on the page as plain text, never as HTML.
(function () {
  if (window.__aqChat) return; window.__aqChat = true;
  var d = document, API = '/api/chat', KEY = 'aq-chat-v2';
  var calm = false; try { calm = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var state = { sessionId: '', messages: [], captured: false, named: false, form: false, open: false, status: 'AI', agent: '', cursor: '', seen: [], teased: false };
  function load() { try { var s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (s && typeof s.sessionId === 'string' && Array.isArray(s.messages)) { for (var k in state) if (s[k] !== undefined) state[k] = s[k]; state.messages = state.messages.slice(-80); state.seen = (state.seen || []).slice(-120); } } catch (e) {} }
  function save() { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function newId() { try { if (crypto.randomUUID) return crypto.randomUUID().replace(/-/g, ''); var a = new Uint8Array(16); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); } catch (e) { return 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); } }
  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function json(r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, body: j }; }); }
  function post(body) { return fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json); }

  var CSS = [
    '@property --aqc-a{syntax:"<angle>";initial-value:0deg;inherits:false}',
    '@keyframes aqcSpin{to{--aqc-a:360deg}}',
    '@keyframes aqcRise{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}',
    '@keyframes aqcPop{0%{transform:scale(0)}70%{transform:scale(1.18)}to{transform:scale(1)}}',
    '@keyframes aqcRing{0%{transform:scale(1);opacity:.55}to{transform:scale(1.9);opacity:0}}',
    '@keyframes aqcDot{0%,80%,to{transform:translateY(0);opacity:.45}40%{transform:translateY(-5px);opacity:1}}',
    '@keyframes aqcDrift{0%{transform:translate(-12%,-8%) rotate(0)}50%{transform:translate(10%,8%) rotate(140deg)}to{transform:translate(-12%,-8%) rotate(360deg)}}',
    '@keyframes aqcBeat{0%,to{box-shadow:0 0 0 0 rgba(61,220,151,.55)}60%{box-shadow:0 0 0 6px rgba(61,220,151,0)}}',
    '@keyframes aqcSlide{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}',
    '@keyframes aqcSheen{0%,55%{transform:translateX(-100%)}to{transform:translateX(100%)}}',
    '@keyframes aqcLoad{0%{left:-40%}to{left:100%}}',
    '.aqc-btn,.aqc-panel,.aqc-tease{font-family:Geist,system-ui,-apple-system,Segoe UI,sans-serif;-webkit-font-smoothing:antialiased}',
    // The button: a slowly turning ring of the brand colours around a dark disc.
    '.aqc-btn{position:fixed;right:18px;bottom:18px;z-index:75;width:60px;height:60px;border-radius:50%;border:0;padding:3px;cursor:pointer;background:conic-gradient(from var(--aqc-a),#6E9BFF,#3DDC97,#E6C27A,#6E9BFF);animation:aqcSpin 7s linear infinite;box-shadow:0 14px 38px rgba(8,14,32,.6),0 0 26px rgba(110,155,255,.35);transition:transform .25s cubic-bezier(.2,.8,.2,1)}',
    '.aqc-btn:hover{transform:translateY(-2px) scale(1.05)}.aqc-btn:active{transform:scale(.95)}',
    '.aqc-btn i{position:relative;display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:radial-gradient(120% 120% at 30% 20%,#18264A,#070C1A 70%);color:#F4F7FC}',
    '.aqc-btn svg{position:absolute;width:26px;height:26px;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .2s}',
    '.aqc-btn .aqc-ic-x{opacity:0;transform:rotate(-90deg) scale(.5)}',
    '.aqc-btn[aria-expanded=true] .aqc-ic-c{opacity:0;transform:rotate(90deg) scale(.5)}.aqc-btn[aria-expanded=true] .aqc-ic-x{opacity:1;transform:none}',
    '.aqc-btn::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid #6E9BFF;animation:aqcRing 2.6s ease-out infinite;pointer-events:none}',
    '.aqc-btn.aqc-quiet::after{display:none}',
    '.aqc-badge{position:absolute;top:-3px;right:-3px;min-width:20px;height:20px;border-radius:999px;background:#3DDC97;color:#04120B;font-size:12px;font-weight:700;line-height:20px;text-align:center;padding:0 5px;box-sizing:border-box;animation:aqcPop .35s cubic-bezier(.2,.8,.2,1) both;box-shadow:0 0 0 2px #070C1A}',
    '.aqc-badge[hidden]{display:none}',
    '.aqc-btn:focus-visible,.aqc-panel button:focus-visible,.aqc-panel input:focus-visible,.aqc-panel textarea:focus-visible,.aqc-panel a:focus-visible,.aqc-tease:focus-visible{outline:2px solid #F4F7FC;outline-offset:2px}',
    'html.aqc-on .fx-top{bottom:92px}',
    // A short invitation beside the button, once per visit.
    '.aqc-tease{position:fixed;right:90px;bottom:26px;z-index:74;max-width:230px;padding:10px 14px;border-radius:16px 16px 4px 16px;border:1px solid transparent;background:linear-gradient(#0E1830,#0E1830) padding-box,linear-gradient(135deg,rgba(110,155,255,.8),rgba(61,220,151,.5)) border-box;color:#F4F7FC;font-size:14px;line-height:1.4;text-align:left;cursor:pointer;box-shadow:0 14px 34px rgba(0,0,0,.45);animation:aqcSlide .45s cubic-bezier(.2,.8,.2,1) both}',
    '.aqc-tease b{display:block;font-weight:600}.aqc-tease span{color:rgba(244,247,252,.72);font-size:13px}',
    // The panel: dark glass with a border in the brand colours; it grows out of the button.
    '.aqc-panel{position:fixed;right:18px;bottom:92px;z-index:90;width:392px;max-width:calc(100vw - 24px);height:600px;max-height:calc(100dvh - 116px);display:flex;flex-direction:column;color:#F4F7FC;font-size:14.5px;line-height:1.5;border-radius:22px;border:1px solid transparent;background:linear-gradient(180deg,rgba(13,21,42,.97),rgba(7,12,26,.98)) padding-box,linear-gradient(150deg,rgba(110,155,255,.75),rgba(61,220,151,.35) 45%,rgba(230,194,122,.45)) border-box;box-shadow:0 34px 90px rgba(0,0,0,.62),0 0 60px rgba(110,155,255,.12);backdrop-filter:blur(18px) saturate(130%);-webkit-backdrop-filter:blur(18px) saturate(130%);overflow:hidden;transform-origin:calc(100% - 24px) 100%;opacity:0;transform:translateY(18px) scale(.94);transition:opacity .22s ease,transform .32s cubic-bezier(.2,.9,.25,1.05)}',
    '.aqc-panel.aqc-in{opacity:1;transform:none}.aqc-panel[hidden]{display:none}',
    '.aqc-head{position:relative;display:flex;align-items:center;gap:12px;padding:16px 16px 14px;border-bottom:1px solid rgba(244,247,252,.1);overflow:hidden}',
    '.aqc-head::before{content:"";position:absolute;inset:-60% -20%;background:radial-gradient(38% 46% at 22% 40%,rgba(110,155,255,.42),transparent 70%),radial-gradient(34% 42% at 78% 55%,rgba(61,220,151,.26),transparent 70%),radial-gradient(30% 40% at 55% 20%,rgba(230,194,122,.18),transparent 70%);filter:blur(10px);animation:aqcDrift 16s ease-in-out infinite;pointer-events:none}',
    '.aqc-head>*{position:relative}',
    '.aqc-orb{flex:none;width:40px;height:40px;border-radius:50%;padding:2px;background:conic-gradient(from var(--aqc-a),#6E9BFF,#3DDC97,#E6C27A,#6E9BFF);animation:aqcSpin 5s linear infinite}',
    '.aqc-orb i{display:grid;place-items:center;width:100%;height:100%;border-radius:50%;background:#0A1226;font-style:normal;font-weight:700;font-size:13px;letter-spacing:.02em;color:#F4F7FC}',
    '.aqc-who{flex:1;min-width:0}.aqc-who h2{margin:0;font-size:15.5px;font-weight:600;letter-spacing:-.01em}',
    '.aqc-sub{display:flex;align-items:center;gap:7px;margin:1px 0 0;font-size:12.5px;color:rgba(244,247,252,.74);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.aqc-live{flex:none;width:8px;height:8px;border-radius:50%;background:#3DDC97;animation:aqcBeat 2s ease-out infinite}.aqc-live.aqc-wait{background:#E6C27A}',
    '.aqc-x{flex:none;width:36px;height:36px;border-radius:12px;border:0;background:rgba(244,247,252,.06);color:#F4F7FC;cursor:pointer;font-size:20px;line-height:1;transition:background .2s,transform .2s}.aqc-x:hover{background:rgba(244,247,252,.14);transform:rotate(90deg)}',
    // "Talk to a person": a bar under the header that is always in view, in three states: team online, team away, connecting.
    '.aqc-cta{position:relative;flex:none;display:flex;align-items:center;gap:12px;margin:12px 14px 0;padding:11px 12px 11px 13px;border-radius:18px;border:1px solid transparent;background:linear-gradient(135deg,rgba(18,30,60,.97),rgba(10,18,38,.97)) padding-box,linear-gradient(120deg,#6E9BFF,#3DDC97 55%,#E6C27A) border-box;box-shadow:0 10px 30px rgba(61,220,151,.16),inset 0 1px 0 rgba(244,247,252,.06);overflow:hidden}',
    '.aqc-cta[hidden]{display:none}',
    '.aqc-cta::before{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(244,247,252,.09) 50%,transparent 70%);transform:translateX(-100%);animation:aqcSheen 4.5s ease-in-out infinite;pointer-events:none}',
    '.aqc-cta>*{position:relative}',
    '.aqc-cta-ic{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,rgba(61,220,151,.24),rgba(110,155,255,.24));color:#F4F7FC;box-shadow:0 0 0 1px rgba(61,220,151,.5)}',
    '.aqc-cta-ic svg{width:22px;height:22px}',
    '.aqc-cta-ic b{position:absolute;right:-1px;bottom:-1px;width:12px;height:12px;border-radius:50%;background:#3DDC97;box-shadow:0 0 0 2px #0C1530;animation:aqcBeat 2s ease-out infinite}',
    '.aqc-cta-t{flex:1;min-width:0;display:grid;gap:1px}.aqc-cta-t strong{font-size:14.5px;font-weight:600;letter-spacing:-.01em;line-height:1.3}.aqc-cta-t span{font-size:12.5px;line-height:1.35;color:rgba(244,247,252,.76)}',
    '.aqc-cta-go{flex:none;font:inherit;font-size:13.5px;font-weight:700;min-height:40px;padding:0 16px;border-radius:999px;border:0;cursor:pointer;color:#04101F;background:linear-gradient(135deg,#3DDC97,#6E9BFF);box-shadow:0 8px 22px rgba(61,220,151,.32);transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s}',
    '.aqc-cta-go:hover{transform:translateY(-1px) scale(1.03);box-shadow:0 12px 28px rgba(61,220,151,.44)}.aqc-cta-go:active{transform:scale(.96)}.aqc-cta-go:disabled{opacity:.6;cursor:default;transform:none}.aqc-cta-go[hidden]{display:none}',
    '.aqc-cta.aqc-cta-away{background:linear-gradient(135deg,rgba(18,26,48,.97),rgba(10,16,32,.97)) padding-box,linear-gradient(120deg,rgba(230,194,122,.8),rgba(110,155,255,.45)) border-box;box-shadow:none}',
    '.aqc-cta.aqc-cta-away::before{display:none}.aqc-cta.aqc-cta-away .aqc-cta-ic{background:rgba(230,194,122,.14);box-shadow:0 0 0 1px rgba(230,194,122,.45)}.aqc-cta.aqc-cta-away .aqc-cta-ic b{background:#E6C27A;animation:none}',
    '.aqc-cta.aqc-cta-away .aqc-cta-go{background:rgba(244,247,252,.1);color:#F4F7FC;box-shadow:none;border:1px solid rgba(244,247,252,.28)}',
    '.aqc-cta.aqc-cta-wait .aqc-cta-ic b{background:#E6C27A}',
    '.aqc-cta.aqc-cta-wait::after{content:"";position:absolute;left:0;bottom:0;height:3px;width:40%;border-radius:3px;background:linear-gradient(90deg,#6E9BFF,#3DDC97);animation:aqcLoad 1.6s ease-in-out infinite}',
    '.aqc-log{flex:1;min-height:0;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;scrollbar-color:rgba(244,247,252,.2) transparent}',
    '.aqc-m{max-width:86%;padding:10px 13px;white-space:pre-wrap;overflow-wrap:anywhere}',
    '.aqc-new{animation:aqcRise .34s cubic-bezier(.2,.8,.2,1) both}',
    '.aqc-a{align-self:flex-start;border-radius:16px 16px 16px 5px;background:rgba(244,247,252,.07);border:1px solid rgba(244,247,252,.1)}',
    '.aqc-v{align-self:flex-end;border-radius:16px 16px 5px 16px;background:linear-gradient(135deg,#6E9BFF,#8FB4FF);color:#060A14;box-shadow:0 8px 22px rgba(110,155,255,.28)}',
    '.aqc-p{align-self:flex-start;border-radius:16px 16px 16px 5px;background:rgba(61,220,151,.1);border:1px solid rgba(61,220,151,.38)}',
    '.aqc-p small{display:block;margin-bottom:2px;font-size:11.5px;font-weight:600;color:#3DDC97}',
    '.aqc-s{align-self:center;max-width:92%;padding:5px 12px;border-radius:14px;background:rgba(244,247,252,.06);color:rgba(244,247,252,.72);font-size:12.5px;text-align:center}',
    '.aqc-dots{align-self:flex-start;display:flex;gap:5px;padding:13px 14px;border-radius:16px 16px 16px 5px;background:rgba(244,247,252,.07);border:1px solid rgba(244,247,252,.1)}',
    '.aqc-dots i{width:7px;height:7px;border-radius:50%;background:#9DB9FF;animation:aqcDot 1.1s ease-in-out infinite}.aqc-dots i:nth-child(2){animation-delay:.15s}.aqc-dots i:nth-child(3){animation-delay:.3s}',
    '.aqc-chips{display:flex;flex-wrap:wrap;gap:7px}',
    '.aqc-chip{font:inherit;font-size:13.5px;color:#F4F7FC;cursor:pointer;padding:8px 13px;border-radius:999px;border:1px solid transparent;background:linear-gradient(#0F1A33,#0F1A33) padding-box,linear-gradient(135deg,rgba(110,155,255,.7),rgba(61,220,151,.4)) border-box;transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s;animation:aqcRise .4s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0) * 70ms + 120ms)}',
    '.aqc-chip:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(110,155,255,.25)}',
    '.aqc-acts{display:flex;flex-wrap:wrap;gap:8px;align-self:stretch}',
    '.aqc-act{font:inherit;font-size:13px;font-weight:600;color:#F4F7FC;cursor:pointer;min-height:38px;padding:0 14px;border-radius:999px;border:1px solid rgba(244,247,252,.2);background:rgba(244,247,252,.04);display:inline-flex;align-items:center;gap:8px;transition:border-color .2s,background .2s,transform .2s}',
    '.aqc-act:hover{border-color:#6E9BFF;background:rgba(110,155,255,.12);transform:translateY(-1px)}.aqc-act:disabled{opacity:.55;cursor:default;transform:none}',
    '.aqc-act b{width:8px;height:8px;border-radius:50%;background:#3DDC97;animation:aqcBeat 2s ease-out infinite}',
    '.aqc-away{font-size:13px;color:rgba(244,247,252,.7);min-height:38px;padding:0 12px;border-radius:999px;border:1px dashed rgba(244,247,252,.2);display:inline-flex;align-items:center;gap:8px}.aqc-away b{width:8px;height:8px;border-radius:50%;background:#E6C27A}',
    '.aqc-err{align-self:stretch;color:#FFB4A8;font-size:13px}',
    '.aqc-form{align-self:stretch;padding:14px;border-radius:16px;border:1px solid transparent;background:linear-gradient(#0E1730,#0E1730) padding-box,linear-gradient(135deg,rgba(110,155,255,.8),rgba(61,220,151,.45)) border-box;display:grid;gap:9px}',
    '.aqc-form p{margin:0;font-size:13px;color:rgba(244,247,252,.85)}',
    '.aqc-form label{display:grid;gap:3px;font-size:12.5px;color:rgba(244,247,252,.8)}',
    '.aqc-form label[hidden],.aqc-check[hidden]{display:none!important}',
    '.aqc-form h3{margin:0;font-size:14.5px;font-weight:600;letter-spacing:-.01em}',
    '.aqc-panel input[type=text],.aqc-panel input[type=email],.aqc-panel input[type=tel],.aqc-panel textarea{font:inherit;color:#F4F7FC;background:rgba(4,7,15,.7);border:1px solid rgba(244,247,252,.2);border-radius:12px;padding:9px 12px;width:100%;box-sizing:border-box;transition:border-color .2s,box-shadow .2s}',
    '.aqc-panel input[type=text]:focus,.aqc-panel input[type=email]:focus,.aqc-panel input[type=tel]:focus,.aqc-panel textarea:focus{border-color:#6E9BFF;box-shadow:0 0 0 3px rgba(110,155,255,.22)}',
    '.aqc-check{display:flex!important;align-items:flex-start;gap:8px}.aqc-check input{width:18px;height:18px;margin-top:1px;accent-color:#6E9BFF;flex:none}',
    '.aqc-go{font:inherit;font-weight:600;min-height:44px;border-radius:999px;border:0;background:linear-gradient(135deg,#6E9BFF,#3DDC97);color:#04101F;cursor:pointer;padding:0 16px;transition:transform .2s,box-shadow .2s}.aqc-go:hover{transform:translateY(-1px);box-shadow:0 10px 24px rgba(61,220,151,.28)}.aqc-go:disabled{opacity:.55;cursor:default;transform:none;box-shadow:none}',
    '.aqc-foot{padding:12px 14px 13px;border-top:1px solid rgba(244,247,252,.1);background:rgba(4,7,15,.35)}',
    '.aqc-row{display:flex;gap:8px;align-items:flex-end}.aqc-row textarea{resize:none;min-height:44px;max-height:110px;border-radius:22px;padding:11px 15px}',
    '.aqc-send{flex:none;width:44px;height:44px;border-radius:50%;border:0;background:linear-gradient(135deg,#6E9BFF,#3DDC97);color:#04101F;cursor:pointer;display:grid;place-items:center;transition:transform .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s,opacity .2s}',
    '.aqc-send svg{width:20px;height:20px;transition:transform .2s}.aqc-send:hover{box-shadow:0 8px 22px rgba(110,155,255,.4)}.aqc-send:hover svg{transform:translateY(-2px)}.aqc-send:active{transform:scale(.9)}.aqc-send:disabled{opacity:.45;cursor:default;box-shadow:none}',
    '.aqc-note{margin:9px 2px 0;font-size:11.5px;line-height:1.45;color:rgba(244,247,252,.6)}.aqc-note a{color:#8FB4FF}',
    '.aqc-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}',
    '.aqc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '@media (max-width:520px){.aqc-panel{right:10px;left:10px;width:auto;max-width:none;bottom:88px;height:min(640px,calc(100dvh - 108px));border-radius:20px;transform-origin:50% 100%}.aqc-tease{right:86px;max-width:calc(100vw - 110px)}.aqc-cta{margin:10px 10px 0}}',
    // On a narrow phone the longer "away" wording gets the full width, with its button on a row of its own.
    '@media (max-width:440px){.aqc-cta.aqc-cta-away{flex-wrap:wrap}.aqc-cta.aqc-cta-away .aqc-cta-t{flex:1 1 0}.aqc-cta.aqc-cta-away .aqc-cta-go{flex:1 1 100%}}',
    // On a phone the cookie notice fills the bottom of the screen until it is answered; the button waits above it.
    '@media (max-width:640px){body:has(.fx-ck) .aqc-btn{bottom:184px}body:has(.fx-ck) .aqc-tease{display:none}}',
    '@media (prefers-reduced-motion:reduce){.aqc-btn,.aqc-btn::after,.aqc-orb,.aqc-head::before,.aqc-new,.aqc-chip,.aqc-dots i,.aqc-live,.aqc-act b,.aqc-badge,.aqc-tease,.aqc-cta::before,.aqc-cta::after,.aqc-cta-ic b{animation:none!important}.aqc-btn,.aqc-btn svg,.aqc-panel,.aqc-x,.aqc-chip,.aqc-act,.aqc-go,.aqc-send,.aqc-send svg{transition:none!important}.aqc-btn::after{display:none}}'
  ].join('\n');

  var ICON_CHAT = '<svg class="aqc-ic-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.1A8.5 8.5 0 1 1 21 12Z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/></svg>';
  var ICON_X = '<svg class="aqc-ic-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
  var ICON_PERSON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><rect x="2.5" y="12.5" width="4" height="6" rx="1.6"/><rect x="17.5" y="12.5" width="4" height="6" rx="1.6"/><path d="M19.5 18.5v.5a3 3 0 0 1-3 3H13"/></svg>';
  var STARTERS = ['What does AQ Pay offer?', 'How do I get started?', 'Is my business eligible?'];

  function start(cfg) {
    load(); if (!state.sessionId) { state.sessionId = newId(); save(); }
    // The form has two shapes: 'intro' (name and email, then a person is asked to join) and 'leave' (details for an answer by email).
    if (state.form === true) state.form = 'leave';
    if (state.status === 'WAITING') state.form = false;
    var max = cfg.maxLength || 600, busy = false, unread = 0, pollTimer = 0, closing = 0;
    var style = el('style'); style.textContent = CSS; d.head.appendChild(style);
    d.documentElement.classList.add('aqc-on');

    var btn = el('button', 'aqc-btn'); btn.type = 'button'; btn.setAttribute('aria-controls', 'aqc-panel'); btn.innerHTML = '<i>' + ICON_CHAT + ICON_X + '</i>';
    var badge = el('span', 'aqc-badge'); badge.hidden = true; badge.setAttribute('aria-hidden', 'true'); btn.appendChild(badge);
    var panel = el('section', 'aqc-panel'); panel.id = 'aqc-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Chat with AQ Pay'); panel.hidden = true;
    var head = el('div', 'aqc-head'); var orb = el('span', 'aqc-orb'); var orbIn = el('img'); orbIn.src = '/aq-mark.svg'; orbIn.alt = ''; orbIn.width = 34; orbIn.height = 34; orb.appendChild(orbIn); orb.setAttribute('aria-hidden', 'true');
    var whoBox = el('div', 'aqc-who'); whoBox.appendChild(el('h2', '', 'AQ Pay')); var sub = el('p', 'aqc-sub'); var liveDot = el('span', 'aqc-live'); var subText = el('span'); sub.appendChild(liveDot); sub.appendChild(subText); whoBox.appendChild(sub);
    var x = el('button', 'aqc-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close the chat');
    head.appendChild(orb); head.appendChild(whoBox); head.appendChild(x);
    var cta = el('div', 'aqc-cta'); var ctaIc = el('span', 'aqc-cta-ic'); ctaIc.innerHTML = ICON_PERSON; ctaIc.appendChild(el('b')); ctaIc.setAttribute('aria-hidden', 'true');
    var ctaT = el('div', 'aqc-cta-t'); var ctaTitle = el('strong'); var ctaSub = el('span'); ctaT.appendChild(ctaTitle); ctaT.appendChild(ctaSub);
    var ctaBtn = el('button', 'aqc-cta-go'); ctaBtn.type = 'button';
    cta.appendChild(ctaIc); cta.appendChild(ctaT); cta.appendChild(ctaBtn);
    var log = el('div', 'aqc-log'); log.setAttribute('role', 'log'); log.setAttribute('aria-label', 'Conversation');
    var sr = el('div', 'aqc-sr'); sr.setAttribute('aria-live', 'polite');

    var form = el('form', 'aqc-form'); form.noValidate = true;
    var fTitle = el('h3'); form.appendChild(fTitle); var fLead = el('p'); form.appendChild(fLead);
    function field(label, type, name, auto, required) { var l = el('label', '', label); var i = el('input'); i.type = type; i.name = name; i.autocomplete = auto; if (required) i.required = true; i.maxLength = 200; l.appendChild(i); form.appendChild(l); return i; }
    var fName = field('Your name', 'text', 'name', 'name', true), fEmail = field('Email', 'email', 'email', 'email', true), fPhone = field('Phone (optional)', 'tel', 'phone', 'tel', false), fCompany = field('Company (optional)', 'text', 'company', 'organization', false);
    fPhone.maxLength = 40;
    var hp = el('input', 'aqc-hp'); hp.type = 'text'; hp.name = 'hp'; hp.tabIndex = -1; hp.autocomplete = 'off'; hp.setAttribute('aria-hidden', 'true'); form.appendChild(hp);
    var cl = el('label', 'aqc-check'); var consent = el('input'); consent.type = 'checkbox'; consent.name = 'consent'; consent.required = true; cl.appendChild(consent); cl.appendChild(el('span', '', 'You may contact me about this request.')); form.appendChild(cl);
    var fErr = el('p', 'aqc-err'); fErr.setAttribute('role', 'alert'); fErr.hidden = true; form.appendChild(fErr);
    var go = el('button', 'aqc-go', 'Send my details'); go.type = 'submit'; form.appendChild(go);

    var chips = el('div', 'aqc-chips');
    STARTERS.forEach(function (t, i) { var c = el('button', 'aqc-chip', t); c.type = 'button'; c.style.setProperty('--i', i); c.addEventListener('click', function () { ask(t); }); chips.appendChild(c); });

    var foot = el('div', 'aqc-foot'); var row = el('form', 'aqc-row');
    var input = el('textarea'); input.rows = 1; input.maxLength = max; input.placeholder = 'Type your question'; input.setAttribute('aria-label', 'Your message');
    var send = el('button', 'aqc-send'); send.type = 'submit'; send.setAttribute('aria-label', 'Send'); send.innerHTML = ICON_SEND;
    row.appendChild(input); row.appendChild(send); foot.appendChild(row);
    var note = el('p', 'aqc-note'); var noteText = d.createTextNode(''); note.appendChild(noteText); var pl = el('a', '', 'Privacy Policy'); pl.href = '/privacy'; note.appendChild(pl); note.appendChild(d.createTextNode('.'));
    foot.appendChild(note);
    panel.appendChild(head); panel.appendChild(cta); panel.appendChild(log); panel.appendChild(foot); panel.appendChild(sr);
    d.body.appendChild(btn); d.body.appendChild(panel);

    var waitEl = null, errEl = null;
    function bottom() { log.scrollTop = log.scrollHeight; }
    function header() {
      var s = state.status;
      subText.textContent = s === 'LIVE' ? (state.agent ? state.agent + ' is here' : 'A colleague is here') : s === 'WAITING' ? 'Asking a colleague to join…' : cfg.live && cfg.online ? 'AI assistant · team online' : 'AI assistant · answers in seconds';
      liveDot.className = 'aqc-live' + (s === 'WAITING' ? ' aqc-wait' : '');
      orbIn.textContent = s === 'LIVE' && state.agent ? state.agent.charAt(0).toUpperCase() : 'AQ';
      noteText.textContent = s === 'LIVE' ? 'You are talking to a member of our team. Messages are kept so we can follow up. See our ' : 'You are talking to an AI assistant, not a person. It can be wrong; a colleague confirms anything important. Messages are kept so our team can follow up. See our ';
      input.placeholder = s === 'LIVE' ? 'Write to ' + (state.agent || 'our colleague') : 'Type your question';
    }
    function bubble(m, fresh) {
      var b;
      if (m.who === 's') b = el('div', 'aqc-s', m.text);
      else if (m.who === 'p') { b = el('div', 'aqc-m aqc-p'); b.appendChild(el('small', '', m.name || 'Colleague')); b.appendChild(d.createTextNode(m.text)); }
      else b = el('div', 'aqc-m ' + (m.who === 'v' ? 'aqc-v' : 'aqc-a'), m.text);
      if (fresh) b.classList.add('aqc-new');
      return b;
    }
    /** The bar under the header: a person one press away while the team is there, a message for later while it is not. */
    function bar() {
      var s = state.status, online = !!(cfg.live && cfg.online);
      cta.hidden = s === 'LIVE'; if (cta.hidden) return;
      cta.className = 'aqc-cta' + (s === 'WAITING' ? ' aqc-cta-wait' : online ? '' : ' aqc-cta-away');
      ctaBtn.hidden = false;
      if (s === 'WAITING') { ctaTitle.textContent = 'Connecting you to a colleague'; ctaSub.textContent = 'Usually within a minute. You can keep typing.'; ctaBtn.hidden = true; }
      else if (online) { ctaTitle.textContent = 'Talk to a person'; ctaSub.textContent = 'Our team is online now'; ctaBtn.textContent = 'Connect'; }
      else if (state.captured) { ctaTitle.textContent = 'We have your details'; ctaSub.textContent = 'A colleague will get back to you by email.'; ctaBtn.hidden = true; }
      else { ctaTitle.textContent = 'Our team is away right now'; ctaSub.textContent = 'Leave a message and we will email you back.'; ctaBtn.textContent = 'Leave a message'; }
    }
    /** The form in the shape it is needed in: who you are before a person joins, or your details for an answer by email. */
    function formMode() {
      var intro = state.form === 'intro';
      fTitle.textContent = intro ? 'Before we connect you' : 'Leave a message';
      fLead.textContent = intro ? 'Tell us your name, and a colleague joins this chat. An email or a phone number is optional.' : 'Leave your details and a colleague will get back to you by email.';
      // An email is needed only when the answer is to come by email.
      fEmail.parentNode.firstChild.textContent = intro ? 'Email (optional)' : 'Email'; fEmail.required = !intro;
      fCompany.parentNode.hidden = intro; cl.hidden = intro; consent.required = !intro;
      if (!busy) go.textContent = intro ? 'Connect me to a person' : 'Send my details';
    }
    /** What sits under the conversation: starter questions at first, or the form when one is open. */
    function tail() {
      [chips, form].forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      if (!state.messages.length && state.status === 'AI') log.appendChild(chips);
      // With a person on the way or in the chat there is nothing to fill in; somebody whose details we have is not asked again.
      if (state.status !== 'AI' || state.captured) state.form = false;
      if (state.form) { formMode(); log.appendChild(form); }
      bar();
    }
    function render() {
      log.textContent = ''; log.appendChild(bubble({ who: 'a', text: cfg.greeting || 'Hello. How can we help?' }, false));
      state.messages.forEach(function (m) { log.appendChild(bubble(m, false)); });
      tail(); header(); bottom();
    }
    /** Writes an answer out a few words at a time, the way it would be typed. */
    function typeOut(node, text) {
      if (calm || text.length > 700) { node.textContent = text; bottom(); return; }
      var words = text.split(/(\s+)/), i = 0, step = Math.max(1, Math.ceil(words.length / 55)); node.textContent = '';
      (function next() { if (!node.isConnected) return; node.textContent += words.slice(i, i + step).join(''); i += step; bottom(); if (i < words.length) requestAnimationFrame(next); })();
    }
    function add(m, typed) {
      state.messages.push(m); if (state.messages.length > 80) state.messages = state.messages.slice(-80); save();
      if (waitEl) { waitEl.remove(); waitEl = null; }
      var b = bubble(m, true); log.appendChild(b); tail(); header(); bottom();
      if (typed && m.who === 'a') typeOut(b, m.text);
      if (m.who !== 'v') { sr.textContent = (m.who === 'p' ? (m.name || 'Colleague') + ': ' : '') + m.text; if (panel.hidden) { unread += 1; badge.textContent = String(unread); badge.hidden = false; } }
    }
    function waiting(on) {
      busy = on; send.disabled = on; go.disabled = on; if (waitEl) { waitEl.remove(); waitEl = null; }
      if (on) { waitEl = el('div', 'aqc-dots aqc-new'); waitEl.setAttribute('aria-label', 'Writing'); waitEl.innerHTML = '<i></i><i></i><i></i>'; log.insertBefore(waitEl, chips.parentNode === log ? chips : form.parentNode === log ? form : null); bottom(); }
    }
    function problem(text) { if (errEl) errEl.remove(); errEl = null; if (text) { errEl = el('div', 'aqc-err aqc-new', text); errEl.setAttribute('role', 'alert'); log.appendChild(errEl); bottom(); } }

    /** Takes in what a colleague or the system wrote. Each line is shown once, however often it arrives. */
    function take(list) {
      (list || []).forEach(function (m) {
        if (!m || !m.id || state.seen.indexOf(m.id) >= 0) return;
        state.seen.push(m.id); if (state.seen.length > 120) state.seen = state.seen.slice(-120);
        if (m.at && (!state.cursor || m.at > state.cursor)) state.cursor = m.at;
        add(m.role === 'AGENT' ? { who: 'p', text: m.text, name: m.name } : { who: 's', text: m.text }, false);
      });
    }
    function setStatus(next, agent) {
      var was = state.status; state.status = next || 'AI'; state.agent = state.status === 'LIVE' ? (agent || state.agent || '') : '';
      // Nobody joined in time: the form is the way to reach a person.
      if (was === 'WAITING' && state.status === 'AI' && !state.captured) state.form = 'leave';
      // With a person on the way or in the conversation, the form steps aside; "Leave your details" brings it back.
      if (state.status !== 'AI' && was !== state.status) state.form = false;
      save(); tail(); header(); if (was !== state.status) bottom();
      if (state.status === 'AI') stopPoll(); else startPoll();
    }
    function poll() {
      pollTimer = 0;
      var q = '?sessionId=' + encodeURIComponent(state.sessionId) + (state.cursor ? '&after=' + encodeURIComponent(state.cursor) : '');
      fetch(API + q, { headers: { Accept: 'application/json' } }).then(json).then(function (r) {
        if (r.ok) { take(r.body.messages); setStatus(r.body.status, r.body.agent); }
      }).catch(function () {}).then(function () { if (state.status !== 'AI' && !pollTimer) pollTimer = setTimeout(poll, d.hidden ? 8000 : 3000); });
    }
    function startPoll() { if (!pollTimer) pollTimer = setTimeout(poll, 1500); }
    function stopPoll() { if (pollTimer) { clearTimeout(pollTimer); pollTimer = 0; } }

    function ask(raw) {
      var text = String(raw || '').trim().slice(0, max); if (!text || busy) return;
      input.value = ''; input.style.height = ''; problem(''); add({ who: 'v', text: text }, false);
      var withPerson = state.status !== 'AI'; if (!withPerson) waiting(true);
      post({ sessionId: state.sessionId, message: text }).then(function (r) {
        waiting(false);
        if (!r.ok) { problem(r.body.error || 'That did not go through. Please try again, or use the contact form.'); return; }
        if (r.body.captured) state.captured = true;
        if (r.body.status && r.body.status !== state.status) setStatus(r.body.status);
        if (!r.body.reply) return;
        // The assistant suggests a person: with the team there, that is one short step away; otherwise a message for later.
        if (r.body.askContact && !state.captured) state.form = cfg.live && cfg.online ? (state.named ? false : 'intro') : 'leave';
        add({ who: 'a', text: r.body.reply }, true);
      }).catch(function () { waiting(false); problem('That did not go through. Please check your connection and try again.'); });
    }
    row.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); } });
    input.addEventListener('input', function () { input.style.height = ''; input.style.height = Math.min(110, input.scrollHeight) + 'px'; });
    /** Asks for a person. `who` carries the name and email the visitor just gave; without it, the ones we already have stand. */
    function connect(who) {
      var body = { action: 'handover', sessionId: state.sessionId };
      if (who) { body.name = who.name; body.email = who.email; body.phone = who.phone; body.hp = hp.value; body.visitorId = window.aqVisitorId ? window.aqVisitorId() : undefined; }
      return post(body).then(function (r) {
        if (!r.ok) return r;
        if (r.body.captured) state.captured = true;
        if (r.body.named) state.named = true;
        // Nobody there after all: a visitor we do not know yet is offered the message form instead.
        state.form = r.body.askContact && !state.captured ? 'leave' : false;
        take(r.body.messages); setStatus(r.body.status); tail(); bottom();
        return r;
      });
    }
    ctaBtn.addEventListener('click', function () {
      if (busy || state.status !== 'AI') return; problem('');
      if (cfg.live && cfg.online) {
        // Somebody whose name we have goes straight through; everybody else is asked who they are first.
        if (state.captured || state.named) { ctaBtn.disabled = true; connect(null).then(function (r) { ctaBtn.disabled = false; if (!r.ok) problem(r.body.error || 'That did not go through. Please try again.'); else input.focus(); }).catch(function () { ctaBtn.disabled = false; problem('That did not go through. Please check your connection and try again.'); }); }
        else { state.form = 'intro'; save(); tail(); bottom(); fName.focus(); }
      } else if (!state.captured) { state.form = 'leave'; save(); tail(); bottom(); fName.focus(); }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (busy) return; fErr.hidden = true;
      var name = fName.value.trim(), email = fEmail.value.trim();
      function bad(msg, f) { fErr.textContent = msg; fErr.hidden = false; f.focus(); }
      if (name.length < 2) return bad('Please enter your name.', fName);
      var intro = state.form === 'intro';
      // To be connected to a person a name is enough; an email is checked only if one was typed.
      if ((email || !intro) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(intro ? 'Please enter a valid email address, or leave it empty.' : 'Please enter a valid email address.', fEmail);
      if (!intro && !consent.checked) return bad('Please tick the box so we may contact you about this request.', consent);
      busy = true; go.disabled = true; go.textContent = intro ? 'Connecting…' : 'Sending…';
      function done() { busy = false; go.disabled = false; formMode(); }
      if (intro) {
        connect({ name: name, email: email, phone: fPhone.value.trim() }).then(function (r) {
          done();
          if (!r.ok) { fErr.textContent = r.body.error || 'That did not go through. Please try again.'; fErr.hidden = false; return; }
          input.focus();
        }).catch(function () { done(); fErr.textContent = 'That did not go through. Please check your connection and try again.'; fErr.hidden = false; });
        return;
      }
      post({ action: 'contact', sessionId: state.sessionId, name: name, email: email, phone: fPhone.value.trim(), company: fCompany.value.trim(), consent: true, hp: hp.value, visitorId: window.aqVisitorId ? window.aqVisitorId() : undefined }).then(function (r) {
        done();
        if (!r.ok) { fErr.textContent = r.body.error || 'That did not go through. Please try again.'; fErr.hidden = false; return; }
        state.captured = true; state.form = false; add({ who: 'a', text: r.body.reply || 'Thank you. A colleague will get back to you by email.' }, true); input.focus();
      }).catch(function () { done(); fErr.textContent = 'That did not go through. Please check your connection and try again.'; fErr.hidden = false; });
    });

    /** Asks again whether someone of the team is there, so the button and the header say what is true now. */
    function refresh() {
      if (state.status !== 'AI') return;
      fetch(API, { headers: { Accept: 'application/json' } }).then(json).then(function (r) {
        if (!r.ok || !r.body.enabled) return;
        var changed = cfg.online !== !!r.body.online || cfg.live !== !!r.body.live; cfg.online = !!r.body.online; cfg.live = !!r.body.live;
        if (changed && state.open) { tail(); header(); }
      }).catch(function () {});
    }
    setInterval(function () { if (state.open && !d.hidden) refresh(); }, 30000);
    var tease = null;
    function untease() { if (tease) { tease.remove(); tease = null; } }
    function setOpen(on, focus) {
      state.open = on; if (on) state.teased = true; save(); untease(); clearTimeout(closing);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false'); btn.setAttribute('aria-label', on ? 'Close the chat' : 'Chat with us'); btn.classList.toggle('aqc-quiet', state.teased);
      if (on) {
        unread = 0; badge.hidden = true; panel.hidden = false; render();
        // Two frames later, so the panel grows out of the button instead of appearing at full size.
        requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add('aqc-in'); }); });
        if (focus) { (state.form && !state.captured ? fName : input).focus(); refresh(); }
      } else {
        panel.classList.remove('aqc-in'); closing = setTimeout(function () { panel.hidden = true; }, calm ? 0 : 240);
        if (focus) btn.focus();
      }
    }
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true', true); });
    x.addEventListener('click', function () { setOpen(false, true); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.open) setOpen(false, true); });
    d.addEventListener('visibilitychange', function () { if (!d.hidden && state.status !== 'AI') { stopPoll(); poll(); } });
    // A conversation that was open on the last page stays open on this one, and one with a person keeps being followed.
    setOpen(state.open, false);
    if (state.status !== 'AI') startPoll();
    if (!state.teased && !state.open) setTimeout(function () {
      if (state.open || state.teased || d.querySelector('.fx-ck')) return;
      state.teased = true; save(); btn.classList.add('aqc-quiet');
      tease = el('button', 'aqc-tease'); tease.type = 'button'; tease.appendChild(el('b', '', 'Questions about payments?')); tease.appendChild(el('span', '', cfg.live && cfg.online ? 'Ask our assistant, or talk to a person now.' : 'Ask our assistant. It answers in seconds.'));
      tease.addEventListener('click', function () { setOpen(true, true); }); d.body.appendChild(tease);
      setTimeout(untease, 12000);
    }, 6000);
  }

  function boot() {
    fetch(API, { headers: { Accept: 'application/json' } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (cfg) { if (cfg && cfg.enabled) start(cfg); }).catch(function () {});
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
