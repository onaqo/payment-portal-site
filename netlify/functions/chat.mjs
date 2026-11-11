// Netlify Function — served at /api/chat
import { handleChat } from '../../lib/chat.mjs';

export default async (req, context) => {
  const h = req.headers;
  const ip = context?.ip ?? h.get('x-nf-client-connection-ip') ?? (h.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const { status, body } = await handleChat(req.method, req.method === 'POST' ? await req.text() : {}, process.env, { pageUrl: h.get('referer') ?? undefined, ip, origin: h.get('origin') ?? undefined, host: h.get('x-forwarded-host') ?? h.get('host') ?? undefined });
  return Response.json(body, { status, headers: { 'Cache-Control': req.method === 'GET' ? 'public, max-age=60' : 'no-store' } });
};

export const config = { path: '/api/chat' };
