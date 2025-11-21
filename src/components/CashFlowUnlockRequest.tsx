import React, { useState } from 'react';
import { Gift, Lock, CheckCircle, X } from 'lucide-react';

interface CashFlowUnlockRequestProps {
  onRequestSent?: () => void;
}

const CashFlowUnlockRequest: React.FC<CashFlowUnlockRequestProps> = ({ onRequestSent }) => {
  const [isRequested, setIsRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkExistingRequest = () => {
    const requests = JSON.parse(localStorage.getItem('cashflow_unlock_requests') || '[]');
    const currentUser = localStorage.getItem('caixa_user');
    return requests.some((r: any) => r.username === currentUser && r.status === 'pending');
  };

  React.useEffect(() => {
    setIsRequested(checkExistingRequest());
  }, []);

  const handleRequestUnlock = async () => {
    if (isRequested) return;

    setIsLoading(true);
    try {
      const currentUser = localStorage.getItem('caixa_user');
      const userEmail = localStorage.getItem('user_email') || '';
      
      if (!currentUser) {
        alert('Erro: Usuário não identificado. Faça login novamente.');
        return;
      }

      const request = {
        id: `req_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
        username: currentUser,
        email: userEmail,
        type: 'cashflow_30days_trial',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        expiresAt: null // Será definido quando aprovado
      };

      // Salvar solicitação localmente
      const requests = JSON.parse(localStorage.getItem('cashflow_unlock_requests') || '[]');
      requests.push(request);
      localStorage.setItem('cashflow_unlock_requests', JSON.stringify(requests));

      // Tentar enviar para servidor (se disponível)
      try {
        const backendService = (await import('../services/backendService')).default;
        const online = await backendService.isOnline();
        if (online) {
          const token = localStorage.getItem('auth_token');
          await backendService.post('/api/cashflow-unlock-request', request, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (e) {
        console.warn('⚠️ Servidor offline, solicitação salva localmente');
      }

      setIsRequested(true);
      
      // Disparar evento customizado para atualizar o super admin
      window.dispatchEvent(new CustomEvent('cashflowUnlockRequested', { detail: request }));
      
      if (onRequestSent) {
        onRequestSent();
      }

      alert('✅ Solicitação enviada com sucesso!\n\nSua solicitação de 30 dias grátis do Gerenciamento de Caixa foi enviada para aprovação. Você receberá uma notificação quando for aprovada.');
    } catch (error: any) {
      console.error('Erro ao solicitar desbloqueio:', error);
      alert(`❌ Erro ao enviar solicitação:\n\n${error?.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (isRequested) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Solicitação Enviada
            </h3>
            <p className="text-green-700 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Sua solicitação de 30 dias grátis do Gerenciamento de Caixa foi enviada e está aguardando aprovação. 
              Você receberá uma notificação assim que for aprovada.
            </p>
            <div className="flex items-center gap-2 text-green-600 text-xs">
              <Gift className="w-4 h-4" />
              <span style={{ fontFamily: 'Inter, sans-serif' }}>Status: Aguardando aprovação</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mb-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Lock className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-amber-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Desbloqueie o Gerenciamento de Caixa - 30 Dias Grátis
          </h3>
          <p className="text-amber-700 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            O Gerenciamento de Caixa está bloqueado por padrão. Solicite agora 30 dias grátis para testar todas as funcionalidades!
          </p>
          <ul className="list-disc list-inside text-amber-700 text-sm mb-4 space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            <li>Controle completo de entradas e saídas</li>
            <li>Gestão de PIX, cartões e boletos</li>
            <li>Relatórios detalhados</li>
            <li>30 dias de acesso gratuito</li>
          </ul>
          <button
            onClick={handleRequestUnlock}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Gift className="w-5 h-5" />
                Solicitar 30 Dias Grátis
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashFlowUnlockRequest;

