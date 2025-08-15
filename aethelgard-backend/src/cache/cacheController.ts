import { Request, Response } from 'express';
import { cacheManager } from './cacheManager';
import { BlockchainEventCache } from './blockchainEventCache';

// Controlador para gestión de caché
export class CacheController {
  private blockchainEventCache: BlockchainEventCache;

  constructor(blockchainEventCache: BlockchainEventCache) {
    this.blockchainEventCache = blockchainEventCache;
  }

  // GET /cache/stats - Obtener estadísticas del caché
  async getCacheStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = cacheManager.getStats();
      const info = cacheManager.getCacheInfo();
      const eventStats = this.blockchainEventCache.getEventStats();

      res.json({
        cache: {
          stats,
          info
        },
        events: {
          stats: eventStats,
          isProcessing: this.blockchainEventCache.isEventProcessing(),
          lastProcessedBlock: this.blockchainEventCache.getLastProcessedBlock()
        }
      });
    } catch (error) {
      console.error('Error getting cache stats:', error);
      res.status(500).json({ error: 'Error obteniendo estadísticas del caché' });
    }
  }

  // POST /cache/clear - Limpiar todo el caché
  async clearAllCache(req: Request, res: Response): Promise<void> {
    try {
      await cacheManager.clearAll();
      res.json({ 
        message: 'Caché limpiado exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Error limpiando caché' });
    }
  }

  // POST /cache/clear/:type - Limpiar caché específico
  async clearCacheType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const validTypes = ['metadata', 'listings', 'heroes', 'stats', 'activity', 'essence'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          error: 'Tipo de caché inválido',
          validTypes 
        });
      }

      await cacheManager.invalidate(type as any);
      
      res.json({ 
        message: `Caché ${type} limpiado exitosamente`,
        type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error clearing cache type:', error);
      res.status(500).json({ error: 'Error limpiando tipo de caché' });
    }
  }

  // POST /cache/invalidate/:type/:id - Invalidar item específico
  async invalidateCacheItem(req: Request, res: Response): Promise<void> {
    try {
      const { type, id } = req.params;
      const validTypes = ['metadata', 'listings', 'heroes', 'stats', 'activity', 'essence'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          error: 'Tipo de caché inválido',
          validTypes 
        });
      }

      await cacheManager.invalidate(type as any, id);
      
      res.json({ 
        message: `Item ${id} del caché ${type} invalidado exitosamente`,
        type,
        id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error invalidating cache item:', error);
      res.status(500).json({ error: 'Error invalidando item del caché' });
    }
  }

  // POST /cache/invalidate/pattern/:type - Invalidar por patrón
  async invalidateCachePattern(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const { pattern } = req.body;
      const validTypes = ['metadata', 'listings', 'heroes', 'stats', 'activity', 'essence'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          error: 'Tipo de caché inválido',
          validTypes 
        });
      }

      if (!pattern) {
        return res.status(400).json({ 
          error: 'Patrón requerido en el body' 
        });
      }

      await cacheManager.invalidatePattern(type as any, pattern);
      
      res.json({ 
        message: `Caché ${type} invalidado por patrón ${pattern}`,
        type,
        pattern,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error invalidating cache pattern:', error);
      res.status(500).json({ error: 'Error invalidando caché por patrón' });
    }
  }

  // POST /cache/events/start - Iniciar procesamiento de eventos
  async startEventProcessing(req: Request, res: Response): Promise<void> {
    try {
      const { fromBlock } = req.body;
      
      if (this.blockchainEventCache.isEventProcessing()) {
        return res.status(400).json({ 
          error: 'El procesamiento de eventos ya está activo' 
        });
      }

      await this.blockchainEventCache.startProcessing(fromBlock);
      
      res.json({ 
        message: 'Procesamiento de eventos iniciado exitosamente',
        fromBlock: fromBlock || 'último bloque procesado',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error starting event processing:', error);
      res.status(500).json({ error: 'Error iniciando procesamiento de eventos' });
    }
  }

  // POST /cache/events/stop - Detener procesamiento de eventos
  async stopEventProcessing(req: Request, res: Response): Promise<void> {
    try {
      this.blockchainEventCache.stopProcessing();
      
      res.json({ 
        message: 'Procesamiento de eventos detenido exitosamente',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error stopping event processing:', error);
      res.status(500).json({ error: 'Error deteniendo procesamiento de eventos' });
    }
  }

  // POST /cache/events/process - Procesar eventos manualmente
  async processEventsManually(req: Request, res: Response): Promise<void> {
    try {
      const { fromBlock, toBlock } = req.body;
      
      if (!fromBlock || !toBlock) {
        return res.status(400).json({ 
          error: 'fromBlock y toBlock son requeridos' 
        });
      }

      if (fromBlock > toBlock) {
        return res.status(400).json({ 
          error: 'fromBlock debe ser menor o igual a toBlock' 
        });
      }

      await this.blockchainEventCache.processEventsManually(fromBlock, toBlock);
      
      res.json({ 
        message: 'Eventos procesados manualmente exitosamente',
        fromBlock,
        toBlock,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing events manually:', error);
      res.status(500).json({ error: 'Error procesando eventos manualmente' });
    }
  }

  // POST /cache/prewarm - Precalentar caché
  async prewarmCache(req: Request, res: Response): Promise<void> {
    try {
      const { type, identifiers, fetcher } = req.body;
      const validTypes = ['metadata', 'listings', 'heroes', 'stats', 'activity', 'essence'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          error: 'Tipo de caché inválido',
          validTypes 
        });
      }

      if (!identifiers || !Array.isArray(identifiers)) {
        return res.status(400).json({ 
          error: 'identifiers debe ser un array' 
        });
      }

      if (!fetcher || typeof fetcher !== 'function') {
        return res.status(400).json({ 
          error: 'fetcher debe ser una función' 
        });
      }

      await cacheManager.prewarm(type as any, identifiers, fetcher);
      
      res.json({ 
        message: `Caché ${type} precalentado exitosamente`,
        type,
        identifiersCount: identifiers.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error prewarming cache:', error);
      res.status(500).json({ error: 'Error precalentando caché' });
    }
  }

  // GET /cache/health - Health check del caché
  async getCacheHealth(req: Request, res: Response): Promise<void> {
    try {
      const stats = cacheManager.getStats();
      const info = cacheManager.getCacheInfo();
      const eventStats = this.blockchainEventCache.getEventStats();

      // Calcular health score
      let healthScore = 100;
      let issues: string[] = [];

      // Verificar hit rates
      for (const [type, stat] of Object.entries(stats)) {
        if (stat.hitRate < 50) {
          healthScore -= 10;
          issues.push(`Hit rate bajo para ${type}: ${stat.hitRate.toFixed(1)}%`);
        }
      }

      // Verificar procesamiento de eventos
      if (!this.blockchainEventCache.isEventProcessing()) {
        healthScore -= 20;
        issues.push('Procesamiento de eventos no está activo');
      }

      const health = {
        status: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'unhealthy',
        score: healthScore,
        issues,
        stats: {
          cache: {
            totalHits: Object.values(stats).reduce((sum, stat) => sum + stat.hits, 0),
            totalMisses: Object.values(stats).reduce((sum, stat) => sum + stat.misses, 0),
            averageHitRate: Object.values(stats).reduce((sum, stat) => sum + stat.hitRate, 0) / Object.keys(stats).length
          },
          events: {
            isProcessing: this.blockchainEventCache.isEventProcessing(),
            lastProcessedBlock: this.blockchainEventCache.getLastProcessedBlock()
          }
        },
        timestamp: new Date().toISOString()
      };

      res.json(health);
    } catch (error) {
      console.error('Error getting cache health:', error);
      res.status(500).json({ 
        status: 'unhealthy',
        score: 0,
        issues: ['Error obteniendo health del caché'],
        error: 'Error obteniendo health del caché'
      });
    }
  }
}
