const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!KEY) return res.status(500).json({ error: 'Server config error' });

  const supabase = createClient('https://qhgxffazypogelvclyjn.supabase.co', KEY, {
    auth: { persistSession: false }
  });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase.from('verification_codes').upsert(
      { email: email.toLowerCase(), code, expires_at: expiresAt, used: false },
      { onConflict: 'email' }
    );

    const smtpPass = process.env.SMTP_PASS;
    if (smtpPass) {
      try {
        const nodemailer = require('nodemailer');
        const t = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 587, secure: false, auth: { user: 'vetraquant@gmail.com', pass: smtpPass } });
        await t.sendMail({
          from: '"VETRA Dashboard" <vetraquant@gmail.com>', to: email,
          subject: 'Your VETRA Dashboard verification code',
          text: 'Your code: ' + code,
          html: '<div style="background:#050109;color:#fff;padding:40px;text-align:center"><h2 style="color:#b388ff">VETRA Dashboard</h2><p style="font-size:32px;font-weight:bold;color:#b388ff">' + code + '</p></div>',
        });
      } catch (e) { console.error('Email error:', e.message); }
    }

    return res.json({ success: true });
  } catch (e) {
    console.error('Send code error:', e.message);
    return res.status(500).json({ error: 'Error' });
  }
};
