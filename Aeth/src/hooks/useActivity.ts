// @ts-nocheck
import React from 'react';
import type { ActivityItem, ActivityType } from '../types/activity';
import { useAccount } from 'wagmi';

// Store persistente de actividad
const activityStore = {
  items: [] as ActivityItem[],
  listeners: new Set<() => void>(),
  
  // Persistencia en localStorage
  saveToStorage() {
    try {
      localStorage.setItem('AETH_ACTIVITY_HISTORY', JSON.stringify(this.items));
    } catch (error) {
      console.warn('No se pudo guardar historial de actividad:', error);
    }
  },

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('AETH_ACTIVITY_HISTORY');
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('No se pudo cargar historial de actividad:', error);
    }
  },
  
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  
  notify() {
    this.listeners.forEach(listener => listener());
  },
  
  getActivity() {
    return this.items.slice().reverse();
  },

  getActivityByType(type: ActivityType) {
    return this.items.filter(item => item.type === type).slice().reverse();
  },

  getActivityByDateRange(from: Date, to: Date) {
    const fromTime = from.getTime();
    const toTime = to.getTime();
    return this.items.filter(item => 
      item.timestamp >= fromTime && item.timestamp <= toTime
    ).slice().reverse();
  },

  clearActivity() {
    this.items = [];
    this.saveToStorage();
    this.notify();
  },

  exportActivity() {
    return JSON.stringify(this.items, null, 2);
  },
  
  pushActivity(type: ActivityType, summary: string, details?: string) {
    const activityItem: ActivityItem = {
      id: Math.random().toString(36).slice(2),
      type,
      summary,
      details,
      timestamp: Date.now()
    };

    this.items.push(activityItem);
    
    // Mantener solo los últimos 100 items para evitar sobrecarga
    if (this.items.length > 100) {
      this.items = this.items.slice(-100);
    }
    
    this.saveToStorage();
    this.notify();

    // Enviar notificación push si está habilitado
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      this.sendPushNotification(activityItem);
    }
  },

  sendPushNotification(activity: ActivityItem) {
    const title = 'Aethelgard - Nueva Actividad';
    const body = activity.summary;
    const icon = '/images/hero-1.svg';
    
    new Notification(title, {
      body,
      icon,
      tag: activity.id,
      requireInteraction: false,
      silent: false
    });
  }
};

// Inicializar desde localStorage
activityStore.loadFromStorage();

export function useActivity() {
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => activityStore.subscribe(force), []);
  const items = React.useMemo<ActivityItem[]>(() => activityStore.getActivity(), [force]);
  
  return { 
    items,
    clearActivity: activityStore.clearActivity,
    exportActivity: activityStore.exportActivity,
    getActivityByType: activityStore.getActivityByType,
    getActivityByDateRange: activityStore.getActivityByDateRange
  };
}

export function pushActivity(type: ActivityType, summary: string, details?: string) {
  activityStore.pushActivity(type, summary, details);
}

// Hook para solicitar permisos de notificación
export function useNotificationPermission() {
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = React.useCallback(async () => {
    if (!isSupported) return false;
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos de notificación:', error);
      return false;
    }
  }, [isSupported]);

  return {
    permission,
    isSupported,
    requestPermission,
    isGranted: permission === 'granted'
  };
}

// Hook para obtener actividad desde el backend
export function useBackendActivity(params?: {
  page?: number;
  limit?: number;
  type?: string;
  from?: string;
  to?: string;
}) {
  const { address } = useAccount();
  const [activities, setActivities] = React.useState<any[]>([]);
  const [pagination, setPagination] = React.useState<any>(null);
  const [stats, setStats] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!address) {
      setActivities([]);
      return;
    }

    const fetchActivity = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { getUserActivity } = await import('../lib/api');
        const data = await getUserActivity(params);
        setActivities(data.activities);
        setPagination(data.pagination);
        setStats(data.stats);
      } catch (e) {
        setError('Error al obtener historial de actividad');
        console.error('Activity error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [address, params?.page, params?.limit, params?.type, params?.from, params?.to]);

  return {
    activities,
    pagination,
    stats,
    isLoading,
    error,
    refetch: () => {
      if (address) {
        const fetchActivity = async () => {
          setIsLoading(true);
          setError(null);
          try {
            const { getUserActivity } = await import('../lib/api');
            const data = await getUserActivity(params);
            setActivities(data.activities);
            setPagination(data.pagination);
            setStats(data.stats);
          } catch (e) {
            setError('Error al actualizar historial');
          } finally {
            setIsLoading(false);
          }
        };
        fetchActivity();
      }
    }
  };
}


