export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  enabled: boolean;
  secret?: string;
  headers?: Record<string, string>;
  createdAt: Date;
  lastTriggered?: Date;
  successCount: number;
  failureCount: number;
}

export type WebhookEvent = 
  | 'cashflow.closed'
  | 'cashflow.saved'
  | 'cashflow.cleared'
  | 'cashflow.backup_created'
  | 'cashflow.alert_created'
  | 'cashflow.validation_failed';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  metadata?: {
    userId?: string;
    version?: string;
  };
}

class WebhookService {
  private readonly WEBHOOKS_KEY = 'cashflow_webhooks';
  private readonly MAX_WEBHOOKS = 10;

  // Criar webhook
  createWebhook(webhook: Omit<Webhook, 'id' | 'createdAt' | 'successCount' | 'failureCount'>): Webhook {
    const newWebhook: Webhook = {
      ...webhook,
      id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      successCount: 0,
      failureCount: 0
    };

    this.saveWebhook(newWebhook);
    return newWebhook;
  }

  // Salvar webhook
  private saveWebhook(webhook: Webhook): void {
    const webhooks = this.getAllWebhooks();
    
    // Verificar limite
    if (webhooks.length >= this.MAX_WEBHOOKS) {
      throw new Error(`Limite de ${this.MAX_WEBHOOKS} webhooks atingido`);
    }

    // Verificar se já existe
    const index = webhooks.findIndex(w => w.id === webhook.id);
    if (index !== -1) {
      webhooks[index] = webhook;
    } else {
      webhooks.push(webhook);
    }

    localStorage.setItem(this.WEBHOOKS_KEY, JSON.stringify(webhooks));
  }

  // Obter todos os webhooks
  getAllWebhooks(): Webhook[] {
    try {
      const stored = localStorage.getItem(this.WEBHOOKS_KEY);
      if (!stored) return [];
      
      const webhooks = JSON.parse(stored);
      return webhooks.map((w: any) => ({
        ...w,
        createdAt: new Date(w.createdAt),
        lastTriggered: w.lastTriggered ? new Date(w.lastTriggered) : undefined
      }));
    } catch (error) {
      // Erro ao carregar webhooks - retornar array vazio
      return [];
    }
  }

  // Obter webhooks por evento
  getWebhooksByEvent(event: WebhookEvent): Webhook[] {
    return this.getAllWebhooks().filter(
      w => w.enabled && w.events.includes(event)
    );
  }

  // Atualizar webhook
  updateWebhook(id: string, updates: Partial<Webhook>): boolean {
    const webhooks = this.getAllWebhooks();
    const index = webhooks.findIndex(w => w.id === id);
    
    if (index === -1) return false;

    webhooks[index] = {
      ...webhooks[index],
      ...updates,
      id: webhooks[index].id, // Manter ID original
      createdAt: webhooks[index].createdAt // Manter data de criação
    };

    localStorage.setItem(this.WEBHOOKS_KEY, JSON.stringify(webhooks));
    return true;
  }

  // Deletar webhook
  deleteWebhook(id: string): boolean {
    const webhooks = this.getAllWebhooks();
    const filtered = webhooks.filter(w => w.id !== id);
    
    if (filtered.length === webhooks.length) return false;
    
    localStorage.setItem(this.WEBHOOKS_KEY, JSON.stringify(filtered));
    return true;
  }

  // Disparar webhook
  async triggerWebhook(webhook: Webhook, payload: WebhookPayload): Promise<boolean> {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
          ...webhook.headers
        },
        body: JSON.stringify(payload)
      });

      const success = response.ok;
      
      // Atualizar estatísticas
      const webhooks = this.getAllWebhooks();
      const index = webhooks.findIndex(w => w.id === webhook.id);
      if (index !== -1) {
        if (success) {
          webhooks[index].successCount++;
        } else {
          webhooks[index].failureCount++;
        }
        webhooks[index].lastTriggered = new Date();
        localStorage.setItem(this.WEBHOOKS_KEY, JSON.stringify(webhooks));
      }

      return success;
    } catch (error) {
      // Erro ao disparar webhook - não crítico
      
      // Atualizar contador de falhas
      const webhooks = this.getAllWebhooks();
      const index = webhooks.findIndex(w => w.id === webhook.id);
      if (index !== -1) {
        webhooks[index].failureCount++;
        webhooks[index].lastTriggered = new Date();
        localStorage.setItem(this.WEBHOOKS_KEY, JSON.stringify(webhooks));
      }
      
      return false;
    }
  }

  // Disparar webhooks para um evento
  async triggerEvent(event: WebhookEvent, data: any, metadata?: WebhookPayload['metadata']): Promise<void> {
    const webhooks = this.getWebhooksByEvent(event);
    
    if (webhooks.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      metadata
    };

    // Disparar todos os webhooks em paralelo
    await Promise.allSettled(
      webhooks.map(webhook => this.triggerWebhook(webhook, payload))
    );
  }

  // Testar webhook
  async testWebhook(webhook: Webhook): Promise<{ success: boolean; message: string }> {
    const testPayload: WebhookPayload = {
      event: 'cashflow.saved',
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'Este é um teste de webhook'
      },
      metadata: {
        version: '1.0.0'
      }
    };

    const success = await this.triggerWebhook(webhook, testPayload);
    
    return {
      success,
      message: success 
        ? 'Webhook testado com sucesso!' 
        : 'Falha ao testar webhook. Verifique a URL e configurações.'
    };
  }
}

export const webhookService = new WebhookService();

