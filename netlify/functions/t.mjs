// Netlify Function — served at /api/t (visitor analytics, see lib/track.mjs)
import { handleTrack } from '../../lib/track.mjs';

export default async (req, context) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  const h = req.headers;
  const ip = context?.ip ?? h.get('x-nf-client-connection-ip') ?? (h.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const geo = context?.geo ?? {};
  const { status } = await handleTrack(await req.text(), process.env, { ip, userAgent: h.get('user-agent') ?? undefined, origin: h.get('origin') ?? undefined, host: h.get('x-forwarded-host') ?? h.get('host') ?? undefined, country: geo.country?.code, region: geo.subdivision?.name, city: geo.city });
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
};

export const config = { path: '/api/t' };
