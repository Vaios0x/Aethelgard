import React from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import type { MarketplaceFilters } from '../../types/marketplace';

interface AdvancedFiltersProps {
  filters: MarketplaceFilters;
  onFiltersChange: (filters: Partial<MarketplaceFilters>) => void;
  onClearFilters: () => void;
  favoritesCount: number;
  ownListingsCount: number;
}

const HERO_CLASSES = [
  { value: 'Warrior', label: 'Guerrero' },
  { value: 'Mage', label: 'Mago' },
  { value: 'Ranger', label: 'Arquero' },
  { value: 'Paladin', label: 'Paladín' },
  { value: 'Assassin', label: 'Asesino' },
];

export default function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  favoritesCount, 
  ownListingsCount 
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleFilterChange = (key: keyof MarketplaceFilters, value: any) => {
    onFiltersChange({ [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== false
  );

  return (
    <Card>
      <div className="space-y-4">
        {/* Filtros básicos siempre visibles */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Buscar héroes..."
            value={filters.q || ''}
            onChange={(e) => handleFilterChange('q', e.target.value)}
            aria-label="Buscar por nombre o ID"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Precio mínimo"
            value={filters.min || ''}
            onChange={(e) => handleFilterChange('min', e.target.value === '' ? undefined : Number(e.target.value))}
            aria-label="Precio mínimo en CORE"
          />
          <Input
            type="number"
            step="0.01"
            placeholder="Precio máximo"
            value={filters.max || ''}
            onChange={(e) => handleFilterChange('max', e.target.value === '' ? undefined : Number(e.target.value))}
            aria-label="Precio máximo en CORE"
          />
          <select
            className="w-full rounded-md bg-surface border border-white/10 px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
            value={filters.class || ''}
            onChange={(e) => handleFilterChange('class', e.target.value || undefined)}
            aria-label="Filtrar por clase"
          >
            <option value="">Todas las clases</option>
            {HERO_CLASSES.map(cls => (
              <option key={cls.value} value={cls.value}>{cls.label}</option>
            ))}
          </select>
        </div>

        {/* Botón para expandir filtros avanzados */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm"
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="surface"
              onClick={onClearFilters}
              className="text-sm"
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Filtros avanzados */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            {/* Filtros de nivel y poder */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                type="number"
                placeholder="Nivel mínimo"
                value={filters.minLevel || ''}
                onChange={(e) => handleFilterChange('minLevel', e.target.value === '' ? undefined : Number(e.target.value))}
                aria-label="Nivel mínimo"
              />
              <Input
                type="number"
                placeholder="Nivel máximo"
                value={filters.maxLevel || ''}
                onChange={(e) => handleFilterChange('maxLevel', e.target.value === '' ? undefined : Number(e.target.value))}
                aria-label="Nivel máximo"
              />
              <Input
                type="number"
                placeholder="Poder mínimo"
                value={filters.minPower || ''}
                onChange={(e) => handleFilterChange('minPower', e.target.value === '' ? undefined : Number(e.target.value))}
                aria-label="Poder mínimo"
              />
              <Input
                type="number"
                placeholder="Poder máximo"
                value={filters.maxPower || ''}
                onChange={(e) => handleFilterChange('maxPower', e.target.value === '' ? undefined : Number(e.target.value))}
                aria-label="Poder máximo"
              />
            </div>

            {/* Filtros de estado */}
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyFavorites || false}
                  onChange={(e) => handleFilterChange('onlyFavorites', e.target.checked)}
                  className="rounded border-white/10 bg-surface text-primary focus:ring-2 focus:ring-primary/40"
                />
                <span className="text-sm">
                  Solo favoritos ({favoritesCount})
                </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onlyOwn || false}
                  onChange={(e) => handleFilterChange('onlyOwn', e.target.checked)}
                  className="rounded border-white/10 bg-surface text-primary focus:ring-2 focus:ring-primary/40"
                />
                <span className="text-sm">
                  Solo mis listados ({ownListingsCount})
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Indicadores de filtros activos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
            <span className="text-xs text-text-secondary">Filtros activos:</span>
            {filters.q && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                Búsqueda: "{filters.q}"
                <button
                  onClick={() => handleFilterChange('q', undefined)}
                  className="ml-1 hover:text-primary/70"
                  aria-label="Remover filtro de búsqueda"
                >
                  ×
                </button>
              </span>
            )}
            {filters.min !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                Min: {filters.min} CORE
                <button
                  onClick={() => handleFilterChange('min', undefined)}
                  className="ml-1 hover:text-primary/70"
                  aria-label="Remover filtro de precio mínimo"
                >
                  ×
                </button>
              </span>
            )}
            {filters.max !== undefined && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                Max: {filters.max} CORE
                <button
                  onClick={() => handleFilterChange('max', undefined)}
                  className="ml-1 hover:text-primary/70"
                  aria-label="Remover filtro de precio máximo"
                >
                  ×
                </button>
              </span>
            )}
            {filters.class && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                Clase: {filters.class}
                <button
                  onClick={() => handleFilterChange('class', undefined)}
                  className="ml-1 hover:text-primary/70"
                  aria-label="Remover filtro de clase"
                >
                  ×
                </button>
              </span>
            )}
            {filters.onlyFavorites && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                Solo favoritos
                <button
                  onClick={() => handleFilterChange('onlyFavorites', false)}
                  className="ml-1 hover:text-primary/70"
                  aria-label="Remover filtro de favoritos"
                >
                  ×
                </button>
              </span>
            )}
            {filters.onlyOwn && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/20 text-primary rounded">
                Solo mis listados
                <button
                  onClick={() => handleFilterChange('onlyOwn', false)}
                  className="ml-1 hover:text-primary/70"
                  aria-label="Remover filtro de propios"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
