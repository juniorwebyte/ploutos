import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Clock,
  User,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Settings,
  Filter,
  Search,
  RefreshCw,
  Archive,
  Trash2,
  Star,
  StarOff,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  Smartphone,
  Globe,
  Shield,
  Lock,
  Unlock,
  Download,
  Upload,
  Share2,
  Copy,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Edit,
  Save,
  Cancel
} from 'lucide-react';

interface NotificationSystemProps {
  onClose: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'sale' | 'user' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  starred: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  actionUrl?: string;
  metadata?: any;
}

function NotificationSystem({ onClose }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Dados simulados para demonstração
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'sale',
      title: 'Nova Venda Realizada',
      message: 'Venda de R$ 1.299,99 realizada por João Silva',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutos atrás
      read: false,
      starred: false,
      priority: 'high',
      category: 'Vendas',
      actionUrl: '/sales/123',
      metadata: { amount: 1299.99, customer: 'João Silva' }
    },
    {
      id: '2',
      type: 'user',
      title: 'Novo Usuário Cadastrado',
      message: 'Maria Santos se cadastrou no sistema',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutos atrás
      read: false,
      starred: true,
      priority: 'medium',
      category: 'Usuários',
      actionUrl: '/users/456',
      metadata: { username: 'Maria Santos', email: 'maria@email.com' }
    },
    {
      id: '3',
      type: 'warning',
      title: 'Estoque Baixo',
      message: 'Produto "Smartphone Samsung" com apenas 3 unidades em estoque',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
      read: true,
      starred: false,
      priority: 'urgent',
      category: 'Estoque',
      actionUrl: '/products/789',
      metadata: { product: 'Smartphone Samsung', stock: 3 }
    },
    {
      id: '4',
      type: 'success',
      title: 'Pagamento Processado',
      message: 'Pagamento PIX de R$ 2.499,99 processado com sucesso',
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutos atrás
      read: true,
      starred: false,
      priority: 'medium',
      category: 'Pagamentos',
      actionUrl: '/payments/101',
      metadata: { amount: 2499.99, method: 'PIX' }
    },
    {
      id: '5',
      type: 'system',
      title: 'Backup Realizado',
      message: 'Backup automático do sistema concluído com sucesso',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      read: true,
      starred: false,
      priority: 'low',
      category: 'Sistema',
      metadata: { size: '2.5GB', duration: '15min' }
    },
    {
      id: '6',
      type: 'error',
      title: 'Erro de Conexão',
      message: 'Falha na conexão com o gateway de pagamento',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
      read: false,
      starred: true,
      priority: 'urgent',
      category: 'Sistema',
      actionUrl: '/settings/payment',
      metadata: { gateway: 'Stripe', error: 'Connection timeout' }
    }
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'sale':
        return <ShoppingCart className="w-5 h-5 text-emerald-500" />;
      case 'user':
        return <User className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Urgente</span>;
      case 'high':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Alta</span>;
      case 'medium':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Média</span>;
      case 'low':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Baixa</span>;
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} min atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return `${days} dias atrás`;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAsUnread = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: false } : notif
    ));
  };

  const toggleStar = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, starred: !notif.starred } : notif
    ));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'unread' && !notif.read) ||
      (activeTab === 'starred' && notif.starred) ||
      (activeTab === 'category' && notif.category === filter);
    
    const matchesSearch = searchTerm === '' || 
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const starredCount = notifications.filter(n => n.starred).length;

  const menuItems = [
    { id: 'all', label: 'Todas', count: notifications.length },
    { id: 'unread', label: 'Não Lidas', count: unreadCount },
    { id: 'starred', label: 'Favoritas', count: starredCount },
    { id: 'category', label: 'Por Categoria', count: 0 }
  ];

  const categories = ['Vendas', 'Usuários', 'Estoque', 'Pagamentos', 'Sistema'];

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Central de Notificações</h1>
              <p className="text-gray-600">{notifications.length} notificações</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
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
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count > 0 && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activeTab === item.id ? 'bg-blue-400' : 'bg-gray-200'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar notificações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              <button
                onClick={markAllAsRead}
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              >
                Marcar todas como lidas
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        {activeTab === 'category' && (
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm ${
                  filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Todas
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-3 py-1 rounded text-sm ${
                    filter === category ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhuma notificação encontrada</p>
                <p className="text-gray-400 text-sm">Todas as notificações estão atualizadas</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-l-4 rounded-lg p-4 transition-all hover:shadow-md ${
                    notification.read ? 'bg-white' : 'bg-blue-50'
                  } ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-medium ${notification.read ? 'text-gray-800' : 'text-gray-900'}`}>
                            {notification.title}
                          </h3>
                          {getPriorityBadge(notification.priority)}
                          {notification.starred && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatTimeAgo(notification.timestamp)}</span>
                          </span>
                          <span className="bg-gray-100 px-2 py-1 rounded">{notification.category}</span>
                          {notification.actionUrl && (
                            <button className="text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                              <span>Ver detalhes</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {notification.read ? (
                        <button
                          onClick={() => markAsUnread(notification.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Marcar como não lida"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Marcar como lida"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleStar(notification.id)}
                        className="p-1 text-gray-400 hover:text-yellow-500"
                        title={notification.starred ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        {notification.starred ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        ) : (
                          <StarOff className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Excluir notificação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações de Notificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Tipos de Notificação</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Vendas</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Usuários</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Estoque</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Sistema</span>
                  </label>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Configurações Gerais</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Atualização automática</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Notificações por e-mail</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Som de notificação</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationSystem;
