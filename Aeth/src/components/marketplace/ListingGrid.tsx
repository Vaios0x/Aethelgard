import ListingCard from './ListingCard';
import { useMarketplace } from '../../hooks/useMarketplace';
import React from 'react';

export default function ListingGrid({ filter }: { filter: { q?: string; min?: number; max?: number } }) {
  const { listings, buy, unlist, toggleFavorite, sort } = useMarketplace();
  const [page, setPage] = React.useState(1);
  const pageSize = 6;

  React.useEffect(() => { setPage(1); }, [filter.q, filter.min, filter.max]);

  const filtered = listings.filter((l) => {
    if (filter.q && !(`${l.name} ${String(l.tokenId)}`.toLowerCase().includes(filter.q.toLowerCase()))) return false;
    if (typeof filter.min === 'number' && l.priceCore < filter.min) return false;
    if (typeof filter.max === 'number' && l.priceCore > filter.max) return false;
    return true;
  });
  if (!filtered.length) return <div className="text-text-secondary">Sin listados por ahora.</div>;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2 pb-2">
        <button className="btn-ghost px-2 sm:px-3 py-1 text-xs sm:text-sm" onClick={() => sort('price', 'asc')}>Precio ↑</button>
        <button className="btn-ghost px-2 sm:px-3 py-1 text-xs sm:text-sm" onClick={() => sort('price', 'desc')}>Precio ↓</button>
        <button className="btn-ghost px-2 sm:px-3 py-1 text-xs sm:text-sm" onClick={() => sort('name', 'asc')}>Nombre A-Z</button>
        <button className="btn-ghost px-2 sm:px-3 py-1 text-xs sm:text-sm" onClick={() => sort('name', 'desc')}>Nombre Z-A</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {pageItems.map((it) => (
          <ListingCard key={it.id} item={it} onBuy={buy} onUnlist={unlist} onFav={toggleFavorite} />
        ))}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 pt-4">
        <button className="btn-ghost px-2 sm:px-3 py-1 text-xs sm:text-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} aria-label="Página anterior">Anterior</button>
        <span className="text-xs sm:text-sm text-text-secondary">Página {page} de {totalPages}</span>
        <button className="btn-ghost px-2 sm:px-3 py-1 text-xs sm:text-sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} aria-label="Página siguiente">Siguiente</button>
      </div>
    </>
  );
}


