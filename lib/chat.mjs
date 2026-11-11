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
const SESSION_RE = /^[A-Za-z0-9_-]{16,80}$/;
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
    const res = await fetch(url + path, { ...init, headers: { Authorization: `Bearer ${env.SALES_ENQUIRY_KEY}`, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(init.method === 'POST' ? 45000 : 6000) });
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
const STATUSES = ['AI', 'WAITING', 'LIVE'];
const status = v => (STATUSES.includes(v) ? v : 'AI');

/**
 * @param {string} method GET (is the chat on? or, with a conversation id, what a colleague wrote since) or POST (a message, a request for a person, or the visitor's details)
 * @param {object|string} raw the request body
 * @param {object} env environment variables
 * @param {{ pageUrl?: string, ip?: string, userAgent?: string, origin?: string, host?: string, query?: Record<string, string> }} meta what the caller knows about the request
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

  if (data.action === 'contact') {
    const name = clean(data.name, 200), email = clean(data.email, 200);
    if (name.length < 2) return { status: 422, body: { error: 'Please enter your name.' } };
    if (!EMAIL_RE.test(email)) return { status: 422, body: { error: 'Please enter a valid email address.' } };
    if (data.consent !== true) return { status: 422, body: { error: 'Please tick the box so we may contact you about this request.' } };
    const out = await portal(env, '/contact', { method: 'POST', body: JSON.stringify({ ...common, name, email, company: clean(data.company, 200) || undefined, phone: clean(data.phone, 40) || undefined, consent: true, userAgent: clean(meta.userAgent, 400) || undefined, visitorId: (visitorRef(env, meta, data.visitorId) || {}).visitorId }) });
    return out ? { status: 200, body: { ok: true, reply: clean(out.reply, 1500) } } : UNAVAILABLE;
  }

  if (data.action === 'handover') {
    const out = await portal(env, '/handover', { method: 'POST', body: JSON.stringify(common) });
    return out ? { status: 200, body: { status: status(out.status), messages: lines(out.messages), askContact: !!out.askContact } } : UNAVAILABLE;
  }

  const message = clean(data.message, 600);
  if (!message) return { status: 422, body: { error: 'Please type a message.' } };
  const out = await portal(env, '', { method: 'POST', body: JSON.stringify({ ...common, message }) });
  return out ? { status: 200, body: { reply: clean(out.reply, 1500), askContact: !!out.askContact, captured: !!out.captured, limited: !!out.limited, status: status(out.status) } } : UNAVAILABLE;
}
