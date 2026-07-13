import { useState, useRef, useCallback, useEffect } from 'react';

const PROJECT_ID = 'd4ee97a93dc538bc7c23303cdd30814c';

export default function WalletConnectDash() {
  const providerRef = useRef(null);
  const [account, setAccount] = useState(null);

  const ensureProvider = useCallback(async () => {
    if (providerRef.current) return providerRef.current;
    const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
    const p = await EthereumProvider.init({
      projectId: PROJECT_ID,
      chains: [137],
      showQrModal: true,
      qrModalOptions: { themeMode: 'dark' },
      metadata: {
        name: 'VETRA Dashboard',
        description: 'VETRA',
        url: location.origin,
        icons: [location.origin + '/favicon.svg'],
      },
    });
    p.on('disconnect', () => { setAccount(null); try { window.dispatchEvent(new CustomEvent('wallet-disconnect')); } catch(e){} });
    p.on('accountsChanged', (a) => { const addr = a?.[0] || null; setAccount(addr); if (addr) { try { window.dispatchEvent(new CustomEvent('wallet-connected', { detail: addr })); } catch(e){} } });
    providerRef.current = p;
    return p;
  }, []);

  useEffect(() => {
    if (providerRef.current && account) {
      try { window.dispatchEvent(new CustomEvent('wallet-connected', { detail: account })); } catch(e) {}
    }
  }, [account]);

  const connect = async () => {
    try {
      const p = await ensureProvider();
      if (account) { await p.disconnect(); setAccount(null); try { window.dispatchEvent(new CustomEvent('wallet-disconnect')); } catch(e){} return; }
      await p.connect();
      const addr = p.accounts?.[0];
      if (addr) { setAccount(addr); try { window.dispatchEvent(new CustomEvent('wallet-connected', { detail: addr })); } catch(e){} }
    } catch (e) { console.error('connect error:', e); }
  };

  const short = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet';

  return (
    <button
      onClick={connect}
      onMouseEnter={(e) => { if (!account) e.target.style.background = '#7B3FBF'; }}
      onMouseLeave={(e) => { if (!account) e.target.style.background = '#643390'; }}
      style={{
        height: '36px', padding: '0 14px', borderRadius: '8px',
        background: account ? '#643390' : '#643390',
        border: 'none',
        color: '#fff', fontSize: '0.8rem', fontWeight: 500,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s',
      }}>
      {account && <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>}
      {short}
    </button>
  );
}
