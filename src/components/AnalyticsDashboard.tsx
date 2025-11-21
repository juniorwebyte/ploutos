import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  ShoppingCart,
  Package,
  CreditCard,
  Smartphone,
  Globe,
  Zap,
  Target,
  Award,
  Calendar,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Activity,
  PieChart,
  LineChart,
  BarChart,
  AreaChart
} from 'lucide-react';

interface AnalyticsDashboardProps {
  onClose: () => void;
}

interface AnalyticsData {
  revenue: {
    today: number;
    yesterday: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  sales: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    growth: number;
  };
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
    topSelling: Array<{
      name: string;
      sales: number;
      revenue: number;
    }>;
  };
  traffic: {
    total: number;
    organic: number;
    direct: number;
    social: number;
    paid: number;
  };
  conversions: {
    rate: number;
    visitors: number;
    leads: number;
    customers: number;
  };
}

function AnalyticsDashboard({ onClose }: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    revenue: {
      today: 12450.00,
      yesterday: 10800.00,
      thisMonth: 245600.00,
      lastMonth: 198400.00,
      growth: 23.8
    },
    users: {
      total: 1247,
      active: 1156,
      new: 89,
      growth: 12.5
    },
    sales: {
      total: 456,
      completed: 423,
      pending: 23,
      cancelled: 10,
      growth: 18.2
    },
    products: {
      total: 1247,
      lowStock: 23,
      outOfStock: 5,
      topSelling: [
        { name: 'Smartphone Samsung Galaxy', sales: 25, revenue: 32499.75 },
        { name: 'Notebook Dell Inspiron', sales: 18, revenue: 44999.82 },
        { name: 'Fone Bluetooth', sales: 45, revenue: 8999.55 },
        { name: 'Mouse Gamer', sales: 32, revenue: 2879.68 },
        { name: 'Teclado Mecânico', sales: 15, revenue: 4499.85 }
      ]
    },
    traffic: {
      total: 45678,
      organic: 18271,
      direct: 13703,
      social: 9136,
      paid: 4568
    },
    conversions: {
      rate: 3.2,
      visitors: 45678,
      leads: 1462,
      customers: 89
    }
  });

  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3, color: 'blue' },
    { id: 'revenue', label: 'Receita', icon: DollarSign, color: 'green' },
    { id: 'users', label: 'Usuários', icon: Users, color: 'purple' },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart, color: 'emerald' },
    { id: 'products', label: 'Produtos', icon: Package, color: 'orange' },
    { id: 'traffic', label: 'Tráfego', icon: Globe, color: 'cyan' },
    { id: 'conversions', label: 'Conversões', icon: Target, color: 'pink' }
  ];

  const timeRanges = [
    { value: '1d', label: 'Hoje' },
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: '1y', label: '1 ano' }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600 text-white',
      green: 'bg-green-500 hover:bg-green-600 text-white',
      purple: 'bg-purple-500 hover:bg-purple-600 text-white',
      emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      orange: 'bg-orange-500 hover:bg-orange-600 text-white',
      cyan: 'bg-cyan-500 hover:bg-cyan-600 text-white',
      pink: 'bg-pink-500 hover:bg-pink-600 text-white'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (growth < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Receita Hoje</p>
              <p className="text-3xl font-bold">{formatCurrency(analyticsData.revenue.today)}</p>
              <div className="flex items-center mt-2">
                {getGrowthIcon(analyticsData.revenue.growth)}
                <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.revenue.growth)}`}>
                  {analyticsData.revenue.growth}%
                </span>
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Usuários Ativos</p>
              <p className="text-3xl font-bold">{formatNumber(analyticsData.users.active)}</p>
              <div className="flex items-center mt-2">
                {getGrowthIcon(analyticsData.users.growth)}
                <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.users.growth)}`}>
                  {analyticsData.users.growth}%
                </span>
              </div>
            </div>
            <Users className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Vendas Hoje</p>
              <p className="text-3xl font-bold">{analyticsData.sales.completed}</p>
              <div className="flex items-center mt-2">
                {getGrowthIcon(analyticsData.sales.growth)}
                <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.sales.growth)}`}>
                  {analyticsData.sales.growth}%
                </span>
              </div>
            </div>
            <ShoppingCart className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Taxa de Conversão</p>
              <p className="text-3xl font-bold">{analyticsData.conversions.rate}%</p>
              <p className="text-orange-200 text-sm mt-2">+0.3% vs ontem</p>
            </div>
            <Target className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Receita por Período</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm">7 dias</button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm">30 dias</button>
            </div>
          </div>
          <div className="h-64 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart className="w-12 h-12 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-600">Gráfico de Receita</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Usuários Ativos</h3>
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-green-100 text-green-600 rounded text-sm">Hoje</button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded text-sm">Semana</button>
            </div>
          </div>
          <div className="h-64 bg-gradient-to-r from-green-50 to-green-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <LineChart className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-gray-600">Gráfico de Usuários</p>
            </div>
          </div>
        </div>
      </div>

      {/* Produtos Mais Vendidos */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Produtos Mais Vendidos</h3>
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
        <div className="space-y-4">
          {analyticsData.products.topSelling.map((product, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">#{index + 1}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.sales} vendas</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">{formatCurrency(product.revenue)}</p>
                <p className="text-sm text-gray-600">Receita</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Receita Hoje</h3>
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(analyticsData.revenue.today)}</p>
          <div className="flex items-center">
            {getGrowthIcon(analyticsData.revenue.growth)}
            <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.revenue.growth)}`}>
              {analyticsData.revenue.growth}% vs ontem
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Receita Mensal</h3>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(analyticsData.revenue.thisMonth)}</p>
          <div className="flex items-center">
            {getGrowthIcon(analyticsData.revenue.growth)}
            <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.revenue.growth)}`}>
              {analyticsData.revenue.growth}% vs mês anterior
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Ticket Médio</h3>
            <DollarSign className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-2">{formatCurrency(analyticsData.revenue.today / analyticsData.sales.completed)}</p>
          <p className="text-sm text-gray-600">Por venda</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Evolução da Receita</h3>
        <div className="h-80 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <AreaChart className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Gráfico de Evolução da Receita</p>
            <p className="text-gray-500 text-sm">Dados dos últimos 30 dias</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Total de Usuários</h3>
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(analyticsData.users.total)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Usuários Ativos</h3>
            <Activity className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(analyticsData.users.active)}</p>
          <p className="text-sm text-gray-600 mt-2">
            {((analyticsData.users.active / analyticsData.users.total) * 100).toFixed(1)}% do total
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Novos Usuários</h3>
            <UserPlus className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{formatNumber(analyticsData.users.new)}</p>
          <div className="flex items-center mt-2">
            {getGrowthIcon(analyticsData.users.growth)}
            <span className={`text-sm ml-1 ${getGrowthColor(analyticsData.users.growth)}`}>
              {analyticsData.users.growth}% vs ontem
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Taxa de Retenção</h3>
            <Target className="w-6 h-6 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-800">87.5%</p>
          <p className="text-sm text-gray-600 mt-2">Últimos 30 dias</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Crescimento de Usuários</h3>
        <div className="h-80 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <LineChart className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Gráfico de Crescimento</p>
            <p className="text-gray-500 text-sm">Novos usuários por dia</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'revenue':
        return renderRevenue();
      case 'users':
        return renderUsers();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>
              <p className="text-gray-600">Análise completa do sistema</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-1 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === item.id
                      ? getColorClasses(item.color)
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
