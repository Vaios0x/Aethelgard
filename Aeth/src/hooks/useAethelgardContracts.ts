// @ts-nocheck
import { useAccount } from 'wagmi';
import { CONTRACTS } from '../constants';
import { abis } from '../constants/abis';

export function useAethelgardContracts() {
  const { chain } = useAccount();
  
  // Determinar qué red usar
  const isMainnet = chain?.id === 1116;
  const isTestnet2 = chain?.id === 1114;
  const network = isMainnet ? 'mainnet' : isTestnet2 ? 'testnet2' : 'testnet2'; // Default a testnet2
  
  const contracts = CONTRACTS[network];

  return {
    heroNft: {
      address: contracts.heroNft as `0x${string}`,
      abi: abis.HeroNFT,
      isConfigured: contracts.heroNft !== '0x0000000000000000000000000000000000000000',
    },
    staking: {
      address: contracts.staking as `0x${string}`,
      abi: abis.Staking,
      isConfigured: contracts.staking !== '0x0000000000000000000000000000000000000000',
    },
    marketplace: {
      address: contracts.marketplace as `0x${string}`,
      abi: abis.Marketplace,
      isConfigured: contracts.marketplace !== '0x0000000000000000000000000000000000000000',
    },
    essenceToken: {
      address: contracts.essenceToken as `0x${string}`,
      abi: abis.EssenceToken,
      isConfigured: contracts.essenceToken !== '0x0000000000000000000000000000000000000000',
    },
    network,
    isMainnet,
    isTestnet2,
  };
}


