import React, { useState, useEffect } from 'react';
import { 
  Building, 
  LogOut, 
  Settings, 
  BarChart3, 
  Package, 
  CreditCard, 
  Users, 
  Bell,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  FileText,
  Calendar,
  ArrowLeft,
  Crown,
  Lock,
  X,
  Star,
  CheckCircle,
  Calculator
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAccessControl } from '../hooks/useAccessControl';
import CashFlow from './CashFlow';
import OwnerPanel from './OwnerPanel';
import AccessLimitationModal from './AccessLimitationModal';
import PaymentModal from './PaymentModal';
import PaymentPage from './PaymentPage';
import SubscriptionExpirationNotification from './SubscriptionExpirationNotification';
import CadernoNotas from './CadernoNotas';
import CashFlowUnlockRequest from './CashFlowUnlockRequest';
import LicenseKeyInput from './LicenseKeyInput';
import FinancialTools from './FinancialTools';
import SubscriptionActivation from './SubscriptionActivation';
import { CompanyConfig } from '../types';
import plansService, { PlanRecord } from '../services/plansService';

interface ClientDashboardProps {
  onBackToLogin: () => void;
}

function ClientDashboard({ onBackToLogin }: ClientDashboardProps) {
  const { logout, user, role, license } = useAuth();
  // Toggle de visibilidade do menu com persistência
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(() => {
    const stored = localStorage.getItem('sidebarVisible_client');
    return stored === null ? true : stored === 'true';
  });
  useEffect(() => {
    localStorage.setItem('sidebarVisible_client', String(sidebarVisible));
  }, [sidebarVisible]);
  const accessControl = useAccessControl();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accessState, setAccessState] = useState<Record<string, boolean>>({});
  const [isAccessLoaded, setIsAccessLoaded] = useState(false);
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);
  const [plans, setPlans] = useState<PlanRecord[]>(plansService.getPlans());
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  
  // Carregar planos atualizados
  useEffect(() => {
    const unsub = plansService.subscribe((updated) => setPlans(updated));
    return () => unsub();
  }, []);
  
  // Atualizar estado de acesso quando accessControl mudar - FORÇAR ATUALIZAÇÃO IMEDIATA
  useEffect(() => {
    const updateAccess = () => {
      const newState: Record<string, boolean> = {};
      menuItems.forEach((item) => {
        if ((item as any).requiresAccess) {
          const feature = (item as any).requiresAccess;
          newState[feature] = accessControl.canAccessFeature(feature);
        }
      });
      setAccessState(newState);
      setIsAccessLoaded(true);
    };
    
    // Atualizar imediatamente
    updateAccess();
    
    // E também após um pequeno delay para garantir
    const timer = setTimeout(updateAccess, 50);
    return () => clearTimeout(timer);
  }, [accessControl, accessControl.canAccessFeature]);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [showLimitationModal, setShowLimitationModal] = useState(false);
  const [limitationType, setLimitationType] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [showSubscriptionActivation, setShowSubscriptionActivation] = useState(false);

  useEffect(()=>{
    const subs = JSON.parse(localStorage.getItem('demo_subscriptions')||'[]');
    const last = subs[subs.length-1] || null;
    setHasActiveSubscription(!!last);
    
    // Verificar se há TXID pendente para ativação
    const pendingTxid = localStorage.getItem('pending_subscription_txid');
    if (pendingTxid && !last) {
      setShowSubscriptionActivation(true);
    }
  }, []);

  // Verificar expiração de licença periodicamente
  useEffect(() => {
    const checkLicenseExpiration = () => {
      if (!user) return;
      
      try {
        const allLicenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
        const userLicense = allLicenses.find((l: any) => 
          l.username === user || l.userId === user
        );
        
        if (userLicense && userLicense.expiresAt) {
          const expiresAt = new Date(userLicense.expiresAt);
          const now = new Date();
          
          // Se expirou, atualizar status
          if (expiresAt <= now && userLicense.status !== 'expired') {
            userLicense.status = 'expired';
            const updatedLicenses = allLicenses.map((l: any) => 
              l.id === userLicense.id ? userLicense : l
            );
            localStorage.setItem('ploutos_licenses', JSON.stringify(updatedLicenses));
            // Recarregar para aplicar bloqueio
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar expiração:', error);
      }
    };

    checkLicenseExpiration();
    const interval = setInterval(checkLicenseExpiration, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [user]);

  // Listener para atualizar quando licença for aprovada
  useEffect(() => {
    const handleLicenseApproved = (event: CustomEvent) => {
      const { username, licenseKey, expiresAt } = event.detail;
      const currentUser = localStorage.getItem('caixa_user');
      
      if (currentUser === username) {
        // NÃO ativar automaticamente - apenas notificar que a chave está disponível
        // Recarregar página para mostrar a chave aprovada no painel
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        alert(`✅ Licença Aprovada!\n\nSua solicitação de 30 dias grátis foi aprovada!\n\nChave: ${licenseKey}\nVálida até: ${new Date(expiresAt).toLocaleDateString('pt-BR')}\n\n📋 A chave está disponível em "Meu Plano" no seu painel.\n\n⚠️ IMPORTANTE: Você precisa ativar a chave manualmente para começar o teste de 30 dias!`);
      }
    };

    const handleLicenseStatusChanged = (event: CustomEvent) => {
      const { username, status } = event.detail;
      const currentUser = localStorage.getItem('caixa_user');
      
      if (currentUser === username) {
        if (status === 'suspended') {
          alert(`⛔ Licença Suspensa\n\nSua licença foi suspensa pelo administrador.\n\nO acesso ao Gerenciamento de Caixa foi bloqueado.\n\nEntre em contato com o suporte para mais informações.`);
        } else if (status === 'active' || status === 'trial') {
          alert(`✅ Licença Reativada\n\nSua licença foi reativada pelo administrador.\n\nO acesso ao Gerenciamento de Caixa foi liberado!`);
        }
        
        // Recarregar página para atualizar acesso
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    window.addEventListener('cashflowUnlockApproved', handleLicenseApproved as EventListener);
    window.addEventListener('licenseStatusChanged', handleLicenseStatusChanged as EventListener);
    
    return () => {
      window.removeEventListener('cashflowUnlockApproved', handleLicenseApproved as EventListener);
      window.removeEventListener('licenseStatusChanged', handleLicenseStatusChanged as EventListener);
    };
  }, []);

  // Dados do dashboard (zerados para apresentação)
  const dashboardData = {
    totalVendas: 0,
    vendasHoje: 0,
    clientesAtivos: 0,
    produtosEstoque: 0,
    crescimentoVendas: 0,
    ticketMedio: 0
  };

  const handlePremiumFeatureClick = (feature: string) => {
    if (!accessControl.canAccessFeature(feature)) {
      setLimitationType(feature);
      setShowLimitationModal(true);
      return;
    }
    // Se tem acesso, permitir navegação
    setActiveTab(feature);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'blue' },
    { id: 'caixa', label: 'Movimento de Caixa', icon: DollarSign, color: 'green', requiresAccess: 'cashflow' },
    { id: 'ferramentas-financeiras', label: 'Ferramentas Financeiras', icon: Calculator, color: 'indigo' },
    { id: 'notas', label: 'Notas Fiscais', icon: FileText, color: 'teal', premium: true, requiresAccess: 'notas' },
    { id: 'vendas', label: 'Vendas', icon: ShoppingCart, color: 'purple', premium: true, requiresAccess: 'advanced' },
    { id: 'estoque', label: 'Estoque', icon: Package, color: 'orange', premium: true, requiresAccess: 'advanced' },
    { id: 'clientes', label: 'Clientes', icon: Users, color: 'pink', requiresAccess: 'customers' },
    { id: 'relatorios', label: 'Relatórios', icon: FileText, color: 'indigo', premium: true, requiresAccess: 'reports' },
    { id: 'meuplano', label: 'Meu Plano', icon: CreditCard, color: 'green' },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, color: 'gray' }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      teal: 'from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
      gray: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const handleLogout = () => {
    logout();
    onBackToLogin();
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="row g-4">
        <div className="col-md-6 col-lg-3">
          <div className="group bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 border border-blue-400/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
          <div className="flex items-center justify-between">
            <div>
                <p className="text-blue-100 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Vendas Hoje</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {dashboardData.vendasHoje > 0 ? (
                    `R$ ${dashboardData.vendasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  ) : (
                    'R$ 0,00'
                  )}
                </p>
                <p className="text-blue-200 text-xs mt-2 flex items-center gap-1">
                  {dashboardData.crescimentoVendas > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3" />
                      +{dashboardData.crescimentoVendas}% vs ontem
                    </>
                  ) : (
                    <span className="opacity-75">Aguardando dados</span>
                  )}
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10">
                <TrendingUp className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="group bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 border border-green-400/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
          <div className="flex items-center justify-between">
            <div>
                <p className="text-green-100 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Total Vendas</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {dashboardData.totalVendas > 0 ? (
                    `R$ ${dashboardData.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  ) : (
                    'R$ 0,00'
                  )}
                </p>
                <p className="text-green-200 text-xs mt-2">Período atual</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="group bg-gradient-to-r from-purple-500 via-indigo-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 border border-purple-400/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
          <div className="flex items-center justify-between">
            <div>
                <p className="text-purple-100 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Clientes Ativos</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {dashboardData.clientesAtivos > 0 ? dashboardData.clientesAtivos : '0'}
                </p>
                <p className="text-purple-200 text-xs mt-2">
                  {dashboardData.clientesAtivos > 0 ? 'Clientes cadastrados' : 'Nenhum cliente ainda'}
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10">
                <Users className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="group bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 border border-orange-400/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
          <div className="flex items-center justify-between">
            <div>
                <p className="text-orange-100 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Produtos em Estoque</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {dashboardData.produtosEstoque > 0 ? dashboardData.produtosEstoque : '0'}
                </p>
                <p className="text-orange-200 text-xs mt-2">
                  {dashboardData.produtosEstoque > 0 ? 'Itens disponíveis' : 'Estoque vazio'}
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10">
                <Package className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e Relatórios */}
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Crescimento de Vendas</h3>
            <div className="flex items-center justify-center h-40 bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 rounded-xl border border-green-100">
              <div className="text-center">
                {dashboardData.crescimentoVendas > 0 ? (
                  <>
                    <p className="text-4xl font-bold text-green-600 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>+{dashboardData.crescimentoVendas}%</p>
                    <p className="text-gray-600 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Este mês</p>
                  </>
                ) : (
            <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Dados aparecerão aqui</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Ticket Médio</h3>
            <div className="flex items-center justify-center h-40 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-xl border border-purple-100">
              <div className="text-center">
                {dashboardData.ticketMedio > 0 ? (
                  <>
                    <p className="text-4xl font-bold text-purple-600 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>R$ {dashboardData.ticketMedio.toFixed(2)}</p>
                    <p className="text-gray-600 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Por venda</p>
                  </>
                ) : (
            <div className="text-center">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Dados aparecerão aqui</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Ações Rápidas</h3>
        <div className="row g-3">
          <div className="col-6 col-md-3">
          <button 
            onClick={() => {
              if (!accessControl.canAccessFeature('cashflow')) {
                setLimitationType('cashflow');
                setShowLimitationModal(true);
                return;
              }
              setActiveTab('caixa');
            }}
              className="w-full flex flex-col items-center p-5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-green-400/20 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Abrir sistema de movimento de caixa"
          >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                <DollarSign className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Abrir Caixa</span>
          </button>
          </div>
          
          <div className="col-6 col-md-3">
          <button 
            onClick={() => setActiveTab('vendas')}
              className="w-full flex flex-col items-center p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-blue-400/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Abrir módulo de vendas"
          >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                <ShoppingCart className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Nova Venda</span>
          </button>
          </div>
          
          <div className="col-6 col-md-3">
          <button 
            onClick={() => setActiveTab('estoque')}
              className="w-full flex flex-col items-center p-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-orange-400/20 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              aria-label="Abrir módulo de gestão de estoque"
          >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                <Package className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Gerenciar Estoque</span>
          </button>
          </div>
          
          <div className="col-6 col-md-3">
          <button 
            onClick={() => {
              if (!accessControl.canAccessFeature('notas')) {
                setLimitationType('notas');
                setShowLimitationModal(true);
                return;
              }
              setActiveTab('notas');
            }}
              className={`w-full flex flex-col items-center p-5 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border ${
                accessControl.canAccessFeature('notas')
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 border-teal-400/20'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 border-amber-400/20 opacity-75'
              }`}
          >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                {!accessControl.canAccessFeature('notas') ? (
                  <Lock className="w-6 h-6" />
                ) : (
                  <FileText className="w-6 h-6" />
                )}
              </div>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Notas Fiscais</span>
          </button>
          </div>
          
          <div className="col-6 col-md-3">
          <button 
            onClick={() => setActiveTab('relatorios')}
              className="w-full flex flex-col items-center p-5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-purple-400/20"
          >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                <BarChart3 className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Relatórios</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMeuPlano = () => {
    const subs = JSON.parse(localStorage.getItem('demo_subscriptions')||'[]');
    const last = subs[subs.length-1] || null;
    
    // Informações da licença atual
    const licenseStatus = license?.status || 'inactive';
    const licenseKey = license?.key || 'Não configurada';
    const licensePlan = license?.planName || 'Nenhum';
    const licenseExpires = license?.expiresAt;
    const licenseCreated = license?.createdAt;
    
    return (
      <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>Minha Assinatura e Licença</h2>
        
        {/* Seção de Licença */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Informações da Licença</h3>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="p-6 rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 hover:shadow-lg transition-all duration-300">
                <div className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Status da Licença</div>
                <div className={`text-2xl font-semibold mb-2 ${
                  licenseStatus === 'active' ? 'text-green-700' : 
                  licenseStatus === 'trial' ? 'text-blue-700' : 
                  'text-red-700'
                }`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {licenseStatus === 'active' ? 'Ativa' : 
                   licenseStatus === 'trial' ? 'Trial' : 
                   'Inativa'}
                </div>
                <div className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {licenseStatus === 'active' && licenseExpires ? 
                    `Válida até ${new Date(licenseExpires).toLocaleDateString('pt-BR')}` :
                   licenseStatus === 'pending' ? 'Aguardando ativação' :
                   licenseStatus === 'expired' ? 'Licença expirada' :
                   licenseStatus === 'suspended' ? 'Licença suspensa' :
                   'Sem licença ativa'}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-6 rounded-2xl border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 hover:shadow-lg transition-all duration-300">
                <div className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Chave de Licença</div>
                <div className="text-lg font-mono break-all text-gray-900 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>{licenseKey}</div>
                <div className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Use esta chave para reativar em outro dispositivo</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-6 rounded-2xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all duration-300">
                <div className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Plano da Licença</div>
                <div className="text-2xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{licensePlan}</div>
                {licenseCreated && (
                  <div className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Criada em {new Date(licenseCreated).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-6 rounded-2xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-lg transition-all duration-300">
                <div className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Validade</div>
                <div className="text-2xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {licenseExpires ? new Date(licenseExpires).toLocaleDateString('pt-BR') : 'Não definida'}
                </div>
                <div className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {licenseExpires && new Date(licenseExpires) > new Date() ? 
                    `${Math.ceil((new Date(licenseExpires).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias restantes` :
                    licenseStatus === 'active' ? 'Renovação automática' : 'Sem validade'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Assinatura (se houver) */}
        {last && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Informações da Assinatura</h3>
            <div className="row g-4">
              <div className="col-md-6">
                <div className="p-6 rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all duration-300">
                  <div className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Plano</div>
                  <div className="text-2xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{last.plan?.name || 'Demo'}</div>
                  <div className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Periodicidade: {last.plan?.interval==='yearly'?'Anual':'Mensal'}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-6 rounded-2xl border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-lg transition-all duration-300">
                  <div className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Status</div>
                  <div className="text-2xl font-semibold text-green-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Ativo</div>
                  <div className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>TXID: {last.txid}</div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-6 rounded-2xl border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all duration-300">
                  <div className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Valor</div>
                  <div className="text-2xl font-semibold text-blue-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>R$ {((last.plan?.priceCents||2999)/100).toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
                  {last.discountPct? <div className="text-xs text-emerald-700 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Desconto: {last.discountPct}%</div>: null}
                </div>
              </div>
              <div className="col-md-6">
                <div className="p-6 rounded-2xl border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 hover:shadow-lg transition-all duration-300">
                  <div className="text-gray-600 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Início</div>
                  <div className="text-2xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{new Date(last.createdAt).toLocaleDateString('pt-BR')}</div>
                  <div className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>Renovação automática (demo)</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {!last && !license && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 mb-6">
            <p className="text-gray-600 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Nenhuma assinatura ou licença encontrada.</p>
          </div>
        )}
        
        {/* Chave Aprovada Pendente de Ativação */}
        {(() => {
          const currentUser = localStorage.getItem('caixa_user');
          const approvedKeys = JSON.parse(localStorage.getItem('approved_license_keys') || '[]');
          const userApprovedKey = approvedKeys.find((k: any) => k.username === currentUser && k.status === 'pending_activation');
          
          if (userApprovedKey && !accessControl.canAccessFeature('cashflow')) {
            return (
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-2xl p-6 mb-6 shadow-xl animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-green-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Chave de Licença Aprovada!
                    </h3>
                    <p className="text-sm text-green-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Sua solicitação foi aprovada. Ative sua licença de 30 dias grátis agora!
                    </p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 mb-4 border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Sua Chave de Licença:</p>
                      <p className="text-lg font-mono font-bold text-gray-900 break-all" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {userApprovedKey.licenseKey}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(userApprovedKey.licenseKey);
                        alert('✅ Chave copiada para área de transferência!');
                      }}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                      aria-label="Copiar chave de licença para área de transferência"
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Válida até: {new Date(userApprovedKey.expiresAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Como ativar:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Ativar no Painel (Recomendado)
                        </p>
                        <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Use o campo abaixo para inserir a chave e ativar manualmente
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          Ativar na Landing Page (Automático)
                        </p>
                        <p className="text-xs text-gray-600 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Vá para a landing page, cole a chave no validador e o sistema ativará automaticamente
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Solicitação de Desbloqueio do Gerenciamento de Caixa */}
        {!accessControl.canAccessFeature('cashflow') && (
          <>
            <CashFlowUnlockRequest />
            <LicenseKeyInput onLicenseActivated={() => {
              // Marcar chave como ativada
              const currentUser = localStorage.getItem('caixa_user');
              const approvedKeys = JSON.parse(localStorage.getItem('approved_license_keys') || '[]');
              const updatedKeys = approvedKeys.map((k: any) =>
                k.username === currentUser && k.status === 'pending_activation'
                  ? { ...k, status: 'activated', activatedAt: new Date().toISOString() }
                  : k
              );
              localStorage.setItem('approved_license_keys', JSON.stringify(updatedKeys));
              
              // Recarregar acesso após ativação
              window.location.reload();
            }} />
          </>
        )}
        
        {/* Seção de Planos Disponíveis */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Planos Disponíveis</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.filter(plan => plan && plan.name && plan.priceCents).map((plan) => (
              <div 
                key={plan.id} 
                className={`group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 ${
                  plan.isRecommended 
                    ? 'border-2 border-emerald-500 ring-4 ring-emerald-100 scale-105 shadow-2xl shadow-emerald-500/20' 
                    : 'border border-gray-200 hover:border-emerald-300'
                }`}
              >
                {plan.isRecommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-xl shadow-emerald-500/50 animate-pulse-glow">
                      <Star className="h-4 w-4 fill-current animate-pulse" />
                      Mais Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">R$ {(plan.priceCents / 100).toFixed(2).replace('.', ',')}</span>
                    <span className="text-gray-600 text-lg">/{plan.interval === 'monthly' ? 'mês' : 'ano'}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {plan.featuresList && plan.featuresList.length > 0 ? (
                    plan.featuresList.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{plan.features || 'Recursos completos do sistema'}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { 
                    if(plan && plan.name) {
                      setSelectedPlan(plan); 
                      setShowPaymentPage(true); 
                    }
                  }}
                  className={`group w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    plan.isRecommended
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 shadow-xl hover:shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 focus:ring-emerald-500'
                      : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg focus:ring-gray-500'
                  }`}
                  aria-label={`Assinar plano ${plan.name}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                  <span className="relative z-10">Assinar Agora</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button 
            onClick={() => {
            if (!accessControl.canAccessFeature('cashflow')) {
              setLimitationType('cashflow');
              setShowLimitationModal(true);
              return;
            }
            setActiveTab('caixa');
            }} 
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Ir para o Caixa
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'ferramentas-financeiras':
        return <FinancialTools />;
      case 'caixa':
        return <CashFlow isDemo={false} onBackToLanding={() => setActiveTab('dashboard')} />;
      case 'notas':
        if (!accessControl.canAccessFeature('notas')) {
          return (
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-amber-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Gerenciamento de Notas Fiscais</h2>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Funcionalidade premium</p>
                </div>
                <Crown className="h-5 w-5 text-amber-500 ml-auto" />
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                <p className="text-amber-800 font-semibold mb-2 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>🔒 Funcionalidade Premium</p>
                <p className="text-amber-700 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>O gerenciamento completo de notas fiscais está disponível apenas para usuários com plano ativo. Controle todas as suas notas fiscais de forma profissional.</p>
                <ul className="list-disc list-inside text-amber-700 text-sm space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <li>Cadastro completo de notas fiscais</li>
                  <li>Gestão de parcelas e vencimentos</li>
                  <li>Relatórios e exportação</li>
                  <li>Alertas de vencimento</li>
                </ul>
              </div>
              <button 
                onClick={() => setActiveTab('meuplano')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Ver Planos Disponíveis
              </button>
            </div>
          );
        }
        return <CadernoNotas onBackToLanding={() => setActiveTab('dashboard')} />;
      case 'meuplano':
        return renderMeuPlano();
      case 'vendas':
        if (!accessControl.canAccessFeature('advanced')) {
          return (
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-amber-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Gestão de Vendas</h2>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Funcionalidade premium</p>
                </div>
                <Crown className="h-5 w-5 text-amber-500 ml-auto" />
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                <p className="text-amber-800 font-semibold mb-2 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>🔒 Funcionalidade Premium</p>
                <p className="text-amber-700 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Este módulo está disponível apenas para usuários com plano ativo. Desbloqueie todas as funcionalidades avançadas.</p>
                <ul className="list-disc list-inside text-amber-700 text-sm space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <li>Controle completo de vendas</li>
                  <li>Relatórios avançados</li>
                  <li>Integrações com PDV</li>
                </ul>
              </div>
              <button 
                onClick={() => setActiveTab('meuplano')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Ver Planos Disponíveis
              </button>
            </div>
          );
        }
        return (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Gestão de Vendas</h2>
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Módulo em desenvolvimento</p>
              <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Em breve você poderá gerenciar todas as suas vendas aqui</p>
            </div>
          </div>
        );
      case 'estoque':
        if (!accessControl.canAccessFeature('advanced')) {
          return (
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-amber-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Gestão de Estoque</h2>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Funcionalidade premium</p>
                </div>
                <Crown className="h-5 w-5 text-amber-500 ml-auto" />
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                <p className="text-amber-800 font-semibold mb-2 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>🔒 Funcionalidade Premium</p>
                <p className="text-amber-700 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Este módulo está disponível apenas para usuários com plano ativo. Gerencie seu estoque de forma profissional.</p>
                <ul className="list-disc list-inside text-amber-700 text-sm space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <li>Controle de entrada e saída</li>
                  <li>Alertas de estoque baixo</li>
                  <li>Relatórios detalhados</li>
                </ul>
              </div>
              <button 
                onClick={() => setActiveTab('meuplano')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Ver Planos Disponíveis
              </button>
            </div>
          );
        }
        return (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Gestão de Estoque</h2>
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Módulo em desenvolvimento</p>
              <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Em breve você poderá gerenciar todo o seu estoque aqui</p>
            </div>
          </div>
        );
      case 'clientes':
        if (!accessControl.canAccessFeature('customers')) {
          return (
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-amber-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Gestão de Clientes</h2>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Funcionalidade limitada</p>
                </div>
                <Crown className="h-5 w-5 text-amber-500 ml-auto" />
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                <p className="text-amber-800 font-semibold mb-2 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>🔒 Funcionalidade Limitada</p>
                <p className="text-amber-700 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Este módulo está limitado para usuários sem plano ativo. Upgrade para acessar todas as funcionalidades.</p>
                <ul className="list-disc list-inside text-amber-700 text-sm space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <li>Cadastro ilimitado de clientes</li>
                  <li>Histórico completo de compras</li>
                  <li>Comunicação integrada</li>
                </ul>
              </div>
              <button 
                onClick={() => setActiveTab('meuplano')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Ver Planos Disponíveis
              </button>
            </div>
          );
        }
        return (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Gestão de Clientes</h2>
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Módulo em desenvolvimento</p>
              <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Em breve você poderá gerenciar todos os seus clientes aqui</p>
            </div>
          </div>
        );
      case 'relatorios':
        if (!accessControl.canAccessFeature('reports')) {
          return (
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-amber-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Lock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>Relatórios</h2>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Funcionalidade premium</p>
                </div>
                <Crown className="h-5 w-5 text-amber-500 ml-auto" />
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                <p className="text-amber-800 font-semibold mb-2 text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>🔒 Funcionalidade Premium</p>
                <p className="text-amber-700 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>Relatórios avançados estão disponíveis apenas para usuários com plano ativo. Tenha insights completos do seu negócio.</p>
                <ul className="list-disc list-inside text-amber-700 text-sm space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <li>Relatórios personalizados</li>
                  <li>Exportação em PDF/Excel</li>
                  <li>Análises em tempo real</li>
                </ul>
              </div>
              <button 
                onClick={() => setActiveTab('meuplano')}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Ver Planos Disponíveis
              </button>
            </div>
          );
        }
        return (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Relatórios</h2>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Módulo em desenvolvimento</p>
              <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Em breve você poderá gerar relatórios completos aqui</p>
            </div>
          </div>
        );
      case 'configuracoes':
        return (
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Configurações da Loja</h2>
            <div className="text-center py-12">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Módulo em desenvolvimento</p>
              <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Em breve você poderá configurar todas as opções da sua loja aqui</p>
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <img 
                  src="/logo_header.png" 
                  alt="PloutosLedger Logo" 
                  className="h-16 sm:h-20 w-auto object-contain relative z-10 drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300 filter brightness-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              </div>
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hidden">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>PloutosLedger</h1>
                <p className="text-sm text-gray-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Dashboard da Loja</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Bem-vindo,</p>
                <p className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins, sans-serif' }}>{user}</p>
              </div>
              
              <button
                onClick={() => setShowOwnerPanel(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
                aria-label="Abrir painel de configurações"
              >
                <Settings className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Configurações</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="group flex items-center space-x-2 bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:via-red-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 hover:-translate-y-1 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
                aria-label="Fazer logout do sistema"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {!hasActiveSubscription && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200 text-amber-800 text-sm px-6 py-3 flex items-center justify-between shadow-sm">
          <div style={{ fontFamily: 'Inter, sans-serif' }}>
            Sua conta está em modo de teste. Para continuar usando sem limitações, contrate um plano.
          </div>
          <button 
            onClick={() => setActiveTab('meuplano')} 
            className="group px-4 py-2 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 text-white rounded-xl hover:from-amber-700 hover:via-orange-700 hover:to-yellow-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 hover:-translate-y-1 relative overflow-hidden"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
            <span className="relative z-10">Assinar agora</span>
          </button>
        </div>
      )}

      <div className="flex">
        {/* Sidebar Desktop controlada por toggle */}
        <aside className={`${sidebarVisible ? 'hidden lg:block' : 'hidden'} w-64 bg-white/95 backdrop-blur-sm shadow-xl border-r border-gray-100 min-h-screen sticky top-0`} aria-label="Menu de navegação principal">
          <nav className="p-4" role="navigation">
            <ul className="space-y-2" role="list">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const requiresAccess = (item as any).requiresAccess;
                // SEMPRE verificar acesso diretamente, não depender apenas do estado
                const hasAccess = !requiresAccess || accessControl.canAccessFeature(requiresAccess);
                const isLocked = requiresAccess && !hasAccess;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        if (isLocked) {
                          handlePremiumFeatureClick((item as any).requiresAccess);
                        } else {
                          setActiveTab(item.id);
                        }
                      }}
                      title={isLocked ? 'Funcionalidade limitada - clique para ver planos' : ''}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isActive
                          ? `bg-gradient-to-r ${getColorClasses(item.color)} text-white shadow-lg transform scale-105 focus:ring-white`
                          : isLocked 
                            ? 'text-amber-500 hover:bg-amber-50 border border-amber-200 relative hover:shadow-md focus:ring-amber-500' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-md focus:ring-gray-500'
                      }`}
                      style={{ fontFamily: isActive ? 'Poppins, sans-serif' : 'Inter, sans-serif' }}
                      aria-label={isLocked ? `${item.label} - Funcionalidade limitada` : item.label}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className={`w-5 h-5 ${isLocked ? 'opacity-60' : ''}`} aria-hidden="true" />
                      <span className={`font-medium ${isLocked ? 'opacity-60' : ''}`}>{item.label}</span>
                      {isLocked && (
                        <Lock className="w-4 h-4 text-amber-500 ml-auto" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Sidebar Mobile (off-canvas) */}
        <div className={`${sidebarVisible ? 'fixed' : 'hidden'} lg:hidden inset-0 z-50`}>
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarVisible(false)}></div>
          <aside className="absolute left-0 top-0 w-64 h-full bg-white shadow-xl">
            <nav className="p-4 overflow-y-auto h-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold">Menu</h2>
                <button 
                  onClick={() => setSidebarVisible(false)} 
                  className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" 
                  title="Fechar menu"
                  aria-label="Fechar menu de navegação"
                >
                  <X className="w-5 h-5" aria-hidden="true"/>
                </button>
              </div>
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const requiresAccess = (item as any).requiresAccess;
                  // SEMPRE verificar acesso diretamente
                  const hasAccess = !requiresAccess || accessControl.canAccessFeature(requiresAccess);
                  const isLocked = requiresAccess && !hasAccess;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setSidebarVisible(false);
                          if (isLocked) {
                            handlePremiumFeatureClick((item as any).requiresAccess);
                          } else {
                            setActiveTab(item.id);
                          }
                        }}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                      >
                        <Icon className={`w-5 h-5 ${isLocked ? 'opacity-60' : ''}`} />
                        <span className={`font-medium ${isLocked ? 'opacity-60' : ''}`}>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto">
          {renderContent()}
          </div>
        </main>
      </div>

      {/* Painel do Proprietário */}
      <OwnerPanel
        isOpen={showOwnerPanel}
        onClose={() => setShowOwnerPanel(false)}
        onConfigUpdate={(config) => setCompanyConfig(config)}
      />
      
      {/* Modal de Limitação de Acesso */}
      <AccessLimitationModal
        isOpen={showLimitationModal}
        onClose={() => setShowLimitationModal(false)}
        onUpgrade={() => {
          setShowLimitationModal(false);
          // Buscar o plano Starter do array de planos
          const starterPlan = plans.find(p => p.name === 'Starter' || p.id === 'p2');
          if (starterPlan) {
            setSelectedPlan(starterPlan);
            setShowPaymentModal(true);
          } else {
            // Se não encontrar, redirecionar para a aba de planos
            setActiveTab('meuplano');
          }
        }}
        limitation={{
          maxRecords: accessControl.maxRecords,
          currentRecords: accessControl.currentRecords,
          isTrialExpired: accessControl.isTrialExpired,
          daysLeftInTrial: accessControl.daysLeftInTrial
        }}
      />

      {/* Modal de Pagamento (PIX/Cartão) dentro do painel */}
      <PaymentModal
        isOpen={showPaymentModal}
        selectedPlan={selectedPlan || undefined}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={(data)=>{
          // salvar assinatura demo/local
          const subs = JSON.parse(localStorage.getItem('demo_subscriptions')||'[]');
          subs.push({ txid: data?.cobranca?.txid || String(Date.now()), plan: selectedPlan, createdAt: new Date().toISOString(), status: 'active', discountPct: data?.discountPct || 0 });
          localStorage.setItem('demo_subscriptions', JSON.stringify(subs));
          setShowPaymentModal(false);
          setHasActiveSubscription(true);
          setActiveTab('dashboard');
        }}
      />

      {/* Página de Pagamento */}
      {showPaymentPage && selectedPlan && (
        <PaymentPage
          selectedPlan={selectedPlan}
          onBack={() => {
            setShowPaymentPage(false);
            setSelectedPlan(null);
          }}
          onSuccess={(plan) => {
            setShowPaymentPage(false);
            setSelectedPlan(null);
            // Recarregar página para atualizar acesso
            window.location.reload();
          }}
        />
      )}

      {/* Modal de Ativação de Assinatura */}
      {showSubscriptionActivation && (
        <SubscriptionActivation
          isOpen={showSubscriptionActivation}
          onClose={() => {
            setShowSubscriptionActivation(false);
            localStorage.removeItem('pending_subscription_txid');
          }}
          onSuccess={() => {
            setShowSubscriptionActivation(false);
            localStorage.removeItem('pending_subscription_txid');
            // Recarregar assinaturas
            const subs = JSON.parse(localStorage.getItem('demo_subscriptions')||'[]');
            const last = subs[subs.length-1] || null;
            setHasActiveSubscription(!!last);
            setActiveTab('dashboard');
          }}
          txid={localStorage.getItem('pending_subscription_txid') || undefined}
        />
      )}

      {/* Notificações de Expiração de Assinatura */}
      <SubscriptionExpirationNotification
        onRenew={() => {
          setActiveTab('meuplano');
        }}
      />
    </div>
  );
}

export default ClientDashboard;
