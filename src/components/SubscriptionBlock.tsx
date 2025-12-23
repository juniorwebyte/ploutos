/**
 * Componente de Bloqueio por Assinatura
 * Exibe overlay informativo quando módulo está bloqueado
 */

import React from 'react';
import { Lock, CreditCard, CheckCircle, AlertCircle, X } from 'lucide-react';
import { subscriptionService, type Subscription, type Plan } from '../services/subscriptionService';

interface SubscriptionBlockProps {
  module: string;
  companyId?: string;
  onSubscribe?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function SubscriptionBlock({
  module,
  companyId,
  onSubscribe,
  onClose,
  showCloseButton = false,
}: SubscriptionBlockProps) {
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<{
    hasSubscription: boolean;
    subscription?: Subscription;
    plan?: Plan;
    isActive: boolean;
    daysRemaining?: number;
  } | null>(null);

  React.useEffect(() => {
    if (companyId) {
      subscriptionService.getSubscriptionStatus(companyId).then(setSubscriptionStatus);
    }
  }, [companyId]);

  const moduleNames: Record<string, string> = {
    timeclock: 'Controle de Ponto Eletrônico',
    caderno: 'Caderno de Notas Fiscais',
    caixa: 'Movimento de Caixa',
  };

  const moduleName = moduleNames[module] || module;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 relative">
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Módulo Bloqueado
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            O módulo <strong>{moduleName}</strong> está disponível apenas para clientes com assinatura ativa.
          </p>
        </div>

        {subscriptionStatus && !subscriptionStatus.isActive && subscriptionStatus.hasSubscription && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-200">
                  Assinatura {subscriptionStatus.subscription?.status}
                </p>
                {subscriptionStatus.subscription?.endDate && (
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Expirou em: {new Date(subscriptionStatus.subscription.endDate).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Funcionalidades disponíveis com assinatura:
          </h3>
          <ul className="space-y-2">
            {module === 'timeclock' && (
              <>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Registro de ponto completo
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Gestão de funcionários e jornadas
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Relatórios e exportações
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Integração com RH e Financeiro
                </li>
                <li className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  Conformidade legal (Portaria 671/2021)
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              console.log('🔔 Botão Assinar Agora clicado', { onSubscribe: !!onSubscribe });
              if (onSubscribe) {
                onSubscribe();
              } else {
                console.warn('⚠️ onSubscribe não está definido');
                // Fallback: tentar abrir modal de pagamento via evento
                const event = new CustomEvent('ploutos:open-payment', { 
                  detail: { module } 
                });
                window.dispatchEvent(event);
              }
            }}
            className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2 font-semibold transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            Assinar Agora
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Fechar
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Entre em contato com nosso suporte para mais informações sobre os planos disponíveis.
        </p>
      </div>
    </div>
  );
}

