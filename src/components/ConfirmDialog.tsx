import React, { useEffect } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning',
  isLoading = false
}) => {
  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, onCancel]);

  // Prevenir scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700',
          title: 'text-red-800'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-500',
          button: 'bg-yellow-600 hover:bg-yellow-700',
          title: 'text-yellow-800'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700',
          title: 'text-blue-800'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'text-gray-500',
          button: 'bg-gray-600 hover:bg-gray-700',
          title: 'text-gray-800'
        };
    }
  };

  const colors = getColors();

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      <div className={`${colors.bg} ${colors.border} border-2 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 animate-scale-in`}>
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />
          </div>
          <div className="flex-1">
            <h3 id="confirm-dialog-title" className={`text-xl font-bold ${colors.title} mb-3`} style={{ fontFamily: 'Poppins, sans-serif' }}>
              {title}
            </h3>
            <p id="confirm-dialog-description" className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              {message}
            </p>
          </div>
          {!isLoading && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110 p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
              aria-label="Fechar diálogo"
              disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
          )}
        </div>

        <div className="flex space-x-4 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-6 py-3 text-sm font-semibold text-white ${colors.button} rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2`}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
