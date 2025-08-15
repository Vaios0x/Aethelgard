// @ts-nocheck
import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import ConfirmationModal from '../ui/ConfirmationModal';
import LoadingSection from '../ui/LoadingOverlay';
import { useAccount } from 'wagmi';
import { useStakingActions, useStakingInfo } from '../../hooks/useUserBalances';
import { useToast } from '../../lib/notifications';
import { useUserHeroes } from '../../hooks/useUserHeroes';
import { formatNumber } from '../../lib/utils';

export default function StakingPanel() {
  const { address } = useAccount();
  const { stakeSelected, unstakeSelected, claim, isPending, error, isSuccess } = useStakingActions();
  const [selectedIds, setSelectedIds] = React.useState<bigint[]>([]);
  const [selectedStakedIds, setSelectedStakedIds] = React.useState<bigint[]>([]);
  const { show } = useToast();
  const { heroes, isLoading: heroesLoading } = useUserHeroes();
  const { stakedTokens, pendingRewards, isLoading: stakingLoading } = useStakingInfo();
  
  // Estado para confirmaciones
  const [confirmation, setConfirmation] = React.useState<{
    isOpen: boolean;
    action: 'stake' | 'unstake' | 'claim';
    count: number;
    rewards?: bigint;
  }>({
    isOpen: false,
    action: 'stake',
    count: 0
  });

  // Separar héroes staked y no staked
  const { stakedHeroes, unstakedHeroes } = React.useMemo(() => {
    const staked: typeof heroes = [];
    const unstaked: typeof heroes = [];
    
    heroes.forEach(hero => {
      if (hero.staked) {
        staked.push(hero);
      } else {
        unstaked.push(hero);
      }
    });
    
    return { stakedHeroes: staked, unstakedHeroes: unstaked };
  }, [heroes]);

  const handleStake = () => {
    if (selectedIds.length === 0) {
      show('Selecciona héroes para stakear', 'warning');
      return;
    }
    setConfirmation({
      isOpen: true,
      action: 'stake',
      count: selectedIds.length
    });
  };

  const handleUnstake = () => {
    if (selectedStakedIds.length === 0) {
      show('Selecciona héroes para des-stakear', 'warning');
      return;
    }
    setConfirmation({
      isOpen: true,
      action: 'unstake',
      count: selectedStakedIds.length
    });
  };

  const handleClaimAll = () => {
    if (pendingRewards === 0n) {
      show('No hay recompensas para reclamar', 'warning');
      return;
    }
    setConfirmation({
      isOpen: true,
      action: 'claim',
      count: 0,
      rewards: pendingRewards
    });
  };

  const handleClaimSelected = () => {
    if (selectedStakedIds.length === 0) {
      show('Selecciona héroes para reclamar recompensas', 'warning');
      return;
    }
    // Para claim selected, necesitaríamos calcular las recompensas específicas
    setConfirmation({
      isOpen: true,
      action: 'claim',
      count: selectedStakedIds.length
    });
  };

  const handleConfirm = async () => {
    if (confirmation.action === 'stake') {
      stakeSelected(selectedIds);
      setSelectedIds([]);
    } else if (confirmation.action === 'unstake') {
      unstakeSelected(selectedStakedIds);
      setSelectedStakedIds([]);
    } else if (confirmation.action === 'claim') {
      if (confirmation.count === 0) {
        claim(); // Claim all
      } else {
        claim(selectedStakedIds);
        setSelectedStakedIds([]);
      }
    }
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-6">
      {/* Panel de Acciones */}
      <LoadingSection isLoading={stakingLoading}>
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="heading text-2xl">Gestiona tu Staking</h2>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/40">
                {stakedTokens.length} Staked
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
                {formatNumber(pendingRewards, 4)} Esencia
              </Badge>
            </div>
          </div>
        
        <p className="text-text-secondary text-sm">
          Selecciona tus Héroes para stakear, des-stakear o reclamar recompensas en el Altar.
        </p>

        {!address && (
          <div className="text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            Conecta tu wallet para continuar.
          </div>
        )}

        {error && (
          <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3" role="alert">
            {error}
          </div>
        )}

        {isSuccess && (
          <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3" role="status">
            Transacción confirmada exitosamente.
          </div>
        )}

        {/* Acciones Principales */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleStake} 
            isLoading={isPending} 
            disabled={selectedIds.length === 0}
            aria-label="Stakear seleccionados" 
            className="flex-1"
          >
            Stakear ({selectedIds.length})
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={handleUnstake} 
            isLoading={isPending} 
            disabled={selectedStakedIds.length === 0}
            aria-label="Des-stakear seleccionados" 
            className="flex-1"
          >
            Des-stakear ({selectedStakedIds.length})
          </Button>
          
          <Button 
            variant="surface" 
            onClick={handleClaimSelected} 
            isLoading={isPending} 
            disabled={selectedStakedIds.length === 0}
            aria-label="Reclamar recompensas seleccionadas" 
            className="flex-1"
          >
            Reclamar ({selectedStakedIds.length})
          </Button>
          
          <Button 
            variant="primary" 
            onClick={handleClaimAll} 
            isLoading={isPending} 
            disabled={pendingRewards === 0n}
            aria-label="Reclamar todas las recompensas" 
            className="flex-1"
          >
            Reclamar Todo
          </Button>
        </div>
      </Card>
      </LoadingSection>

      {/* Héroes Disponibles para Staking */}
      <LoadingSection isLoading={heroesLoading}>
        {unstakedHeroes.length > 0 && (
          <Card>
            <h3 className="heading text-lg mb-3">Héroes Disponibles</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {unstakedHeroes.map((h) => {
                const isSelected = selectedIds.includes(h.id);
                return (
                  <button
                    key={String(h.id)}
                    className={`px-2 sm:px-3 py-2 rounded-md border text-sm transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/10 text-primary' 
                        : 'border-white/10 hover:bg-white/5 hover:border-white/20'
                    }`}
                    onClick={() => setSelectedIds((prev) => 
                      prev.includes(h.id) 
                        ? prev.filter(i => i !== h.id) 
                        : [...prev, h.id]
                    )}
                    aria-label={`Seleccionar héroe ${h.name}`}
                    title={`${h.name} - Nivel ${h.level}`}
                  >
                    <div className="font-semibold">#{String(h.id)}</div>
                    <div className="text-xs opacity-75">{h.name}</div>
                    <div className="text-xs opacity-60">Lv.{h.level}</div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Héroes Staked */}
        {stakedHeroes.length > 0 && (
          <Card>
            <h3 className="heading text-lg mb-3">Héroes Staked</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {stakedHeroes.map((h) => {
                const isSelected = selectedStakedIds.includes(h.id);
                return (
                  <button
                    key={String(h.id)}
                    className={`px-2 sm:px-3 py-2 rounded-md border text-sm transition-colors ${
                      isSelected 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300' 
                        : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/50'
                    }`}
                    onClick={() => setSelectedStakedIds((prev) => 
                      prev.includes(h.id) 
                        ? prev.filter(i => i !== h.id) 
                        : [...prev, h.id]
                    )}
                    aria-label={`Seleccionar héroe staked ${h.name}`}
                    title={`${h.name} - Nivel ${h.level} - Staked`}
                  >
                    <div className="font-semibold">#{String(h.id)}</div>
                    <div className="text-xs opacity-75">{h.name}</div>
                    <div className="text-xs opacity-60">Lv.{h.level}</div>
                    <div className="text-xs text-amber-400">⚡ Staked</div>
                  </button>
                );
              })}
            </div>
          </Card>
        )}

        {/* Estado Vacío */}
        {heroes.length === 0 && (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚔️</div>
              <h3 className="heading text-lg mb-2">No tienes héroes</h3>
              <p className="text-text-secondary text-sm">
                Necesitas héroes NFT para poder participar en el staking.
              </p>
            </div>
          </Card>
        )}
      </LoadingSection>

      {/* Modal de confirmación */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirm}
        title={
          confirmation.action === 'stake' 
            ? 'Confirmar staking' 
            : confirmation.action === 'unstake'
            ? 'Confirmar des-staking'
            : 'Confirmar reclamación'
        }
        message={
          confirmation.action === 'stake'
            ? `¿Estás seguro de que quieres stakear ${confirmation.count} héroes?`
            : confirmation.action === 'unstake'
            ? `¿Estás seguro de que quieres des-stakear ${confirmation.count} héroes?`
            : confirmation.count === 0
            ? `¿Estás seguro de que quieres reclamar ${formatNumber(confirmation.rewards || 0n, 4)} ESSENCE?`
            : `¿Estás seguro de que quieres reclamar las recompensas de ${confirmation.count} héroes?`
        }
        confirmText={
          confirmation.action === 'stake' 
            ? 'Stakear' 
            : confirmation.action === 'unstake'
            ? 'Des-stakear'
            : 'Reclamar'
        }
        variant={
          confirmation.action === 'stake' 
            ? 'info' 
            : confirmation.action === 'unstake'
            ? 'warning'
            : 'info'
        }
        details={
          confirmation.action === 'stake'
            ? 'Los héroes serán transferidos al contrato de staking y comenzarán a generar recompensas.'
            : confirmation.action === 'unstake'
            ? 'Los héroes serán devueltos a tu wallet y dejarán de generar recompensas.'
            : 'Las recompensas serán transferidas a tu wallet como tokens ESSENCE.'
        }
      />
    </div>
  );
}


