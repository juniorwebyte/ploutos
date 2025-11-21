interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'close' | 'clear';
  entityType: 'entry' | 'exit' | 'movement' | 'fechamento';
  entityId: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  details?: string;
  ipAddress?: string;
}

class CashFlowAuditService {
  private storageKey = 'cashflow_audit_logs';
  private maxLogs = 1000; // Manter últimos 1000 logs

  // Registrar uma ação de auditoria
  logAction(
    userId: string,
    userName: string,
    action: AuditLog['action'],
    entityType: AuditLog['entityType'],
    entityId: string,
    field?: string,
    oldValue?: any,
    newValue?: any,
    details?: string
  ): void {
    try {
      const logs = this.getLogs();
      const newLog: AuditLog = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        userId,
        userName,
        action,
        entityType,
        entityId,
        field,
        oldValue,
        newValue,
        details,
        ipAddress: this.getClientIP(),
      };

      logs.push(newLog);

      // Manter apenas os últimos maxLogs
      if (logs.length > this.maxLogs) {
        logs.splice(0, logs.length - this.maxLogs);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(logs));
    } catch (error) {
      // Erro ao registrar log - não crítico
    }
  }

  // Obter todos os logs
  getLogs(filters?: {
    userId?: string;
    entityType?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    field?: string;
  }): AuditLog[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      let logs: AuditLog[] = JSON.parse(stored);
      
      // Converter timestamps de string para Date
      logs = logs.map(log => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));

      // Aplicar filtros
      if (filters) {
        if (filters.userId) {
          logs = logs.filter(log => log.userId === filters.userId);
        }
        if (filters.entityType) {
          logs = logs.filter(log => log.entityType === filters.entityType);
        }
        if (filters.action) {
          logs = logs.filter(log => log.action === filters.action);
        }
        if (filters.startDate) {
          logs = logs.filter(log => log.timestamp >= filters.startDate!);
        }
        if (filters.endDate) {
          logs = logs.filter(log => log.timestamp <= filters.endDate!);
        }
        if (filters.field) {
          logs = logs.filter(log => log.field === filters.field);
        }
      }

      // Ordenar por timestamp (mais recente primeiro)
      return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      // Erro ao carregar logs - retornar array vazio
      return [];
    }
  }

  // Obter logs de uma entidade específica
  getEntityLogs(entityId: string): AuditLog[] {
    return this.getLogs().filter(log => log.entityId === entityId);
  }

  // Obter estatísticas de uso
  getUsageStats() {
    const logs = this.getLogs();
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: logs.length,
      last7Days: logs.filter(log => log.timestamp >= last7Days).length,
      last30Days: logs.filter(log => log.timestamp >= last30Days).length,
      byAction: {
        create: logs.filter(log => log.action === 'create').length,
        update: logs.filter(log => log.action === 'update').length,
        delete: logs.filter(log => log.action === 'delete').length,
        close: logs.filter(log => log.action === 'close').length,
        clear: logs.filter(log => log.action === 'clear').length,
      },
      byEntityType: {
        entry: logs.filter(log => log.entityType === 'entry').length,
        exit: logs.filter(log => log.entityType === 'exit').length,
        movement: logs.filter(log => log.entityType === 'movement').length,
        fechamento: logs.filter(log => log.entityType === 'fechamento').length,
      },
      byUser: this.getUserStats(logs),
    };
  }

  // Estatísticas por usuário
  private getUserStats(logs: AuditLog[]) {
    const userMap = new Map<string, { count: number; lastActivity: Date }>();
    
    logs.forEach(log => {
      const existing = userMap.get(log.userId);
      if (existing) {
        existing.count++;
        if (log.timestamp > existing.lastActivity) {
          existing.lastActivity = log.timestamp;
        }
      } else {
        userMap.set(log.userId, {
          count: 1,
          lastActivity: log.timestamp,
        });
      }
    });

    return Array.from(userMap.entries()).map(([userId, stats]) => {
      const log = logs.find(l => l.userId === userId);
      return {
        userId,
        userName: log?.userName || 'Desconhecido',
        count: stats.count,
        lastActivity: stats.lastActivity,
      };
    }).sort((a, b) => b.count - a.count);
  }

  // Limpar logs antigos (manter apenas últimos N dias)
  clearOldLogs(daysToKeep: number = 90) {
    try {
      const logs = this.getLogs();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const filteredLogs = logs.filter(log => log.timestamp >= cutoffDate);
      localStorage.setItem(this.storageKey, JSON.stringify(filteredLogs));

      return logs.length - filteredLogs.length;
    } catch (error) {
      // Erro ao limpar logs - não crítico
      return 0;
    }
  }

  // Exportar logs
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs();

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // CSV
      const headers = ['ID', 'Data/Hora', 'Usuário', 'Ação', 'Tipo', 'Entidade ID', 'Campo', 'Valor Antigo', 'Valor Novo', 'Detalhes'];
      const rows = logs.map(log => [
        log.id,
        log.timestamp.toLocaleString('pt-BR'),
        log.userName,
        log.action,
        log.entityType,
        log.entityId,
        log.field || '',
        log.oldValue ? JSON.stringify(log.oldValue) : '',
        log.newValue ? JSON.stringify(log.newValue) : '',
        log.details || '',
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  // Obter IP do cliente (simulado)
  private getClientIP(): string {
    // Em produção, isso viria do servidor
    return 'local';
  }
}

export const cashFlowAuditService = new CashFlowAuditService();
export type { AuditLog };

