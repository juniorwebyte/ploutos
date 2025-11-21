import { Cancelamento } from '../types';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
  entity: 'CANCELAMENTO';
  entityId: string;
  userId?: string;
  details: string;
  ipAddress?: string;
}

export class AuditLogger {
  private static instance: AuditLogger;
  private logs: AuditLog[] = [];

  private constructor() {
    this.loadLogs();
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private loadLogs(): void {
    const savedLogs = localStorage.getItem('audit_logs');
    if (savedLogs) {
      try {
        this.logs = JSON.parse(savedLogs);
      } catch (error) {
        console.error('Erro ao carregar logs de auditoria:', error);
        this.logs = [];
      }
    }
  }

  private saveLogs(): void {
    try {
      localStorage.setItem('audit_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Erro ao salvar logs de auditoria:', error);
    }
  }

  public log(action: AuditLog['action'], entity: AuditLog['entity'], entityId: string, details: string, userId?: string): void {
    const log: AuditLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      entity,
      entityId,
      userId,
      details,
      ipAddress: this.getClientIP()
    };

    this.logs.push(log);
    this.saveLogs();

    // Manter apenas os últimos 1000 logs para evitar problemas de performance
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
      this.saveLogs();
    }
  }

  public getLogs(entityId?: string, action?: AuditLog['action']): AuditLog[] {
    let filteredLogs = this.logs;

    if (entityId) {
      filteredLogs = filteredLogs.filter(log => log.entityId === entityId);
    }

    if (action) {
      filteredLogs = filteredLogs.filter(log => log.action === action);
    }

    return filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getLogsByDateRange(startDate: string, endDate: string): AuditLog[] {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return this.logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= start && logDate <= end;
    });
  }

  public clearLogs(): void {
    this.logs = [];
    this.saveLogs();
  }

  private getClientIP(): string {
    // Em um ambiente real, isso seria obtido do servidor
    // Por enquanto, retornamos um valor mock
    // Tentar obter IP real do cliente via headers
    if (typeof window !== 'undefined') {
      // Em produção, o IP será obtido pelo backend via headers
      return 'client-side';
    }
    return '127.0.0.1';
  }
}

// Funções de validação para cancelamentos
export const validateCancelamento = (cancelamento: Partial<Cancelamento>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!cancelamento.numeroPedido?.trim()) {
    errors.push('Número do pedido é obrigatório');
  }

  if (!cancelamento.horaCancelamento?.trim()) {
    errors.push('Hora do cancelamento é obrigatória');
  }

  if (!cancelamento.vendedor?.trim()) {
    errors.push('Vendedor é obrigatório');
  }

  if (!cancelamento.numeroNovoPedido?.trim()) {
    errors.push('Número do novo pedido é obrigatório');
  }

  if (!cancelamento.motivo?.trim()) {
    errors.push('Motivo do cancelamento é obrigatório');
  }

  if (!cancelamento.valor || cancelamento.valor <= 0) {
    errors.push('Valor do cancelamento deve ser maior que zero');
  }

  if (!cancelamento.assinaturaGerente?.trim()) {
    errors.push('Assinatura da gerente é obrigatória');
  }

  // Validação de formato da hora
  if (cancelamento.horaCancelamento && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(cancelamento.horaCancelamento)) {
    errors.push('Formato de hora inválido (use HH:MM)');
  }

  // Validação de valor máximo (exemplo: R$ 10.000,00)
  if (cancelamento.valor && cancelamento.valor > 10000) {
    errors.push('Valor do cancelamento não pode ser superior a R$ 10.000,00');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Função para verificar integridade dos dados
export const verifyDataIntegrity = (cancelamentos: Cancelamento[]): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];

  // Verificar se há IDs duplicados
  const ids = cancelamentos.map(c => c.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    issues.push('IDs duplicados encontrados nos cancelamentos');
  }

  // Verificar se há números de pedido duplicados no mesmo dia
  const pedidosPorDia = new Map<string, Set<string>>();
  cancelamentos.forEach(cancelamento => {
    const data = cancelamento.data;
    if (!pedidosPorDia.has(data)) {
      pedidosPorDia.set(data, new Set());
    }
    const pedidos = pedidosPorDia.get(data)!;
    if (pedidos.has(cancelamento.numeroPedido)) {
      issues.push(`Número de pedido ${cancelamento.numeroPedido} duplicado na data ${data}`);
    }
    pedidos.add(cancelamento.numeroPedido);
  });

  // Verificar se os valores são consistentes
  cancelamentos.forEach(cancelamento => {
    if (cancelamento.valor < 0) {
      issues.push(`Valor negativo encontrado no cancelamento ${cancelamento.id}`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues
  };
};

// Função para gerar relatório de auditoria
export const generateAuditReport = (startDate?: string, endDate?: string): string => {
  const logger = AuditLogger.getInstance();
  const logs = startDate && endDate 
    ? logger.getLogsByDateRange(startDate, endDate)
    : logger.getLogs();

  let report = 'RELATÓRIO DE AUDITORIA - CANCELAMENTOS\n';
  report += '=====================================\n\n';
  report += `Período: ${startDate || 'Início'} até ${endDate || 'Agora'}\n`;
  report += `Total de registros: ${logs.length}\n\n`;

  const cancelamentoLogs = logs.filter(log => log.entity === 'CANCELAMENTO');
  
  report += 'AÇÕES REALIZADAS:\n';
  report += '================\n';
  
  cancelamentoLogs.forEach(log => {
    const timestamp = new Date(log.timestamp).toLocaleString('pt-BR');
    report += `[${timestamp}] ${log.action} - ${log.details}\n`;
    if (log.userId) {
      report += `  Usuário: ${log.userId}\n`;
    }
    report += `  ID: ${log.entityId}\n\n`;
  });

  return report;
};
