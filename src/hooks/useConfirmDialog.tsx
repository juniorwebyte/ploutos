import { useState, useCallback, useRef } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions>({
    title: 'Confirmar',
    message: 'Tem certeza?',
  });
  const [isLoading, setIsLoading] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts);
      resolveRef.current = resolve;
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (resolveRef.current) {
      setIsLoading(true);
      try {
        // Simular delay para feedback visual (remova se não necessário)
        await new Promise(resolve => setTimeout(resolve, 100));
        resolveRef.current(true);
        resolveRef.current = null;
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const handleCancel = useCallback(() => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const Dialog = (
    <ConfirmDialog
      isOpen={isOpen}
      title={options.title}
      message={options.message}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      type={options.type}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  );

  return {
    confirm,
    Dialog,
  };
};
