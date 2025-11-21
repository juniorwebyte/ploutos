import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Download, Settings, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { pdvIntegrationService, PDVIntegrationConfig } from '../services/pdvIntegrationService';
import { formatCurrency } from '../utils/currency';

interface PDVIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSales?: (entries: any) => void;
}

const PDVIntegrationModal: React.FC<PDVIntegrationModalProps> = ({
  isOpen,
  onClose,
  onImportSales
}) => {
  const [config, setConfig] = useState<PDVIntegrationConfig>(() => pdvIntegrationService.getConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Carregar configuração quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      const currentConfig = pdvIntegrationService.getConfig();
      setConfig(currentConfig);
      setLastSyncTime(currentConfig.lastSync || null);
      setSyncResult(null);
    }
  }, [isOpen]);

  // Gerenciar sincronização automática
  useEffect(() => {
    if (!isOpen) {
      pdvIntegrationService.stopAutoSync();
      return;
    }

    const currentConfig = pdvIntegrationService.getConfig();
    if (currentConfig.enabled && currentConfig.autoSync) {
      pdvIntegrationService.startAutoSync((result) => {
        setSyncResult(result);
        setLastSyncTime(new Date());
      });
    } else {
      pdvIntegrationService.stopAutoSync();
    }

    return () => {
      pdvIntegrationService.stopAutoSync();
    };
  }, [isOpen]);

  const handleSaveConfig = () => {
    try {
      // Salvar configuração
      pdvIntegrationService.saveConfig(config);
      
      // Parar sincronização anterior
      pdvIntegrationService.stopAutoSync();
      
      // Iniciar nova sincronização se habilitada
      if (config.enabled && config.autoSync) {
        setTimeout(() => {
          pdvIntegrationService.startAutoSync((result) => {
            setSyncResult(result);
            setLastSyncTime(new Date());
          });
        }, 100);
      }
      
      // Recarregar configuração salva
      const savedConfig = pdvIntegrationService.getConfig();
      setConfig(savedConfig);
      setLastSyncTime(savedConfig.lastSync || null);
      
      alert('Configuração salva com sucesso!');
    } catch (error: any) {
      alert('Erro ao salvar configuração: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const handleSyncNow = async () => {
    // Verificar se está habilitado no localStorage (fonte da verdade)
    const currentConfig = pdvIntegrationService.getConfig();
    if (!currentConfig.enabled) {
      alert('Por favor, habilite a integração primeiro, clique em "Salvar Configuração" e depois tente sincronizar novamente.');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      // PASSO 1: Sincronizar vendas (buscar do PDV/API)
      const result = await pdvIntegrationService.syncSales();
      setSyncResult(result);
      setLastSyncTime(new Date());
      
      if (!result.success) {
        alert(`❌ Erro na sincronização: ${result.error || 'Erro desconhecido'}`);
        return;
      }
      
      if (result.count === 0) {
        alert('⚠️ Sincronização concluída, mas nenhuma venda foi encontrada para importar.');
        return;
      }
      
      // PASSO 2: Importar vendas sincronizadas
      const sales = await pdvIntegrationService.importSales();
      
      if (!sales || sales.length === 0) {
        alert('⚠️ Nenhuma venda encontrada para importar. Verifique se há vendas no PDV.');
        return;
      }
      
      // PASSO 3: Converter vendas para formato de entradas
      const entries = pdvIntegrationService.convertSalesToEntries(sales);
      
      // Verificar se há valores para importar
      const totalValue = Object.values(entries).reduce((sum, val) => sum + val, 0);
      if (totalValue === 0) {
        alert('⚠️ Nenhum valor foi encontrado nas vendas para importar.');
        return;
      }
      
      // PASSO 4: Aplicar entradas no CashFlow
      if (onImportSales) {
        onImportSales(entries);
      } else {
        alert('⚠️ Função de importação não disponível.');
      }
    } catch (error: any) {
      setSyncResult({
        success: false,
        count: 0,
        error: error.message || 'Erro desconhecido'
      });
      alert(`❌ Erro ao sincronizar: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-1 overflow-y-auto pt-16">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-gray-900">Integração com PDV</h2>
            <p className="text-xs text-gray-600">Sincronize vendas automaticamente do seu PDV</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {config.enabled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-xs font-semibold text-gray-900">
                  Status: {config.enabled ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              {lastSyncTime && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Última sync: {formatDate(lastSyncTime)}</span>
                </div>
              )}
            </div>
            {syncResult && (
              <div className={`mt-2 p-2 rounded text-xs ${
                syncResult.success 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {syncResult.success 
                  ? `✓ ${syncResult.count} venda(s) sincronizada(s) com sucesso`
                  : `✗ Erro: ${syncResult.error || 'Falha na sincronização'}`
                }
              </div>
            )}
          </div>

          {/* Configurações */}
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="enable-integration"
                  checked={config.enabled || false}
                  onChange={(e) => {
                    const newEnabled = e.target.checked;
                    const updatedConfig = { ...config, enabled: newEnabled };
                    setConfig(updatedConfig);
                    
                    // Salvar imediatamente quando marcar/desmarcar
                    try {
                      pdvIntegrationService.saveConfig(updatedConfig);
                    } catch (error) {
                      // Erro silencioso - será tratado no handleSaveConfig
                    }
                  }}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer flex-shrink-0"
                />
                <label htmlFor="enable-integration" className="flex-1 cursor-pointer">
                  <span className="text-xs font-medium text-gray-700 select-none block">
                    Habilitar integração
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.enabled 
                      ? '✓ A integração está ativa. Configure o endpoint abaixo para começar a sincronizar.'
                      : 'Marque esta opção para ativar a integração com o PDV.'}
                  </p>
                </label>
              </div>
            </div>

            {config.enabled && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Endpoint do PDV <span className="text-gray-400 font-normal">(opcional para modo demo)</span>
                  </label>
                  <input
                    type="text"
                    value={config.pdvEndpoint || ''}
                    onChange={(e) => setConfig({ ...config, pdvEndpoint: e.target.value })}
                    placeholder="https://api.pdv.com/vendas (deixe vazio para modo demo)"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se não informar o endpoint, o sistema usará dados de exemplo para demonstração.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    API Key (opcional)
                  </label>
                  <input
                    type="password"
                    value={config.apiKey || ''}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="Sua chave de API"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={config.autoSync}
                      onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-medium text-gray-700">Sincronização automática</span>
                  </label>
                </div>

                {config.autoSync && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Intervalo de sincronização (minutos)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={config.syncInterval}
                      onChange={(e) => setConfig({ ...config, syncInterval: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={handleSyncNow}
              disabled={!config.enabled || isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar Agora
            </button>
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              Salvar Configuração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDVIntegrationModal;

