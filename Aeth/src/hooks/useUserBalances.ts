// @ts-nocheck
import React from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAethelgardContracts } from './useAethelgardContracts';
import { pushActivity } from './useActivity';

export function usePendingRewards() {
  const { address } = useAccount();
  const { staking } = useAethelgardContracts();

  const live = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: 'pendingRewards',
    args: [address!],
    query: { enabled: Boolean(address && staking.isConfigured) },
  });

  return {
    rewards: (live.data as bigint | undefined) ?? 0n,
    isLoading: live.isLoading,
    refetch: live.refetch,
  } as const;
}

export function useStakingActions() {
  const { staking } = useAethelgardContracts();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const [error, setError] = React.useState<string | null>(null);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const stakeSelected = React.useCallback((ids: bigint[]) => {
    setError(null);
    if (!ids.length) return;
    if (!staking.isConfigured) { setError('Contrato de Staking no configurado.'); return; }
    try {
      writeContract({ address: staking.address, abi: staking.abi, functionName: 'stake', args: [ids] });
    } catch (e: any) {
      setError(e?.message ?? 'Error al enviar transacción');
    }
  }, [staking.address, staking.abi, writeContract]);

  const unstakeSelected = React.useCallback((ids: bigint[]) => {
    setError(null);
    if (!ids.length) return;
    if (!staking.isConfigured) { setError('Contrato de Staking no configurado.'); return; }
    try {
      writeContract({ address: staking.address, abi: staking.abi, functionName: 'unstake', args: [ids] });
    } catch (e: any) {
      setError(e?.message ?? 'Error al enviar transacción');
    }
  }, [staking.address, staking.abi, writeContract]);

  const claim = React.useCallback((ids?: bigint[]) => {
    setError(null);
    if (!staking.isConfigured) { setError('Contrato de Staking no configurado.'); return; }
    try {
      const tokenIds = Array.isArray(ids) ? ids : [];
      writeContract({ address: staking.address, abi: staking.abi, functionName: 'claimRewards', args: [tokenIds] });
    } catch (e: any) {
      setError(e?.message ?? 'Error al enviar transacción');
    }
  }, [staking.address, staking.abi, writeContract]);

  return {
    stakeSelected,
    unstakeSelected,
    claim,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}


