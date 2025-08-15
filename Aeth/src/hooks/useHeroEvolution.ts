// @ts-nocheck
import React from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient, useAccount } from 'wagmi';
import { useAethelgardContracts } from './useAethelgardContracts';
import { pushActivity } from './useActivity';
import { useToast } from '../lib/notifications';
import { formatNumber } from '../lib/utils';
import { EVOLUTION_CONFIG, HERO_CLASSES, HERO_RARITIES, EVOLUTION_STAGES } from '../constants';

export function useHeroEvolution(tokenId: bigint) {
  const { heroNft, essenceToken } = useAethelgardContracts();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [error, setError] = React.useState<string | null>(null);
  const { show } = useToast();
  const publicClient = usePublicClient();

  // Obtener información del héroe
  const heroInfo = useReadContract({
    address: heroNft.address,
    abi: heroNft.abi,
    functionName: 'getHeroInfo',
    args: [tokenId],
    query: { enabled: Boolean(tokenId && heroNft.isConfigured) },
  });

  // Obtener costo de evolución
  const evolutionCost = useReadContract({
    address: heroNft.address,
    abi: heroNft.abi,
    functionName: 'getEvolutionCost',
    args: [tokenId],
    query: { enabled: Boolean(tokenId && heroNft.isConfigured) },
  });

  // Verificar si puede evolucionar
  const canEvolve = useReadContract({
    address: heroNft.address,
    abi: heroNft.abi,
    functionName: 'canEvolve',
    args: [tokenId],
    query: { enabled: Boolean(tokenId && heroNft.isConfigured) },
  });

  // Obtener cooldown restante
  const cooldownRemaining = useReadContract({
    address: heroNft.address,
    abi: heroNft.abi,
    functionName: 'getEvolutionCooldownRemaining',
    args: [tokenId],
    query: { enabled: Boolean(tokenId && heroNft.isConfigured) },
  });

  // Obtener balance de esencia del usuario
  const { address } = useAccount();
  const essenceBalance = useReadContract({
    address: essenceToken.address,
    abi: essenceToken.abi,
    functionName: 'balanceOf',
    args: [address!],
    query: { enabled: Boolean(address && essenceToken.isConfigured) },
  });

  const evolve = React.useCallback(async () => {
    setError(null);
    
    if (!heroNft.isConfigured) {
      setError('Contrato de héroes no configurado');
      return;
    }

    if (!essenceToken.isConfigured) {
      setError('Token de esencia no configurado');
      return;
    }

    try {
      // Verificar si puede evolucionar
      const [canEvolveResult, reason] = await publicClient!.readContract({
        address: heroNft.address,
        abi: heroNft.abi,
        functionName: 'canEvolve',
        args: [tokenId],
      });

      if (!canEvolveResult) {
        setError(`No puede evolucionar: ${reason}`);
        show(`No puede evolucionar: ${reason}`, 'error');
        return;
      }

      // Verificar balance de esencia
      const cost = evolutionCost.data || 0n;
      const balance = essenceBalance.data || 0n;

      if (balance < cost) {
        const errorMsg = `Esencia insuficiente. Necesitas ${formatNumber(cost, 4)} pero tienes ${formatNumber(balance, 4)}`;
        setError(errorMsg);
        show(errorMsg, 'error');
        return;
      }

      // Aprobar esencia si es necesario
      const allowance = await publicClient!.readContract({
        address: essenceToken.address,
        abi: essenceToken.abi,
        functionName: 'allowance',
        args: [address!, heroNft.address],
      });

      if (allowance < cost) {
        // Aprobar esencia
        const approveHash = await writeContract({
          address: essenceToken.address,
          abi: essenceToken.abi,
          functionName: 'approve',
          args: [heroNft.address, cost],
        });

        show('Aprobando esencia...', 'info');
        await publicClient!.waitForTransactionReceipt({ hash: approveHash });
      }

      // Evolucionar héroe
      const evolveHash = await writeContract({
        address: heroNft.address,
        abi: heroNft.abi,
        functionName: 'evolve',
        args: [tokenId],
      });

      show(`Evolucionando héroe #${String(tokenId)}...`, 'info');
      pushActivity('evolve', `Evolucionando héroe #${String(tokenId)}`, `hash: ${evolveHash}`);

      // Esperar confirmación
      await publicClient!.waitForTransactionReceipt({ hash: evolveHash });
      
      show('¡Héroe evolucionado exitosamente!', 'success');
      pushActivity('evolve', `Héroe #${String(tokenId)} evolucionado`, 'success');

      // Refrescar datos
      heroInfo.refetch();
      evolutionCost.refetch();
      canEvolve.refetch();
      cooldownRemaining.refetch();
      essenceBalance.refetch();

    } catch (e: any) {
      console.error('Error en evolución:', e);
      const errorMsg = e?.shortMessage || e?.message || 'Error al evolucionar héroe';
      setError(errorMsg);
      show(errorMsg, 'error');
    }
  }, [
    tokenId,
    heroNft.address,
    heroNft.abi,
    heroNft.isConfigured,
    essenceToken.address,
    essenceToken.abi,
    essenceToken.isConfigured,
    writeContract,
    publicClient,
    address,
    evolutionCost.data,
    essenceBalance.data,
    show,
    heroInfo.refetch,
    evolutionCost.refetch,
    canEvolve.refetch,
    cooldownRemaining.refetch,
    essenceBalance.refetch,
  ]);

  // Calcular estadísticas derivadas
  const stats = React.useMemo(() => {
    if (!heroInfo.data) return null;

    const hero = heroInfo.data;
    const cost = evolutionCost.data || 0n;
    const balance = essenceBalance.data || 0n;
    const canEvolveResult = canEvolve.data?.[0] || false;
    const reason = canEvolve.data?.[1] || '';
    const cooldown = cooldownRemaining.data || 0n;

    return {
      // Información básica
      level: hero.level,
      experience: hero.experience,
      evolutionStage: hero.evolutionStage,
      power: hero.power,
      rarity: hero.rarity,
      class: hero.class,
      isEvolved: hero.isEvolved,
      lastEvolution: hero.lastEvolution,

      // Información de evolución
      essenceCost: cost,
      essenceBalance: balance,
      canEvolve: canEvolveResult,
      evolutionReason: reason,
      cooldownRemaining: cooldown,

      // Información formateada
      className: HERO_CLASSES[hero.class as keyof typeof HERO_CLASSES] || 'Unknown',
      rarityName: HERO_RARITIES[hero.rarity as keyof typeof HERO_RARITIES] || 'Unknown',
      stageName: EVOLUTION_STAGES[hero.evolutionStage as keyof typeof EVOLUTION_STAGES] || 'Unknown',

      // Cálculos
      hasEnoughEssence: balance >= cost,
      isOnCooldown: cooldown > 0n,
      progressToNextStage: (hero.level % 20n) / 20n,
      nextStageLevel: Math.floor(Number(hero.level) / 20) * 20 + 20,
    };
  }, [heroInfo.data, evolutionCost.data, essenceBalance.data, canEvolve.data, cooldownRemaining.data]);

  // Formatear tiempo de cooldown
  const cooldownFormatted = React.useMemo(() => {
    if (!stats?.cooldownRemaining || stats.cooldownRemaining === 0n) return null;

    const seconds = Number(stats.cooldownRemaining);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }, [stats?.cooldownRemaining]);

  return {
    // Estado
    heroInfo: stats,
    isLoading: heroInfo.isLoading || evolutionCost.isLoading || canEvolve.isLoading || cooldownRemaining.isLoading || essenceBalance.isLoading,
    isPending: isPending || isConfirming,
    isSuccess,
    error,

    // Acciones
    evolve,

    // Información formateada
    cooldownFormatted,

    // Refetch functions
    refetch: () => {
      heroInfo.refetch();
      evolutionCost.refetch();
      canEvolve.refetch();
      cooldownRemaining.refetch();
      essenceBalance.refetch();
    },
  };
}


