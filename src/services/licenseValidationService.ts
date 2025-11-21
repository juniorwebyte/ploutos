// Serviço Centralizado de Validação de Licenças
// Todas as validações passam por aqui e são registradas no painel do super admin

interface LicenseValidationLog {
  id: string;
  licenseKey: string;
  username?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  valid: boolean;
  reason?: string;
  validatedAt: string;
  source: 'landing_page' | 'client_dashboard' | 'api';
  licenseData?: any;
}

class LicenseValidationService {
  private validationLogs: LicenseValidationLog[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem('ploutos_license_validations');
      if (stored) {
        this.validationLogs = JSON.parse(stored);
      }
    } catch (error) {
      // Erro ao carregar logs - usar array vazio
      this.validationLogs = [];
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem('ploutos_license_validations', JSON.stringify(this.validationLogs));
      // Disparar evento para atualizar o painel do super admin
      window.dispatchEvent(new CustomEvent('licenseValidation', {
        detail: this.validationLogs[this.validationLogs.length - 1]
      }));
    } catch (error) {
      // Erro ao salvar logs - não crítico
    }
  }

  // Validar licença de forma centralizada
  validateLicense(licenseKey: string, source: 'landing_page' | 'client_dashboard' | 'api' = 'api', userInfo?: { username?: string; email?: string }): {
    valid: boolean;
    license?: any;
    reason?: string;
    message?: string;
  } {
    if (!licenseKey || licenseKey.trim().length < 6) {
      this.logValidation(licenseKey, false, 'Chave muito curta', source, userInfo);
      return { valid: false, reason: 'Chave muito curta', message: 'A chave de licença deve ter pelo menos 6 caracteres.' };
    }

    // Normalizar a chave de entrada (remover espaços, converter para maiúsculas, normalizar underscores)
    // Aceitar tanto com quanto sem underscores na comparação
    const normalizedKey = licenseKey.trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
    
    // Validando chave de licença
    
    // Carregar todas as licenças
    const licenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
    let license = licenses.find((l: any) => {
      if (!l || !l.key) return false;
      // Normalizar removendo underscores e espaços para comparação
      const normalizedLicenseKey = String(l.key).trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
      return normalizedLicenseKey === normalizedKey;
    });

    // Verificando licenças

    // Se não encontrou licença, verificar se é uma chave aprovada pendente de ativação
    if (!license) {
      const approvedKeys = JSON.parse(localStorage.getItem('approved_license_keys') || '[]');
      // Buscar chave aprovada - comparar de forma mais flexível (ignorar underscores)
      const approvedKey = approvedKeys.find((k: any) => {
        if (!k || !k.licenseKey) return false;
        // Normalizar removendo underscores e espaços para comparação
        const normalizedApprovedKey = String(k.licenseKey).trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
        const matches = normalizedApprovedKey === normalizedKey;
        return matches && k.status === 'pending_activation';
      });

      if (approvedKey) {
        
        // Esta é uma chave aprovada que precisa ser ativada - criar a licença agora
        const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
        const currentUser = userInfo?.username || '';
        
        // Tentar encontrar o usuário pelo username da chave aprovada
        let user = null;
        if (approvedKey.username) {
          user = storedUsers.find((u: any) => 
            u.username === approvedKey.username ||
            u.id === approvedKey.username ||
            (u.email && u.email === approvedKey.email)
          );
        }
        
        // Se não encontrou pelo username da chave, tentar pelo currentUser
        if (!user && currentUser) {
          user = storedUsers.find((u: any) => 
            u.username === currentUser || 
            u.email === userInfo?.email
          );
        }

        // Criar licença mesmo sem usuário encontrado (será associado depois no login)
        const expiresAt = approvedKey.expiresAt ? new Date(approvedKey.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        
        const newLicense = {
          id: `license_${user?.id || approvedKey.username || Date.now()}`,
          userId: user?.id || approvedKey.username || `user_${Date.now()}`,
          username: approvedKey.username || currentUser || 'Usuário',
          email: user?.email || userInfo?.email || approvedKey.email || '',
          key: normalizedKey,
          status: 'trial' as const,
          planId: 'trial',
          planName: 'Trial 30 Dias',
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          validUntil: expiresAt.toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 0,
          maxUsage: -1,
          trialDays: 30,
          trialStart: new Date().toISOString(),
          features: ['cashflow'],
          metadata: { source: 'trial', approvedAt: approvedKey.approvedAt, approvedBy: approvedKey.approvedBy }
        };

        // Adicionar licença
        licenses.push(newLicense);
        localStorage.setItem('ploutos_licenses', JSON.stringify(licenses));

        // Atualizar status da chave aprovada para 'activated'
        const updatedApprovedKeys = approvedKeys.map((k: any) => {
          if (!k || !k.licenseKey) return k;
          // Normalizar para comparação (remover underscores)
          const normalizedK = String(k.licenseKey).trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
          return normalizedK === normalizedKey
            ? { ...k, status: 'activated', activatedAt: new Date().toISOString() }
            : k;
        });
        localStorage.setItem('approved_license_keys', JSON.stringify(updatedApprovedKeys));

        license = newLicense;
        // Licença criada e ativada a partir de chave aprovada
      } else {
        // Verificar se a chave existe mas com status diferente
        const existingApprovedKey = approvedKeys.find((k: any) => {
          if (!k || !k.licenseKey) return false;
          // Normalizar para comparação (remover underscores)
          const normalizedK = String(k.licenseKey).trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
          return normalizedK === normalizedKey;
        });
        
        if (existingApprovedKey) {
          if (existingApprovedKey.status === 'activated') {
            this.logValidation(licenseKey, false, 'Chave já foi ativada', source, userInfo);
            return { valid: false, reason: 'Chave já ativada', message: 'Esta chave já foi ativada anteriormente. Faça login para acessar o sistema.' };
          } else {
            this.logValidation(licenseKey, false, 'Chave com status inválido', source, userInfo);
            return { valid: false, reason: 'Status inválido', message: `Esta chave está com status: ${existingApprovedKey.status}. Entre em contato com o suporte.` };
          }
        }
        
        this.logValidation(licenseKey, false, 'Licença não encontrada', source, userInfo);
        return { valid: false, reason: 'Licença não encontrada', message: 'Esta chave de licença não foi encontrada no sistema. Verifique se a chave foi copiada corretamente.' };
      }
    }

    // Verificar status
    if (license.status === 'expired' || license.status === 'suspended') {
      this.logValidation(licenseKey, false, `Licença ${license.status}`, source, userInfo, license);
      return { valid: false, reason: `Licença ${license.status}`, message: `Esta licença está ${license.status === 'expired' ? 'expirada' : 'suspensa'}.` };
    }

    // Verificar validade
    if (license.validUntil) {
      const validUntil = new Date(license.validUntil);
      if (validUntil < new Date()) {
        // Atualizar status para expirado
        const updatedLicenses = licenses.map((l: any) =>
          l.id === license.id ? { ...l, status: 'expired' } : l
        );
        localStorage.setItem('ploutos_licenses', JSON.stringify(updatedLicenses));
        
        this.logValidation(licenseKey, false, 'Licença expirada', source, userInfo, license);
        return { valid: false, reason: 'Licença expirada', message: 'Esta licença expirou. Entre em contato com o suporte.' };
      }
    }

    // Licença válida - atualizar uso
    const updatedLicenses = licenses.map((l: any) =>
      l.id === license.id
        ? {
            ...l,
            lastUsed: new Date().toISOString(),
            usageCount: (l.usageCount || 0) + 1
          }
        : l
    );
    localStorage.setItem('ploutos_licenses', JSON.stringify(updatedLicenses));

    this.logValidation(licenseKey, true, 'Licença válida', source, userInfo, { ...license, lastUsed: new Date().toISOString() });
    
    return {
      valid: true,
      license: { ...license, lastUsed: new Date().toISOString() },
      message: 'Licença válida! Acesso liberado.'
    };
  }

  // Registrar validação no log
  private logValidation(
    licenseKey: string,
    valid: boolean,
    reason: string,
    source: 'landing_page' | 'client_dashboard' | 'api',
    userInfo?: { username?: string; email?: string },
    licenseData?: any
  ) {
    const log: LicenseValidationLog = {
      id: `val_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      licenseKey: licenseKey.trim().toUpperCase(),
      username: userInfo?.username,
      email: userInfo?.email,
      ip: 'client-side', // Será obtido pelo backend em produção
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      valid,
      reason,
      validatedAt: new Date().toISOString(),
      source,
      licenseData
    };

    this.validationLogs.push(log);
    
    // Manter apenas os últimos 1000 logs
    if (this.validationLogs.length > 1000) {
      this.validationLogs = this.validationLogs.slice(-1000);
    }

    this.saveLogs();
  }

  // Obter todos os logs de validação
  getValidationLogs(): LicenseValidationLog[] {
    return [...this.validationLogs].reverse(); // Mais recentes primeiro
  }

  // Obter logs de validação por licença
  getLogsByLicense(licenseKey: string): LicenseValidationLog[] {
    return this.validationLogs
      .filter(log => log.licenseKey === licenseKey.trim().toUpperCase())
      .reverse();
  }

  // Obter estatísticas de validação
  getValidationStats() {
    const total = this.validationLogs.length;
    const valid = this.validationLogs.filter(log => log.valid).length;
    const invalid = total - valid;
    const bySource = {
      landing_page: this.validationLogs.filter(log => log.source === 'landing_page').length,
      client_dashboard: this.validationLogs.filter(log => log.source === 'client_dashboard').length,
      api: this.validationLogs.filter(log => log.source === 'api').length
    };

    return {
      total,
      valid,
      invalid,
      bySource,
      successRate: total > 0 ? (valid / total) * 100 : 0
    };
  }

  // Limpar logs antigos (mais de 30 dias)
  cleanOldLogs() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.validationLogs = this.validationLogs.filter(log => 
      new Date(log.validatedAt) > thirtyDaysAgo
    );
    
    this.saveLogs();
  }
}

const licenseValidationService = new LicenseValidationService();

// Limpar logs antigos a cada hora
if (typeof window !== 'undefined') {
  setInterval(() => {
    licenseValidationService.cleanOldLogs();
  }, 60 * 60 * 1000);
}

export default licenseValidationService;

