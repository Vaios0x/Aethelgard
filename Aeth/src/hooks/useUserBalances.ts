// @ts-nocheck
import React from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAethelgardContracts } from './useAethelgardContracts';
import { isMockMode } from '../lib/utils';
import { pushActivity } from './useActivity';

export function usePendingRewards() {
  const { address } = useAccount();
  const { staking } = useAethelgardContracts();

  // Se desactivan mocks por defecto
  const [mockRewards, setMockRewards] = React.useState<number>(0);

  const live = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: 'pendingRewards',
    args: [address!],
    query: { enabled: Boolean(address && staking.isConfigured && !isMockMode()) },
  });

  return {
    rewards: isMockMode() ? mockRewards : ((live.data as bigint | undefined) ?? 0n),
    isLoading: live.isLoading && !isMockMode(),
    refetch: live.refetch,
    setMockRewards,
  } as const;
}

export function useStakingActions() {
  const { staking } = useAethelgardContracts();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const [error, setError] = React.useState<string | null>(null);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const [mockIsPending, setMockIsPending] = React.useState(false);
  const [mockIsSuccess, setMockIsSuccess] = React.useState(false);
  const { setMockRewards } = usePendingRewards();

  const stakeSelected = React.useCallback((ids: bigint[]) => {
    setError(null);
    if (!ids.length) return;
    if (isMockMode()) {
      setMockIsPending(true);
      setTimeout(() => {
      setMockIsPending(false);
      setMockIsSuccess(true);
      pushActivity('stake', `Stake de ${ids.length} héroes`, `IDs: ${ids.map(String).join(', ')}`);
        setMockRewards((r) => (typeof r === 'number' ? r + ids.length * 1.5 : 0));
      }, 800);
      return;
    }
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
    if (isMockMode()) {
      setMockIsPending(true);
      setTimeout(() => {
      setMockIsPending(false);
      setMockIsSuccess(true);
      pushActivity('unstake', `Unstake de ${ids.length} héroes`, `IDs: ${ids.map(String).join(', ')}`);
        setMockRewards((r) => (typeof r === 'number' ? Math.max(0, r - ids.length * 1) : 0));
      }, 800);
      return;
    }
    if (!staking.isConfigured) { setError('Contrato de Staking no configurado.'); return; }
    try {
      writeContract({ address: staking.address, abi: staking.abi, functionName: 'unstake', args: [ids] });
    } catch (e: any) {
      setError(e?.message ?? 'Error al enviar transacción');
    }
  }, [staking.address, staking.abi, writeContract]);

  const claim = React.useCallback((ids?: bigint[]) => {
    setError(null);
    if (isMockMode()) {
      setMockIsPending(true);
      setTimeout(() => {
      setMockIsPending(false);
      setMockIsSuccess(true);
      pushActivity('claim', 'Recompensas reclamadas');
        setMockRewards(() => 0);
      }, 600);
      return;
    }
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
    isPending: isMockMode() ? mockIsPending : (isPending || isConfirming),
    isSuccess: isMockMode() ? mockIsSuccess : isSuccess,
    error,
  };
}


