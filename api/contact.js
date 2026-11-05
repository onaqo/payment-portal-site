// Vercel Function — served at /api/contact
import { handleContact } from '../lib/contact.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { status, body } = await handleContact(req.body ?? {}, process.env);
  return res.status(status).json(body);
}
