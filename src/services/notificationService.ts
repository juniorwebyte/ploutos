// Sistema de Notificações em Tempo Real
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'chat' | 'payment' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
  actionUrl?: string;
  actionText?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'chat' | 'payment' | 'system' | 'user' | 'admin';
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];

  constructor() {
    this.loadNotifications();
    this.setupEventListeners();
  }

  private loadNotifications() {
    try {
      const saved = localStorage.getItem('ploutos_notifications');
      if (saved) {
        this.notifications = JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      // Erro ao carregar notificações - retornar array vazio
    }
  }

  private saveNotifications() {
    localStorage.setItem('ploutos_notifications', JSON.stringify(this.notifications));
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      // Escutar atualizações do chat
      window.addEventListener('chatUpdate', (event: any) => {
        const { sessions } = event.detail;
        const unreadSessions = sessions.filter((s: any) => s.status === 'waiting');
        
        if (unreadSessions.length > 0) {
          this.createNotification({
            type: 'chat',
            title: 'Nova Mensagem de Chat',
            message: `${unreadSessions.length} conversa(s) aguardando atendimento`,
            priority: 'high',
            category: 'chat',
            actionUrl: '/admin/chat',
            actionText: 'Ver Conversas'
          });
        }
      });

      // Escutar atualizações de pagamento
      window.addEventListener('paymentUpdate', (event: any) => {
        this.createNotification({
          type: 'payment',
          title: 'Pagamento Processado',
          message: `Pagamento de ${event.detail.amount} processado com sucesso`,
          priority: 'medium',
          category: 'payment',
          actionUrl: '/admin/payments',
          actionText: 'Ver Detalhes'
        });
      });

      // Escutar atualizações do sistema
      window.addEventListener('systemUpdate', (event: any) => {
        this.createNotification({
          type: 'system',
          title: 'Atualização do Sistema',
          message: event.detail.message || 'Sistema atualizado com sucesso',
          priority: 'low',
          category: 'system'
        });
      });
    }
  }

  // Criar notificação
  createNotification(data: {
    type: Notification['type'];
    title: string;
    message: string;
    priority?: Notification['priority'];
    category: Notification['category'];
    userId?: string;
    actionUrl?: string;
    actionText?: string;
  }) {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      timestamp: new Date(),
      read: false,
      priority: data.priority || 'medium'
    };

    this.notifications.unshift(notification);
    
    // Manter apenas as últimas 100 notificações
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.notifyListeners();

    // Mostrar notificação no navegador se suportado
    this.showBrowserNotification(notification);

    return notification;
  }

  private showBrowserNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/ploutos-ledger-icon.svg',
        tag: notification.id
      });
    }
  }

  // Solicitar permissão para notificações do navegador
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Subscrever para mudanças
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    listener(this.notifications);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Marcar como lida
  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  // Marcar todas como lidas
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Obter notificações não lidas
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Obter notificações por categoria
  getNotificationsByCategory(category: Notification['category']): Notification[] {
    return this.notifications.filter(n => n.category === category);
  }

  // Obter notificações por prioridade
  getNotificationsByPriority(priority: Notification['priority']): Notification[] {
    return this.notifications.filter(n => n.priority === priority);
  }

  // Filtrar notificações
  filterNotifications(filters: {
    type?: string;
    category?: string;
    priority?: string;
    read?: boolean;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    let filtered = [...this.notifications];

    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter(n => n.category === filters.category);
    }

    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority);
    }

    if (filters.read !== undefined) {
      filtered = filtered.filter(n => n.read === filters.read);
    }

    if (filters.userId) {
      filtered = filtered.filter(n => n.userId === filters.userId);
    }

    if (filters.startDate) {
      filtered = filtered.filter(n => n.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(n => n.timestamp <= filters.endDate!);
    }

    return filtered;
  }

  // Obter estatísticas
  getStats() {
    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.read).length;
    const today = this.notifications.filter(n => {
      const today = new Date();
      const notificationDate = new Date(n.timestamp);
      return notificationDate.toDateString() === today.toDateString();
    }).length;

    const categoryStats = this.notifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const priorityStats = this.notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      unread,
      today,
      categoryStats,
      priorityStats
    };
  }

  // Limpar notificações antigas
  clearOldNotifications(daysToKeep: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.notifications = this.notifications.filter(n => n.timestamp >= cutoffDate);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Remover notificação
  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Limpar todas as notificações
  clearAllNotifications() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Exportar notificações
  exportNotifications(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'Tipo', 'Título', 'Mensagem', 'Data', 'Lida', 'Prioridade', 'Categoria'];
      const csvContent = [
        headers.join(','),
        ...this.notifications.map(n => [
          n.id,
          n.type,
          n.title,
          n.message,
          n.timestamp.toISOString(),
          n.read,
          n.priority,
          n.category
        ].join(','))
      ].join('\n');
      
      return csvContent;
    }
    
    return JSON.stringify(this.notifications, null, 2);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
