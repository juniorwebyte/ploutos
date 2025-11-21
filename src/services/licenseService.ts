// Serviço de Licenças com IA e Sincronização Avançada
export interface License {
  id: string;
  userId: string;
  username: string;
  email: string;
  key: string;
  status: 'active' | 'expired' | 'suspended' | 'pending';
  planId: string;
  planName: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsed: Date;
  usageCount: number;
  maxUsage: number;
  features: string[];
  metadata: Record<string, any>;
}

export interface LicenseAnalytics {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  suspendedLicenses: number;
  pendingLicenses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageUsage: number;
  topPlans: Array<{ planName: string; count: number }>;
  usageTrends: Array<{ date: string; usage: number }>;
}

class LicenseService {
  private licenses: License[] = [];
  private analytics: LicenseAnalytics | null = null;

  constructor() {
    // Inicializar como array vazio
    this.licenses = [];
    this.loadLicenses();
  }

  private loadLicenses() {
    try {
      const stored = localStorage.getItem('ploutos_licenses');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Garantir que é um array
        if (!Array.isArray(parsed)) {
          this.licenses = [];
          this.generateDefaultLicenses();
          return;
        }
        
        this.licenses = parsed.map((l: any) => {
          // Função auxiliar para converter datas com segurança
          const safeDate = (dateValue: any, fallback: Date = new Date()): Date => {
            if (!dateValue) return fallback;
            try {
              const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
              return isNaN(date.getTime()) ? fallback : date;
            } catch {
              return fallback;
            }
          };
          
          return {
            ...l,
            createdAt: safeDate(l.createdAt, new Date()),
            expiresAt: safeDate(l.expiresAt, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
            lastUsed: safeDate(l.lastUsed, new Date()),
            validUntil: safeDate(l.validUntil || l.expiresAt, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
            features: Array.isArray(l.features) ? l.features : []
          };
        });
        
        // Garantir que ainda é um array após o map
        if (!Array.isArray(this.licenses)) {
          this.licenses = [];
          this.generateDefaultLicenses();
        }
      } else {
        this.generateDefaultLicenses();
      }
    } catch (error) {
      this.licenses = [];
      this.generateDefaultLicenses();
    }
  }

  private generateDefaultLicenses() {
    this.licenses = [
      {
        id: 'lic_1',
        userId: 'user_1',
        username: 'Admin',
        email: 'admin@sistema.com',
        key: 'PLOUTOS-ADMIN-2025',
        status: 'active',
        planId: 'p3',
        planName: 'Pro',
        createdAt: new Date('2025-01-01'),
        expiresAt: new Date('2026-01-01'),
        lastUsed: new Date(),
        usageCount: 150,
        maxUsage: -1,
        features: ['usuarios_ilimitados', 'relatorios_avancados', 'suporte_prioritario', 'chat_online'],
        metadata: { source: 'admin', priority: 'high' }
      },
      {
        id: 'lic_2',
        userId: 'user_2',
        username: 'Demo',
        email: 'demo@sistema.com',
        key: 'PLOUTOS-DEMO-2025',
        status: 'active',
        planId: 'p1',
        planName: 'Basic',
        createdAt: new Date('2025-01-15'),
        expiresAt: new Date('2025-07-15'),
        lastUsed: new Date(Date.now() - 86400000),
        usageCount: 25,
        maxUsage: 100,
        features: ['1_usuario', 'relatorios_basicos', 'suporte_email'],
        metadata: { source: 'demo', priority: 'medium' }
      }
    ];
    this.saveLicenses();
  }

  private saveLicenses() {
    localStorage.setItem('ploutos_licenses', JSON.stringify(this.licenses));
    this.updateAnalytics();
  }

  private updateAnalytics() {
    // Garantir que licenses é um array válido
    if (!Array.isArray(this.licenses)) {
      this.licenses = [];
    }
    
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const licensesArray = this.licenses || [];
    
    this.analytics = {
      totalLicenses: licensesArray.length,
      activeLicenses: licensesArray.filter(l => l && l.status === 'active').length,
      expiredLicenses: licensesArray.filter(l => l && l.status === 'expired').length,
      suspendedLicenses: licensesArray.filter(l => l && l.status === 'suspended').length,
      pendingLicenses: licensesArray.filter(l => l && l.status === 'pending').length,
      totalRevenue: licensesArray.reduce((sum, l) => {
        if (!l || !l.planId) return sum;
        const planPrices = { p1: 999, p2: 2999, p3: 9999 };
        return sum + (planPrices[l.planId as keyof typeof planPrices] || 0);
      }, 0),
      monthlyRevenue: licensesArray
        .filter(l => {
          if (!l || !l.createdAt) return false;
          try {
            const createdAt = l.createdAt instanceof Date ? l.createdAt : new Date(l.createdAt);
            return !isNaN(createdAt.getTime()) && createdAt >= thisMonth && l.status === 'active';
          } catch {
            return false;
          }
        })
        .reduce((sum, l) => {
          if (!l || !l.planId) return sum;
          const planPrices = { p1: 999, p2: 2999, p3: 9999 };
          return sum + (planPrices[l.planId as keyof typeof planPrices] || 0);
        }, 0),
      averageUsage: licensesArray.length > 0 
        ? licensesArray.reduce((sum, l) => sum + (l?.usageCount || 0), 0) / licensesArray.length 
        : 0,
      topPlans: this.getTopPlans(),
      usageTrends: this.getUsageTrends()
    };
  }

  private getTopPlans() {
    const licensesArray = Array.isArray(this.licenses) ? this.licenses : [];
    const planCounts = licensesArray.reduce((acc, l) => {
      if (l && l.planName) {
        acc[l.planName] = (acc[l.planName] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(planCounts)
      .map(([planName, count]) => ({ planName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private getUsageTrends() {
    const licensesArray = Array.isArray(this.licenses) ? this.licenses : [];
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => ({
      date,
      usage: licensesArray.filter(l => {
        try {
          if (!l || !l.lastUsed) return false;
          const lastUsed = l.lastUsed instanceof Date ? l.lastUsed : new Date(l.lastUsed);
          return !isNaN(lastUsed.getTime()) && lastUsed.toISOString().split('T')[0] === date;
        } catch {
          return false;
        }
      }).length
    }));
  }

  // Métodos públicos
  getAllLicenses(): License[] {
    // Garantir que sempre retorna um array válido
    if (!Array.isArray(this.licenses)) {
      // Licenças não é um array - inicializando
      this.licenses = [];
      this.saveLicenses();
    }
    return [...(this.licenses || [])];
  }

  getLicenseById(id: string): License | null {
    if (!Array.isArray(this.licenses)) {
      this.licenses = [];
    }
    return this.licenses.find(l => l && l.id === id) || null;
  }

  getLicenseByKey(key: string): License | null {
    if (!Array.isArray(this.licenses)) {
      this.licenses = [];
    }
    return this.licenses.find(l => l && l.key === key) || null;
  }

  getAnalytics(): LicenseAnalytics {
    // Garantir que licenses é um array antes de calcular analytics
    if (!Array.isArray(this.licenses)) {
      this.licenses = [];
    }
    if (!this.analytics) {
      this.updateAnalytics();
    }
    return this.analytics!;
  }

  createLicense(licenseData: Partial<License>): License {
    if (!Array.isArray(this.licenses)) {
      this.licenses = [];
    }
    
    const newLicense: License = {
      id: `lic_${Date.now()}`,
      userId: licenseData.userId || '',
      username: licenseData.username || '',
      email: licenseData.email || '',
      key: this.generateLicenseKey(),
      status: 'pending',
      planId: licenseData.planId || 'p1',
      planName: licenseData.planName || 'Basic',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
      lastUsed: new Date(),
      usageCount: 0,
      maxUsage: licenseData.maxUsage || 100,
      features: licenseData.features || [],
      metadata: licenseData.metadata || {}
    };

    this.licenses.push(newLicense);
    this.saveLicenses();
    return newLicense;
  }

  updateLicense(id: string, updates: Partial<License>): License | null {
    if (!Array.isArray(this.licenses)) {
      this.licenses = [];
    }
    
    const index = this.licenses.findIndex(l => l && l.id === id);
    
    if (index === -1) {
      return null;
    }

    this.licenses[index] = { ...this.licenses[index], ...updates };
    this.saveLicenses();
    
    return this.licenses[index];
  }

  deleteLicense(id: string): boolean {
    if (!Array.isArray(this.licenses)) {
      this.licenses = [];
    }
    
    const index = this.licenses.findIndex(l => l && l.id === id);
    if (index === -1) return false;

    this.licenses.splice(index, 1);
    this.saveLicenses();
    return true;
  }

  validateLicense(key: string): { valid: boolean; license?: License; reason?: string } {
    const license = this.getLicenseByKey(key);
    
    if (!license) {
      return { valid: false, reason: 'Licença não encontrada' };
    }

    if (license.status === 'expired') {
      return { valid: false, reason: 'Licença expirada' };
    }

    if (license.status === 'suspended') {
      return { valid: false, reason: 'Licença suspensa' };
    }

    if (license.maxUsage !== -1 && license.usageCount >= license.maxUsage) {
      return { valid: false, reason: 'Limite de uso atingido' };
    }

    if (license.expiresAt < new Date()) {
      this.updateLicense(license.id, { status: 'expired' });
      return { valid: false, reason: 'Licença expirada' };
    }

    // Atualizar uso
    this.updateLicense(license.id, { 
      usageCount: license.usageCount + 1,
      lastUsed: new Date()
    });

    return { valid: true, license };
  }

  private generateLicenseKey(): string {
    const prefix = 'PLOUTOS';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // Sincronização com pagamentos
  syncWithPayment(paymentData: any): License | null {
    if (!Array.isArray(this.licenses)) {
      this.licenses = [];
    }
    
    const { userId, username, email, planId, planName } = paymentData;
    
    // Verificar se já existe licença para este usuário
    const existingLicense = this.licenses.find(l => l && l.userId === userId);
    
    if (existingLicense) {
      // Atualizar licença existente
      return this.updateLicense(existingLicense.id, {
        status: 'active',
        planId,
        planName,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        features: this.getPlanFeatures(planId)
      });
    } else {
      // Criar nova licença
      return this.createLicense({
        userId,
        username,
        email,
        planId,
        planName,
        status: 'active',
        features: this.getPlanFeatures(planId)
      });
    }
  }

  private getPlanFeatures(planId: string): string[] {
    const features = {
      p1: ['1_usuario', 'relatorios_basicos', 'suporte_email'],
      p2: ['3_usuarios', 'relatorios_basicos', 'suporte_email', 'integracao_basica'],
      p3: ['usuarios_ilimitados', 'relatorios_avancados', 'suporte_prioritario', 'chat_online', 'integracao_api']
    };
    return features[planId as keyof typeof features] || features.p1;
  }

  // Verificar acesso do usuário
  async ensureAccess(user: any): Promise<License | null> {
    if (!user || !user.id) {
      return null;
    }

    if (!Array.isArray(this.licenses)) {
      this.licenses = [];
    }

    // Buscar licença do usuário
    const license = this.licenses.find(l => l && (l.userId === user.id || l.email === user.email));
    
    if (!license) {
      // Se não tem licença, criar uma básica
      return this.createLicense({
        userId: user.id,
        username: user.name || user.username || 'Usuário',
        email: user.email || '',
        planId: 'p1',
        planName: 'Basic',
        status: 'active',
        features: this.getPlanFeatures('p1')
      });
    }

    // Validar licença
    const validation = this.validateLicense(license.key);
    if (!validation.valid) {
      return null;
    }

    return license;
  }

  // IA para análise de licenças
  analyzeLicenseUsage(): string[] {
    // Garantir que licenses é um array
    if (!Array.isArray(this.licenses)) {
      this.licenses = [];
    }
    
    const analytics = this.getAnalytics();
    const insights: string[] = [];

    if (analytics.expiredLicenses > analytics.activeLicenses * 0.3) {
      insights.push('Alto número de licenças expiradas. Considere implementar lembretes de renovação.');
    }

    if (analytics.averageUsage < 10) {
      insights.push('Baixo uso das licenças. Considere oferecer treinamento ou suporte adicional.');
    }

    if (analytics.monthlyRevenue < analytics.totalRevenue * 0.1) {
      insights.push('Receita mensal baixa. Considere campanhas de marketing ou promoções.');
    }

    const topPlan = analytics.topPlans[0];
    if (topPlan && topPlan.planName === 'Basic') {
      insights.push('Maioria dos usuários no plano Basic. Considere estratégias de upsell.');
    }

    return insights;
  }
}

export const licenseService = new LicenseService();
export default licenseService;