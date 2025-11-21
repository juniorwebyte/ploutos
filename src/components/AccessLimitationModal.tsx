import React from 'react';
import { 
  Lock, 
  AlertTriangle, 
  Clock, 
  CreditCard, 
  X,
  Crown,
  Zap,
  Shield
} from 'lucide-react';

interface AccessLimitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  limitation: {
    maxRecords: number;
    currentRecords: number;
    isTrialExpired: boolean;
    daysLeftInTrial: number;
  };
}

export default function AccessLimitationModal({ 
  isOpen, 
  onClose, 
  onUpgrade, 
  limitation 
}: AccessLimitationModalProps) {
  if (!isOpen) return null;

  const { maxRecords, currentRecords, isTrialExpired, daysLeftInTrial } = limitation;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Acesso Limitado</h2>
                <p className="text-orange-100 text-sm">
                  {isTrialExpired ? 'Trial expirado' : 'Limite de registros atingido'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isTrialExpired ? (
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Trial Expirado
              </h3>
              <p className="text-gray-600 mb-4">
                Seu período de teste gratuito expirou. Para continuar usando o sistema, 
                escolha um de nossos planos.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Limite de Registros Atingido
              </h3>
              <p className="text-gray-600 mb-4">
                Você atingiu o limite de {maxRecords} registros. 
                Atualmente você tem {currentRecords} registros.
              </p>
            </div>
          )}

          {/* Progress Bar */}
          {!isTrialExpired && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Registros utilizados</span>
                <span>{currentRecords} / {maxRecords === -1 ? '∞' : maxRecords}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${maxRecords === -1 ? 0 : Math.min((currentRecords / maxRecords) * 100, 100)}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Trial Info */}
          {!isTrialExpired && daysLeftInTrial > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {daysLeftInTrial} dias restantes no trial
                </span>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Com um plano pago você terá:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span>Registros ilimitados</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Zap className="h-4 w-4 text-blue-500" />
                <span>Recursos avançados</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Suporte prioritário</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CreditCard className="h-4 w-4 text-purple-500" />
                <span>Relatórios profissionais</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Continuar Limitado
            </button>
            <button
              onClick={onUpgrade}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Ver Planos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
