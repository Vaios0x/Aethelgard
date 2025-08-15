export interface ListingItem {
  id: string; // unique listing id
  tokenId: bigint;
  name: string;
  image?: string;
  priceCore: number; // precio en CORE
  seller: string; // address
  isOwn?: boolean; // si es del usuario actual
  favorite?: boolean; // flag UI para favoritos
  createdAt?: number; // timestamp de creación
  level?: number; // nivel del héroe
  class?: string; // clase del héroe
  power?: number; // poder del héroe
}

export interface MarketplaceFilters {
  q?: string; // búsqueda por texto
  min?: number; // precio mínimo
  max?: number; // precio máximo
  class?: string; // filtro por clase
  minLevel?: number; // nivel mínimo
  maxLevel?: number; // nivel máximo
  minPower?: number; // poder mínimo
  maxPower?: number; // poder máximo
  onlyFavorites?: boolean; // solo favoritos
  onlyOwn?: boolean; // solo propios
}

export interface SortConfig {
  field: 'price' | 'name' | 'level' | 'power' | 'createdAt';
  order: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface MarketplaceState {
  listings: ListingItem[];
  favorites: Set<string>; // Set de IDs de favoritos
  filters: MarketplaceFilters;
  sort: SortConfig;
  pagination: PaginationConfig;
  isLoading: boolean;
  error: string | null;
}


