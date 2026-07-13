import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { walletAddress, asset, amountUsd, vtrAmount, userName, userEmail } = body;

    if (!amountUsd || !asset) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const supabaseUrl = 'https://qhgxffazypogelvclyjn.supabase.co';
    const supabaseKey = import.meta.env.SUPABASE_SERVICE_KEY;

    // Salvar intenção OTC
    const r = await fetch(supabaseUrl + '/rest/v1/otc_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        wallet_address: walletAddress || null,
        asset,
        amount_usd: amountUsd,
        vtr_amount: vtrAmount,
        status: 'pending',
      }),
    });

    if (!r.ok) {
      const err = await r.json();
      return new Response(JSON.stringify({ error: err.message || 'DB error' }), { status: 500 });
    }

    // Enviar email via SMTP (nodemailer)
    try {
      const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.SENDGRID_KEY || ''}`,
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: 'vetraquant@gmail.com' }] }],
          from: { email: 'vetraquant@gmail.com', name: 'VETRA OTC' },
          subject: `OTC Request: ${userName || 'Unknown'} - $${amountUsd} ${asset}`,
          content: [{
            type: 'text/plain',
            value: `NEW OTC REQUEST\n\nName: ${userName || 'N/A'}\nEmail: ${userEmail || 'N/A'}\nWallet: ${walletAddress || 'N/A'}\n\nAsset: ${asset}\nAmount: $${amountUsd}\nVTR to receive: ${vtrAmount}\n\nSend to: 0x29F1bE1E72c031539bc22437aFde22fF765EE00e`,
          }],
        }),
      });
    } catch (emailErr) {
      console.error('Email send failed (non-fatal):', emailErr);
    }

    const data = await r.json();
    return new Response(JSON.stringify({ success: true, intent: data?.[0] }));

  } catch (e) {
    console.error('OTC error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
};
