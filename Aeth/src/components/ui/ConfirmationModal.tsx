import React from 'react';
import Card from './Card';
import Button from './Button';
import Alert from './Alert';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  error?: string | null;
  details?: string;
}

const variants = {
  danger: {
    icon: '🗑️',
    confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    alertVariant: 'error' as const
  },
  warning: {
    icon: '⚠️',
    confirmClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    alertVariant: 'warning' as const
  },
  info: {
    icon: 'ℹ️',
    confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    alertVariant: 'info' as const
  }
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  error = null,
  details
}: ConfirmationModalProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const variantConfig = variants[variant];

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('Error en confirmación:', err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isConfirming) {
      onClose();
    }
  };

  // Cerrar con Escape
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <Card className="relative max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="text-2xl">{variantConfig.icon}</div>
            <div className="flex-1">
              <h3 className="heading text-lg">{title}</h3>
              <p className="text-text-secondary text-sm mt-1">{message}</p>
            </div>
          </div>

          {/* Detalles adicionales */}
          {details && (
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-sm text-text-secondary">{details}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="error" title="Error">
              {error}
            </Alert>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isLoading || isConfirming}
              className="flex-1"
            >
              {cancelText}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || isConfirming}
              isLoading={isLoading || isConfirming}
              className={`flex-1 ${variantConfig.confirmClass}`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Hook para usar confirmaciones
export function useConfirmation() {
  const [confirmation, setConfirmation] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void | Promise<void>;
    details?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const confirm = React.useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: 'danger' | 'warning' | 'info';
      details?: string;
    }
  ) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      variant: options?.variant,
      details: options?.details
    });
  }, []);

  const close = React.useCallback(() => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    confirmation,
    confirm,
    close
  };
}
