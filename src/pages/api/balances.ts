import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { address } = body;

    if (!address) {
      return new Response(JSON.stringify({ vtr: 0, usdc: 0 }), { status: 200 });
    }

    const VTR_ADDRESS = '0xAA27bd271B01dd20CcFA079800616335416c95Fd';
    const USDC_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    const ABI_BALANCE = [{ constant: true, inputs: [{ name: '_owner', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], type: 'function' }];

    const RPCS = [
      'https://polygon-bor.publicnode.com',
      'https://polygon-mainnet.g.alchemy.com/v2/16sJw5JgOrfP0sQXZ1tlb',
      'https://polygon-rpc.com',
    ];

    let vtr = 0, usdc = 0;
    let rpcUrl = RPCS[0];

    for (const url of RPCS) {
      try {
        const test = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
        });
        if (test.ok) { rpcUrl = url; break; }
      } catch (e) { continue; }
    }

    // Balance VTR
    try {
      const payload = {
        jsonrpc: '2.0', id: 1, method: 'eth_call',
        params: [{ to: VTR_ADDRESS, data: '0x70a08231' + address.slice(2).padStart(64, '0') }, 'latest'],
      };
      const r = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (d.result) vtr = parseInt(d.result, 16) / 1e18;
    } catch (e) {}

    // Balance USDC
    try {
      const payload = {
        jsonrpc: '2.0', id: 2, method: 'eth_call',
        params: [{ to: USDC_ADDRESS, data: '0x70a08231' + address.slice(2).padStart(64, '0') }, 'latest'],
      };
      const r = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (d.result) usdc = parseInt(d.result, 16) / 1e6;
    } catch (e) {}

    return new Response(JSON.stringify({ vtr, usdc }));

  } catch (e) {
    return new Response(JSON.stringify({ vtr: 0, usdc: 0 }));
  }
};
