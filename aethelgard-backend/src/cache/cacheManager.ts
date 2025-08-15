import { ethers } from 'ethers';

// Tipos de caché
export type CacheType = 'metadata' | 'listings' | 'heroes' | 'stats' | 'activity' | 'essence';

// Estrategias de caché
export type CacheStrategy = 'memory' | 'redis' | 'hybrid';

// Configuración de caché
export interface CacheConfig {
  type: CacheType;
  strategy: CacheStrategy;
  ttl: number; // TTL en milisegundos
  maxSize?: number; // Tamaño máximo para caché en memoria
  invalidateOnEvents?: string[]; // Eventos que invalidan este caché
}

// Item de caché
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
  metadata?: Record<string, any>;
}

// Eventos de invalidación
export interface CacheInvalidationEvent {
  type: string;
  data?: any;
  timestamp: number;
}

// Sistema de caché enterprise
export class CacheManager {
  private memoryCaches: Map<CacheType, Map<string, CacheItem>> = new Map();
  private configs: Map<CacheType, CacheConfig> = new Map();
  private invalidationListeners: Map<string, Set<(event: CacheInvalidationEvent) => void>> = new Map();
  private stats: Map<CacheType, { hits: number; misses: number; sets: number; invalidations: number }> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
    this.startCleanupInterval();
  }

  // Configuraciones por defecto
  private initializeDefaultConfigs() {
    const configs: CacheConfig[] = [
      {
        type: 'metadata',
        strategy: 'memory',
        ttl: 30 * 60 * 1000, // 30 minutos
        maxSize: 1000,
        invalidateOnEvents: ['hero-evolved', 'hero-transferred', 'hero-minted']
      },
      {
        type: 'listings',
        strategy: 'memory',
        ttl: 15 * 1000, // 15 segundos
        maxSize: 500,
        invalidateOnEvents: ['listing-created', 'listing-sold', 'listing-cancelled']
      },
      {
        type: 'heroes',
        strategy: 'memory',
        ttl: 5 * 60 * 1000, // 5 minutos
        maxSize: 200,
        invalidateOnEvents: ['hero-evolved', 'hero-transferred', 'hero-minted', 'hero-staked', 'hero-unstaked']
      },
      {
        type: 'stats',
        strategy: 'memory',
        ttl: 2 * 60 * 1000, // 2 minutos
        maxSize: 100,
        invalidateOnEvents: ['hero-evolved', 'hero-transferred', 'hero-minted', 'staking-changed']
      },
      {
        type: 'activity',
        strategy: 'memory',
        ttl: 1 * 60 * 1000, // 1 minuto
        maxSize: 300,
        invalidateOnEvents: ['activity-created']
      },
      {
        type: 'essence',
        strategy: 'memory',
        ttl: 30 * 1000, // 30 segundos
        maxSize: 50,
        invalidateOnEvents: ['essence-transferred', 'essence-minted', 'essence-burned']
      }
    ];

    configs.forEach(config => {
      this.configs.set(config.type, config);
      this.memoryCaches.set(config.type, new Map());
      this.stats.set(config.type, { hits: 0, misses: 0, sets: 0, invalidations: 0 });
    });
  }

  // Generar clave de caché
  private generateKey(type: CacheType, identifier: string): string {
    return `${type}:${identifier}`;
  }

  // Obtener item del caché
  async get<T>(type: CacheType, identifier: string): Promise<T | null> {
    const config = this.configs.get(type);
    if (!config) {
      console.warn(`Cache config not found for type: ${type}`);
      return null;
    }

    const cache = this.memoryCaches.get(type);
    if (!cache) {
      console.warn(`Cache not found for type: ${type}`);
      return null;
    }

    const key = this.generateKey(type, identifier);
    const item = cache.get(key);

    if (!item) {
      this.incrementStats(type, 'misses');
      return null;
    }

    // Verificar expiración
    if (Date.now() > item.expiresAt) {
      cache.delete(key);
      this.incrementStats(type, 'misses');
      return null;
    }

    this.incrementStats(type, 'hits');
    return item.data as T;
  }

  // Establecer item en caché
  async set<T>(type: CacheType, identifier: string, data: T, metadata?: Record<string, any>): Promise<void> {
    const config = this.configs.get(type);
    if (!config) {
      console.warn(`Cache config not found for type: ${type}`);
      return;
    }

    const cache = this.memoryCaches.get(type);
    if (!cache) {
      console.warn(`Cache not found for type: ${type}`);
      return;
    }

    const key = this.generateKey(type, identifier);
    const now = Date.now();

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + config.ttl,
      version: this.generateVersion(),
      metadata
    };

    // Verificar tamaño máximo
    if (config.maxSize && cache.size >= config.maxSize) {
      this.evictOldest(type);
    }

    cache.set(key, item);
    this.incrementStats(type, 'sets');
  }

  // Invalidar caché
  async invalidate(type: CacheType, identifier?: string): Promise<void> {
    const cache = this.memoryCaches.get(type);
    if (!cache) return;

    if (identifier) {
      // Invalidar item específico
      const key = this.generateKey(type, identifier);
      cache.delete(key);
    } else {
      // Invalidar todo el caché
      cache.clear();
    }

    this.incrementStats(type, 'invalidations');
  }

  // Invalidar por patrón
  async invalidatePattern(type: CacheType, pattern: string): Promise<void> {
    const cache = this.memoryCaches.get(type);
    if (!cache) return;

    const regex = new RegExp(pattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }

    this.incrementStats(type, 'invalidations');
  }

  // Invalidar por evento
  async invalidateByEvent(eventType: string, eventData?: any): Promise<void> {
    const event: CacheInvalidationEvent = {
      type: eventType,
      data: eventData,
      timestamp: Date.now()
    };

    // Notificar listeners
    const listeners = this.invalidationListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in cache invalidation listener:', error);
        }
      });
    }

    // Invalidar cachés basado en configuración
    for (const [type, config] of this.configs.entries()) {
      if (config.invalidateOnEvents?.includes(eventType)) {
        await this.invalidate(type);
      }
    }
  }

  // Limpiar cachés expirados
  private cleanupExpired(): void {
    const now = Date.now();

    for (const [type, cache] of this.memoryCaches.entries()) {
      for (const [key, item] of cache.entries()) {
        if (now > item.expiresAt) {
          cache.delete(key);
        }
      }
    }
  }

  // Evadir items más antiguos
  private evictOldest(type: CacheType): void {
    const cache = this.memoryCaches.get(type);
    if (!cache) return;

    const config = this.configs.get(type);
    if (!config?.maxSize) return;

    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toEvict = entries.length - config.maxSize;
    for (let i = 0; i < toEvict; i++) {
      cache.delete(entries[i][0]);
    }
  }

  // Intervalo de limpieza
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000); // Limpiar cada minuto
  }

  // Generar versión
  private generateVersion(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  // Estadísticas
  private incrementStats(type: CacheType, stat: 'hits' | 'misses' | 'sets' | 'invalidations'): void {
    const stats = this.stats.get(type);
    if (stats) {
      stats[stat]++;
    }
  }

  // Obtener estadísticas
  getStats(): Record<CacheType, { hits: number; misses: number; sets: number; invalidations: number; hitRate: number }> {
    const result: any = {};

    for (const [type, stats] of this.stats.entries()) {
      const total = stats.hits + stats.misses;
      result[type] = {
        ...stats,
        hitRate: total > 0 ? (stats.hits / total) * 100 : 0
      };
    }

    return result;
  }

  // Obtener información del caché
  getCacheInfo(): Record<CacheType, { size: number; config: CacheConfig }> {
    const result: any = {};

    for (const [type, cache] of this.memoryCaches.entries()) {
      const config = this.configs.get(type);
      if (config) {
        result[type] = {
          size: cache.size,
          config
        };
      }
    }

    return result;
  }

  // Limpiar todos los cachés
  async clearAll(): Promise<void> {
    for (const cache of this.memoryCaches.values()) {
      cache.clear();
    }

    // Resetear estadísticas
    for (const stats of this.stats.values()) {
      stats.hits = 0;
      stats.misses = 0;
      stats.sets = 0;
      stats.invalidations = 0;
    }
  }

  // Suscribirse a eventos de invalidación
  onInvalidation(eventType: string, listener: (event: CacheInvalidationEvent) => void): () => void {
    if (!this.invalidationListeners.has(eventType)) {
      this.invalidationListeners.set(eventType, new Set());
    }

    const listeners = this.invalidationListeners.get(eventType)!;
    listeners.add(listener);

    // Retornar función para desuscribirse
    return () => {
      listeners.delete(listener);
    };
  }

  // Precalentar caché
  async prewarm(type: CacheType, identifiers: string[], fetcher: (id: string) => Promise<any>): Promise<void> {
    const promises = identifiers.map(async (id) => {
      try {
        const data = await fetcher(id);
        await this.set(type, id, data);
      } catch (error) {
        console.error(`Error prewarming cache for ${type}:${id}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }
}

// Instancia singleton
export const cacheManager = new CacheManager();

// Helpers para tipos específicos
export class HeroCache {
  static async getMetadata(tokenId: string): Promise<any> {
    return cacheManager.get('metadata', tokenId);
  }

  static async setMetadata(tokenId: string, metadata: any): Promise<void> {
    return cacheManager.set('metadata', tokenId, metadata);
  }

  static async invalidateMetadata(tokenId: string): Promise<void> {
    return cacheManager.invalidate('metadata', tokenId);
  }

  static async getHero(tokenId: string): Promise<any> {
    return cacheManager.get('heroes', tokenId);
  }

  static async setHero(tokenId: string, hero: any): Promise<void> {
    return cacheManager.set('heroes', tokenId, hero);
  }

  static async invalidateHero(tokenId: string): Promise<void> {
    return cacheManager.invalidate('heroes', tokenId);
  }
}

export class MarketplaceCache {
  static async getListings(): Promise<any[]> {
    return cacheManager.get('listings', 'all') || [];
  }

  static async setListings(listings: any[]): Promise<void> {
    return cacheManager.set('listings', 'all', listings);
  }

  static async invalidateListings(): Promise<void> {
    return cacheManager.invalidate('listings');
  }

  static async getListing(id: string): Promise<any> {
    return cacheManager.get('listings', id);
  }

  static async setListing(id: string, listing: any): Promise<void> {
    return cacheManager.set('listings', id, listing);
  }
}

export class StatsCache {
  static async getUserStats(address: string): Promise<any> {
    return cacheManager.get('stats', address);
  }

  static async setUserStats(address: string, stats: any): Promise<void> {
    return cacheManager.set('stats', address, stats);
  }

  static async invalidateUserStats(address: string): Promise<void> {
    return cacheManager.invalidate('stats', address);
  }
}

export class EssenceCache {
  static async getBalance(address: string): Promise<any> {
    return cacheManager.get('essence', address);
  }

  static async setBalance(address: string, balance: any): Promise<void> {
    return cacheManager.set('essence', address, balance);
  }

  static async invalidateBalance(address: string): Promise<void> {
    return cacheManager.invalidate('essence', address);
  }
}
