// Serviço de Backup Automático - PDV
export interface BackupConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:mm
  lastBackup?: string;
  autoBackup: boolean;
}

export interface BackupData {
  id: string;
  timestamp: string;
  type: 'manual' | 'automatic';
  data: {
    products: any[];
    sales: any[];
    customers: any[];
    suppliers: any[];
    stores: any[];
    commissions: any[];
    [key: string]: any;
  };
  size: number; // em bytes
}

class BackupService {
  private readonly CONFIG_KEY = 'pdv_backup_config';
  private readonly BACKUPS_KEY = 'pdv_backups';
  private backupInterval: NodeJS.Timeout | null = null;

  // Obter configuração
  getConfig(): BackupConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    
    return {
      enabled: false,
      frequency: 'daily',
      time: '02:00',
      autoBackup: false
    };
  }

  // Salvar configuração
  saveConfig(config: BackupConfig): void {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
    this.setupAutoBackup(config);
  }

  // Criar backup
  createBackup(type: 'manual' | 'automatic' = 'manual'): BackupData {
    const backupData: BackupData = {
      id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type,
      data: {
        products: JSON.parse(localStorage.getItem('pdv_products') || '[]'),
        sales: JSON.parse(localStorage.getItem('pdv_sales') || '[]'),
        customers: JSON.parse(localStorage.getItem('pdv_customers') || '[]'),
        suppliers: JSON.parse(localStorage.getItem('pdv_suppliers') || '[]'),
        stores: JSON.parse(localStorage.getItem('pdv_stores') || '[]'),
        commissions: JSON.parse(localStorage.getItem('pdv_commissions') || '[]'),
        users: JSON.parse(localStorage.getItem('pdv_users') || '[]'),
        sellers: JSON.parse(localStorage.getItem('pdv_sellers') || '[]'),
      },
      size: 0
    };

    const dataString = JSON.stringify(backupData.data);
    backupData.size = new Blob([dataString]).size;

    // Salvar backup
    const backups = this.getBackups();
    backups.unshift(backupData);
    
    // Manter apenas últimos 30 backups
    const limitedBackups = backups.slice(0, 30);
    localStorage.setItem(this.BACKUPS_KEY, JSON.stringify(limitedBackups));

    // Atualizar última data de backup na configuração
    const config = this.getConfig();
    config.lastBackup = new Date().toISOString();
    this.saveConfig(config);

    return backupData;
  }

  // Obter backups
  getBackups(): BackupData[] {
    try {
      const stored = localStorage.getItem(this.BACKUPS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Restaurar backup
  restoreBackup(backupId: string): boolean {
    try {
      const backups = this.getBackups();
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) return false;

      // Restaurar dados
      Object.entries(backup.data).forEach(([key, value]) => {
        const storageKey = `pdv_${key}`;
        localStorage.setItem(storageKey, JSON.stringify(value));
      });

      return true;
    } catch {
      return false;
    }
  }

  // Excluir backup
  deleteBackup(backupId: string): boolean {
    try {
      const backups = this.getBackups();
      const filtered = backups.filter(b => b.id !== backupId);
      localStorage.setItem(this.BACKUPS_KEY, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }

  // Download backup
  downloadBackup(backupId: string): void {
    const backups = this.getBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) return;

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_pdv_${backup.timestamp.split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Configurar backup automático
  private setupAutoBackup(config: BackupConfig): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }

    if (!config.enabled || !config.autoBackup) return;

    const [hours, minutes] = config.time.split(':').map(Number);
    const now = new Date();
    const nextBackup = new Date();
    nextBackup.setHours(hours, minutes, 0, 0);
    
    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }

    const msUntilBackup = nextBackup.getTime() - now.getTime();
    
    setTimeout(() => {
      this.createBackup('automatic');
      
      // Configurar intervalo baseado na frequência
      const intervalMs = config.frequency === 'daily' 
        ? 24 * 60 * 60 * 1000 
        : config.frequency === 'weekly'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
      
      this.backupInterval = setInterval(() => {
        this.createBackup('automatic');
      }, intervalMs);
    }, msUntilBackup);
  }

  // Iniciar backup automático
  startAutoBackup(): void {
    const config = this.getConfig();
    if (config.enabled && config.autoBackup) {
      this.setupAutoBackup(config);
    }
  }

  // Parar backup automático
  stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }
}

export const backupService = new BackupService();
