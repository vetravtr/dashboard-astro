import type { APIRoute } from 'astro';

const SUPABASE_URL = 'https://qhgxffazypogelvclyjn.supabase.co';
const SUPABASE_KEY = 'QfvT+dDMQqloq4ztvVIfhobF8rYWbmE4O/uA3AMAKUBRkBtAYgSQChOdxj+StEyAnkxwZvGG5F57v+wZ0qHQ1A==';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();
    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'Email required' }), { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const HEADERS = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    };

    await fetch(SUPABASE_URL + '/rest/v1/verification_codes', {
      method: 'POST', headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({ email, code, expires_at: expiresAt, used: false }),
    });

    try {
      const nodemailer = (await import('nodemailer')).default;
      const t = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user: 'vetraquant@gmail.com', pass: process.env.SMTP_PASS || 'uups wijr tdyy tgij' },
      });
      await t.sendMail({
        from: '"VETRA Dashboard" <vetraquant@gmail.com>',
        to: email,
        subject: 'Your VETRA Dashboard verification code',
        text: `Your verification code is: ${code}\n\nEnter this code on the VETRA Dashboard.\n\nExpires in 15 minutes.\n\nVETRA Dashboard\nhttps://dashboard.vetravtr.com`,
      });
    } catch (e) { console.error('Email error:', e); }

    return new Response(JSON.stringify({ success: true }));
  } catch (e) {
    console.error('Send code error:', e);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), { status: 500 });
  }
};
