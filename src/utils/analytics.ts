/**
 * Sistema de Analytics básico para tracking de eventos
 * Permite monitorar ações do usuário e performance da aplicação
 */

interface AnalyticsEvent {
  event: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

class Analytics {
  private sessionId: string;
  private userId?: string;
  private events: AnalyticsEvent[] = [];
  private maxEvents = 100;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadUserId();
    this.loadStoredEvents();
  }

  private generateSessionId(): string {
    const stored = sessionStorage.getItem('analytics_session_id');
    if (stored) return stored;
    
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', id);
    return id;
  }

  private loadUserId(): void {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.userId = userData.id || userData.username;
      } catch (e) {
        // Ignorar erro de parsing
      }
    }
  }

  private loadStoredEvents(): void {
    try {
      const stored = localStorage.getItem('analytics_events');
      if (stored) {
        this.events = JSON.parse(stored).slice(-this.maxEvents);
      }
    } catch (e) {
      // Ignorar erro de parsing
    }
  }

  private saveEvents(): void {
    try {
      localStorage.setItem('analytics_events', JSON.stringify(this.events.slice(-this.maxEvents)));
    } catch (e) {
      // Ignorar erro de salvamento (storage cheio, etc)
    }
  }

  /**
   * Registra um evento de analytics
   */
  track(event: string, category: string, action: string, label?: string, value?: number): void {
    const analyticsEvent: AnalyticsEvent = {
      event,
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.events.push(analyticsEvent);
    this.saveEvents();

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', analyticsEvent);
    }

    // Aqui você pode enviar para um serviço externo (Google Analytics, etc)
    // this.sendToExternalService(analyticsEvent);
  }

  /**
   * Registra um evento de página/view
   */
  pageView(pageName: string, pageTitle?: string): void {
    this.track('page_view', 'Navigation', 'Page View', pageTitle || pageName);
  }

  /**
   * Registra um evento de clique
   */
  click(element: string, location?: string): void {
    this.track('click', 'Interaction', 'Click', `${location || 'unknown'}_${element}`);
  }

  /**
   * Registra um evento de formulário
   */
  formEvent(action: 'submit' | 'error' | 'cancel', formName: string, error?: string): void {
    this.track('form_event', 'Form', action, formName, error ? 1 : 0);
    if (error) {
      this.track('form_error', 'Form', 'Error', `${formName}_${error}`);
    }
  }

  /**
   * Registra um evento de erro
   */
  error(error: string, context?: string): void {
    this.track('error', 'Error', 'Error Occurred', context || 'unknown', 1);
  }

  /**
   * Registra tempo de carregamento
   */
  performance(metric: string, value: number, unit: 'ms' | 's' = 'ms'): void {
    this.track('performance', 'Performance', metric, unit, value);
  }

  /**
   * Obtém eventos do analytics
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Limpa eventos antigos
   */
  clearEvents(): void {
    this.events = [];
    localStorage.removeItem('analytics_events');
  }

  /**
   * Define o ID do usuário
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }
}

// Instância singleton
export const analytics = new Analytics();

// Hook para uso em componentes React
export const useAnalytics = () => {
  return {
    track: analytics.track.bind(analytics),
    pageView: analytics.pageView.bind(analytics),
    click: analytics.click.bind(analytics),
    formEvent: analytics.formEvent.bind(analytics),
    error: analytics.error.bind(analytics),
    performance: analytics.performance.bind(analytics),
  };
};

export default analytics;


