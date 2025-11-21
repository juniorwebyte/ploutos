// Painel Completo de Gerenciamento de Assinaturas para SuperAdmin
import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  Key,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  TrendingUp,
  CreditCard,
  Shield,
} from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin.replace(/:\d+$/, ':4000') : 'http://localhost:4000');

interface Subscription {
  id: string;
  userId: string;
  username: string;
  planId: string;
  planName: string;
  status: 'active' | 'expired' | 'canceled' | 'expiring_soon' | 'past_due' | 'trialing';
  startedAt: Date;
  expiresAt: Date | null;
  validUntil: Date | null;
  autoRenew: boolean;
  lastNotificationAt: Date | null;
  txid?: string;
  amountCents?: number;
}

interface Payment {
  id: string;
  userId: string;
  username: string;
  subscriptionId?: string;
  amountCents: number;
  currency: string;
  method: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  txid?: string;
  paidAt?: Date;
  createdAt: Date;
}

export default function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  // Recalcular estatísticas quando subscriptions ou payments mudarem
  useEffect(() => {
    const active = subscriptions.filter((s) => s.status === 'active').length;
    const expiring = subscriptions.filter((s) => s.status === 'expiring_soon').length;
    const expired = subscriptions.filter((s) => s.status === 'expired').length;
    const revenue = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum: number, p) => sum + (p.amountCents || 0), 0);

    setStats({
      total: subscriptions.length,
      active,
      expiring,
      expired,
      revenue,
    });
  }, [subscriptions, payments]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Carregar assinaturas
      try {
        const subsResponse = await axios.get(`${API_BASE}/api/admin/subscriptions`, { headers });
        setSubscriptions(
          subsResponse.data.map((s: any) => ({
            ...s,
            startedAt: new Date(s.startedAt),
            expiresAt: s.expiresAt ? new Date(s.expiresAt) : null,
            validUntil: s.validUntil ? new Date(s.validUntil) : null,
            lastNotificationAt: s.lastNotificationAt ? new Date(s.lastNotificationAt) : null,
          }))
        );
      } catch (error: any) {
        console.warn('Erro ao carregar assinaturas:', error.message);
        // Fallback: usar dados vazios
        setSubscriptions([]);
      }

      // Carregar pagamentos
      try {
        const paymentsResponse = await axios.get(`${API_BASE}/api/admin/payments`, { headers });
        setPayments(
          paymentsResponse.data.map((p: any) => ({
            ...p,
            paidAt: p.paidAt ? new Date(p.paidAt) : undefined,
            createdAt: new Date(p.createdAt),
          }))
        );
      } catch (error: any) {
        console.warn('Erro ao carregar pagamentos:', error.message);
        // Fallback: usar dados vazios
        setPayments([]);
      }

      // As estatísticas serão recalculadas automaticamente pelo useEffect quando subscriptions/payments mudarem
    } catch (error) {
      console.error('Erro geral ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateLicense = async (subscriptionId: string, licenseKey: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_BASE}/api/admin/subscriptions/${subscriptionId}/activate`,
        { licenseKey },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await loadData();
      alert('Licença ativada com sucesso!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao ativar licença');
    }
  };

  const handleRevokeAccess = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja revogar o acesso desta assinatura?')) return;

    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_BASE}/api/admin/subscriptions/${subscriptionId}/revoke`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await loadData();
      alert('Acesso revogado com sucesso!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao revogar acesso');
    }
  };

  const handleUpdatePayment = async (paymentId: string, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_BASE}/api/admin/payments/${paymentId}/update`,
        { status },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      await loadData();
      alert('Pagamento atualizado com sucesso!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar pagamento');
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.txid?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800 border-green-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      expiring_soon: 'bg-amber-100 text-amber-800 border-amber-200',
      canceled: 'bg-gray-100 text-gray-800 border-gray-200',
      past_due: 'bg-orange-100 text-orange-800 border-orange-200',
      trialing: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return badges[status as keyof typeof badges] || badges.canceled;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (cents: number): string => {
    return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Ativas</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expirando</p>
              <p className="text-2xl font-bold text-amber-600">{stats.expiring}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Expiradas</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Receita</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.revenue)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuário, plano ou TXID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativas</option>
            <option value="expiring_soon">Expirando</option>
            <option value="expired">Expiradas</option>
            <option value="canceled">Canceladas</option>
            <option value="past_due">Atrasadas</option>
            <option value="trialing">Teste</option>
          </select>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Tabela de Assinaturas */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expira em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TXID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 font-medium mb-2">
                        {loading ? 'Carregando assinaturas...' : 'Nenhuma assinatura encontrada'}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {loading
                          ? 'Aguarde enquanto buscamos os dados...'
                          : 'As assinaturas aparecerão aqui quando houver dados disponíveis.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{sub.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900">{sub.planName}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                        sub.status
                      )}`}
                    >
                      {sub.status === 'active'
                        ? 'Ativa'
                        : sub.status === 'expired'
                        ? 'Expirada'
                        : sub.status === 'expiring_soon'
                        ? 'Expirando'
                        : sub.status === 'canceled'
                        ? 'Cancelada'
                        : sub.status === 'past_due'
                        ? 'Atrasada'
                        : 'Teste'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(sub.expiresAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {sub.txid || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowDetails(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {sub.status === 'expired' && (
                        <button
                          onClick={() => handleRevokeAccess(sub.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Revogar acesso"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {showDetails && selectedSubscription && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Assinatura</h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Usuário</p>
                  <p className="font-semibold">{selectedSubscription.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Plano</p>
                  <p className="font-semibold">{selectedSubscription.planName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(
                      selectedSubscription.status
                    )}`}
                  >
                    {selectedSubscription.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Início</p>
                  <p className="font-semibold">{formatDate(selectedSubscription.startedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Expira em</p>
                  <p className="font-semibold">{formatDate(selectedSubscription.expiresAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">TXID</p>
                  <p className="font-semibold font-mono">{selectedSubscription.txid || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

