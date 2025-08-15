import Button from '../ui/Button';
import Card from '../ui/Card';
import { useHeroEvolution } from '../../hooks/useHeroEvolution';

interface EvolutionPanelProps {
  tokenId: bigint;
}

export default function EvolutionPanel({ tokenId }: EvolutionPanelProps) {
  const { evolve, isPending } = useHeroEvolution(tokenId);
  return (
    <Card className="space-y-3">
      <h3 className="heading text-lg sm:text-xl">Evolución</h3>
      <p className="text-text-secondary text-xs sm:text-sm">Canaliza la esencia para elevar el nivel de tu héroe.</p>
      <Button onClick={() => evolve()} isLoading={isPending} aria-label="Evolucionar héroe" className="w-full sm:w-auto text-sm">
        Evolucionar
      </Button>
    </Card>
  );
}


