import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  ExternalLink, 
  Settings, 
  Key, 
  Webhook,
  Download,
  Upload,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface EcommerceConfigProps {
  onClose: () => void;
}

interface IntegrationCode {
  language: string;
  code: string;
  description: string;
}

function EcommerceConfig({ onClose }: EcommerceConfigProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiKey, setApiKey] = useState('pk_live_ploutosledger_1234567890abcdef');
  const [webhookUrl, setWebhookUrl] = useState('https://seusite.com/webhook/ploutosledger');
  const [webhookSecret, setWebhookSecret] = useState('whsec_ploutosledger_secret_key');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const integrationCodes: IntegrationCode[] = [
    {
      language: 'JavaScript',
      code: `// Instalação via NPM
npm install @ploutosledger/payment-sdk

// Configuração
import { PloutosLedger } from '@ploutosledger/payment-sdk';

const ploutos = new PloutosLedger({
  apiKey: '${apiKey}',
  environment: 'production' // ou 'sandbox' para testes
});

// Criar pagamento
const payment = await ploutos.payments.create({
  amount: 10000, // R$ 100,00 em centavos
  currency: 'BRL',
  customer: {
    name: 'João Silva',
    email: 'joao@exemplo.com'
  },
  description: 'Pagamento do pedido #123',
  webhook_url: '${webhookUrl}'
});

// Redirecionar para pagamento
window.location.href = payment.payment_url;`,
      description: 'SDK oficial para JavaScript/Node.js'
    },
    {
      language: 'PHP',
      code: `<?php
// Instalação via Composer
composer require ploutosledger/payment-sdk

// Configuração
use PloutosLedger\\PaymentSDK\\PloutosLedger;

$ploutos = new PloutosLedger([
    'api_key' => '${apiKey}',
    'environment' => 'production'
]);

// Criar pagamento
$payment = $ploutos->payments()->create([
    'amount' => 10000, // R$ 100,00 em centavos
    'currency' => 'BRL',
    'customer' => [
        'name' => 'João Silva',
        'email' => 'joao@exemplo.com'
    ],
    'description' => 'Pagamento do pedido #123',
    'webhook_url' => '${webhookUrl}'
]);

// Redirecionar para pagamento
header('Location: ' . $payment['payment_url']);`,
      description: 'SDK oficial para PHP'
    },
    {
      language: 'Python',
      code: `# Instalação via PIP
pip install ploutosledger-payment-sdk

# Configuração
from ploutosledger import PloutosLedger

ploutos = PloutosLedger(
    api_key='${apiKey}',
    environment='production'
)

# Criar pagamento
payment = ploutos.payments.create({
    'amount': 10000,  # R$ 100,00 em centavos
    'currency': 'BRL',
    'customer': {
        'name': 'João Silva',
        'email': 'joao@exemplo.com'
    },
    'description': 'Pagamento do pedido #123',
    'webhook_url': '${webhookUrl}'
})

# Redirecionar para pagamento
return redirect(payment['payment_url'])`,
      description: 'SDK oficial para Python'
    },
    {
      language: 'cURL',
      code: `# Criar pagamento via API REST
curl -X POST https://api.ploutosledger.com/v1/payments \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 10000,
    "currency": "BRL",
    "customer": {
      "name": "João Silva",
      "email": "joao@exemplo.com"
    },
    "description": "Pagamento do pedido #123",
    "webhook_url": "${webhookUrl}"
  }'`,
      description: 'Integração via API REST'
    }
  ];

  const copyToClipboard = async (code: string, language: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(language);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const generateNewApiKey = () => {
    const newKey = 'pk_live_ploutosledger_' + Math.random().toString(36).substr(2, 20);
    setApiKey(newKey);
  };

  const generateNewWebhookSecret = () => {
    const newSecret = 'whsec_ploutosledger_' + Math.random().toString(36).substr(2, 20);
    setWebhookSecret(newSecret);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Configuração para E-commerce</h2>
              <p className="text-sm text-gray-600">Integre o PloutosLedger ao seu site</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Settings },
              { id: 'credentials', label: 'Credenciais', icon: Key },
              { id: 'integration', label: 'Integração', icon: Code },
              { id: 'webhooks', label: 'Webhooks', icon: Webhook },
              { id: 'testing', label: 'Testes', icon: Shield }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Conteúdo das Tabs */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Taxa PIX</p>
                      <p className="text-3xl font-bold">0.99%</p>
                      <p className="text-green-200 text-sm">Processamento instantâneo</p>
                    </div>
                    <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Taxa Cartão</p>
                      <p className="text-3xl font-bold">3.49%</p>
                      <p className="text-blue-200 text-sm">+ R$ 0,39</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💳</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Taxa Boleto</p>
                      <p className="text-3xl font-bold">R$ 2,50</p>
                      <p className="text-purple-200 text-sm">Taxa fixa</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-400/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📄</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recursos Inclusos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Processamento em tempo real</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Webhooks automáticos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Relatórios detalhados</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Suporte 24/7</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">PCI DSS Compliance</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Anti-fraude integrado</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Chaves de API</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chave Pública (Public Key)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={apiKey}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(apiKey, 'apiKey')}
                        className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        {copiedCode === 'apiKey' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={generateNewApiKey}
                        className="px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        Regenerar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use esta chave no frontend (JavaScript, HTML)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chave Secreta (Secret Key)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="password"
                        value="sk_live_ploutosledger_****************"
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                        Revelar
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      ⚠️ Mantenha esta chave segura. Use apenas no backend
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Ambiente de Produção</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Suas chaves estão configuradas para produção. Todas as transações serão reais e cobradas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integration' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Códigos de Integração</h3>
                  <div className="space-y-3">
                    {integrationCodes.map((item) => (
                      <button
                        key={item.language}
                        onClick={() => copyToClipboard(item.code, item.language)}
                        className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-800">{item.language}</p>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          {copiedCode === item.language ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Código Selecionado</h3>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>{integrationCodes[0].code}</code>
                    </pre>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar SDK
                    </button>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Documentação
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuração de Webhooks</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL do Webhook
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://seusite.com/webhook/ploutosledger"
                      />
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Testar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secret do Webhook
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={webhookSecret}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                      />
                      <button
                        onClick={() => copyToClipboard(webhookSecret, 'webhookSecret')}
                        className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        {copiedCode === 'webhookSecret' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={generateNewWebhookSecret}
                        className="px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        Regenerar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Eventos Disponíveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-blue-700">payment.created</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-blue-700">payment.completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-blue-700">payment.failed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-blue-700">payment.refunded</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'testing' && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ambiente de Teste</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h4 className="font-medium text-gray-800">Modo Sandbox</h4>
                      <p className="text-sm text-gray-600">Teste sem cobrança real</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Ativar
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h4 className="font-medium text-gray-800">Cartões de Teste</h4>
                      <p className="text-sm text-gray-600">Use cartões específicos para testes</p>
                    </div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      Ver Cartões
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div>
                      <h4 className="font-medium text-gray-800">Simulador PIX</h4>
                      <p className="text-sm text-gray-600">Simule pagamentos PIX</p>
                    </div>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      Abrir Simulador
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">Teste Completo</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Todos os recursos estão disponíveis para teste. Nenhuma cobrança será feita no modo sandbox.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EcommerceConfig;
