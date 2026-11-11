// Vercel Function — served at /api/t (visitor analytics, see lib/track.mjs)
import { handleTrack } from '../lib/track.mjs';

const place = v => { try { return v ? decodeURIComponent(String(v)) : undefined; } catch { return undefined; } };

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  const h = req.headers ?? {};
  const ip = String(h['x-real-ip'] ?? h['x-forwarded-for'] ?? '').split(',')[0].trim();
  // Vercel says roughly where the request came from; the visitor's address itself is not passed on.
  const { status } = await handleTrack(req.body ?? {}, process.env, { ip, userAgent: h['user-agent'], origin: h.origin, host: h['x-forwarded-host'] ?? h.host, country: h['x-vercel-ip-country'], region: place(h['x-vercel-ip-country-region']), city: place(h['x-vercel-ip-city']) });
  return res.status(status).end();
}
