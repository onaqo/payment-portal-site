// Website chat: passes a visitor's messages to the sales portal, whose assistant answers them, and passes the
// answers back. Used by both the Netlify function and the Vercel API route.
//
// It runs on the server so the portal key never reaches a visitor's browser. It uses the same two variables as the
// contact form (see lib/contact.mjs); nothing else needs to be set:
//   SALES_ENQUIRY_URL  https://<your sales portal>/api/public/sales/enquiries
//   SALES_ENQUIRY_KEY  enq_...
// The chat box appears on the site only while the chat is switched on for this website in the portal
// (Settings → Website enquiries & chat → Chat). With the variables missing, or the chat off, nothing is shown.
import { createHash } from 'node:crypto';

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

// Whether the chat is on is asked of the portal at most once a minute per running copy of this function.
let cached = { at: 0, value: OFF };
async function config(env) {
  if (Date.now() - cached.at < 60000) return cached.value;
  const c = await portal(env, '');
  const value = c && c.enabled ? { enabled: true, greeting: clean(c.greeting, 300), maxLength: Number(c.maxLength) || 600 } : OFF;
  cached = { at: Date.now(), value };
  return value;
}

/** Tells visitors apart for the portal's limits without sending it anyone's address. */
function visitorHash(env, ip) {
  return ip ? createHash('sha256').update(`${env.SALES_ENQUIRY_KEY}:${ip}`).digest('hex').slice(0, 32) : undefined;
}

/**
 * @param {string} method GET (is the chat on?) or POST (a message, or the visitor's details)
 * @param {object|string} raw the request body
 * @param {object} env environment variables
 * @param {{ pageUrl?: string, ip?: string, origin?: string, host?: string }} meta what the caller knows about the request
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function handleChat(method, raw, env = process.env, meta = {}) {
  if (method === 'GET') return { status: 200, body: await config(env) };
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
    const out = await portal(env, '/contact', { method: 'POST', body: JSON.stringify({ ...common, name, email, company: clean(data.company, 200) || undefined, phone: clean(data.phone, 40) || undefined, consent: true }) });
    return out ? { status: 200, body: { ok: true, reply: clean(out.reply, 1500) } } : UNAVAILABLE;
  }

  const message = clean(data.message, 600);
  if (!message) return { status: 422, body: { error: 'Please type a message.' } };
  const out = await portal(env, '', { method: 'POST', body: JSON.stringify({ ...common, message }) });
  return out ? { status: 200, body: { reply: clean(out.reply, 1500), askContact: !!out.askContact, captured: !!out.captured, limited: !!out.limited } } : UNAVAILABLE;
}
