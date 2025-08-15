import type { ListingItem, MarketplaceFilters, SortConfig, PaginationConfig } from '../types/marketplace';

// Store persistente para el marketplace
class MarketplaceStore {
  private favorites: Set<string> = new Set();
  private filters: MarketplaceFilters = {};
  private sort: SortConfig = { field: 'createdAt', order: 'desc' };
  private pagination: PaginationConfig = { page: 1, pageSize: 12, total: 0 };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  // Persistencia en localStorage
  private saveToStorage() {
    try {
      const data = {
        favorites: Array.from(this.favorites),
        filters: this.filters,
        sort: this.sort,
        pagination: this.pagination
      };
      localStorage.setItem('AETH_MARKETPLACE_STATE', JSON.stringify(data));
    } catch (error) {
      console.warn('No se pudo guardar estado del marketplace:', error);
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('AETH_MARKETPLACE_STATE');
      if (stored) {
        const data = JSON.parse(stored);
        this.favorites = new Set(data.favorites || []);
        this.filters = data.filters || {};
        this.sort = data.sort || { field: 'createdAt', order: 'desc' };
        this.pagination = data.pagination || { page: 1, pageSize: 12, total: 0 };
      }
    } catch (error) {
      console.warn('No se pudo cargar estado del marketplace:', error);
    }
  }

  // Sistema de suscripción
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Getters
  getFavorites(): Set<string> {
    return new Set(this.favorites);
  }

  getFilters(): MarketplaceFilters {
    return { ...this.filters };
  }

  getSort(): SortConfig {
    return { ...this.sort };
  }

  getPagination(): PaginationConfig {
    return { ...this.pagination };
  }

  // Favoritos
  toggleFavorite(id: string): boolean {
    const isFavorite = this.favorites.has(id);
    if (isFavorite) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
    this.saveToStorage();
    this.notify();
    return !isFavorite;
  }

  isFavorite(id: string): boolean {
    return this.favorites.has(id);
  }

  clearFavorites(): void {
    this.favorites.clear();
    this.saveToStorage();
    this.notify();
  }

  // Filtros
  setFilters(filters: Partial<MarketplaceFilters>): void {
    this.filters = { ...this.filters, ...filters };
    this.pagination.page = 1; // Reset a primera página
    this.saveToStorage();
    this.notify();
  }

  clearFilters(): void {
    this.filters = {};
    this.pagination.page = 1;
    this.saveToStorage();
    this.notify();
  }

  // Ordenamiento
  setSort(sort: SortConfig): void {
    this.sort = sort;
    this.saveToStorage();
    this.notify();
  }

  // Paginación
  setPage(page: number): void {
    this.pagination.page = Math.max(1, page);
    this.saveToStorage();
    this.notify();
  }

  setPageSize(pageSize: number): void {
    this.pagination.pageSize = pageSize;
    this.pagination.page = 1; // Reset a primera página
    this.saveToStorage();
    this.notify();
  }

  setTotal(total: number): void {
    this.pagination.total = total;
    this.saveToStorage();
    this.notify();
  }

  // Utilidades para filtrado y ordenamiento
  applyFilters(listings: ListingItem[]): ListingItem[] {
    return listings.filter(item => {
      // Filtro de búsqueda por texto
      if (this.filters.q) {
        const searchText = `${item.name} ${String(item.tokenId)} ${item.class || ''}`.toLowerCase();
        if (!searchText.includes(this.filters.q.toLowerCase())) {
          return false;
        }
      }

      // Filtro de precio
      if (this.filters.min !== undefined && item.priceCore < this.filters.min) {
        return false;
      }
      if (this.filters.max !== undefined && item.priceCore > this.filters.max) {
        return false;
      }

      // Filtro de clase
      if (this.filters.class && item.class !== this.filters.class) {
        return false;
      }

      // Filtro de nivel
      if (this.filters.minLevel !== undefined && (item.level || 0) < this.filters.minLevel) {
        return false;
      }
      if (this.filters.maxLevel !== undefined && (item.level || 0) > this.filters.maxLevel) {
        return false;
      }

      // Filtro de poder
      if (this.filters.minPower !== undefined && (item.power || 0) < this.filters.minPower) {
        return false;
      }
      if (this.filters.maxPower !== undefined && (item.power || 0) > this.filters.maxPower) {
        return false;
      }

      // Filtro de favoritos
      if (this.filters.onlyFavorites && !this.favorites.has(item.id)) {
        return false;
      }

      // Filtro de propios
      if (this.filters.onlyOwn && !item.isOwn) {
        return false;
      }

      return true;
    });
  }

  applySort(listings: ListingItem[]): ListingItem[] {
    return [...listings].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sort.field) {
        case 'price':
          aValue = a.priceCore;
          bValue = b.priceCore;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'level':
          aValue = a.level || 0;
          bValue = b.level || 0;
          break;
        case 'power':
          aValue = a.power || 0;
          bValue = b.power || 0;
          break;
        case 'createdAt':
          aValue = a.createdAt || 0;
          bValue = b.createdAt || 0;
          break;
        default:
          return 0;
      }

      if (this.sort.order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }

  applyPagination(listings: ListingItem[]): ListingItem[] {
    const start = (this.pagination.page - 1) * this.pagination.pageSize;
    const end = start + this.pagination.pageSize;
    return listings.slice(start, end);
  }

  // Procesamiento completo de listings
  processListings(listings: ListingItem[]): { items: ListingItem[]; total: number } {
    // Aplicar favoritos
    const listingsWithFavorites = listings.map(item => ({
      ...item,
      favorite: this.favorites.has(item.id)
    }));

    // Aplicar filtros
    const filtered = this.applyFilters(listingsWithFavorites);

    // Actualizar total
    this.setTotal(filtered.length);

    // Aplicar ordenamiento
    const sorted = this.applySort(filtered);

    // Aplicar paginación
    const paginated = this.applyPagination(sorted);

    return { items: paginated, total: filtered.length };
  }
}

// Instancia singleton
export const marketplaceStore = new MarketplaceStore();
