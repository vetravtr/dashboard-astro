import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const config = getDefaultConfig({
  appName: 'VETRA',
  projectId: 'd4ee97a93dc538bc7c23303cdd30814c',
  chains: [polygon],
  ssr: true,
});

const queryClient = new QueryClient();

export default function WalletPage() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0612', color: 'white', fontFamily: 'sans-serif' }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Buy VTR Pioneer NFT</h1>
              <p style={{ color: '#9B9B9B', marginBottom: '2rem' }}>Connect your wallet to purchase</p>
              <ConnectButton />
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
