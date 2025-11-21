import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Calendar, 
  User, 
  Activity,
  Clock,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  X
} from 'lucide-react';
import { auditService, AuditLog } from '../services/auditService';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditLogsModal({ isOpen, onClose }: AuditLogsModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      loadStats();
    }
  }, [isOpen]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterType, filterEntity, filterUser, dateRange]);

  const loadLogs = () => {
    setIsLoading(true);
    try {
      const allLogs = auditService.getLogs();
      setLogs(allLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = () => {
    try {
      const statsData = auditService.getUsageStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro por tipo de ação
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.action.includes(filterType));
    }

    // Filtro por tipo de entidade
    if (filterEntity !== 'all') {
      filtered = filtered.filter(log => log.entityType === filterEntity);
    }

    // Filtro por usuário
    if (filterUser !== 'all') {
      filtered = filtered.filter(log => log.userName === filterUser);
    }

    // Filtro por data
    if (dateRange.start) {
      filtered = filtered.filter(log => log.timestamp >= new Date(dateRange.start));
    }
    if (dateRange.end) {
      filtered = filtered.filter(log => log.timestamp <= new Date(dateRange.end));
    }

    setFilteredLogs(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterEntity('all');
    setFilterUser('all');
    setDateRange({ start: '', end: '' });
  };

  const exportLogs = (format: 'json' | 'csv' = 'json') => {
    const data = auditService.exportLogs(format);
    const blob = new Blob([data], { 
      type: format === 'json' ? 'application/json' : 'text/csv' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearOldLogs = () => {
    if (confirm('Tem certeza que deseja limpar logs antigos (mais de 30 dias)?')) {
      auditService.clearOldLogs(30);
      loadLogs();
      loadStats();
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('CRIAR')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (action.includes('ATUALIZAR')) return <RefreshCw className="h-4 w-4 text-blue-600" />;
    if (action.includes('EXCLUIR')) return <Trash2 className="h-4 w-4 text-red-600" />;
    if (action.includes('PAGAR')) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'nota_fiscal': return 'bg-blue-100 text-blue-800';
      case 'parcela': return 'bg-green-100 text-green-800';
      case 'pagamento': return 'bg-purple-100 text-purple-800';
      case 'usuario': return 'bg-orange-100 text-orange-800';
      case 'sistema': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Logs de Auditoria</h2>
                <p className="text-blue-100">Rastreabilidade completa do sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="bg-gray-50 p-4 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.totalLogs}</p>
                <p className="text-sm text-gray-600">Total de Logs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.todayLogs}</p>
                <p className="text-sm text-gray-600">Hoje</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{stats.uniqueUsers}</p>
                <p className="text-sm text-gray-600">Usuários Únicos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.averageInteractionsPerUser.toFixed(1)}</p>
                <p className="text-sm text-gray-600">Média por Usuário</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-4 bg-white border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar logs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ação</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Todas as Ações</option>
                <option value="CRIAR">Criar</option>
                <option value="ATUALIZAR">Atualizar</option>
                <option value="EXCLUIR">Excluir</option>
                <option value="PAGAR">Pagar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entidade</label>
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Todas as Entidades</option>
                <option value="nota_fiscal">Nota Fiscal</option>
                <option value="parcela">Parcela</option>
                <option value="pagamento">Pagamento</option>
                <option value="usuario">Usuário</option>
                <option value="sistema">Sistema</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">Todos os Usuários</option>
                {Array.from(new Set(logs.map(log => log.userName))).map(userName => (
                  <option key={userName} value={userName}>{userName}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportLogs('json')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Exportar JSON
            </button>
            <button
              onClick={() => exportLogs('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
            <button
              onClick={clearOldLogs}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Antigos
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {filteredLogs.length} de {logs.length} logs
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-y-auto max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <AlertCircle className="h-6 w-6 text-gray-400" />
              <span className="ml-2 text-gray-600">Nenhum log encontrado</span>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm font-medium text-gray-900">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{log.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getEntityTypeColor(log.entityType)}`}>
                        {log.entityType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 font-mono">{log.entityId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDate(log.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{log.details || '-'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
