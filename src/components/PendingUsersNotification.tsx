// Componente de Notificação de Cadastros Pendentes
import React, { useState, useEffect } from 'react';
import { Bell, UserPlus, X } from 'lucide-react';

interface PendingUsersNotificationProps {
  onViewPending?: () => void;
}

export default function PendingUsersNotification({
  onViewPending,
}: PendingUsersNotificationProps) {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  // Verificar quantidade de cadastros pendentes
  const checkPendingUsers = () => {
    try {
      const pendingUsers = JSON.parse(localStorage.getItem('pending_users') || '[]');
      const count = Array.isArray(pendingUsers) ? pendingUsers.length : 0;
      setPendingCount(count);
      
      // Mostrar notificação se houver cadastros pendentes e não foi dispensada
      if (count > 0 && !dismissed) {
        setIsVisible(true);
      } else if (count === 0) {
        setIsVisible(false);
        setDismissed(false); // Resetar quando não houver mais pendentes
      }
    } catch (error) {
      console.error('Erro ao verificar cadastros pendentes:', error);
      setPendingCount(0);
      setIsVisible(false);
    }
  };

  useEffect(() => {
    // Verificar imediatamente
    checkPendingUsers();

    // Verificar periodicamente a cada 5 segundos
    const interval = setInterval(checkPendingUsers, 5000);

    // Listener para mudanças no localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pending_users') {
        checkPendingUsers();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listener customizado para quando um novo cadastro é adicionado
    const handleNewPendingUser = () => {
      checkPendingUsers();
    };

    window.addEventListener('newPendingUser', handleNewPendingUser);
    
    // Listener para mudanças no localStorage via CustomEvent (mesma aba)
    const handlePendingUsersChange = () => {
      checkPendingUsers();
    };
    
    // Usar um intervalo mais frequente para detectar mudanças na mesma aba
    const fastInterval = setInterval(checkPendingUsers, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(fastInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('newPendingUser', handleNewPendingUser);
    };
  }, [dismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
  };

  const handleViewPending = () => {
    if (onViewPending) {
      onViewPending();
    }
    setIsVisible(false);
    setDismissed(true);
  };

  if (!isVisible || pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md w-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white rounded-xl shadow-2xl p-6 animate-slide-in-right">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Novos Cadastros Pendentes</h3>
            <p className="text-sm text-amber-50 mb-2">
              {pendingCount === 1 
                ? 'Há 1 cadastro aguardando aprovação'
                : `Há ${pendingCount} cadastros aguardando aprovação`
              }
            </p>
            <p className="text-xs text-amber-100 mb-3">
              Clique para visualizar e aprovar os cadastros pendentes.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleViewPending}
                className="px-4 py-2 bg-white text-amber-600 rounded-lg font-semibold hover:bg-amber-50 transition-colors text-sm flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Ver Cadastros
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
              >
                Lembrar Depois
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Badge com contador */}
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <span className="text-white text-xs font-bold">{pendingCount > 99 ? '99+' : pendingCount}</span>
      </div>
    </div>
  );
}

