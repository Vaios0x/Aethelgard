import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { HeroData } from '../../types/hero';

interface HeroCardProps {
  hero: HeroData;
}

export default function HeroCard({ hero }: HeroCardProps) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="aspect-[4/3] bg-black/30">
        {hero.image && (
          <img src={hero.image} alt={`Héroe ${hero.name}`} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-3 sm:p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="heading text-base sm:text-lg">{hero.name}</h3>
          <span className="text-xs text-text-secondary">Lvl {hero.level}</span>
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm text-text-secondary">
          <span>{hero.class}</span>
          <span>Poder: {hero.power}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 gap-2 sm:gap-0">
          <Link to={`/hero/${String(hero.id)}`} className="w-full sm:w-auto">
            <Button variant="surface" aria-label="Ver detalles del héroe" className="w-full sm:w-auto">Detalles</Button>
          </Link>
          {hero.staked ? (
            <span className="text-emerald-400 text-xs">En Staking</span>
          ) : (
            <span className="text-text-secondary text-xs">Disponible</span>
          )}
        </div>
      </div>
    </Card>
  );
}


