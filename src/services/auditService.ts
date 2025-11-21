// Sistema de Logs e Auditoria
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'nota_fiscal' | 'parcela' | 'pagamento' | 'usuario' | 'sistema';
  entityId: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: string;
}

class AuditService {
  private logs: AuditLog[] = [];

  constructor() {
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const savedLogs = localStorage.getItem('ploutos_audit_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      // Erro ao carregar logs - retornar array vazio
    }
  }

  private saveLogs() {
    localStorage.setItem('ploutos_audit_logs', JSON.stringify(this.logs));
  }

  // Registrar ação
  logAction(
    userId: string,
    userName: string,
    action: string,
    entityType: AuditLog['entityType'],
    entityId: string,
    oldValue?: any,
    newValue?: any,
    details?: string
  ) {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      timestamp: new Date(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      details
    };

    this.logs.unshift(log);
    
    // Manter apenas os últimos 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(0, 1000);
    }

    this.saveLogs();
    
    // Log registrado no sistema de auditoria
  }

  private getClientIP(): string {
    // Simulação de IP - em produção seria obtido do servidor
    return '192.168.1.1';
  }

  // Obter logs
  getLogs(filters?: {
    userId?: string;
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): AuditLog[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.entityType) {
        filteredLogs = filteredLogs.filter(log => log.entityType === filters.entityType);
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action!));
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return filteredLogs;
  }

  // Obter estatísticas
  getStats() {
    const totalLogs = this.logs.length;
    const todayLogs = this.logs.filter(log => {
      const today = new Date();
      const logDate = new Date(log.timestamp);
      return logDate.toDateString() === today.toDateString();
    }).length;

    const actionStats = this.logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const entityStats = this.logs.reduce((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userStats = this.logs.reduce((acc, log) => {
      acc[log.userName] = (acc[log.userName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs,
      todayLogs,
      actionStats,
      entityStats,
      userStats
    };
  }

  // Limpar logs antigos
  clearOldLogs(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    this.saveLogs();
  }

  // Exportar logs
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['ID', 'Usuário', 'Ação', 'Tipo', 'Entidade ID', 'Data', 'Detalhes'];
      const csvContent = [
        headers.join(','),
        ...this.logs.map(log => [
          log.id,
          log.userName,
          log.action,
          log.entityType,
          log.entityId,
          log.timestamp.toISOString(),
          log.details || ''
        ].join(','))
      ].join('\n');
      
      return csvContent;
    }
    
    return JSON.stringify(this.logs, null, 2);
  }
}

export const auditService = new AuditService();
export default auditService;
