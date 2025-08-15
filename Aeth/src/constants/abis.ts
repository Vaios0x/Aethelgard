import HeroNFT from './abis/HeroNFT.json';
import Staking from './abis/Staking.json';
import Marketplace from './abis/Marketplace.json';
import EssenceToken from './abis/EssenceToken.json';

export const abis = {
  HeroNFT: HeroNFT.abi,
  Staking: Staking.abi,
  Marketplace: Marketplace.abi,
  EssenceToken: EssenceToken.abi,
} as const;

// Exportaciones individuales para compatibilidad
export const HERO_NFT_ABI = HeroNFT.abi;
export const STAKING_ABI = Staking.abi;
export const MARKETPLACE_ABI = Marketplace.abi;
export const ESSENCE_TOKEN_ABI = EssenceToken.abi;


