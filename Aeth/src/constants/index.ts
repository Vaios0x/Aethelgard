export const CORE_MAINNET_ID = 1116;
export const CORE_TESTNET2_ID = 1114;

export const CONTRACT_ADDRESSES: Record<number, {
  HERO_NFT: `0x${string}`;
  STAKING: `0x${string}`;
  MARKETPLACE?: `0x${string}`;
}> = {
  [CORE_MAINNET_ID]: {
    HERO_NFT: (import.meta.env.VITE_HERO_NFT_MAINNET as `0x${string}`) ?? '0x0000000000000000000000000000000000000000',
    STAKING: (import.meta.env.VITE_STAKING_MAINNET as `0x${string}`) ?? '0x0000000000000000000000000000000000000000',
    MARKETPLACE: (import.meta.env.VITE_MARKETPLACE_MAINNET as `0x${string}`) ?? '0x0000000000000000000000000000000000000000',
  },
  [CORE_TESTNET2_ID]: {
    HERO_NFT: ((import.meta.env.VITE_HERO_NFT_TESTNET as `0x${string}`) ?? '0xaF9bAD18233d180BB7F763A0be4A252bDf16c776'),
    STAKING: ((import.meta.env.VITE_STAKING_TESTNET as `0x${string}`) ?? '0xdaAb335F3B2dAc3e963809EE7dD8102A890870a3'),
    MARKETPLACE: ((import.meta.env.VITE_MARKETPLACE_TESTNET as `0x${string}`) ?? '0x0000000000000000000000000000000000000000'),
  },
};

export type SupportedContracts = keyof typeof CONTRACT_ADDRESSES[typeof CORE_MAINNET_ID];


