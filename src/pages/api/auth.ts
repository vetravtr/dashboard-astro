import type { APIRoute } from 'astro';

const SUPABASE_URL = 'https://qhgxffazypogelvclyjn.supabase.co';
const SUPABASE_KEY = 'QfvT+dDMQqloq4ztvVIfhobF8rYWbmE4O/uA3AMAKUBRkBtAYgSQChOdxj+StEyAnkxwZvGG5F57v+wZ0qHQ1A==';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, email, password, name, country, code } = body;

    if (!email) {
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), { status: 400 });
    }

    const HEADERS = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    };

    // Cadastro
    if (action === 'register') {
      const r = await fetch(SUPABASE_URL + '/auth/v1/admin/users', {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({ email, password, email_confirm: false, user_metadata: { name, country } }),
      });
      const d = await r.json();
      if (!r.ok) {
        return new Response(JSON.stringify({ success: false, error: d.msg || 'Registration failed' }), { status: 400 });
      }
      await fetch(SUPABASE_URL + '/rest/v1/dashboard_users', {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({ id: d.id, email, name, country, email_verified: false }),
      });
      return new Response(JSON.stringify({ success: true, user: d }));
    }

    // Login
    if (action === 'login') {
      const r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        return new Response(JSON.stringify({ success: false, error: d.error_description || 'Login failed' }), { status: 401 });
      }
      return new Response(JSON.stringify({
        success: true,
        token: d.access_token,
        user: { id: d.user.id, email: d.user.email, name: d.user.user_metadata?.name || '' },
      }));
    }

    // Forgot
    if (action === 'forgot') {
      await fetch(SUPABASE_URL + '/auth/v1/recover', {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({ email }),
      });
      // Gerar codigo manual e enviar email
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await fetch(SUPABASE_URL + '/rest/v1/verification_codes', {
        method: 'POST', headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ email, code, expires_at: expiresAt, used: false }),
      });
      // Enviar email
      try {
        const nodemailer = (await import('nodemailer')).default;
        const t = nodemailer.createTransport({
          host: 'smtp.gmail.com', port: 587, secure: false,
          auth: { user: 'vetraquant@gmail.com', pass: process.env.SMTP_PASS || 'uups wijr tdyy tgij' },
        });
        await t.sendMail({
          from: '"VETRA Dashboard" <vetraquant@gmail.com>',
          to: email,
          subject: 'Password Reset Code',
          text: `Your password reset code is: ${code}\n\nExpires in 15 minutes.`,
        });
      } catch (e) { console.error('Email error:', e); }
      return new Response(JSON.stringify({ success: true }));
    }

    // Reset
    if (action === 'reset') {
      if (!code || !password) {
        return new Response(JSON.stringify({ success: false, error: 'Missing code or password' }), { status: 400 });
      }
      const r = await fetch(
        SUPABASE_URL + '/rest/v1/verification_codes?email=eq.' + encodeURIComponent(email) + '&code=eq.' + code + '&used=eq.false&order=created_at.desc&limit=1',
        { headers: HEADERS }
      );
      const codes = await r.json();
      if (!codes || codes.length === 0) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid code' }), { status: 400 });
      }
      const record = codes[0];
      if (Date.now() > new Date(record.expires_at).getTime()) {
        return new Response(JSON.stringify({ success: false, error: 'Code expired' }), { status: 400 });
      }
      await fetch(SUPABASE_URL + '/rest/v1/verification_codes?email=eq.' + encodeURIComponent(email) + '&code=eq.' + code, {
        method: 'PATCH', headers: HEADERS, body: JSON.stringify({ used: true }),
      });
      const usersR = await fetch(SUPABASE_URL + '/auth/v1/admin/users?email=eq.' + encodeURIComponent(email), { headers: HEADERS });
      const usersData = await usersR.json();
      if (usersData?.users?.[0]) {
        await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + usersData.users[0].id + '/password', {
          method: 'PUT', headers: HEADERS,
          body: JSON.stringify({ password }),
        });
      }
      return new Response(JSON.stringify({ success: true }));
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), { status: 400 });
  } catch (e) {
    console.error('Auth error:', e);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), { status: 500 });
  }
};
