import Card from '../ui/Card';
import Button from '../ui/Button';
import type { ListingItem } from '../../types/marketplace';

export default function ListingCard({ item, onBuy, onUnlist, onFav }: { item: ListingItem; onBuy: (id: string) => void; onUnlist: (id: string) => void; onFav?: (id: string) => void; }) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="aspect-[4/3] bg-black/30 relative">
        {/* imagen demo */}
        <img src="/images/market-placeholder.svg" alt="Item" className="absolute inset-0 w-full h-full object-cover opacity-70" />
        {onFav && (
          <button className={`absolute top-2 right-2 text-xs px-2 py-1 rounded ${item.favorite ? 'bg-primary text-black' : 'bg-white/10 text-text-primary'}`} onClick={() => onFav(item.id)} aria-label="Favorito">★</button>
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="heading text-lg">{item.name} #{String(item.tokenId)}</h3>
          <span className="text-xs text-text-secondary">{item.priceCore} CORE</span>
        </div>
        <div className="flex items-center justify-between">
          {item.isOwn ? (
            <Button variant="ghost" onClick={() => onUnlist(item.id)}>Retirar</Button>
          ) : (
            <Button onClick={() => onBuy(item.id)}>Comprar</Button>
          )}
        </div>
      </div>
    </Card>
  );
}


