// @ts-nocheck
import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAccount } from 'wagmi';
import { useStakingActions } from '../../hooks/useUserBalances';
import { useToast } from '../../lib/notifications';
import { isMockMode } from '../../lib/utils';
import { useUserHeroes } from '../../hooks/useUserHeroes';

export default function StakingPanel() {
  const { address } = useAccount();
  const { stakeSelected, unstakeSelected, claim, isPending, error, isSuccess } = useStakingActions();
  const [selectedIds, setSelectedIds] = React.useState<bigint[]>([]);
  const { show } = useToast();
  const { heroes } = useUserHeroes();

  return (
    <Card className="space-y-4">
      <h2 className="heading text-2xl">Gestiona tu Staking</h2>
      <p className="text-text-secondary text-sm">Selecciona tus Héroes para stakear o des-stakear en el Altar.</p>
      {!address && (
        <div className="text-amber-300">Conecta tu wallet para continuar.</div>
      )}
      {error && (
        <div className="text-red-400 text-sm" role="alert">{error}</div>
      )}
      {isSuccess && (<div className="text-emerald-400 text-sm" role="status">Transacción confirmada.</div>)}
      {isMockMode() && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {heroes?.map((h) => (
            <button
              key={String(h.id)}
              className={`px-3 py-2 rounded-md border ${selectedIds.includes(h.id) ? 'border-primary bg-white/10' : 'border-white/10 hover:bg-white/5'}`}
              onClick={() => setSelectedIds((prev) => prev.includes(h.id) ? prev.filter(i => i!==h.id) : [...prev, h.id])}
              aria-label={`Seleccionar héroe ${h.name}`}
            >#{String(h.id)} · {h.name}</button>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <Button onClick={() => { stakeSelected(selectedIds); show('Tx enviada: stakeando héroes…', 'info'); }} isLoading={isPending} aria-label="Stakear seleccionados">
          Stakear
        </Button>
        <Button variant="ghost" onClick={() => { unstakeSelected(selectedIds); show('Tx enviada: des-stakeando héroes…', 'info'); }} isLoading={isPending} aria-label="Des-stakear seleccionados">
          Des-stakear
        </Button>
        <Button variant="surface" onClick={() => { claim(selectedIds); show('Tx enviada: reclamando recompensas…', 'info'); }} isLoading={isPending} aria-label="Reclamar recompensas">
          Reclamar
        </Button>
      </div>
    </Card>
  );
}


