import { sendEmail } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { email, subject, text, html } = body;

    if (!email || !subject) {
      return res.status(400).json({ ok: false, message: 'Missing email/subject' });
    }

    const result = await sendEmail({ to: email, subject, text, html });
    return res.json({ ok: true, result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: err.message });
  }
}
