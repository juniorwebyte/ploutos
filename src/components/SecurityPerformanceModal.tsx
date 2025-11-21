import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Settings, 
  BarChart3, 
  Lock, 
  Eye, 
  RefreshCw,
  Download,
  Trash2,
  X,
  Activity,
  Clock,
  Database,
  Cpu,
  HardDrive
} from 'lucide-react';
import { securityService, performanceService } from '../services/securityService';

interface SecurityPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SecurityPerformanceModal({ isOpen, onClose }: SecurityPerformanceModalProps) {
  const [activeTab, setActiveTab] = useState<'security' | 'performance'>('security');
  const [securityConfig, setSecurityConfig] = useState(securityService.getConfig());
  const [performanceConfig, setPerformanceConfig] = useState(performanceService.getConfig());
  const [securityLogs, setSecurityLogs] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    setSecurityLogs(securityService.getSecurityLogs());
    setPerformanceMetrics(performanceService.getPerformanceMetrics());
    setCacheStats(performanceService.getCacheStats());
  };

  const updateSecurityConfig = (key: string, value: any) => {
    const newConfig = { ...securityConfig, [key]: value };
    setSecurityConfig(newConfig);
    securityService.updateConfig(newConfig);
  };

  const updatePerformanceConfig = (key: string, value: any) => {
    const newConfig = { ...performanceConfig, [key]: value };
    setPerformanceConfig(newConfig);
    performanceService.updateConfig(newConfig);
  };

  const clearSecurityLogs = () => {
    if (confirm('Tem certeza que deseja limpar todos os logs de segurança?')) {
      securityService.clearOldLogs(0);
      setSecurityLogs([]);
    }
  };

  const clearPerformanceMetrics = () => {
    if (confirm('Tem certeza que deseja limpar todas as métricas de performance?')) {
      localStorage.removeItem('ploutos_performance_metrics');
      setPerformanceMetrics([]);
    }
  };

  const clearCache = () => {
    if (confirm('Tem certeza que deseja limpar o cache?')) {
      performanceService.clearCache();
      setCacheStats(performanceService.getCacheStats());
    }
  };

  const exportSecurityLogs = () => {
    const data = JSON.stringify(securityLogs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportPerformanceMetrics = () => {
    const data = JSON.stringify(performanceMetrics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_metrics_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Segurança & Performance</h2>
                <p className="text-red-100">Monitoramento e configurações do sistema</p>
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

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              Segurança
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'performance'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Zap className="h-4 w-4 inline mr-2" />
              Performance
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[600px]">
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Security Config */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações de Segurança
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Criptografia</span>
                      <input
                        type="checkbox"
                        checked={securityConfig.enableEncryption}
                        onChange={(e) => updateSecurityConfig('enableEncryption', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Log de Auditoria</span>
                      <input
                        type="checkbox"
                        checked={securityConfig.enableAuditLog}
                        onChange={(e) => updateSecurityConfig('enableAuditLog', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Rate Limiting</span>
                      <input
                        type="checkbox"
                        checked={securityConfig.enableRateLimit}
                        onChange={(e) => updateSecurityConfig('enableRateLimit', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Validação de Entrada</span>
                      <input
                        type="checkbox"
                        checked={securityConfig.enableInputValidation}
                        onChange={(e) => updateSecurityConfig('enableInputValidation', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Proteção XSS</span>
                      <input
                        type="checkbox"
                        checked={securityConfig.enableXSSProtection}
                        onChange={(e) => updateSecurityConfig('enableXSSProtection', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Proteção CSRF</span>
                      <input
                        type="checkbox"
                        checked={securityConfig.enableCSRFProtection}
                        onChange={(e) => updateSecurityConfig('enableCSRFProtection', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout da Sessão (minutos)
                      </label>
                      <input
                        type="number"
                        value={securityConfig.sessionTimeout}
                        onChange={(e) => updateSecurityConfig('sessionTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                        min="5"
                        max="480"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Máximo de Tentativas de Login
                      </label>
                      <input
                        type="number"
                        value={securityConfig.maxLoginAttempts}
                        onChange={(e) => updateSecurityConfig('maxLoginAttempts', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                        min="3"
                        max="20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Logs */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Logs de Segurança ({securityLogs.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={exportSecurityLogs}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Exportar
                    </button>
                    <button
                      onClick={clearSecurityLogs}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {securityLogs.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum log de segurança encontrado</p>
                  ) : (
                    <div className="space-y-2">
                      {securityLogs.slice(0, 20).map((log) => (
                        <div key={log.id} className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-medium text-gray-900">{log.type}</span>
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(new Date(log.timestamp))}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Performance Config */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações de Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Cache</span>
                      <input
                        type="checkbox"
                        checked={performanceConfig.enableCaching}
                        onChange={(e) => updatePerformanceConfig('enableCaching', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Compressão</span>
                      <input
                        type="checkbox"
                        checked={performanceConfig.enableCompression}
                        onChange={(e) => updatePerformanceConfig('enableCompression', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Lazy Loading</span>
                      <input
                        type="checkbox"
                        checked={performanceConfig.enableLazyLoading}
                        onChange={(e) => updatePerformanceConfig('enableLazyLoading', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Otimização de Imagens</span>
                      <input
                        type="checkbox"
                        checked={performanceConfig.enableImageOptimization}
                        onChange={(e) => updatePerformanceConfig('enableImageOptimization', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Code Splitting</span>
                      <input
                        type="checkbox"
                        checked={performanceConfig.enableCodeSplitting}
                        onChange={(e) => updatePerformanceConfig('enableCodeSplitting', e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timeout do Cache (minutos)
                      </label>
                      <input
                        type="number"
                        value={performanceConfig.cacheTimeout}
                        onChange={(e) => updatePerformanceConfig('cacheTimeout', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                        min="5"
                        max="1440"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tamanho Máximo do Cache (MB)
                      </label>
                      <input
                        type="number"
                        value={performanceConfig.maxCacheSize}
                        onChange={(e) => updatePerformanceConfig('maxCacheSize', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                        min="10"
                        max="500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache Stats */}
              {cacheStats && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Estatísticas do Cache
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{formatBytes(cacheStats.size)}</p>
                      <p className="text-sm text-gray-600">Tamanho Atual</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatBytes(cacheStats.maxSize)}</p>
                      <p className="text-sm text-gray-600">Tamanho Máximo</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{cacheStats.entries}</p>
                      <p className="text-sm text-gray-600">Entradas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{(cacheStats.hitRate * 100).toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Taxa de Acerto</p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={clearCache}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                      Limpar Cache
                    </button>
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Métricas de Performance ({performanceMetrics.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={exportPerformanceMetrics}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Exportar
                    </button>
                    <button
                      onClick={clearPerformanceMetrics}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {performanceMetrics.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhuma métrica de performance encontrada</p>
                  ) : (
                    <div className="space-y-2">
                      {performanceMetrics.slice(0, 20).map((metric) => (
                        <div key={metric.id} className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium text-gray-900">{metric.name}</span>
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(new Date(metric.timestamp))}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                            <span>Duração: {metric.duration.toFixed(2)}ms</span>
                            <span>Tipo: {metric.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
