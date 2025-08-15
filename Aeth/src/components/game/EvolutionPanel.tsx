// @ts-nocheck
import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useHeroEvolution } from '../../hooks/useHeroEvolution';
import { useToast } from '../../lib/notifications';
import { formatNumber } from '../../lib/utils';
import { CLASS_COLORS, RARITY_COLORS, EVOLUTION_STAGES } from '../../constants';
import Skeleton from '../ui/Skeleton';

interface EvolutionPanelProps {
  tokenId: bigint;
}

export default function EvolutionPanel({ tokenId }: EvolutionPanelProps) {
  const { heroInfo, isLoading, isPending, error, evolve, cooldownFormatted } = useHeroEvolution(tokenId);
  const { show } = useToast();
  const [showEffects, setShowEffects] = React.useState(false);

  // Efectos de evolución
  React.useEffect(() => {
    if (showEffects) {
      const timer = setTimeout(() => setShowEffects(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showEffects]);

  const handleEvolve = async () => {
    setShowEffects(true);
    await evolve();
  };

  if (isLoading) {
    return (
      <Card className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  if (!heroInfo) {
    return (
      <Card className="space-y-3">
        <h3 className="heading text-lg sm:text-xl">Evolución</h3>
        <p className="text-text-secondary text-xs sm:text-sm">No se pudo cargar la información del héroe.</p>
      </Card>
    );
  }

  const {
    level,
    evolutionStage,
    power,
    className,
    rarityName,
    stageName,
    essenceCost,
    essenceBalance,
    canEvolve,
    evolutionReason,
    hasEnoughEssence,
    isOnCooldown,
    progressToNextStage,
    nextStageLevel,
  } = heroInfo;

  const classColor = CLASS_COLORS[className as keyof typeof CLASS_COLORS] || 'text-gray-400';
  const rarityColor = RARITY_COLORS[rarityName as keyof typeof RARITY_COLORS] || 'text-gray-400';

  return (
    <Card className={`space-y-4 relative overflow-hidden ${showEffects ? 'animate-pulse' : ''}`}>
      {/* Efectos de evolución */}
      {showEffects && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 animate-pulse pointer-events-none" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="heading text-lg sm:text-xl">Evolución</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={classColor}>
            {className}
          </Badge>
          <Badge variant="outline" className={rarityColor}>
            {rarityName}
          </Badge>
        </div>
      </div>

      {/* Información del héroe */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-text-secondary">Nivel</p>
          <p className="font-semibold text-lg">{level}</p>
        </div>
        <div>
          <p className="text-text-secondary">Poder</p>
          <p className="font-semibold text-lg">{formatNumber(power, 0)}</p>
        </div>
        <div>
          <p className="text-text-secondary">Etapa</p>
          <p className="font-semibold">{stageName}</p>
        </div>
        <div>
          <p className="text-text-secondary">Próximo nivel</p>
          <p className="font-semibold">{nextStageLevel}</p>
        </div>
      </div>

      {/* Barra de progreso hacia la siguiente etapa */}
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Progreso a {EVOLUTION_STAGES[Math.min(evolutionStage + 1, 5) as keyof typeof EVOLUTION_STAGES]}</span>
          <span>{Math.round(Number(progressToNextStage) * 100)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(Number(progressToNextStage) * 100)}%` }}
          />
        </div>
      </div>

      {/* Información de esencia */}
      <div className="bg-white/5 rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Costo de evolución:</span>
          <span className="font-semibold text-purple-400">
            {formatNumber(essenceCost, 4)} ESSENCE
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-text-secondary">Tu balance:</span>
          <span className={`font-semibold ${hasEnoughEssence ? 'text-green-400' : 'text-red-400'}`}>
            {formatNumber(essenceBalance, 4)} ESSENCE
          </span>
        </div>
      </div>

      {/* Estado de evolución */}
      {!canEvolve && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-amber-400 text-sm font-medium">
            {isOnCooldown ? (
              <>
                ⏰ Cooldown activo: {cooldownFormatted}
              </>
            ) : (
              <>
                ⚠️ {evolutionReason}
              </>
            )}
          </p>
        </div>
      )}

      {/* Botón de evolución */}
      <Button
        onClick={handleEvolve}
        isLoading={isPending}
        disabled={!canEvolve || !hasEnoughEssence || isOnCooldown}
        className={`w-full font-semibold text-base py-3 ${
          canEvolve && hasEnoughEssence && !isOnCooldown
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
            : 'bg-gray-600 cursor-not-allowed'
        }`}
        aria-label="Evolucionar héroe"
      >
        {isPending ? (
          'Evolucionando...'
        ) : !canEvolve ? (
          'No puede evolucionar'
        ) : !hasEnoughEssence ? (
          'Esencia insuficiente'
        ) : isOnCooldown ? (
          'En cooldown'
        ) : (
          <>
            <span className="mr-2">✨</span>
            Evolucionar a Nivel {level + 1}
          </>
        )}
      </Button>

      {/* Información adicional */}
      <div className="text-xs text-text-secondary space-y-1">
        <p>• Cada evolución aumenta el nivel y poder del héroe</p>
        <p>• Nueva etapa cada 20 niveles con bonus adicional</p>
        <p>• Cooldown de 1 hora entre evoluciones</p>
        <p>• El costo aumenta con el nivel y etapa</p>
      </div>

      {/* Efectos visuales de evolución */}
      {showEffects && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 animate-pulse" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-6xl animate-bounce">✨</div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </Card>
  );
}


