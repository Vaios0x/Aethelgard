import React from 'react';
import Card from './Card';
import Button from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; resetError: () => void }>;
  onError?: (error: Error) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught an error:', error);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error:', {
        message: error.message,
        stack: error.stack
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default fallback UI
      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: { error: Error | null; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="text-center space-y-4">
          <div className="text-6xl">⚠️</div>
          
          <h2 className="text-xl font-semibold text-text-primary">
            Algo salió mal
          </h2>
          
          <p className="text-text-secondary text-sm">
            Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-text-secondary hover:text-text-primary">
                Detalles del error (solo desarrollo)
              </summary>
              <pre className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 overflow-auto max-h-32">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          <div className="flex gap-2 justify-center">
            <Button onClick={resetError} variant="primary">
              Intentar de nuevo
            </Button>
            <Button onClick={() => window.location.reload()} variant="ghost">
              Recargar página
            </Button>
          </div>

          <p className="text-xs text-text-secondary">
            Si el problema persiste, contacta soporte
          </p>
        </div>
      </Card>
    </div>
  );
}

export default ErrorBoundary;
