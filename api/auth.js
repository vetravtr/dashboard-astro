const { createClient } = require('@supabase/supabase-js');

const SB_URL = 'https://qhgxffazypogelvclyjn.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SB_KEY) {
  module.exports = (req, res) => res.status(500).json({ error: 'Server config error' });
} else {
  const supabase = createClient(SB_URL, SB_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
      const { action, email, password, name } = req.body || {};

      if (action === 'register') {
        if (!email || !password || !name) return res.status(400).json({ error: 'Name, email and password required' });

        const { data: existing } = await supabase.from('dashboard_users').select('id').eq('email', email.toLowerCase()).limit(1);
        if (existing && existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

        const { createHash, randomBytes } = require('crypto');
        const salt = randomBytes(16).toString('base64');
        const hash = createHash('sha256').update(password + salt).digest('hex');
        const fakeHash = '$2b$10$' + salt + hash.slice(0, 31);

        const { data, error } = await supabase.from('dashboard_users').insert({
          email: email.toLowerCase(), name, password_hash: fakeHash, email_verified: false
        }).select();

        if (error) return res.status(500).json({ error: 'Registration failed: ' + error.message });

        const user = data[0];
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

        return res.json({ success: true, userId: user.id, email: user.email, name: user.name });
      }

      if (action === 'login') {
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const { data: users } = await supabase.from('dashboard_users').select('*').eq('email', email.toLowerCase()).limit(1);
        if (!users || users.length === 0) return res.status(401).json({ error: 'User not found' });

        const user = users[0];
        return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (e) {
      console.error('Auth error:', e.message || e);
      return res.status(500).json({ error: 'Internal error' });
    }
  };
}
