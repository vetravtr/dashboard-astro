import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  try {
    // Dados fixos por enquanto - o lastro é verificado via API da FT Asset Management
    return new Response(JSON.stringify({
      balance: 100000000,
      balanceFormatted: '$100,000,000',
      ratio: 333,
    }));
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
};
