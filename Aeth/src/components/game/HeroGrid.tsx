// @ts-nocheck
import HeroCard from './HeroCard';
import { useUserHeroes } from '../../hooks/useUserHeroes';
import Skeleton from '../ui/Skeleton';

export default function HeroGrid() {
  const { heroes, isLoading } = useUserHeroes();

  if (isLoading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-64" />
      ))}
    </div>
  );
  if (!heroes?.length) return <div className="text-text-secondary">No tienes héroes aún.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {heroes.map((h) => (
        <HeroCard key={String(h.id)} hero={h} />
      ))}
    </div>
  );
}


