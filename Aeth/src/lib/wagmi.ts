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

// RainbowKit requiere projectId real para WalletConnect. Si no hay, no lo incluimos.
const wcProjectId = import.meta.env.VITE_WC_PROJECT_ID as string | undefined;

const wallets = [
  metaMaskWallet,
  rabbyWallet,
  coinbaseWallet,
  injectedWallet,
  // Agrega WalletConnect solo si hay projectId real configurado
  ...(wcProjectId ? [walletConnectWallet] : []),
];

// No forzamos projectId si no hay WalletConnect

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

// Solicita agregar una red a la wallet si no existe
export async function ensureChain(target: Chain): Promise<void> {
  // @ts-ignore
  const eth = typeof window !== 'undefined' ? (window.ethereum as any) : undefined;
  if (!eth?.request) return;
  const hexChainId = '0x' + target.id.toString(16);
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexChainId }] });
  } catch (switchErr: any) {
    // 4902: chain no agregada
    if (switchErr?.code === 4902) {
      const params = {
        chainId: hexChainId,
        chainName: target.name,
        nativeCurrency: target.nativeCurrency,
        rpcUrls: target.rpcUrls.default.http,
        blockExplorerUrls: [target.blockExplorers?.default?.url].filter(Boolean),
      };
      try {
        await eth.request({ method: 'wallet_addEthereumChain', params: [params] });
      } catch {}
    }
  }
}


