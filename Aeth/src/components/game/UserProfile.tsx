// @ts-nocheck
import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useUserStats, useEssenceBalance } from '../../hooks/useUserBalances';
import { formatNumber } from '../../lib/utils';
import Skeleton from '../ui/Skeleton';

export default function UserProfile() {
  const { stats, isLoading: statsLoading, error: statsError } = useUserStats();
  const { balance: essenceBalance, isLoading: essenceLoading } = useEssenceBalance();

  if (statsLoading || essenceLoading) {
    return (
      <Card className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </Card>
    );
  }

  if (statsError || !stats) {
    return (
      <Card className="space-y-4">
        <h3 className="heading text-lg">Perfil del Usuario</h3>
        <p className="text-text-secondary text-sm">
          {statsError || 'No se pudieron cargar las estadísticas'}
        </p>
      </Card>
    );
  }

  const { user, essence, staking, marketplace, summary } = stats;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="heading text-lg">Perfil del Usuario</h3>
        <Badge variant="outline" className={summary.isActive ? 'text-green-400' : 'text-text-secondary'}>
          {summary.isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{user.totalHeroes}</div>
          <div className="text-xs text-text-secondary">Héroes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {formatNumber(essenceBalance, 2)}
          </div>
          <div className="text-xs text-text-secondary">ESSENCE</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{user.totalPower}</div>
          <div className="text-xs text-text-secondary">Poder Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{user.averageLevel}</div>
          <div className="text-xs text-text-secondary">Nivel Promedio</div>
        </div>
      </div>

      {/* Información detallada */}
      <div className="space-y-3">
        {/* Héroes por nivel */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Distribución por Nivel</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(user.heroesByLevel)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, count]) => (
                <Badge key={level} variant="outline" className="text-xs">
                  Nivel {level}: {count}
                </Badge>
              ))}
          </div>
        </div>

        {/* Información de staking */}
        {staking && (
          <div className="bg-surface/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold mb-2">Staking</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-secondary">Staked:</span>
                <div className="font-semibold">{staking.stakedCount} héroes</div>
              </div>
              <div>
                <span className="text-text-secondary">Recompensas:</span>
                <div className="font-semibold text-green-400">
                  {formatNumber(staking.pendingRewardsFormatted, 4)} ESSENCE
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información de marketplace */}
        {marketplace && (
          <div className="bg-surface/50 rounded-lg p-3">
            <h4 className="text-sm font-semibold mb-2">Marketplace</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-text-secondary">Listados activos:</span>
                <div className="font-semibold">{marketplace.activeListings}</div>
              </div>
              <div>
                <span className="text-text-secondary">Total listados:</span>
                <div className="font-semibold">{marketplace.totalListed}</div>
              </div>
            </div>
          </div>
        )}

        {/* Resumen */}
        <div className="bg-primary/10 rounded-lg p-3">
          <h4 className="text-sm font-semibold mb-2">Resumen</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-text-secondary">Total de activos:</span>
              <div className="font-semibold">{summary.totalAssets}</div>
            </div>
            <div>
              <span className="text-text-secondary">Valor total:</span>
              <div className="font-semibold text-primary">
                {formatNumber(summary.totalValue, 4)} ESSENCE
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}


