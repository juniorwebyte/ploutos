/**
 * Demo do Controle de Ponto Eletrônico
 * Permite testar sem login
 */

import React, { useState } from 'react';
import { X, ArrowLeft, PlayCircle } from 'lucide-react';
import TimeClockModule from './TimeClockModule';
import PaymentModal from './PaymentModal';
import plansService, { PlanRecord } from '../services/plansService';

interface TimeClockDemoProps {
  onClose: () => void;
  onRequestLogin?: () => void;
}

export default function TimeClockDemo({ onClose, onRequestLogin }: TimeClockDemoProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null);
  const [plans, setPlans] = useState<PlanRecord[]>(plansService.getPlans());

  React.useEffect(() => {
    const unsub = plansService.subscribe((updated) => setPlans(updated));
    return () => unsub();
  }, []);

  const handleSubscribe = () => {
    console.log('🔔 handleSubscribe chamado no TimeClockDemo', { plansCount: plans.length });
    
    // Buscar plano que inclui timeclock (geralmente Professional ou Enterprise)
    const planWithTimeclock = plans.find(p => 
      p.features && (
        (typeof p.features === 'string' && p.features.includes('timeclock')) ||
        (typeof p.features === 'object' && JSON.stringify(p.features).includes('timeclock'))
      )
    ) || plans.find(p => p.name?.toLowerCase().includes('professional')) || plans.find(p => p.name?.toLowerCase().includes('enterprise')) || plans[0];
    
    console.log('📦 Plano selecionado:', planWithTimeclock);
    
    if (planWithTimeclock) {
      setSelectedPlan(planWithTimeclock);
      // Usar setTimeout para garantir que o estado seja atualizado antes de abrir o modal
      setTimeout(() => {
        setShowPaymentModal(true);
        console.log('✅ PaymentModal deve ser exibido');
      }, 100);
    } else {
      // Se não encontrar plano específico, usar o primeiro disponível
      if (plans.length > 0) {
        setSelectedPlan(plans[0]);
        setTimeout(() => {
          setShowPaymentModal(true);
          console.log('✅ PaymentModal deve ser exibido (plano padrão)');
        }, 100);
      } else {
        console.error('❌ Nenhum plano disponível');
        alert('Nenhum plano disponível. Por favor, entre em contato com o suporte.');
      }
    }
  };

  const handlePaymentComplete = (paymentData: any) => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
    if (onRequestLogin) {
      onRequestLogin();
    } else {
      // Se não tiver callback, apenas fechar e mostrar mensagem
      alert('Assinatura realizada com sucesso! Faça login para acessar o sistema completo.');
      onClose();
    }
  };
  return (
    <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 modal-overlay">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden modal-content">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Fechar demo"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <PlayCircle className="w-6 h-6 text-emerald-600" />
                Demo - Controle de Ponto Eletrônico
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Teste todas as funcionalidades sem cadastro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <TimeClockModule onSubscribe={handleSubscribe} />
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Demo Interativa</span> - Todos os dados são temporários e serão perdidos ao fechar
          </p>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            console.log('🔴 Fechando PaymentModal');
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          onPaymentComplete={handlePaymentComplete}
          selectedPlan={{
            name: selectedPlan.name || 'Plano',
            priceCents: selectedPlan.priceCents || 0,
            interval: selectedPlan.interval || 'monthly',
          }}
        />
      )}
    </div>
  );
}

