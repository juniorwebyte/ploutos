/**
 * Módulo Principal de Controle de Ponto
 * Gerencia navegação entre diferentes views do sistema
 */

import React, { useState, useEffect } from 'react';
import TimeClockDashboard from './TimeClockDashboard';
import SubscriptionBlock from './SubscriptionBlock';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../contexts/AuthContext';
import EmployeeManagement from './EmployeeManagement';
import BranchManagement from './BranchManagement';
import WorkScheduleManagement from './WorkScheduleManagement';
import TimeClockRegister from './TimeClockRegister';
import TimeClockRecords from './TimeClockRecords';
import JustificationsManagement from './JustificationsManagement';
import TimeClockReports from './TimeClockReports';
import TimeClockSettings from './TimeClockSettings';
import CompanyManagement from './CompanyManagement';
import DepartmentManagement from './DepartmentManagement';
import TimeClockManagement from './TimeClockManagement';
import EmployeePortal from './EmployeePortal';
import ExecutiveReports from './ExecutiveReports';

interface TimeClockModuleProps {
  onBack?: () => void;
  onSubscribe?: () => void; // Callback para quando clicar em "Assinar Agora"
}

type View = 'dashboard' | 'employees' | 'branches' | 'schedules' | 'register' | 'records' | 'justifications' | 'reports' | 'settings' | 'companies' | 'departments' | 'management' | 'portal' | 'executive';

export default function TimeClockModule({ onBack, onSubscribe }: TimeClockModuleProps) {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showSubscriptionBlock, setShowSubscriptionBlock] = useState(false);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | undefined>();

  // Verificar acesso ao módulo
  const { hasAccess, isLoading, isDemoMode, isSuperAdmin, checkAccess } = useSubscription('timeclock', currentCompanyId);

  // Carregar companyId do primeiro funcionário ou empresa disponível
  useEffect(() => {
    const loadCompanyId = async () => {
      try {
        const { employeeService, companyService } = await import('../services/timeClockService');
        const employees = await employeeService.getAll().catch(() => []);
        const companies = await companyService.getAll().catch(() => []);
        
        if (employees.length > 0 && employees[0].companyId) {
          setCurrentCompanyId(employees[0].companyId);
        } else if (companies.length > 0) {
          setCurrentCompanyId(companies[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar companyId:', error);
      }
    };
    loadCompanyId();
  }, []);

  // Verificar acesso quando companyId mudar
  useEffect(() => {
    if (currentCompanyId) {
      checkAccess();
    }
  }, [currentCompanyId, checkAccess]);

  const handleNavigate = (view: string) => {
    // Super Admin tem acesso total, sem bloqueios
    if (isSuperAdmin) {
      setCurrentView(view as View);
      return;
    }

    // Em modo demo, permitir navegação
    if (isDemoMode) {
      setCurrentView(view as View);
      return;
    }

    // Verificar acesso antes de navegar (apenas para clientes)
    if (!hasAccess && !isLoading) {
      setShowSubscriptionBlock(true);
      return;
    }

    setCurrentView(view as View);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <TimeClockDashboard onNavigate={handleNavigate} />;
      case 'employees':
        return <EmployeeManagement onBack={() => setCurrentView('dashboard')} />;
      case 'branches':
        return <BranchManagement onBack={() => setCurrentView('dashboard')} />;
      case 'schedules':
        return <WorkScheduleManagement onBack={() => setCurrentView('dashboard')} />;
      case 'register':
        return <TimeClockRegister onBack={() => setCurrentView('dashboard')} />;
      case 'records':
        return <TimeClockRecords onBack={() => setCurrentView('dashboard')} />;
      case 'justifications':
        return <JustificationsManagement onBack={() => setCurrentView('dashboard')} />;
      case 'reports':
        return <TimeClockReports onBack={() => setCurrentView('dashboard')} />;
      case 'settings':
        return <TimeClockSettings onBack={() => setCurrentView('dashboard')} />;
      case 'companies':
        return <CompanyManagement onBack={() => setCurrentView('dashboard')} />;
      case 'departments':
        return <DepartmentManagement onBack={() => setCurrentView('dashboard')} />;
      case 'management':
        return <TimeClockManagement onBack={() => setCurrentView('dashboard')} />;
      case 'portal':
        return <EmployeePortal onBack={() => setCurrentView('dashboard')} />;
      case 'executive':
        return <ExecutiveReports onBack={() => setCurrentView('dashboard')} />;
      default:
        return <TimeClockDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      {showSubscriptionBlock && (
        <SubscriptionBlock
          module="timeclock"
          companyId={currentCompanyId}
          onSubscribe={() => {
            console.log('🔔 onSubscribe chamado no TimeClockModule', { hasCallback: !!onSubscribe });
            // Usar callback se fornecido, senão tentar abrir PaymentModal
            if (onSubscribe) {
              console.log('✅ Chamando callback onSubscribe');
              // Não fechar o SubscriptionBlock imediatamente - deixar o PaymentModal abrir primeiro
              // O PaymentModal vai fechar o SubscriptionBlock quando abrir
              onSubscribe();
            } else {
              console.warn('⚠️ onSubscribe não fornecido, disparando evento');
              // Fallback: tentar encontrar e abrir modal de pagamento
              const event = new CustomEvent('ploutos:open-payment', { 
                detail: { module: 'timeclock' } 
              });
              window.dispatchEvent(event);
              setShowSubscriptionBlock(false);
            }
          }}
          onClose={() => setShowSubscriptionBlock(false)}
          showCloseButton={true}
        />
      )}

      <div 
        className="w-full min-h-screen relative bg-transparent" 
        style={{ 
          zIndex: 50, 
          position: 'relative',
          marginTop: '-80px',
          paddingTop: '80px',
        }}
      >
        {/* Indicador de modo demo (apenas para clientes e demo) */}
        {isDemoMode && !isSuperAdmin && (
          <div className="bg-yellow-100 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
              <strong>MODO DEMONSTRAÇÃO:</strong> Esta é uma visualização do sistema. Funcionalidades reais estão bloqueadas.
            </p>
          </div>
        )}

        {/* Indicador de bloqueio (apenas para clientes, não para Super Admin) */}
        {!isLoading && !hasAccess && !isDemoMode && !isSuperAdmin && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2">
            <p className="text-sm text-red-800 dark:text-red-200 text-center">
              <strong>MÓDULO BLOQUEADO:</strong> Este módulo requer assinatura ativa. 
              <button
                onClick={() => setShowSubscriptionBlock(true)}
                className="ml-2 underline font-semibold"
              >
                Assinar agora
              </button>
            </p>
          </div>
        )}

        {renderView()}
      </div>
    </>
  );
}

