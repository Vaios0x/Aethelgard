import React from 'react';
import ListingCard from './ListingCard';
import AdvancedFilters from './AdvancedFilters';
import MarketplaceControls from './MarketplaceControls';
import { useMarketplace } from '../../hooks/useMarketplace';
import Skeleton from '../ui/Skeleton';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface ListingGridProps {
  onBuyConfirm?: (id: string, name: string, price: number) => void;
  onUnlistConfirm?: (id: string, name: string) => void;
}

export default function ListingGrid({ onBuyConfirm, onUnlistConfirm }: ListingGridProps) {
  const {
    listings,
    isLoading,
    error,
    isUsingMockData,
    filters,
    sort,
    pagination,
    favorites,
    total,
    setFilters,
    clearFilters,
    sort: handleSort,
    setPage,
    setPageSize,
    toggleFavorite,
    buy,
    unlist
  } = useMarketplace();

  // Contadores para filtros
  const favoritesCount = favorites.size;
  const ownListingsCount = listings.filter(item => item.isOwn).length;

  return (
    <div className="space-y-6">
      {/* Indicador de modo demo */}
      {isUsingMockData && (
        <Card>
          <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40">
              🎮 Modo Demo
            </Badge>
            <div className="flex-1">
              <p className="text-sm text-amber-200">
                Estás viendo datos de ejemplo. Las transacciones serán simuladas.
              </p>
              {error && (
                <p className="text-xs text-amber-300 mt-1">
                  {error}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Filtros avanzados */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        favoritesCount={favoritesCount}
        ownListingsCount={ownListingsCount}
      />

      {/* Controles de ordenamiento y paginación */}
      <MarketplaceControls
        sort={sort}
        pagination={pagination}
        onSort={handleSort}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        total={total}
        isLoading={isLoading}
      />

      {/* Grid de listados */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: pagination.pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏪</div>
            <h3 className="heading text-lg mb-2">No hay listados disponibles</h3>
            <p className="text-text-secondary text-sm">
              {total === 0 
                ? 'Aún no hay héroes listados en el marketplace. ¡Sé el primero en listar uno!'
                : 'No hay listados que coincidan con tus filtros actuales.'
              }
            </p>
            {total > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 btn-ghost text-sm"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((item) => (
            <ListingCard
              key={item.id}
              item={item}
              onBuy={onBuyConfirm ? () => onBuyConfirm(item.id, item.name, item.priceCore) : buy}
              onUnlist={onUnlistConfirm ? () => onUnlistConfirm(item.id, item.name) : unlist}
              onFav={toggleFavorite}
            />
          ))}
        </div>
      )}

      {/* Información adicional */}
      {listings.length > 0 && (
        <div className="text-center text-sm text-text-secondary">
          <p>
            Mostrando {listings.length} de {total} listados
            {filters.onlyFavorites && ` (${favoritesCount} favoritos)`}
            {filters.onlyOwn && ` (${ownListingsCount} propios)`}
            {isUsingMockData && ' (modo demo)'}
          </p>
        </div>
      )}
    </div>
  );
}


