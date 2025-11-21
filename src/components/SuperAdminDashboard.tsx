import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { 
  Shield, 
  LogOut, 
  Users, 
  Building, 
  CreditCard, 
  Settings, 
  BarChart3,
  Bell,
  TrendingUp,
  DollarSign,
  UserPlus,
  ClipboardList,
  Key,
  Trash2,
  Edit,
  Search,
  Monitor,
  Clock,
  CheckCircle,
  MessageCircle,
  Database,
  Star,
  Plus,
  Eye,
  EyeOff,
  Crown,
  Zap,
  X,
  FileText,
  XCircle,
  Sparkles,
  Gift
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import plansService, { PlanRecord } from '../services/plansService';
import backendService from '../services/backendService';
import { useDebounce } from '../hooks/useDebounce';
import TableSkeleton, { CardSkeleton } from './SkeletonLoader';
import PendingUsersNotification from './PendingUsersNotification';

// Lazy load de componentes pesados
const AdminPanel = lazy(() => import('./AdminPanel'));
const CashFlow = lazy(() => import('./CashFlow'));
const EcommerceConfig = lazy(() => import('./EcommerceConfig'));
const ApiDocumentation = lazy(() => import('./ApiDocumentation'));
const PaymentGenerator = lazy(() => import('./PaymentGenerator'));
const CompleteReport = lazy(() => import('./CompleteReport'));
const WebhookConfig = lazy(() => import('./WebhookConfig'));
const CustomerManager = lazy(() => import('./CustomerManager'));
const PDVSystemNew = lazy(() => import('./PDVSystemNew'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
const NotificationSystem = lazy(() => import('./NotificationSystem'));
const BackupSystem = lazy(() => import('./BackupSystem'));
const ChatManagement = lazy(() => import('./ChatManagement'));
const AuditLogsModal = lazy(() => import('./AuditLogsModal'));
const SecurityPerformanceModal = lazy(() => import('./SecurityPerformanceModal'));
const CadernoNotas = lazy(() => import('./CadernoNotas'));
const SubscriptionManagement = lazy(() => import('./SubscriptionManagement'));
const FinancialTools = lazy(() => import('./FinancialTools'));

import licenseService from '../services/licenseService';
import { securityService, performanceService } from '../services/securityService';
import paymentGatewayService from '../services/paymentGatewayService';
import storageManager from '../utils/storage';

interface SuperAdminDashboardProps {
  onBackToLogin: () => void;
}

interface User {
  id: string;
  username: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  licenseKey?: string;
  tenantId?: string;
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: string;
  createdAt: string;
  userCount: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string;
  status: string;
  createdAt: string;
  isRecommended?: boolean;
  description?: string;
  maxUsers?: number;
  featuresList?: string[];
}

interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

function SuperAdminDashboard({ onBackToLogin }: SuperAdminDashboardProps) {
  const { logout, user } = useAuth();
  const { theme, changeTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: 't1', name: 'Empresa Demo', domain: 'demo.local', status: 'active', createdAt: '2025-10-14', userCount: 1 },
    { id: 't2', name: 'Webyte', domain: 'webyte.com', status: 'active', createdAt: '2025-10-14', userCount: 2 },
  ]);
  const [plans, setPlans] = useState<Plan[]>(plansService.getPlans().map(p=>({ 
    id: p.id, 
    name: p.name, 
    price: p.priceCents, 
    features: p.features||'', 
    status: 'active', 
    createdAt: p.createdAt||'', 
    isRecommended: p.isRecommended,
    description: p.description,
    maxUsers: p.maxUsers,
    featuresList: p.featuresList
  })));
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    { id: 's1', tenantId: 't1', planId: 'p1', status: 'active', startDate: '2025-10-14', endDate: '', createdAt: '2025-10-14' },
  ]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [licensesList, setLicensesList] = useState<any[]>([]);
  const [cashflowUnlockRequests, setCashflowUnlockRequests] = useState<any[]>([]);
  const [licenseValidations, setLicenseValidations] = useState<any[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEcommerceConfig, setShowEcommerceConfig] = useState(false);
  const [showApiDocumentation, setShowApiDocumentation] = useState(false);
  const [showPaymentGenerator, setShowPaymentGenerator] = useState(false);
  const [showCompleteReport, setShowCompleteReport] = useState(false);
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [showCustomerManager, setShowCustomerManager] = useState(false);
  const [showPDVSystem, setShowPDVSystem] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showChatManagement, setShowChatManagement] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showSecurityPerformance, setShowSecurityPerformance] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  // Visibilidade do menu lateral com persistência
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(() => {
    const stored = localStorage.getItem('sidebarVisible');
    return stored === null ? true : stored === 'true';
  });
  const [planForm, setPlanForm] = useState({
    name: '',
    priceCents: 0,
    description: '',
    maxUsers: 1,
    featuresList: [''],
    interval: 'monthly' as 'monthly' | 'yearly',
    isRecommended: false
  });
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [charges, setCharges] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [cmsConfig, setCmsConfig] = useState<any>({});
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Dados do overview - usando useState para permitir atualização
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTenants: 0,
    activeTenants: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    systemUptime: 100, // Uptime padrão
    activeLicenses: 0,
    expiredLicenses: 0
  });

  // Métricas de conversão para Monitoramento - MOVIDOS PARA O TOPO
  const [leadCount, setLeadCount] = useState<number>(0);
  const [approved24h, setApproved24h] = useState<number>(0);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);

  // ========== TODOS OS useEffect DEVEM VIR DEPOIS DE TODOS OS useState ==========
  // Persistência do sidebar
  useEffect(() => {
    localStorage.setItem('sidebarVisible', String(sidebarVisible));
  }, [sidebarVisible]);

  // useMemo e useCallback DEVEM VIR DEPOIS DOS useEffect, MAS ANTES DAS FUNÇÕES
  // Filtrar usuários - MOVIDO PARA O TOPO (não pode estar dentro de renderUsers)
  const filteredUsers = useMemo(() => 
    users.filter(u => u.username.toLowerCase().includes(debouncedSearchTerm.toLowerCase())),
    [users, debouncedSearchTerm]
  );

  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3, color: 'blue' },
    { id: 'users', label: 'Usuários', icon: Users, color: 'green' },
    { id: 'leads', label: 'Leads', icon: ClipboardList, color: 'indigo' },
    { id: 'pending-users', label: 'Cadastros Pendentes', icon: UserPlus, color: 'yellow' },
    { id: 'cashflow', label: 'PloutosLedger - Sistema de Gestão Financeira', icon: TrendingUp, color: 'emerald' },
    { id: 'caderno-notas', label: 'Caderno de Notas', icon: FileText, color: 'blue' },
    { id: 'tenants', label: 'Organizações', icon: Building, color: 'purple' },
    { id: 'plans', label: 'Planos', icon: CreditCard, color: 'orange' },
    { id: 'subscriptions', label: 'Assinaturas', icon: DollarSign, color: 'pink' },
    { id: 'licenses', label: 'Licenças', icon: Key, color: 'indigo' },
    { id: 'monitoring', label: 'Monitoramento', icon: Monitor, color: 'red' },
    { id: 'settings', label: 'Configurações', icon: Settings, color: 'gray' },
    { id: 'comms', label: 'Comunicações', icon: Bell, color: 'blue' },
    { id: 'payment-gateway', label: 'Gateway de Pagamento', icon: CreditCard, color: 'green' },
    { id: 'financial-tools', label: 'Ferramentas Financeiras', icon: BarChart3, color: 'indigo' },
    { id: 'pdv-system', label: 'Sistema PDV', icon: DollarSign, color: 'green' },
    { id: 'cms', label: 'CMS & Personalização', icon: Settings, color: 'purple' },
    { id: 'notifications', label: 'Notificações', icon: Bell, color: 'orange' },
    // Chat removido
    { id: 'chat-management', label: 'Gerenciar Chat', icon: MessageCircle, color: 'indigo' },
    { id: 'audit-logs', label: 'Logs de Auditoria', icon: FileText, color: 'purple' },
    { id: 'security-performance', label: 'Segurança & Performance', icon: Shield, color: 'red' },
    { id: 'backup', label: 'Backup', icon: Database, color: 'green' },
    { id: 'admin', label: 'Painel Admin', icon: Settings, color: 'purple' }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      gray: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
      emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // Função helper para gerar username único
  const generateUniqueUsername = (name: string, existingUsernames: string[]): string => {
    const baseUsername = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) || `user_${Date.now()}`;
    
    let username = baseUsername;
    let counter = 1;
    while (existingUsernames.includes(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    return username;
  };

  // Função para criar usuário localmente (offline)
  const createUserOffline = (pendingUser: any): { username: string; userId: string; password: string } => {
    // Carregar usuários existentes
    const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
    const existingUsernames = storedUsers.map((u: any) => u.username);
    
    // Gerar username único
    const username = generateUniqueUsername(pendingUser.name, existingUsernames);
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const password = pendingUser.password || 'demo123'; // Usar senha fornecida ou padrão
    
    // Criar usuário (com senha para login offline) - COM TODAS AS INFORMAÇÕES
    const newUser: any = {
      id: userId,
      username,
      password, // Salvar senha para login offline
      role: 'user',
      status: 'trial',
      email: pendingUser.email || '',
      phone: pendingUser.phone || '',
      name: pendingUser.name || username, // IMPORTANTE: Salvar o nome
      company: pendingUser.company || '',
      cnpj: pendingUser.cnpj || '',
      cpf: pendingUser.cpf || '',
      userType: pendingUser.userType || 'pessoa-fisica',
      createdAt: new Date().toISOString()
    };
    
    // Adicionar à lista de usuários
    storedUsers.push(newUser);
    localStorage.setItem('ploutos_users', JSON.stringify(storedUsers));
    
    // NÃO criar licença trial automaticamente - gerenciamento de caixa deve estar bloqueado por padrão
    // A licença só será criada quando o super admin aprovar uma solicitação de desbloqueio
    // Isso garante que o gerenciamento de caixa permanece bloqueado até solicitação do cliente
    
    console.log('✅ Usuário criado offline:', { 
      username, 
      userId, 
      password,
      name: newUser.name,
      email: newUser.email,
      totalUsers: storedUsers.length
    });
    
    return { username, userId, password };
  };

  // Função para carregar usuários (reutilizável)
  const loadUsers = async (force = false) => {
    if (!force && activeTab !== 'users') return;
    setLoading(true);
    setLoadError(null);
    
    // SEMPRE carregar do localStorage primeiro (funciona offline)
    try {
      const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
      if (storedUsers.length > 0) {
        // Garantir que todos os usuários tenham as informações completas
        const usersWithCompleteInfo = storedUsers.map((u: any) => ({
          ...u,
          email: u.email || '',
          phone: u.phone || '',
          name: u.name || u.username,
          status: u.status || 'active'
        }));
        setUsers(usersWithCompleteInfo);
        console.log('✅ Usuários carregados do localStorage:', usersWithCompleteInfo.length);
      } else {
        setUsers([]);
      }
    } catch (e) {
      console.error('Erro ao carregar usuários do localStorage:', e);
      setUsers([]);
    }
    
    // Tentar sincronizar com servidor (se disponível) - não bloqueia
    try {
      const online = await backendService.isOnline();
      if (online) {
        const base = backendService.getBaseUrl();
        const token = localStorage.getItem('auth_token');
        if (token) {
          const res = await fetch(`${base}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            const mapped = (data||[]).map((u:any)=>({ 
              id: u.id, 
              username: u.username, 
              role: u.role, 
              status: u.license?.status || 'active', 
              email: u.email || '',
              phone: u.phone || '',
              name: u.name || u.username,
              createdAt: u.createdAt || new Date().toISOString() 
            }));
            setUsers(mapped);
            localStorage.setItem('ploutos_users', JSON.stringify(mapped));
            console.log('✅ Usuários sincronizados do servidor:', mapped.length);
          }
        }
      }
    } catch (e:any) {
      // Ignorar erros - já temos dados do localStorage
      console.warn('⚠️ Servidor offline, usando dados locais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{
    loadUsers();
  }, [activeTab]);

  // Carregar configuração CMS
  useEffect(() => {
    const loadCmsConfig = async () => {
      try {
        const base = backendService.getBaseUrl();
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${base}/api/cms/config`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (res.ok) {
          const config = await res.json();
          setCmsConfig(config);
        }
      } catch (e) {
        console.error('Erro ao carregar configuração CMS:', e);
      }
    };
    loadCmsConfig();
  }, []);

  const saveCmsConfig = async (config: any) => {
    try {
      const base = backendService.getBaseUrl();
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${base}/api/cms/config`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        const updatedConfig = await res.json();
        setCmsConfig(updatedConfig);
        alert('Configurações salvas com sucesso!');
      } else {
        throw new Error('Falha ao salvar configurações');
      }
    } catch (e: any) {
      console.error('Erro ao salvar configurações:', e);
      alert(`Erro ao salvar configurações: ${e.message || 'Erro desconhecido'}`);
      throw e; // Re-throw para o handler do botão
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditUserModal(true);
  };

  const handleUpdateUser = async (userData: any) => {
    if (!editingUser) {
      alert('Erro: Nenhum usuário selecionado para edição.');
      return;
    }

    // Implementar lógica offline-first para atualizar usuário
    try {
      setLoading(true);
      
      // 1. Atualizar no localStorage primeiro (offline-first)
      const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
      const userIndex = storedUsers.findIndex((u: any) => 
        u.id === editingUser.id || 
        u.username === editingUser.username ||
        (editingUser.email && u.email === editingUser.email)
      );

      if (userIndex === -1) {
        throw new Error('Usuário não encontrado no sistema');
      }

      // Atualizar dados do usuário
      const updatedUser = {
        ...storedUsers[userIndex],
        username: userData.username || storedUsers[userIndex].username,
        role: userData.role || storedUsers[userIndex].role,
        email: userData.email || storedUsers[userIndex].email,
        phone: userData.phone || storedUsers[userIndex].phone,
        name: userData.name || storedUsers[userIndex].name,
        company: userData.company || storedUsers[userIndex].company,
        cnpj: userData.cnpj || storedUsers[userIndex].cnpj,
        cpf: userData.cpf || storedUsers[userIndex].cpf,
        userType: userData.userType || storedUsers[userIndex].userType,
        updatedAt: new Date().toISOString()
      };

      // Se há nova senha, salvar (sem hash, pois será usado para login offline)
      if (userData.password && userData.password.trim()) {
        updatedUser.password = userData.password; // Salvar senha em texto para login offline
      }

      storedUsers[userIndex] = updatedUser;
      localStorage.setItem('ploutos_users', JSON.stringify(storedUsers));

      // 2. Atualizar estado local
      setUsers(prev => prev.map(u => 
        (u.id === editingUser.id || u.username === editingUser.username) 
          ? { ...u, ...updatedUser } 
          : u
      ));
      
      // Fechar modal
      setShowEditUserModal(false);
      setEditingUser(null);

      // 3. Tentar sincronizar com servidor (background, não bloqueia)
      try {
        const online = await backendService.isOnline();
        if (online) {
          const token = localStorage.getItem('auth_token');
          const baseUrl = backendService.getBaseUrl();
          
          // Preparar dados para enviar (sem senha em texto se não foi alterada)
          const updateData: any = {
            username: userData.username,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            name: userData.name,
            company: userData.company,
            cnpj: userData.cnpj,
            cpf: userData.cpf,
            userType: userData.userType
          };

          // Se há nova senha, enviar para reset
          if (userData.password && userData.password.trim()) {
            // Tentar atualizar senha via endpoint específico
            try {
              await fetch(`${baseUrl}/api/users/${editingUser.id}/reset-password`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword: userData.password })
              });
            } catch (e) {
              console.warn('Não foi possível atualizar senha no servidor:', e);
            }
          }

          // Atualizar outros dados do usuário
          try {
            await fetch(`${baseUrl}/api/users/${editingUser.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(updateData)
            });
          } catch (e) {
            console.warn('Não foi possível sincronizar usuário com servidor:', e);
          }
        }
      } catch (syncError) {
        console.warn('Erro ao sincronizar com servidor (continuando offline):', syncError);
        // Não bloquear - já salvou no localStorage
      }

      alert(`✅ Usuário atualizado com sucesso!${userData.password ? '\n\n⚠️ Nova senha salva. O usuário pode fazer login com a nova senha.' : ''}`);
      
      // Recarregar lista de usuários
      loadUsers(true);
      
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      alert(`Erro ao atualizar usuário: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserOld = async (userData: any) => {
    if (!editingUser) return;
    
    try {
      setLoading(true);
      const base = backendService.getBaseUrl();
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${base}/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updatedUser } : u));
        setShowEditUserModal(false);
        setEditingUser(null);
        alert('Usuário atualizado com sucesso!');
      } else {
        const error = await res.text();
        throw new Error(error || 'Falha ao atualizar usuário');
      }
    } catch (error: any) {
      alert(`Erro ao atualizar usuário: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?\n\nEsta ação não pode ser desfeita!')) return;
    
    try {
      setLoading(true);
      
      // EXCLUSÃO OFFLINE - Funciona SEM servidor
      // 1. Remover do localStorage PRIMEIRO
      const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
      const userToDelete = storedUsers.find((u: any) => u.id === userId);
      
      if (!userToDelete) {
        throw new Error('Usuário não encontrado');
      }
      
      // Remover usuário
      const filteredUsers = storedUsers.filter((u: any) => u.id !== userId);
      localStorage.setItem('ploutos_users', JSON.stringify(filteredUsers));
      
      // Remover licenças associadas
      const licenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
      const filteredLicenses = licenses.filter((l: any) => l.userId !== userId && l.username !== userToDelete.username);
      localStorage.setItem('ploutos_licenses', JSON.stringify(filteredLicenses));
      
      // Atualizar estado local imediatamente
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      // 2. Tentar sincronizar com servidor (se disponível) - não bloqueia
      try {
        const online = await backendService.isOnline();
        if (online) {
          const base = backendService.getBaseUrl();
          const token = localStorage.getItem('auth_token');
          if (token) {
            await fetch(`${base}/api/users/${userId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Sincronizado com servidor');
          }
        }
      } catch (e) {
        console.warn('⚠️ Servidor offline, mas exclusão local realizada');
      }
      
      // Atualizar métricas
      loadOverviewMetrics();
      
      alert(`✅ Usuário "${userToDelete.username}" excluído com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      alert(`❌ Erro ao excluir usuário:\n\n${error?.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar leads (reutilizável) - FUNCIONA OFFLINE
  const loadLeads = async (force = false) => {
    if (!force && activeTab !== 'leads') return;
    setLoading(true);
    setLoadError(null);
    
    // Função auxiliar para garantir IDs únicos
    const ensureUniqueIds = (leads: any[]) => {
      return leads.map((lead, index) => {
        if (!lead.id || typeof lead.id !== 'string') {
          // Gerar ID único se não existir
          const newId = `${Date.now()}_${index}_${Math.random().toString(36).slice(2,8)}`;
          console.warn(`⚠️ Lead sem ID encontrado, gerando ID: ${newId}`, lead);
          return { ...lead, id: newId };
        }
        return lead;
      });
    };
    
    // SEMPRE carregar do localStorage primeiro (funciona offline)
    try {
      const cached = JSON.parse(localStorage.getItem('pending_leads')||'[]');
      const leadsWithIds = ensureUniqueIds(cached);
      setLeads(leadsWithIds);
      // Salvar de volta com IDs garantidos
      if (leadsWithIds.length !== cached.length || leadsWithIds.some((l, i) => l.id !== cached[i]?.id)) {
        localStorage.setItem('pending_leads', JSON.stringify(leadsWithIds));
      }
      setLoadError(null);
    } catch (e) {
      setLeads([]);
    }
    
    // Tentar sincronizar com servidor (se disponível) - não bloqueia
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const online = await backendService.isOnline();
        if (online) {
          const { data } = await backendService.get('/api/leads', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (data && Array.isArray(data)) {
            const leadsWithIds = ensureUniqueIds(data);
            setLeads(leadsWithIds);
            localStorage.setItem('pending_leads', JSON.stringify(leadsWithIds));
            setLoadError(null);
          }
        }
      }
    } catch(e:any){
      // Ignorar erros - já temos dados do localStorage
      console.warn('⚠️ Servidor offline, usando dados locais');
    } finally { 
      setLoading(false); 
    }
  };

  // Carregar leads quando aba ativa for "leads"
  useEffect(()=>{
    loadLeads();
  }, [activeTab]);

  // Função para carregar usuários pendentes (reutilizável) - FUNCIONA OFFLINE
  const loadPendingUsers = async (force = false) => {
    if (!force && activeTab !== 'pending-users') return;
    setLoading(true);
    setLoadError(null);
    
    // Função auxiliar para garantir IDs únicos
    const ensureUniqueIds = (users: any[]) => {
      return users.map((user, index) => {
        if (!user.id || typeof user.id !== 'string') {
          // Gerar ID único se não existir
          const newId = `pending_${Date.now()}_${index}_${Math.random().toString(36).slice(2,8)}`;
          console.warn(`⚠️ Cadastro sem ID encontrado, gerando ID: ${newId}`, user);
          return { ...user, id: newId };
        }
        return user;
      });
    };
    
    // SEMPRE carregar do localStorage primeiro (funciona offline)
    try {
      const cached = JSON.parse(localStorage.getItem('pending_users')||'[]');
      const usersWithIds = ensureUniqueIds(cached);
      setPendingUsers(usersWithIds);
      // Salvar de volta com IDs garantidos
      if (usersWithIds.length !== cached.length || usersWithIds.some((u, i) => u.id !== cached[i]?.id)) {
        localStorage.setItem('pending_users', JSON.stringify(usersWithIds));
      }
      setLoadError(null);
    } catch (e) {
      setPendingUsers([]);
    }
    
    // Tentar sincronizar com servidor (se disponível) - não bloqueia
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const online = await backendService.isOnline();
        if (online) {
          const { data } = await backendService.get('/api/pending-users', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (data && Array.isArray(data)) {
            const usersWithIds = ensureUniqueIds(data);
            setPendingUsers(usersWithIds);
            localStorage.setItem('pending_users', JSON.stringify(usersWithIds));
            setLoadError(null);
          }
        }
      }
    } catch(e:any){
      // Ignorar erros - já temos dados do localStorage
      console.warn('⚠️ Servidor offline, usando dados locais');
    } finally { 
      setLoading(false); 
    }
  };

  // Carregar usuários pendentes quando aba ativa for "pending-users"
  useEffect(()=>{
    loadPendingUsers();
  }, [activeTab]);

  // Carregar solicitações de desbloqueio
  const loadCashflowUnlockRequests = () => {
    try {
      const requests = JSON.parse(localStorage.getItem('cashflow_unlock_requests') || '[]');
      const pending = requests.filter((r: any) => r.status === 'pending');
      setCashflowUnlockRequests(pending);
      return pending;
    } catch (e) {
      console.error('Erro ao carregar solicitações:', e);
      setCashflowUnlockRequests([]);
      return [];
    }
  };

  // Carregar validações de licenças
  const loadLicenseValidations = async () => {
    try {
      const licenseValidationService = await import('../services/licenseValidationService');
      const logs = licenseValidationService.default.getValidationLogs();
      setLicenseValidations(logs.slice(0, 50)); // Últimas 50 validações
    } catch (e) {
      console.error('Erro ao carregar validações:', e);
      setLicenseValidations([]);
    }
  };

  // Listener para atualizar quando houver nova solicitação
  useEffect(() => {
    const handleNewRequest = () => {
      loadCashflowUnlockRequests();
      // Atualizar métricas também
      if (activeTab === 'overview') {
        loadOverviewMetrics();
      }
    };

    const handleLicenseValidation = () => {
      loadLicenseValidations();
      if (activeTab === 'overview' || activeTab === 'licenses') {
        loadOverviewMetrics();
      }
    };

    window.addEventListener('cashflowUnlockRequested', handleNewRequest);
    window.addEventListener('licenseValidation', handleLicenseValidation);
    
    return () => {
      window.removeEventListener('cashflowUnlockRequested', handleNewRequest);
      window.removeEventListener('licenseValidation', handleLicenseValidation);
    };
  }, [activeTab]);

  // Carregar métricas da Visão Geral
  const loadOverviewMetrics = async () => {
    try {
      console.log('📊 Carregando métricas da Visão Geral...');
      
      // Carregar usuários do localStorage
      const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
      console.log('👥 Usuários encontrados:', storedUsers.length);
      
      // Carregar licenças
      const storedLicenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
      const activeLicenses = storedLicenses.filter((l: any) => l.status === 'active' || l.status === 'trial');
      const expiredLicenses = storedLicenses.filter((l: any) => {
        if (l.status === 'expired') return true;
        if (l.validUntil) {
          return new Date(l.validUntil) < new Date();
        }
        return false;
      });
      
      // Carregar solicitações pendentes
      const storedRequests = JSON.parse(localStorage.getItem('cashflow_unlock_requests') || '[]');
      const pendingRequests = storedRequests.filter((r: any) => r.status === 'pending');
      console.log('🔔 Solicitações pendentes:', pendingRequests.length);
      
      // Carregar tenants (organizações)
      const storedTenants = JSON.parse(localStorage.getItem('ploutos_tenants') || '[]');
      
      // Atualizar estatísticas
      setSystemStats({
        totalUsers: storedUsers.length,
        activeUsers: storedUsers.filter((u: any) => u.status === 'active' || u.status === 'trial').length,
        totalTenants: storedTenants.length || tenants.length,
        activeTenants: storedTenants.filter((t: any) => t.status === 'active').length || tenants.filter(t => t.status === 'active').length,
        totalRevenue: 0, // Será calculado se houver dados de pagamentos
        monthlyRevenue: 0, // Será calculado se houver dados de pagamentos
        systemUptime: 100,
        activeLicenses: activeLicenses.length,
        expiredLicenses: expiredLicenses.length
      });
      
      setCashflowUnlockRequests(pendingRequests);
      
      console.log('✅ Métricas atualizadas:', {
        totalUsers: storedUsers.length,
        activeUsers: storedUsers.filter((u: any) => u.status === 'active' || u.status === 'trial').length,
        activeLicenses: activeLicenses.length,
        pendingRequests: pendingRequests.length
      });
      
      // Tentar carregar do servidor também (se disponível)
      const online = await backendService.isOnline();
      if (online) {
        try {
          const base = backendService.getBaseUrl();
          const token = localStorage.getItem('auth_token');
          if (token) {
            const res = await fetch(`${base}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
              const usersData = await res.json();
              setSystemStats(prev => ({
                ...prev,
                totalUsers: (usersData||[]).length,
                activeUsers: (usersData||[]).filter((u:any)=> u.license?.status === 'active' || u.license?.status === 'trial').length
              }));
            }
          }
        } catch (e) {
          console.warn('⚠️ Erro ao carregar do servidor:', e);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar métricas:', error);
    }
  };

  useEffect(()=>{
    const loadMetrics = async ()=>{
      if (activeTab !== 'monitoring') return;
      try {
        const online = await backendService.isOnline();
        if (!online) { setLeadCount(0); setApproved24h(0); setActiveUsersCount(users.length||0); return; }
        const base = backendService.getBaseUrl();
        const token = localStorage.getItem('auth_token');
        const [leadsRes, usersRes] = await Promise.all([
          fetch(`${base}/api/leads`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${base}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const leadsData = await leadsRes.json();
        const usersData = await usersRes.json();
        setLeadCount((leadsData||[]).length);
        setActiveUsersCount((usersData||[]).length);
        // Aprovados (24h) — heurística: usuários criados nas últimas 24h
        const since = Date.now() - 24*60*60*1000;
        const approved = (usersData||[]).filter((u:any)=> new Date(u.createdAt||Date.now()).getTime() >= since).length;
        setApproved24h(approved);
      } catch {}
    };
    loadMetrics();
  }, [activeTab]);

  // Carregar métricas da Visão Geral quando a aba for ativada
  useEffect(() => {
    if (activeTab === 'overview') {
      console.log('🔄 Aba Visão Geral ativada, carregando dados...');
      
      // Carregar imediatamente
      loadOverviewMetrics();
      loadCashflowUnlockRequests();
      loadLicenseValidations();
      
      // Recarregar a cada 5 segundos quando estiver na aba overview
      const interval = setInterval(() => {
        console.log('🔄 Atualizando métricas automaticamente...');
        loadOverviewMetrics();
        loadCashflowUnlockRequests();
        loadLicenseValidations();
      }, 5000);
      
      return () => clearInterval(interval);
    }
    
    if (activeTab === 'licenses') {
      loadLicenseValidations();
      loadLicensesList();
    }
  }, [activeTab]);

  // Carregar dados na montagem inicial se já estiver na aba overview
  useEffect(() => {
    if (activeTab === 'overview') {
      console.log('🚀 Componente montado, carregando dados iniciais...');
      loadOverviewMetrics();
      loadCashflowUnlockRequests();
      loadLicenseValidations();
    }
  }, []);

  // Carregar dados do gateway de pagamento
  useEffect(() => {
    const loadPaymentGatewayData = async () => {
      if (activeTab !== 'payment-gateway') return;
      
      try {
        setLoading(true);
        const [methods, chargesData, stats, balanceData] = await Promise.all([
          paymentGatewayService.getPaymentMethods(),
          paymentGatewayService.getCharges({ limit: 10 }),
          paymentGatewayService.getAdvancedStatistics('today'),
          paymentGatewayService.getBalance()
        ]);
        
        setPaymentMethods(methods);
        setCharges(chargesData.data || []);
        setStatistics(stats);
        setBalance(balanceData);
      } catch (error) {
        console.error('Erro ao carregar dados do gateway:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentGatewayData();
  }, [activeTab]);

  const handleLogout = () => {
    logout();
    onBackToLogin();
  };

  // Função para aprovar solicitação de desbloqueio e gerar licença de 30 dias
  const handleApproveCashflowUnlock = async (request: any) => {
    if (!confirm(`Deseja aprovar a solicitação de ${request.username} e gerar uma licença de 30 dias grátis para o Gerenciamento de Caixa?`)) {
      return;
    }

    try {
      // Gerar licença de 30 dias
      const licenseKey = `CF30D_${Date.now()}_${Math.random().toString(36).slice(2,9).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Atualizar solicitação
      const requests = JSON.parse(localStorage.getItem('cashflow_unlock_requests') || '[]');
      const updatedRequests = requests.map((r: any) => 
        r.id === request.id 
          ? { ...r, status: 'approved', approvedAt: new Date().toISOString(), licenseKey, expiresAt: expiresAt.toISOString() }
          : r
      );
      localStorage.setItem('cashflow_unlock_requests', JSON.stringify(updatedRequests));

      // NÃO criar/atualizar licença ainda - apenas salvar a chave para o cliente ativar
      // A licença só será criada quando o cliente ativar manualmente no painel dele

      // Atualizar lista de solicitações
      setCashflowUnlockRequests(prev => prev.filter(r => r.id !== request.id));

      // Atualizar métricas
      loadOverviewMetrics();

      // Salvar chave aprovada para o cliente ver no painel
      const approvedKeys = JSON.parse(localStorage.getItem('approved_license_keys') || '[]');
      const existingKeyIndex = approvedKeys.findIndex((k: any) => k.username === request.username);
      
      const approvedKeyData = {
        username: request.username,
        licenseKey,
        expiresAt: expiresAt.toISOString(),
        approvedAt: new Date().toISOString(),
        status: 'pending_activation', // Pendente de ativação pelo cliente
        approvedBy: localStorage.getItem('caixa_user') || 'admin'
      };
      
      if (existingKeyIndex >= 0) {
        approvedKeys[existingKeyIndex] = approvedKeyData;
      } else {
        approvedKeys.push(approvedKeyData);
      }
      localStorage.setItem('approved_license_keys', JSON.stringify(approvedKeys));

      // Disparar evento para atualizar o cliente
      window.dispatchEvent(new CustomEvent('cashflowUnlockApproved', { 
        detail: { username: request.username, licenseKey, expiresAt: expiresAt.toISOString() } 
      }));

      // Mostrar modal com a chave para copiar
      const chaveParaCopiar = licenseKey;
      const mensagem = `✅ Licença gerada com sucesso!\n\nUsuário: ${request.username}\nChave: ${chaveParaCopiar}\nVálida até: ${expiresAt.toLocaleDateString('pt-BR')}\n\n📋 A chave já está disponível no painel do cliente!\n\nO cliente pode:\n1. Ver a chave em "Meu Plano" no painel dele\n2. Copiar e ativar manualmente no painel\n3. OU usar a chave na landing page para ativação automática\n\n🔑 CHAVE DE LICENÇA:\n${chaveParaCopiar}\n\n⚠️ IMPORTANTE: A chave já está visível no painel do cliente!`;
      
      // Tentar copiar para área de transferência
      if (navigator.clipboard) {
        navigator.clipboard.writeText(chaveParaCopiar).then(() => {
          alert(mensagem + '\n\n✅ Chave copiada para área de transferência!');
        }).catch(() => {
          alert(mensagem);
        });
      } else {
        alert(mensagem);
      }

      // Tentar sincronizar com servidor (se disponível)
      try {
        const online = await backendService.isOnline();
        if (online) {
          const token = localStorage.getItem('auth_token');
          await backendService.post(`/api/cashflow-unlock-request/${request.id}/approve`, {
            licenseKey,
            expiresAt: expiresAt.toISOString()
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (e) {
        console.warn('⚠️ Servidor offline, mas licença criada localmente');
      }
    } catch (error: any) {
      console.error('Erro ao aprovar solicitação:', error);
      alert(`❌ Erro ao aprovar solicitação:\n\n${error?.message || 'Erro desconhecido'}`);
    }
  };

  const handleCreateUser = async (userData: { username: string; password: string; role: string; email?: string }) => {
    try {
      setLoading(true);
      const online = await backendService.isOnline();
      
      if (online) {
        const base = backendService.getBaseUrl();
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${base}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
          throw new Error('Falha ao criar usuário');
        }
        
        const newUser = await response.json();
        setUsers(prev => [...prev, { ...newUser, status: 'active', createdAt: new Date().toISOString() }]);
      } else {
        // Modo offline - adicionar localmente
        const newUser = {
          id: `local_${Date.now()}`,
          username: userData.username,
          role: userData.role,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        setUsers(prev => [...prev, newUser]);
      }
      
      setShowCreateUserModal(false);
    } catch (error: any) {
      setLoadError(error.message || 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="p-4 sm:p-6 lg:p-8 animate-tab-slide">
      {/* Cards de Estatísticas */}
      <div className="row g-4 mb-6">
        <div className="col-md-6 col-lg-3">
          <div className="group card-3d bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 border border-blue-400/20 relative overflow-hidden animate-stagger-1">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
          <div className="flex items-center justify-between">
            <div>
                <p className="text-blue-100 text-sm font-medium mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Total de Usuários</p>
                <p className="text-4xl font-bold mb-1 animate-count-up" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {systemStats.totalUsers > 0 ? systemStats.totalUsers.toLocaleString() : '0'}
                </p>
                <p className="text-blue-200 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {systemStats.activeUsers > 0 ? `${systemStats.activeUsers} ativos` : 'Nenhum usuário ativo'}
                </p>
            </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10">
              <Users className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
            </div>
          </div>
            {systemStats.totalUsers > 0 && (
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-300 mr-2" />
                <span className="text-sm text-green-300" style={{ fontFamily: 'Inter, sans-serif' }}>Crescimento mensal</span>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="group card-3d bg-gradient-to-r from-green-500 via-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 border border-green-400/20 relative overflow-hidden animate-stagger-2">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
          <div className="flex items-center justify-between">
            <div>
                <p className="text-green-100 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Organizações</p>
                <p className="text-4xl font-bold mb-1 animate-count-up" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {systemStats.totalTenants > 0 ? systemStats.totalTenants : '0'}
                </p>
                <p className="text-green-200 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {systemStats.activeTenants > 0 ? `${systemStats.activeTenants} ativas` : 'Nenhuma organização ativa'}
                </p>
            </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10">
                <Building className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="group card-3d bg-gradient-to-r from-purple-500 via-indigo-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 border border-purple-400/20 relative overflow-hidden animate-stagger-3">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
          <div className="flex items-center justify-between">
            <div>
                <p className="text-purple-100 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Receita Total</p>
                <p className="text-4xl font-bold mb-1 animate-count-up" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {systemStats.totalRevenue > 0 ? (
                    `R$ ${systemStats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  ) : (
                    'R$ 0,00'
                  )}
                </p>
                <p className="text-purple-200 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {systemStats.monthlyRevenue > 0 ? (
                    `R$ ${systemStats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} este mês`
                  ) : (
                    'Sem receita este mês'
                  )}
                </p>
            </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10">
                <DollarSign className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-3">
          <div className="group card-3d bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 border border-orange-400/20 relative overflow-hidden animate-stagger-4">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
          <div className="flex items-center justify-between">
            <div>
                <p className="text-orange-100 text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Uptime do Sistema</p>
                <p className="text-4xl font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {systemStats.systemUptime > 0 ? `${systemStats.systemUptime}%` : '0%'}
                </p>
                <p className="text-orange-200 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Disponibilidade</p>
            </div>
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10">
                <Monitor className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos e Alertas */}
      <div className="row g-4 mb-6">
        <div className="col-lg-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Crescimento de Usuários</h3>
            <div className="flex items-center justify-center h-40 bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 rounded-xl border border-green-100">
            <div className="text-center">
                {systemStats.totalUsers > 0 ? (
                  <>
                    <p className="text-4xl font-bold text-green-600 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Em crescimento</p>
                    <p className="text-gray-600 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Dados aparecerão aqui</p>
                  </>
                ) : (
                  <div className="text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Dados aparecerão aqui</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Status das Licenças</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                <span className="text-green-700 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Licenças Ativas</span>
                <span className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {systemStats.activeLicenses > 0 ? systemStats.activeLicenses : '0'}
                </span>
            </div>
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                <span className="text-red-700 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Licenças Expiradas</span>
                <span className="text-3xl font-bold text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {systemStats.expiredLicenses > 0 ? systemStats.expiredLicenses : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Solicitações Pendentes de Desbloqueio */}
      {cashflowUnlockRequests.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mb-6 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-800" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Solicitações Pendentes de Desbloqueio
                </h3>
                <p className="text-sm text-amber-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {cashflowUnlockRequests.length} {cashflowUnlockRequests.length === 1 ? 'solicitação' : 'solicitações'} aguardando aprovação
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cashflowUnlockRequests.slice(0, 3).map((req: any) => (
              <div key={req.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {req.username}
                    </p>
                    <p className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {new Date(req.requestedAt).toLocaleDateString('pt-BR')} às {new Date(req.requestedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApproveCashflowUnlock(req)}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    aria-label={`Aprovar solicitação de desbloqueio de ${req.username}`}
                  >
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações Rápidas */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Ações Rápidas</h3>
        <div className="row g-3">
          <div className="col-6 col-md-3">
          <button 
            onClick={() => setActiveTab('users')}
              className="w-full flex flex-col items-center p-5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-green-400/20 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="Ir para gerenciamento de usuários"
          >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                <UserPlus className="w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Novo Usuário</span>
          </button>
          </div>
          
          <div className="col-6 col-md-3">
          <button 
            onClick={() => setActiveTab('tenants')}
              className="w-full flex flex-col items-center p-5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-purple-400/20"
          >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                <Building className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Nova Organização</span>
          </button>
          </div>
          
          <div className="col-6 col-md-3">
          <button 
            onClick={() => setActiveTab('licenses')}
              className="w-full flex flex-col items-center p-5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-indigo-400/20"
          >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                <Key className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Gerenciar Licenças</span>
          </button>
          </div>
          
          <div className="col-6 col-md-3">
          <button 
            onClick={() => setActiveTab('monitoring')}
              className="w-full flex flex-col items-center p-5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg border border-red-400/20"
          >
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
                <Monitor className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Monitoramento</span>
          </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    // filteredUsers já está definido no nível superior do componente
    return (
      <div className="bg-white rounded-xl shadow-lg">
        <div className="p-4 sm:p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gerenciar Usuários</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base transition-all duration-300"
                  aria-label="Buscar usuários"
                />
              </div>
              <button 
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 text-sm sm:text-base whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2" 
                onClick={()=>setShowCreateUserModal(true)}
                aria-label="Criar novo usuário"
              >
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>Novo Usuário</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {loading && <div className="text-sm text-gray-500 mb-4">Carregando...</div>}
          {loadError && <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">{loadError}</div>}
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Usuário</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Criado em</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-sm font-bold">{(u.username||'')[0]?.toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate">{u.username}</p>
                            <p className="text-sm text-gray-600 truncate">{u.email || u.username + '@exemplo.com'}</p>
                            {u.phone && <p className="text-xs text-gray-500">{u.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">{u.role}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full whitespace-nowrap">{u.status||'Ativo'}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleEditUser(u)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            title="Editar usuário"
                            aria-label={`Editar usuário ${u.username}`}
                          >
                            <Edit className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            title="Excluir usuário"
                            aria-label={`Excluir usuário ${u.username}`}
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
              </div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">{(u.username||'')[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-800 truncate">{u.username}</p>
                        <p className="text-sm text-gray-600 truncate">{u.email || u.username + '@exemplo.com'}</p>
                        {u.phone && <p className="text-xs text-gray-500 mt-1">{u.phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      <button 
                        onClick={() => handleEditUser(u)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{u.role}</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{u.status||'Ativo'}</span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLeads = () => (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Leads (Cadastro de Demo)</h2>
          <button 
            onClick={() => {
              backendService.clearCache();
              loadLeads(true);
            }} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
            disabled={loading}
          >
            {loading ? 'Carregando...' : '🔄 Recarregar'}
          </button>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {loading && <div className="text-sm text-gray-500 mb-4">Carregando...</div>}
        {loadError && <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">{loadError}</div>}
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Telefone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Empresa</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuário sugerido</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.length===0 && (
                <tr><td className="py-6 px-4 text-gray-500 text-center" colSpan={6}>Nenhum lead pendente.</td></tr>
              )}
              {leads.map((l:any)=> (
                <tr key={l.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium">{l.name}</td>
                  <td className="py-3 px-4">{l.email}</td>
                  <td className="py-3 px-4">{l.phone}</td>
                  <td className="py-3 px-4">{l.company || '-'}</td>
                  <td className="py-3 px-4">{l.username}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={async()=>{
                      if (!confirm(`Deseja aprovar o lead de ${l.name} e criar a conta?\n\nSerá criado um usuário com acesso trial de 30 dias.`)) return;
                      
                      // APROVAÇÃO OFFLINE - Funciona SEM servidor
                      try {
                        console.log('✅ Aprovando lead:', l.name, l.email);
                        
                        // 1. Criar usuário localmente PRIMEIRO (funciona offline)
                        const pendingUserData = {
                          name: l.name,
                          email: l.email,
                          phone: l.phone,
                          company: l.company,
                          password: 'demo123' // Senha padrão para leads
                        };
                        const { username, userId, password } = createUserOffline(pendingUserData);
                        
                        // 2. Remover do leads
                        const stored = JSON.parse(localStorage.getItem('pending_leads') || '[]');
                        const filtered = stored.filter((x: any) => {
                          const xId = x?.id ? String(x.id) : null;
                          const targetId = String(l.id);
                          return xId !== targetId;
                        });
                        localStorage.setItem('pending_leads', JSON.stringify(filtered));
                        
                        // 3. Atualizar lista local imediatamente
                        setLeads(prev => prev.filter(x => {
                          const xId = x?.id ? String(x.id) : null;
                          return xId !== String(l.id);
                        }));
                        
                        // 4. Atualizar lista de usuários - FORÇAR ATUALIZAÇÃO COMPLETA
                        const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
                        // Garantir que todos os usuários tenham informações completas
                        const usersWithCompleteInfo = storedUsers.map((usr: any) => ({
                          ...usr,
                          email: usr.email || '',
                          phone: usr.phone || '',
                          name: usr.name || usr.username,
                          status: usr.status || 'trial'
                        }));
                        setUsers(usersWithCompleteInfo);
                        
                        // Atualizar métricas também
                        loadOverviewMetrics();
                        
                        // Forçar recarregamento da lista de usuários
                        setTimeout(() => {
                          loadUsers(true);
                        }, 500);
                        
                        // 5. Tentar sincronizar com servidor (se disponível) - não bloqueia
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          try {
                            const online = await backendService.isOnline();
                            if (online) {
                              await backendService.post(
                                `/api/leads/${encodeURIComponent(l.id)}/approve`,
                                {},
                                {
                                  headers: { Authorization: `Bearer ${token}` }
                                }
                              );
                              console.log('✅ Sincronizado com servidor');
                              
                              // Recarregar usuários do servidor
                              try {
                                const { data: usersData } = await backendService.get('/api/users', {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                if (usersData && Array.isArray(usersData)) {
                                  const mapped = usersData.map((u:any)=>({ 
                                    id: u.id, 
                                    username: u.username, 
                                    role: u.role, 
                                    status: u.license?.status || 'active', 
                                    email: u.email || '',
                                    phone: u.phone || '',
                                    name: u.name || u.username,
                                    createdAt: u.createdAt || new Date().toISOString() 
                                  }));
                                  setUsers(mapped);
                                  localStorage.setItem('ploutos_users', JSON.stringify(mapped));
                                }
                              } catch {}
                            }
                          } catch (e) {
                            console.warn('⚠️ Servidor offline, mas aprovação local realizada');
                          }
                        }
                        
                        alert(`✅ Usuário criado e lead aprovado!\n\nUsuário: ${username}\nSenha: ${password}\nEmail: ${l.email}\nStatus: Trial (30 dias)\n\nO usuário pode fazer login agora!`);
                      } catch (e:any) {
                        console.error('❌ Erro ao aprovar:', e);
                        alert(`❌ Erro ao aprovar lead:\n\n${e?.message || 'Erro desconhecido'}\n\nVerifique o console para detalhes.`);
                      }
                    }} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors">Aprovar</button>
                    <button onClick={async()=>{
                      if (!confirm(`Deseja excluir DEFINITIVAMENTE o lead de ${l.name}?\n\nEsta ação não pode ser desfeita!`)) return;
                      
                      // VALIDAÇÃO CRÍTICA - Garantir que temos ID válido
                      if (!l.id || typeof l.id !== 'string') {
                        alert(`❌ ERRO CRÍTICO: Lead sem ID válido!\n\nNome: ${l.name}\nEmail: ${l.email}\n\nNão é possível excluir sem ID único.`);
                        console.error('❌ Tentativa de excluir lead sem ID:', l);
                        return;
                      }
                      
                      const targetId = String(l.id); // Garantir que é string
                      console.log(`🗑️  Excluindo lead:`, {
                        id: targetId,
                        name: l.name,
                        email: l.email,
                        totalAntes: leads.length
                      });
                      
                      // EXCLUSÃO OFFLINE - Funciona SEM servidor
                      try {
                        // 1. Remover do localStorage com validação rigorosa
                        const stored = JSON.parse(localStorage.getItem('pending_leads') || '[]');
                        const antes = stored.length;
                        
                        // FILTRO RIGOROSO - Comparação estrita por ID
                        const filtered = stored.filter((x: any) => {
                          const xId = x?.id ? String(x.id) : null;
                          const match = xId === targetId;
                          if (!xId) {
                            console.warn('⚠️ Lead sem ID encontrado no localStorage:', x);
                          }
                          return !match; // Manter apenas os que NÃO são o alvo
                        });
                        
                        const depois = filtered.length;
                        const removidos = antes - depois;
                        
                        if (removidos !== 1) {
                          console.error(`❌ ERRO: Esperado remover 1 lead, mas removeu ${removidos}!`, {
                            antes,
                            depois,
                            targetId,
                            encontrados: stored.filter((x: any) => String(x?.id) === targetId)
                          });
                          alert(`❌ ERRO CRÍTICO: Problema na exclusão!\n\nEsperado remover 1, mas removeu ${removidos}.\n\nVerifique o console para detalhes.`);
                          return;
                        }
                        
                        localStorage.setItem('pending_leads', JSON.stringify(filtered));
                        console.log(`✅ Removido do localStorage: ${removidos} lead(s)`);
                        
                        // 2. Remover da lista local com validação
                        setLeads(prev => {
                          const antesLista = prev.length;
                          const filtrado = prev.filter(x => {
                            const xId = x?.id ? String(x.id) : null;
                            return xId !== targetId;
                          });
                          const depoisLista = filtrado.length;
                          const removidosLista = antesLista - depoisLista;
                          
                          if (removidosLista !== 1) {
                            console.error(`❌ ERRO na lista: Esperado remover 1, removeu ${removidosLista}`);
                          }
                          
                          return filtrado;
                        });
                        
                        // 3. Tentar sincronizar com servidor (se disponível) - não bloqueia
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          try {
                            const online = await backendService.isOnline();
                            if (online) {
                              await backendService.delete(`/api/leads/${encodeURIComponent(targetId)}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              console.log('✅ Sincronizado com servidor');
                            }
                          } catch (e) {
                            console.warn('⚠️ Servidor offline, mas exclusão local realizada');
                          }
                        }
                        
                        alert(`✅ Lead de ${l.name} excluído com sucesso!`);
                      } catch (e:any) {
                        console.error('❌ Erro ao excluir:', e);
                        alert(`❌ Erro ao excluir lead:\n\n${e?.message || 'Erro desconhecido'}\n\nVerifique o console para detalhes.`);
                      }
                    }} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-xs sm:text-sm">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {leads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum lead pendente.</div>
          ) : (
            leads.map((l: any) => (
              <div key={l.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-800 mb-1">{l.name}</h3>
                  <p className="text-sm text-gray-600">{l.email}</p>
                  {l.phone && <p className="text-sm text-gray-600 mt-1">{l.phone}</p>}
                  {l.company && <p className="text-sm text-gray-600 mt-1">Empresa: {l.company}</p>}
                  {l.username && <p className="text-xs text-gray-500 mt-2">Usuário sugerido: {l.username}</p>}
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button 
                    onClick={async()=>{
                      if (!confirm(`Deseja aprovar o lead de ${l.name} e criar a conta?\n\nSerá criado um usuário com acesso trial de 30 dias.`)) return;
                      
                      // APROVAÇÃO OFFLINE - Funciona SEM servidor
                      try {
                        console.log('✅ Aprovando lead:', l.name, l.email);
                        
                        // 1. Criar usuário localmente PRIMEIRO (funciona offline)
                        const pendingUserData = {
                          name: l.name,
                          email: l.email,
                          phone: l.phone,
                          company: l.company,
                          password: 'demo123' // Senha padrão para leads
                        };
                        const { username, userId, password } = createUserOffline(pendingUserData);
                        
                        // 2. Remover do leads
                        const stored = JSON.parse(localStorage.getItem('pending_leads') || '[]');
                        const filtered = stored.filter((x: any) => {
                          const xId = x?.id ? String(x.id) : null;
                          const targetId = String(l.id);
                          return xId !== targetId;
                        });
                        localStorage.setItem('pending_leads', JSON.stringify(filtered));
                        
                        // 3. Atualizar lista local imediatamente
                        setLeads(prev => prev.filter(x => {
                          const xId = x?.id ? String(x.id) : null;
                          return xId !== String(l.id);
                        }));
                        
                        // 4. Atualizar lista de usuários - FORÇAR ATUALIZAÇÃO COMPLETA
                        const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
                        // Garantir que todos os usuários tenham informações completas
                        const usersWithCompleteInfo = storedUsers.map((usr: any) => ({
                          ...usr,
                          email: usr.email || '',
                          phone: usr.phone || '',
                          name: usr.name || usr.username,
                          status: usr.status || 'trial'
                        }));
                        setUsers(usersWithCompleteInfo);
                        
                        // Atualizar métricas também
                        loadOverviewMetrics();
                        
                        // Forçar recarregamento da lista de usuários
                        setTimeout(() => {
                          loadUsers(true);
                        }, 500);
                        
                        // 5. Tentar sincronizar com servidor (se disponível) - não bloqueia
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          try {
                            const online = await backendService.isOnline();
                            if (online) {
                              await backendService.post(
                                `/api/leads/${encodeURIComponent(l.id)}/approve`,
                                {},
                                {
                                  headers: { Authorization: `Bearer ${token}` }
                                }
                              );
                              console.log('✅ Sincronizado com servidor');
                              
                              // Recarregar usuários do servidor
                              try {
                                const { data: usersData } = await backendService.get('/api/users', {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                if (usersData && Array.isArray(usersData)) {
                                  const mapped = usersData.map((u:any)=>({ 
                                    id: u.id, 
                                    username: u.username, 
                                    role: u.role, 
                                    status: u.license?.status || 'active', 
                                    email: u.email || '',
                                    phone: u.phone || '',
                                    name: u.name || u.username,
                                    createdAt: u.createdAt || new Date().toISOString() 
                                  }));
                                  setUsers(mapped);
                                  localStorage.setItem('ploutos_users', JSON.stringify(mapped));
                                }
                              } catch {}
                            }
                          } catch (e) {
                            console.warn('⚠️ Servidor offline, mas aprovação local realizada');
                          }
                        }
                        
                        alert(`✅ Usuário criado e lead aprovado!\n\nUsuário: ${username}\nSenha: ${password}\nEmail: ${l.email}\nStatus: Trial (30 dias)\n\nO usuário pode fazer login agora!`);
                      } catch (e:any) {
                        console.error('❌ Erro ao aprovar:', e);
                        alert(`❌ Erro ao aprovar lead:\n\n${e?.message || 'Erro desconhecido'}\n\nVerifique o console para detalhes.`);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Aprovar
                  </button>
                  <button 
                    onClick={async()=>{
                      if (!confirm(`Deseja excluir DEFINITIVAMENTE o lead de ${l.name}?\n\nEsta ação não pode ser desfeita!`)) return;
                      
                      // VALIDAÇÃO CRÍTICA - Garantir que temos ID válido
                      if (!l.id || typeof l.id !== 'string') {
                        alert(`❌ ERRO CRÍTICO: Lead sem ID válido!\n\nNome: ${l.name}\nEmail: ${l.email}\n\nNão é possível excluir sem ID único.`);
                        console.error('❌ Tentativa de excluir lead sem ID:', l);
                        return;
                      }
                      
                      const targetId = String(l.id); // Garantir que é string
                      console.log(`🗑️  Excluindo lead:`, {
                        id: targetId,
                        name: l.name,
                        email: l.email,
                        totalAntes: leads.length
                      });
                      
                      // EXCLUSÃO OFFLINE - Funciona SEM servidor
                      try {
                        // 1. Remover do localStorage com validação rigorosa
                        const stored = JSON.parse(localStorage.getItem('pending_leads') || '[]');
                        const antes = stored.length;
                        
                        // FILTRO RIGOROSO - Comparação estrita por ID
                        const filtered = stored.filter((x: any) => {
                          const xId = x?.id ? String(x.id) : null;
                          const match = xId === targetId;
                          if (!xId) {
                            console.warn('⚠️ Lead sem ID encontrado no localStorage:', x);
                          }
                          return !match; // Manter apenas os que NÃO são o alvo
                        });
                        
                        const depois = filtered.length;
                        const removidos = antes - depois;
                        
                        if (removidos !== 1) {
                          console.error(`❌ ERRO: Esperado remover 1 lead, mas removeu ${removidos}!`, {
                            antes,
                            depois,
                            targetId,
                            encontrados: stored.filter((x: any) => String(x?.id) === targetId)
                          });
                          alert(`❌ ERRO CRÍTICO: Problema na exclusão!\n\nEsperado remover 1, mas removeu ${removidos}.\n\nVerifique o console para detalhes.`);
                          return;
                        }
                        
                        localStorage.setItem('pending_leads', JSON.stringify(filtered));
                        console.log(`✅ Removido do localStorage: ${removidos} lead(s)`);
                        
                        // 2. Remover da lista local com validação
                        setLeads(prev => {
                          const antesLista = prev.length;
                          const filtrado = prev.filter(x => {
                            const xId = x?.id ? String(x.id) : null;
                            return xId !== targetId;
                          });
                          const depoisLista = filtrado.length;
                          const removidosLista = antesLista - depoisLista;
                          
                          if (removidosLista !== 1) {
                            console.error(`❌ ERRO na lista: Esperado remover 1, removeu ${removidosLista}`);
                          }
                          
                          return filtrado;
                        });
                        
                        // 3. Tentar sincronizar com servidor (se disponível) - não bloqueia
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          try {
                            const online = await backendService.isOnline();
                            if (online) {
                              await backendService.delete(`/api/leads/${encodeURIComponent(targetId)}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              console.log('✅ Sincronizado com servidor');
                            }
                          } catch (e) {
                            console.warn('⚠️ Servidor offline, mas exclusão local realizada');
                          }
                        }
                        
                        alert(`✅ Lead de ${l.name} excluído com sucesso!`);
                      } catch (e:any) {
                        console.error('❌ Erro ao excluir:', e);
                        alert(`❌ Erro ao excluir lead:\n\n${e?.message || 'Erro desconhecido'}\n\nVerifique o console para detalhes.`);
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderPendingUsers = () => (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="p-4 sm:p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Cadastros Pendentes de Aprovação</h2>
          <button 
            onClick={() => {
              backendService.clearCache();
              loadPendingUsers(true);
            }} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm sm:text-base whitespace-nowrap"
            disabled={loading}
          >
            {loading ? 'Carregando...' : '🔄 Recarregar'}
          </button>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        {loading && <div className="text-sm text-gray-500 mb-4">Carregando...</div>}
        {loadError && <div className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-lg">{loadError}</div>}
        
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nome</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Telefone</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Empresa/CNPJ</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">CPF</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.length === 0 && (
                <tr>
                  <td className="py-6 px-4 text-gray-500 text-center" colSpan={8}>
                    Nenhum cadastro pendente de aprovação.
                  </td>
                </tr>
              )}
              {pendingUsers.map((u: any) => (
                <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium">{u.name}</td>
                  <td className="py-3 px-4">{u.email}</td>
                  <td className="py-3 px-4">{u.phone}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      u.userType === 'pessoa-juridica' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {u.userType === 'pessoa-juridica' ? 'PJ' : 'PF'}
                    </span>
                  </td>
                  <td className="py-3 px-4">{u.company || u.cnpj || '-'}</td>
                  <td className="py-3 px-4">{u.cpf || '-'}</td>
                  <td className="py-3 px-4 text-gray-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                    <button 
                      onClick={async () => {
                        if (!confirm(`Deseja aprovar o cadastro de ${u.name} e criar a conta?\n\nSerá criado um usuário com acesso trial de 30 dias.`)) return;
                        
                        // APROVAÇÃO OFFLINE - Funciona SEM servidor
                        try {
                          console.log('✅ Aprovando cadastro pendente:', u.name, u.email);
                          
                          // 1. Criar usuário localmente PRIMEIRO (funciona offline)
                          const { username, userId, password } = createUserOffline(u);
                          
                          // 2. Remover do cadastro pendente
                          const stored = JSON.parse(localStorage.getItem('pending_users') || '[]');
                          const filtered = stored.filter((x: any) => {
                            const xId = x?.id ? String(x.id) : null;
                            const targetId = String(u.id);
                            return xId !== targetId;
                          });
                          localStorage.setItem('pending_users', JSON.stringify(filtered));
                          
                          // 3. Atualizar lista local imediatamente
                          setPendingUsers(prev => prev.filter(x => {
                            const xId = x?.id ? String(x.id) : null;
                            return xId !== String(u.id);
                          }));
                          
                          // 4. Atualizar lista de usuários - FORÇAR ATUALIZAÇÃO COMPLETA
                          const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
                          // Garantir que todos os usuários tenham informações completas
                          const usersWithCompleteInfo = storedUsers.map((usr: any) => ({
                            ...usr,
                            email: usr.email || '',
                            phone: usr.phone || '',
                            name: usr.name || usr.username,
                            status: usr.status || 'trial'
                          }));
                          setUsers(usersWithCompleteInfo);
                          
                          // Atualizar métricas também
                          loadOverviewMetrics();
                          
                          // Forçar recarregamento da lista de usuários
                          setTimeout(() => {
                            loadUsers(true);
                          }, 500);
                          
                          // 5. Tentar sincronizar com servidor (se disponível) - não bloqueia
                          const token = localStorage.getItem('auth_token');
                          if (token) {
                            try {
                              const online = await backendService.isOnline();
                              if (online) {
                                await backendService.post(
                                  `/api/pending-users/${encodeURIComponent(u.id)}/approve`,
                                  {},
                                  {
                                    headers: { Authorization: `Bearer ${token}` }
                                  }
                                );
                                console.log('✅ Sincronizado com servidor');
                                
                                // Recarregar usuários do servidor
                                try {
                                  const { data: usersData } = await backendService.get('/api/users', {
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (usersData && Array.isArray(usersData)) {
                                    const mapped = usersData.map((usr: any) => ({
                                      id: usr.id,
                                      username: usr.username,
                                      role: usr.role,
                                      status: usr.license?.status || 'active',
                                      email: usr.email || '',
                                      phone: usr.phone || '',
                                      name: usr.name || usr.username,
                                      createdAt: usr.createdAt || new Date().toISOString()
                                    }));
                                    setUsers(mapped);
                                    localStorage.setItem('ploutos_users', JSON.stringify(mapped));
                                  }
                                } catch {}
                              }
                            } catch (e) {
                              console.warn('⚠️ Servidor offline, mas aprovação local realizada');
                            }
                          }
                          
                          alert(`✅ Usuário criado com sucesso!\n\nUsuário: ${username}\nSenha: ${password}\nEmail: ${u.email}\nStatus: Trial (30 dias)\n\nO usuário pode fazer login agora!`);
                        } catch (e: any) {
                          console.error('❌ Erro ao aprovar:', e);
                          alert(`❌ Erro ao aprovar cadastro:\n\n${e?.message || 'Erro desconhecido'}\n\nVerifique o console para detalhes.`);
                        }
                      }} 
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Aprovar
                    </button>
                    <button 
                      onClick={async () => {
                        if (!confirm(`Deseja excluir DEFINITIVAMENTE o cadastro pendente de ${u.name}?\n\nEsta ação não pode ser desfeita!`)) return;
                        
                        // VALIDAÇÃO CRÍTICA - Garantir que temos ID válido
                        if (!u.id || typeof u.id !== 'string') {
                          alert(`❌ ERRO CRÍTICO: Cadastro sem ID válido!\n\nNome: ${u.name}\nEmail: ${u.email}\n\nNão é possível excluir sem ID único.`);
                          console.error('❌ Tentativa de excluir cadastro sem ID:', u);
                          return;
                        }
                        
                        const targetId = String(u.id); // Garantir que é string
                        console.log(`🗑️  Excluindo cadastro pendente:`, {
                          id: targetId,
                          name: u.name,
                          email: u.email,
                          totalAntes: pendingUsers.length
                        });
                        
                        // EXCLUSÃO OFFLINE - Funciona SEM servidor
                        try {
                          // 1. Remover do localStorage com validação rigorosa
                          const stored = JSON.parse(localStorage.getItem('pending_users') || '[]');
                          const antes = stored.length;
                          
                          // FILTRO RIGOROSO - Comparação estrita por ID
                          const filtered = stored.filter((x: any) => {
                            const xId = x?.id ? String(x.id) : null;
                            const match = xId === targetId;
                            if (!xId) {
                              console.warn('⚠️ Cadastro sem ID encontrado no localStorage:', x);
                            }
                            return !match; // Manter apenas os que NÃO são o alvo
                          });
                          
                          const depois = filtered.length;
                          const removidos = antes - depois;
                          
                          if (removidos !== 1) {
                            console.error(`❌ ERRO: Esperado remover 1 cadastro, mas removeu ${removidos}!`, {
                              antes,
                              depois,
                              targetId,
                              encontrados: stored.filter((x: any) => String(x?.id) === targetId)
                            });
                            alert(`❌ ERRO CRÍTICO: Problema na exclusão!\n\nEsperado remover 1, mas removeu ${removidos}.\n\nVerifique o console para detalhes.`);
                            return;
                          }
                          
                          localStorage.setItem('pending_users', JSON.stringify(filtered));
                          console.log(`✅ Removido do localStorage: ${removidos} cadastro(s)`);
                          
                          // 2. Remover da lista local com validação
                          setPendingUsers(prev => {
                            const antesLista = prev.length;
                            const filtrado = prev.filter(x => {
                              const xId = x?.id ? String(x.id) : null;
                              return xId !== targetId;
                            });
                            const depoisLista = filtrado.length;
                            const removidosLista = antesLista - depoisLista;
                            
                            if (removidosLista !== 1) {
                              console.error(`❌ ERRO na lista: Esperado remover 1, removeu ${removidosLista}`);
                            }
                            
                            return filtrado;
                          });
                          
                          // 3. Tentar sincronizar com servidor (se disponível) - não bloqueia
                          const token = localStorage.getItem('auth_token');
                          if (token) {
                            try {
                              const online = await backendService.isOnline();
                              if (online) {
                                await backendService.delete(`/api/pending-users/${encodeURIComponent(targetId)}`, {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                console.log('✅ Sincronizado com servidor');
                              }
                            } catch (e) {
                              console.warn('⚠️ Servidor offline, mas exclusão local realizada');
                            }
                          }
                          
                          alert(`✅ Cadastro de ${u.name} excluído com sucesso!`);
                        } catch (e: any) {
                          console.error('❌ Erro ao excluir:', e);
                          alert(`❌ Erro ao excluir cadastro:\n\n${e?.message || 'Erro desconhecido'}\n\nVerifique o console para detalhes.`);
                        }
                      }} 
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Excluir</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum cadastro pendente de aprovação.</div>
          ) : (
            pendingUsers.map((u: any) => (
              <div key={u.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 flex-1">{u.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ml-2 flex-shrink-0 ${
                      u.userType === 'pessoa-juridica' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {u.userType === 'pessoa-juridica' ? 'PJ' : 'PF'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{u.email}</p>
                  {u.phone && <p className="text-sm text-gray-600 mb-1">{u.phone}</p>}
                  {u.company && <p className="text-sm text-gray-600 mb-1">Empresa: {u.company}</p>}
                  {u.cnpj && <p className="text-xs text-gray-500 mb-1">CNPJ: {u.cnpj}</p>}
                  {u.cpf && <p className="text-xs text-gray-500 mb-1">CPF: {u.cpf}</p>}
                  {u.createdAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Data: {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button 
                    onClick={async () => {
                      if (!confirm(`Deseja aprovar o cadastro de ${u.name} e criar a conta?\n\nSerá criado um usuário com acesso trial de 30 dias.`)) return;
                      
                      // APROVAÇÃO OFFLINE - Funciona SEM servidor
                      try {
                        console.log('✅ Aprovando cadastro pendente:', u.name, u.email);
                        
                        // 1. Criar usuário localmente PRIMEIRO (funciona offline)
                        const { username, userId, password } = createUserOffline(u);
                        
                        // 2. Remover do cadastro pendente
                        const stored = JSON.parse(localStorage.getItem('pending_users') || '[]');
                        const filtered = stored.filter((x: any) => {
                          const xId = x?.id ? String(x.id) : null;
                          const targetId = String(u.id);
                          return xId !== targetId;
                        });
                        localStorage.setItem('pending_users', JSON.stringify(filtered));
                        
                        // 3. Atualizar lista local imediatamente
                        setPendingUsers(prev => prev.filter(x => {
                          const xId = x?.id ? String(x.id) : null;
                          return xId !== String(u.id);
                        }));
                        
                        // 4. Atualizar lista de usuários - FORÇAR ATUALIZAÇÃO COMPLETA
                        const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
                        // Garantir que todos os usuários tenham informações completas
                        const usersWithCompleteInfo = storedUsers.map((usr: any) => ({
                          ...usr,
                          email: usr.email || '',
                          phone: usr.phone || '',
                          name: usr.name || usr.username,
                          status: usr.status || 'trial'
                        }));
                        setUsers(usersWithCompleteInfo);
                        
                        // Atualizar métricas também
                        loadOverviewMetrics();
                        
                        // Forçar recarregamento da lista de usuários
                        setTimeout(() => {
                          loadUsers(true);
                        }, 500);
                        
                        // 5. Tentar sincronizar com servidor (se disponível) - não bloqueia
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          try {
                            const online = await backendService.isOnline();
                            if (online) {
                              await backendService.post(
                                `/api/pending-users/${encodeURIComponent(u.id)}/approve`,
                                {},
                                {
                                  headers: { Authorization: `Bearer ${token}` }
                                }
                              );
                              console.log('✅ Sincronizado com servidor');
                              
                              // Recarregar usuários do servidor
                              try {
                                const { data: usersData } = await backendService.get('/api/users', {
                                  headers: { Authorization: `Bearer ${token}` }
                                });
                                if (usersData && Array.isArray(usersData)) {
                                  const mapped = usersData.map((usr: any) => ({
                                    id: usr.id,
                                    username: usr.username,
                                    role: usr.role,
                                    status: usr.license?.status || 'active',
                                    email: usr.email || '',
                                    phone: usr.phone || '',
                                    name: usr.name || usr.username,
                                    createdAt: usr.createdAt || new Date().toISOString()
                                  }));
                                  setUsers(mapped);
                                  localStorage.setItem('ploutos_users', JSON.stringify(mapped));
                                }
                              } catch {}
                            }
                          } catch (e) {
                            console.warn('⚠️ Servidor offline, mas aprovação local realizada');
                          }
                        }
                        
                        alert(`✅ Usuário criado com sucesso!\n\nUsuário: ${username}\nSenha: ${password}\nEmail: ${u.email}\nStatus: Trial (30 dias)\n\nO usuário pode fazer login agora!`);
                      } catch (e: any) {
                        console.error('❌ Erro ao aprovar:', e);
                        alert(`❌ Erro ao aprovar cadastro:\n\n${e?.message || 'Erro desconhecido'}\n\nVerifique o console para detalhes.`);
                      }
                    }} 
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button 
                    onClick={async () => {
                      if (!confirm(`Deseja excluir DEFINITIVAMENTE o cadastro pendente de ${u.name}?\n\nEsta ação não pode ser desfeita!`)) return;
                      
                      // VALIDAÇÃO CRÍTICA - Garantir que temos ID válido
                      if (!u.id || typeof u.id !== 'string') {
                        alert(`❌ ERRO CRÍTICO: Cadastro sem ID válido!\n\nNome: ${u.name}\nEmail: ${u.email}\n\nNão é possível excluir sem ID único.`);
                        console.error('❌ Tentativa de excluir cadastro sem ID:', u);
                        return;
                      }
                      
                      const targetId = String(u.id); // Garantir que é string
                      console.log(`🗑️  Excluindo cadastro pendente:`, {
                        id: targetId,
                        name: u.name,
                        email: u.email,
                        totalAntes: pendingUsers.length
                      });
                      
                      // EXCLUSÃO OFFLINE - Funciona SEM servidor
                      try {
                        // 1. Remover do localStorage com validação rigorosa
                        const stored = JSON.parse(localStorage.getItem('pending_users') || '[]');
                        const antes = stored.length;
                        
                        // FILTRO RIGOROSO - Comparação estrita por ID
                        const filtered = stored.filter((x: any) => {
                          const xId = x?.id ? String(x.id) : null;
                          const match = xId === targetId;
                          if (!xId) {
                            console.warn('⚠️ Cadastro sem ID encontrado no localStorage:', x);
                          }
                          return !match; // Manter apenas os que NÃO são o alvo
                        });
                        
                        const depois = filtered.length;
                        const removidos = antes - depois;
                        
                        if (removidos !== 1) {
                          console.error(`❌ ERRO: Esperado remover 1 cadastro, mas removeu ${removidos}!`, {
                            antes,
                            depois,
                            targetId,
                            encontrados: stored.filter((x: any) => String(x?.id) === targetId)
                          });
                          alert(`❌ ERRO CRÍTICO: Problema na exclusão!\n\nEsperado remover 1, mas removeu ${removidos}.\n\nVerifique o console para detalhes.`);
                          return;
                        }
                        
                        localStorage.setItem('pending_users', JSON.stringify(filtered));
                        console.log(`✅ Removido do localStorage: ${removidos} cadastro(s)`);
                        
                        // 2. Remover da lista local com validação
                        setPendingUsers(prev => {
                          const antesLista = prev.length;
                          const filtrado = prev.filter(x => {
                            const xId = x?.id ? String(x.id) : null;
                            return xId !== targetId;
                          });
                          const depoisLista = filtrado.length;
                          const removidosLista = antesLista - depoisLista;
                          
                          if (removidosLista !== 1) {
                            console.error(`❌ ERRO na lista: Esperado remover 1, removeu ${removidosLista}`);
                          }
                          
                          return filtrado;
                        });
                        
                        // 3. Tentar sincronizar com servidor (se disponível) - não bloqueia
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          try {
                            const online = await backendService.isOnline();
                            if (online) {
                              await backendService.delete(`/api/pending-users/${encodeURIComponent(targetId)}`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              console.log('✅ Sincronizado com servidor');
                            }
                          } catch (e) {
                            console.warn('⚠️ Servidor offline, mas exclusão local realizada');
                          }
                        }
                        
                        alert(`✅ Cadastro de ${u.name} excluído com sucesso!`);
                      } catch (e: any) {
                        console.error('❌ Erro ao excluir:', e);
                        alert(`❌ Erro ao excluir cadastro:\n\n${e?.message || 'Erro desconhecido'}\n\nVerifique o console para detalhes.`);
                      }
                    }} 
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderTenants = () => (
    <div className="space-y-6">
      {/* Header */}
    <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building className="h-8 w-8 text-indigo-600" />
              Gerenciamento de Organizações
            </h2>
            <p className="text-gray-600 mt-2">Monitore e gerencie todas as organizações da plataforma</p>
          </div>
          <button 
            onClick={() => {
          const name = prompt('Nome da organização');
          if (!name) return;
          const id = `t${Date.now()}`;
              setTenants(prev=>[{ 
                id, 
                name, 
                domain: `${name.toLowerCase().replace(/\s+/g, '')}.local`, 
                status: 'active', 
                createdAt: new Date().toISOString().slice(0,10), 
                userCount: 0 
              }, ...prev]);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nova Organização
          </button>
      </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total de Organizações</p>
                <p className="text-2xl font-bold">{tenants.length}</p>
              </div>
              <Building className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Organizações Ativas</p>
                <p className="text-2xl font-bold">{tenants.filter(t => t.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total de Usuários</p>
                <p className="text-lg font-bold">{tenants.reduce((sum, t) => sum + t.userCount, 0)}</p>
              </div>
              <Users className="h-8 w-8 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Média de Usuários</p>
                <p className="text-lg font-bold">
                  {tenants.length > 0 ? (tenants.reduce((sum, t) => sum + t.userCount, 0) / tenants.length).toFixed(1) : '0'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Organizações */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Organizações Registradas</h3>
        </div>
        
      <div className="overflow-x-auto">
        <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organização
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domínio
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuários
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Building className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">ID: {tenant.id}</div>
                      </div>
                    </div>
                </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{tenant.domain}</div>
                    <div className="text-sm text-gray-500">Domínio personalizado</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{tenant.userCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tenant.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : tenant.status === 'suspended'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const name = prompt('Novo nome', tenant.name) || tenant.name;
                          const domain = prompt('Novo domínio', tenant.domain) || tenant.domain;
                          setTenants(prev => prev.map(t => 
                            t.id === tenant.id 
                              ? { ...t, name, domain }
                              : t
                          ));
                        }}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
                          setTenants(prev => prev.map(t => 
                            t.id === tenant.id 
                              ? { ...t, status: newStatus }
                              : t
                          ));
                        }}
                        className={`font-medium ${
                          tenant.status === 'active' 
                            ? 'text-red-600 hover:text-red-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {tenant.status === 'active' ? 'Suspender' : 'Ativar'}
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm('Tem certeza que deseja excluir esta organização?')) return;
                          setTenants(prev => prev.filter(t => t.id !== tenant.id));
                        }}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        Excluir
                      </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {tenants.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma organização encontrada</h3>
            <p className="text-gray-500">Comece criando uma nova organização.</p>
          </div>
        )}
                    </div>
                    </div>
  );

  const openPlanModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        name: plan.name,
        priceCents: plan.price,
        description: plan.description || '',
        maxUsers: plan.maxUsers || 1,
        featuresList: plan.featuresList || [''],
        interval: 'monthly',
        isRecommended: plan.isRecommended || false
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        name: '',
        priceCents: 0,
        description: '',
        maxUsers: 1,
        featuresList: [''],
        interval: 'monthly',
        isRecommended: false
      });
    }
    setShowPlanModal(true);
  };

  const savePlan = () => {
    if (!planForm.name || planForm.priceCents <= 0) {
      alert('Nome e preço são obrigatórios');
      return;
    }

    const planId = editingPlan?.id || `p${Date.now()}`;
    const newPlan: Plan = {
      id: planId,
      name: planForm.name,
      price: planForm.priceCents,
      features: planForm.featuresList.filter(f => f.trim()).join(', '),
      status: 'active',
      createdAt: editingPlan?.createdAt || new Date().toISOString().slice(0,10),
      isRecommended: planForm.isRecommended,
      description: planForm.description,
      maxUsers: planForm.maxUsers,
      featuresList: planForm.featuresList.filter(f => f.trim())
    };

    if (editingPlan) {
      setPlans(prev => prev.map(p => p.id === planId ? newPlan : p));
    } else {
      setPlans(prev => [newPlan, ...prev]);
    }

    // Salvar no serviço
    const existing = plansService.getPlans();
    const record: PlanRecord = {
      id: planId,
      name: planForm.name,
      priceCents: planForm.priceCents,
      interval: planForm.interval,
      features: newPlan.features,
      status: 'active',
      createdAt: newPlan.createdAt,
      isRecommended: planForm.isRecommended,
      description: planForm.description,
      maxUsers: planForm.maxUsers,
      featuresList: newPlan.featuresList
    };

    if (editingPlan) {
      const updated = existing.map(p => p.id === planId ? record : p);
      plansService.savePlans(updated);
    } else {
      plansService.savePlans([record, ...existing]);
    }

    setShowPlanModal(false);
  };

  const deletePlan = (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    
    setPlans(prev => prev.filter(p => p.id !== planId));
    const all = plansService.getPlans().filter(p => p.id !== planId);
    plansService.savePlans(all);
  };

  const toggleRecommended = (planId: string) => {
    plansService.setRecommendedPlan(planId);
    setPlans(prev => prev.map(p => ({
      ...p,
      isRecommended: p.id === planId
    })));
  };

  const addFeature = () => {
    setPlanForm(prev => ({
      ...prev,
      featuresList: [...prev.featuresList, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setPlanForm(prev => ({
      ...prev,
      featuresList: prev.featuresList.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      featuresList: prev.featuresList.filter((_, i) => i !== index)
    }));
  };

  const renderPlans = () => (
    <div className="space-y-6">
      {/* Header */}
    <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Crown className="h-8 w-8 text-indigo-600" />
              Gerenciamento de Planos
            </h2>
            <p className="text-gray-600 mt-2">Configure e gerencie os planos de assinatura da plataforma</p>
          </div>
          <button 
            onClick={() => openPlanModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Novo Plano
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total de Planos</p>
                <p className="text-2xl font-bold">{plans.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Planos Ativos</p>
                <p className="text-2xl font-bold">{plans.filter(p => p.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Plano Recomendado</p>
                <p className="text-lg font-bold">{plans.find(p => p.isRecommended)?.name || 'Nenhum'}</p>
              </div>
              <Star className="h-8 w-8 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Preço Médio</p>
                <p className="text-lg font-bold">
                  R$ {plans.length > 0 ? (plans.reduce((sum, p) => sum + p.price, 0) / plans.length / 100).toFixed(2) : '0,00'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div 
            key={plan.id} 
            className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl ${
              plan.isRecommended ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''
            }`}
          >
            {/* Header do Card */}
            <div className={`p-6 ${plan.isRecommended ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${plan.isRecommended ? 'bg-white bg-opacity-20' : 'bg-indigo-100'}`}>
                    <Crown className={`h-6 w-6 ${plan.isRecommended ? 'text-white' : 'text-indigo-600'}`} />
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${plan.isRecommended ? 'text-white' : 'text-gray-900'}`}>
                      {plan.name}
                    </h3>
                    {plan.isRecommended && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 text-yellow-300 fill-current" />
                        <span className="text-yellow-200 text-sm font-medium">Recomendado</span>
                  </div>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  plan.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {plan.status}
                </div>
              </div>

              {/* Preço */}
              <div className="mb-4">
                <div className={`text-3xl font-bold ${plan.isRecommended ? 'text-white' : 'text-gray-900'}`}>
                  R$ {(plan.price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className={`text-sm ${plan.isRecommended ? 'text-indigo-100' : 'text-gray-600'}`}>
                  por mês
                </div>
              </div>

              {/* Descrição */}
              {plan.description && (
                <p className={`text-sm ${plan.isRecommended ? 'text-indigo-100' : 'text-gray-600'}`}>
                  {plan.description}
                </p>
              )}
            </div>

            {/* Features */}
            <div className="p-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-indigo-600" />
                Recursos Inclusos
              </h4>
              <ul className="space-y-2 mb-6">
                {plan.featuresList && plan.featuresList.length > 0 ? (
                  plan.featuresList.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))
                ) : (
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {plan.features}
                  </li>
                )}
              </ul>

              {/* Limite de usuários */}
              {plan.maxUsers && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-indigo-600" />
                    {plan.maxUsers === -1 ? 'Usuários ilimitados' : `Até ${plan.maxUsers} usuários`}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                <button
                  onClick={() => openPlanModal(plan)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => toggleRecommended(plan.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    plan.isRecommended
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Star className={`h-4 w-4 ${plan.isRecommended ? 'fill-current' : ''}`} />
                  {plan.isRecommended ? 'Recomendado' : 'Recomendar'}
                </button>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação/Edição */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingPlan ? 'Editar Plano' : 'Novo Plano'}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Nome do Plano */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Ex: Plano Pro"
                />
              </div>

              {/* Preço e Intervalo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço (centavos) *
                  </label>
                  <input
                    type="number"
                    value={planForm.priceCents}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, priceCents: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo
                  </label>
                  <select
                    value={planForm.interval}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, interval: e.target.value as 'monthly' | 'yearly' }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="monthly">Mensal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descrição do plano..."
                />
              </div>

              {/* Limite de Usuários */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Usuários
                </label>
                <input
                  type="number"
                  value={planForm.maxUsers}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, maxUsers: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Digite -1 para ilimitado"
                />
                <p className="text-xs text-gray-500 mt-1">Digite -1 para usuários ilimitados</p>
              </div>

              {/* Recursos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recursos Inclusos
                </label>
                <div className="space-y-2">
                  {planForm.featuresList.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="Ex: Suporte prioritário"
                      />
                      {planForm.featuresList.length > 1 && (
                        <button
                          onClick={() => removeFeature(index)}
                          className="px-3 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addFeature}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Recurso
                  </button>
                </div>
              </div>

              {/* Plano Recomendado */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isRecommended"
                  checked={planForm.isRecommended}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, isRecommended: e.target.checked }))}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecommended" className="text-sm font-medium text-gray-700">
                  Marcar como plano recomendado
                </label>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={savePlan}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-6">
      {/* Header */}
    <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-indigo-600" />
              Gerenciamento de Assinaturas
            </h2>
            <p className="text-gray-600 mt-2">Monitore e gerencie todas as assinaturas ativas</p>
          </div>
          <button 
            onClick={() => {
          const tenantId = prompt('ID da organização');
          const planId = prompt('ID do plano');
          if (!tenantId || !planId) return;
          const id = `s${Date.now()}`;
              setSubscriptions(prev=>[{ 
                id, 
                tenantId, 
                planId, 
                status: 'active', 
                startDate: new Date().toISOString().slice(0,10), 
                endDate: '', 
                createdAt: new Date().toISOString().slice(0,10) 
              }, ...prev]);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Nova Assinatura
          </button>
      </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total de Assinaturas</p>
                <p className="text-2xl font-bold">{subscriptions.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Assinaturas Ativas</p>
                <p className="text-2xl font-bold">{subscriptions.filter(s => s.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Receita Mensal</p>
                <p className="text-lg font-bold">
                  R$ {subscriptions
                    .filter(s => s.status === 'active')
                    .reduce((sum, s) => {
                      const plan = plans.find(p => p.id === s.planId);
                      return sum + (plan?.price || 0);
                    }, 0) / 100
                    .toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Organizações</p>
                <p className="text-lg font-bold">{new Set(subscriptions.map(s => s.tenantId)).size}</p>
              </div>
              <Building className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Assinaturas */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Assinaturas Ativas</h3>
        </div>
        
      <div className="overflow-x-auto">
        <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organização
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Início
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Mensal
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
            </tr>
          </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.map(subscription => {
                const tenant = tenants.find(t => t.id === subscription.tenantId);
                const plan = plans.find(p => p.id === subscription.planId);
                
              return (
                  <tr key={subscription.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Building className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {tenant?.name || subscription.tenantId}
                          </div>
                          <div className="text-sm text-gray-500">
                            {tenant?.domain || 'Sem domínio'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          plan?.isRecommended ? 'bg-yellow-400' : 'bg-gray-300'
                        }`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {plan?.name || subscription.planId}
                          </div>
                          <div className="text-sm text-gray-500">
                            {plan?.maxUsers === -1 ? 'Usuários ilimitados' : `Até ${plan?.maxUsers || 0} usuários`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        subscription.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : subscription.status === 'expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {subscription.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(subscription.startDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      R$ {((plan?.price || 0) / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const status = prompt('Status (active|expired|suspended)', subscription.status) || subscription.status;
                            setSubscriptions(prev => prev.map(s => s.id === subscription.id ? { ...s, status } : s));
                          }}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm('Tem certeza que deseja excluir esta assinatura?')) return;
                            setSubscriptions(prev => prev.filter(s => s.id !== subscription.id));
                          }}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Excluir
                        </button>
                    </div>
                </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {subscriptions.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma assinatura encontrada</h3>
            <p className="text-gray-500">Comece criando uma nova assinatura para uma organização.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Função auxiliar para formatar datas com segurança
  const formatDateSafe = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return 'Data inválida';
    }
  };

  const formatDateTimeSafe = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleString('pt-BR');
    } catch (e) {
      return 'Data inválida';
    }
  };

  // Função para zerar valores mantendo apenas o que está ativo e limpar cache
  const resetAllLicensesAndClients = () => {
    const confirmMessage = `⚠️ ATENÇÃO: Esta ação irá:\n\n✅ MANTER apenas licenças e clientes com status 'active'\n🗑️ REMOVER todas as licenças expiradas, suspensas ou pendentes\n🗑️ REMOVER todos os clientes inativos\n🗑️ LIMPAR cache e dados temporários\n🗑️ LIMPAR solicitações de desbloqueio\n🗑️ LIMPAR logs de validação\n\nEsta ação NÃO PODE ser desfeita!\n\nDeseja continuar?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    const secondConfirm = `🔴 CONFIRMAÇÃO FINAL\n\nVocê está prestes a limpar todos os dados, mantendo apenas o que está ATIVO.\n\nTem CERTEZA ABSOLUTA?`;
    
    if (!window.confirm(secondConfirm)) {
      return;
    }
    
    try {
      // 1. MANTER APENAS LICENÇAS ATIVAS
      const allLicenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
      const activeLicenses = Array.isArray(allLicenses) 
        ? allLicenses.filter((l: any) => {
            // Manter apenas licenças com status 'active' ou 'trial' (se ainda válidas)
            if (l && (l.status === 'active' || l.status === 'trial')) {
              // Verificar se não está expirada
              if (l.expiresAt || l.validUntil) {
                const expiryDate = l.expiresAt || l.validUntil;
                const expiry = new Date(expiryDate);
                const now = new Date();
                return !isNaN(expiry.getTime()) && expiry > now;
              }
              return true; // Se não tem data de expiração, manter se estiver active/trial
            }
            return false;
          })
        : [];
      
      // Salvar apenas licenças ativas
      localStorage.setItem('ploutos_licenses', JSON.stringify(activeLicenses));
      console.log(`✅ Mantidas ${activeLicenses.length} licenças ativas de ${allLicenses.length} total`);
      
      // 2. MANTER APENAS USUÁRIOS ATIVOS (que tenham licença ativa)
      const allUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
      const activeUserIds = new Set(activeLicenses.map((l: any) => l.userId || l.username));
      const activeUsers = Array.isArray(allUsers)
        ? allUsers.filter((u: any) => {
            // Manter usuários que têm licença ativa OU são superadmin
            if (!u) return false;
            const hasActiveLicense = u.id && activeUserIds.has(u.id) || 
                                    u.username && activeUserIds.has(u.username) ||
                                    u.email && activeLicenses.some((l: any) => l.email === u.email);
            const isSuperAdmin = u.role === 'superadmin' || u.role === 'admin';
            return hasActiveLicense || isSuperAdmin;
          })
        : [];
      
      localStorage.setItem('ploutos_users', JSON.stringify(activeUsers));
      console.log(`✅ Mantidos ${activeUsers.length} usuários ativos de ${allUsers.length} total`);
      
      // 3. LIMPAR CHAVES APROVADAS (manter apenas as que correspondem a licenças ativas)
      const approvedKeys = JSON.parse(localStorage.getItem('approved_license_keys') || '[]');
      const activeLicenseKeys = new Set(activeLicenses.map((l: any) => l.key?.toUpperCase()));
      const activeApprovedKeys = Array.isArray(approvedKeys)
        ? approvedKeys.filter((k: any) => {
            if (!k || !k.licenseKey) return false;
            return activeLicenseKeys.has(k.licenseKey.toUpperCase());
          })
        : [];
      
      localStorage.setItem('approved_license_keys', JSON.stringify(activeApprovedKeys));
      console.log(`✅ Mantidas ${activeApprovedKeys.length} chaves aprovadas ativas de ${approvedKeys.length} total`);
      
      // 4. LIMPAR TODOS OS DADOS TEMPORÁRIOS E CACHE
      localStorage.removeItem('cashflow_unlock_requests'); // Solicitações de desbloqueio
      localStorage.removeItem('license_validation_logs'); // Logs antigos
      localStorage.removeItem('ploutos_license_validations'); // Validações antigas
      localStorage.removeItem('ploutos_leads'); // Leads antigos
      localStorage.removeItem('pending_users'); // Cadastros pendentes
      
      // Limpar licença individual do usuário logado (será recarregada se tiver licença ativa)
      const currentUser = localStorage.getItem('caixa_user');
      if (currentUser) {
        const userHasActiveLicense = activeLicenses.some((l: any) => 
          l.username === currentUser || l.userId === currentUser
        );
        if (!userHasActiveLicense) {
          localStorage.removeItem('ploutos_license');
        }
      }
      
      // 5. LIMPAR CACHE DO SERVIÇO DE LICENÇAS
      // Forçar recarregamento do serviço removendo e recriando a instância
      try {
        // Limpar qualquer cache interno do serviço
        if (typeof licenseService !== 'undefined') {
          // O serviço será reinicializado automaticamente no reload
          // Mas podemos forçar um reload dos dados
          const serviceLicenses = licenseService.getAllLicenses();
          if (serviceLicenses.length !== activeLicenses.length) {
            console.log('⚠️ Serviço de licenças será reinicializado no reload');
          }
        }
      } catch (e) {
        console.warn('Não foi possível acessar o serviço de licenças:', e);
      }
      
      // 6. LIMPAR OUTROS CACHES RELACIONADOS
      // Limpar cache de validações antigas (será reinicializado no reload)
      // Nota: Não podemos importar dinamicamente aqui, mas o reload resolverá isso
      
      // 7. GARANTIR QUE NÃO HÁ DADOS CORROMPIDOS
      // Validar estrutura dos dados mantidos
      const validatedActiveLicenses = activeLicenses.filter((l: any) => {
        return l && l.id && l.key && (l.status === 'active' || l.status === 'trial');
      });
      
      if (validatedActiveLicenses.length !== activeLicenses.length) {
        console.warn(`⚠️ ${activeLicenses.length - validatedActiveLicenses.length} licenças inválidas removidas`);
        localStorage.setItem('ploutos_licenses', JSON.stringify(validatedActiveLicenses));
      }
      
      console.log('✅ Limpeza concluída!');
      console.log(`📊 Resumo:`);
      console.log(`   - Licenças: ${activeLicenses.length} ativas (${allLicenses.length - activeLicenses.length} removidas)`);
      console.log(`   - Usuários: ${activeUsers.length} ativos (${allUsers.length - activeUsers.length} removidos)`);
      console.log(`   - Chaves: ${activeApprovedKeys.length} ativas (${approvedKeys.length - activeApprovedKeys.length} removidas)`);
      
      alert(`✅ Limpeza concluída com sucesso!\n\n📊 Resumo:\n- Licenças: ${activeLicenses.length} ativas mantidas\n- Usuários: ${activeUsers.length} ativos mantidos\n- Chaves: ${activeApprovedKeys.length} ativas mantidas\n\n🗑️ Todos os dados inativos e cache foram removidos.\n\nA página será recarregada.`);
      
      // Recarregar a página para aplicar as mudanças
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      alert('❌ Erro ao limpar dados. Verifique o console para mais detalhes.');
    }
  };

  const loadLicensesList = () => {
    const allLicenses = licenseService.getAllLicenses() || [];
    if (!Array.isArray(allLicenses)) {
      setLicensesList([]);
      return;
    }
    
    // Garantir que todas as datas sejam válidas
    const validatedLicenses = allLicenses.map((license: any) => {
      const safeLicense = { ...license };
      
      // Converter strings de data para objetos Date se necessário
      if (safeLicense.expiresAt && typeof safeLicense.expiresAt === 'string') {
        const date = new Date(safeLicense.expiresAt);
        safeLicense.expiresAt = isNaN(date.getTime()) ? new Date() : date;
      } else if (!safeLicense.expiresAt) {
        safeLicense.expiresAt = new Date();
      }
      
      if (safeLicense.validUntil && typeof safeLicense.validUntil === 'string') {
        const date = new Date(safeLicense.validUntil);
        safeLicense.validUntil = isNaN(date.getTime()) ? new Date() : date;
      } else if (!safeLicense.validUntil) {
        safeLicense.validUntil = safeLicense.expiresAt || new Date();
      }
      
      if (safeLicense.lastUsed && typeof safeLicense.lastUsed === 'string') {
        const date = new Date(safeLicense.lastUsed);
        safeLicense.lastUsed = isNaN(date.getTime()) ? new Date() : date;
      } else if (!safeLicense.lastUsed) {
        safeLicense.lastUsed = new Date();
      }
      
      if (safeLicense.createdAt && typeof safeLicense.createdAt === 'string') {
        const date = new Date(safeLicense.createdAt);
        safeLicense.createdAt = isNaN(date.getTime()) ? new Date() : date;
      } else if (!safeLicense.createdAt) {
        safeLicense.createdAt = new Date();
      }
      
      return safeLicense;
    });
    
    setLicensesList(validatedLicenses);
  };

  const renderLicenses = () => {
    // Usar estado local de licenças (já validadas no loadLicensesList)
    const licenses = licensesList;
    
    const analytics = licenseService.getAnalytics() || {
      totalLicenses: 0,
      activeLicenses: 0,
      expiredLicenses: 0,
      suspendedLicenses: 0,
      pendingLicenses: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      averageUsage: 0,
      topPlans: [],
      usageTrends: []
    };
    
    const insights = (licenseService.analyzeLicenseUsage() || []);

    return (
      <div className="space-y-6 relative">
        
        {/* Header com gradiente moderno */}
        <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30 rounded-2xl shadow-xl border border-indigo-100/50 p-8 backdrop-blur-sm relative overflow-hidden animate-fade-in">
          {/* Efeito de brilho animado */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-4 animate-scale-in" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                  <Key className="h-8 w-8 text-white animate-pulse-glow" />
                </div>
                Validador de Licenças
              </h2>
              <p className="text-gray-600 mt-2 text-lg font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                Monitore, valide e gerencie todas as licenças do sistema em tempo real
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetAllLicensesAndClients}
                className="px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
                title="Zerar todas as informações de licenças e clientes"
              >
                <Trash2 className="w-5 h-5" />
                Zerar Tudo
              </button>
              <button 
                onClick={() => {
                  const username = prompt('Nome do usuário');
                  const email = prompt('Email do usuário');
                  const planId = prompt('ID do plano (p1, p2, p3)');
                  if (!username || !email || !planId) return;
                  
                  const planNames = { p1: 'Basic', p2: 'Starter', p3: 'Pro' };
                  licenseService.createLicense({
                    userId: `user_${Date.now()}`,
                    username,
                    email,
                    planId,
                    planName: planNames[planId as keyof typeof planNames] || 'Basic',
                    status: 'active'
                  });
                }}
                className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <Plus className="h-5 w-5" />
                Nova Licença
              </button>
              
              <button 
                onClick={() => {
                  const username = prompt('Nome de usuário para gerar chave de 30 dias grátis:');
                  if (!username) return;
                  
                  // Verificar se o usuário existe
                  const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
                  const user = storedUsers.find((u: any) => u.username === username);
                  
                  if (!user) {
                    alert(`❌ Usuário "${username}" não encontrado!\n\nVerifique se o nome de usuário está correto.`);
                    return;
                  }
                  
                  // Gerar chave de 30 dias
                  const licenseKey = `CF30D_${Date.now()}_${Math.random().toString(36).slice(2,9).toUpperCase()}`;
                  const expiresAt = new Date();
                  expiresAt.setDate(expiresAt.getDate() + 30);
                  
                  // Criar/atualizar licença
                  const licenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
                  const existingLicenseIndex = licenses.findIndex((l: any) => 
                    l.username === username || l.userId === user.id
                  );
                  
                  const newLicense = {
                    id: `license_${user.id}`,
                    userId: user.id,
                    username,
                    status: 'trial',
                    key: licenseKey,
                    validUntil: expiresAt.toISOString(),
                    trialDays: 30,
                    trialStart: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                  };
                  
                  if (existingLicenseIndex >= 0) {
                    licenses[existingLicenseIndex] = { ...licenses[existingLicenseIndex], ...newLicense };
                  } else {
                    licenses.push(newLicense);
                  }
                  
                  localStorage.setItem('ploutos_licenses', JSON.stringify(licenses));
                  
                  // Mostrar chave e copiar
                  const mensagem = `✅ Chave de 30 dias gerada com sucesso!\n\nUsuário: ${username}\nChave: ${licenseKey}\nVálida até: ${expiresAt.toLocaleDateString('pt-BR')}\n\n📋 INSTRUÇÕES PARA O CLIENTE:\n\n1. O cliente deve fazer login no painel\n2. Ir em "Meu Plano"\n3. Inserir a chave abaixo no campo "Ativar Licença"\n4. Clicar em "Ativar Licença"\n\n🔑 CHAVE DE LICENÇA:\n${licenseKey}\n\n⚠️ IMPORTANTE: Envie esta chave para o cliente!`;
                  
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(licenseKey).then(() => {
                      alert(mensagem + '\n\n✅ Chave copiada para área de transferência!');
                    }).catch(() => {
                      alert(mensagem);
                    });
                  } else {
                    alert(mensagem);
                  }
                  
                  // Atualizar métricas
                  loadOverviewMetrics();
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <Gift className="h-5 w-5" />
                Gerar Chave 30 Dias
              </button>
            </div>
        </div>

          {/* Estatísticas com animações e efeitos especiais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 relative z-10">
            <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 text-white p-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in hover:shadow-emerald-500/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-emerald-100 text-sm font-medium mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Licenças Ativas</p>
                  <p className="text-4xl font-black">{analytics.activeLicenses}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <CheckCircle className="h-10 w-10 text-white animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 text-white p-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in hover:shadow-red-500/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-red-100 text-sm font-medium mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Licenças Expiradas</p>
                  <p className="text-4xl font-black">{analytics.expiredLicenses}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <XCircle className="h-10 w-10 text-white animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in hover:shadow-blue-500/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Receita Total</p>
                  <p className="text-2xl font-black">R$ {(analytics.totalRevenue / 100).toFixed(2)}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <DollarSign className="h-10 w-10 text-white animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 text-white p-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in hover:shadow-purple-500/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-purple-100 text-sm font-medium mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Uso Médio</p>
                  <p className="text-2xl font-black">{analytics.averageUsage.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                  <BarChart3 className="h-10 w-10 text-white animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Insights da IA com animação */}
          {insights.length > 0 && (
            <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-300/50 rounded-2xl p-6 mb-6 shadow-lg backdrop-blur-sm relative overflow-hidden animate-scale-in">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/30 to-orange-400/30 rounded-full blur-2xl"></div>
              <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-3 text-lg relative z-10" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg animate-pulse-glow">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                Insights da IA
              </h4>
              <ul className="text-sm text-yellow-800 space-y-2 relative z-10" style={{ fontFamily: 'Inter, sans-serif' }}>
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <span className="text-yellow-600 font-bold">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* TODAS AS CHAVES DE LICENÇAS - VISÃO GERAL COMPLETA */}
        <div className="bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 rounded-2xl shadow-2xl border border-purple-100/50 p-6 mb-6 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <Key className="h-6 w-6 text-purple-600" />
              Todas as Chaves de Licenças dos Clientes
            </h3>
            <button
              onClick={() => {
                // Recarregar licenças
                const allLicenses = licenseService.getAllLicenses() || [];
                const ativas = allLicenses.filter((l: any) => l.status === 'active' || l.status === 'trial').length;
                const suspensas = allLicenses.filter((l: any) => l.status === 'suspended').length;
                const expiradas = allLicenses.filter((l: any) => l.status === 'expired').length;
                alert(`📊 Total de Licenças: ${allLicenses.length}\n\n✅ Ativas: ${ativas}\n⛔ Suspensas: ${suspensas}\n❌ Expiradas: ${expiradas}`);
              }}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium text-sm"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              📊 Estatísticas
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {licenses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p style={{ fontFamily: 'Inter, sans-serif' }}>Nenhuma licença registrada ainda</p>
                <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>As licenças aparecerão aqui quando forem criadas</p>
              </div>
            ) : (
              licenses.map((license: any) => (
                <div key={license.id} className={`bg-white/80 backdrop-blur-sm rounded-lg p-4 border ${
                  license.status === 'active' || license.status === 'trial' 
                    ? 'border-green-200' 
                    : license.status === 'suspended'
                    ? 'border-yellow-200'
                    : 'border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {license.status === 'active' || license.status === 'trial' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : license.status === 'suspended' ? (
                          <XCircle className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {license.username || 'Usuário'}
                          </p>
                          <p className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {license.email || 'Sem email'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          license.status === 'active' || license.status === 'trial'
                            ? 'bg-green-100 text-green-700' 
                            : license.status === 'suspended'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                          {license.status === 'active' ? '✅ Ativa' : license.status === 'trial' ? '🎁 Trial' : license.status === 'suspended' ? '⛔ Suspensa' : '❌ Expirada'}
                        </span>
                      </div>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>Chave de Licença:</p>
                        <div className="flex items-center justify-between">
                          <p className="font-mono font-bold text-gray-900 text-sm break-all" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {license.key || 'Sem chave'}
                          </p>
                          <button
                            onClick={() => {
                              if (license.key) {
                                navigator.clipboard.writeText(license.key);
                                alert('✅ Chave copiada para área de transferência!');
                              }
                            }}
                            className="ml-2 px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-medium transition-colors"
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            📋 Copiar
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <p><strong>Plano:</strong> {license.planName || 'N/A'}</p>
                        <p><strong>Validade:</strong> {formatDateSafe(license.expiresAt || license.validUntil)}</p>
                        {license.metadata?.source && (
                          <p><strong>Origem:</strong> {license.metadata.source === 'payment' ? '💰 Pagamento' : license.metadata.source === 'trial' ? '🎁 Trial 30 dias' : '🔑 Manual'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Histórico de Validações de Licenças */}
        <div className="bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 rounded-2xl shadow-2xl border border-blue-100/50 p-6 mb-6 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <Shield className="h-6 w-6 text-blue-600" />
              Histórico de Validações
            </h3>
            <button
              onClick={loadLicenseValidations}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium text-sm"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              🔄 Atualizar
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(!licenseValidations || licenseValidations.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p style={{ fontFamily: 'Inter, sans-serif' }}>Nenhuma validação registrada ainda</p>
                <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>As validações da landing page aparecerão aqui</p>
              </div>
            ) : (
              licenseValidations.map((val: any) => (
                <div key={val.id} className={`bg-white/80 backdrop-blur-sm rounded-lg p-4 border ${val.valid ? 'border-green-200' : 'border-red-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {val.valid ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <p className="font-mono font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {val.licenseKey}
                        </p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          val.source === 'landing_page' 
                            ? 'bg-purple-100 text-purple-700' 
                            : val.source === 'client_dashboard'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                          {val.source === 'landing_page' ? '🌐 Landing Page' : val.source === 'client_dashboard' ? '👤 Painel Cliente' : '🔌 API'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {val.username && <p><strong>Usuário:</strong> {val.username}</p>}
                        {val.email && <p><strong>Email:</strong> {val.email}</p>}
                        <p><strong>Data:</strong> {formatDateTimeSafe(val.validatedAt)}</p>
                        {!val.valid && val.reason && (
                          <p className="text-red-600"><strong>Motivo:</strong> {val.reason}</p>
                        )}
                        {val.valid && val.licenseData && (
                          <p className="text-green-600"><strong>Status:</strong> Licença válida - {val.licenseData.status || 'ativa'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lista de Licenças com design moderno */}
        <div className="bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 rounded-2xl shadow-2xl border border-indigo-100/50 overflow-hidden backdrop-blur-sm animate-fade-in">
          <div className="p-6 border-b border-indigo-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
            <h3 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <Key className="h-6 w-6 text-indigo-600" />
              Licenças Registradas
            </h3>
          </div>
          
      <div className="overflow-x-auto">
        <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Usuário
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Chave da Licença
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Plano
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Uso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Expiração
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Ações
                  </th>
            </tr>
          </thead>
              <tbody className="bg-white/80 backdrop-blur-sm divide-y divide-indigo-100/50">
                {licenses.map((license, index) => (
                  <tr key={license.id} className="hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform duration-300">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{license.username}</div>
                          <div className="text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>{license.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg inline-block">{license.key}</div>
                      <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>ID: {license.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 shadow-lg animate-pulse ${
                          license.planName === 'Pro' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 
                          license.planName === 'Starter' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 
                          'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}></div>
                        <div>
                          <div className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{license.planName}</div>
                          <div className="text-xs text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>{(license.features || []).length} recursos</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-xl shadow-md ${
                        license.status === 'active'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-pulse-glow'
                          : license.status === 'expired'
                          ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
                          : license.status === 'suspended'
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
                          : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                      }`} style={{ fontFamily: 'Inter, sans-serif' }}>
                        {license.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {license.usageCount}
                        {license.maxUsage !== -1 && ` / ${license.maxUsage}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        Último uso: {formatDateSafe(license.lastUsed)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateSafe(license.expiresAt || license.validUntil)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const newStatus = license.status === 'active' || license.status === 'trial' ? 'suspended' : 'active';
                            const confirmMessage = newStatus === 'suspended' 
                              ? `Tem certeza que deseja SUSPENDER a licença de ${license.username}?\n\nIsso irá:\n- Bloquear o acesso ao Gerenciamento de Caixa\n- Interromper o uso da licença\n- O cliente precisará que você reative manualmente`
                              : `Tem certeza que deseja ATIVAR a licença de ${license.username}?\n\nIsso irá:\n- Liberar o acesso ao Gerenciamento de Caixa\n- Reativar o uso da licença`;
                            
                            if (!confirm(confirmMessage)) return;
                            
                            licenseService.updateLicense(license.id, { status: newStatus });
                            
                            // Atualizar também no localStorage
                            const licenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
                            const updatedLicenses = licenses.map((l: any) =>
                              l.id === license.id ? { ...l, status: newStatus, updatedAt: new Date().toISOString() } : l
                            );
                            localStorage.setItem('ploutos_licenses', JSON.stringify(updatedLicenses));
                            
                            // Disparar evento para atualizar o cliente (se estiver logado)
                            window.dispatchEvent(new CustomEvent('licenseStatusChanged', {
                              detail: { username: license.username, status: newStatus, licenseKey: license.key }
                            }));
                            
                            alert(`✅ Licença ${newStatus === 'suspended' ? 'suspensa' : 'ativada'} com sucesso!\n\nUsuário: ${license.username}\nStatus: ${newStatus === 'suspended' ? 'Suspenso' : 'Ativo'}\n\n${newStatus === 'suspended' ? 'O acesso ao Gerenciamento de Caixa foi bloqueado.' : 'O acesso ao Gerenciamento de Caixa foi liberado.'}`);
                            
                            // Recarregar lista de licenças
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000);
                          }}
                          className={`px-4 py-2 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg ${
                            license.status === 'active' || license.status === 'trial'
                              ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700' 
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                          }`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {license.status === 'active' || license.status === 'trial' ? '⛔ Suspender' : '✅ Ativar'}
                        </button>
                        <button
                          onClick={() => {
                            console.log('🔑 Gerando nova chave para licença:', license.id, license.key);
                            
                            // Gerar nova chave no formato correto
                            const newKey = `PLOUTOS-${Date.now()}-${Math.random().toString(36).slice(2,9).toUpperCase()}`;
                            console.log('🔑 Nova chave gerada:', newKey);
                            
                            // Atualizar licença
                            const updated = licenseService.updateLicense(license.id, { 
                              key: newKey,
                              updatedAt: new Date().toISOString()
                            });
                            
                            console.log('🔑 Licença atualizada:', updated);
                            
                            if (updated) {
                              // Atualizar também no approved_license_keys se existir
                              const approvedKeys = JSON.parse(localStorage.getItem('approved_license_keys') || '[]');
                              const normalizedOldKey = String(license.key || '').trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
                              const normalizedNewKey = newKey.trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
                              
                              const updatedApprovedKeys = approvedKeys.map((k: any) => {
                                if (!k || !k.licenseKey) return k;
                                const normalizedK = String(k.licenseKey).trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
                                if (normalizedK === normalizedOldKey) {
                                  return { ...k, licenseKey: newKey };
                                }
                                return k;
                              });
                              localStorage.setItem('approved_license_keys', JSON.stringify(updatedApprovedKeys));
                              
                              alert(`✅ Nova chave gerada com sucesso!\n\nChave: ${newKey}\n\n📋 A chave foi copiada para a área de transferência.`);
                              
                              // Copiar para área de transferência
                              if (navigator.clipboard) {
                                navigator.clipboard.writeText(newKey).catch(() => {
                                  console.warn('Não foi possível copiar para área de transferência');
                                });
                              }
                              
                              // Recarregar lista de licenças sem recarregar a página
                              loadLicensesList();
                            } else {
                              alert('❌ Erro ao gerar nova chave. A licença não foi encontrada.');
                            }
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-bold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Nova Chave
                        </button>
                        <button
                          onClick={() => {
                            if (!confirm('Tem certeza que deseja excluir esta licença?')) return;
                            licenseService.deleteLicense(license.id);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Excluir
                        </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
          </div>

          {licenses.length === 0 && (
            <div className="text-center py-16 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-200/50 to-purple-200/50 rounded-full blur-2xl animate-pulse"></div>
              </div>
              <div className="relative z-10">
                <div className="p-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl inline-block mb-6 animate-pulse-glow">
                  <Key className="h-16 w-16 text-indigo-600 mx-auto" />
                </div>
                <h3 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Nenhuma licença encontrada
                </h3>
                <p className="text-gray-600 text-lg font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Comece criando uma nova licença usando o botão acima
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
  };

  const renderMonitoring = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Uptime</div>
          <div className="text-3xl font-bold text-green-700">{systemStats.systemUptime}%</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Fila WhatsApp</div>
          <div className="text-3xl font-bold text-indigo-700">0</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Erros (24h)</div>
          <div className="text-3xl font-bold text-red-600">0</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Tempo de Resposta</div>
          <div className="text-3xl font-bold text-blue-700">120ms</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Leads Pendentes</div>
          <div className="text-3xl font-bold text-amber-700">{leadCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Aprovados (24h)</div>
          <div className="text-3xl font-bold text-emerald-700">{approved24h}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <div className="text-sm text-gray-500">Usuários Ativos</div>
          <div className="text-3xl font-bold text-purple-700">{activeUsersCount}</div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Logs Recentes</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>✔️ CallMeBot OK - Código enviado</li>
          <li>ℹ️ Admin abriu Painel Admin</li>
          <li>✔️ Modo demo ativo (backend offline)</li>
        </ul>
        <div className="mt-4">
          <button onClick={()=>setActiveTab('leads')} className="px-3 py-2 bg-indigo-600 text-white rounded">Ir para Leads</button>
        </div>
      </div>
    </div>
  );

  const renderComms = () => {
    const logs = JSON.parse(localStorage.getItem('comm_logs')||'[]');
        return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Comunicações (demo)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Tipo</th>
                <th className="text-left py-2 px-3">Destino</th>
                <th className="text-left py-2 px-3">Status</th>
                <th className="text-left py-2 px-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice().reverse().map((l:any, i:number)=> (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{l.type}</td>
                  <td className="py-2 px-3">{l.to}</td>
                  <td className="py-2 px-3">{l.ok? 'OK':'Falha'}</td>
                  <td className="py-2 px-3">{new Date(l.at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
              {logs.length===0 && (
                <tr><td className="py-6 px-3 text-gray-500" colSpan={4}>Nenhum log.</td></tr>
              )}
            </tbody>
          </table>
        </div>
          </div>
        );
  };

  const renderSettings = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Branding</h3>
          <div className="space-y-2 text-sm">
            <label className="block">Nome do Produto</label>
            <input className="w-full border rounded px-3 py-2" placeholder="PloutosLedger" />
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Integrações</h3>
          <div className="space-y-2 text-sm">
            <label className="block">CallMeBot API Key</label>
            <input className="w-full border rounded px-3 py-2" placeholder="****" />
          </div>
        </div>
      </div>
      <div className="text-right">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg" onClick={()=>alert('Configurações salvas (demo)')}>Salvar</button>
      </div>
          </div>
        );

  const renderSystems = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[{id:'cash',title:'Movimento de Caixa',desc:'Entradas, saídas e relatórios'}, {id:'notas',title:'Caderno de Notas',desc:'Notas fiscais e relatórios'}, {id:'cancel',title:'Cancelamentos',desc:'Gestão de cancelamentos'}].map(card => (
        <div key={card.id} className="bg-white rounded-xl shadow p-6 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{card.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{card.desc}</p>
          <div className="mt-auto">
            <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={()=>alert(`${card.title} aberto (demo)`)}>Abrir</button>
          </div>
        </div>
      ))}
          </div>
        );

  const renderCashFlow = () => (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div></div>}>
      <CashFlow isDemo={false} onBackToLanding={() => setActiveTab('overview')} />
    </Suspense>
  );

  const renderPaymentGateway = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gateway de Pagamento</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPaymentGenerator(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300"
            >
              Gerar Pagamento
            </button>
            <button
              onClick={() => setShowApiDocumentation(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
            >
              Documentação API
            </button>
            <button
              onClick={() => setShowEcommerceConfig(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
            >
              Configurar E-commerce
            </button>
          </div>
        </div>
        
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Carregando dados do gateway...</p>
          </div>
        )}

        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Cobranças Hoje</p>
                  <p className="text-3xl font-bold">{statistics.total_charges}</p>
                  <p className="text-green-200 text-sm">R$ {statistics.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Taxa de Sucesso</p>
                  <p className="text-3xl font-bold">{statistics.success_rate}%</p>
                  <p className="text-blue-200 text-sm">Excelente</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Ticket Médio</p>
                  <p className="text-3xl font-bold">R$ {statistics.average_transaction.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-purple-200 text-sm">Por cobrança</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Métodos Ativos</p>
                  <p className="text-3xl font-bold">{paymentMethods.filter(m => m.enabled).length}</p>
                  <p className="text-orange-200 text-sm">Incluindo Crypto</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>
        )}

        {balance && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Saldo Disponível</p>
                  <p className="text-3xl font-bold">R$ {balance.available[0]?.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-emerald-200 text-sm">Para saque</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Saldo Pendente</p>
                  <p className="text-3xl font-bold">R$ {balance.pending[0]?.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-yellow-200 text-sm">Processando</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Métodos de Pagamento</h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      method.enabled ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <span className={`text-sm font-bold ${
                        method.enabled ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {method.type === 'pix' ? '📱' : 
                         method.type === 'credit_card' ? '💳' : 
                         method.type === 'debit_card' ? '💳' :
                         method.type === 'boleto' ? '📄' : 
                         method.type === 'usdt' ? '₮' :
                         method.type === 'bitcoin' ? '₿' :
                         method.type === 'ethereum' ? 'Ξ' :
                         method.type === 'bnb' ? '🟡' : '🏦'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{method.name}</p>
                      <p className="text-sm text-gray-600">
                        Taxa: {method.fee_percentage}% + R$ {method.fee_fixed.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      method.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {method.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{method.processing_time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cobranças Recentes</h3>
            <div className="space-y-3">
              {charges.map((charge) => (
                <div key={charge.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      charge.status === 'completed' ? 'bg-green-100' :
                      charge.status === 'pending' ? 'bg-yellow-100' :
                      charge.status === 'processing' ? 'bg-blue-100' :
                      charge.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      <span className={`text-sm font-bold ${
                        charge.status === 'completed' ? 'text-green-600' :
                        charge.status === 'pending' ? 'text-yellow-600' :
                        charge.status === 'processing' ? 'text-blue-600' :
                        charge.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {charge.status === 'completed' ? '✓' :
                         charge.status === 'pending' ? '⏳' :
                         charge.status === 'processing' ? '🔄' :
                         charge.status === 'failed' ? '✗' : '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{charge.customer_name}</p>
                      <p className="text-sm text-gray-600">{charge.customer_email}</p>
                      {charge.crypto_address && (
                        <p className="text-xs text-purple-600">
                          {charge.payment_method.toUpperCase()}: {charge.crypto_address.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">
                      R$ {charge.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(charge.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    {charge.confirmation_count !== undefined && (
                      <p className="text-xs text-blue-600">
                        {charge.confirmation_count}/{charge.required_confirmations} confirmações
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button 
            onClick={() => setShowPaymentGenerator(true)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
          >
            Nova Cobrança
          </button>
          <button 
            onClick={() => setShowCompleteReport(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
          >
            Relatório Completo
          </button>
          <button 
            onClick={() => setShowWebhookConfig(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
          >
            Configurar Webhook
          </button>
          <button 
            onClick={() => setShowCustomerManager(true)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
          >
            Gerenciar Clientes
          </button>
        </div>
      </div>
          </div>
        );

  const renderCMS = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">CMS & Personalização</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Personalização da Landing Page</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título Principal</label>
                <input 
                  type="text" 
                  defaultValue={cmsConfig.landingPage?.title || "Controle Total do Seu Fluxo de Caixa"}
                  onChange={(e) => setCmsConfig(prev => ({
                    ...prev,
                    landingPage: { ...prev.landingPage, title: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtítulo</label>
                <input 
                  type="text" 
                  defaultValue={cmsConfig.landingPage?.subtitle || "Gestão Financeira Inteligente"}
                  onChange={(e) => setCmsConfig(prev => ({
                    ...prev,
                    landingPage: { ...prev.landingPage, subtitle: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor Principal</label>
                <div className="flex space-x-2">
                  <input 
                    type="color" 
                    defaultValue={cmsConfig.landingPage?.primaryColor || "#3B82F6"} 
                    onChange={(e) => setCmsConfig(prev => ({
                      ...prev,
                      landingPage: { ...prev.landingPage, primaryColor: e.target.value }
                    }))}
                    className="w-12 h-10 rounded border" 
                  />
                  <input 
                    type="text" 
                    defaultValue={cmsConfig.landingPage?.primaryColor || "#3B82F6"} 
                    onChange={(e) => setCmsConfig(prev => ({
                      ...prev,
                      landingPage: { ...prev.landingPage, primaryColor: e.target.value }
                    }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações de Tema</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tema do Sistema</label>
                <select 
                  value={theme}
                  onChange={(e) => changeTheme(e.target.value as 'classic' | 'modern')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="classic">Clássico (Design Atual)</option>
                  <option value="modern">Moderno (Design EasyA)</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {theme === 'modern' 
                    ? 'Design moderno inspirado no EasyA com efeitos visuais avançados' 
                    : 'Design clássico atual do PloutosLedger'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tema da Landing Page (Legado)</label>
                <select 
                  defaultValue={cmsConfig.landingPage?.theme || "Moderno"}
                  onChange={(e) => setCmsConfig(prev => ({
                    ...prev,
                    landingPage: { ...prev.landingPage, theme: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Moderno</option>
                  <option>Clássico</option>
                  <option>Minimalista</option>
                  <option>Escuro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const logoDataUrl = event.target?.result as string;
                          setCmsConfig(prev => ({
                            ...prev,
                            landingPage: { ...prev.landingPage, logo: logoDataUrl }
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Clique para upload
                  </label>
                  {cmsConfig.landingPage?.logo && (
                    <div className="mt-2">
                      <img
                        src={cmsConfig.landingPage.logo}
                        alt="Logo"
                        className="h-16 mx-auto rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const faviconDataUrl = event.target?.result as string;
                          setCmsConfig(prev => ({
                            ...prev,
                            landingPage: { ...prev.landingPage, favicon: faviconDataUrl }
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="favicon-upload"
                  />
                  <label htmlFor="favicon-upload" className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Clique para upload
                  </label>
                  {cmsConfig.landingPage?.favicon && (
                    <div className="mt-2">
                      <img
                        src={cmsConfig.landingPage.favicon}
                        alt="Favicon"
                        className="h-8 w-8 mx-auto rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Seções da Landing Page</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-800 mb-2">Hero Section</h4>
              <p className="text-sm text-gray-600 mb-3">Título principal e CTA</p>
              <button 
                onClick={() => {
                  const title = prompt('Título do Hero:', cmsConfig.sections?.hero?.title || 'Controle Total do Seu Fluxo de Caixa');
                  const subtitle = prompt('Subtítulo:', cmsConfig.sections?.hero?.subtitle || 'Gestão Financeira Inteligente');
                  if (title !== null && subtitle !== null) {
                    setCmsConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        hero: { ...prev.sections?.hero, title, subtitle }
                      }
                    }));
                  }
                }}
                className="w-full px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
              >
                Editar
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-800 mb-2">Planos</h4>
              <p className="text-sm text-gray-600 mb-3">Preços e recursos</p>
              <button 
                onClick={() => {
                  const title = prompt('Título dos Planos:', cmsConfig.sections?.plans?.title || 'Escolha seu Plano');
                  const description = prompt('Descrição:', cmsConfig.sections?.plans?.description || 'Planos flexíveis para sua empresa');
                  if (title !== null && description !== null) {
                    setCmsConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        plans: { ...prev.sections?.plans, title, description }
                      }
                    }));
                  }
                }}
                className="w-full px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
              >
                Editar
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-800 mb-2">Depoimentos</h4>
              <p className="text-sm text-gray-600 mb-3">Avaliações de clientes</p>
              <button 
                onClick={() => {
                  const title = prompt('Título dos Depoimentos:', cmsConfig.sections?.testimonials?.title || 'O que nossos clientes dizem');
                  const description = prompt('Descrição:', cmsConfig.sections?.testimonials?.description || 'Depoimentos reais de nossos usuários');
                  if (title !== null && description !== null) {
                    setCmsConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        testimonials: { ...prev.sections?.testimonials, title, description }
                      }
                    }));
                  }
                }}
                className="w-full px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
              >
                Editar
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-800 mb-2">Recursos</h4>
              <p className="text-sm text-gray-600 mb-3">Funcionalidades do sistema</p>
              <button 
                onClick={() => {
                  const title = prompt('Título dos Recursos:', cmsConfig.sections?.features?.title || 'Recursos Avançados');
                  const description = prompt('Descrição:', cmsConfig.sections?.features?.description || 'Todas as funcionalidades que você precisa');
                  if (title !== null && description !== null) {
                    setCmsConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        features: { ...prev.sections?.features, title, description }
                      }
                    }));
                  }
                }}
                className="w-full px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
              >
                Editar
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-800 mb-2">FAQ</h4>
              <p className="text-sm text-gray-600 mb-3">Perguntas frequentes</p>
              <button 
                onClick={() => {
                  const title = prompt('Título do FAQ:', cmsConfig.sections?.faq?.title || 'Perguntas Frequentes');
                  const description = prompt('Descrição:', cmsConfig.sections?.faq?.description || 'Tire suas dúvidas');
                  if (title !== null && description !== null) {
                    setCmsConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        faq: { ...prev.sections?.faq, title, description }
                      }
                    }));
                  }
                }}
                className="w-full px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
              >
                Editar
              </button>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-medium text-gray-800 mb-2">Footer</h4>
              <p className="text-sm text-gray-600 mb-3">Links e informações</p>
              <button 
                onClick={() => {
                  const title = prompt('Título do Footer:', cmsConfig.sections?.footer?.title || 'Contato');
                  const description = prompt('Descrição:', cmsConfig.sections?.footer?.description || 'Entre em contato conosco');
                  if (title !== null && description !== null) {
                    setCmsConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        footer: { ...prev.sections?.footer, title, description }
                      }
                    }));
                  }
                }}
                className="w-full px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200"
              >
                Editar
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button 
            onClick={async () => {
              try {
                await saveCmsConfig(cmsConfig);
                // Forçar recarregamento da página para aplicar o novo tema
                if (theme === 'modern') {
                  window.location.reload();
                }
              } catch (error) {
                console.error('Erro ao salvar configurações:', error);
                alert('Erro ao salvar configurações. Por favor, tente novamente.');
              }
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
          >
            Salvar Alterações
          </button>
          <button 
            onClick={() => {
              // Preview functionality - could open a new tab with preview
              alert('Preview: As configurações serão aplicadas na próxima atualização da landing page');
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300"
          >
            Preview
          </button>
          <button 
            onClick={() => {
              // Publish functionality
              saveCmsConfig(cmsConfig);
              alert('Configurações publicadas com sucesso!');
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300"
          >
            Publicar
          </button>
        </div>
      </div>
    </div>
  );

  // Calcular métricas do PDV dinamicamente
  const pdvMetrics = useMemo(() => {
    const products = storageManager.get<any[]>('pdv_products', { defaultValue: [] }) || [];
    const sales = storageManager.get<any[]>('pdv_sales', { defaultValue: [] }) || [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    // Vendas de hoje
    const todaySales = sales.filter((sale: any) => {
      if (!sale.date && !sale.createdAt) return false;
      const saleDate = sale.date ? new Date(sale.date.split('/').reverse().join('-')) : new Date(sale.createdAt);
      return saleDate >= today && saleDate <= todayEnd;
    });
    const todayTotal = todaySales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
    
    // Vendas do mês
    const monthSales = sales.filter((sale: any) => {
      if (!sale.date && !sale.createdAt) return false;
      const saleDate = sale.date ? new Date(sale.date.split('/').reverse().join('-')) : new Date(sale.createdAt);
      return saleDate >= thisMonth;
    });
    
    // Produtos em estoque
    const totalProducts = products.length;
    
    // Estoque baixo (produtos com estoque <= 5)
    const lowStockProducts = products.filter((p: any) => (p.stock || 0) <= 5 && (p.stock || 0) > 0).length;
    
    return {
      todayTotal,
      totalProducts,
      monthSalesCount: monthSales.length,
      lowStockProducts
    };
  }, []);

  const renderPDVSystem = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Sistema PDV Completo</h2>
            <p className="text-gray-600">Ponto de Venda Profissional com todas as funcionalidades</p>
          </div>
          <button
            onClick={() => setShowPDVSystem(true)}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <DollarSign className="w-5 h-5" />
            <span>Abrir PDV</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Vendas Hoje</p>
                <p className="text-3xl font-bold">
                  R$ {pdvMetrics.todayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-green-200 text-sm">Total do dia</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Produtos</p>
                <p className="text-3xl font-bold">{pdvMetrics.totalProducts}</p>
                <p className="text-blue-200 text-sm">Em estoque</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Vendas</p>
                <p className="text-3xl font-bold">{pdvMetrics.monthSalesCount}</p>
                <p className="text-purple-200 text-sm">Este mês</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Estoque Baixo</p>
                <p className="text-3xl font-bold">{pdvMetrics.lowStockProducts}</p>
                <p className="text-orange-200 text-sm">Produtos</p>
              </div>
              <Bell className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Funcionalidades Principais</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">PDV Completo com Carrinho de Vendas</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Controle de Estoque Avançado</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Gestão de Lojas e Usuários</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Cadastro de Fornecedores e Fabricantes</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Sistema de Vendas e Cancelamentos</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Emissão de Cupom Fiscal</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Emissão de NFE</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Controle de Comissões</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recursos Avançados</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Integração com Gateway de Pagamento</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Relatórios Detalhados</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Backup Automático</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Multi-loja</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">API REST Completa</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Suporte a Múltiplos Usuários</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Sincronização em Tempo Real</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-800">🔓 ACESSO TOTAL LIBERADO</h4>
              <p className="text-green-700 text-sm">
                Como Super Administrador, você tem acesso completo e irrestrito a todas as funcionalidades do Sistema PDV. 
                Nenhuma restrição se aplica ao seu usuário.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCadernoNotas = () => (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div></div>}>
      <div className="p-8">
        <CadernoNotas onBackToLanding={() => setActiveTab('overview')} />
      </div>
    </Suspense>
  );

  const renderFinancialTools = () => (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div></div>}>
      <FinancialTools />
    </Suspense>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'leads':
        return renderLeads();
      case 'pending-users':
        return renderPendingUsers();
      case 'cashflow':
        return renderCashFlow();
      case 'tenants':
        return renderTenants();
      case 'plans':
        return renderPlans();
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'licenses':
        return renderLicenses();
      case 'monitoring':
        return renderMonitoring();
      case 'comms':
        return renderComms();
      case 'settings':
        return renderSettings();
      case 'systems':
        return renderSystems();
      case 'payment-gateway':
        return renderPaymentGateway();
      case 'financial-tools':
        return renderFinancialTools();
      case 'pdv-system':
        return renderPDVSystem();
      case 'cms':
        return renderCMS();
      case 'caderno-notas':
        return renderCadernoNotas();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Notificação de Cadastros Pendentes */}
      <PendingUsersNotification
        onViewPending={() => {
          setActiveTab('pending-users');
          loadPendingUsers(true);
        }}
      />
      
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 animate-pulse-slow"></div>
                <img 
                  src="/logo_header.png" 
                  alt="PloutosLedger Logo" 
                  className="h-20 sm:h-24 w-auto object-contain relative z-10 drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300 filter brightness-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg hidden">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="hidden md:block">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  PloutosLedger
                </h1>
                <p className="text-sm text-gray-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Super Administrador - Painel Avançado</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{user?.username}</p>
                <p className="text-xs text-indigo-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Super Administrador</p>
              </div>
              {/* Toggle do menu lateral (desktop e mobile) */}
              <button
                onClick={() => setSidebarVisible(v => !v)}
                className="inline-flex items-center justify-center p-2 rounded-xl text-gray-700 hover:bg-gray-100 focus:outline-none transition-all duration-200"
                title={sidebarVisible ? 'Esconder menu lateral' : 'Mostrar menu lateral'}
              >
                {sidebarVisible ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
                aria-label="Fazer logout do sistema"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="font-medium hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Desktop controlada por toggle */}
        <aside className={`${sidebarVisible ? 'hidden lg:block' : 'hidden'} w-full lg:w-72 bg-white/95 backdrop-blur-sm shadow-xl min-h-screen border-r border-gray-100 sticky top-0 z-30`}>
          <nav className="p-4 sm:p-6">
            <div className="mb-6 lg:mb-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>Navegação</h2>
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Gerencie todos os aspectos do sistema</p>
            </div>
            <ul className="space-y-1 sm:space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        if (item.id === 'admin') { setShowAdminPanel(true); return; }
                        if (item.id === 'analytics') { setShowAnalytics(true); return; }
                        if (item.id === 'notifications') { setShowNotifications(true); return; }
                        if (item.id === 'chat') { setShowChat(true); return; }
                        if (item.id === 'chat-management') { setShowChatManagement(true); return; }
                        if (item.id === 'audit-logs') { setShowAuditLogs(true); return; }
                        if (item.id === 'security-performance') { setShowSecurityPerformance(true); return; }
                        if (item.id === 'backup') { setShowBackup(true); return; }
                        setActiveTab(item.id);
                      }}
                      className={`w-full flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isActive
                          ? `bg-gradient-to-r ${getColorClasses(item.color)} text-white shadow-lg transform scale-105 focus:ring-white`
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800 hover:shadow-md focus:ring-gray-500'
                      }`}
                      style={{ fontFamily: isActive ? 'Poppins, sans-serif' : 'Inter, sans-serif' }}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-white/20' 
                          : 'bg-gray-100 group-hover:bg-white group-hover:shadow-sm'
                      }`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                      <span className="font-medium text-xs sm:text-sm truncate block">{item.label}</span>
                        {isActive && (
                          <div className="text-xs opacity-90 mt-0.5 hidden sm:block">Ativo</div>
                        )}
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0"></div>
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarVisible(false)}></div>
          <aside className="absolute left-0 top-0 w-80 sm:w-96 h-full bg-white shadow-2xl overflow-hidden">
            <nav className="p-4 sm:p-6 overflow-y-auto h-full">
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Navegação</h2>
                <button onClick={() => setSidebarVisible(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Fechar">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          setSidebarVisible(false);
                          if (item.id === 'admin') { setShowAdminPanel(true); return; }
                          if (item.id === 'analytics') { setShowAnalytics(true); return; }
                          if (item.id === 'notifications') { setShowNotifications(true); return; }
                          if (item.id === 'chat') { setShowChat(true); return; }
                          if (item.id === 'chat-management') { setShowChatManagement(true); return; }
                          if (item.id === 'audit-logs') { setShowAuditLogs(true); return; }
                          if (item.id === 'security-performance') { setShowSecurityPerformance(true); return; }
                          if (item.id === 'backup') { setShowBackup(true); return; }
                          setActiveTab(item.id);
                        }}
                        className={`w-full flex items-center space-x-3 sm:space-x-4 px-4 py-3 rounded-lg transition-colors ${
                          isActive 
                            ? `bg-gradient-to-r ${getColorClasses(item.color)} text-white shadow-md` 
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0"/>
                        <span className="font-medium text-sm sm:text-base">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto w-full">
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                    {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                    {activeTab === 'overview' && 'Visão geral do sistema e métricas principais'}
                    {activeTab === 'users' && 'Gerenciamento de usuários e permissões'}
                    {activeTab === 'leads' && 'Acompanhamento de leads e conversões'}
                    {activeTab === 'tenants' && 'Organizações e multi-tenancy'}
                    {activeTab === 'plans' && 'Planos de assinatura e preços'}
                    {activeTab === 'subscriptions' && 'Assinaturas ativas e pagamentos'}
                    {activeTab === 'licenses' && 'Licenças e chaves de acesso'}
                    {activeTab === 'monitoring' && 'Monitoramento e logs do sistema'}
                    {activeTab === 'comms' && 'Comunicações e notificações'}
                    {activeTab === 'settings' && 'Configurações gerais do sistema'}
                    {activeTab === 'payment-gateway' && 'Gateway de pagamento e transações'}
                    {activeTab === 'financial-tools' && 'Ferramentas financeiras avançadas'}
                    {activeTab === 'pdv-system' && 'Sistema PDV e vendas'}
                    {activeTab === 'cms' && 'CMS e personalização'}
                    {activeTab === 'cashflow' && 'Sistema de gestão financeira'}
                    {activeTab === 'caderno-notas' && 'Caderno de Notas Fiscais'}
                  </p>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">Sistema Online</span>
                </div>
              </div>
            </div>
            
            <div className={`bg-white/80 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl border border-white/20 animate-tab-slide ${activeTab === 'cashflow' ? 'overflow-visible' : 'overflow-hidden'}`}>
          {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Configuração E-commerce */}
      {showEcommerceConfig && (
        <EcommerceConfig onClose={() => setShowEcommerceConfig(false)} />
      )}

      {/* Modal de Documentação da API */}
      {showApiDocumentation && (
        <ApiDocumentation onClose={() => setShowApiDocumentation(false)} />
      )}

      {/* Modal de Gerador de Pagamentos */}
      {showPaymentGenerator && (
        <PaymentGenerator onClose={() => setShowPaymentGenerator(false)} />
      )}

      {/* Modal de Relatório Completo */}
      {showCompleteReport && (
        <CompleteReport onClose={() => setShowCompleteReport(false)} />
      )}

      {/* Modal de Configurar Webhook */}
      {showWebhookConfig && (
        <WebhookConfig onClose={() => setShowWebhookConfig(false)} />
      )}

      {/* Modal de Gerenciar Clientes */}
      {showCustomerManager && (
        <CustomerManager onClose={() => setShowCustomerManager(false)} />
      )}

      {/* Modal PDV System */}
      {showPDVSystem && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>}>
          <PDVSystemNew onClose={() => setShowPDVSystem(false)} />
        </Suspense>
      )}

      {/* Modal de Criação de Usuário */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Criar Novo Usuário</h3>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const userData = {
                  username: formData.get('username') as string,
                  password: formData.get('password') as string,
                  role: formData.get('role') as string,
                  email: formData.get('email') as string
                };
                handleCreateUser(userData);
              }} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="create-username" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de Usuário <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="create-username"
                    name="username"
                    required
                    minLength={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Digite o nome de usuário"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="create-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="create-email"
                    name="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Digite o email"
                    aria-label="Email do usuário (opcional)"
                  />
                </div>
                <div>
                  <label htmlFor="create-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    id="create-password"
                    name="password"
                    required
                    minLength={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    placeholder="Digite a senha"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="create-role" className="block text-sm font-medium text-gray-700 mb-2">
                    Função <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="create-role"
                    name="role"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    aria-required="true"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                    <option value="superadmin">Super Administrador</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Cancelar criação de usuário"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    aria-label="Criar novo usuário"
                  >
                    Criar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Painel Admin */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ring-1 ring-black/5">
            <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b rounded-t-2xl px-4 py-3 flex items-center justify-between">
              <div className="font-semibold text-gray-800">Painel Admin</div>
              <button onClick={()=>setShowAdminPanel(false)} className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50">Fechar</button>
            </div>
            <div className="bg-white rounded-b-2xl">
              <AdminPanel onBackToLanding={() => setShowAdminPanel(false)} />
            </div>
          </div>
        </div>
      )}
      {/* Modal de Edição de Usuário */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Editar Usuário</h3>
            </div>
            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const userData = {
                  username: formData.get('username') as string,
                  role: formData.get('role') as string,
                  password: formData.get('password') as string || undefined
                };
                handleUpdateUser(userData);
              }} noValidate>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-username" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome de Usuário <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-username"
                      name="username"
                      defaultValue={editingUser.username}
                      required
                      minLength={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-2">
                      Nível de Permissão <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="edit-role"
                      name="role"
                      defaultValue={editingUser.role}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      aria-required="true"
                    >
                      <option value="user">Usuário</option>
                      <option value="admin">Administrador</option>
                      <option value="superadmin">Super Administrador</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 mb-2">
                      Nova Senha (opcional)
                    </label>
                    <input
                      type="password"
                      id="edit-password"
                      name="password"
                      minLength={3}
                      placeholder="Deixe em branco para manter a senha atual"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      aria-label="Nova senha (opcional, mínimo 3 caracteres)"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditUserModal(false);
                      setEditingUser(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    aria-label="Cancelar edição de usuário"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    aria-label="Salvar alterações do usuário"
                  >
                    Atualizar Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Modal Analytics */}
      {showAnalytics && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>}>
          <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />
        </Suspense>
      )}

      {/* Modal Notifications */}
      {showNotifications && (
        <NotificationSystem onClose={() => setShowNotifications(false)} />
      )}

      {/* Modal Chat */}
      {showChat && (
        <ChatSystem onClose={() => setShowChat(false)} />
      )}

      {/* Modal Chat Management */}
      {showChatManagement && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Chat</h2>
              <button
                onClick={() => setShowChatManagement(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div></div>}>
                <ChatManagement />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Modal Audit Logs */}
      {showAuditLogs && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>}>
          <AuditLogsModal 
            isOpen={showAuditLogs}
            onClose={() => setShowAuditLogs(false)}
          />
        </Suspense>
      )}

      {/* Modal Security Performance */}
      {showSecurityPerformance && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>}>
          <SecurityPerformanceModal 
            isOpen={showSecurityPerformance}
            onClose={() => setShowSecurityPerformance(false)}
          />
        </Suspense>
      )}

      {/* Modal Backup */}
      {showBackup && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>}>
          <BackupSystem onClose={() => setShowBackup(false)} />
        </Suspense>
      )}
    </div>
  );
}

export default SuperAdminDashboard;
