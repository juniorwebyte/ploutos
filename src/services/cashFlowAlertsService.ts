export type AlertType = 'success' | 'warning' | 'error' | 'info';
export type AlertCategory = 'meta' | 'saldo' | 'movimentacao' | 'fechamento' | 'geral';

export interface Alert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

class CashFlowAlertsService {
  private alerts: Alert[] = [];
  private listeners: Array<(alerts: Alert[]) => void> = [];

  // Verificar meta diária
  checkDailyGoal(currentTotal: number, dailyGoal: number): Alert | null {
    if (currentTotal >= dailyGoal) {
      const percentage = ((currentTotal / dailyGoal) * 100).toFixed(1);
      return {
        id: `meta-${Date.now()}`,
        type: 'success',
        category: 'meta',
        title: '🎯 Meta Diária Atingida!',
        message: `Parabéns! Você atingiu ${percentage}% da meta diária (${this.formatCurrency(dailyGoal)}). Total atual: ${this.formatCurrency(currentTotal)}`,
        timestamp: new Date(),
        read: false
      };
    } else if (currentTotal >= dailyGoal * 0.9) {
      const remaining = dailyGoal - currentTotal;
      return {
        id: `meta-proximo-${Date.now()}`,
        type: 'info',
        category: 'meta',
        title: '📊 Próximo da Meta',
        message: `Você está próximo da meta! Faltam apenas ${this.formatCurrency(remaining)} para atingir a meta de ${this.formatCurrency(dailyGoal)}`,
        timestamp: new Date(),
        read: false
      };
    }
    return null;
  }

  // Verificar saldo negativo
  checkNegativeBalance(balance: number): Alert | null {
    if (balance < 0) {
      return {
        id: `saldo-negativo-${Date.now()}`,
        type: 'error',
        category: 'saldo',
        title: '⚠️ Saldo Negativo Detectado!',
        message: `Atenção! O saldo atual é negativo: ${this.formatCurrency(balance)}. Verifique as movimentações.`,
        timestamp: new Date(),
        read: false,
        actionUrl: '#resumo',
        actionLabel: 'Ver Resumo'
      };
    }
    return null;
  }

  // Verificar movimentação acima do normal
  checkHighMovement(currentTotal: number, averageTotal: number, threshold: number = 1.5): Alert | null {
    if (averageTotal > 0 && currentTotal > averageTotal * threshold) {
      const increase = ((currentTotal / averageTotal - 1) * 100).toFixed(1);
      return {
        id: `movimentacao-alta-${Date.now()}`,
        type: 'warning',
        category: 'movimentacao',
        title: '📈 Movimentação Acima do Normal',
        message: `A movimentação atual (${this.formatCurrency(currentTotal)}) está ${increase}% acima da média (${this.formatCurrency(averageTotal)}).`,
        timestamp: new Date(),
        read: false
      };
    }
    return null;
  }

  // Lembrete de fechamento
  createClosingReminder(lastCloseTime?: Date): Alert | null {
    const now = new Date();
    const hoursSinceLastClose = lastCloseTime 
      ? (now.getTime() - lastCloseTime.getTime()) / (1000 * 60 * 60)
      : 24;

    // Lembrar se passou mais de 8 horas desde o último fechamento
    if (hoursSinceLastClose >= 8) {
      return {
        id: `fechamento-lembrete-${Date.now()}`,
        type: 'info',
        category: 'fechamento',
        title: '⏰ Lembrete de Fechamento',
        message: `Já se passaram ${Math.floor(hoursSinceLastClose)} horas desde o último fechamento. Considere fechar o movimento.`,
        timestamp: new Date(),
        read: false,
        actionUrl: '#fechar',
        actionLabel: 'Fechar Movimento'
      };
    }
    return null;
  }

  // Adicionar alerta
  addAlert(alert: Alert): void {
    // Remover alertas duplicados da mesma categoria
    this.alerts = this.alerts.filter(a => 
      a.category !== alert.category || a.id !== alert.id
    );
    
    this.alerts.unshift(alert);
    
    // Manter apenas últimos 50 alertas
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(0, 50);
    }
    
    this.notifyListeners();
  }

  // Obter alertas
  getAlerts(category?: AlertCategory, unreadOnly: boolean = false): Alert[] {
    let filtered = [...this.alerts];
    
    if (category) {
      filtered = filtered.filter(a => a.category === category);
    }
    
    if (unreadOnly) {
      filtered = filtered.filter(a => !a.read);
    }
    
    return filtered;
  }

  // Marcar como lido
  markAsRead(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
      this.notifyListeners();
    }
  }

  // Marcar todos como lidos
  markAllAsRead(): void {
    this.alerts.forEach(alert => alert.read = true);
    this.notifyListeners();
  }

  // Remover alerta
  removeAlert(alertId: string): void {
    this.alerts = this.alerts.filter(a => a.id !== alertId);
    this.notifyListeners();
  }

  // Limpar alertas antigos (mais de 7 dias)
  clearOldAlerts(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    this.alerts = this.alerts.filter(a => a.timestamp >= sevenDaysAgo);
    this.notifyListeners();
  }

  // Contar alertas não lidos
  getUnreadCount(category?: AlertCategory): number {
    return this.getAlerts(category, true).length;
  }

  // Inscrever-se em mudanças
  subscribe(listener: (alerts: Alert[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notificar ouvintes
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.alerts]));
  }

  // Formatar moeda
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}

export const cashFlowAlertsService = new CashFlowAlertsService();

