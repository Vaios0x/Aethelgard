// @ts-nocheck
import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { usePendingRewards, useStakingInfo, useStakingStats } from '../../hooks/useUserBalances';
import { formatNumber } from '../../lib/utils';
import Skeleton from '../ui/Skeleton';

export default function EssenceTracker() {
  const { rewards, isLoading: rewardsLoading } = usePendingRewards();
  const { stakedTokens, totalRewards, lastClaimTime, pendingRewards, isLoading: infoLoading } = useStakingInfo();
  const { totalStaked, rewardPerSecond, isLoading: statsLoading } = useStakingStats();

  const isLoading = rewardsLoading || infoLoading || statsLoading;

  // Calcular APR aproximado (rewardPerSecond * 365 * 24 * 3600 / totalStaked)
  const apr = React.useMemo(() => {
    if (totalStaked === 0n || rewardPerSecond === 0n) return 0;
    const secondsPerYear = 365n * 24n * 3600n;
    const annualRewards = rewardPerSecond * secondsPerYear;
    const aprValue = Number((annualRewards * 10000n) / totalStaked) / 100; // En porcentaje con 2 decimales
    return aprValue;
  }, [totalStaked, rewardPerSecond]);

  // Calcular tiempo desde el último claim
  const timeSinceLastClaim = React.useMemo(() => {
    if (lastClaimTime === 0n) return null;
    const now = BigInt(Math.floor(Date.now() / 1000));
    const diff = now - lastClaimTime;
    const days = Number(diff) / (24 * 3600);
    const hours = (Number(diff) % (24 * 3600)) / 3600;
    return { days: Math.floor(days), hours: Math.floor(hours) };
  }, [lastClaimTime]);

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* Recompensas Pendientes */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="heading text-xl">Esencia Acumulada</h3>
          <p className="text-text-secondary text-sm">Recompensas listas para reclamar</p>
        </div>
        <div className="text-2xl sm:text-3xl font-heading text-primary min-w-[6ch] text-right">
          {isLoading ? <Skeleton className="h-8 w-20" /> : formatNumber(rewards ?? 0n, 4)}
        </div>
      </Card>

      {/* Estadísticas de Staking */}
      <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="heading text-xl">Mis Héroes Staked</h3>
          <p className="text-text-secondary text-sm">Total en el altar</p>
        </div>
        <div className="text-2xl sm:text-3xl font-heading text-primary min-w-[6ch] text-right">
          {isLoading ? <Skeleton className="h-8 w-20" /> : stakedTokens.length}
        </div>
      </Card>

      {/* Estadísticas Globales */}
      <Card className="lg:col-span-2">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-heading text-primary">
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : formatNumber(totalStaked, 0)}
            </div>
            <p className="text-sm text-text-secondary">Total Staked</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-heading text-primary">
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : `${apr.toFixed(2)}%`}
            </div>
            <p className="text-sm text-text-secondary">APR Aproximado</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-heading text-primary">
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto" /> : formatNumber(rewardPerSecond, 6)}
            </div>
            <p className="text-sm text-text-secondary">Reward/sec</p>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {timeSinceLastClaim && (
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40">
                  ⏰ Último Claim
                </Badge>
                <span className="text-text-secondary">
                  Hace {timeSinceLastClaim.days}d {timeSinceLastClaim.hours}h
                </span>
              </div>
            )}
            
            {stakedTokens.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-300 border-green-500/40">
                  🎯 Activo
                </Badge>
                <span className="text-text-secondary">
                  {stakedTokens.length} héroes staked
                </span>
              </div>
            )}

            {rewards > 0n && (
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                  💎 Recompensas
                </Badge>
                <span className="text-text-secondary">
                  {formatNumber(rewards, 4)} esencia disponible
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}


