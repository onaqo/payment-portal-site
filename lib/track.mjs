// Visitor analytics: passes each page view to the sales portal, which counts it (Web Analytics there).
// Used by both the Netlify function and the Vercel API route.
//
// It runs on the server so the portal key never reaches a visitor's browser, and so the visitor's address never
// reaches the portal: the portal gets a one-way hash of it, made with the key. It uses the same two variables as the
// contact form (see lib/contact.mjs); nothing else needs to be set:
//   SALES_ENQUIRY_URL  https://<your sales portal>/api/public/sales/enquiries
//   SALES_ENQUIRY_KEY  enq_...
// With the variables missing, or counting switched off for this website in the portal, nothing is recorded.
// No cookie is set. Only a visitor who chose "Accept all" in the cookie banner sends the id their browser keeps.
import { createHash } from 'node:crypto';

const clean = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, max);
const TYPES = ['page', 'event', 'ping', 'leave'];
const VISITOR_RE = /^[A-Za-z0-9_-]{16,64}$/;
const EVENT_RE = /^[a-z0-9][a-z0-9_:-]{0,39}$/;
const whole = (v, max) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= 0 ? Math.min(n, max) : undefined; };

/** The portal's address for page views, worked out from the enquiry address so there is one variable to keep right. */
function trackUrl(env) {
  const base = env.SALES_ENQUIRY_URL, key = env.SALES_ENQUIRY_KEY;
  if (!base || !key || !/\/enquiries\/?$/.test(base)) return null;
  return base.replace(/\/enquiries\/?$/, '/track');
}
/** Tells visitors apart without sending the portal anyone's address. The same hash the chat and the forms send. */
export function visitorHash(env, ip) {
  return ip && env.SALES_ENQUIRY_KEY ? createHash('sha256').update(`${env.SALES_ENQUIRY_KEY}:${ip}`).digest('hex').slice(0, 32) : undefined;
}
/** What a form or the chat sends along so the portal can put the visit on the lead it creates. */
export function visitorRef(env, meta = {}, visitorId) {
  const hash = visitorHash(env, clean(meta.ip, 80));
  if (!hash) return undefined;
  const id = clean(visitorId, 64);
  return { visitorHash: hash, userAgent: clean(meta.userAgent, 400) || undefined, visitorId: VISITOR_RE.test(id) ? id : undefined };
}

/**
 * @param {object|string} raw the request body (the browser sends JSON as text)
 * @param {object} env environment variables
 * @param {{ ip?: string, userAgent?: string, origin?: string, host?: string, country?: string, region?: string, city?: string }} meta what the caller knows about the request
 * @returns {Promise<{ status: number }>} always quick, never an error the visitor could see
 */
export async function handleTrack(raw, env = process.env, meta = {}) {
  const url = trackUrl(env);
  if (!url) return { status: 204 };
  // Only pages of this site may report here.
  if (meta.origin && meta.host) { try { if (new URL(meta.origin).host !== meta.host) return { status: 403 }; } catch { return { status: 403 }; } }
  let data = raw;
  if (typeof raw === 'string') { try { data = JSON.parse(raw || '{}'); } catch { return { status: 400 }; } }
  if (!data || typeof data !== 'object' || !TYPES.includes(data.t)) return { status: 400 };
  const hash = visitorHash(env, clean(meta.ip, 80));
  const path = clean(data.path, 1000);
  if (!hash || !path.startsWith('/')) return { status: 204 };
  const consent = data.consent === true;
  const visitorId = clean(data.visitorId, 64), name = clean(data.name, 40);
  const hit = {
    t: data.t, path, referrer: clean(data.referrer, 1000) || undefined, title: clean(data.title, 200) || undefined, language: clean(data.language, 20) || undefined,
    screenWidth: whole(data.screenWidth, 20000), seconds: whole(data.seconds, 86400), scroll: whole(data.scroll, 100),
    name: data.t === 'event' && EVENT_RE.test(name) ? name : undefined,
    consent, visitorId: consent && VISITOR_RE.test(visitorId) ? visitorId : undefined,
    visitorHash: hash, userAgent: clean(meta.userAgent, 400) || undefined, host: clean(meta.host, 200) || undefined,
    country: /^[A-Za-z]{2}$/.test(clean(meta.country, 2)) ? clean(meta.country, 2).toUpperCase() : undefined, region: clean(meta.region, 80) || undefined, city: clean(meta.city, 80) || undefined,
  };
  if (data.t === 'event' && !hit.name) return { status: 400 };
  try {
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${env.SALES_ENQUIRY_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(hit), signal: AbortSignal.timeout(4000) });
    if (!res.ok && res.status !== 429) console.error(`track: sales portal answered ${res.status}`);
  } catch (err) {
    console.error('track: sales portal not reached', err && err.message ? err.message : err);
  }
  return { status: 204 };
}
