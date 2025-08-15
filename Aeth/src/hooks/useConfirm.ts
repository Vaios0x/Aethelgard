import React from 'react';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'danger' | 'warning' | 'info';
  details: string | undefined;
  onConfirm: () => void | Promise<void>;
}

interface UseConfirmOptions {
  defaultConfirmText?: string;
  defaultCancelText?: string;
  defaultVariant?: 'danger' | 'warning' | 'info';
}

export function useConfirm(options: UseConfirmOptions = {}) {
  const {
    defaultConfirmText = 'Confirmar',
    defaultCancelText = 'Cancelar',
    defaultVariant = 'danger'
  } = options;

  const [confirmation, setConfirmation] = React.useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: defaultConfirmText,
    cancelText: defaultCancelText,
    variant: defaultVariant,
    details: undefined,
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
      confirmText: options?.confirmText || defaultConfirmText,
      cancelText: options?.cancelText || defaultCancelText,
      variant: options?.variant || defaultVariant,
      details: options?.details,
      onConfirm
    });
  }, [defaultConfirmText, defaultCancelText, defaultVariant]);

  const close = React.useCallback(() => {
    setConfirmation(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = React.useCallback(async () => {
    try {
      await confirmation.onConfirm();
      close();
    } catch (error) {
      console.error('Error en confirmación:', error);
      // No cerrar el modal si hay error, para que el usuario pueda ver el error
    }
  }, [confirmation.onConfirm, close]);

  return {
    confirmation,
    confirm,
    close,
    handleConfirm
  };
}

// Hook para confirmaciones específicas
export function useConfirmActions() {
  const { confirm } = useConfirm();

  const confirmDelete = React.useCallback((
    itemName: string,
    onDelete: () => void | Promise<void>,
    options?: { details?: string }
  ) => {
    confirm(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar "${itemName}"?`,
      onDelete,
      {
        variant: 'danger',
        confirmText: 'Eliminar',
        details: options?.details || 'Esta acción no se puede deshacer.'
      }
    );
  }, [confirm]);

  const confirmTransaction = React.useCallback((
    action: string,
    details: string,
    onConfirm: () => void | Promise<void>,
    options?: { variant?: 'danger' | 'warning' | 'info' }
  ) => {
    confirm(
      `Confirmar ${action}`,
      `¿Estás seguro de que quieres ${action.toLowerCase()}?`,
      onConfirm,
      {
        variant: options?.variant || 'warning',
        details
      }
    );
  }, [confirm]);

  const confirmPurchase = React.useCallback((
    itemName: string,
    price: number,
    currency: string = 'CORE',
    onPurchase: () => void | Promise<void>
  ) => {
    confirm(
      'Confirmar compra',
      `¿Estás seguro de que quieres comprar "${itemName}" por ${price} ${currency}?`,
      onPurchase,
      {
        variant: 'info',
        confirmText: 'Comprar',
        details: `Se transferirán ${price} ${currency} de tu wallet y el item será tuyo.`
      }
    );
  }, [confirm]);

  const confirmSale = React.useCallback((
    itemName: string,
    price: number,
    currency: string = 'CORE',
    onSale: () => void | Promise<void>
  ) => {
    confirm(
      'Confirmar venta',
      `¿Estás seguro de que quieres vender "${itemName}" por ${price} ${currency}?`,
      onSale,
      {
        variant: 'warning',
        confirmText: 'Vender',
        details: `El item será listado en el marketplace por ${price} ${currency}.`
      }
    );
  }, [confirm]);

  return {
    confirmDelete,
    confirmTransaction,
    confirmPurchase,
    confirmSale
  };
}

// Hook para confirmaciones con validación
export function useConfirmWithValidation() {
  const { confirm } = useConfirm();

  const confirmWithValidation = React.useCallback((
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    validation?: () => boolean | string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      variant?: 'danger' | 'warning' | 'info';
      details?: string;
    }
  ) => {
    const validate = () => {
      if (!validation) return true;
      
      const result = validation();
      if (typeof result === 'string') {
        // Si devuelve un string, es un mensaje de error
        throw new Error(result);
      }
      return result;
    };

    const handleConfirm = async () => {
      try {
        validate();
        await onConfirm();
      } catch (error) {
        throw error;
      }
    };

    confirm(title, message, handleConfirm, options);
  }, [confirm]);

  return {
    confirmWithValidation
  };
}
