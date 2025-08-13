// @ts-nocheck
import React from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAethelgardContracts } from './useAethelgardContracts';
import { isMockMode } from '../lib/utils';
import { pushActivity } from './useActivity';

export function useHeroEvolution(tokenId: bigint) {
  const { heroNft } = useAethelgardContracts();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [error, setError] = React.useState<string | null>(null);

  // Eliminar mocks por defecto; mantener por compatibilidad si VITE_MOCKS=true
  const [mockPending, setMockPending] = React.useState(false);
  const [mockSuccess, setMockSuccess] = React.useState(false);

  const evolve = React.useCallback(() => {
    setError(null);
    if (isMockMode()) {
      setMockPending(true);
      setTimeout(() => {
        setMockPending(false);
        setMockSuccess(true);
        pushActivity('evolution', `Evolución de #${String(tokenId)}`);
      }, 1200);
      return;
    }
    try {
      writeContract({ address: heroNft.address, abi: heroNft.abi, functionName: 'evolve', args: [tokenId] });
    } catch (e: any) {
      setError(e?.message ?? 'Error al enviar transacción');
    }
  }, [writeContract, heroNft.address, heroNft.abi, tokenId]);

  const pending = isMockMode() ? mockPending : (isPending || isConfirming);
  const success = isMockMode() ? mockSuccess : isSuccess;

  return { evolve, isPending: pending, isSuccess: success, error };
}


