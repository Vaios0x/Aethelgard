// @ts-nocheck
import React from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useAethelgardContracts } from './useAethelgardContracts';
import { pushActivity } from './useActivity';
import { useToast } from '../lib/notifications';

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

export function useStakingInfo() {
  const { address } = useAccount();
  const { staking } = useAethelgardContracts();

  const stakingInfo = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: 'getUserStakingInfo',
    args: [address!],
    query: { enabled: Boolean(address && staking.isConfigured) },
  });

  return {
    stakedTokens: (stakingInfo.data?.[0] as bigint[] | undefined) ?? [],
    totalRewards: (stakingInfo.data?.[1] as bigint | undefined) ?? 0n,
    lastClaimTime: (stakingInfo.data?.[2] as bigint | undefined) ?? 0n,
    pendingRewards: (stakingInfo.data?.[3] as bigint | undefined) ?? 0n,
    isLoading: stakingInfo.isLoading,
    refetch: stakingInfo.refetch,
  } as const;
}

export function useStakingStats() {
  const { staking } = useAethelgardContracts();

  const totalStaked = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: 'totalStaked',
    query: { enabled: staking.isConfigured },
  });

  const rewardPerSecond = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: 'rewardPerSecond',
    query: { enabled: staking.isConfigured },
  });

  return {
    totalStaked: (totalStaked.data as bigint | undefined) ?? 0n,
    rewardPerSecond: (rewardPerSecond.data as bigint | undefined) ?? 0n,
    isLoading: totalStaked.isLoading || rewardPerSecond.isLoading,
  } as const;
}

export function useStakingActions() {
  const { staking } = useAethelgardContracts();
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const [error, setError] = React.useState<string | null>(null);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const { show } = useToast();

  const stakeSelected = React.useCallback((ids: bigint[]) => {
    setError(null);
    if (!ids.length) return;
    if (!staking.isConfigured) { setError('Contrato de Staking no configurado.'); return; }
    
    try {
      writeContract({ 
        address: staking.address, 
        abi: staking.abi, 
        functionName: 'stake', 
        args: [ids] 
      });
      show(`Stakeando ${ids.length} héroes...`, 'info');
      pushActivity('stake', `Stakeado ${ids.length} héroes`, `tokenIds: ${ids.join(',')}`);
    } catch (e: any) {
      setError(e?.message ?? 'Error al enviar transacción');
    }
  }, [staking.address, staking.abi, writeContract, show]);

  const unstakeSelected = React.useCallback((ids: bigint[]) => {
    setError(null);
    if (!ids.length) return;
    if (!staking.isConfigured) { setError('Contrato de Staking no configurado.'); return; }
    
    try {
      writeContract({ 
        address: staking.address, 
        abi: staking.abi, 
        functionName: 'unstake', 
        args: [ids] 
      });
      show(`Des-stakeando ${ids.length} héroes...`, 'info');
      pushActivity('unstake', `Des-stakeado ${ids.length} héroes`, `tokenIds: ${ids.join(',')}`);
    } catch (e: any) {
      setError(e?.message ?? 'Error al enviar transacción');
    }
  }, [staking.address, staking.abi, writeContract, show]);

  const claim = React.useCallback((ids?: bigint[]) => {
    setError(null);
    if (!staking.isConfigured) { setError('Contrato de Staking no configurado.'); return; }
    
    try {
      const tokenIds = Array.isArray(ids) ? ids : [];
      if (tokenIds.length === 0) {
        // Claim all rewards
        writeContract({ 
          address: staking.address, 
          abi: staking.abi, 
          functionName: 'claimAllRewards', 
          args: [] 
        });
        show('Reclamando todas las recompensas...', 'info');
        pushActivity('claim', 'Reclamadas todas las recompensas', 'claimAll');
      } else {
        // Claim specific tokens
        writeContract({ 
          address: staking.address, 
          abi: staking.abi, 
          functionName: 'claimRewards', 
          args: [tokenIds] 
        });
        show(`Reclamando recompensas de ${tokenIds.length} héroes...`, 'info');
        pushActivity('claim', `Reclamadas recompensas de ${tokenIds.length} héroes`, `tokenIds: ${tokenIds.join(',')}`);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Error al enviar transacción');
    }
  }, [staking.address, staking.abi, writeContract, show]);

  return {
    stakeSelected,
    unstakeSelected,
    claim,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
  };
}

export function useStakeInfo(tokenId: bigint) {
  const { staking } = useAethelgardContracts();

  const stakeInfo = useReadContract({
    address: staking.address,
    abi: staking.abi,
    functionName: 'getStakeInfo',
    args: [tokenId],
    query: { enabled: staking.isConfigured },
  });

  return {
    owner: stakeInfo.data?.[0] as string | undefined,
    since: (stakeInfo.data?.[1] as bigint | undefined) ?? 0n,
    rewards: (stakeInfo.data?.[2] as bigint | undefined) ?? 0n,
    pendingRewards: (stakeInfo.data?.[3] as bigint | undefined) ?? 0n,
    isLoading: stakeInfo.isLoading,
    refetch: stakeInfo.refetch,
  } as const;
}

export function useEssenceBalance() {
  const { address } = useAccount();
  const { essenceToken } = useAethelgardContracts();
  const [balance, setBalance] = React.useState<bigint>(0n);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!address) {
      setBalance(0n);
      return;
    }

    const fetchBalance = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Intentar obtener del backend primero (más rápido)
        const { getUserEssenceBalance } = await import('../lib/api');
        const data = await getUserEssenceBalance();
        setBalance(BigInt(data.balance));
      } catch (e) {
        // Fallback al contrato directo
        if (essenceToken.isConfigured) {
          try {
            const { useReadContract } = await import('wagmi');
            const balanceData = await useReadContract({
              address: essenceToken.address,
              abi: essenceToken.abi,
              functionName: 'balanceOf',
              args: [address],
            });
            setBalance(balanceData as bigint);
          } catch (contractError) {
            setError('Error al obtener balance de esencia');
            console.error('Contract error:', contractError);
          }
        } else {
          setError('Token de esencia no configurado');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [address, essenceToken.isConfigured, essenceToken.address]);

  return {
    balance,
    isLoading,
    error,
    refetch: () => {
      if (address) {
        const fetchBalance = async () => {
          setIsLoading(true);
          setError(null);
          try {
            const { getUserEssenceBalance } = await import('../lib/api');
            const data = await getUserEssenceBalance();
            setBalance(BigInt(data.balance));
          } catch (e) {
            setError('Error al actualizar balance');
          } finally {
            setIsLoading(false);
          }
        };
        fetchBalance();
      }
    }
  };
}

export function useUserStats() {
  const { address } = useAccount();
  const [stats, setStats] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!address) {
      setStats(null);
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { getUserStats } = await import('../lib/api');
        const data = await getUserStats();
        setStats(data);
      } catch (e) {
        setError('Error al obtener estadísticas del usuario');
        console.error('Stats error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [address]);

  return {
    stats,
    isLoading,
    error,
    refetch: () => {
      if (address) {
        const fetchStats = async () => {
          setIsLoading(true);
          setError(null);
          try {
            const { getUserStats } = await import('../lib/api');
            const data = await getUserStats();
            setStats(data);
          } catch (e) {
            setError('Error al actualizar estadísticas');
          } finally {
            setIsLoading(false);
          }
        };
        fetchStats();
      }
    }
  };
}


