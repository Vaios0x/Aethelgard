export const CORE_MAINNET_ID = 1116;
export const CORE_TESTNET2_ID = 1114;

export const CONTRACT_ADDRESSES: Record<number, {
  HERO_NFT: `0x${string}`;
  STAKING: `0x${string}`;
  MARKETPLACE?: `0x${string}`;
}> = {
  // Mainnet no se usa en este despliegue (solo Testnet2)
  [CORE_MAINNET_ID]: {
    HERO_NFT: '0x0000000000000000000000000000000000000000',
    STAKING: '0x0000000000000000000000000000000000000000',
    MARKETPLACE: '0x0000000000000000000000000000000000000000',
  },
  [CORE_TESTNET2_ID]: {
    HERO_NFT: (import.meta.env.VITE_HERO_NFT_TESTNET as `0x${string}`) ?? '0x5b33069977773557D07023A73468fD16F83ebaea',
    STAKING: (import.meta.env.VITE_STAKING_TESTNET as `0x${string}`) ?? '0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637',
    MARKETPLACE: (import.meta.env.VITE_MARKETPLACE_TESTNET as `0x${string}`) ?? '0xAf59e08968446664acE238d3B3415179e5E2E428',
  },
};

export type SupportedContracts = keyof typeof CONTRACT_ADDRESSES[typeof CORE_MAINNET_ID];


