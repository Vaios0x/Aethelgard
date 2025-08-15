// @ts-nocheck
import HeroCard from './HeroCard';
import type { Hero } from '../../types/hero';

interface HeroGridProps {
  heroes: Hero[];
  showListButton?: boolean;
  onListHero?: (hero: Hero) => void;
}

export default function HeroGrid({ heroes, showListButton = false, onListHero }: HeroGridProps) {
  if (!heroes || heroes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚔️</div>
        <h3 className="heading text-lg mb-2">No tienes héroes</h3>
        <p className="text-text-secondary text-sm">
          Conecta tu wallet y obtén tu primer héroe NFT
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {heroes.map((hero) => (
        <HeroCard
          key={String(hero.id)}
          hero={hero}
          showListButton={showListButton}
          onList={onListHero}
        />
      ))}
    </div>
  );
}


