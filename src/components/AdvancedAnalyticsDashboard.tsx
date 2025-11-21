import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  UserPlus,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface AdvancedAnalyticsDashboardProps {
  onClose?: () => void;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

export default function AdvancedAnalyticsDashboard({ onClose }: AdvancedAnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Carregar dados do localStorage
  const loadData = () => {
    const users = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
    const leads = JSON.parse(localStorage.getItem('pending_leads') || '[]');
    const subscriptions = JSON.parse(localStorage.getItem('demo_subscriptions') || '[]');
    const licenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
    
    return { users, leads, subscriptions, licenses };
  };

  const { users, leads, subscriptions, licenses } = useMemo(() => loadData(), [dateRange]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const now = new Date();
    const rangeStart = new Date();
    
    switch (dateRange) {
      case '7d':
        rangeStart.setDate(now.getDate() - 7);
        break;
      case '30d':
        rangeStart.setDate(now.getDate() - 30);
        break;
      case '90d':
        rangeStart.setDate(now.getDate() - 90);
        break;
      case '1y':
        rangeStart.setFullYear(now.getFullYear() - 1);
        break;
      default:
        rangeStart.setFullYear(2020);
    }

    // Filtrar dados do período
    const recentUsers = users.filter((u: any) => {
      const created = new Date(u.createdAt || u.created_at || now);
      return created >= rangeStart;
    });

    const recentLeads = leads.filter((l: any) => {
      const created = new Date(l.createdAt || l.created_at || now);
      return created >= rangeStart;
    });

    const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'active');
    const activeLicenses = licenses.filter((l: any) => l.status === 'active');
    const expiredLicenses = licenses.filter((l: any) => {
      if (!l.expiresAt) return false;
      return new Date(l.expiresAt) < now;
    });

    // Calcular conversão
    const conversionRate = recentLeads.length > 0 
      ? ((recentUsers.length / recentLeads.length) * 100).toFixed(1)
      : '0';

    // Calcular receita (simulado)
    const mrr = activeSubscriptions.reduce((sum: number, s: any) => {
      const plan = JSON.parse(localStorage.getItem('plans') || '[]').find((p: any) => p.id === s.plan?.id);
      return sum + (plan?.priceCents || 0) / 100;
    }, 0);

    // Calcular churn (simulado)
    const totalUsers = users.length;
    const churnedUsers = users.filter((u: any) => {
      const lastLogin = u.lastLogin ? new Date(u.lastLogin) : null;
      if (!lastLogin) return false;
      const daysSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLogin > 90;
    }).length;
    const churnRate = totalUsers > 0 ? ((churnedUsers / totalUsers) * 100).toFixed(1) : '0';

    // Usuários ativos (últimos 30 dias)
    const activeUsers = users.filter((u: any) => {
      const lastLogin = u.lastLogin ? new Date(u.lastLogin) : null;
      if (!lastLogin) return false;
      const daysSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceLogin <= 30;
    }).length;

    return {
      totalUsers: users.length,
      recentUsers: recentUsers.length,
      activeUsers,
      totalLeads: leads.length,
      recentLeads: recentLeads.length,
      conversionRate: parseFloat(conversionRate),
      mrr,
      activeSubscriptions: activeSubscriptions.length,
      activeLicenses: activeLicenses.length,
      expiredLicenses: expiredLicenses.length,
      churnRate: parseFloat(churnRate),
      churnedUsers
    };
  }, [users, leads, subscriptions, licenses, dateRange]);

  const metricCards: MetricCard[] = [
    {
      title: 'Total de Usuários',
      value: metrics.totalUsers,
      change: metrics.recentUsers > 0 ? ((metrics.recentUsers / metrics.totalUsers) * 100) : 0,
      changeType: metrics.recentUsers > 0 ? 'positive' : 'neutral',
      icon: <Users className="w-6 h-6" />,
      color: 'blue'
    },
    {
      title: 'Usuários Ativos (30d)',
      value: metrics.activeUsers,
      change: metrics.totalUsers > 0 ? ((metrics.activeUsers / metrics.totalUsers) * 100) : 0,
      changeType: 'positive',
      icon: <Activity className="w-6 h-6" />,
      color: 'green'
    },
    {
      title: 'Receita Mensal (MRR)',
      value: `R$ ${metrics.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: 12.5, // Simulado
      changeType: 'positive',
      icon: <DollarSign className="w-6 h-6" />,
      color: 'emerald'
    },
    {
      title: 'Taxa de Conversão',
      value: `${metrics.conversionRate}%`,
      change: metrics.conversionRate > 20 ? 5 : -2,
      changeType: metrics.conversionRate > 20 ? 'positive' : 'negative',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'purple'
    },
    {
      title: 'Churn Rate',
      value: `${metrics.churnRate}%`,
      change: metrics.churnRate < 5 ? -1 : 2,
      changeType: metrics.churnRate < 5 ? 'positive' : 'negative',
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'red'
    },
    {
      title: 'Assinaturas Ativas',
      value: metrics.activeSubscriptions,
      change: 8,
      changeType: 'positive',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'green'
    },
    {
      title: 'Licenças Ativas',
      value: metrics.activeLicenses,
      change: metrics.expiredLicenses > 0 ? -metrics.expiredLicenses : 0,
      changeType: metrics.expiredLicenses > 0 ? 'negative' : 'neutral',
      icon: <CheckCircle className="w-6 h-6" />,
      color: 'indigo'
    },
    {
      title: 'Licenças Expiradas',
      value: metrics.expiredLicenses,
      change: 0,
      changeType: 'negative',
      icon: <XCircle className="w-6 h-6" />,
      color: 'red'
    }
  ];

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExport = () => {
    const data = {
      dateRange,
      metrics,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            Analytics Avançado
          </h2>
          <p className="text-gray-600 mt-1">Análise detalhada do sistema e métricas de negócio</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filtro de Período */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={`Período: ${range}`}
              >
                {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : range === '90d' ? '90 dias' : range === '1y' ? '1 ano' : 'Tudo'}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
            aria-label="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            aria-label="Exportar dados"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              aria-label="Fechar"
            >
              Fechar
            </button>
          )}
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                <div className={`text-${card.color}-600`}>
                  {card.icon}
                </div>
              </div>
              {card.change !== undefined && card.change !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  card.changeType === 'positive' ? 'text-green-600' : 
                  card.changeType === 'negative' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {card.changeType === 'positive' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : card.changeType === 'negative' ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : null}
                  {card.change > 0 ? '+' : ''}{card.change.toFixed(1)}%
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Gráficos e Análises */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Crescimento */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crescimento de Usuários</h3>
          <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">Gráfico de crescimento</p>
              <p className="text-gray-500 text-xs mt-1">+{metrics.recentUsers} novos usuários no período</p>
            </div>
          </div>
        </div>

        {/* Distribuição por Status */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Licenças</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Ativas</span>
              </div>
              <span className="text-xl font-bold text-green-600">{metrics.activeLicenses}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">Expiradas</span>
              </div>
              <span className="text-xl font-bold text-red-600">{metrics.expiredLicenses}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-gray-900">Pendentes</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">
                {licenses.filter((l: any) => l.status === 'pending').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights e Alertas */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Insights e Recomendações
        </h3>
        <div className="space-y-3">
          {metrics.conversionRate < 20 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 font-medium">Taxa de conversão baixa</p>
              <p className="text-amber-700 text-sm mt-1">
                Sua taxa de conversão está em {metrics.conversionRate}%. Considere melhorar o processo de onboarding.
              </p>
            </div>
          )}
          
          {metrics.churnRate > 5 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Churn rate alto</p>
              <p className="text-red-700 text-sm mt-1">
                {metrics.churnRate}% dos usuários estão inativos. Considere criar campanhas de reativação.
              </p>
            </div>
          )}

          {metrics.expiredLicenses > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800 font-medium">Licenças expiradas</p>
              <p className="text-orange-700 text-sm mt-1">
                {metrics.expiredLicenses} licenças expiradas. Considere entrar em contato com esses usuários.
              </p>
            </div>
          )}

          {metrics.conversionRate >= 20 && metrics.churnRate < 5 && metrics.expiredLicenses === 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✅ Sistema saudável</p>
              <p className="text-green-700 text-sm mt-1">
                Todas as métricas estão em níveis saudáveis. Continue o bom trabalho!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

