import React from 'react';
import { X, AlertTriangle, CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { ValidationResult, ValidationError, ValidationWarning } from '../services/cashFlowValidationService';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: ValidationResult | null;
}

const ValidationModal: React.FC<ValidationModalProps> = ({ isOpen, onClose, validationResult }) => {
  if (!isOpen || !validationResult) return null;

  const getErrorIcon = (type: ValidationError['type']) => {
    switch (type) {
      case 'duplicate':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'inconsistency':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'high_value':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getWarningIcon = (type: ValidationWarning['type']) => {
    switch (type) {
      case 'high_value':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-1 overflow-y-auto pt-16">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {validationResult.isValid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <div>
              <h2 className="text-xs font-bold text-gray-900">Validação de Dados</h2>
              <p className="text-xs text-gray-600">
                {validationResult.isValid
                  ? 'Todos os dados estão válidos'
                  : `${validationResult.errors.filter(e => e.severity === 'error').length} erro(s) encontrado(s)`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {/* Erros */}
          {validationResult.errors.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                Erros e Avisos ({validationResult.errors.length})
              </h3>
              <div className="space-y-1.5">
                {validationResult.errors.map((error, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg border ${
                      error.severity === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {getErrorIcon(error.type)}
                      <div className="flex-1">
                        <p className={`text-xs font-medium ${
                          error.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                          {error.message}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Campo: {error.field}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avisos de Valores Altos */}
          {validationResult.warnings.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Avisos de Valores Altos ({validationResult.warnings.length})
              </h3>
              <div className="space-y-1.5">
                {validationResult.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-lg border bg-blue-50 border-blue-200"
                  >
                    <div className="flex items-start gap-2">
                      {getWarningIcon(warning.type)}
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-800">
                          {warning.message}
                        </p>
                        {warning.suggestedAction && (
                          <p className="text-xs text-blue-600 mt-0.5 italic">
                            {warning.suggestedAction}
                          </p>
                        )}
                        <p className="text-xs text-gray-600 mt-0.5">
                          Campo: {warning.field}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sem problemas */}
          {validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Nenhum problema encontrado!
              </p>
              <p className="text-xs text-gray-600">
                Todos os dados foram validados e estão corretos.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ValidationModal;

