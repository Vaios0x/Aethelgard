// @ts-nocheck
import Card from '../ui/Card';
// @ts-ignore
import { usePendingRewards } from '../../hooks/useUserBalances';
import { formatNumber } from '../../lib/utils';
import Skeleton from '../ui/Skeleton';

export default function EssenceTracker() {
  const { rewards, isLoading } = usePendingRewards();
  return (
    <Card className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
      <div>
        <h3 className="heading text-xl">Esencia Acumulada</h3>
        <p className="text-text-secondary text-sm">Recompensas listas para reclamar</p>
      </div>
      <div className="text-2xl sm:text-3xl font-heading text-primary min-w-[6ch] text-right">
        {isLoading ? <Skeleton className="h-8 w-20" /> : (typeof rewards === 'number' ? rewards.toFixed(2) : formatNumber(rewards ?? 0n, 4))}
      </div>
    </Card>
  );
}


