import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';
import { PriceTooltip, BuyTooltip, FavoriteTooltip } from './MarketplaceTooltips';
import type { ListingItem } from '../../types/marketplace';

interface ListingCardProps {
  item: ListingItem;
  onBuy: (id: string) => void;
  onUnlist: (id: string) => void;
  onFav?: (id: string) => void;
}

export default function ListingCard({ item, onBuy, onUnlist, onFav }: ListingCardProps) {
  const getClassColor = (heroClass: string) => {
    switch (heroClass) {
      case 'Warrior': return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'Mage': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Ranger': return 'bg-green-500/20 text-green-300 border-green-500/40';
      case 'Paladin': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'Assassin': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    }
  };

  return (
    <Card className="p-0 overflow-hidden hover:shadow-glow transition-shadow duration-200">
      {/* Imagen del héroe */}
      <div className="aspect-[4/3] bg-black/30 relative">
        {item.image ? (
          <img 
            src={item.image} 
            alt={`Héroe ${item.name}`} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/images/market-placeholder.svg';
            }}
          />
        ) : (
          <img 
            src="/images/market-placeholder.svg" 
            alt="Placeholder" 
            className="w-full h-full object-cover opacity-70" 
          />
        )}
        
        {/* Overlay con información rápida */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Badges de información */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge className={getClassColor(item.class || 'Warrior')}>
            {item.class || 'Warrior'}
          </Badge>
          <Badge className="bg-primary/20 text-primary border-primary/40">
            Lvl {item.level || 1}
          </Badge>
        </div>

        {/* Botón de favorito */}
        {onFav && (
          <FavoriteTooltip>
            <button
              className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${
                item.favorite 
                  ? 'bg-primary text-black' 
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
              onClick={() => onFav(item.id)}
              aria-label={item.favorite ? 'Remover de favoritos' : 'Añadir a favoritos'}
            >
              {item.favorite ? '★' : '☆'}
            </button>
          </FavoriteTooltip>
        )}

        {/* Indicador de propio */}
        {item.isOwn && (
          <div className="absolute bottom-2 left-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
              Mi listado
            </Badge>
          </div>
        )}
      </div>

      {/* Información del héroe */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Nombre y precio */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="heading text-sm sm:text-base lg:text-lg truncate">
              {item.name}
            </h3>
            <p className="text-xs text-text-secondary">
              ID: #{String(item.tokenId)}
            </p>
          </div>
          <PriceTooltip>
            <div className="text-right cursor-help">
              <div className="text-lg sm:text-xl font-bold text-primary">
                {item.priceCore.toFixed(2)} CORE
              </div>
              <div className="text-xs text-text-secondary">
                ≈ ${(item.priceCore * 0.5).toFixed(2)} USD
              </div>
            </div>
          </PriceTooltip>
        </div>

        {/* Estadísticas del héroe */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Poder:</span>
            <span className="font-semibold">{item.power || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Nivel:</span>
            <span className="font-semibold">{item.level || 1}</span>
          </div>
        </div>

        {/* Información del vendedor */}
        <Tooltip content={`Vendedor: ${item.seller}`} side="top">
          <div className="text-xs text-text-secondary cursor-help">
            Vendedor: {item.seller.slice(0, 6)}...{item.seller.slice(-4)}
          </div>
        </Tooltip>

        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {item.isOwn ? (
            <Button 
              variant="ghost" 
              onClick={() => onUnlist(item.id)} 
              className="flex-1 text-sm"
            >
              Cancelar listado
            </Button>
          ) : (
            <BuyTooltip>
              <Button 
                onClick={() => onBuy(item.id)} 
                className="flex-1 text-sm"
              >
                Comprar por {item.priceCore.toFixed(2)} CORE
              </Button>
            </BuyTooltip>
          )}
        </div>
      </div>
    </Card>
  );
}


