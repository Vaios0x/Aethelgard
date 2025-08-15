import { useState, useCallback } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState {
  isOpen: boolean;
  options: ConfirmOptions;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    options: { message: '' },
    onConfirm: null,
    onCancel: null
  });

  const confirm = useCallback((
    options: ConfirmOptions,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    setState({
      isOpen: true,
      options: {
        title: options.title || 'Confirmar acción',
        message: options.message,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        variant: options.variant || 'danger'
      },
      onConfirm,
      onCancel: onCancel || null
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.onConfirm) {
      state.onConfirm();
    }
    close();
  }, [state.onConfirm, close]);

  const handleCancel = useCallback(() => {
    if (state.onCancel) {
      state.onCancel();
    }
    close();
  }, [state.onCancel, close]);

  return {
    isOpen: state.isOpen,
    options: state.options,
    confirm,
    close,
    handleConfirm,
    handleCancel
  };
}
