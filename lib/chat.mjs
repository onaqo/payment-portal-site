// Website chat: passes a visitor's messages to the sales portal, whose assistant answers them, and passes the
// answers back. Used by both the Netlify function and the Vercel API route.
//
// It runs on the server so the portal key never reaches a visitor's browser. It uses the same two variables as the
// contact form (see lib/contact.mjs); nothing else needs to be set:
//   SALES_ENQUIRY_URL  https://<your sales portal>/api/public/sales/enquiries
//   SALES_ENQUIRY_KEY  enq_...
// The chat box appears on the site only while the chat is switched on for this website in the portal
// (Settings → Website enquiries & chat → Chat). With the variables missing, or the chat off, nothing is shown.
// A visitor can also ask for a person there; a colleague then answers in the same chat box.
import { createHash } from 'node:crypto';
import { visitorRef } from './track.mjs';

const clean = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The portal accepts conversation ids of 32 to 80 of these characters; chat.js makes 32.
const SESSION_RE = /^[A-Za-z0-9_-]{32,80}$/;
const OFF = { enabled: false };
const UNAVAILABLE = { status: 503, body: { error: 'The chat is not available right now. Please use the contact form.' } };

/** The portal's chat address, worked out from the enquiry address so there is one variable to keep right. */
function chatUrl(env) {
  const base = env.SALES_ENQUIRY_URL, key = env.SALES_ENQUIRY_KEY;
  if (!base || !key || !/\/enquiries\/?$/.test(base)) return null;
  return base.replace(/\/enquiries\/?$/, '/chat');
}

async function portal(env, path, init = {}) {
  const url = chatUrl(env);
  if (!url) return null;
  try {
    const { timeout, ...rest } = init;
    const res = await fetch(url + path, { ...rest, headers: { Authorization: `Bearer ${env.SALES_ENQUIRY_KEY}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(timeout || (init.method === 'POST' ? 45000 : 6000)) });
    if (!res.ok) { console.error(`chat: sales portal answered ${res.status}`); return null; }
    return await res.json();
  } catch (err) {
    console.error('chat: sales portal not reached', err && err.message ? err.message : err);
    return null;
  }
}

// Whether the chat is on, and whether someone of the team is there, is asked of the portal at most every 20 seconds per running copy of this function.
let cached = { at: 0, value: OFF };
async function config(env) {
  if (Date.now() - cached.at < 20000) return cached.value;
  const c = await portal(env, '');
  const value = c && c.enabled ? { enabled: true, greeting: clean(c.greeting, 300), maxLength: Number(c.maxLength) || 600, live: !!c.live, online: !!c.live && !!c.online } : OFF;
  cached = { at: Date.now(), value };
  return value;
}

/** Tells visitors apart for the portal's limits without sending it anyone's address. */
function visitorHash(env, ip) {
  return ip ? createHash('sha256').update(`${env.SALES_ENQUIRY_KEY}:${ip}`).digest('hex').slice(0, 32) : undefined;
}

/** What a colleague or the system wrote, as the page shows it: an id, who, the text and when. Nothing else is passed on. */
function lines(list) {
  return (Array.isArray(list) ? list : []).slice(0, 60).map(m => ({ id: clean(m.id, 80), role: m.role === 'AGENT' ? 'AGENT' : 'SYSTEM', text: clean(m.text, 1600), at: clean(m.at, 40), name: m.role === 'AGENT' ? clean(m.name, 40) : undefined })).filter(m => m.id && m.text);
}
/* ---------- Abuse protection ----------
 * Attempts to trick the assistant into revealing its instructions, tools or other visitors' chats get a fixed reply
 * here and are never answered by the assistant: no AI cost. They are still passed to the portal marked `probe: true`,
 * without waiting for it, so the portal keeps the message unanswered and marks the conversation as spam. A visitor who
 * keeps trying, or sends messages in a burst, is paused; while paused they cannot leave their details or ask for a
 * person either. Counts are kept per visitor (a hash of the address, else the conversation) in each running copy of
 * this function, so they reset when it restarts; the portal's own limits still apply behind them. Blocked messages are
 * logged as "chat: blocked (reason)" in the hosting logs. */
const PROBES = [
  /\b(system|developer|hidden|initial|original|internal|secret)\s+(prompt|message|instructions?|configuration|config|rules)\b/i,
  /\bignore\b.{0,30}\b(previous|prior|above|earlier|all|your|the)\b.{0,20}\b(instructions?|rules|messages?|prompts?|guidelines|words)\b/i,
  /\b(instructions?|rules|guidelines|guardrails)\b.{0,30}\b(you were|you've been|you have been|you are|you must|you have to)\b/i,
  /\byou (are|have|now have)\b.{0,40}\b(no|without) (restrictions?|guardrails|rules|limits|filters)\b/i,
  /\b(jailbreak|DAN mode|developer mode|god mode|prompt injection)\b/i,
  /\b(tools?|functions?)\b.{0,50}\b(invoke|call|json schema|schema)\b/i,
  /\b(print|output|reveal|repeat|dump|leak|show|state|list)\b.{0,50}\b(your|the|hidden|first \d+ words)\b.{0,30}\b(instructions|prompt|configuration|guardrails|context window|context)\b/i,
  /\b(messages?|conversations?|chats?) (from|of|with) other (users|visitors|people|customers)\b/i,
  /\bcomplete this (yaml|json|xml)\b/i,
  /<\/?(system|instructions?|sys)>|\[\/?(INST|SYS)\]|<\|im_(start|end)\|>/i,
];
const PROBE_REPLY = 'I can only help with questions about AQ Pay’s payment services, such as white-label gateways, merchant accounts and payment orchestration. What would you like to know?';
const PAUSED_REPLY = 'This chat is paused for a while. If you have a question about AQ Pay, please write to hello@aqpay.services or use the form at aqpay.services/book-a-demo.';
const SLOW_REPLY = 'You’re sending messages very quickly. Please wait a minute and try again, or write to hello@aqpay.services.';
const seen = new Map(); // visitor -> { t: [times], probes: n, pausedUntil }
/** Whether this visitor is paused for probing. Leaving details and asking for a person check this too. */
function paused(key, now = Date.now()) {
  const v = key && seen.get(key);
  return !!v && v.pausedUntil > now;
}
/** Looks at a chat message before it goes to the assistant. Returns null to let it through, or why it was stopped and
 * the reply; `probe` is set when the message itself is a probe, which the portal is then told about. */
function guard(key, message, now = Date.now()) {
  if (!key) return null;
  if (seen.size > 5000) seen.clear();
  const v = seen.get(key) || { t: [], probes: 0, pausedUntil: 0 }; seen.set(key, v);
  if (v.pausedUntil > now) return { reason: 'paused', reply: PAUSED_REPLY };
  v.t = v.t.filter(x => now - x < 3600e3); v.t.push(now);
  if (v.t.filter(x => now - x < 60e3).length > 8 || v.t.length > 40) return { reason: 'too many messages', reply: SLOW_REPLY };
  if (PROBES.some(r => r.test(message))) {
    v.probes += 1;
    if (v.probes >= 3) { v.pausedUntil = now + 3600e3; return { reason: 'probing, paused for an hour', reply: PAUSED_REPLY, probe: true }; }
    return { reason: 'probe', reply: PROBE_REPLY, probe: true };
  }
  return null;
}
export const _chatGuard = guard; // for tests
export const _chatReset = () => { seen.clear(); cached = { at: 0, value: OFF }; }; // for tests
export const _chatReplies = { PROBE_REPLY, PAUSED_REPLY, SLOW_REPLY }; // for tests
// A paused visitor who tries to leave details or ask for a person sees the same words as in the chat, as an error the page shows.
const PAUSED = { status: 429, body: { error: PAUSED_REPLY, limited: true } };

const STATUSES = ['AI', 'WAITING', 'LIVE'];
const status = v => (STATUSES.includes(v) ? v : 'AI');

/**
 * @param {string} method GET (is the chat on? or, with a conversation id, what a colleague wrote since) or POST (a message, a request for a person, or the visitor's details)
 * @param {object|string} raw the request body
 * @param {object} env environment variables
 * @param {{ pageUrl?: string, ip?: string, userAgent?: string, origin?: string, host?: string, query?: Record<string, string>, waitUntil?: (p: Promise<unknown>) => void }} meta what the caller knows about the request; `waitUntil`, where the host offers one, keeps the function running for work done after the answer
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function handleChat(method, raw, env = process.env, meta = {}) {
  if (method === 'GET') {
    const sessionId = clean(meta.query && meta.query.sessionId, 80);
    if (!sessionId) return { status: 200, body: await config(env) };
    // While a visitor waits for, or talks to, a person, the page asks every few seconds what was written since it last looked.
    if (!SESSION_RE.test(sessionId)) return { status: 400, body: { error: 'Invalid request.' } };
    const after = clean(meta.query.after, 40);
    const q = new URLSearchParams({ sessionId }); if (after && !Number.isNaN(Date.parse(after))) q.set('after', new Date(after).toISOString());
    const out = await portal(env, `/messages?${q}`);
    return out ? { status: 200, body: { status: status(out.status), agent: out.agent ? clean(out.agent, 40) : null, messages: lines(out.messages) } } : UNAVAILABLE;
  }
  if (method !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };
  // Only pages of this site may post here.
  if (meta.origin && meta.host) { try { if (new URL(meta.origin).host !== meta.host) return { status: 403, body: { error: 'Not allowed.' } }; } catch { return { status: 403, body: { error: 'Not allowed.' } }; } }
  let data = raw;
  if (typeof raw === 'string') { try { data = JSON.parse(raw || '{}'); } catch { return { status: 400, body: { error: 'Invalid request.' } }; } }
  if (!data || typeof data !== 'object') return { status: 400, body: { error: 'Invalid request.' } };
  // Honeypot: real visitors never fill this hidden field. Pretend success for bots.
  if (clean(data.hp, 200)) return { status: 200, body: { reply: '', askContact: false } };
  const sessionId = clean(data.sessionId, 80);
  if (!SESSION_RE.test(sessionId)) return { status: 400, body: { error: 'Invalid request.' } };
  if (!(await config(env)).enabled) return UNAVAILABLE;
  const common = { sessionId, pageUrl: clean(meta.pageUrl, 500) || undefined, visitorHash: visitorHash(env, clean(meta.ip, 80)) };
  const visitor = common.visitorHash || sessionId;

  if ((data.action === 'contact' || data.action === 'handover') && paused(visitor)) { console.warn(`chat: blocked (${data.action} while paused)`); return PAUSED; }

  if (data.action === 'contact') {
    const name = clean(data.name, 200), email = clean(data.email, 200);
    if (name.length < 2) return { status: 422, body: { error: 'Please enter your name.' } };
    if (!EMAIL_RE.test(email)) return { status: 422, body: { error: 'Please enter a valid email address.' } };
    if (data.consent !== true) return { status: 422, body: { error: 'Please tick the box so we may contact you about this request.' } };
    const out = await portal(env, '/contact', { method: 'POST', body: JSON.stringify({ ...common, name, email, company: clean(data.company, 200) || undefined, phone: clean(data.phone, 40) || undefined, consent: true, userAgent: clean(meta.userAgent, 400) || undefined, visitorId: (visitorRef(env, meta, data.visitorId) || {}).visitorId }) });
    return out ? { status: 200, body: { ok: true, reply: clean(out.reply, 1500) } } : UNAVAILABLE;
  }

  if (data.action === 'handover') {
    // The page asks for a name before it asks for a person, so the colleague who joins knows who it is. An email and a
    // phone number are optional; with an email the portal can also follow up afterwards.
    const name = clean(data.name, 200), email = clean(data.email, 200), phone = clean(data.phone, 40);
    let who = {};
    if (name || email || phone) {
      if (name.length < 2) return { status: 422, body: { error: 'Please enter your name.' } };
      if (email && !EMAIL_RE.test(email)) return { status: 422, body: { error: 'Please enter a valid email address, or leave it empty.' } };
      who = { name, email: email || undefined, phone: phone || undefined, userAgent: clean(meta.userAgent, 400) || undefined, visitorId: (visitorRef(env, meta, data.visitorId) || {}).visitorId };
    }
    const out = await portal(env, '/handover', { method: 'POST', body: JSON.stringify({ ...common, ...who }) });
    // named: the colleague knows who it is. captured: we also have an email to write to, so the visitor is not asked for details again.
    return out ? { status: 200, body: { status: status(out.status), messages: lines(out.messages), askContact: !!out.askContact, named: !!who.name, captured: !!who.email } } : UNAVAILABLE;
  }

  const message = clean(data.message, 600);
  if (!message) return { status: 422, body: { error: 'Please type a message.' } };
  const blocked = guard(visitor, message);
  if (blocked) {
    console.warn(`chat: blocked (${blocked.reason})`);
    // A probe is kept by the portal, unanswered, and marks the conversation as spam. The visitor gets the reply from
    // here either way, so the portal's answer is neither waited for nor shown.
    if (blocked.probe) {
      const sent = portal(env, '', { method: 'POST', timeout: 8000, body: JSON.stringify({ ...common, message, probe: true }) });
      if (typeof meta.waitUntil === 'function') { try { meta.waitUntil(sent); } catch { /* the message is on its way regardless */ } }
    }
    return { status: 200, body: { reply: blocked.reply, askContact: false, captured: false, limited: true, status: 'AI' } };
  }
  const out = await portal(env, '', { method: 'POST', body: JSON.stringify({ ...common, message }) });
  return out ? { status: 200, body: { reply: clean(out.reply, 1500), askContact: !!out.askContact, captured: !!out.captured, limited: !!out.limited, status: status(out.status) } } : UNAVAILABLE;
}
