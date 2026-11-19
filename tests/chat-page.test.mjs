// chat.js (the chat box on the page), run in a small stand-in for a browser: conversation ids are at least 32
// characters however old the browser, an old short id is replaced, and the portal's "write your question first" line
// after asking for a person shows as an ordinary system line.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { settle } from './helpers.mjs';

const SOURCE = readFileSync(new URL('../chat.js', import.meta.url), 'utf8');
const ID_RE = /^[A-Za-z0-9_-]{32,80}$/;

/* ---------- newId, on its own ---------- */
function newIdWith(crypto, random = Math.random) {
  const start = SOURCE.indexOf('var ID_RE'), end = SOURCE.indexOf('function el(');
  assert.ok(start > 0 && end > start, 'newId is where the test expects it');
  const ctx = vm.createContext({ crypto, Math: Object.create(Math, { random: { value: random } }), Date, Array, Uint8Array, String });
  vm.runInContext(SOURCE.slice(start, end) + '\nthis.newId = newId;', ctx);
  return ctx.newId;
}

test('newId: 32 characters with randomUUID', () => {
  const id = newIdWith({ randomUUID: () => '123e4567-e89b-12d3-a456-426614174000' })();
  assert.equal(id, '123e4567e89b12d3a456426614174000');
  assert.match(id, ID_RE);
});

test('newId: 32 characters with only getRandomValues', () => {
  const id = newIdWith({ getRandomValues: a => { for (let i = 0; i < a.length; i++) a[i] = i * 7; return a; } })();
  assert.equal(id.length, 32);
  assert.match(id, ID_RE);
});

test('newId: 32 characters without crypto, even when Math.random gives short strings', () => {
  for (const random of [Math.random, () => 0.5, () => 0.25, () => 1 / 36, () => 0]) {
    // 0 would give an empty string forever; the loop must still end, so stop it after a while.
    let n = 0; const r = () => (++n > 50 ? 0.123456789 : random());
    const id = newIdWith(undefined, r)();
    assert.equal(id.length, 32, `with ${random}`);
    assert.match(id, ID_RE);
  }
});

/* ---------- the whole chat box, in a stand-in DOM ---------- */
class Node_ {
  constructor(tag, doc) { this.tagName = tag; this.ownerDocument = doc; this.children = []; this.parentNode = null; this.attrs = {}; this.listeners = {}; this.className = ''; this.hidden = false; this.style = { setProperty() {} }; this._text = ''; this.scrollHeight = 0; this.isConnected = true; }
  get classList() { const n = this; return { add: c => { if (!n.className.split(' ').includes(c)) n.className = (n.className + ' ' + c).trim(); }, remove: c => { n.className = n.className.split(' ').filter(x => x !== c).join(' '); }, toggle: (c, on) => (on ? n.classList.add(c) : n.classList.remove(c)), contains: c => n.className.split(' ').includes(c) }; }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
  set textContent(v) { this.children.forEach(c => { c.parentNode = null; }); this.children = []; this._text = String(v); }
  set innerHTML(v) { this._html = v; }
  get firstChild() { return this.children[0] || null; }
  appendChild(c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.push(c); return c; }
  insertBefore(c, ref) { if (!ref) return this.appendChild(c); if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.splice(this.children.indexOf(ref), 0, c); return c; }
  removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; return c; }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  addEventListener(t, f) { (this.listeners[t] ||= []).push(f); }
  fire(t, e = {}) { (this.listeners[t] || []).forEach(f => f({ preventDefault() {}, ...e })); }
  focus() {}
  find(pred) { if (pred(this)) return this; for (const c of this.children) { const f = c.find && c.find(pred); if (f) return f; } return null; }
  findAll(pred, out = []) { if (pred(this)) out.push(this); this.children.forEach(c => c.findAll && c.findAll(pred, out)); return out; }
}
class Text_ { constructor(t) { this.textContent = t; this.parentNode = null; } }

function page({ stored, answers, crypto = globalThis.crypto }) {
  const doc = { readyState: 'complete', hidden: false, listeners: {}, addEventListener() {}, querySelector: () => null };
  doc.createElement = tag => new Node_(tag, doc);
  doc.createTextNode = t => new Text_(t);
  doc.head = new Node_('head', doc); doc.body = new Node_('body', doc); doc.documentElement = new Node_('html', doc);
  const store = new Map(stored ? [['aq-chat-v2', JSON.stringify(stored)]] : []);
  const posts = [];
  const fetch = (url, init = {}) => {
    const body = init.body ? JSON.parse(init.body) : null; if (body) posts.push(body);
    const out = answers(url, body), status = (out && out._status) || 200;
    return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(out) });
  };
  const win = { document: doc, fetch, crypto, sessionStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }, matchMedia: () => ({ matches: true }), requestAnimationFrame() {}, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, Math, Date, JSON, Array, String, Uint8Array, Promise };
  win.window = win;
  vm.runInContext(SOURCE, vm.createContext(win));
  return { doc, store, posts, state: () => JSON.parse(store.get('aq-chat-v2')) };
}

const CFG = { enabled: true, greeting: 'Hello. How can we help?', maxLength: 600, live: true, online: true };
const LINE = 'Write your question in the box first, then ask for a colleague: they join knowing what you need.';

test('a stored conversation id shorter than 32 characters is replaced', async () => {
  const p = page({ stored: { sessionId: 'v1abc23short', messages: [], status: 'WAITING', open: false }, answers: () => CFG });
  await settle();
  const s = p.state();
  assert.match(s.sessionId, ID_RE);
  assert.notEqual(s.sessionId, 'v1abc23short');
  assert.equal(s.status, 'AI');
});

test('a stored 32-character id is kept', async () => {
  const p = page({ stored: { sessionId: 'f'.repeat(32), messages: [], open: false }, answers: () => CFG });
  await settle();
  assert.equal(p.state().sessionId, 'f'.repeat(32));
});

test('the “write your question first” line after asking for a person shows as an ordinary system line', async () => {
  const sid = 'e'.repeat(32);
  const p = page({
    stored: { sessionId: sid, messages: [], open: true, named: true, status: 'AI' },
    answers: (url, body) => (body && body.action === 'handover'
      ? { status: 'AI', messages: [{ id: 'wcm_1', role: 'SYSTEM', text: LINE, at: '2026-11-19T12:00:00.000Z' }], askContact: false, named: false, captured: false }
      : CFG),
  });
  await settle();
  const button = p.doc.body.find(n => n.className === 'aqc-cta-go');
  assert.ok(button, 'the "Connect" button is there');
  button.fire('click');
  await settle();
  assert.deepEqual(p.posts.map(b => b.action), ['handover']);
  assert.equal(p.posts[0].sessionId, sid);
  const log = p.doc.body.find(n => n.className === 'aqc-log');
  const system = log.findAll(n => n.classList && n.classList.contains('aqc-s'));
  assert.equal(system.length, 1);
  assert.equal(system[0].textContent, LINE);
  assert.equal(log.find(n => n.className === 'aqc-form'), null, 'no form is opened');
  assert.equal(log.find(n => n.classList && n.classList.contains('aqc-err')), null, 'no error is shown');
  const s = p.state();
  assert.equal(s.status, 'AI');
  assert.equal(s.form, false);
  assert.deepEqual(s.messages, [{ who: 's', text: LINE }]);
  // The bar still offers a person, ready for when the visitor has written something.
  assert.equal(button.hidden, false);
  assert.equal(button.textContent, 'Connect');
});

test('a paused visitor asking for a person sees the paused words, and the chat stays as it was', async () => {
  const PAUSED = 'This chat is paused for a while. If you have a question about AQ Pay, please write to hello@aqpay.services.';
  const p = page({
    stored: { sessionId: 'd'.repeat(32), messages: [], open: true, named: true, status: 'AI' },
    answers: (url, body) => (body && body.action === 'handover' ? { _status: 429, error: PAUSED, limited: true } : CFG),
  });
  await settle();
  p.doc.body.find(n => n.className === 'aqc-cta-go').fire('click');
  await settle();
  const log = p.doc.body.find(n => n.className === 'aqc-log');
  const err = log.find(n => n.classList && n.classList.contains('aqc-err'));
  assert.ok(err, 'an error line is shown');
  assert.equal(err.textContent, PAUSED);
  assert.equal(p.state().status, 'AI');
});

test('a paused visitor leaving their details sees the paused words in the form and is not marked as captured', async () => {
  const PAUSED = 'This chat is paused for a while.';
  const p = page({
    stored: { sessionId: 'd'.repeat(32), messages: [], open: true, status: 'AI', form: 'leave' },
    answers: (url, body) => (body && body.action === 'contact' ? { _status: 429, error: PAUSED, limited: true } : { ...CFG, online: false }),
  });
  await settle();
  const form = p.doc.body.find(n => n.className === 'aqc-form');
  assert.ok(form, 'the form is open');
  const inputs = form.findAll(n => n.tagName === 'input');
  const by = name => inputs.find(i => i.name === name);
  by('name').value = 'Pat Example'; by('email').value = 'pat@example.test'; by('phone').value = ''; by('company').value = ''; by('hp').value = ''; by('consent').checked = true;
  form.fire('submit');
  await settle();
  assert.deepEqual(p.posts.map(b => b.action), ['contact']);
  const err = form.find(n => n.className === 'aqc-err');
  assert.equal(err.hidden, false);
  assert.equal(err.textContent, PAUSED);
  assert.equal(p.state().captured, false);
});
