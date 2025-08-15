import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import EvolutionPanel from '../components/game/EvolutionPanel';
import { useHeroById } from '../hooks/useUserHeroes';

export default function HeroDetailPage() {
  const params = useParams();
  const id = useMemo(() => {
    const value = params.id ?? '0';
    try { return BigInt(value); } catch { return 0n; }
  }, [params.id]);

  const { hero, isLoading } = useHeroById(id);

  if (isLoading) return <div className="text-text-secondary">Cargando héroe…</div>;
  if (!hero) return (
    <Card>
      <div className="text-text-secondary">Héroe no encontrado. Revisa el ID o vuelve al Dashboard.</div>
    </Card>
  );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="p-0 overflow-hidden md:col-span-2">
        {hero.image && (
          <img src={hero.image} alt={`Héroe ${hero.name}`} className="w-full object-cover" />
        )}
        <div className="p-4 space-y-2">
          <h1 className="heading text-3xl">{hero.name}</h1>
          <p className="text-text-secondary">Clase: {hero.class} · Nivel {hero.level}</p>
          {hero.description && <p className="text-sm text-text-secondary">{hero.description}</p>}
          {hero.attributes && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              <Card>
                <div className="text-text-secondary">Fuerza</div>
                <div className="heading">{hero.attributes.strength}</div>
              </Card>
              <Card>
                <div className="text-text-secondary">Agilidad</div>
                <div className="heading">{hero.attributes.agility}</div>
              </Card>
              <Card>
                <div className="text-text-secondary">Intelecto</div>
                <div className="heading">{hero.attributes.intellect}</div>
              </Card>
            </div>
          )}
        </div>
      </Card>
      <div className="space-y-4">
        <EvolutionPanel tokenId={hero.id} />
      </div>
    </div>
  );
}


