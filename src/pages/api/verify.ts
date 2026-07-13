import type { APIRoute } from 'astro';

const SUPABASE_URL = 'https://qhgxffazypogelvclyjn.supabase.co';
const SUPABASE_KEY = 'QfvT+dDMQqloq4ztvVIfhobF8rYWbmE4O/uA3AMAKUBRkBtAYgSQChOdxj+StEyAnkxwZvGG5F57v+wZ0qHQ1A==';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ success: false, error: 'Missing fields' }), { status: 400 });
    }

    const HEADERS = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    };

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

    await fetch(SUPABASE_URL + '/rest/v1/dashboard_users?email=eq.' + encodeURIComponent(email), {
      method: 'PATCH', headers: HEADERS, body: JSON.stringify({ email_verified: true }),
    });

    const usersR = await fetch(SUPABASE_URL + '/auth/v1/admin/users?email=eq.' + encodeURIComponent(email), { headers: HEADERS });
    const usersData = await usersR.json();
    if (usersData?.users?.[0]) {
      await fetch(SUPABASE_URL + '/auth/v1/admin/users/' + usersData.users[0].id, {
        method: 'PUT', headers: HEADERS, body: JSON.stringify({ email_confirm: true }),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user: { email, email_verified: true },
    }));
  } catch (e) {
    console.error('Verify error:', e);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), { status: 500 });
  }
};
