// Componente de Notificação de Expiração de Assinatura
import React, { useState, useEffect } from 'react';
import { AlertCircle, X, Clock, CreditCard, CheckCircle, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import subscriptionService, { SubscriptionRecord } from '../services/subscriptionService';
import LicenseModal from './LicenseModal';

interface SubscriptionExpirationNotificationProps {
  onRenew?: () => void;
}

interface LicenseInfo {
  id: string;
  key: string;
  planName: string;
  expiresAt: string;
  status: string;
  username?: string;
  userId?: string;
}

export default function SubscriptionExpirationNotification({
  onRenew,
}: SubscriptionExpirationNotificationProps) {
  const { user, license } = useAuth();
  const [expiringLicenses, setExpiringLicenses] = useState<LicenseInfo[]>([]);
  const [expiredLicenses, setExpiredLicenses] = useState<LicenseInfo[]>([]);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);

  // Verificar licenças do localStorage
  const checkLicenses = () => {
    if (!user) return;

    try {
      const allLicenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
      const userLicenses = allLicenses.filter((l: LicenseInfo) => 
        l.username === user || l.userId === user
      );

      const now = new Date();
      const expiring: LicenseInfo[] = [];
      const expired: LicenseInfo[] = [];

      userLicenses.forEach((lic: LicenseInfo) => {
        if (!lic.expiresAt) return;
        
        const expiresAt = new Date(lic.expiresAt);
        const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Verificar se expirou
        if (expiresAt <= now) {
          expired.push(lic);
          // Atualizar status para expired no localStorage
          lic.status = 'expired';
          setIsBlocked(true);
        } 
        // Verificar se está expirando em 5 dias ou menos
        else if (daysUntilExpiry <= 5 && daysUntilExpiry > 0) {
          expiring.push(lic);
        }
      });

      // Atualizar licenças no localStorage
      const updatedLicenses = allLicenses.map((l: LicenseInfo) => {
        const found = [...expired, ...expiring].find(e => e.id === l.id);
        return found ? { ...l, status: found.status } : l;
      });
      localStorage.setItem('ploutos_licenses', JSON.stringify(updatedLicenses));

      setExpiringLicenses(expiring.filter(l => !dismissed.includes(l.id)));
      setExpiredLicenses(expired.filter(l => !dismissed.includes(l.id)));
    } catch (error) {
      console.error('Erro ao verificar licenças:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    checkLicenses();
    const interval = setInterval(checkLicenses, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [user, dismissed]);

  const handleDismiss = (licenseId: string) => {
    setDismissed([...dismissed, licenseId]);
  };

  const handleRenew = () => {
    if (onRenew) onRenew();
    // Redirecionar para página de planos
    window.location.hash = '#plans';
  };

  const getDaysUntilExpiry = (expiresAt: string | null): number => {
    if (!expiresAt) return 0;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Se bloqueado, mostrar banner de bloqueio
  if (isBlocked && expiredLicenses.length > 0) {
    return (
      <>
        {/* Banner de Bloqueio - Ocupa toda a tela */}
        <div className="fixed inset-0 z-[10000] bg-gradient-to-br from-red-600 via-red-700 to-red-800 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Licença Expirada</h2>
            <p className="text-lg text-gray-700 mb-6">
              Sua licença do plano <strong>{expiredLicenses[0].planName}</strong> expirou em{' '}
              <strong>{formatDate(expiredLicenses[0].expiresAt)}</strong>.
            </p>
            <p className="text-gray-600 mb-8">
              Para continuar usando todas as funcionalidades, é necessário renovar sua assinatura.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRenew}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <CreditCard className="w-5 h-5 inline mr-2" />
                Renovar Assinatura
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (expiredLicenses.length === 0 && expiringLicenses.length === 0) {
    return null;
  }

  return (
    <>
      {/* Notificações de Licenças Expiradas (antes do bloqueio total) */}
      {expiredLicenses.map((lic) => (
        <div
          key={`expired-${lic.id}`}
          className="fixed top-4 right-4 z-[9999] max-w-md w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-2xl p-6 animate-slide-in-right"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">Licença Expirada</h3>
                <p className="text-sm text-red-50 mb-2">
                  Sua licença do plano <strong>{lic.planName}</strong> expirou em{' '}
                  <strong>{formatDate(lic.expiresAt)}</strong>.
                </p>
                <p className="text-xs text-red-100 mb-3">
                  Renove agora para continuar usando todas as funcionalidades.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRenew}
                    className="px-4 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors text-sm"
                  >
                    Renovar Agora
                  </button>
                  <button
                    onClick={() => handleDismiss(lic.id)}
                    className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
                  >
                    Lembrar Depois
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(lic.id)}
              className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Notificações de Licenças Expirando (5 dias antes) */}
      {expiringLicenses.map((lic, index) => {
        const daysLeft = getDaysUntilExpiry(lic.expiresAt);
        return (
          <div
            key={`expiring-${lic.id}`}
            className="fixed top-4 right-4 z-[9999] max-w-md w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-2xl p-6 animate-slide-in-right"
            style={{
              top: expiredLicenses.length > 0 ? `${expiredLicenses.length * 200 + 16}px` : `${index * 200 + 16}px`,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">Licença Expirando</h3>
                  <p className="text-sm text-amber-50 mb-2">
                    Sua licença do plano <strong>{lic.planName}</strong> expira em{' '}
                    <strong>{daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</strong> ({' '}
                    {formatDate(lic.expiresAt)}).
                  </p>
                  <p className="text-xs text-amber-100 mb-3">
                    Renove agora para evitar interrupções no serviço.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRenew}
                      className="px-4 py-2 bg-white text-amber-600 rounded-lg font-semibold hover:bg-amber-50 transition-colors text-sm"
                    >
                      Renovar Agora
                    </button>
                    <button
                      onClick={() => handleDismiss(lic.id)}
                      className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm"
                    >
                      Lembrar Depois
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(lic.id)}
                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
}

