// @ts-nocheck
import React from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAethelgardContracts } from './useAethelgardContracts';
import { pushActivity } from './useActivity';

export function useHeroEvolution(tokenId: bigint) {
  const { heroNft } = useAethelgardContracts();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [error, setError] = React.useState<string | null>(null);

  const evolve = React.useCallback(() => {
    setError(null);
    try {
      writeContract({ address: heroNft.address, abi: heroNft.abi, functionName: 'evolve', args: [tokenId] });
    } catch (e: any) {
      setError(e?.message ?? 'Error al enviar transacción');
    }
  }, [writeContract, heroNft.address, heroNft.abi, tokenId]);

  return { evolve, isPending: isPending || isConfirming, isSuccess, error };
}


