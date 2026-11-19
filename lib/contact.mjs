// Shared form handler used by both the Netlify function and the Vercel API route.
// Sends two emails through Resend: a notification to your team and a confirmation to the sender.
//
// Environment variables (set them in the Netlify / Vercel dashboard — never commit them):
//   RESEND_API_KEY   re_...                                   (required)
//   CONTACT_FROM     "AQ Pay <hello@aqpay.services>" (required, must be on a domain verified in Resend)
//   CONTACT_TO       hello@aqpay.services[,another@aqpay.services] (required)
//   CONTACT_AUTOREPLY  "false" to turn off the confirmation email (optional)
//   APPLICATION_TO   where applications from /apply and /apply-white-label go (optional; admin@aqpay.services if unset)
//
// Optional: also register each enquiry as a lead in the sales portal ("Website enquiries" in its settings).
//   SALES_ENQUIRY_URL  https://<your sales portal>/api/public/sales/enquiries   (the address shown in the portal)
//   SALES_ENQUIRY_KEY  enq_...                                                  (shown once when the website is added)
// Both must be set for it to run. It never blocks or fails the form: the emails are sent whatever the portal answers.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { visitorRef } from './track.mjs';

const FORMS = {
  'homepage-demo': 'Demo request (homepage)',
  'book-a-demo': 'Demo request',
  'contact': 'General enquiry',
  'merchant-application': 'Merchant account application',
  'white-label-application': 'White-label application',
};

const LABELS = {
  name: 'Name', email: 'Email', company: 'Company', website: 'Website', role: 'Role', type: 'Business type',
  interest: 'Interested in', volume: 'Monthly volume', markets: 'Primary markets', message: 'Message',
};

// The merchant account application form (/apply). Sent to APPLICATION_TO, admin@aqpay.services unless set otherwise.
const APP_LABELS = {
  company: 'Legal business name', tradingName: 'Trading name', website: 'Website', country: 'Country of incorporation',
  regNumber: 'Company registration number', yearsTrading: 'Years trading', accountType: 'Merchant account type',
  sells: 'Products or services', licence: 'Licence', licenceDetails: 'Licence details', markets: 'Countries sold to',
  processing: 'Processing now', processor: 'Current or previous processor', volume: 'Monthly processing volume',
  chargeback: 'Chargeback rate', avgTicket: 'Average transaction', maxTicket: 'Largest transaction', currencies: 'Currencies',
  methods: 'Payment methods wanted', statements: 'Processing statements available', terminated: 'Account terminated before',
  name: 'Contact name', role: 'Role', email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp', telegram: 'Telegram',
  otherVia: 'Other contact app', otherHandle: 'Contact detail on that app',
  contactVia: 'Preferred contact', message: 'Notes',
};
// The white-label application form (/apply-white-label). Sent to the same address.
const WL_LABELS = {
  company: 'Legal company name', companyType: 'Company type', website: 'Website', country: 'Country of incorporation',
  regNumber: 'Company registration number', yearsTrading: 'Years in business', solution: 'Wants to launch',
  brandName: 'Brand name for the gateway', domain: 'Portal domain', markets: 'Countries to serve', verticals: 'Merchant types',
  highRisk: 'High-risk merchants', timeline: 'Launch timeline', methods: 'Payment methods needed', merchants: 'Merchants at launch',
  volume: 'Expected monthly volume', processors: 'Processor relationships', processorNames: 'Processors or acquirers',
  licence: 'Licence or registration', team: 'Technical team', currentPlatform: 'Current gateway or platform',
  name: 'Contact name', role: 'Role', email: 'Email', phone: 'Phone', whatsapp: 'WhatsApp', telegram: 'Telegram',
  otherVia: 'Other contact app', otherHandle: 'Contact detail on that app',
  contactVia: 'Preferred contact', message: 'Notes',
};
const APPLICATIONS = { 'merchant-application': APP_LABELS, 'white-label-application': WL_LABELS };
const APPLICATION_TO = 'admin@aqpay.services';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- Spam protection ----------
 * 1. Form token: the page asks GET /api/contact for a short-lived signed token (fx.js does this) and sends it back in the
 *    X-AQ-Form header. Bots that post straight to the API have no token; a token used within 2.5 s of being issued is a bot.
 *    The signing key comes from FORM_SECRET, or else is derived from RESEND_API_KEY, so nothing new has to be set up.
 * 2. Honeypot field (hp), a per-address limit, and link checks: these submissions are dropped quietly (the bot sees success).
 * 3. Typical marketing spam (SEO, backlinks and the like) is still emailed, but marked "[Likely spam]", with no
 *    confirmation email, so a real enquiry is never lost. It is passed to the sales portal with `spamReason` (the short
 *    reason below, never the visitor's words), where it is kept as spam without becoming a lead and can still be made one.
 * Dropped submissions are logged as "contact: dropped (reason)" in the hosting logs. */
const TOKEN_MIN_MS = 2500, TOKEN_MAX_MS = 6 * 3600e3;
function formKey(env) {
  const s = env.FORM_SECRET || env.RESEND_API_KEY || env.SALES_ENQUIRY_KEY;
  return s ? createHash('sha256').update('aq-form:' + s).digest() : null;
}
const sign = (key, t) => createHmac('sha256', key).update(t).digest('base64url').slice(0, 32);
/** A signed token for GET /api/contact. Empty when no key is configured (the check is then skipped). */
export function issueFormToken(env = process.env, now = Date.now()) {
  const key = formKey(env); if (!key) return '';
  const t = String(now); return `${t}.${sign(key, t)}`;
}
function tokenProblem(env, token, now) {
  const key = formKey(env); if (!key) return null;
  const m = /^(\d{10,16})\.([A-Za-z0-9_-]{32})$/.exec(String(token || '').trim());
  if (!m) return 'no token';
  const a = Buffer.from(sign(key, m[1])), b = Buffer.from(m[2]);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return 'bad token';
  const age = now - Number(m[1]);
  if (age < TOKEN_MIN_MS) return 'too fast';
  if (age > TOKEN_MAX_MS) return 'expired';
  return null;
}
// At most 5 submissions per address in 10 minutes (per server instance).
const hits = new Map();
function rateLimited(ip, now) {
  if (!ip) return false;
  const list = (hits.get(ip) || []).filter(t => now - t < 600e3); list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 5;
}
const URL_ONE = /\bhttps?:\/\/|\bwww\.[a-z0-9-]+\./i, URL_ALL = new RegExp(URL_ONE.source, 'gi');
function hardSpam(f) {
  const all = Object.values(f).join('\n');
  if (/\[url[=\]]|<a\s+href|\[link=/i.test(all)) return 'markup links';
  if (URL_ONE.test(f.name) || URL_ONE.test(f.role || '')) return 'link in name';
  if (((f.message || '').match(URL_ALL) || []).length > 3) return 'many links';
  if (f.name && f.name === f.company && /^[A-Za-z]{12,}$/.test(f.name)) return 'random name';
  return null;
}
const SPAM_WORDS = /\b(seo (services?|agency|expert|package)|backlinks?|link building|guest posts?|rank(ing)? (your|on) (website|google)|first page of google|increase (your )?(website )?traffic|web(site)? (design|development) services?|explainer videos?|lead generation services?|digital marketing (services?|agency)|crypto investment|bitcoin investment|forex signals|loan offer|viagra|cialis|escort|adult dating|unsubscribe|this is not spam|we noticed your website|your website (is|has) (not|errors))\b/i;
function softSpam(f) {
  const text = [f.message, f.company, f.name].join(' ');
  if (SPAM_WORDS.test(text)) return 'marketing phrases';
  if (/[Ѐ-ӿ]{6,}/.test(text) && !/[Ѐ-ӿ]/.test(f.name)) return 'unexpected script';
  return null;
}
const QUIET_OK = { status: 200, body: { ok: true } };

/**
 * Sends the enquiry to the sales portal, where it becomes a lead with the source "Website". Runs on the server, so
 * the key never reaches a visitor's browser. Returns true when the portal accepted it; never throws.
 * With `spamReason` (why this site judged it likely spam, at most 200 characters) the portal keeps it as spam, not a lead.
 */
async function sendToSalesPortal(env, form, f, extra, labels = LABELS, spamReason = null) {
  const url = env.SALES_ENQUIRY_URL, key = env.SALES_ENQUIRY_KEY;
  if (!url || !key) return false;
  const fields = {};
  const core = ['name', 'email', 'company', 'website', 'role', 'message'];
  for (const k of Object.keys(labels)) if (!core.includes(k) && f[k]) fields[labels[k]] = f[k];
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, name: f.name, email: f.email, company: f.company, website: f.website || undefined, role: f.role || undefined, message: f.message || undefined, fields, consent: extra.consent, pageUrl: extra.pageUrl || undefined, visitor: extra.visitor, spamReason: clean(spamReason, 200) || undefined }),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) { console.error(`contact: sales portal answered ${res.status}`); return false; }
    return true;
  } catch (err) {
    console.error('contact: sales portal not reached', err && err.message ? err.message : err);
    return false;
  }
}

async function sendEmail(apiKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

function shell(title, inner) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6fa;font-family:Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#0b1324">
<div style="max-width:560px;margin:0 auto;padding:32px 20px">
<div style="background:#060A14;color:#F4F7FC;border-radius:14px 14px 0 0;padding:20px 24px;font-weight:600;font-size:17px;letter-spacing:-.01em">AQ <span style="color:#6E9BFF">Pay</span></div>
<div style="background:#ffffff;border-radius:0 0 14px 14px;padding:24px;border:1px solid #e3e8ef;border-top:0">
<h1 style="font-size:18px;margin:0 0 16px">${esc(title)}</h1>${inner}</div></div></body></html>`;
}

/**
 * @param {object|string} raw the submitted form
 * @param {object} env environment variables
 * @param {{ pageUrl?: string, ip?: string, userAgent?: string }} meta where the form was sent from and by which visitor, when the caller knows
 * @returns {{ status: number, body: object }}
 */
export async function handleContact(raw, env = process.env, meta = {}) {
  let data = raw;
  if (typeof raw === 'string') { try { data = JSON.parse(raw || '{}'); } catch { return { status: 400, body: { error: 'Invalid request.' } }; } }
  if (!data || typeof data !== 'object') return { status: 400, body: { error: 'Invalid request.' } };

  // Honeypot: real visitors never fill this hidden field. Pretend success for bots.
  if (clean(data.hp, 200)) { console.warn('contact: dropped (honeypot)'); return QUIET_OK; }
  const now = Date.now();
  const tp = tokenProblem(env, meta.formToken, now);
  if (tp === 'no token' || tp === 'expired') return { status: 422, body: { error: 'Please reload the page and send the form again.' } };
  if (tp) { console.warn(`contact: dropped (${tp})`); return QUIET_OK; }
  if (rateLimited(meta.ip, now)) { console.warn('contact: dropped (too many from one address)'); return QUIET_OK; }

  const form = FORMS[data.form] ? data.form : 'contact';
  const isApp = !!APPLICATIONS[form], labels = APPLICATIONS[form] || LABELS;
  const f = {};
  for (const k of Object.keys(labels)) f[k] = clean(data[k], k === 'message' ? 5000 : 300);

  if (isApp) {
    if (f.name.length < 2) return { status: 422, body: { error: 'Please enter your name.' } };
    if (!EMAIL_RE.test(f.email)) return { status: 422, body: { error: 'Please enter a valid email address.' } };
    if (f.phone.replace(/\D/g, '').length < 6) return { status: 422, body: { error: 'Please enter a phone number.' } };
    if (f.company.length < 2) return { status: 422, body: { error: 'Please enter your business name.' } };
    if (!f.country) return { status: 422, body: { error: 'Please choose a country.' } };
  } else {
    if (f.name.length < 2) return { status: 422, body: { error: 'Please enter your name.' } };
    if (!EMAIL_RE.test(f.email)) return { status: 422, body: { error: 'Please enter a valid email address.' } };
    if (f.company.length < 2) return { status: 422, body: { error: 'Please enter your company.' } };
  }
  const who = f.name || f.company || f.email || f.phone || f.whatsapp || f.telegram || 'someone';
  const hard = hardSpam(f);
  if (hard) { console.warn(`contact: dropped (${hard})`); return QUIET_OK; }
  const likelySpam = softSpam(f);
  if (likelySpam) console.warn(`contact: marked as likely spam (${likelySpam})`);

  // The sales portal first, so a lead is kept even if the emails below fail. A retry by the visitor is recognised there as the same enquiry.
  // Likely spam goes there too, with the reason, and is kept as spam rather than made a lead.
  const extra = { consent: data.consent === true || data.consent === 'true' || data.consent === 'on', pageUrl: clean(meta.pageUrl, 500), visitor: visitorRef(env, meta, data.visitorId) };
  const lead = await sendToSalesPortal(env, form, f, extra, labels, likelySpam);
  // If the portal does not know the application form yet, keep the lead anyway as a general enquiry with every answer in the message.
  if (isApp && !lead) await sendToSalesPortal(env, 'contact', { ...f, message: Object.keys(labels).filter(k => f[k]).map(k => `${labels[k]}: ${f[k]}`).join('\n') }, extra, { name: 'Name' }, likelySpam);

  const { RESEND_API_KEY: key, CONTACT_FROM: from } = env;
  const toRaw = isApp ? (env.APPLICATION_TO || APPLICATION_TO) : env.CONTACT_TO;
  if (!key || !from || !toRaw) {
    console.error('contact: missing RESEND_API_KEY, CONTACT_FROM or CONTACT_TO');
    return { status: 500, body: { error: 'The form isn’t configured yet. Please email us directly.' } };
  }
  const to = toRaw.split(',').map(s => s.trim()).filter(Boolean);
  const title = FORMS[form];

  const rows = Object.entries(labels).filter(([k]) => f[k]).map(([k, label]) =>
    `<tr><td style="padding:8px 12px 8px 0;color:#5b6b82;font-size:13px;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:8px 0;font-size:14px;white-space:pre-wrap">${esc(f[k])}</td></tr>`).join('');
  const text = Object.entries(labels).filter(([k]) => f[k]).map(([k, label]) => `${label}: ${f[k]}`).join('\n');

  try {
    await sendEmail(key, {
      from, to,
      ...(f.email ? { reply_to: f.email } : {}),
      subject: `${likelySpam ? '[Likely spam] ' : ''}${title}: ${[f.name, f.company].filter(Boolean).join(' — ') || who}`,
      html: shell(`${title} from ${who}`, `<table style="border-collapse:collapse;width:100%">${rows}</table>${f.email ? `<p style="color:#5b6b82;font-size:12px;margin:20px 0 0">Reply to this email to respond to ${esc(who)} directly.</p>` : ''}`),
      text,
    });
  } catch (err) {
    console.error('contact: notification failed', err);
    return { status: 502, body: { error: 'We couldn’t send that just now. Please try again in a moment.' } };
  }

  if (f.email && !likelySpam && String(env.CONTACT_AUTOREPLY).toLowerCase() !== 'false') {
    try {
      await sendEmail(key, {
        from, to: [f.email],
        reply_to: to[0],
        subject: isApp ? 'We’ve received your application — AQ Pay' : 'We’ve received your request — AQ Pay',
        html: shell(isApp ? `Thanks${f.name ? ', ' + f.name.split(' ')[0] : ''} — we’ve got your application.` : `Thanks, ${f.name.split(' ')[0]} — we’ve got your request.`,
          `<p style="font-size:14px;line-height:1.6;margin:0 0 16px">${isApp ? 'Our team will contact you using the details you gave.' : 'Someone from our team will reply within two working days.'} Here’s a copy of what you sent:</p><table style="border-collapse:collapse;width:100%">${rows}</table>`),
        text: `${isApp ? "Thanks — we've received your application and our team will contact you." : "Thanks — we've received your request and will reply within two working days."}\n\n${text}`,
      });
    } catch (err) {
      console.error('contact: auto-reply failed (notification was sent)', err);
    }
  }

  return { status: 200, body: { ok: true } };
}
