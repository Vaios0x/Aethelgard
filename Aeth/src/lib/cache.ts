// Sistema de caché para el frontend de Aethelgard

// Tipos de caché
export type CacheType = 'metadata' | 'listings' | 'heroes' | 'stats' | 'activity' | 'essence';

// Item de caché
export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
  metadata?: Record<string, any>;
}

// Configuración de caché
export interface CacheConfig {
  type: CacheType;
  ttl: number; // TTL en milisegundos
  maxSize?: number; // Tamaño máximo
  strategy: 'memory' | 'localStorage' | 'hybrid';
}

// Sistema de caché del frontend
export class FrontendCacheManager {
  private memoryCaches: Map<CacheType, Map<string, CacheItem>> = new Map();
  private configs: Map<CacheType, CacheConfig> = new Map();
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
        strategy: 'hybrid',
        ttl: 30 * 60 * 1000, // 30 minutos
        maxSize: 100
      },
      {
        type: 'listings',
        strategy: 'memory',
        ttl: 15 * 1000, // 15 segundos
        maxSize: 50
      },
      {
        type: 'heroes',
        strategy: 'hybrid',
        ttl: 5 * 60 * 1000, // 5 minutos
        maxSize: 20
      },
      {
        type: 'stats',
        strategy: 'memory',
        ttl: 2 * 60 * 1000, // 2 minutos
        maxSize: 10
      },
      {
        type: 'activity',
        strategy: 'localStorage',
        ttl: 1 * 60 * 1000, // 1 minuto
        maxSize: 30
      },
      {
        type: 'essence',
        strategy: 'memory',
        ttl: 30 * 1000, // 30 segundos
        maxSize: 5
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

    const key = this.generateKey(type, identifier);
    let item: CacheItem<T> | null = null;

    // Intentar obtener de memoria primero
    if (config.strategy === 'memory' || config.strategy === 'hybrid') {
      const cache = this.memoryCaches.get(type);
      if (cache) {
        item = cache.get(key) || null;
      }
    }

    // Si no está en memoria y es localStorage o hybrid, intentar localStorage
    if (!item && (config.strategy === 'localStorage' || config.strategy === 'hybrid')) {
      try {
        const stored = localStorage.getItem(`AETH_CACHE_${key}`);
        if (stored) {
          item = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Error reading from localStorage:', error);
      }
    }

    if (!item) {
      this.incrementStats(type, 'misses');
      return null;
    }

    // Verificar expiración
    if (Date.now() > item.expiresAt) {
      await this.invalidate(type, identifier);
      this.incrementStats(type, 'misses');
      return null;
    }

    this.incrementStats(type, 'hits');
    return item.data;
  }

  // Establecer item en caché
  async set<T>(type: CacheType, identifier: string, data: T, metadata?: Record<string, any>): Promise<void> {
    const config = this.configs.get(type);
    if (!config) {
      console.warn(`Cache config not found for type: ${type}`);
      return;
    }

    const key = this.generateKey(type, identifier);
    const now = Date.now();

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + config.ttl,
      version: this.generateVersion(),
      ...(metadata && { metadata })
    };

    // Guardar en memoria
    if (config.strategy === 'memory' || config.strategy === 'hybrid') {
      const cache = this.memoryCaches.get(type);
      if (cache) {
        // Verificar tamaño máximo
        if (config.maxSize && cache.size >= config.maxSize) {
          this.evictOldest(type);
        }
        cache.set(key, item);
      }
    }

    // Guardar en localStorage
    if (config.strategy === 'localStorage' || config.strategy === 'hybrid') {
      try {
        localStorage.setItem(`AETH_CACHE_${key}`, JSON.stringify(item));
      } catch (error) {
        console.warn('Error writing to localStorage:', error);
      }
    }

    this.incrementStats(type, 'sets');
  }

  // Invalidar caché
  async invalidate(type: CacheType, identifier?: string): Promise<void> {
    const config = this.configs.get(type);
    if (!config) return;

    if (identifier) {
      // Invalidar item específico
      const key = this.generateKey(type, identifier);

      // Invalidar de memoria
      if (config.strategy === 'memory' || config.strategy === 'hybrid') {
        const cache = this.memoryCaches.get(type);
        if (cache) {
          cache.delete(key);
        }
      }

      // Invalidar de localStorage
      if (config.strategy === 'localStorage' || config.strategy === 'hybrid') {
        try {
          localStorage.removeItem(`AETH_CACHE_${key}`);
        } catch (error) {
          console.warn('Error removing from localStorage:', error);
        }
      }
    } else {
      // Invalidar todo el caché
      if (config.strategy === 'memory' || config.strategy === 'hybrid') {
        const cache = this.memoryCaches.get(type);
        if (cache) {
          cache.clear();
        }
      }

      if (config.strategy === 'localStorage' || config.strategy === 'hybrid') {
        try {
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith(`AETH_CACHE_${type}:`)) {
              localStorage.removeItem(key);
            }
          });
        } catch (error) {
          console.warn('Error clearing localStorage:', error);
        }
      }
    }

    this.incrementStats(type, 'invalidations');
  }

  // Invalidar por patrón
  async invalidatePattern(type: CacheType, pattern: string): Promise<void> {
    const config = this.configs.get(type);
    if (!config) return;

    const regex = new RegExp(pattern);

    // Invalidar de memoria
    if (config.strategy === 'memory' || config.strategy === 'hybrid') {
      const cache = this.memoryCaches.get(type);
      if (cache) {
        for (const key of cache.keys()) {
          if (regex.test(key)) {
            cache.delete(key);
          }
        }
      }
    }

    // Invalidar de localStorage
    if (config.strategy === 'localStorage' || config.strategy === 'hybrid') {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(`AETH_CACHE_${type}:`) && regex.test(key)) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('Error invalidating pattern from localStorage:', error);
      }
    }

    this.incrementStats(type, 'invalidations');
  }

  // Limpiar cachés expirados
  private cleanupExpired(): void {
    const now = Date.now();

    // Limpiar memoria
    for (const [type, cache] of this.memoryCaches.entries()) {
      for (const [key, item] of cache.entries()) {
        if (now > item.expiresAt) {
          cache.delete(key);
        }
      }
    }

    // Limpiar localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('AETH_CACHE_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '{}');
            if (now > item.expiresAt) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Si no se puede parsear, eliminar
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Error cleaning up localStorage:', error);
    }
  }

  // Evadir items más antiguos
  private evictOldest(type: CacheType): void {
    const config = this.configs.get(type);
    if (!config?.maxSize) return;

    const cache = this.memoryCaches.get(type);
    if (!cache) return;

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
    // Limpiar memoria
    for (const cache of this.memoryCaches.values()) {
      cache.clear();
    }

    // Limpiar localStorage
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('AETH_CACHE_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }

    // Resetear estadísticas
    for (const stats of this.stats.values()) {
      stats.hits = 0;
      stats.misses = 0;
      stats.sets = 0;
      stats.invalidations = 0;
    }
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
export const frontendCacheManager = new FrontendCacheManager();

// Helpers para tipos específicos
export class FrontendHeroCache {
  static async getMetadata(tokenId: string): Promise<any> {
    return frontendCacheManager.get('metadata', tokenId);
  }

  static async setMetadata(tokenId: string, metadata: any): Promise<void> {
    return frontendCacheManager.set('metadata', tokenId, metadata);
  }

  static async invalidateMetadata(tokenId: string): Promise<void> {
    return frontendCacheManager.invalidate('metadata', tokenId);
  }

  static async getHero(tokenId: string): Promise<any> {
    return frontendCacheManager.get('heroes', tokenId);
  }

  static async setHero(tokenId: string, hero: any): Promise<void> {
    return frontendCacheManager.set('heroes', tokenId, hero);
  }

  static async invalidateHero(tokenId: string): Promise<void> {
    return frontendCacheManager.invalidate('heroes', tokenId);
  }
}

export class FrontendMarketplaceCache {
  static async getListings(): Promise<any[]> {
    const cached = await frontendCacheManager.get<any[]>('listings', 'all');
    return cached || [];
  }

  static async setListings(listings: any[]): Promise<void> {
    return frontendCacheManager.set('listings', 'all', listings);
  }

  static async invalidateListings(): Promise<void> {
    return frontendCacheManager.invalidate('listings');
  }
}

export class FrontendStatsCache {
  static async getUserStats(address: string): Promise<any> {
    return frontendCacheManager.get('stats', address);
  }

  static async setUserStats(address: string, stats: any): Promise<void> {
    return frontendCacheManager.set('stats', address, stats);
  }

  static async invalidateUserStats(address: string): Promise<void> {
    return frontendCacheManager.invalidate('stats', address);
  }
}

export class FrontendEssenceCache {
  static async getBalance(address: string): Promise<any> {
    return frontendCacheManager.get('essence', address);
  }

  static async setBalance(address: string, balance: any): Promise<void> {
    return frontendCacheManager.set('essence', address, balance);
  }

  static async invalidateBalance(address: string): Promise<void> {
    return frontendCacheManager.invalidate('essence', address);
  }
}
