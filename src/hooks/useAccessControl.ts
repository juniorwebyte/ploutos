import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';

interface AccessControl {
  canAccessFeature: (feature: string) => boolean;
  canCreateRecords: () => boolean;
  canEditRecords: () => boolean;
  canDeleteRecords: () => boolean;
  canExportData: () => boolean;
  canAccessAdvancedFeatures: () => boolean;
  maxRecords: number;
  currentRecords: number;
  isTrialExpired: boolean;
  daysLeftInTrial: number;
}

export const useAccessControl = (): AccessControl => {
  const { license, role } = useAuth();
  const [currentRecords, setCurrentRecords] = useState(0);
  const [isLicenseLoaded, setIsLicenseLoaded] = useState(false);

  // Verificar se é super admin (acesso total)
  const isSuperAdmin = role === 'superadmin';

  // Aguardar carregamento da licença antes de verificar permissões
  useEffect(() => {
    // Verificar imediatamente se já temos licença ou se é super admin
    if (license !== undefined || role === 'superadmin') {
      setIsLicenseLoaded(true);
    } else {
      // Aguardar um ciclo apenas se não temos informação ainda
      const timer = setTimeout(() => {
        setIsLicenseLoaded(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [license, role]);

  // Verificar se a licença está ativa e não expirada
  const isLicenseSuspended = license?.status === 'suspended';
  const isLicenseExpired = license?.expiresAt ? new Date(license.expiresAt) <= new Date() : false;
  const isLicenseActive = (license?.status === 'active' || license?.status === 'trial') && !isLicenseExpired;

  // Verificar se é trial
  const isTrial = license?.trialStart && license?.trialDays;

  // Calcular dias restantes do trial
  const daysLeftInTrial = isTrial && license?.trialStart
    ? Math.max(0, license.trialDays - Math.floor((Date.now() - new Date(license.trialStart).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Verificar se trial expirou
  const isTrialExpired = isTrial && daysLeftInTrial <= 0;

  // Limitações baseadas no plano
  const getPlanLimitations = () => {
    if (isSuperAdmin) {
      return {
        maxRecords: -1, // Ilimitado
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
        canAdvanced: true
      };
    }

    if (!isLicenseActive || isTrialExpired) {
      return {
        maxRecords: 5, // Muito limitado para usuários sem licença
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
        canAdvanced: false
      };
    }

    // Limitações para usuários com licença ativa
    return {
      maxRecords: 50, // Limite padrão
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canExport: true,
      canAdvanced: false
    };
  };

  const limitations = getPlanLimitations();

  // Carregar número atual de registros
  useEffect(() => {
    const loadCurrentRecords = () => {
      try {
        // Contar registros em diferentes módulos
        const cashFlowEntries = JSON.parse(localStorage.getItem('cash_flow_entries') || '[]');
        const notas = JSON.parse(localStorage.getItem('ploutos_notas') || '[]');
        const customers = JSON.parse(localStorage.getItem('customers') || '[]');
        
        const totalRecords = cashFlowEntries.length + notas.length + customers.length;
        setCurrentRecords(totalRecords);
      } catch (error) {
        console.error('Erro ao carregar registros:', error);
        setCurrentRecords(0);
      }
    };

    loadCurrentRecords();
  }, []);

  const canAccessFeature = (feature: string): boolean => {
    // Super admin sempre tem acesso
    if (isSuperAdmin) return true;
    
    // Se ainda não carregou a licença, BLOQUEAR features premium mas permitir básicas
    if (!isLicenseLoaded) {
      if (feature === 'cashflow' || feature === 'notas') return false; // SEMPRE bloquear cashflow e notas sem licença
      if (feature === 'customers') return true; // Permitir básicas apenas para clientes
      return false; // Bloquear premium
    }
    
    // Se licença está suspensa ou expirada, bloquear TUDO
    if (isLicenseSuspended || isLicenseExpired) {
      return false; // Licença suspensa ou expirada bloqueia todas as features
    }
    
    // Se não tem licença OU licença não está ativa, bloquear features premium
    if (!license || !isLicenseActive) {
      // BLOQUEAR cashflow e notas por padrão - requer pagamento ativo
      if (feature === 'cashflow' || feature === 'notas') {
        return false; // Movimento de Caixa e Notas Fiscais SEMPRE bloqueados sem pagamento
      }
      // Features básicas podem ser acessadas mesmo sem licença ativa (exceto cashflow e notas)
      if (feature === 'customers') {
        return true; // Permitir acesso básico apenas para clientes
      }
      return false; // Bloquear features premium
    }

    // Verificar limitações específicas por feature
    switch (feature) {
      case 'cashflow':
        // Movimento de Caixa requer licença ativa OU trial (30 dias grátis)
        return isLicenseActive === true && !isLicenseSuspended;
      case 'notas':
        // Notas Fiscais requer APENAS licença ativa (pagamento realizado) - SEM trial
        return isLicenseActive === true;
      case 'customers':
        return limitations.canCreate;
      case 'reports':
      case 'analytics':
        return limitations.canAdvanced;
      case 'advanced':
        return limitations.canAdvanced;
      case 'export':
        return limitations.canExport;
      default:
        return true;
    }
  };

  const canCreateRecords = (): boolean => {
    if (isSuperAdmin) return true;
    if (!isLicenseActive || isTrialExpired) return false;
    if (limitations.maxRecords !== -1 && currentRecords >= limitations.maxRecords) return false;
    return limitations.canCreate;
  };

  const canEditRecords = (): boolean => {
    if (isSuperAdmin) return true;
    if (!isLicenseActive || isTrialExpired) return false;
    return limitations.canEdit;
  };

  const canDeleteRecords = (): boolean => {
    if (isSuperAdmin) return true;
    if (!isLicenseActive || isTrialExpired) return false;
    return limitations.canDelete;
  };

  const canExportData = (): boolean => {
    if (isSuperAdmin) return true;
    if (!isLicenseActive || isTrialExpired) return false;
    return limitations.canExport;
  };

  const canAccessAdvancedFeatures = (): boolean => {
    if (isSuperAdmin) return true;
    if (!isLicenseActive || isTrialExpired) return false;
    return limitations.canAdvanced;
  };

  return {
    canAccessFeature,
    canCreateRecords,
    canEditRecords,
    canDeleteRecords,
    canExportData,
    canAccessAdvancedFeatures,
    maxRecords: limitations.maxRecords,
    currentRecords,
    isTrialExpired,
    daysLeftInTrial
  };
};

export default useAccessControl;
