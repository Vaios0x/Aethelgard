// @ts-nocheck
import React from 'react';
import { useAccount } from 'wagmi';
import UserProfile from '../components/game/UserProfile';
import HeroGrid from '../components/game/HeroGrid';
import Card from '../components/ui/Card';
import { useAethelgardContracts } from '../hooks/useAethelgardContracts';
import { authorizedFetch, getToken } from '../lib/api';
import { isMockMode } from '../lib/utils';
import ActivityList from '../components/activity/ActivityList';
import Button from '../components/ui/Button';
import { useWriteContract } from 'wagmi';
import { usePublicClient } from 'wagmi';

export default function DashboardPage() {
  const { address } = useAccount();
  const { heroNft } = useAethelgardContracts();
  const { writeContract, isPending } = useWriteContract();
  const publicClient = usePublicClient();
  const [me, setMe] = React.useState<any>(null);
  React.useEffect(() => {
    (async () => {
      try {
        if (!getToken()) return;
        const res = await authorizedFetch('/users/me');
        if (res.ok) setMe(await res.json());
      } catch {}
    })();
  }, []);
  if (!address && !isMockMode()) {
    return (
      <Card>
        <p className="text-amber-300">Conecta tu wallet para entrar al Dashboard.</p>
      </Card>
    );
  }
  if (!heroNft.isConfigured && !isMockMode()) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
        <div className="flex items-center justify-between gap-4">
          <p className="font-medium">Configura las direcciones de contrato en tu .env para ver tus Héroes.</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >Abrir guía</a>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {me && (
        <div className="p-4 rounded-xl bg-neutral-800/60 border border-neutral-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-400">Sesión iniciada</p>
            <p className="text-neutral-200">{me.walletAddress}</p>
          </div>
          <span className="px-2 py-1 text-xs rounded-md bg-emerald-600/20 border border-emerald-400/40 text-emerald-200">OK</span>
        </div>
      )}
      <UserProfile />
      <div className="flex items-center justify-between">
        <h2 className="heading text-2xl">Tus Héroes</h2>
        {heroNft.isConfigured && address && (
          <Button
            aria-label="Crear héroe"
            onClick={async () => {
              try {
                await writeContract({
                  address: heroNft.address,
                  abi: heroNft.abi,
                  functionName: 'mintSelf',
                  args: [1n],
                });
              } catch {}
            }}
            disabled={isPending}
          >{isPending ? 'Creando…' : 'Crear Héroe'}</Button>
        )}
      </div>
      <HeroGrid />
      <div>
        <h2 className="heading text-2xl mb-2">Actividad</h2>
        <ActivityList />
      </div>
    </div>
  );
}



