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
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

    const { data: codes } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('code', code)
      .eq('used', false)
      .limit(1);

    if (!codes || codes.length === 0) return res.status(400).json({ error: 'Invalid code' });
    if (new Date(codes[0].expires_at) < new Date()) return res.status(400).json({ error: 'Code expired' });

    await supabase.from('verification_codes').update({ used: true }).eq('id', codes[0].id);
    await supabase.from('dashboard_users').update({ email_verified: true }).eq('email', email.toLowerCase());

    return res.json({ success: true });
  } catch (e) {
    console.error('Verify error:', e.message);
    return res.status(500).json({ error: 'Error' });
  }
};
