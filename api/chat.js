// Vercel Function — served at /api/chat
import { handleChat } from '../lib/chat.mjs';

// The assistant can take a while on a long question.
export const config = { maxDuration: 60 };

// Vercel's way to keep a function running for work done after the answer (what @vercel/functions' waitUntil uses),
// so a probe passed on to the portal is not cut off. Without it the message is still sent; it may just not finish.
function waitUntil() {
  try { const ctx = globalThis[Symbol.for('@vercel/request-context')]?.get?.(); return typeof ctx?.waitUntil === 'function' ? p => ctx.waitUntil(p) : undefined; } catch { return undefined; }
}

export default async function handler(req, res) {
  const h = req.headers ?? {};
  const ip = String(h['x-real-ip'] ?? h['x-forwarded-for'] ?? '').split(',')[0].trim();
  const { status, body } = await handleChat(req.method, req.body ?? {}, process.env, { pageUrl: h.referer, ip, userAgent: h['user-agent'], origin: h.origin, host: h['x-forwarded-host'] ?? h.host, query: req.query ?? {}, waitUntil: waitUntil(), formToken: h['x-aq-form'] });
  res.setHeader('Cache-Control', req.method === 'GET' && !(req.query && req.query.sessionId) ? 'public, max-age=20' : 'no-store');
  return res.status(status).json(body);
}
