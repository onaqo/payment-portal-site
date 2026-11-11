// Shared form handler used by both the Netlify function and the Vercel API route.
// Sends two emails through Resend: a notification to your team and a confirmation to the sender.
//
// Environment variables (set them in the Netlify / Vercel dashboard — never commit them):
//   RESEND_API_KEY   re_...                                   (required)
//   CONTACT_FROM     "AQ Pay <hello@aqpay.services>" (required, must be on a domain verified in Resend)
//   CONTACT_TO       hello@aqpay.services[,another@aqpay.services] (required)
//   CONTACT_AUTOREPLY  "false" to turn off the confirmation email (optional)
//
// Optional: also register each enquiry as a lead in the sales portal ("Website enquiries" in its settings).
//   SALES_ENQUIRY_URL  https://<your sales portal>/api/public/sales/enquiries   (the address shown in the portal)
//   SALES_ENQUIRY_KEY  enq_...                                                  (shown once when the website is added)
// Both must be set for it to run. It never blocks or fails the form: the emails are sent whatever the portal answers.

const FORMS = {
  'homepage-demo': 'Demo request (homepage)',
  'book-a-demo': 'Demo request',
  'contact': 'General enquiry',
};

const LABELS = {
  name: 'Name', email: 'Email', company: 'Company', website: 'Website', role: 'Role', type: 'Business type',
  interest: 'Interested in', volume: 'Monthly volume', markets: 'Primary markets', message: 'Message',
};

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = (v, max) => (typeof v === 'string' ? v : v == null ? '' : String(v)).trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sends the enquiry to the sales portal, where it becomes a lead with the source "Website". Runs on the server, so
 * the key never reaches a visitor's browser. Returns true when the portal accepted it; never throws.
 */
async function sendToSalesPortal(env, form, f, extra) {
  const url = env.SALES_ENQUIRY_URL, key = env.SALES_ENQUIRY_KEY;
  if (!url || !key) return false;
  const fields = {};
  for (const k of ['type', 'interest', 'volume', 'markets']) if (f[k]) fields[LABELS[k]] = f[k];
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, name: f.name, email: f.email, company: f.company, website: f.website || undefined, role: f.role || undefined, message: f.message || undefined, fields, consent: extra.consent, pageUrl: extra.pageUrl || undefined }),
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
 * @param {{ pageUrl?: string }} meta where the form was sent from, when the caller knows
 * @returns {{ status: number, body: object }}
 */
export async function handleContact(raw, env = process.env, meta = {}) {
  let data = raw;
  if (typeof raw === 'string') { try { data = JSON.parse(raw || '{}'); } catch { return { status: 400, body: { error: 'Invalid request.' } }; } }
  if (!data || typeof data !== 'object') return { status: 400, body: { error: 'Invalid request.' } };

  // Honeypot: real visitors never fill this hidden field. Pretend success for bots.
  if (clean(data.hp, 200)) return { status: 200, body: { ok: true } };

  const form = FORMS[data.form] ? data.form : 'contact';
  const f = {};
  for (const k of Object.keys(LABELS)) f[k] = clean(data[k], k === 'message' ? 5000 : 300);

  if (f.name.length < 2) return { status: 422, body: { error: 'Please enter your name.' } };
  if (!EMAIL_RE.test(f.email)) return { status: 422, body: { error: 'Please enter a valid email address.' } };
  if (f.company.length < 2) return { status: 422, body: { error: 'Please enter your company.' } };

  // The sales portal first, so a lead is kept even if the emails below fail. A retry by the visitor is recognised there as the same enquiry.
  await sendToSalesPortal(env, form, f, { consent: data.consent === true || data.consent === 'true' || data.consent === 'on', pageUrl: clean(meta.pageUrl, 500) });

  const { RESEND_API_KEY: key, CONTACT_FROM: from, CONTACT_TO: toRaw } = env;
  if (!key || !from || !toRaw) {
    console.error('contact: missing RESEND_API_KEY, CONTACT_FROM or CONTACT_TO');
    return { status: 500, body: { error: 'The form isn’t configured yet. Please email us directly.' } };
  }
  const to = toRaw.split(',').map(s => s.trim()).filter(Boolean);
  const title = FORMS[form];

  const rows = Object.entries(LABELS).filter(([k]) => f[k]).map(([k, label]) =>
    `<tr><td style="padding:8px 12px 8px 0;color:#5b6b82;font-size:13px;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:8px 0;font-size:14px;white-space:pre-wrap">${esc(f[k])}</td></tr>`).join('');
  const text = Object.entries(LABELS).filter(([k]) => f[k]).map(([k, label]) => `${label}: ${f[k]}`).join('\n');

  try {
    await sendEmail(key, {
      from, to,
      reply_to: f.email,
      subject: `${title}: ${f.name} — ${f.company}`,
      html: shell(`${title} from ${f.name}`, `<table style="border-collapse:collapse;width:100%">${rows}</table><p style="color:#5b6b82;font-size:12px;margin:20px 0 0">Reply to this email to respond to ${esc(f.name)} directly.</p>`),
      text,
    });
  } catch (err) {
    console.error('contact: notification failed', err);
    return { status: 502, body: { error: 'We couldn’t send that just now. Please try again in a moment.' } };
  }

  if (String(env.CONTACT_AUTOREPLY).toLowerCase() !== 'false') {
    try {
      await sendEmail(key, {
        from, to: [f.email],
        reply_to: to[0],
        subject: 'We’ve received your request — AQ Pay',
        html: shell(`Thanks, ${f.name.split(' ')[0]} — we’ve got your request.`,
          `<p style="font-size:14px;line-height:1.6;margin:0 0 16px">Someone from our team will reply within two working days. Here’s a copy of what you sent:</p><table style="border-collapse:collapse;width:100%">${rows}</table>`),
        text: `Thanks — we've received your request and will reply within two working days.\n\n${text}`,
      });
    } catch (err) {
      console.error('contact: auto-reply failed (notification was sent)', err);
    }
  }

  return { status: 200, body: { ok: true } };
}
