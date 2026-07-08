import { useState, useEffect } from 'react';

const PROJECT_ID = 'd4ee97a93dc538bc7c23303cdd30814c';

let sharedProvider = null;
let sharedAccount = null;
let listeners = [];
function notifyAll() {
  listeners.forEach(fn => fn(sharedAccount));
  try { window.dispatchEvent(new CustomEvent('wallet-connected', { detail: sharedAccount })); } catch(e) {}
}

async function getProvider() {
  if (sharedProvider) return sharedProvider;
  const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
  const p = await EthereumProvider.init({
    projectId: PROJECT_ID,
    chains: [137],
    showQrModal: true,
    qrModalOptions: { themeMode: 'dark' },
    metadata: { name: 'VETRA Dashboard', description: 'VETRA Dashboard', url: location.origin, icons: [location.origin + '/favicon.svg'] },
  });
  p.on('disconnect', () => { sharedAccount = null; notifyAll(); try { window.dispatchEvent(new CustomEvent('wallet-disconnect')); } catch(e){} });
  p.on('accountsChanged', (a) => { sharedAccount = a?.[0] || null; notifyAll(); });
  if (p.accounts?.length) sharedAccount = p.accounts[0];
  sharedProvider = p;
  return p;
}

export default function SimpleWalletConnect() {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    listeners.push(setAccount);
    if (sharedAccount) setAccount(sharedAccount);
    return () => { listeners = listeners.filter(fn => fn !== setAccount); };
  }, []);

  const connect = async () => {
    try {
      const p = await getProvider();
      if (sharedAccount) { await p.disconnect(); sharedAccount = null; setAccount(null); notifyAll(); return; }
      await p.connect();
      const addr = p.accounts?.[0];
      if (addr) { sharedAccount = addr; setAccount(addr); notifyAll(); }
    } catch (e) { console.error(e); }
  };

  const short = account ? `${account.slice(0,6)}...${account.slice(-4)}` : 'Connect Wallet';

  return (
    <button onClick={connect}
      style={{height:'36px',padding:'0 12px',borderRadius:'8px',background:'#643390',border:'none',color:'#fff',fontSize:'0.75rem',fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}>
      {account && <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#22c55e',display:'inline-block'}}></span>}
      {short}
    </button>
  );
}
