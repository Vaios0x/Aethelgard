// @ts-nocheck
import React from 'react';
import FilterBar from '../components/marketplace/FilterBar';
import ListingGrid from '../components/marketplace/ListingGrid';
import { useUserHeroes } from '../hooks/useUserHeroes';
import Card from '../components/ui/Card';
import Drawer from '../components/ui/Drawer';
import Button from '../components/ui/Button';
import { useMarketplace } from '../hooks/useMarketplace';

export default function MarketplacePage() {
  const [filter, setFilter] = React.useState<{ q: string; min?: number; max?: number }>({ q: '' });
  const { heroes } = useUserHeroes();
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<bigint | null>(null);
  const [price, setPrice] = React.useState(0.9);
  const { list } = useMarketplace();
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="heading text-2xl sm:text-3xl">Mercado</h1>
      <FilterBar onFilterChange={setFilter} />
      <Card>
        <h2 className="heading text-xl mb-3 sm:mb-2">Mi inventario (mock)</h2>
        <div className="flex flex-wrap gap-2">
          {heroes?.map((h) => (
            <button key={String(h.id)} className="btn-ghost px-2 sm:px-3 py-1 text-sm" onClick={() => { setSelectedId(h.id); setOpen(true); }}>
              #{String(h.id)} {h.name}
            </button>
          ))}
          {(!heroes || heroes.length === 0) && (
            <span className="text-text-secondary text-sm">Sin héroes disponibles.</span>
          )}
        </div>
      </Card>
      <ListingGrid filter={filter} />
      <Drawer open={open} onClose={() => setOpen(false)} title={`Listar #${selectedId ?? ''}`}>
        <div className="space-y-3">
          <p className="text-text-secondary text-sm">Precio (CORE)</p>
          <input
            type="number"
            className="w-full rounded-md bg-surface border border-white/10 px-3 py-2"
            value={price}
            onChange={(e) => setPrice(Number((e.target as HTMLInputElement).value))}
          />
          <Button onClick={() => { if (selectedId!=null) list({ tokenId: selectedId, name: `Hero #${selectedId}`, priceCore: price, seller: '0xYOU', isOwn: true }); setOpen(false); }} className="w-full">Publicar (mock)</Button>
        </div>
      </Drawer>
    </div>
  );
}


