// @ts-nocheck
import React from 'react';
import { useAccount } from 'wagmi';
import { getContract, type Address, type PublicClient, type WalletClient } from 'viem';
import { HERO_NFT_ABI, STAKING_ABI } from '../constants/abis';
import { CONTRACT_ADDRESSES } from '../constants';
import { isZeroAddress } from '../lib/utils';

export function useAethelgardContracts() {
  const { chain } = useAccount();
  const chainId = chain?.id ?? 1114; // default Core Testnet2

  const addresses = CONTRACT_ADDRESSES[chainId];

  const heroNft = React.useMemo(() => ({
    address: addresses?.HERO_NFT as Address,
    abi: HERO_NFT_ABI,
    isConfigured: addresses && !isZeroAddress(addresses.HERO_NFT),
  }), [addresses?.HERO_NFT, addresses]);

  const staking = React.useMemo(() => ({
    address: addresses?.STAKING as Address,
    abi: STAKING_ABI,
    isConfigured: addresses && !isZeroAddress(addresses.STAKING),
  }), [addresses?.STAKING, addresses]);

  return { heroNft, staking, chainId };
}


