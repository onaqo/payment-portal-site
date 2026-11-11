// Vercel Function — served at /api/chat
import { handleChat } from '../lib/chat.mjs';

// The assistant can take a while on a long question.
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const h = req.headers ?? {};
  const ip = String(h['x-real-ip'] ?? h['x-forwarded-for'] ?? '').split(',')[0].trim();
  const { status, body } = await handleChat(req.method, req.body ?? {}, process.env, { pageUrl: h.referer, ip, origin: h.origin, host: h['x-forwarded-host'] ?? h.host, query: req.query ?? {} });
  res.setHeader('Cache-Control', req.method === 'GET' && !(req.query && req.query.sessionId) ? 'public, max-age=60' : 'no-store');
  return res.status(status).json(body);
}
