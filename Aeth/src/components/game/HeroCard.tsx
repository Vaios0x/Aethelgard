// @ts-nocheck
import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useReadContract } from 'wagmi';
import { useAethelgardContracts } from '../../hooks/useAethelgardContracts';
import { formatNumber } from '../../lib/utils';
import { CLASS_COLORS, RARITY_COLORS, EVOLUTION_STAGES } from '../../constants';
import Skeleton from '../ui/Skeleton';

interface HeroCardProps {
  tokenId: bigint;
  onList?: (tokenId: bigint) => void;
  showListButton?: boolean;
}

export default function HeroCard({ tokenId, onList, showListButton = false }: HeroCardProps) {
  const { heroNft } = useAethelgardContracts();

  // Obtener información del héroe
  const heroInfo = useReadContract({
    address: heroNft.address,
    abi: heroNft.abi,
    functionName: 'getHeroInfo',
    args: [tokenId],
    query: { enabled: Boolean(tokenId && heroNft.isConfigured) },
  });

  // Obtener clase y rareza como strings
  const heroClass = useReadContract({
    address: heroNft.address,
    abi: heroNft.abi,
    functionName: 'getHeroClass',
    args: [tokenId],
    query: { enabled: Boolean(tokenId && heroNft.isConfigured) },
  });

  const heroRarity = useReadContract({
    address: heroNft.address,
    abi: heroNft.abi,
    functionName: 'getHeroRarity',
    args: [tokenId],
    query: { enabled: Boolean(tokenId && heroNft.isConfigured) },
  });

  if (heroInfo.isLoading || heroClass.isLoading || heroRarity.isLoading) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
      </Card>
    );
  }

  if (!heroInfo.data || !heroClass.data || !heroRarity.data) {
    return (
      <Card className="p-4">
        <p className="text-text-secondary text-sm">Error al cargar héroe #{String(tokenId)}</p>
      </Card>
    );
  }

  const hero = heroInfo.data;
  const className = heroClass.data;
  const rarityName = heroRarity.data;
  const stageName = EVOLUTION_STAGES[hero.evolutionStage as keyof typeof EVOLUTION_STAGES] || 'Unknown';

  const classColor = CLASS_COLORS[className as keyof typeof CLASS_COLORS] || 'text-gray-400';
  const rarityColor = RARITY_COLORS[rarityName as keyof typeof RARITY_COLORS] || 'text-gray-400';

  return (
    <Card className="p-4 space-y-3 hover:bg-white/5 transition-colors">
      {/* Header con ID y badges */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">Hero #{String(tokenId)}</h3>
          <p className="text-text-secondary text-sm">{className} • {rarityName}</p>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className={classColor}>
            {className}
          </Badge>
          <Badge variant="outline" className={rarityColor}>
            {rarityName}
          </Badge>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-text-secondary">Nivel</p>
          <p className="font-semibold text-lg">{hero.level}</p>
        </div>
        <div>
          <p className="text-text-secondary">Poder</p>
          <p className="font-semibold text-lg">{formatNumber(hero.power, 0)}</p>
        </div>
        <div>
          <p className="text-text-secondary">Etapa</p>
          <p className="font-semibold">{stageName}</p>
        </div>
        <div>
          <p className="text-text-secondary">Experiencia</p>
          <p className="font-semibold">{formatNumber(hero.experience, 0)}</p>
        </div>
      </div>

      {/* Barra de progreso hacia la siguiente etapa */}
      <div>
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Progreso a {EVOLUTION_STAGES[Math.min(hero.evolutionStage + 1, 5) as keyof typeof EVOLUTION_STAGES]}</span>
          <span>{Math.round(Number((hero.level % 20n) / 20n) * 100)}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.round(Number((hero.level % 20n) / 20n) * 100)}%` }}
          />
        </div>
      </div>

      {/* Información adicional */}
      <div className="text-xs text-text-secondary space-y-1">
        <p>• Última evolución: {hero.lastEvolution > 0 ? new Date(Number(hero.lastEvolution) * 1000).toLocaleDateString() : 'Nunca'}</p>
        <p>• Estado: {hero.isEvolved ? 'Evolucionado' : 'Novato'}</p>
        <p>• Próximo nivel: {Math.floor(Number(hero.level) / 20) * 20 + 20}</p>
      </div>

      {/* Botón de listado */}
      {showListButton && onList && (
        <button
          onClick={() => onList(tokenId)}
          className="w-full btn-surface text-sm py-2 mt-2"
          aria-label={`Listar héroe #${String(tokenId)}`}
        >
          Listar en Marketplace
        </button>
      )}
    </Card>
  );
}


