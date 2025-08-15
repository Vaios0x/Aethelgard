import React from 'react';
import Button from './Button';
import { usePWA } from '../../lib/pwa';
import { useToast } from '../../lib/notifications';

export default function PWAStatus() {
  const { 
    isInitialized, 
    notificationPermission, 
    requestNotificationPermission, 
    sendNotification,
    checkForUpdates,
    clearCache,
    isSupported 
  } = usePWA();
  const { show } = useToast();

  const handleRequestNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      show('Notificaciones habilitadas', 'success');
    } else {
      show('Permisos de notificación denegados', 'error');
    }
  };

  const handleTestNotification = () => {
    sendNotification('Aethelgard - Prueba', {
      body: 'Esta es una notificación de prueba',
      tag: 'test-notification'
    });
    show('Notificación de prueba enviada', 'info');
  };

  const handleCheckUpdates = async () => {
    await checkForUpdates();
    show('Buscando actualizaciones...', 'info');
  };

  const handleClearCache = async () => {
    await clearCache();
    show('Cache limpiado', 'success');
  };

  if (!isSupported) {
    return (
      <div className="text-xs text-text-secondary">
        PWA no soportado en este navegador
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <span className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-400' : 'bg-yellow-400'}`} />
        <span className="text-text-secondary">
          PWA: {isInitialized ? 'Inicializada' : 'Inicializando...'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${
          notificationPermission === 'granted' ? 'bg-green-400' : 
          notificationPermission === 'denied' ? 'bg-red-400' : 'bg-yellow-400'
        }`} />
        <span className="text-xs text-text-secondary">
          Notificaciones: {
            notificationPermission === 'granted' ? 'Habilitadas' :
            notificationPermission === 'denied' ? 'Denegadas' : 'Pendientes'
          }
        </span>
      </div>

      <div className="flex flex-wrap gap-1">
        {notificationPermission !== 'granted' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRequestNotificationPermission}
            className="text-xs"
          >
            Habilitar notificaciones
          </Button>
        )}

        {notificationPermission === 'granted' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTestNotification}
            className="text-xs"
          >
            Probar notificación
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCheckUpdates}
          className="text-xs"
        >
          Buscar actualizaciones
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearCache}
          className="text-xs"
        >
          Limpiar cache
        </Button>
      </div>
    </div>
  );
}
