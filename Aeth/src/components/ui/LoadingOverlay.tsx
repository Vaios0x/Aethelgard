import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number; // 0-100
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
}

const variants = {
  spinner: (
    <div className="relative">
      <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  ),
  dots: (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  ),
  pulse: (
    <div className="w-8 h-8 bg-white rounded-full animate-pulse" />
  )
};

export default function LoadingOverlay({
  isVisible,
  message = 'Cargando...',
  progress,
  variant = 'spinner',
  className = ''
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
      <div className="bg-surface border border-white/10 rounded-lg p-6 shadow-glow max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          {/* Spinner/Dots/Pulse */}
          {variants[variant]}
          
          {/* Mensaje */}
          <div className="space-y-2">
            <p className="text-text-primary font-medium">{message}</p>
            
            {/* Barra de progreso */}
            {progress !== undefined && (
              <div className="w-full">
                <div className="flex justify-between text-xs text-text-secondary mb-1">
                  <span>Progreso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook para manejar estados de carga global
export function useLoadingOverlay() {
  const [loadingState, setLoadingState] = React.useState<{
    isVisible: boolean;
    message: string;
    progress?: number;
    variant: 'spinner' | 'dots' | 'pulse';
  }>({
    isVisible: false,
    message: 'Cargando...',
    variant: 'spinner'
  });

  const show = React.useCallback((
    message: string,
    options?: {
      progress?: number;
      variant?: 'spinner' | 'dots' | 'pulse';
    }
  ) => {
    setLoadingState({
      isVisible: true,
      message,
      progress: options?.progress,
      variant: options?.variant || 'spinner'
    });
  }, []);

  const hide = React.useCallback(() => {
    setLoadingState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const updateProgress = React.useCallback((progress: number) => {
    setLoadingState(prev => ({ ...prev, progress }));
  }, []);

  const updateMessage = React.useCallback((message: string) => {
    setLoadingState(prev => ({ ...prev, message }));
  }, []);

  return {
    loadingState,
    show,
    hide,
    updateProgress,
    updateMessage
  };
}

// Componente de carga para secciones específicas
export function LoadingSection({
  isLoading,
  children,
  fallback,
  className = ''
}: {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}) {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        {fallback || (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">Cargando...</p>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
