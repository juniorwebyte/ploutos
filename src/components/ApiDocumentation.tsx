import React, { useState } from 'react';
import { 
  BookOpen, 
  Code, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronRight,
  ChevronDown,
  Play,
  Terminal,
  Globe,
  Key,
  Shield,
  Zap,
  Database,
  Webhook
} from 'lucide-react';

interface ApiDocumentationProps {
  onClose: () => void;
}

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  example?: {
    request?: any;
    response?: any;
  };
  codeExample?: string;
}

function ApiDocumentation({ onClose }: ApiDocumentationProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const endpoints: ApiEndpoint[] = [
    {
      method: 'POST',
      path: '/v1/charges',
      description: 'Criar uma nova cobrança',
      parameters: [
        { name: 'amount', type: 'integer', required: true, description: 'Valor em centavos (ex: 1000 = R$ 10,00)' },
        { name: 'currency', type: 'string', required: true, description: 'Moeda (brl, usd, btc, eth, usdt, bnb)' },
        { name: 'payment_method', type: 'string', required: true, description: 'Método de pagamento (pix, credit_card, bitcoin, etc.)' },
        { name: 'customer_email', type: 'string', required: true, description: 'E-mail do cliente' },
        { name: 'customer_name', type: 'string', required: true, description: 'Nome do cliente' },
        { name: 'description', type: 'string', required: false, description: 'Descrição da cobrança' },
        { name: 'webhook_url', type: 'string', required: false, description: 'URL para receber webhooks' },
        { name: 'metadata', type: 'object', required: false, description: 'Dados adicionais' }
      ],
      example: {
        request: {
          amount: 10000,
          currency: 'brl',
          payment_method: 'pix',
          customer_email: 'cliente@exemplo.com',
          customer_name: 'João Silva',
          description: 'Pagamento de produto',
          metadata: { order_id: '12345' }
        },
        response: {
          id: 'ch_1234567890',
          amount: 10000,
          currency: 'brl',
          status: 'pending',
          payment_method: 'pix',
          customer_email: 'cliente@exemplo.com',
          customer_name: 'João Silva',
          created_at: '2024-10-15T10:30:00Z',
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          expires_at: '2024-10-15T10:35:00Z'
        }
      },
      codeExample: `curl -X POST https://api.ploutosledger.com/v1/charges \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "currency": "brl",
    "payment_method": "pix",
    "customer_email": "cliente@exemplo.com",
    "customer_name": "João Silva",
    "description": "Pagamento de produto"
  }'`
    },
    {
      method: 'GET',
      path: '/v1/charges/{charge_id}',
      description: 'Obter detalhes de uma cobrança',
      parameters: [
        { name: 'charge_id', type: 'string', required: true, description: 'ID da cobrança' }
      ],
      example: {
        response: {
          id: 'ch_1234567890',
          amount: 10000,
          currency: 'brl',
          status: 'completed',
          payment_method: 'pix',
          customer_email: 'cliente@exemplo.com',
          customer_name: 'João Silva',
          created_at: '2024-10-15T10:30:00Z',
          updated_at: '2024-10-15T10:32:00Z',
          receipt_url: 'https://dashboard.ploutosledger.com/receipts/ch_1234567890'
        }
      },
      codeExample: `curl -X GET https://api.ploutosledger.com/v1/charges/ch_1234567890 \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef"`
    },
    {
      method: 'POST',
      path: '/v1/charges/{charge_id}/refunds',
      description: 'Criar um reembolso para uma cobrança',
      parameters: [
        { name: 'charge_id', type: 'string', required: true, description: 'ID da cobrança' },
        { name: 'amount', type: 'integer', required: false, description: 'Valor do reembolso em centavos (padrão: valor total)' },
        { name: 'reason', type: 'string', required: false, description: 'Motivo do reembolso' }
      ],
      example: {
        request: {
          amount: 5000,
          reason: 'requested_by_customer'
        },
        response: {
          id: 're_1234567890',
          charge_id: 'ch_1234567890',
          amount: 5000,
          reason: 'requested_by_customer',
          status: 'succeeded',
          created_at: '2024-10-15T11:00:00Z'
        }
      },
      codeExample: `curl -X POST https://api.ploutosledger.com/v1/charges/ch_1234567890/refunds \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "reason": "requested_by_customer"
  }'`
    },
    {
      method: 'POST',
      path: '/v1/customers',
      description: 'Criar um novo cliente',
      parameters: [
        { name: 'email', type: 'string', required: true, description: 'E-mail do cliente' },
        { name: 'name', type: 'string', required: true, description: 'Nome do cliente' },
        { name: 'phone', type: 'string', required: false, description: 'Telefone do cliente' },
        { name: 'address', type: 'object', required: false, description: 'Endereço do cliente' }
      ],
      example: {
        request: {
          email: 'cliente@exemplo.com',
          name: 'João Silva',
          phone: '+5511999999999',
          address: {
            line1: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            postal_code: '01234-567',
            country: 'BR'
          }
        },
        response: {
          id: 'cus_1234567890',
          email: 'cliente@exemplo.com',
          name: 'João Silva',
          phone: '+5511999999999',
          created_at: '2024-10-15T10:00:00Z'
        }
      },
      codeExample: `curl -X POST https://api.ploutosledger.com/v1/customers \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "cliente@exemplo.com",
    "name": "João Silva",
    "phone": "+5511999999999"
  }'`
    },
    {
      method: 'POST',
      path: '/v1/payment_intents',
      description: 'Criar um Payment Intent para pagamentos complexos',
      parameters: [
        { name: 'amount', type: 'integer', required: true, description: 'Valor em centavos' },
        { name: 'currency', type: 'string', required: true, description: 'Moeda' },
        { name: 'payment_method_types', type: 'array', required: false, description: 'Tipos de pagamento aceitos' },
        { name: 'customer', type: 'string', required: false, description: 'ID do cliente' }
      ],
      example: {
        request: {
          amount: 10000,
          currency: 'brl',
          payment_method_types: ['card', 'pix'],
          customer: 'cus_1234567890'
        },
        response: {
          id: 'pi_1234567890',
          amount: 10000,
          currency: 'brl',
          status: 'requires_payment_method',
          client_secret: 'pi_1234567890_secret_abc123',
          payment_method_types: ['card', 'pix'],
          created_at: '2024-10-15T10:00:00Z'
        }
      },
      codeExample: `curl -X POST https://api.ploutosledger.com/v1/payment_intents \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "currency": "brl",
    "payment_method_types": ["card", "pix"]
  }'`
    },
    {
      method: 'POST',
      path: '/v1/linkinvoice',
      description: 'Criar um LinkInvoice completo (recomendado)',
      parameters: [
        { name: 'amount', type: 'integer', required: true, description: 'Valor em centavos' },
        { name: 'currency', type: 'string', required: true, description: 'Moeda (brl, usd, etc.)' },
        { name: 'payment_method', type: 'string', required: true, description: 'Método de pagamento' },
        { name: 'customer_email', type: 'string', required: true, description: 'E-mail do cliente' },
        { name: 'customer_name', type: 'string', required: true, description: 'Nome do cliente' },
        { name: 'description', type: 'string', required: false, description: 'Descrição' },
        { name: 'webhook_url', type: 'string', required: false, description: 'URL para webhooks' }
      ],
      example: {
        request: {
          amount: 10000,
          currency: 'brl',
          payment_method: 'pix',
          customer_email: 'cliente@exemplo.com',
          customer_name: 'João Silva',
          description: 'Pagamento de produto',
          webhook_url: 'https://seusite.com/webhook'
        },
        response: {
          charge: {
            id: 'ch_1234567890',
            amount: 10000,
            status: 'pending',
            payment_method: 'pix',
            linkinvoice_id: 'li_1234567890',
            linkinvoice_url: 'https://ploutosledger.com/pay/li_1234567890'
          },
          payment_url: 'https://ploutosledger.com/pay/li_1234567890',
          qr_codes: {
            pix: 'data:image/png;base64,...'
          },
          instructions: {
            title: 'Pagamento via PIX',
            steps: ['1. Abra o app do banco', '2. Escaneie o QR Code', '...']
          },
          auto_capture_enabled: true,
          webhook_configured: true
        }
      },
      codeExample: `curl -X POST https://api.ploutosledger.com/v1/linkinvoice \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "currency": "brl",
    "payment_method": "pix",
    "customer_email": "cliente@exemplo.com",
    "customer_name": "João Silva",
    "webhook_url": "https://seusite.com/webhook"
  }'`
    },
    {
      method: 'GET',
      path: '/v1/charges',
      description: 'Listar todas as cobranças com filtros',
      parameters: [
        { name: 'customer', type: 'string', required: false, description: 'Filtrar por cliente (nome/e-mail)' },
        { name: 'payment_method', type: 'string', required: false, description: 'Filtrar por método de pagamento' },
        { name: 'status', type: 'string', required: false, description: 'Filtrar por status (pending, completed, etc.)' },
        { name: 'created[gte]', type: 'string', required: false, description: 'Data inicial (ISO 8601)' },
        { name: 'created[lte]', type: 'string', required: false, description: 'Data final (ISO 8601)' },
        { name: 'limit', type: 'integer', required: false, description: 'Limite de resultados (padrão: 10, máx: 100)' }
      ],
      example: {
        response: {
          data: [
            {
              id: 'ch_1234567890',
              amount: 10000,
              status: 'completed',
              payment_method: 'pix',
              customer_email: 'cliente@exemplo.com',
              created_at: '2024-10-15T10:30:00Z'
            }
          ],
          has_more: false,
          object: 'list'
        }
      },
      codeExample: `curl -X GET "https://api.ploutosledger.com/v1/charges?status=completed&limit=10" \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef"`
    },
    {
      method: 'GET',
      path: '/v1/charges/{charge_id}/status',
      description: 'Verificar status de uma cobrança',
      parameters: [
        { name: 'charge_id', type: 'string', required: true, description: 'ID da cobrança' }
      ],
      example: {
        response: {
          id: 'ch_1234567890',
          status: 'completed',
          updated_at: '2024-10-15T10:32:00Z',
          payment_confirmed_at: '2024-10-15T10:32:00Z'
        }
      },
      codeExample: `curl -X GET https://api.ploutosledger.com/v1/charges/ch_1234567890/status \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef"`
    },
    {
      method: 'POST',
      path: '/v1/webhook_endpoints',
      description: 'Criar um endpoint para receber webhooks',
      parameters: [
        { name: 'url', type: 'string', required: true, description: 'URL que receberá os webhooks' },
        { name: 'enabled_events', type: 'array', required: true, description: 'Eventos para escutar (ex: ["charge.completed", "charge.failed"])' },
        { name: 'description', type: 'string', required: false, description: 'Descrição do webhook' }
      ],
      example: {
        request: {
          url: 'https://seusite.com/webhook',
          enabled_events: ['charge.completed', 'charge.failed', 'charge.refunded'],
          description: 'Webhook principal'
        },
        response: {
          id: 'we_1234567890',
          url: 'https://seusite.com/webhook',
          secret: 'whsec_abc123...',
          enabled_events: ['charge.completed', 'charge.failed', 'charge.refunded'],
          created_at: '2024-10-15T10:00:00Z'
        }
      },
      codeExample: `curl -X POST https://api.ploutosledger.com/v1/webhook_endpoints \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://seusite.com/webhook",
    "enabled_events": ["charge.completed", "charge.failed"]
  }'`
    },
    {
      method: 'GET',
      path: '/v1/payment_methods',
      description: 'Listar métodos de pagamento disponíveis',
      parameters: [],
      example: {
        response: [
          {
            id: 'pix',
            name: 'PIX',
            type: 'pix',
            enabled: true,
            fee_percentage: 0.99,
            fee_fixed: 0,
            min_amount: 0.01,
            max_amount: 999999999.99,
            processing_time: 'instant'
          },
          {
            id: 'credit_card',
            name: 'Cartão de Crédito',
            type: 'credit_card',
            enabled: true,
            fee_percentage: 3.49,
            fee_fixed: 0.39,
            processing_time: '2-3 dias úteis'
          }
        ]
      },
      codeExample: `curl -X GET https://api.ploutosledger.com/v1/payment_methods \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef"`
    },
    {
      method: 'GET',
      path: '/v1/statistics/advanced',
      description: 'Obter estatísticas avançadas de pagamentos',
      parameters: [
        { name: 'period', type: 'string', required: false, description: 'Período (today, week, month, year)' }
      ],
      example: {
        response: {
          total_charges: 1247,
          total_amount: 125430.50,
          success_rate: 98.5,
          average_transaction: 803.40,
          payment_methods: {
            pix: { count: 89, amount: 45670.00, success_rate: 99.2 },
            credit_card: { count: 45, amount: 67890.50, success_rate: 94.8 }
          }
        }
      },
      codeExample: `curl -X GET "https://api.ploutosledger.com/v1/statistics/advanced?period=month" \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef"`
    }
  ];

  const copyToClipboard = async (code: string, endpoint: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(endpoint);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Documentação da API</h2>
              <p className="text-sm text-gray-600">PloutosLedger Payment Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-r p-6">
            <nav className="space-y-2">
              {[
                { id: 'overview', label: 'Visão Geral', icon: Globe },
                { id: 'authentication', label: 'Autenticação', icon: Key },
                { id: 'endpoints', label: 'Endpoints', icon: Code },
                { id: 'webhooks', label: 'Webhooks', icon: Webhook },
                { id: 'sdks', label: 'SDKs', icon: Terminal },
                { id: 'examples', label: 'Exemplos', icon: Play },
                { id: 'security', label: 'Segurança', icon: Shield }
              ].map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 p-6">
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-4">PloutosLedger API</h1>
                  <p className="text-lg text-gray-600 mb-6">
                    Uma API poderosa e completa para processamento de pagamentos, 
                    incluindo PIX, cartões, boletos e criptomoedas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Base URL</p>
                        <p className="text-xl font-bold">api.ploutosledger.com</p>
                        <p className="text-green-200 text-sm">HTTPS obrigatório</p>
                      </div>
                      <Globe className="w-8 h-8 text-green-200" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Versão Atual</p>
                        <p className="text-xl font-bold">v1</p>
                        <p className="text-blue-200 text-sm">2024-10-15</p>
                      </div>
                      <Zap className="w-8 h-8 text-blue-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recursos Principais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-bold">✓</span>
                      </div>
                      <span className="text-gray-700">PIX instantâneo</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">✓</span>
                      </div>
                      <span className="text-gray-700">Cartões de crédito/débito</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 font-bold">✓</span>
                      </div>
                      <span className="text-gray-700">Criptomoedas (BTC, ETH, USDT, BNB)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 font-bold">✓</span>
                      </div>
                      <span className="text-gray-700">Boletos bancários</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-600 font-bold">✓</span>
                      </div>
                      <span className="text-gray-700">Webhooks em tempo real</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-indigo-600 font-bold">✓</span>
                      </div>
                      <span className="text-gray-700">Reembolsos automáticos</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'authentication' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Autenticação</h1>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Chaves de API</h3>
                  <p className="text-gray-600 mb-4">
                    Todas as requisições devem incluir sua chave de API no header Authorization:
                  </p>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <code className="text-green-400 text-sm">
                      Authorization: Bearer pk_live_ploutosledger_1234567890abcdef
                    </code>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Chave Pública (Teste)</h4>
                    <div className="bg-gray-100 rounded p-3 mb-3">
                      <code className="text-sm">pk_test_ploutosledger_1234567890abcdef</code>
                    </div>
                    <p className="text-sm text-gray-600">
                      Use para desenvolvimento e testes. Não cobra valores reais.
                    </p>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Chave Pública (Produção)</h4>
                    <div className="bg-gray-100 rounded p-3 mb-3">
                      <code className="text-sm">pk_live_ploutosledger_1234567890abcdef</code>
                    </div>
                    <p className="text-sm text-gray-600">
                      Use para produção. Processa pagamentos reais.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'endpoints' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Endpoints da API</h1>
                
                <div className="space-y-4">
                  {endpoints.map((endpoint) => (
                    <div key={endpoint.path} className="border rounded-lg overflow-hidden">
                      <div 
                        className="p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => setExpandedEndpoint(
                          expandedEndpoint === endpoint.path ? null : endpoint.path
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                              {endpoint.method}
                            </span>
                            <code className="text-sm font-mono">{endpoint.path}</code>
                          </div>
                          {expandedEndpoint === endpoint.path ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{endpoint.description}</p>
                      </div>

                      {expandedEndpoint === endpoint.path && (
                        <div className="border-t p-4 bg-gray-50">
                          {endpoint.parameters && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-800 mb-2">Parâmetros</h4>
                              <div className="space-y-2">
                                {endpoint.parameters.map((param) => (
                                  <div key={param.name} className="flex items-center space-x-3 text-sm">
                                    <code className="bg-white px-2 py-1 rounded text-xs">{param.name}</code>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      param.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {param.type}
                                    </span>
                                    <span className="text-gray-600">{param.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {endpoint.example && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-800 mb-2">Exemplo</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {endpoint.example.request && (
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Requisição</h5>
                                    <div className="bg-gray-900 rounded p-3">
                                      <pre className="text-green-400 text-xs overflow-x-auto">
                                        {JSON.stringify(endpoint.example.request, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                {endpoint.example.response && (
                                  <div>
                                    <h5 className="text-sm font-medium text-gray-700 mb-2">Resposta</h5>
                                    <div className="bg-gray-900 rounded p-3">
                                      <pre className="text-blue-400 text-xs overflow-x-auto">
                                        {JSON.stringify(endpoint.example.response, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {endpoint.codeExample && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-gray-800">cURL</h4>
                                <button
                                  onClick={() => copyToClipboard(endpoint.codeExample!, endpoint.path)}
                                  className="px-3 py-1 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200 transition-colors"
                                >
                                  {copiedCode === endpoint.path ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                              <div className="bg-gray-900 rounded p-3">
                                <pre className="text-green-400 text-xs overflow-x-auto">
                                  {endpoint.codeExample}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'webhooks' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Webhooks</h1>
                
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuração</h3>
                  <p className="text-gray-600 mb-4">
                    Configure webhooks para receber notificações em tempo real sobre eventos de pagamento.
                  </p>
                  
                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <pre className="text-green-400 text-sm">
{`curl -X POST https://api.ploutosledger.com/v1/webhook_endpoints \\
  -H "Authorization: Bearer pk_live_ploutosledger_1234567890abcdef" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://seusite.com/webhook/ploutosledger",
    "enabled_events": [
      "charge.succeeded",
      "charge.failed",
      "payment_intent.succeeded",
      "payment_intent.payment_failed"
    ]
  }'`}
                    </pre>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Eventos Disponíveis</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>charge.succeeded</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>charge.failed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>payment_intent.succeeded</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>refund.created</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Segurança</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Sempre verifique a assinatura do webhook para garantir autenticidade:
                    </p>
                    <div className="bg-gray-100 rounded p-3">
                      <code className="text-xs">
                        X-PloutosLedger-Signature: t=1234567890,v1=abc123...
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'sdks' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">SDKs Oficiais</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-yellow-600 font-bold">JS</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">JavaScript</h3>
                        <p className="text-sm text-gray-600">Node.js & Browser</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-gray-100 rounded p-2">
                        <code>npm install @ploutosledger/payment-sdk</code>
                      </div>
                      <button className="w-full px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200 transition-colors">
                        Ver Documentação
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600 font-bold">PHP</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">PHP</h3>
                        <p className="text-sm text-gray-600">Composer Package</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-gray-100 rounded p-2">
                        <code>composer require ploutosledger/payment-sdk</code>
                      </div>
                      <button className="w-full px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200 transition-colors">
                        Ver Documentação
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-bold">PY</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">Python</h3>
                        <p className="text-sm text-gray-600">PIP Package</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-gray-100 rounded p-2">
                        <code>pip install ploutosledger-payment-sdk</code>
                      </div>
                      <button className="w-full px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200 transition-colors">
                        Ver Documentação
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'examples' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Exemplos Práticos</h1>
                
                <div className="space-y-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">E-commerce com PIX</h3>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`// Criar cobrança PIX
const charge = await ploutos.charges.create({
  amount: 10000, // R$ 100,00
  currency: 'brl',
  payment_method: 'pix',
  customer_email: 'cliente@exemplo.com',
  customer_name: 'João Silva',
  description: 'Compra de produto',
  webhook_url: 'https://seusite.com/webhook'
});

// Exibir QR Code
document.getElementById('qr-code').src = charge.qr_code;

// Verificar status
const status = await ploutos.charges.retrieve(charge.id);
if (status.status === 'completed') {
  // Pagamento confirmado
  window.location.href = '/success';
}`}
                      </pre>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Pagamento com Bitcoin</h3>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`// Criar cobrança Bitcoin
const charge = await ploutos.charges.create({
  amount: 10000, // R$ 100,00
  currency: 'brl',
  payment_method: 'bitcoin',
  customer_email: 'cliente@exemplo.com',
  customer_name: 'João Silva'
});

// Exibir endereço Bitcoin
document.getElementById('btc-address').textContent = charge.crypto_address;
document.getElementById('btc-amount').textContent = charge.crypto_amount + ' BTC';

// Monitorar confirmações
setInterval(async () => {
  const status = await ploutos.charges.retrieve(charge.id);
  if (status.confirmation_count >= status.required_confirmations) {
    // Pagamento confirmado
    window.location.href = '/success';
  }
}, 30000); // Verificar a cada 30 segundos`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-800">Segurança</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">PCI DSS Compliance</h3>
                    <p className="text-gray-600 mb-4">
                      O PloutosLedger é certificado PCI DSS Level 1, o mais alto nível de segurança para processamento de pagamentos.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Criptografia de ponta a ponta</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Tokenização de dados sensíveis</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Auditoria de segurança regular</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Rate Limiting</h3>
                    <p className="text-gray-600 mb-4">
                      Proteção contra abuso com limites de requisições por minuto.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Requisições por minuto:</span>
                        <span className="font-bold">100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Burst limit:</span>
                        <span className="font-bold">200</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reset period:</span>
                        <span className="font-bold">60s</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-800">Importante</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Nunca exponha suas chaves secretas no frontend. Use apenas chaves públicas 
                        em aplicações client-side e mantenha as chaves secretas no backend.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiDocumentation;
