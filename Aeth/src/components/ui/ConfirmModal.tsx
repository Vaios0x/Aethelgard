import React from 'react';
import Card from './Card';
import Button from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: '⚠️',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
      border: 'border-red-500/20'
    },
    warning: {
      icon: '⚠️',
      confirmButton: 'bg-amber-600 hover:bg-amber-700 text-white',
      border: 'border-amber-500/20'
    },
    info: {
      icon: 'ℹ️',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
      border: 'border-blue-500/20'
    }
  };

  const styles = variantStyles[variant];

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className={`max-w-md w-full mx-4 border ${styles.border}`}>
        <div className="text-center space-y-4">
          <div className="text-4xl">{styles.icon}</div>
          
          <h3 className="text-lg font-semibold text-text-primary">
            {title}
          </h3>
          
          <p className="text-text-secondary text-sm">
            {message}
          </p>

          <div className="flex gap-3 justify-center pt-2">
            <Button
              onClick={handleClose}
              variant="ghost"
              disabled={isLoading}
              className="flex-1"
            >
              {cancelText}
            </Button>
            
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`flex-1 ${styles.confirmButton}`}
            >
              {isLoading ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Procesando...
                </>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
