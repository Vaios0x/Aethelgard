// @ts-nocheck
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useActivity, useBackendActivity } from '../../hooks/useActivity';
import { usePWA } from '../../lib/pwa';
import type { ActivityType } from '../../types/activity';

const ACTIVITY_TYPES: { label: string; value: ActivityType; icon: string }[] = [
  { label: 'Todos', value: 'system', icon: '📊' },
  { label: 'Stake', value: 'stake', icon: '🔒' },
  { label: 'Unstake', value: 'unstake', icon: '🔓' },
  { label: 'Claim', value: 'claim', icon: '💰' },
  { label: 'Evolución', value: 'evolution', icon: '✨' },
  { label: 'Compra', value: 'buy', icon: '🛒' },
  { label: 'Listado', value: 'list', icon: '📋' },
  { label: 'Retiro', value: 'unlist', icon: '❌' },
  { label: 'Transfer', value: 'transfer', icon: '🔄' },
  { label: 'Mint', value: 'mint', icon: '🎨' },
  { label: 'Error', value: 'error', icon: '⚠️' },
];

export default function ActivityList() {
  const { items: localItems, clearActivity, exportActivity } = useActivity();
  const { notificationPermission, requestNotificationPermission, isSupported } = usePWA();
  
  const [type, setType] = React.useState<ActivityType>('system');
  const [from, setFrom] = React.useState<string>('');
  const [to, setTo] = React.useState<string>('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [showStats, setShowStats] = React.useState(false);
  const [useBackend, setUseBackend] = React.useState(true);
  const [page, setPage] = React.useState(1);

  // Obtener actividad del backend
  const { 
    activities: backendActivities, 
    pagination, 
    stats: backendStats, 
    isLoading: backendLoading,
    error: backendError 
  } = useBackendActivity({
    page,
    limit: 50,
    type: type === 'system' ? undefined : type,
    from,
    to
  });

  // Combinar actividades locales y del backend
  const allItems = React.useMemo(() => {
    if (useBackend && backendActivities) {
      return backendActivities;
    }
    return localItems;
  }, [useBackend, backendActivities, localItems]);

  // Filtrar actividades locales
  const filteredLocal = React.useMemo(() => {
    let result = localItems;
    
    if (type !== 'system') {
      result = result.filter(item => item.type === type);
    }
    
    if (from) {
      const fromTime = new Date(from).getTime();
      result = result.filter(item => item.timestamp >= fromTime);
    }
    
    if (to) {
      const toTime = new Date(to).getTime();
      result = result.filter(item => item.timestamp <= toTime);
    }
    
    return result;
  }, [localItems, type, from, to]);

  // Usar estadísticas del backend o calcular locales
  const stats = React.useMemo(() => {
    if (useBackend && backendStats) {
      return backendStats;
    }

    const byType: Record<ActivityType, number> = {} as any;
    const byStatus: Record<string, number> = {};
    
    filteredLocal.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      const status = item.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    
    return {
      total: filteredLocal.length,
      byType,
      byStatus,
      recentActivity: filteredLocal.slice(0, 5)
    };
  }, [useBackend, backendStats, filteredLocal]);

  const handleExport = () => {
    const dataStr = exportActivity();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aethelgard-activity-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearActivity = () => {
    if (window.confirm('¿Estás seguro de que quieres limpiar todo el historial de actividad? Esta acción no se puede deshacer.')) {
      clearActivity();
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    const activityType = ACTIVITY_TYPES.find(t => t.value === type);
    return activityType?.icon || '📝';
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-text-secondary';
    }
  };

  const isLoading = useBackend ? backendLoading : false;
  const error = useBackend ? backendError : null;

  return (
    <Card>
      <div className="space-y-4">
        {/* Header con controles */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="heading text-lg sm:text-xl">Actividad Reciente</h2>
            <p className="text-text-secondary text-xs sm:text-sm">
              {allItems.length} actividades
              {pagination && ` • Página ${pagination.page} de ${pagination.pages}`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle backend/local */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseBackend(!useBackend)}
              className={`text-xs ${useBackend ? 'text-primary' : 'text-text-secondary'}`}
            >
              {useBackend ? '🌐 Backend' : '💾 Local'}
            </Button>

            {/* Botón de notificaciones */}
            {isSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={requestNotificationPermission}
                className={`text-xs ${notificationPermission === 'granted' ? 'text-green-400' : 'text-text-secondary'}`}
                title={notificationPermission === 'granted' ? 'Notificaciones habilitadas' : 'Habilitar notificaciones'}
              >
                {notificationPermission === 'granted' ? '🔔' : '🔕'}
              </Button>
            )}
            
            {/* Botones de control */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs"
            >
              {showFilters ? 'Ocultar filtros' : 'Filtros'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="text-xs"
            >
              {showStats ? 'Ocultar stats' : 'Estadísticas'}
            </Button>
            
            {!useBackend && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="text-xs"
                disabled={localItems.length === 0}
              >
                Exportar
              </Button>
            )}
            
            {!useBackend && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearActivity}
                className="text-xs text-red-400"
                disabled={localItems.length === 0}
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Error del backend */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">
              Error del backend: {error}. Cambiando a historial local...
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUseBackend(false)}
              className="text-xs mt-2"
            >
              Usar historial local
            </Button>
          </div>
        )}

        {/* Estadísticas */}
        {showStats && (
          <div className="bg-surface/50 rounded-lg p-4 space-y-3">
            <h3 className="heading text-sm">Estadísticas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <div className="text-text-secondary">Total</div>
                <div className="font-semibold">{stats.total}</div>
              </div>
              <div>
                <div className="text-text-secondary">Exitosas</div>
                <div className="font-semibold text-green-400">{stats.byStatus.success || 0}</div>
              </div>
              <div>
                <div className="text-text-secondary">Fallidas</div>
                <div className="font-semibold text-red-400">{stats.byStatus.failed || 0}</div>
              </div>
              <div>
                <div className="text-text-secondary">Pendientes</div>
                <div className="font-semibold text-yellow-400">{stats.byStatus.pending || 0}</div>
              </div>
            </div>
            
            {/* Actividad por tipo */}
            <div className="space-y-2">
              <div className="text-text-secondary text-xs">Por tipo:</div>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_TYPES.slice(1).map(({ value, icon, label }) => (
                  <div key={value} className="flex items-center gap-1 text-xs">
                    <span>{icon}</span>
                    <span>{label}:</span>
                    <span className="font-semibold">{stats.byType[value] || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        {showFilters && (
          <div className="bg-surface/50 rounded-lg p-4 space-y-3">
            <h3 className="heading text-sm">Filtros</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ActivityType)}
                  className="w-full bg-background border border-white/10 rounded px-2 py-1 text-xs"
                >
                  {ACTIVITY_TYPES.map(({ value, label, icon }) => (
                    <option key={value} value={value}>
                      {icon} {label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-text-secondary mb-1">Desde</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded px-2 py-1 text-xs"
                />
              </div>
              
              <div>
                <label className="block text-xs text-text-secondary mb-1">Hasta</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full bg-background border border-white/10 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Paginación del backend */}
        {useBackend && pagination && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-secondary">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="text-xs"
              >
                Anterior
              </Button>
              <span className="text-xs text-text-secondary px-2 py-1">
                {pagination.page} / {pagination.pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="text-xs"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Lista de actividades */}
        <div className="divide-y divide-white/5">
          {isLoading ? (
            <div className="text-text-secondary text-xs sm:text-sm py-4 sm:py-6 text-center">
              Cargando actividades...
            </div>
          ) : allItems.length === 0 ? (
            <div className="text-text-secondary text-xs sm:text-sm py-4 sm:py-6 text-center">
              {useBackend ? 'Sin actividad en el backend.' : 'Sin actividad local.'}
            </div>
          ) : (
            allItems.map((item) => (
              <div key={item.id} className="py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getActivityIcon(item.type)}</span>
                    <div className="heading text-xs sm:text-sm">{item.summary}</div>
                    {item.status && (
                      <span className={`text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    )}
                  </div>
                  
                  {item.details && (
                    <div className="text-xs text-text-secondary break-words mt-1">
                      {item.details}
                    </div>
                  )}
                  
                  {item.txHash && (
                    <a
                      className="text-xs text-primary underline mt-1 inline-block"
                      href={`https://scan.test2.btcs.network/tx/${item.txHash}`}
                      target="_blank" 
                      rel="noreferrer"
                    >
                      Ver en CoreScan
                    </a>
                  )}
                </div>
                
                <div className="text-xs text-text-secondary whitespace-nowrap">
                  {new Date(item.timestamp).toLocaleString('es-MX')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}




