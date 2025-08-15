import React from 'react';
import Card from './Card';
import Button from './Button';
import { frontendCacheManager } from '../../lib/cache';
import { useToast } from '../../lib/notifications';

export default function CacheManager() {
  const [stats, setStats] = React.useState<any>(null);
  const [info, setInfo] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { show } = useToast();

  // Actualizar estadísticas
  const updateStats = React.useCallback(() => {
    setStats(frontendCacheManager.getStats());
    setInfo(frontendCacheManager.getCacheInfo());
  }, []);

  React.useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, [updateStats]);

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      await frontendCacheManager.clearAll();
      updateStats();
      show('Caché limpiado exitosamente', 'success');
    } catch (error) {
      show('Error limpiando caché', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearType = async (type: string) => {
    setIsLoading(true);
    try {
      await frontendCacheManager.invalidate(type as any);
      updateStats();
      show(`Caché ${type} limpiado exitosamente`, 'success');
    } catch (error) {
      show(`Error limpiando caché ${type}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!stats || !info) {
    return (
      <Card>
        <div className="text-center py-4">
          <div className="text-text-secondary">Cargando estadísticas del caché...</div>
        </div>
      </Card>
    );
  }

  const totalHits = Object.values(stats).reduce((sum: number, stat: any) => sum + stat.hits, 0);
  const totalMisses = Object.values(stats).reduce((sum: number, stat: any) => sum + stat.misses, 0);
  const totalHitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="heading text-lg">Gestión de Caché</h3>
            <p className="text-text-secondary text-sm">
              Hit rate global: {totalHitRate.toFixed(1)}%
            </p>
          </div>
          <Button
            onClick={handleClearAll}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
          >
            {isLoading ? 'Limpiando...' : 'Limpiar Todo'}
          </Button>
        </div>

        {/* Estadísticas globales */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{totalHits}</div>
            <div className="text-xs text-text-secondary">Hits</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-400">{totalMisses}</div>
            <div className="text-xs text-text-secondary">Misses</div>
          </div>
          <div className="bg-surface/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-primary">{totalHitRate.toFixed(1)}%</div>
            <div className="text-xs text-text-secondary">Hit Rate</div>
          </div>
        </div>

        {/* Detalles por tipo */}
        <div className="space-y-3">
          <h4 className="heading text-sm">Detalles por Tipo</h4>
          {Object.entries(stats).map(([type, stat]: [string, any]) => (
            <div key={type} className="bg-surface/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{type}</span>
                  <span className="text-xs text-text-secondary">
                    {info[type]?.size || 0} items
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    stat.hitRate >= 80 ? 'bg-green-500/20 text-green-400' :
                    stat.hitRate >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {stat.hitRate.toFixed(1)}%
                  </span>
                  <Button
                    onClick={() => handleClearType(type)}
                    disabled={isLoading}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-text-secondary">Hits:</span>
                  <span className="ml-1 font-medium text-green-400">{stat.hits}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Misses:</span>
                  <span className="ml-1 font-medium text-red-400">{stat.misses}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Sets:</span>
                  <span className="ml-1 font-medium text-blue-400">{stat.sets}</span>
                </div>
                <div>
                  <span className="text-text-secondary">Invalidations:</span>
                  <span className="ml-1 font-medium text-orange-400">{stat.invalidations}</span>
                </div>
              </div>

              {/* Configuración */}
              <div className="mt-2 text-xs text-text-secondary">
                TTL: {Math.round(info[type]?.config.ttl / 1000)}s | 
                Strategy: {info[type]?.config.strategy} | 
                Max Size: {info[type]?.config.maxSize || '∞'}
              </div>
            </div>
          ))}
        </div>

        {/* Información adicional */}
        <div className="text-xs text-text-secondary space-y-1">
          <p>• El caché se limpia automáticamente cada minuto</p>
          <p>• Los items expirados se eliminan automáticamente</p>
          <p>• El caché usa memoria y localStorage según la estrategia</p>
        </div>
      </div>
    </Card>
  );
}
