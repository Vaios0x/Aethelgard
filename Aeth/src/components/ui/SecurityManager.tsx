import React from 'react';
import Card from './Card';
import Button from './Button';
import { useToast } from '../../lib/notifications';

interface BlacklistEntry {
  type: 'address' | 'ip' | 'pattern';
  value: string;
  reason: string;
  addedBy: string;
  addedAt: string;
  expiresAt?: string;
}

interface AuditLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  userId?: string;
  ip: string;
  userAgent: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  metadata?: Record<string, any>;
}

interface SecurityStats {
  totalLogs: number;
  logsLast24h: number;
  blacklistEntries: number;
  rateLimiters: string[];
  errorsLast24h: number;
  warningsLast24h: number;
}

export default function SecurityManager() {
  const [blacklist, setBlacklist] = React.useState<BlacklistEntry[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [stats, setStats] = React.useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'blacklist' | 'audit' | 'stats'>('stats');
  const { show } = useToast();

  // Formulario para agregar a blacklist
  const [newEntry, setNewEntry] = React.useState({
    type: 'address' as const,
    value: '',
    reason: '',
    expiresAt: ''
  });

  // Filtros para auditoría
  const [auditFilters, setAuditFilters] = React.useState({
    level: '',
    userId: '',
    ip: '',
    path: ''
  });

  const fetchBlacklist = React.useCallback(async () => {
    try {
      const response = await fetch('/api/security/blacklist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBlacklist(data.data.entries);
      }
    } catch (error) {
      show('Error al cargar blacklist', 'error');
    }
  }, [show]);

  const fetchAuditLogs = React.useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (auditFilters.level) params.append('level', auditFilters.level);
      if (auditFilters.userId) params.append('userId', auditFilters.userId);
      if (auditFilters.ip) params.append('ip', auditFilters.ip);
      if (auditFilters.path) params.append('path', auditFilters.path);

      const response = await fetch(`/api/security/audit/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.data.logs);
      }
    } catch (error) {
      show('Error al cargar logs de auditoría', 'error');
    }
  }, [auditFilters, show]);

  const fetchStats = React.useCallback(async () => {
    try {
      const response = await fetch('/api/security/audit/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      show('Error al cargar estadísticas', 'error');
    }
  }, [show]);

  const addToBlacklist = async () => {
    if (!newEntry.value || !newEntry.reason) {
      show('Todos los campos son requeridos', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/security/blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ...newEntry,
          expiresAt: newEntry.expiresAt || undefined
        })
      });

      if (response.ok) {
        show('Entrada agregada a blacklist', 'success');
        setNewEntry({ type: 'address', value: '', reason: '', expiresAt: '' });
        fetchBlacklist();
      } else {
        const error = await response.json();
        show(error.error || 'Error al agregar a blacklist', 'error');
      }
    } catch (error) {
      show('Error al agregar a blacklist', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromBlacklist = async (type: string, value: string) => {
    if (!confirm(`¿Estás seguro de que quieres remover ${type}:${value} de la blacklist?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/security/blacklist/${type}/${encodeURIComponent(value)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        show('Entrada removida de blacklist', 'success');
        fetchBlacklist();
      } else {
        const error = await response.json();
        show(error.error || 'Error al remover de blacklist', 'error');
      }
    } catch (error) {
      show('Error al remover de blacklist', 'error');
    }
  };

  const exportAuditLogs = async () => {
    try {
      const response = await fetch('/api/security/audit/export?format=csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        show('Logs exportados exitosamente', 'success');
      }
    } catch (error) {
      show('Error al exportar logs', 'error');
    }
  };

  const cleanupExpired = async () => {
    try {
      const response = await fetch('/api/security/cleanup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        show('Limpieza completada', 'success');
        fetchBlacklist();
        fetchStats();
      }
    } catch (error) {
      show('Error durante la limpieza', 'error');
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  React.useEffect(() => {
    if (activeTab === 'blacklist') {
      fetchBlacklist();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchBlacklist, fetchAuditLogs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-green-400';
      default: return 'text-text-secondary';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'address': return 'bg-blue-500/20 text-blue-300';
      case 'ip': return 'bg-red-500/20 text-red-300';
      case 'pattern': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="heading text-lg sm:text-xl">Gestión de Seguridad</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={cleanupExpired}
              className="text-xs"
            >
              Limpiar expirados
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportAuditLogs}
              className="text-xs"
            >
              Exportar logs
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-2 text-sm ${activeTab === 'stats' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
          >
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('blacklist')}
            className={`px-3 py-2 text-sm ${activeTab === 'blacklist' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
          >
            Blacklist
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-2 text-sm ${activeTab === 'audit' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary'}`}
          >
            Auditoría
          </button>
        </div>

        {/* Contenido de tabs */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="text-text-secondary text-xs">Total Logs</div>
                  <div className="font-semibold text-lg">{stats.totalLogs}</div>
                </div>
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="text-text-secondary text-xs">Últimas 24h</div>
                  <div className="font-semibold text-lg">{stats.logsLast24h}</div>
                </div>
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="text-text-secondary text-xs">Blacklist</div>
                  <div className="font-semibold text-lg">{stats.blacklistEntries}</div>
                </div>
                <div className="bg-surface/50 rounded-lg p-3">
                  <div className="text-text-secondary text-xs">Errores 24h</div>
                  <div className="font-semibold text-lg text-red-400">{stats.errorsLast24h}</div>
                </div>
              </div>
            ) : (
              <div className="text-text-secondary text-center py-8">
                Cargando estadísticas...
              </div>
            )}
          </div>
        )}

        {activeTab === 'blacklist' && (
          <div className="space-y-4">
            {/* Formulario para agregar */}
            <div className="bg-surface/50 rounded-lg p-4 space-y-3">
              <h3 className="heading text-sm">Agregar a Blacklist</h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <select
                  value={newEntry.type}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, type: e.target.value as any }))}
                  className="bg-background border border-white/10 rounded px-2 py-1 text-xs"
                >
                  <option value="address">Dirección</option>
                  <option value="ip">IP</option>
                  <option value="pattern">Patrón</option>
                </select>
                <input
                  type="text"
                  placeholder="Valor"
                  value={newEntry.value}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, value: e.target.value }))}
                  className="bg-background border border-white/10 rounded px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  placeholder="Razón"
                  value={newEntry.reason}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, reason: e.target.value }))}
                  className="bg-background border border-white/10 rounded px-2 py-1 text-xs"
                />
                <Button
                  onClick={addToBlacklist}
                  isLoading={isLoading}
                  disabled={!newEntry.value || !newEntry.reason}
                  className="text-xs"
                >
                  Agregar
                </Button>
              </div>
            </div>

            {/* Lista de blacklist */}
            <div className="space-y-2">
              <h3 className="heading text-sm">Entradas en Blacklist</h3>
              {blacklist.length === 0 ? (
                <div className="text-text-secondary text-center py-4">
                  No hay entradas en blacklist
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {blacklist.map((entry, index) => (
                    <div key={index} className="bg-surface/50 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${getTypeColor(entry.type)}`}>
                            {entry.type}
                          </span>
                          <span className="font-mono text-xs">{entry.value}</span>
                        </div>
                        <div className="text-xs text-text-secondary mt-1">
                          {entry.reason} • Agregado por {entry.addedBy}
                        </div>
                        <div className="text-xs text-text-secondary">
                          {new Date(entry.addedAt).toLocaleString()}
                          {entry.expiresAt && ` • Expira: ${new Date(entry.expiresAt).toLocaleString()}`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromBlacklist(entry.type, entry.value)}
                        className="text-xs text-red-400"
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="bg-surface/50 rounded-lg p-4 space-y-3">
              <h3 className="heading text-sm">Filtros</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <select
                  value={auditFilters.level}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, level: e.target.value }))}
                  className="bg-background border border-white/10 rounded px-2 py-1 text-xs"
                >
                  <option value="">Todos los niveles</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
                <input
                  type="text"
                  placeholder="Usuario"
                  value={auditFilters.userId}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, userId: e.target.value }))}
                  className="bg-background border border-white/10 rounded px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  placeholder="IP"
                  value={auditFilters.ip}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, ip: e.target.value }))}
                  className="bg-background border border-white/10 rounded px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  placeholder="Path"
                  value={auditFilters.path}
                  onChange={(e) => setAuditFilters(prev => ({ ...prev, path: e.target.value }))}
                  className="bg-background border border-white/10 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>

            {/* Logs de auditoría */}
            <div className="space-y-2">
              <h3 className="heading text-sm">Logs de Auditoría</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs.map((log, index) => (
                  <div key={index} className="bg-surface/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${getLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs font-mono">{log.method}</span>
                        <span className="text-xs">{log.path}</span>
                        <span className="text-xs">{log.statusCode}</span>
                      </div>
                      <span className="text-xs text-text-secondary">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      IP: {log.ip} • Usuario: {log.userId || 'anonymous'} • Tiempo: {log.responseTime}ms
                    </div>
                    {log.metadata && (
                      <details className="mt-2">
                        <summary className="text-xs text-text-secondary cursor-pointer">
                          Metadatos
                        </summary>
                        <pre className="text-xs text-text-secondary mt-1 bg-black/20 p-2 rounded overflow-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
