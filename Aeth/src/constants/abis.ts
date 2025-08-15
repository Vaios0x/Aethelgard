// ABIs reales importados desde artifacts (reducidos a la propiedad "abi" para el bundle)
// @ts-expect-error: import de JSON sin tipos específicos
import HERO_JSON from './abis/HeroNFT.json';
// @ts-expect-error
import STAKING_JSON from './abis/Staking.json';
// @ts-expect-error
import MARKET_JSON from './abis/Marketplace.json';

export const HERO_NFT_ABI = HERO_JSON.abi as const;
export const STAKING_ABI = STAKING_JSON.abi as const;
export const MARKETPLACE_ABI = MARKET_JSON.abi as const;


