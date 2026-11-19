// Vercel Function — served at /api/contact
import { handleContact, issueFormToken } from '../lib/contact.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // GET hands the page a short-lived form token (spam protection; see lib/contact.mjs).
  if (req.method === 'GET') return res.status(200).json({ t: issueFormToken(process.env) });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { status, body } = await handleContact(req.body ?? {}, process.env, { pageUrl: req.headers?.referer, ip: String(req.headers?.['x-real-ip'] ?? req.headers?.['x-forwarded-for'] ?? '').split(',')[0].trim(), userAgent: req.headers?.['user-agent'], formToken: req.headers?.['x-aq-form'] });
  return res.status(status).json(body);
}
