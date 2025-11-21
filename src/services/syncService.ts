// Serviço de Sincronização em Tempo Real
export interface SyncEvent {
  id: string;
  type: 'nota_fiscal' | 'parcela' | 'pagamento' | 'usuario' | 'plano' | 'chat' | 'sistema';
  action: 'create' | 'update' | 'delete' | 'status_change';
  entityId: string;
  data: any;
  timestamp: Date;
  source: 'landing' | 'admin' | 'client' | 'system';
  userId?: string;
}

class SyncService {
  private events: SyncEvent[] = [];
  private listeners: Array<(event: SyncEvent) => void> = [];
  private isOnline = true;

  constructor() {
    this.loadEvents();
    this.setupEventListeners();
  }

  private loadEvents() {
    try {
      const saved = localStorage.getItem('ploutos_sync_events');
      if (saved) {
        this.events = JSON.parse(saved).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
      }
    } catch (error) {
      // Erro ao carregar eventos - retornar array vazio
    }
  }

  private saveEvents() {
    localStorage.setItem('ploutos_sync_events', JSON.stringify(this.events));
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      // Escutar mudanças de conectividade
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processPendingEvents();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // Escutar eventos de chat
      window.addEventListener('chatUpdate', (event: any) => {
        this.emitEvent({
          type: 'chat',
          action: 'update',
          entityId: 'chat_sessions',
          data: event.detail,
          source: 'system'
        });
      });

      // Escutar eventos de pagamento
      window.addEventListener('paymentUpdate', (event: any) => {
        this.emitEvent({
          type: 'pagamento',
          action: 'create',
          entityId: event.detail.id || 'payment_' + Date.now(),
          data: event.detail,
          source: 'system'
        });
      });

      // Escutar eventos de nota fiscal
      window.addEventListener('notaFiscalUpdate', (event: any) => {
        this.emitEvent({
          type: 'nota_fiscal',
          action: event.detail.action || 'update',
          entityId: event.detail.id,
          data: event.detail.data,
          source: 'system'
        });
      });

      // Escutar eventos de plano
      window.addEventListener('planUpdate', (event: any) => {
        this.emitEvent({
          type: 'plano',
          action: event.detail.action || 'update',
          entityId: event.detail.id,
          data: event.detail.data,
          source: 'admin'
        });
      });
    }
  }

  // Emitir evento de sincronização
  emitEvent(eventData: Omit<SyncEvent, 'id' | 'timestamp'>) {
    const event: SyncEvent = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...eventData
    };

    this.events.unshift(event);
    
    // Manter apenas os últimos 1000 eventos
    if (this.events.length > 1000) {
      this.events = this.events.slice(0, 1000);
    }

    this.saveEvents();
    this.notifyListeners(event);

    // Se estiver online, processar imediatamente
    if (this.isOnline) {
      this.processEvent(event);
    }
  }

  // Subscrever para eventos
  subscribe(listener: (event: SyncEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(event: SyncEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  // Processar evento
  private processEvent(event: SyncEvent) {
    try {
      switch (event.type) {
        case 'nota_fiscal':
          this.syncNotaFiscal(event);
          break;
        case 'parcela':
          this.syncParcela(event);
          break;
        case 'pagamento':
          this.syncPagamento(event);
          break;
        case 'plano':
          this.syncPlano(event);
          break;
        case 'chat':
          this.syncChat(event);
          break;
        case 'usuario':
          this.syncUsuario(event);
          break;
        case 'sistema':
          this.syncSistema(event);
          break;
      }
    } catch (error) {
      // Erro ao processar evento - não crítico
    }
  }

  // Processar eventos pendentes quando voltar online
  private processPendingEvents() {
    const pendingEvents = this.events.filter(e => 
      e.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
    );
    
    pendingEvents.forEach(event => this.processEvent(event));
  }

  // Sincronizar nota fiscal
  private syncNotaFiscal(event: SyncEvent) {
    const existingNotas = JSON.parse(localStorage.getItem('ploutos_notas_fiscais') || '[]');
    
    switch (event.action) {
      case 'create':
        existingNotas.push(event.data);
        break;
      case 'update':
        const index = existingNotas.findIndex((n: any) => n.id === event.entityId);
        if (index !== -1) {
          existingNotas[index] = { ...existingNotas[index], ...event.data };
        }
        break;
      case 'delete':
        const filteredNotas = existingNotas.filter((n: any) => n.id !== event.entityId);
        existingNotas.splice(0, existingNotas.length, ...filteredNotas);
        break;
    }
    
    localStorage.setItem('ploutos_notas_fiscais', JSON.stringify(existingNotas));
    
    // Emitir evento de atualização
    window.dispatchEvent(new CustomEvent('notaFiscalSync', {
      detail: { action: event.action, data: event.data }
    }));
  }

  // Sincronizar parcela
  private syncParcela(event: SyncEvent) {
    const existingNotas = JSON.parse(localStorage.getItem('ploutos_notas_fiscais') || '[]');
    const notaIndex = existingNotas.findIndex((n: any) => n.id === event.data.notaId);
    
    if (notaIndex !== -1) {
      const nota = existingNotas[notaIndex];
      
      if (!nota.parcelas) nota.parcelas = [];
      
      switch (event.action) {
        case 'create':
          nota.parcelas.push(event.data);
          break;
        case 'update':
          const parcelaIndex = nota.parcelas.findIndex((p: any) => p.id === event.entityId);
          if (parcelaIndex !== -1) {
            nota.parcelas[parcelaIndex] = { ...nota.parcelas[parcelaIndex], ...event.data };
          }
          break;
        case 'delete':
          nota.parcelas = nota.parcelas.filter((p: any) => p.id !== event.entityId);
          break;
        case 'status_change':
          const parcelaStatusIndex = nota.parcelas.findIndex((p: any) => p.id === event.entityId);
          if (parcelaStatusIndex !== -1) {
            nota.parcelas[parcelaStatusIndex].status = event.data.status;
            if (event.data.dataPagamento) {
              nota.parcelas[parcelaStatusIndex].dataPagamento = event.data.dataPagamento;
            }
          }
          break;
      }
      
      // Recalcular status da nota
      const parcelasPagas = nota.parcelas.filter((p: any) => p.status === 'paga').length;
      const parcelasVencidas = nota.parcelas.filter((p: any) => p.status === 'vencida').length;
      
      if (parcelasPagas === nota.parcelas.length) {
        nota.status = 'quitada';
      } else if (parcelasPagas > 0) {
        nota.status = 'parcialmente_paga';
      } else if (parcelasVencidas > 0) {
        nota.status = 'vencida';
      }
      
      existingNotas[notaIndex] = nota;
      localStorage.setItem('ploutos_notas_fiscais', JSON.stringify(existingNotas));
    }
  }

  // Sincronizar pagamento
  private syncPagamento(event: SyncEvent) {
    const existingPayments = JSON.parse(localStorage.getItem('ploutos_payments') || '[]');
    
    switch (event.action) {
      case 'create':
        existingPayments.push(event.data);
        break;
      case 'update':
        const index = existingPayments.findIndex((p: any) => p.id === event.entityId);
        if (index !== -1) {
          existingPayments[index] = { ...existingPayments[index], ...event.data };
        }
        break;
    }
    
    localStorage.setItem('ploutos_payments', JSON.stringify(existingPayments));
    
    // Emitir evento de atualização de pagamento
    window.dispatchEvent(new CustomEvent('paymentUpdate', {
      detail: event.data
    }));
  }

  // Sincronizar plano
  private syncPlano(event: SyncEvent) {
    const existingPlans = JSON.parse(localStorage.getItem('ploutos_plans') || '[]');
    
    switch (event.action) {
      case 'create':
        existingPlans.push(event.data);
        break;
      case 'update':
        const index = existingPlans.findIndex((p: any) => p.id === event.entityId);
        if (index !== -1) {
          existingPlans[index] = { ...existingPlans[index], ...event.data };
        }
        break;
      case 'delete':
        const filteredPlans = existingPlans.filter((p: any) => p.id !== event.entityId);
        existingPlans.splice(0, existingPlans.length, ...filteredPlans);
        break;
    }
    
    localStorage.setItem('ploutos_plans', JSON.stringify(existingPlans));
    
    // Emitir evento de atualização de plano
    window.dispatchEvent(new CustomEvent('planUpdate', {
      detail: { action: event.action, data: event.data }
    }));
  }

  // Sincronizar chat
  private syncChat(event: SyncEvent) {
    // O chat já tem seu próprio serviço de sincronização
    // Aqui apenas propagamos o evento
    window.dispatchEvent(new CustomEvent('chatSync', {
      detail: event.data
    }));
  }

  // Sincronizar usuário
  private syncUsuario(event: SyncEvent) {
    const existingUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
    
    switch (event.action) {
      case 'create':
        existingUsers.push(event.data);
        break;
      case 'update':
        const index = existingUsers.findIndex((u: any) => u.id === event.entityId);
        if (index !== -1) {
          existingUsers[index] = { ...existingUsers[index], ...event.data };
        }
        break;
    }
    
    localStorage.setItem('ploutos_users', JSON.stringify(existingUsers));
  }

  // Sincronizar sistema
  private syncSistema(event: SyncEvent) {
    // Eventos do sistema são propagados globalmente
    window.dispatchEvent(new CustomEvent('systemUpdate', {
      detail: event.data
    }));
  }

  // Obter eventos
  getEvents(filters?: {
    type?: string;
    action?: string;
    source?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): SyncEvent[] {
    let filtered = [...this.events];

    if (filters) {
      if (filters.type) {
        filtered = filtered.filter(e => e.type === filters.type);
      }
      if (filters.action) {
        filtered = filtered.filter(e => e.action === filters.action);
      }
      if (filters.source) {
        filtered = filtered.filter(e => e.source === filters.source);
      }
      if (filters.userId) {
        filtered = filtered.filter(e => e.userId === filters.userId);
      }
      if (filters.startDate) {
        filtered = filtered.filter(e => e.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filtered = filtered.filter(e => e.timestamp <= filters.endDate!);
      }
    }

    return filtered;
  }

  // Obter estatísticas
  getStats() {
    const total = this.events.length;
    const today = this.events.filter(e => {
      const today = new Date();
      const eventDate = new Date(e.timestamp);
      return eventDate.toDateString() === today.toDateString();
    }).length;

    const typeStats = this.events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sourceStats = this.events.reduce((acc, e) => {
      acc[e.source] = (acc[e.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      today,
      typeStats,
      sourceStats,
      isOnline: this.isOnline
    };
  }

  // Limpar eventos antigos
  clearOldEvents(daysToKeep: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.events = this.events.filter(e => e.timestamp >= cutoffDate);
    this.saveEvents();
  }

  // Forçar sincronização
  forceSync() {
    this.processPendingEvents();
  }
}

export const syncService = new SyncService();
export default syncService;
