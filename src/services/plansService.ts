export type PlanRecord = {
  id: string;
  name: string;
  priceCents: number;
  interval: 'monthly' | 'yearly';
  features?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  isRecommended?: boolean;
  description?: string;
  maxUsers?: number;
  featuresList?: string[];
};

const STORAGE_KEY = 'ploutos_plans';

function loadFromStorage(): PlanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultPlans();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Validar que cada plano tem as propriedades necessárias
      const validPlans = parsed.filter((p: any) => p && p.id && p.name && typeof p.priceCents === 'number');
      if (validPlans.length === 0) return defaultPlans();
      return validPlans as PlanRecord[];
    }
    return defaultPlans();
  } catch {
    return defaultPlans();
  }
}

function defaultPlans(): PlanRecord[] {
  return [
    { 
      id: 'p1', 
      name: 'Basic', 
      priceCents: 999, 
      interval: 'monthly', 
      features: 'Até 1 usuário', 
      description: 'Plano essencial para freelancers e pequenos negócios',
      maxUsers: 1,
      featuresList: ['Até 1 usuário', 'Relatórios básicos', 'Suporte por email', 'Funcionalidades essenciais'],
      status: 'active', 
      createdAt: new Date().toISOString() 
    },
    { 
      id: 'p2', 
      name: 'Starter', 
      priceCents: 2999, 
      interval: 'monthly', 
      features: 'Até 3 usuários', 
      description: 'Plano ideal para pequenos negócios',
      maxUsers: 3,
      featuresList: ['Até 3 usuários', 'Relatórios básicos', 'Suporte por email', 'Integração básica'],
      status: 'active', 
      createdAt: new Date().toISOString() 
    },
    { 
      id: 'p3', 
      name: 'Pro', 
      priceCents: 9999, 
      interval: 'monthly', 
      features: 'Usuários ilimitados', 
      description: 'Plano completo para empresas em crescimento',
      maxUsers: -1,
      featuresList: ['Usuários ilimitados', 'Relatórios avançados', 'Suporte prioritário', 'Integrações API', 'Chat online'],
      isRecommended: true,
      status: 'active', 
      createdAt: new Date().toISOString() 
    },
  ];
}

type PlansListener = (plans: PlanRecord[]) => void;
const listeners = new Set<PlansListener>();

export const plansService = {
  getPlans(): PlanRecord[] {
    return loadFromStorage();
  },
  savePlans(plans: PlanRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    listeners.forEach(l => l(plans));
  },
  subscribe(listener: PlansListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setRecommendedPlan(planId: string) {
    const plans = this.getPlans();
    const updatedPlans = plans.map(plan => ({
      ...plan,
      isRecommended: plan.id === planId
    }));
    this.savePlans(updatedPlans);
  },
  getRecommendedPlan(): PlanRecord | null {
    const plans = this.getPlans();
    return plans.find(plan => plan.isRecommended) || null;
  }
};

export default plansService;


