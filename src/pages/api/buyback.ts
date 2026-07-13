import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { walletAddress, amountVtr } = body;

    if (!walletAddress || !amountVtr || amountVtr <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid data' }), { status: 400 });
    }

    // Buscar preço via DexScreener para calcular estimated_value
    let twapPrice = 0.32;
    try {
      const r = await fetch('https://api.dexscreener.com/latest/dex/pairs/polygon/0x5484C717168175cFFDd77678ecAC3A38e76c4e2B');
      const d = await r.json();
      if (d.pair) twapPrice = parseFloat(d.pair.priceUsd) || 0.32;
    } catch (e) {}

    const buybackPrice = twapPrice * 0.97;
    const estimatedValue = amountVtr * buybackPrice;

    const supabaseUrl = 'https://qhgxffazypogelvclyjn.supabase.co';
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;

    const r = await fetch(supabaseUrl + '/rest/v1/buyback_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        wallet_address: walletAddress.toLowerCase(),
        amount_vtr: amountVtr,
        estimated_value_usd: estimatedValue,
        status: 'pending',
      }),
    });

    if (!r.ok) {
      const err = await r.json();
      return new Response(JSON.stringify({ error: err.message || 'DB error' }), { status: 500 });
    }

    const data = await r.json();
    return new Response(JSON.stringify({ success: true, data: data?.[0] }));

  } catch (e) {
    console.error('Buyback POST error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const wallet = url.searchParams.get('wallet');
    const supabaseUrl = 'https://qhgxffazypogelvclyjn.supabase.co';
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;

    let queryUrl = supabaseUrl + '/rest/v1/buyback_intents?select=*&order=created_at.asc';
    if (wallet) {
      queryUrl += `&wallet_address=eq.${wallet.toLowerCase()}`;
    }

    const r = await fetch(queryUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!r.ok) {
      return new Response(JSON.stringify({ error: 'Query error' }), { status: 500 });
    }

    const intents = await r.json();
    const totalVtr = intents.reduce((sum: number, i: any) => sum + parseFloat(i.amount_vtr || 0), 0);
    const pendingCount = intents.filter((i: any) => i.status === 'pending').length;
    const position = wallet ? intents.findIndex((i: any) => i.wallet_address === wallet.toLowerCase()) + 1 : null;

    return new Response(JSON.stringify({ intents, totalVtr, pendingCount, position }));

  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
};
