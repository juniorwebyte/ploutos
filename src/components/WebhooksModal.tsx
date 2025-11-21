import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, TestTube, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { webhookService, Webhook, WebhookEvent } from '../services/webhookService';

interface WebhooksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WebhooksModal: React.FC<WebhooksModalProps> = ({ isOpen, onClose }) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as WebhookEvent[],
    enabled: true,
    secret: '',
    headers: {} as Record<string, string>
  });
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWebhooks();
    }
  }, [isOpen]);

  const loadWebhooks = () => {
    setWebhooks(webhookService.getAllWebhooks());
  };

  const handleCreateWebhook = () => {
    if (!newWebhook.name.trim() || !newWebhook.url.trim() || newWebhook.events.length === 0) {
      alert('Preencha nome, URL e selecione pelo menos um evento');
      return;
    }

    try {
      webhookService.createWebhook(newWebhook);
      setNewWebhook({
        name: '',
        url: '',
        events: [],
        enabled: true,
        secret: '',
        headers: {}
      });
      setShowCreateModal(false);
      loadWebhooks();
    } catch (error: any) {
      alert(error.message || 'Erro ao criar webhook');
    }
  };

  const handleDeleteWebhook = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este webhook?')) {
      webhookService.deleteWebhook(id);
      loadWebhooks();
    }
  };

  const handleToggleWebhook = (id: string, enabled: boolean) => {
    webhookService.updateWebhook(id, { enabled });
    loadWebhooks();
  };

  const handleTestWebhook = async (webhook: Webhook) => {
    setTestingWebhook(webhook.id);
    try {
      const result = await webhookService.testWebhook(webhook);
      alert(result.message);
    } catch (error: any) {
      alert('Erro ao testar webhook: ' + error.message);
    } finally {
      setTestingWebhook(null);
      loadWebhooks();
    }
  };

  const toggleEvent = (event: WebhookEvent) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventLabel = (event: WebhookEvent): string => {
    const labels: Record<WebhookEvent, string> = {
      'cashflow.closed': 'Fechamento de Caixa',
      'cashflow.saved': 'Salvamento de Dados',
      'cashflow.cleared': 'Limpeza de Formulário',
      'cashflow.backup_created': 'Backup Criado',
      'cashflow.alert_created': 'Alerta Criado',
      'cashflow.validation_failed': 'Validação Falhou'
    };
    return labels[event] || event;
  };

  const allEvents: WebhookEvent[] = [
    'cashflow.closed',
    'cashflow.saved',
    'cashflow.cleared',
    'cashflow.backup_created',
    'cashflow.alert_created',
    'cashflow.validation_failed'
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-1 overflow-y-auto pt-16">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-gray-900">Webhooks</h2>
              <p className="text-xs text-gray-600">Configure notificações para sistemas externos</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo
              </button>
              <button
                onClick={onClose}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lista de Webhooks */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {webhooks.length === 0 ? (
              <div className="text-center py-8">
                <ExternalLink className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 text-xs mb-1">Nenhum webhook configurado</p>
                <p className="text-gray-500 text-xs">
                  Clique em "Novo" para criar seu primeiro webhook
                </p>
              </div>
            ) : (
              webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xs font-semibold text-gray-900">
                          {webhook.name}
                        </h3>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          webhook.enabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {webhook.enabled ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1.5 break-all">
                        {webhook.url}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                          >
                            {getEventLabel(event)}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>Sucessos: {webhook.successCount}</span>
                        <span>Falhas: {webhook.failureCount}</span>
                        {webhook.lastTriggered && (
                          <span>Último: {formatDate(webhook.lastTriggered)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleToggleWebhook(webhook.id, !webhook.enabled)}
                        className={`p-1.5 rounded transition-colors ${
                          webhook.enabled
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        title={webhook.enabled ? 'Desativar' : 'Ativar'}
                      >
                        {webhook.enabled ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleTestWebhook(webhook)}
                        disabled={testingWebhook === webhook.id}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                        title="Testar webhook"
                      >
                        <TestTube className={`w-3.5 h-3.5 ${testingWebhook === webhook.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir webhook"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Criar Novo Webhook</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWebhook({
                    name: '',
                    url: '',
                    events: [],
                    enabled: true,
                    secret: '',
                    headers: {}
                  });
                }}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                  placeholder="Ex: Integração ERP"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                  placeholder="https://api.exemplo.com/webhook"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Eventos *
                </label>
                <div className="space-y-1.5 border border-gray-200 rounded-lg p-2 max-h-32 overflow-y-auto">
                  {allEvents.map((event) => (
                    <label key={event} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{getEventLabel(event)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Secret (opcional)
                </label>
                <input
                  type="password"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                  placeholder="Chave secreta para validação"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newWebhook.enabled}
                    onChange={(e) => setNewWebhook({ ...newWebhook, enabled: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-gray-700">Ativar imediatamente</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateWebhook}
                className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium"
              >
                Criar Webhook
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWebhook({
                    name: '',
                    url: '',
                    events: [],
                    enabled: true,
                    secret: '',
                    headers: {}
                  });
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WebhooksModal;

