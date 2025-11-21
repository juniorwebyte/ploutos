import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  ArrowLeft, 
  Shield, 
  Lock,
  Clock,
  Star,
  Zap,
  Crown,
  QrCode,
  Copy,
  Check,
  Download,
  Smartphone
} from 'lucide-react';
import { PlanRecord } from '../services/plansService';
import { useAuth } from '../contexts/AuthContext';
import pixService from '../services/pixService';
import { PixCobranca } from '../types';
import { formatPhone, formatCPF, formatCreditCard, formatDate, unformatPhone, unformatCPF, unformatCreditCard, unformatDate } from '../utils/formatters';

interface PaymentPageProps {
  selectedPlan: PlanRecord;
  onBack: () => void;
  onSuccess: (plan: PlanRecord) => void;
}

export default function PaymentPage({ selectedPlan, onBack, onSuccess }: PaymentPageProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'pix' | 'boleto'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    email: user || '',
    phone: '',
    cpf: '',
    name: user || '',
    company: ''
  });
  
  // Estados para PIX
  const [cobranca, setCobranca] = useState<PixCobranca | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const pixAmount = selectedPlan.priceCents / 100;

  // Gerar cobrança PIX
  useEffect(() => {
    if (paymentMethod === 'pix') {
      gerarCobrancaPIX();
    }
  }, [paymentMethod, selectedPlan]);

  const gerarCobrancaPIX = async () => {
    setPixLoading(true);
    setPixError(null);
    try {
      const title = `Assinatura ${selectedPlan.name} (${selectedPlan.interval === 'monthly' ? 'Mensal' : 'Anual'})`;
      const novaCobranca = await pixService.criarCobranca(
        pixAmount,
        {
          name: paymentData.name,
          email: paymentData.email,
          phone: paymentData.phone,
          company: paymentData.company
        },
        title
      );
      setCobranca(novaCobranca);
      setQrCodeDataUrl(novaCobranca.qrCodeImage);
      
      // Agendar renovação do QR em 5 minutos
      const ms = new Date(novaCobranca.dataExpiracao).getTime() - Date.now();
      setTimeout(() => {
        if (paymentMethod === 'pix') gerarCobrancaPIX();
      }, Math.max(1000, ms));
      
      setExpiresIn(Math.max(0, Math.floor(ms / 1000)));
      
      // Contador regressivo de expiração
      const timer = setInterval(() => {
        setExpiresIn(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
      setTimeout(() => clearInterval(timer), Math.max(1000, ms));
      
      // Validação extra: garantir que a imagem do QR foi gerada
      const valido = await pixService.validarQRCodePIX(novaCobranca.qrCode);
      if (!valido) {
        setPixError('Não foi possível gerar o QR Code. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao gerar cobrança PIX:', err);
      setPixError('Erro ao gerar cobrança PIX. Verifique sua conexão e tente novamente.');
    } finally {
      setPixLoading(false);
    }
  };

  const handleRetry = () => {
    gerarCobrancaPIX();
  };

  const handleCopyPixKey = async () => {
    if (!cobranca) return;
    try {
      await navigator.clipboard.writeText(cobranca.chave);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(pixAmount.toFixed(2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleDownloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `qrcode-pix-${selectedPlan.name}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePayment = async () => {
    if (paymentMethod === 'pix') {
      // Para PIX, o pagamento é processado quando a cobrança é confirmada
      // Aqui apenas verificamos se há uma cobrança válida
      if (!cobranca) {
        setPixError('Por favor, aguarde a geração do QR Code.');
        return;
      }
      // O pagamento PIX será processado automaticamente quando confirmado
      // Por enquanto, simulamos sucesso após 3 segundos
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 3000));
      setIsProcessing(false);
      // Continuar com o processamento normal
    } else {
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Simular sucesso do pagamento
    const success = Math.random() > 0.1; // 90% de chance de sucesso
    
    if (success) {
      // Ativar licença do usuário
      const licenseData = {
        userId: user || 'user_' + Date.now(),
        username: user || 'Usuário',
        email: paymentData.email,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        status: 'active',
        features: selectedPlan.featuresList || [selectedPlan.features]
      };
      
      // Salvar licença no localStorage - COM CHAVE GERADA CORRETAMENTE
      const existingLicenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
      
      // Verificar se já existe licença para este usuário
      const existingLicenseIndex = existingLicenses.findIndex((l: any) => 
        (l.username === user || l.userId === user || l.email === paymentData.email)
      );
      
      const expiresAt = new Date();
      // Licença mensal: 30 dias a partir de hoje
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      if (existingLicenseIndex >= 0) {
        // Renovar licença existente
        const existingLicense = existingLicenses[existingLicenseIndex];
        existingLicenses[existingLicenseIndex] = {
          ...existingLicense,
          status: 'active',
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          expiresAt: expiresAt.toISOString(),
          validUntil: expiresAt.toISOString(),
          lastUsed: new Date().toISOString(),
          features: selectedPlan.featuresList || [selectedPlan.features],
          metadata: { 
            ...existingLicense.metadata,
            source: 'payment', 
            plan: selectedPlan.name, 
            paymentMethod: paymentMethod,
            renewedAt: new Date().toISOString()
          }
        };
      } else {
        // Criar nova licença
        const licenseKey = `PLOUTOS-${Date.now()}-${Math.random().toString(36).slice(2,9).toUpperCase()}`;
        const newLicense = {
          ...licenseData,
          id: `lic_${Date.now()}`,
          key: licenseKey,
          username: user || 'Usuário',
          validUntil: expiresAt.toISOString(),
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          lastUsed: new Date().toISOString(),
          usageCount: 0,
          maxUsage: selectedPlan.maxUsers === -1 ? -1 : selectedPlan.maxUsers * 10,
          metadata: { source: 'payment', plan: selectedPlan.name, paymentMethod: paymentMethod }
        };
        existingLicenses.push(newLicense);
      }
      
      localStorage.setItem('ploutos_licenses', JSON.stringify(existingLicenses));
      
      // Obter a chave da licença (nova ou existente)
      const finalLicense = existingLicenseIndex >= 0 
        ? existingLicenses[existingLicenseIndex] 
        : existingLicenses[existingLicenses.length - 1];
      const licenseKey = finalLicense?.key || `PLOUTOS-${Date.now()}-${Math.random().toString(36).slice(2,9).toUpperCase()}`;
      
      // Também atualizar o usuário com a licença
      const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
      const userIndex = storedUsers.findIndex((u: any) => u.username === user || u.email === paymentData.email);
      if (userIndex >= 0) {
        storedUsers[userIndex] = {
          ...storedUsers[userIndex],
          licenseKey: licenseKey,
          licenseStatus: 'active',
          planId: selectedPlan.id,
          planName: selectedPlan.name
        };
        localStorage.setItem('ploutos_users', JSON.stringify(storedUsers));
      }
      
      console.log('✅ Licença criada/renovada para pagamento:', { licenseKey, username: user, plan: selectedPlan.name, expiresAt: expiresAt.toISOString() });
      
      // Gerar nota fiscal automática
      const notaFiscal = generateNotaFiscal(selectedPlan, paymentData);
      saveNotaFiscal(notaFiscal);
      
      onSuccess(selectedPlan);
    } else {
      alert('Erro no processamento do pagamento. Tente novamente.');
    }
    
    setIsProcessing(false);
  };

  // Gerar nota fiscal automática
  const generateNotaFiscal = (plan: PlanRecord, paymentData: any) => {
    const today = new Date();
    const notaNumber = `NF${Date.now().toString().slice(-6)}`;
    
    return {
      id: `nota_${Date.now()}`,
      dataEntrada: today.toISOString().split('T')[0],
      fabricacao: today.toISOString().split('T')[0],
      numeroNfe: notaNumber,
      total: plan.priceCents / 100,
      totalParcelas: 1,
      valorParcela: plan.priceCents / 100,
      parcelas: [{
        id: `parcela_${Date.now()}`,
        numeroParcela: 1,
        valor: plan.priceCents / 100,
        dataVencimento: today.toISOString().split('T')[0],
        status: 'paga' as const,
        dataPagamento: today.toISOString().split('T')[0],
        observacoes: `Pagamento do plano ${plan.name} - ${paymentData.email}`
      }],
      status: 'quitada' as const,
      observacoes: `Nota fiscal gerada automaticamente para assinatura do plano ${plan.name}. Cliente: ${paymentData.email}`,
      dataCriacao: today.toISOString(),
      dataAtualizacao: today.toISOString()
    };
  };

  // Salvar nota fiscal
  const saveNotaFiscal = (notaFiscal: any) => {
    const existingNotas = JSON.parse(localStorage.getItem('ploutos_notas_fiscais') || '[]');
    existingNotas.push(notaFiscal);
    localStorage.setItem('ploutos_notas_fiscais', JSON.stringify(existingNotas));
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(cents / 100);
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'basic': return <Zap className="h-6 w-6" />;
      case 'starter': return <Star className="h-6 w-6" />;
      case 'pro': return <Crown className="h-6 w-6" />;
      default: return <CreditCard className="h-6 w-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-3 sm:py-4">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header Ultra Compacto */}
        <div className="mb-3 sm:mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-800 transition-colors mb-2 text-xs sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Voltar</span>
          </button>
          
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">Finalizar Assinatura</h1>
          <p className="text-xs sm:text-sm text-gray-600">Complete seu pagamento</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Resumo do Plano - Ultra Compacto e Bonito */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 border border-gray-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Resumo</h2>
            
            <div className="bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-lg p-3 sm:p-4 text-white mb-3 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  {getPlanIcon(selectedPlan.name)}
                  <h3 className="text-base sm:text-lg font-bold">{selectedPlan.name}</h3>
                  {selectedPlan.isRecommended && (
                    <span className="bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold animate-pulse">
                      ⭐ POPULAR
                    </span>
                  )}
                </div>
                
                <div className="text-xl sm:text-2xl font-bold mb-1">
                  {formatCurrency(selectedPlan.priceCents)}
                  <span className="text-sm sm:text-base font-normal text-blue-100">
                    /{selectedPlan.interval === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </div>
                
                <p className="text-blue-100 text-[10px] sm:text-xs">{selectedPlan.description}</p>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm">Incluído:</h4>
              <ul className="space-y-1">
                {selectedPlan.featuresList && selectedPlan.featuresList.length > 0 ? (
                  selectedPlan.featuresList.map((feature, index) => (
                    <li key={index} className="flex items-center gap-1.5 text-gray-700 text-xs sm:text-sm">
                      <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))
                ) : (
                  <li className="flex items-center gap-1.5 text-gray-700 text-xs sm:text-sm">
                    <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500 flex-shrink-0" />
                    <span>{selectedPlan.features}</span>
                  </li>
                )}
              </ul>
            </div>

            <div className="p-2 sm:p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-1.5 text-green-800 mb-0.5">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="font-semibold text-xs sm:text-sm">Garantia 30 dias</span>
              </div>
              <p className="text-green-700 text-[10px] sm:text-xs leading-tight">
                Cancele e receba reembolso total
              </p>
            </div>
          </div>

          {/* Formulário de Pagamento - Ultra Compacto e Bonito */}
          <div className="bg-white rounded-lg sm:rounded-xl shadow-md sm:shadow-lg p-3 sm:p-4 border border-gray-100">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Pagamento</h2>

            {/* Métodos de Pagamento */}
            <div className="mb-3">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Método</h3>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  onClick={() => setPaymentMethod('credit')}
                  className={`p-2 rounded-lg border-2 transition-all transform hover:scale-105 ${
                    paymentMethod === 'credit'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <CreditCard className={`h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 ${paymentMethod === 'credit' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="text-[10px] sm:text-xs font-medium">Cartão</span>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-2 rounded-lg border-2 transition-all transform hover:scale-105 ${
                    paymentMethod === 'pix'
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-100 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className={`h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 ${paymentMethod === 'pix' ? 'bg-green-500' : 'bg-gray-400'} rounded flex items-center justify-center`}>
                    <span className="text-white text-[8px] sm:text-[10px] font-bold">PIX</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium">PIX</span>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('boleto')}
                  className={`p-2 rounded-lg border-2 transition-all transform hover:scale-105 ${
                    paymentMethod === 'boleto'
                      ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-100 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className={`h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 ${paymentMethod === 'boleto' ? 'bg-orange-500' : 'bg-gray-400'} rounded flex items-center justify-center`}>
                    <span className="text-white text-[8px] sm:text-[10px] font-bold">B</span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium">Boleto</span>
                </button>
              </div>
            </div>

            {/* Seção PIX com QR Code - Ultra Compacta e Bonita */}
            {paymentMethod === 'pix' && (
              <div className="mb-3 p-3 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-lg border-2 border-green-300 shadow-sm">
                <div className="flex flex-col lg:flex-row gap-3 items-start">
                  {/* QR Code */}
                  <div className="flex-shrink-0 mx-auto lg:mx-0">
                    <div className="bg-white p-2 rounded-lg border-2 border-green-400 shadow-lg relative">
                      {pixLoading ? (
                        <div className="w-32 h-32 sm:w-36 sm:h-36 bg-gray-100 rounded-lg flex items-center justify-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : qrCodeDataUrl ? (
                        <img 
                          src={qrCodeDataUrl} 
                          alt="QR Code PIX" 
                          className="w-32 h-32 sm:w-36 sm:h-36"
                        />
                      ) : (
                        <div className="w-32 h-32 sm:w-36 sm:h-36 bg-gray-100 rounded-lg flex items-center justify-center">
                          <QrCode className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    {qrCodeDataUrl && (
                      <button
                        onClick={handleDownloadQRCode}
                        className="w-full mt-1.5 text-[10px] sm:text-xs text-green-700 hover:text-green-800 flex items-center justify-center gap-1 font-medium"
                      >
                        <Download className="w-3 h-3" />
                        Baixar
                      </button>
                    )}
                    {!pixLoading && pixError && (
                      <div className="mt-1.5 text-[10px] sm:text-xs text-red-600 bg-red-50 p-1.5 rounded">
                        {pixError}
                        <button onClick={handleRetry} className="ml-1 underline font-medium">Tentar</button>
                      </div>
                    )}
                  </div>

                  {/* Informações PIX - Ultra Compactas */}
                  <div className="flex-1 space-y-2 w-full">
                    {expiresIn > 0 && (
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold shadow-md">
                        ⏱️ {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">
                        Chave PIX:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={cobranca?.chave || 'Carregando...'}
                          readOnly
                          className="flex-1 px-2.5 py-1.5 border-2 border-green-300 rounded-lg text-[10px] sm:text-xs font-mono bg-white font-semibold"
                        />
                        <button
                          onClick={handleCopyPixKey}
                          disabled={!cobranca}
                          className="px-2.5 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md"
                          title="Copiar"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">
                        Valor:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={`R$ ${pixAmount.toFixed(2).replace('.', ',')}`}
                          readOnly
                          className="flex-1 px-2.5 py-1.5 border-2 border-green-300 rounded-lg text-sm sm:text-base font-bold bg-white text-green-700"
                        />
                        <button
                          onClick={handleCopyAmount}
                          className="px-2.5 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center shadow-md"
                          title="Copiar"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-2">
                      <div className="flex items-start gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-[10px] sm:text-xs text-blue-800 leading-tight">
                          <strong className="block mb-0.5">Instruções:</strong>
                          <ol className="list-decimal list-inside space-y-0 text-[9px] sm:text-[10px]">
                            <li>Abra o app do banco</li>
                            <li>Escaneie ou copie a chave</li>
                            <li>Confirme e pague</li>
                            <li>Confirmação automática</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Formulário de Dados - Ultra Compacto */}
            <div className="space-y-2">
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={paymentData.name}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={paymentData.email}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm"
                  required
                />
              </div>

              {paymentMethod === 'credit' && (
                <>
                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={formatCreditCard(paymentData.cardNumber)}
                      onChange={(e) => {
                        const unformatted = unformatCreditCard(e.target.value);
                        setPaymentData(prev => ({ ...prev, cardNumber: unformatted }));
                      }}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm"
                      required
                      maxLength={19}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                        Validade
                      </label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        value={paymentData.expiryDate.length <= 2 ? paymentData.expiryDate : `${paymentData.expiryDate.slice(0, 2)}/${paymentData.expiryDate.slice(2, 4)}`}
                        onChange={(e) => {
                          const numbers = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPaymentData(prev => ({ ...prev, expiryDate: numbers }));
                        }}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm"
                        required
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={(e) => {
                          const numbers = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPaymentData(prev => ({ ...prev, cvv: numbers }));
                        }}
                        className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm"
                        required
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                      Nome no Cartão
                    </label>
                    <input
                      type="text"
                      placeholder="João Silva"
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cardName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm"
                      required
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formatPhone(paymentData.phone)}
                    onChange={(e) => {
                      const unformatted = unformatPhone(e.target.value);
                      setPaymentData(prev => ({ ...prev, phone: unformatted }));
                    }}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formatCPF(paymentData.cpf)}
                    onChange={(e) => {
                      const unformatted = unformatCPF(e.target.value);
                      setPaymentData(prev => ({ ...prev, cpf: unformatted }));
                    }}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-xs sm:text-sm"
                    required
                    maxLength={14}
                  />
                </div>
              </div>
            </div>

            {/* Botão de Pagamento - Ultra Compacto e Bonito */}
            {paymentMethod === 'pix' ? (
              <div className="mt-3 p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
                <p className="text-[10px] sm:text-xs text-green-800 text-center font-medium leading-tight">
                  💳 Aguarde confirmação automática após o pagamento
                </p>
              </div>
            ) : (
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full mt-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-2.5 sm:py-3 rounded-lg font-bold hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Pagar {formatCurrency(selectedPlan.priceCents)}</span>
                  </>
                )}
              </button>
            )}

            <div className="mt-2 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-500 text-[9px] sm:text-[10px]">
                <Shield className="h-3 w-3" />
                <span>100% seguro e criptografado</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}