import React from 'react';
import Tooltip from '../ui/Tooltip';

// Tooltip para filtros
export function FilterTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip 
      content="Filtra los listados por diferentes criterios como clase, nivel, precio y más" 
      side="top"
    >
      {children}
    </Tooltip>
  );
}

// Tooltip para precios
export function PriceTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip 
      content="Precio en CORE tokens. El valor en USD es aproximado y puede variar." 
      side="top"
    >
      {children}
    </Tooltip>
  );
}

// Tooltip para botón de compra
export function BuyTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip 
      content="Comprar este héroe. Se transferirá a tu wallet y se descontará el precio de tu balance de CORE." 
      side="top"
    >
      {children}
    </Tooltip>
  );
}

// Tooltip para favoritos
export function FavoriteTooltip({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip 
      content="Añadir o remover de favoritos para acceso rápido" 
      side="left"
    >
      {children}
    </Tooltip>
  );
}

// Tooltip para información del vendedor
export function SellerTooltip({ seller }: { seller: string }) {
  return (
    <Tooltip content={`Vendedor: ${seller}`} side="top">
      <div className="text-xs text-text-secondary cursor-help">
        Vendedor: {seller.slice(0, 6)}...{seller.slice(-4)}
      </div>
    </Tooltip>
  );
}

// Tooltip para estadísticas del héroe
export function HeroStatsTooltip({ children, stats }: { 
  children: React.ReactNode;
  stats: { power: number; level: number; class: string };
}) {
  return (
    <Tooltip 
      content={`Poder: ${stats.power} | Nivel: ${stats.level} | Clase: ${stats.class}`} 
      side="top"
    >
      {children}
    </Tooltip>
  );
}

// Tooltip para ordenamiento
export function SortTooltip({ 
  children, 
  field, 
  currentSort 
}: { 
  children: React.ReactNode;
  field: string;
  currentSort: { field: string; order: string };
}) {
  const isActive = currentSort.field === field;
  const direction = isActive ? (currentSort.order === 'asc' ? 'ascendente' : 'descendente') : 'descendente';
  
  return (
    <Tooltip 
      content={`Ordenar por ${field} ${direction}`} 
      side="top"
    >
      {children}
    </Tooltip>
  );
}

// Tooltip para paginación
export function PaginationTooltip({ 
  children, 
  action 
}: { 
  children: React.ReactNode;
  action: string;
}) {
  return (
    <Tooltip content={action} side="top">
      {children}
    </Tooltip>
  );
}
