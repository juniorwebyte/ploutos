/**
 * Serviço de Auditoria Completo
 * Registra todas as operações do sistema para conformidade e segurança
 */

export interface AuditLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

class AuditService {
  private logs: AuditLog[] = [];

  /**
   * Registrar ação no log de auditoria
   */
  async logAction(
    action: string,
    entityType: string,
    options: {
      userId?: string;
      userName?: string;
      entityId?: string;
      oldValue?: any;
      newValue?: any;
      details?: any;
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<AuditLog> {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: options.userId,
      userName: options.userName,
      action,
      entityType,
      entityId: options.entityId,
      oldValue: options.oldValue,
      newValue: options.newValue,
      details: options.details,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      timestamp: new Date(),
    };

    // Salvar no localStorage (em produção, enviar para servidor)
    this.logs.push(log);
    this.saveLogs();

    console.log('📝 Audit Log:', log);
    return log;
  }

  /**
   * Buscar logs por filtros
   */
  async getLogs(filters: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLog[]> {
    this.loadLogs();
    
    return this.logs.filter(log => {
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.action && log.action !== filters.action) return false;
      if (filters.entityType && log.entityType !== filters.entityType) return false;
      if (filters.entityId && log.entityId !== filters.entityId) return false;
      if (filters.startDate && log.timestamp < filters.startDate) return false;
      if (filters.endDate && log.timestamp > filters.endDate) return false;
      return true;
    });
  }

  /**
   * Exportar logs para CSV
   */
  exportToCSV(logs: AuditLog[]): string {
    const headers = ['ID', 'Data/Hora', 'Usuário', 'Ação', 'Tipo', 'ID Entidade', 'IP', 'Detalhes'];
    const rows = logs.map(log => [
      log.id,
      log.timestamp.toLocaleString('pt-BR'),
      log.userName || log.userId || 'N/A',
      log.action,
      log.entityType,
      log.entityId || 'N/A',
      log.ipAddress || 'N/A',
      JSON.stringify(log.details || {}),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private saveLogs() {
    try {
      localStorage.setItem('timeclock_audit_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Erro ao salvar logs de auditoria:', error);
    }
  }

  private loadLogs() {
    try {
      const stored = localStorage.getItem('timeclock_audit_logs');
      if (stored) {
        this.logs = JSON.parse(stored).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      this.logs = [];
    }
  }
}

export const auditService = new AuditService();
