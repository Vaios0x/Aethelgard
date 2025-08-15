import React from 'react';

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

interface UseLoadingStateOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  retryCount?: number;
  retryDelay?: number;
}

export function useLoadingState(
  asyncFunction: () => Promise<any>,
  dependencies: React.DependencyList = [],
  options: UseLoadingStateOptions = {}
): LoadingState {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const { onError, onSuccess, retryCount: maxRetries = 3, retryDelay = 1000 } = options;

  const execute = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await asyncFunction();
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction, onError, onSuccess]);

  const retry = React.useCallback(async () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      await execute();
    }
  }, [execute, retryCount, maxRetries, retryDelay]);

  // Ejecutar automáticamente cuando cambian las dependencias
  React.useEffect(() => {
    execute();
  }, dependencies);

  return {
    isLoading,
    error,
    retry
  };
}

// Hook para múltiples estados de carga
export function useMultipleLoadingStates() {
  const [states, setStates] = React.useState<Record<string, boolean>>({});
  const [errors, setErrors] = React.useState<Record<string, string | null>>({});

  const setLoading = React.useCallback((key: string, loading: boolean) => {
    setStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const setError = React.useCallback((key: string, error: string | null) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  }, []);

  const isLoading = React.useCallback((key: string) => states[key] || false, [states]);
  const getError = React.useCallback((key: string) => errors[key] || null, [errors]);

  const hasAnyLoading = React.useMemo(() => Object.values(states).some(Boolean), [states]);
  const hasAnyError = React.useMemo(() => Object.values(errors).some(Boolean), [errors]);

  return {
    setLoading,
    setError,
    isLoading,
    getError,
    hasAnyLoading,
    hasAnyError,
    states,
    errors
  };
}

// Hook para operaciones con retry automático
export function useRetryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
) {
  const [result, setResult] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [attempts, setAttempts] = React.useState(0);

  const execute = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setAttempts(attempt);
        const data = await operation();
        setResult(data);
        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        
        if (attempt === maxRetries) {
          setError(errorMessage);
          throw err;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }, [operation, maxRetries, delay]);

  const reset = React.useCallback(() => {
    setResult(null);
    setError(null);
    setAttempts(0);
  }, []);

  return {
    result,
    isLoading,
    error,
    attempts,
    execute,
    reset
  };
}
