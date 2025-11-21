export interface BackupData {
  id: string;
  timestamp: Date;
  date: string; // YYYY-MM-DD
  type: 'daily' | 'manual' | 'closing';
  data: {
    entries: any;
    exits: any;
    cancelamentos: any[];
    total: number;
    totalEntradas: number;
    totalSaidas: number;
    fundoCaixa: number;
    dailyGoal: number;
  };
  metadata?: {
    version: string;
    user?: string;
    notes?: string;
  };
}

class CashFlowBackupService {
  private readonly BACKUP_KEY = 'cashflow_backups';
  private readonly MAX_BACKUPS = 90; // Manter últimos 90 dias
  private readonly VERSION_KEY = 'cashflow_version';

  // Criar backup
  createBackup(
    data: BackupData['data'],
    type: BackupData['type'] = 'daily',
    metadata?: BackupData['metadata']
  ): BackupData {
    const backup: BackupData = {
      id: `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      date: new Date().toISOString().split('T')[0],
      type,
      data: {
        ...data,
        entries: JSON.parse(JSON.stringify(data.entries)),
        exits: JSON.parse(JSON.stringify(data.exits)),
        cancelamentos: JSON.parse(JSON.stringify(data.cancelamentos || []))
      },
      metadata: {
        version: this.getCurrentVersion(),
        ...metadata
      }
    };

    this.saveBackup(backup);
    return backup;
  }

  // Salvar backup
  private saveBackup(backup: BackupData): void {
    const backups = this.getAllBackups();
    backups.unshift(backup); // Adicionar no início

    // Manter apenas últimos MAX_BACKUPS
    if (backups.length > this.MAX_BACKUPS) {
      backups.splice(this.MAX_BACKUPS);
    }

    // Agrupar por data e manter apenas o último de cada dia para backups diários
    if (backup.type === 'daily') {
      const dailyBackups = backups.filter(b => b.type === 'daily');
      const groupedByDate = new Map<string, BackupData[]>();
      
      dailyBackups.forEach(b => {
        if (!groupedByDate.has(b.date)) {
          groupedByDate.set(b.date, []);
        }
        groupedByDate.get(b.date)!.push(b);
      });

      // Manter apenas o último backup de cada dia
      const filteredBackups = backups.filter(b => {
        if (b.type !== 'daily') return true;
        const dayBackups = groupedByDate.get(b.date) || [];
        return dayBackups[0]?.id === b.id;
      });

      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(filteredBackups));
    } else {
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backups));
    }
  }

  // Obter todos os backups
  getAllBackups(): BackupData[] {
    try {
      const stored = localStorage.getItem(this.BACKUP_KEY);
      if (!stored) return [];
      
      const backups = JSON.parse(stored);
      return backups.map((b: any) => ({
        ...b,
        timestamp: new Date(b.timestamp)
      }));
    } catch (error) {
      // Erro ao carregar backups - retornar array vazio
      return [];
    }
  }

  // Obter backups por tipo
  getBackupsByType(type: BackupData['type']): BackupData[] {
    return this.getAllBackups().filter(b => b.type === type);
  }

  // Obter backups por data
  getBackupsByDate(date: string): BackupData[] {
    return this.getAllBackups().filter(b => b.date === date);
  }

  // Obter último backup
  getLastBackup(type?: BackupData['type']): BackupData | null {
    const backups = type 
      ? this.getBackupsByType(type)
      : this.getAllBackups();
    
    return backups.length > 0 ? backups[0] : null;
  }

  // Restaurar backup
  restoreBackup(backupId: string): BackupData | null {
    const backups = this.getAllBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) return null;

    // Criar backup do estado atual antes de restaurar
    const currentData = localStorage.getItem('cashFlowData');
    if (currentData) {
      try {
        const parsed = JSON.parse(currentData);
        this.createBackup({
          entries: parsed.entries || {},
          exits: parsed.exits || {},
          cancelamentos: parsed.cancelamentos || [],
          total: parsed.total || 0,
          totalEntradas: parsed.totalEntradas || 0,
          totalSaidas: parsed.totalSaidas || 0,
          fundoCaixa: parsed.fundoCaixa || 400,
          dailyGoal: parsed.dailyGoal || 5000
        }, 'manual', { notes: 'Backup antes de restauração' });
      } catch (error) {
        // Erro ao criar backup - continuar mesmo assim
      }
    }

    // Restaurar dados
    localStorage.setItem('cashFlowData', JSON.stringify({
      entries: backup.data.entries,
      exits: backup.data.exits,
      cancelamentos: backup.data.cancelamentos,
      total: backup.data.total,
      totalEntradas: backup.data.totalEntradas,
      totalSaidas: backup.data.totalSaidas,
      fundoCaixa: backup.data.fundoCaixa,
      dailyGoal: backup.data.dailyGoal
    }));

    return backup;
  }

  // Deletar backup
  deleteBackup(backupId: string): boolean {
    const backups = this.getAllBackups();
    const filtered = backups.filter(b => b.id !== backupId);
    
    if (filtered.length === backups.length) return false;
    
    localStorage.setItem(this.BACKUP_KEY, JSON.stringify(filtered));
    return true;
  }

  // Limpar backups antigos (mais de MAX_BACKUPS dias)
  cleanOldBackups(): number {
    const backups = this.getAllBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.MAX_BACKUPS);
    
    const filtered = backups.filter(b => {
      const backupDate = new Date(b.date);
      return backupDate >= cutoffDate;
    });
    
    const removed = backups.length - filtered.length;
    localStorage.setItem(this.BACKUP_KEY, JSON.stringify(filtered));
    
    return removed;
  }

  // Versionamento
  getCurrentVersion(): string {
    const stored = localStorage.getItem(this.VERSION_KEY);
    if (stored) return stored;
    
    const version = '1.0.0';
    localStorage.setItem(this.VERSION_KEY, version);
    return version;
  }

  incrementVersion(): string {
    const current = this.getCurrentVersion();
    const parts = current.split('.').map(Number);
    parts[2]++; // Incrementar patch version
    
    const newVersion = parts.join('.');
    localStorage.setItem(this.VERSION_KEY, newVersion);
    return newVersion;
  }

  // Exportar backup
  exportBackup(backupId: string): string | null {
    const backups = this.getAllBackups();
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) return null;
    
    return JSON.stringify(backup, null, 2);
  }

  // Importar backup
  importBackup(jsonString: string): BackupData | null {
    try {
      const backup = JSON.parse(jsonString) as BackupData;
      
      // Validar estrutura
      if (!backup.id || !backup.timestamp || !backup.data) {
        throw new Error('Estrutura de backup inválida');
      }
      
      this.saveBackup(backup);
      return backup;
    } catch (error) {
      // Erro ao importar backup
      return null;
    }
  }
}

export const cashFlowBackupService = new CashFlowBackupService();

