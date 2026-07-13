import type { APIRoute } from 'astro';

// SO ENVIA EMAIL - o codigo é gerado e salvo pelo frontend via REST
export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ success: false, error: 'Email and code required' }), { status: 400 });
    }

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
