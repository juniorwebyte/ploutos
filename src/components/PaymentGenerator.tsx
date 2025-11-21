import React, { useState } from 'react';
import { 
  CreditCard, 
  Copy, 
  Check, 
  Download, 
  Share2, 
  QrCode,
  DollarSign,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Clock,
  ExternalLink,
  Send,
  X
} from 'lucide-react';
import paymentGatewayService from '../services/paymentGatewayService';

interface PaymentGeneratorProps {
  onClose: () => void;
}

function PaymentGenerator({ onClose }: PaymentGeneratorProps) {
  const [step, setStep] = useState<'form' | 'generated' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generatedPayment, setGeneratedPayment] = useState<any>(null);

  const [formData, setFormData] = useState({
    amount: '',
    currency: 'BRL',
    payment_method: 'pix',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    description: '',
    webhook_url: '',
    metadata: ''
  });

  const paymentMethods = [
    { id: 'pix', name: 'PIX', icon: '📱', description: 'Pagamento instantâneo' },
    { id: 'credit_card', name: 'Cartão de Crédito', icon: '💳', description: 'Visa, Mastercard, Elo' },
    { id: 'debit_card', name: 'Cartão de Débito', icon: '💳', description: 'Débito online' },
    { id: 'boleto', name: 'Boleto Bancário', icon: '📄', description: 'Válido por 3 dias' },
    { id: 'usdt', name: 'USDT (Tether)', icon: '₮', description: 'Criptomoeda estável' },
    { id: 'bitcoin', name: 'Bitcoin (BTC)', icon: '₿', description: 'Criptomoeda principal' },
    { id: 'ethereum', name: 'Ethereum (ETH)', icon: 'Ξ', description: 'Smart contracts' },
    { id: 'bnb', name: 'BNB (Binance)', icon: '🟡', description: 'Binance Smart Chain' }
  ];

  const currencies = [
    { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$' },
    { code: 'USD', name: 'Dólar Americano', symbol: '$' },
    { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
    { code: 'USDT', name: 'Tether', symbol: '₮' },
    { code: 'BNB', name: 'Binance Coin', symbol: '🟡' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generatePayment = async () => {
    if (!formData.amount || !formData.customer_name || !formData.customer_email) {
      alert('Preencha os campos obrigatórios: Valor, Nome e E-mail');
      return;
    }

    setLoading(true);
    try {
      const invoiceData = {
        amount: Math.round(parseFloat(formData.amount) * 100), // Converter para centavos
        currency: formData.currency.toLowerCase(),
        payment_method: formData.payment_method,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        description: formData.description || `Pagamento de ${formData.customer_name}`,
        webhook_url: formData.webhook_url || undefined,
        metadata: formData.metadata ? JSON.parse(formData.metadata) : undefined
      };

      // Usar LinkInvoice para gerar cobrança completa
      const linkInvoice = await paymentGatewayService.createLinkInvoice(invoiceData);
      setGeneratedPayment(linkInvoice);
      setStep('generated');
    } catch (error) {
      console.error('Erro ao gerar LinkInvoice:', error);
      alert('Erro ao gerar LinkInvoice. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(type);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const sharePayment = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LinkInvoice PloutosLedger',
        text: `Pagamento de R$ ${formData.amount} para ${formData.customer_name}`,
        url: generatedPayment?.payment_url || generatedPayment?.charge?.linkinvoice_url || window.location.href
      });
    } else {
      copyToClipboard(generatedPayment?.payment_url || generatedPayment?.charge?.linkinvoice_url || '', 'share');
    }
  };

  const downloadQRCode = () => {
    const qrCode = generatedPayment?.qr_codes?.pix || generatedPayment?.qr_codes?.crypto;
    if (qrCode) {
      const link = document.createElement('a');
      link.href = qrCode;
      link.download = `qr-code-linkinvoice-${generatedPayment?.charge?.id}.png`;
      link.click();
    }
  };

  const sendPaymentLink = () => {
    const paymentUrl = generatedPayment?.payment_url || generatedPayment?.charge?.linkinvoice_url;
    const message = `Olá ${formData.customer_name}! 

Você tem um LinkInvoice pendente de R$ ${formData.amount}.

${formData.description ? `Descrição: ${formData.description}` : ''}

LinkInvoice: ${paymentUrl}

PloutosLedger - Gateway de Pagamento`;

    const whatsappUrl = `https://wa.me/55${formData.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Gerador de Pagamentos</h2>
              <p className="text-sm text-gray-600">Crie cobranças para qualquer pessoa</p>
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
          {step === 'form' && (
            <div className="space-y-6">
              {/* Informações do Pagamento */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações do Pagamento</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="100.00"
                      />
                      <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Moeda
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pagamento *
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => handleInputChange('payment_method', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.icon} {method.name} - {method.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ex: Pagamento de serviços"
                    />
                  </div>
                </div>
              </div>

              {/* Informações do Cliente */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações do Cliente</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.customer_name}
                        onChange={(e) => handleInputChange('customer_name', e.target.value)}
                        className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="João Silva"
                      />
                      <User className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.customer_email}
                        onChange={(e) => handleInputChange('customer_email', e.target.value)}
                        className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="joao@exemplo.com"
                      />
                      <Mail className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone (WhatsApp)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={formData.customer_phone}
                        onChange={(e) => handleInputChange('customer_phone', e.target.value)}
                        className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="(11) 99999-9999"
                      />
                      <Phone className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={formData.webhook_url}
                      onChange={(e) => handleInputChange('webhook_url', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="https://seusite.com/webhook"
                    />
                  </div>
                </div>
              </div>

              {/* Configurações Avançadas */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações Avançadas</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metadata (JSON)
                  </label>
                  <textarea
                    value={formData.metadata}
                    onChange={(e) => handleInputChange('metadata', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder='{"order_id": "12345", "product": "Serviço"}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dados adicionais em formato JSON (opcional)
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={generatePayment}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Gerar Pagamento</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'generated' && generatedPayment && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">LinkInvoice Gerado com Sucesso!</h3>
                <p className="text-gray-600">ID da cobrança: <span className="font-mono text-sm">{generatedPayment.charge?.id}</span></p>
                <p className="text-gray-600">LinkInvoice ID: <span className="font-mono text-sm">{generatedPayment.charge?.linkinvoice_id}</span></p>
                <div className="mt-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm inline-block">
                  ✓ Baixa Automática Ativada
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* QR Codes */}
                {(generatedPayment.qr_codes?.pix || generatedPayment.qr_codes?.crypto) && (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">QR Codes de Pagamento</h4>
                    
                    {generatedPayment.qr_codes?.pix && (
                      <div className="mb-6">
                        <h5 className="text-md font-medium text-gray-700 mb-2">PIX</h5>
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <img 
                            src={generatedPayment.qr_codes.pix} 
                            alt="QR Code PIX" 
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                      </div>
                    )}
                    
                    {generatedPayment.qr_codes?.crypto && (
                      <div>
                        <h5 className="text-md font-medium text-gray-700 mb-2">Criptomoeda</h5>
                        <div className="bg-white rounded-lg p-4 mb-4">
                          <img 
                            src={generatedPayment.qr_codes.crypto} 
                            alt="QR Code Crypto" 
                            className="w-48 h-48 mx-auto"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={downloadQRCode}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Baixar QR</span>
                      </button>
                      <button
                        onClick={() => copyToClipboard(generatedPayment.qr_codes?.pix || generatedPayment.qr_codes?.crypto || '', 'qr')}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                      >
                        {copiedCode === 'qr' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Informações do Pagamento */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Detalhes do Pagamento</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor:</span>
                      <span className="font-bold text-lg">R$ {(generatedPayment.charge?.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">{generatedPayment.charge?.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">E-mail:</span>
                      <span className="font-medium">{generatedPayment.charge?.customer_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Método:</span>
                      <span className="font-medium capitalize">{generatedPayment.charge?.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        generatedPayment.charge?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        generatedPayment.charge?.status === 'completed' ? 'bg-green-100 text-green-800' :
                        generatedPayment.charge?.status === 'captured' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {generatedPayment.charge?.status === 'pending' ? 'Pendente' :
                         generatedPayment.charge?.status === 'completed' ? 'Pago' :
                         generatedPayment.charge?.status === 'captured' ? 'Capturado' : generatedPayment.charge?.status}
                      </span>
                    </div>
                    {generatedPayment.charge?.processing_fee && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxa:</span>
                        <span className="font-medium text-red-600">R$ {generatedPayment.charge.processing_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {generatedPayment.charge?.net_amount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valor Líquido:</span>
                        <span className="font-bold text-green-600">R$ {generatedPayment.charge.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {generatedPayment.charge?.crypto_address && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm font-medium text-purple-800 mb-2">Endereço de Criptomoeda:</p>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-white px-2 py-1 rounded flex-1">{generatedPayment.charge.crypto_address}</code>
                          <button
                            onClick={() => copyToClipboard(generatedPayment.charge.crypto_address, 'crypto')}
                            className="px-2 py-1 bg-purple-100 text-purple-600 rounded hover:bg-purple-200 transition-colors"
                          >
                            {copiedCode === 'crypto' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        {generatedPayment.charge.crypto_amount && (
                          <p className="text-sm text-purple-600 mt-2">
                            Valor: {generatedPayment.charge.crypto_amount} {generatedPayment.charge.payment_method.toUpperCase()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instruções de Pagamento */}
              {generatedPayment.instructions && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-800 mb-4">{generatedPayment.instructions.title}</h4>
                  
                  <div className="space-y-2 mb-4">
                    {generatedPayment.instructions.steps.map((step: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <p className="text-blue-700">{step}</p>
                      </div>
                    ))}
                  </div>
                  
                  {generatedPayment.instructions.additional_info && (
                    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">{generatedPayment.instructions.additional_info}</p>
                    </div>
                  )}
                  
                  {generatedPayment.instructions.crypto_details && (
                    <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                      <h5 className="font-medium text-purple-800 mb-2">Detalhes da Criptomoeda:</h5>
                      <div className="space-y-1 text-sm text-purple-700">
                        <p><strong>Rede:</strong> {generatedPayment.instructions.crypto_details.network}</p>
                        <p><strong>Confirmações:</strong> {generatedPayment.instructions.crypto_details.confirmations_needed}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ações */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Ações Disponíveis</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button
                    onClick={() => copyToClipboard(generatedPayment.payment_url || generatedPayment.charge?.linkinvoice_url || '', 'link')}
                    className="p-4 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    {copiedCode === 'link' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    <span>Copiar LinkInvoice</span>
                  </button>

                  <button
                    onClick={sharePayment}
                    className="p-4 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Compartilhar</span>
                  </button>

                  {formData.customer_phone && (
                    <button
                      onClick={sendPaymentLink}
                      className="p-4 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Send className="w-5 h-5" />
                      <span>Enviar WhatsApp</span>
                    </button>
                  )}

                  <button
                    onClick={() => window.open(generatedPayment.payment_url || generatedPayment.charge?.linkinvoice_url, '_blank')}
                    className="p-4 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>Abrir LinkInvoice</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setStep('form')}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Gerar Outro
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
                >
                  Concluir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentGenerator;
