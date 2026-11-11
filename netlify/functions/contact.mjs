// Netlify Function — served at /api/contact (see netlify.toml)
import { handleContact } from '../../lib/contact.mjs';

export default async (req, context) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });
  const { status, body } = await handleContact(await req.text(), process.env, { pageUrl: req.headers.get('referer') ?? undefined, ip: context?.ip ?? req.headers.get('x-nf-client-connection-ip') ?? (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim(), userAgent: req.headers.get('user-agent') ?? undefined });
  return Response.json(body, { status });
};

export const config = { path: '/api/contact' };
