/**
 * Serviço de Gerenciamento de Assinaturas
 * Controla acesso aos módulos baseado em assinaturas ativas
 */

export interface Plan {
  id: string;
  name: string;
  modules: string[]; // Módulos liberados: ['timeclock', 'caderno', 'caixa']
  maxEmployees?: number; // Limite de funcionários
  maxCompanies?: number; // Limite de empresas
  features: {
    [key: string]: any; // Features específicas do plano
  };
  price: number;
  interval: 'monthly' | 'yearly';
  isActive: boolean;
}

export interface Subscription {
  id: string;
  companyId: string;
  planId: string;
  status: 'active' | 'expired' | 'blocked' | 'trial' | 'cancelled';
  startDate: Date;
  endDate: Date;
  trialEndsAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  plan?: Plan;
}

export interface ModulePermission {
  companyId: string;
  module: string; // 'timeclock', 'caderno', 'caixa'
  enabled: boolean;
  enabledBy?: string; // ID do Super Admin que habilitou
  enabledAt?: Date;
  reason?: string;
}

class SubscriptionService {
  private subscriptions: Map<string, Subscription> = new Map();
  private plans: Map<string, Plan> = new Map();
  private permissions: Map<string, ModulePermission> = new Map();

  constructor() {
    this.loadData();
    this.initializeDefaultPlans();
  }

  /**
   * Verificar se uma empresa tem acesso a um módulo
   */
  async hasAccess(companyId: string, module: string): Promise<{
    hasAccess: boolean;
    reason?: string;
    subscription?: Subscription;
    plan?: Plan;
  }> {
    // Verificar permissão explícita (Super Admin pode forçar)
    const permission = this.permissions.get(`${companyId}_${module}`);
    if (permission && permission.enabled) {
      return {
        hasAccess: true,
        reason: 'Manualmente habilitado pelo Super Admin',
        subscription: undefined,
        plan: undefined,
      };
    }

    // Verificar assinatura ativa
    const subscription = this.subscriptions.get(companyId);
    if (!subscription) {
      return {
        hasAccess: false,
        reason: 'Nenhuma assinatura encontrada',
      };
    }

    // Verificar status da assinatura
    if (subscription.status !== 'active' && subscription.status !== 'trial') {
      return {
        hasAccess: false,
        reason: `Assinatura ${subscription.status}`,
        subscription,
      };
    }

    // Verificar data de validade
    const now = new Date();
    if (subscription.endDate < now) {
      return {
        hasAccess: false,
        reason: 'Assinatura expirada',
        subscription,
      };
    }

    // Verificar se o plano inclui o módulo
    const plan = subscription.plan || this.plans.get(subscription.planId);
    if (!plan) {
      return {
        hasAccess: false,
        reason: 'Plano não encontrado',
        subscription,
      };
    }

    if (!plan.modules.includes(module)) {
      return {
        hasAccess: false,
        reason: `Módulo ${module} não incluído no plano`,
        subscription,
        plan,
      };
    }

    return {
      hasAccess: true,
      subscription,
      plan,
    };
  }

  /**
   * Verificar se está em modo demo
   */
  isDemoMode(): boolean {
    // Verificar se está no painel demo
    const path = window.location.pathname;
    return path.includes('/demo') || path.includes('demo=true');
  }

  /**
   * Obter status da assinatura para uma empresa
   */
  async getSubscriptionStatus(companyId: string): Promise<{
    hasSubscription: boolean;
    subscription?: Subscription;
    plan?: Plan;
    isActive: boolean;
    daysRemaining?: number;
  }> {
    const subscription = this.subscriptions.get(companyId);
    if (!subscription) {
      return {
        hasSubscription: false,
        isActive: false,
      };
    }

    const plan = subscription.plan || this.plans.get(subscription.planId);
    const now = new Date();
    const isActive = subscription.status === 'active' && subscription.endDate >= now;
    const daysRemaining = isActive
      ? Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      hasSubscription: true,
      subscription,
      plan,
      isActive,
      daysRemaining,
    };
  }

  /**
   * Criar assinatura
   */
  async createSubscription(
    companyId: string,
    planId: string,
    startDate?: Date
  ): Promise<Subscription> {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    const start = startDate || new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1); // Assumindo mensal por padrão

    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId,
      planId,
      status: 'active',
      startDate: start,
      endDate: end,
      createdAt: new Date(),
      updatedAt: new Date(),
      plan,
    };

    this.subscriptions.set(companyId, subscription);
    this.saveData();

    return subscription;
  }

  /**
   * Habilitar/desabilitar módulo para empresa (Super Admin)
   */
  async setModulePermission(
    companyId: string,
    module: string,
    enabled: boolean,
    enabledBy?: string,
    reason?: string
  ): Promise<ModulePermission> {
    const key = `${companyId}_${module}`;
    const permission: ModulePermission = {
      companyId,
      module,
      enabled,
      enabledBy,
      enabledAt: enabled ? new Date() : undefined,
      reason,
    };

    this.permissions.set(key, permission);
    this.saveData();

    return permission;
  }

  /**
   * Obter todos os planos disponíveis
   */
  getAvailablePlans(): Plan[] {
    return Array.from(this.plans.values()).filter(p => p.isActive);
  }

  /**
   * Obter assinatura de uma empresa
   */
  getSubscription(companyId: string): Subscription | undefined {
    return this.subscriptions.get(companyId);
  }

  /**
   * Inicializar planos padrão
   */
  private initializeDefaultPlans() {
    if (this.plans.size > 0) return;

    const plans: Plan[] = [
      {
        id: 'plan_basic',
        name: 'Básico',
        modules: ['timeclock'],
        maxEmployees: 10,
        features: {
          timeclock: {
            biometric: false,
            reports: true,
            integrations: false,
          },
        },
        price: 99.90,
        interval: 'monthly',
        isActive: true,
      },
      {
        id: 'plan_professional',
        name: 'Profissional',
        modules: ['timeclock', 'caderno'],
        maxEmployees: 50,
        features: {
          timeclock: {
            biometric: true,
            reports: true,
            integrations: true,
          },
        },
        price: 299.90,
        interval: 'monthly',
        isActive: true,
      },
      {
        id: 'plan_enterprise',
        name: 'Enterprise',
        modules: ['timeclock', 'caderno', 'caixa'],
        maxEmployees: -1, // Ilimitado
        features: {
          timeclock: {
            biometric: true,
            reports: true,
            integrations: true,
            api: true,
          },
        },
        price: 999.90,
        interval: 'monthly',
        isActive: true,
      },
    ];

    plans.forEach(plan => {
      this.plans.set(plan.id, plan);
    });

    this.saveData();
  }

  private saveData() {
    try {
      const subscriptionsData = Array.from(this.subscriptions.entries()).map(([id, sub]) => ({
        ...sub,
        startDate: sub.startDate.toISOString(),
        endDate: sub.endDate.toISOString(),
        createdAt: sub.createdAt.toISOString(),
        updatedAt: sub.updatedAt.toISOString(),
      }));
      localStorage.setItem('subscriptions', JSON.stringify(subscriptionsData));

      const plansData = Array.from(this.plans.values());
      localStorage.setItem('plans', JSON.stringify(plansData));

      const permissionsData = Array.from(this.permissions.values()).map(p => ({
        ...p,
        enabledAt: p.enabledAt?.toISOString(),
      }));
      localStorage.setItem('module_permissions', JSON.stringify(permissionsData));
    } catch (error) {
      console.error('Erro ao salvar dados de assinatura:', error);
    }
  }

  private loadData() {
    try {
      const subscriptionsData = localStorage.getItem('subscriptions');
      if (subscriptionsData) {
        const data = JSON.parse(subscriptionsData);
        data.forEach((sub: any) => {
          this.subscriptions.set(sub.companyId, {
            ...sub,
            startDate: new Date(sub.startDate),
            endDate: new Date(sub.endDate),
            createdAt: new Date(sub.createdAt),
            updatedAt: new Date(sub.updatedAt),
          });
        });
      }

      const plansData = localStorage.getItem('plans');
      if (plansData) {
        const data = JSON.parse(plansData);
        data.forEach((plan: Plan) => {
          this.plans.set(plan.id, plan);
        });
      }

      const permissionsData = localStorage.getItem('module_permissions');
      if (permissionsData) {
        const data = JSON.parse(permissionsData);
        data.forEach((p: any) => {
          const key = `${p.companyId}_${p.module}`;
          this.permissions.set(key, {
            ...p,
            enabledAt: p.enabledAt ? new Date(p.enabledAt) : undefined,
          });
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados de assinatura:', error);
    }
  }
}

export const subscriptionService = new SubscriptionService();
