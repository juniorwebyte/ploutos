/**
 * Hook para verificar acesso a módulos baseado em assinatura
 */

import { useState, useEffect } from 'react';
import { subscriptionService, type Subscription, type Plan } from '../services/subscriptionService';
import { useAuth } from '../contexts/AuthContext';

interface UseSubscriptionResult {
  hasAccess: boolean;
  isLoading: boolean;
  reason?: string;
  subscription?: Subscription;
  plan?: Plan;
  isDemoMode: boolean;
  isSuperAdmin: boolean;
  checkAccess: () => Promise<void>;
}

export function useSubscription(
  module: string,
  companyId?: string
): UseSubscriptionResult {
  const { user, role } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState<string | undefined>();
  const [subscription, setSubscription] = useState<Subscription | undefined>();
  const [plan, setPlan] = useState<Plan | undefined>();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const checkAccess = async () => {
    setIsLoading(true);
    
    // Verificar se é Super Admin
    const isSuperAdminUser = role === 'superadmin' || role === 'super_admin';
    setIsSuperAdmin(isSuperAdminUser);

    // Super Admin tem acesso total, sem bloqueios
    if (isSuperAdminUser) {
      setHasAccess(true);
      setReason('Super Administrador - acesso total');
      setIsLoading(false);
      return;
    }
    
    // Verificar se está em modo demo
    const demo = subscriptionService.isDemoMode();
    setIsDemoMode(demo);

    if (demo) {
      // Em modo demo, permitir visualização mas bloquear ações
      setHasAccess(true);
      setReason('Modo demonstração - apenas visualização');
      setIsLoading(false);
      return;
    }

    // Verificar acesso real
    if (!companyId) {
      setHasAccess(false);
      setReason('Empresa não identificada');
      setIsLoading(false);
      return;
    }

    try {
      const access = await subscriptionService.hasAccess(companyId, module);
      setHasAccess(access.hasAccess);
      setReason(access.reason);
      setSubscription(access.subscription);
      setPlan(access.plan);
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      setHasAccess(false);
      setReason('Erro ao verificar assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, [module, companyId]);

  return {
    hasAccess,
    isLoading,
    reason,
    subscription,
    plan,
    isDemoMode,
    isSuperAdmin,
    checkAccess,
  };
}

