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
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="heading text-lg">{hero.name}</h3>
          <span className="text-xs text-text-secondary">Lvl {hero.level}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-text-secondary">
          <span>{hero.class}</span>
          <span>Poder: {hero.power}</span>
        </div>
        <div className="flex items-center justify-between pt-3">
          <Link to={`/hero/${String(hero.id)}`}>
            <Button variant="surface" aria-label="Ver detalles del héroe">Detalles</Button>
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


