// Serviço Avançado de Gestão de Assinaturas
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin.replace(/:\d+$/, ':4000') : 'http://localhost:4000');

export interface SubscriptionRecord {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'active' | 'expired' | 'canceled' | 'expiring_soon' | 'past_due' | 'trialing';
  startedAt: Date;
  expiresAt: Date | null;
  validUntil: Date | null;
  autoRenew: boolean;
  lastNotificationAt: Date | null;
  txid?: string;
}

export interface PlanRecord {
  id: string;
  name: string;
  priceCents: number;
  interval: 'monthly' | 'yearly';
  features?: string;
}

export interface PaymentRecord {
  id: string;
  userId: string;
  subscriptionId?: string;
  amountCents: number;
  currency: string;
  method: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  txid?: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
  paymentLink?: string;
  paidAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

class SubscriptionService {
  private subscriptions: SubscriptionRecord[] = [];
  private listeners: Set<(subs: SubscriptionRecord[]) => void> = new Set();

  constructor() {
    this.loadSubscriptions();
  }

  private loadSubscriptions() {
    try {
      const stored = localStorage.getItem('ploutos_subscriptions');
      if (stored) {
        this.subscriptions = JSON.parse(stored).map((s: any) => ({
          ...s,
          startedAt: new Date(s.startedAt),
          expiresAt: s.expiresAt ? new Date(s.expiresAt) : null,
          validUntil: s.validUntil ? new Date(s.validUntil) : null,
          lastNotificationAt: s.lastNotificationAt ? new Date(s.lastNotificationAt) : null,
        }));
      }
    } catch (error) {
      // Erro ao carregar assinaturas - retornar array vazio
    }
  }

  private saveSubscriptions() {
    localStorage.setItem('ploutos_subscriptions', JSON.stringify(this.subscriptions));
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.subscriptions]));
  }

  subscribe(listener: (subs: SubscriptionRecord[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.subscriptions]);
    return () => this.listeners.delete(listener);
  }

  // Buscar assinaturas do usuário atual
  async getUserSubscriptions(userId: string): Promise<SubscriptionRecord[]> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE}/api/subscriptions/user/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data.map((s: any) => ({
        ...s,
        startedAt: new Date(s.startedAt),
        expiresAt: s.expiresAt ? new Date(s.expiresAt) : null,
        validUntil: s.validUntil ? new Date(s.validUntil) : null,
        lastNotificationAt: s.lastNotificationAt ? new Date(s.lastNotificationAt) : null,
      }));
    } catch (error) {
      // Erro ao buscar assinaturas - retornar array vazio
      return this.subscriptions.filter(s => s.userId === userId);
    }
  }

  // Criar nova assinatura
  async createSubscription(
    userId: string,
    planId: string,
    planName: string,
    interval: 'monthly' | 'yearly'
  ): Promise<SubscriptionRecord> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_BASE}/api/subscriptions`,
        { userId, planId, planName, interval },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const subscription = {
        ...response.data,
        startedAt: new Date(response.data.startedAt),
        expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : null,
        validUntil: response.data.validUntil ? new Date(response.data.validUntil) : null,
        lastNotificationAt: response.data.lastNotificationAt ? new Date(response.data.lastNotificationAt) : null,
      };
      this.subscriptions.push(subscription);
      this.saveSubscriptions();
      return subscription;
    } catch (error) {
      // Erro ao criar assinatura
      throw error;
    }
  }

  // Renovar assinatura
  async renewSubscription(subscriptionId: string, licenseKey: string): Promise<SubscriptionRecord> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_BASE}/api/subscriptions/${subscriptionId}/renew`,
        { licenseKey },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const updated = {
        ...response.data,
        startedAt: new Date(response.data.startedAt),
        expiresAt: response.data.expiresAt ? new Date(response.data.expiresAt) : null,
        validUntil: response.data.validUntil ? new Date(response.data.validUntil) : null,
        lastNotificationAt: response.data.lastNotificationAt ? new Date(response.data.lastNotificationAt) : null,
      };
      const index = this.subscriptions.findIndex(s => s.id === subscriptionId);
      if (index !== -1) {
        this.subscriptions[index] = updated;
      } else {
        this.subscriptions.push(updated);
      }
      this.saveSubscriptions();
      return updated;
    } catch (error) {
      // Erro ao renovar assinatura
      throw error;
    }
  }

  // Validar licença em tempo real - USANDO SERVIÇO CENTRALIZADO
  async validateLicenseKey(licenseKey: string, source: 'landing_page' | 'client_dashboard' | 'api' = 'api', userInfo?: { username?: string; email?: string }): Promise<{
    valid: boolean;
    subscription?: SubscriptionRecord;
    message?: string;
  }> {
    // Usar serviço centralizado de validação
    const licenseValidationService = await import('./licenseValidationService');
    const result = licenseValidationService.default.validateLicense(licenseKey, source, userInfo);
    
    if (result.valid && result.license) {
      // Converter para formato de subscription se necessário
      return {
        valid: true,
        message: result.message || 'Licença válida',
        subscription: {
          id: result.license.id,
          userId: result.license.userId,
          planId: result.license.planId || 'trial',
          planName: result.license.planName || 'Trial 30 Dias',
          status: result.license.status === 'trial' ? 'trialing' : 'active',
          startedAt: new Date(result.license.createdAt || Date.now()),
          expiresAt: result.license.validUntil ? new Date(result.license.validUntil) : null,
          validUntil: result.license.validUntil ? new Date(result.license.validUntil) : null,
          autoRenew: false,
          lastNotificationAt: null
        } as SubscriptionRecord
      };
    }
    
    return {
      valid: false,
      message: result.message || result.reason || 'Licença inválida'
    };
  }

  // Verificar se assinatura está expirando
  checkExpiringSubscriptions(userId: string): SubscriptionRecord[] {
    const now = new Date();
    const daysUntilExpiry = 7; // 7 dias antes de expirar
    const expiryThreshold = new Date(now.getTime() + daysUntilExpiry * 24 * 60 * 60 * 1000);

    return this.subscriptions.filter(sub => {
      if (sub.userId !== userId) return false;
      if (sub.status !== 'active') return false;
      if (!sub.expiresAt) return false;
      return sub.expiresAt <= expiryThreshold && sub.expiresAt > now;
    });
  }

  // Verificar se assinatura expirou
  checkExpiredSubscriptions(userId: string): SubscriptionRecord[] {
    const now = new Date();
    return this.subscriptions.filter(sub => {
      if (sub.userId !== userId) return false;
      if (sub.status === 'expired') return true;
      if (sub.expiresAt && sub.expiresAt <= now && sub.status === 'active') {
        return true;
      }
      return false;
    });
  }

  // Atualizar status da assinatura
  updateSubscriptionStatus(subscriptionId: string, status: SubscriptionRecord['status']): void {
    const index = this.subscriptions.findIndex(s => s.id === subscriptionId);
    if (index !== -1) {
      this.subscriptions[index].status = status;
      this.saveSubscriptions();
    }
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.post(
        `${API_BASE}/api/subscriptions/${subscriptionId}/cancel`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      this.updateSubscriptionStatus(subscriptionId, 'canceled');
    } catch (error) {
      // Erro ao cancelar assinatura
      throw error;
    }
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;

