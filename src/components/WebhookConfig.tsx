import React, { useState, useEffect } from 'react';
import { 
  Webhook, 
  Plus, 
  Edit, 
  Trash2, 
  TestTube, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  ExternalLink,
  X,
  Save,
  RefreshCw
} from 'lucide-react';
import paymentGatewayService from '../services/paymentGatewayService';

interface WebhookConfigProps {
  onClose: () => void;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  enabled_events: string[];
  status: 'active' | 'inactive' | 'error';
  created_at: string;
  last_delivery?: {
    timestamp: string;
    status: 'success' | 'failed';
    response_code: number;
  };
}

function WebhookConfig({ onClose }: WebhookConfigProps) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    url: '',
    enabled_events: [] as string[],
    description: ''
  });

  const availableEvents = [
    { id: 'charge.completed', name: 'Cobrança Concluída', description: 'Quando um pagamento é confirmado' },
    { id: 'charge.failed', name: 'Cobrança Falhada', description: 'Quando um pagamento falha' },
    { id: 'charge.pending', name: 'Cobrança Pendente', description: 'Quando um pagamento está pendente' },
    { id: 'charge.captured', name: 'Cobrança Capturada', description: 'Quando o dinheiro é capturado' },
    { id: 'charge.refunded', name: 'Cobrança Reembolsada', description: 'Quando um reembolso é processado' },
    { id: 'customer.created', name: 'Cliente Criado', description: 'Quando um novo cliente é criado' },
    { id: 'customer.updated', name: 'Cliente Atualizado', description: 'Quando dados do cliente são atualizados' },
    { id: 'payment_intent.succeeded', name: 'Intenção de Pagamento Sucedida', description: 'Quando uma intenção de pagamento é bem-sucedida' },
    { id: 'payment_intent.payment_failed', name: 'Intenção de Pagamento Falhada', description: 'Quando uma intenção de pagamento falha' },
    { id: 'dispute.created', name: 'Disputa Criada', description: 'Quando uma disputa é criada' }
  ];

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      // Simular carregamento de webhooks
      const mockWebhooks: WebhookEndpoint[] = [
        {
          id: 'wh_1234567890',
          url: 'https://meusite.com/webhook/pagamentos',
          secret: 'whsec_abc123def456ghi789',
          enabled_events: ['charge.completed', 'charge.failed', 'charge.captured'],
          status: 'active',
          created_at: '2025-01-10T10:00:00Z',
          last_delivery: {
            timestamp: '2025-01-15T14:30:00Z',
            status: 'success',
            response_code: 200
          }
        },
        {
          id: 'wh_0987654321',
          url: 'https://api.meusite.com/webhooks/stripe',
          secret: 'whsec_xyz789uvw456rst123',
          enabled_events: ['customer.created', 'customer.updated'],
          status: 'error',
          created_at: '2025-01-12T15:30:00Z',
          last_delivery: {
            timestamp: '2025-01-15T12:15:00Z',
            status: 'failed',
            response_code: 500
          }
        }
      ];
      setWebhooks(mockWebhooks);
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!formData.url || formData.enabled_events.length === 0) {
      alert('Preencha a URL e selecione pelo menos um evento');
      return;
    }

    setLoading(true);
    try {
      const webhookData = {
        url: formData.url,
        enabled_events: formData.enabled_events,
        description: formData.description
      };

      const newWebhook = await paymentGatewayService.createWebhookEndpoint(webhookData);
      
      setWebhooks(prev => [...prev, newWebhook]);
      setShowCreateForm(false);
      setFormData({ url: '', enabled_events: [], description: '' });
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
      alert('Erro ao criar webhook. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const updateWebhook = async (webhookId: string, updates: Partial<WebhookEndpoint>) => {
    setLoading(true);
    try {
      // Simular atualização
      setWebhooks(prev => prev.map(wh => 
        wh.id === webhookId ? { ...wh, ...updates } : wh
      ));
      setEditingWebhook(null);
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm('Tem certeza que deseja excluir este webhook?')) return;

    setLoading(true);
    try {
      setWebhooks(prev => prev.filter(wh => wh.id !== webhookId));
    } catch (error) {
      console.error('Erro ao excluir webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  const testWebhook = async (webhookId: string) => {
    setLoading(true);
    try {
      // Simular teste de webhook
      const testResult = {
        status: 'success',
        response_code: 200,
        response_time: '245ms',
        timestamp: new Date().toISOString(),
        test_event: {
          type: 'charge.completed',
          data: {
            id: 'ch_test_123456',
            amount: 10000,
            currency: 'BRL',
            status: 'completed'
          }
        }
      };

      setTestResults(prev => ({ ...prev, [webhookId]: testResult }));
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      setTestResults(prev => ({ 
        ...prev, 
        [webhookId]: { 
          status: 'failed', 
          error: 'Erro ao testar webhook' 
        } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const copyWebhookSecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    alert('Secret copiado para a área de transferência!');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'inactive':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Webhook className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Configurar Webhooks</h2>
              <p className="text-sm text-gray-600">Gerencie notificações automáticas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Header com botão de criar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Endpoints de Webhook</h3>
              <p className="text-sm text-gray-600">Configure URLs para receber notificações automáticas</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Webhook</span>
            </button>
          </div>

          {/* Lista de Webhooks */}
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(webhook.status)}
                      <h4 className="font-semibold text-gray-800">{webhook.url}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(webhook.status)}`}>
                        {webhook.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Secret Key:</p>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-white px-2 py-1 rounded flex-1">{webhook.secret}</code>
                          <button
                            onClick={() => copyWebhookSecret(webhook.secret)}
                            className="px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Eventos Ativos:</p>
                        <div className="flex flex-wrap gap-1">
                          {webhook.enabled_events.map((event) => (
                            <span key={event} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {webhook.last_delivery && (
                      <div className="bg-white rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-gray-800 mb-2">Última Entrega:</p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">
                            {new Date(webhook.last_delivery.timestamp).toLocaleString('pt-BR')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            webhook.last_delivery.status === 'success' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {webhook.last_delivery.status === 'success' ? 'Sucesso' : 'Falha'}
                          </span>
                          <span className="text-gray-600">
                            HTTP {webhook.last_delivery.response_code}
                          </span>
                        </div>
                      </div>
                    )}

                    {testResults[webhook.id] && (
                      <div className={`rounded-lg p-3 mb-4 ${
                        testResults[webhook.id].status === 'success' 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <p className="text-sm font-medium mb-2">Resultado do Teste:</p>
                        <div className="text-sm space-y-1">
                          <p>Status: {testResults[webhook.id].status === 'success' ? 'Sucesso' : 'Falha'}</p>
                          <p>Código: {testResults[webhook.id].response_code}</p>
                          <p>Tempo: {testResults[webhook.id].response_time}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => testWebhook(webhook.id)}
                      disabled={loading}
                      className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                    >
                      <TestTube className="w-4 h-4" />
                      <span>Testar</span>
                    </button>
                    
                    <button
                      onClick={() => setEditingWebhook(webhook)}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                    
                    <button
                      onClick={() => deleteWebhook(webhook.id)}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Formulário de Criação */}
          {showCreateForm && (
            <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">Criar Novo Webhook</h3>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL do Endpoint</label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://seusite.com/webhook"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Webhook para notificações de pagamento"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Eventos</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableEvents.map((event) => (
                        <label key={event.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={formData.enabled_events.includes(event.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  enabled_events: [...prev.enabled_events, event.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  enabled_events: prev.enabled_events.filter(id => id !== event.id)
                                }));
                              }
                            }}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{event.name}</p>
                            <p className="text-sm text-gray-600">{event.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t flex justify-end space-x-4">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createWebhook}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Criando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Criar Webhook</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Documentação */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-800 mb-4">Documentação de Webhook</h4>
            <div className="space-y-3 text-sm text-blue-700">
              <p><strong>Headers:</strong> Todos os webhooks incluem headers de autenticação e timestamp</p>
              <p><strong>Retry:</strong> Tentativas automáticas em caso de falha (3 tentativas)</p>
              <p><strong>Timeout:</strong> 30 segundos para resposta do endpoint</p>
              <p><strong>Formato:</strong> JSON com estrutura padronizada</p>
            </div>
            <div className="mt-4">
              <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2">
                <ExternalLink className="w-4 h-4" />
                <span>Ver Documentação Completa</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebhookConfig;
