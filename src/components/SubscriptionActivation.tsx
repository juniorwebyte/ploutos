/**
 * Componente para ativação de assinatura por ID de compra (TXID)
 * Permite que o cliente insira o ID de compra recebido após pagamento
 */

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, CreditCard, Key } from 'lucide-react';
import backendService from '../services/backendService';

interface SubscriptionActivationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  txid?: string; // TXID pré-preenchido se disponível
}

export default function SubscriptionActivation({
  isOpen,
  onClose,
  onSuccess,
  txid: initialTxid,
}: SubscriptionActivationProps) {
  const [txid, setTxid] = useState(initialTxid || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
    if (!txid.trim()) {
      setError('Por favor, insira o ID de compra');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar se está online
      const online = await backendService.isOnline();
      
      if (online) {
        // Buscar pagamento pelo TXID no backend
        const base = backendService.getBaseUrl();
        const response = await fetch(`${base}/api/public/payments/by-txid/${txid.trim()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Pagamento não encontrado ou já processado');
        }

        const paymentData = await response.json();
        
        // Verificar se o pagamento está pago
        if (paymentData.status !== 'paid') {
          throw new Error('Pagamento ainda não foi confirmado. Aguarde a confirmação do pagamento.');
        }

        // Ativar assinatura associada
        if (paymentData.subscriptionId) {
          const activateResponse = await fetch(`${base}/api/public/subscriptions/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txid: txid.trim(),
              subscriptionId: paymentData.subscriptionId,
            }),
          });

          if (!activateResponse.ok) {
            throw new Error('Erro ao ativar assinatura');
          }
        }

        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        // Modo offline: verificar no localStorage
        const demoSubscriptions = JSON.parse(localStorage.getItem('demo_subscriptions') || '[]');
        const subscription = demoSubscriptions.find((sub: any) => sub.txid === txid.trim());

        if (!subscription) {
          throw new Error('ID de compra não encontrado. Verifique se o ID está correto.');
        }

        if (subscription.status !== 'active') {
          throw new Error('Assinatura não está ativa. Entre em contato com o suporte.');
        }

        // Marcar como ativada
        subscription.activated = true;
        subscription.activatedAt = new Date().toISOString();
        localStorage.setItem('demo_subscriptions', JSON.stringify(demoSubscriptions));

        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao ativar assinatura:', error);
      setError(error.message || 'Erro ao ativar assinatura. Verifique o ID de compra e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
            {success ? (
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Key className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {success ? 'Assinatura Ativada!' : 'Ativar Assinatura'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {success
              ? 'Sua assinatura foi ativada com sucesso. Você já pode acessar todos os recursos!'
              : 'Insira o ID de compra recebido após o pagamento para ativar sua assinatura.'}
          </p>
        </div>

        {!success && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID de Compra (TXID)
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={txid}
                  onChange={(e) => {
                    setTxid(e.target.value);
                    setError(null);
                  }}
                  placeholder="Cole ou digite o ID de compra aqui"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                O ID de compra foi enviado para seu e-mail após a confirmação do pagamento.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleActivate}
                disabled={loading || !txid.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Ativando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Ativar</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {success && (
          <div className="text-center">
            <button
              onClick={onSuccess}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

