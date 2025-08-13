import { createConfig, WagmiProvider, http } from 'wagmi';
import { connectorsForWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { coinbaseWallet, injectedWallet, metaMaskWallet, rabbyWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { Chain } from 'viem';

export const coreMainnet: Chain = {
  id: 1116,
  name: 'Core Mainnet',
  nativeCurrency: { name: 'CORE', symbol: 'CORE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.coredao.org'] },
    public: { http: ['https://rpc.coredao.org'] },
  },
  blockExplorers: {
    default: { name: 'CoreScan', url: 'https://scan.coredao.org' },
  },
};

export const coreTestnet2: Chain = {
  id: 1114,
  name: 'Core Testnet2',
  nativeCurrency: { name: 'tCORE', symbol: 'tCORE', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.test2.btcs.network'] },
    public: { http: ['https://rpc.test2.btcs.network'] },
  },
  blockExplorers: {
    default: { name: 'Core Testnet2 Scan', url: 'https://scan.test2.btcs.network' },
  },
  testnet: true,
};

const wcProjectId = import.meta.env.VITE_WC_PROJECT_ID as string | undefined;

const wallets = [
  metaMaskWallet,
  rabbyWallet,
  coinbaseWallet,
  injectedWallet,
  ...(wcProjectId ? [walletConnectWallet] : []),
];

const connectors = wcProjectId
  ? connectorsForWallets([
      { groupName: 'Recomendados', wallets: [...wallets] },
    ], { appName: 'Aethelgard', projectId: wcProjectId })
  : connectorsForWallets([
      { groupName: 'Recomendados', wallets: [metaMaskWallet, rabbyWallet, coinbaseWallet, injectedWallet] },
    ], { appName: 'Aethelgard', projectId: 'DISABLED' as unknown as string });

export const config = createConfig({
  chains: [coreTestnet2, coreMainnet],
  connectors,
  transports: {
    [coreMainnet.id]: http(coreMainnet.rpcUrls.default.http[0]),
    [coreTestnet2.id]: http(coreTestnet2.rpcUrls.default.http[0]),
  },
  ssr: false,
  multiInjectedProviderDiscovery: true,
});

export { WagmiProvider, RainbowKitProvider };



