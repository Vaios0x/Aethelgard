import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { SortConfig, PaginationConfig } from '../../types/marketplace';

interface MarketplaceControlsProps {
  sort: SortConfig;
  pagination: PaginationConfig;
  onSort: (field: 'price' | 'name' | 'level' | 'power' | 'createdAt', order: 'asc' | 'desc') => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  total: number;
  isLoading?: boolean;
}

const SORT_OPTIONS = [
  { field: 'createdAt' as const, label: 'Más recientes', asc: 'desc', desc: 'asc' },
  { field: 'price' as const, label: 'Precio', asc: 'asc', desc: 'desc' },
  { field: 'name' as const, label: 'Nombre', asc: 'asc', desc: 'desc' },
  { field: 'level' as const, label: 'Nivel', asc: 'desc', desc: 'asc' },
  { field: 'power' as const, label: 'Poder', asc: 'desc', desc: 'asc' },
];

const PAGE_SIZE_OPTIONS = [6, 12, 24, 48];

export default function MarketplaceControls({
  sort,
  pagination,
  onSort,
  onPageChange,
  onPageSizeChange,
  total,
  isLoading = false
}: MarketplaceControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));
  const startItem = (pagination.page - 1) * pagination.pageSize + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, total);

  const handleSort = (field: 'price' | 'name' | 'level' | 'power' | 'createdAt') => {
    const currentOrder = sort.field === field ? sort.order : 'desc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    onSort(field, newOrder);
  };

  const getSortIcon = (field: 'price' | 'name' | 'level' | 'power' | 'createdAt') => {
    if (sort.field !== field) return '↕️';
    return sort.order === 'asc' ? '↑' : '↓';
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Estadísticas */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-text-secondary">
            {isLoading ? (
              'Cargando...'
            ) : total === 0 ? (
              'No hay listados disponibles'
            ) : (
              `Mostrando ${startItem}-${endItem} de ${total} listados`
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Por página:</span>
            <select
              className="bg-surface border border-white/10 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={pagination.pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={isLoading}
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Controles de ordenamiento */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-text-secondary">Ordenar por:</span>
          {SORT_OPTIONS.map(option => (
            <Button
              key={option.field}
              variant={sort.field === option.field ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleSort(option.field)}
              disabled={isLoading}
              className="text-xs"
            >
              {option.label} {getSortIcon(option.field)}
            </Button>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={pagination.page <= 1 || isLoading}
                aria-label="Primera página"
              >
                ⏮️ Primera
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || isLoading}
                aria-label="Página anterior"
              >
                ◀️ Anterior
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* Páginas numeradas */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      disabled={isLoading}
                      className="w-8 h-8 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page >= totalPages || isLoading}
                aria-label="Página siguiente"
              >
                Siguiente ▶️
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={pagination.page >= totalPages || isLoading}
                aria-label="Última página"
              >
                Última ⏭️
              </Button>
            </div>
          </div>
        )}

        {/* Información de página */}
        {totalPages > 1 && (
          <div className="text-center text-sm text-text-secondary">
            Página {pagination.page} de {totalPages}
          </div>
        )}
      </div>
    </Card>
  );
}
