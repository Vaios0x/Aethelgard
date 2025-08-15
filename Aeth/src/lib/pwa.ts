import React from 'react';

// Sistema PWA para Aethelgard
export class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;
  public isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  async init() {
    if (!this.isSupported) {
      console.warn('PWA no soportado en este navegador');
      return false;
    }

    try {
      // Registrar Service Worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', this.registration);

      // Escuchar actualizaciones
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
      return false;
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      return false;
    }
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration || !this.isSupported) return null;

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY || '')
      });

      console.log('Suscripción push creada:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error suscribiendo a push:', error);
      return null;
    }
  }

  async sendNotification(title: string, options: NotificationOptions = {}) {
    if (!this.registration) return;

    const defaultOptions: NotificationOptions = {
      icon: '/images/hero-1.svg',
      badge: '/images/hero-1.svg',
      tag: 'aethelgard-activity',
      requireInteraction: false,
      silent: false,
      data: {},
      ...options
    };

    await this.registration.showNotification(title, defaultOptions);
  }

  private showUpdateNotification() {
    if (confirm('Hay una nueva versión disponible. ¿Quieres actualizar?')) {
      window.location.reload();
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async checkForUpdates() {
    if (this.registration) {
      await this.registration.update();
    }
  }

  async clearCache() {
    if (this.registration) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }
}

// Hook para usar PWA en React
export function usePWA() {
  const [pwaManager] = React.useState(() => new PWAManager());
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [notificationPermission, setNotificationPermission] = React.useState<NotificationPermission>('default');

  React.useEffect(() => {
    const initPWA = async () => {
      const success = await pwaManager.init();
      setIsInitialized(success);
      
      if (success && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    };

    initPWA();
  }, [pwaManager]);

  const requestNotificationPermission = React.useCallback(async () => {
    const granted = await pwaManager.requestNotificationPermission();
    if (granted && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    return granted;
  }, [pwaManager]);

  const sendNotification = React.useCallback((title: string, options?: NotificationOptions) => {
    return pwaManager.sendNotification(title, options);
  }, [pwaManager]);

  const subscribeToPush = React.useCallback(() => {
    return pwaManager.subscribeToPush();
  }, [pwaManager]);

  const checkForUpdates = React.useCallback(() => {
    return pwaManager.checkForUpdates();
  }, [pwaManager]);

  const clearCache = React.useCallback(() => {
    return pwaManager.clearCache();
  }, [pwaManager]);

  return {
    isInitialized,
    notificationPermission,
    requestNotificationPermission,
    sendNotification,
    subscribeToPush,
    checkForUpdates,
    clearCache,
    isSupported: pwaManager.isSupported
  };
}

// Instancia global
export const pwaManager = new PWAManager();
