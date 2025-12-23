import React, { useState } from 'react';
import { X, AlertTriangle, DollarSign } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface ConfirmHighValueModalProps {
  isOpen: boolean;
  value: number;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  threshold?: number;
}

const ConfirmHighValueModal: React.FC<ConfirmHighValueModalProps> = ({
  isOpen,
  value,
  description,
  onConfirm,
  onCancel,
  threshold = 10000
}) => {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmText.toLowerCase() === 'confirmar') {
      onConfirm();
      setConfirmText('');
    } else {
      alert('Por favor, digite "CONFIRMAR" para prosseguir.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Confirmação Necessária</h2>
              <p className="text-sm text-gray-600">Valor alto detectado</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Operação:</strong> {description}
            </p>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-600" />
              <span className="text-lg font-bold text-yellow-900">
                {formatCurrency(value)}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Este valor excede o limite de segurança de {formatCurrency(threshold)}.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Para confirmar esta operação, digite <strong>"CONFIRMAR"</strong> abaixo:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite CONFIRMAR"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-semibold text-center uppercase"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleConfirm}
              disabled={confirmText.toLowerCase() !== 'confirmar'}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertTriangle className="w-5 h-5" />
              Confirmar Operação
            </button>
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmHighValueModal;
