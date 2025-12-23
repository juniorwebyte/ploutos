import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Smartphone, CreditCard, Clock, Shield, QrCode, Download } from 'lucide-react';
import pixService from '../services/pixService';
import whatsappService from '../services/whatsappService';
import emailService from '../services/emailService';
import backendService from '../services/backendService';
import { useAuth } from '../contexts/AuthContext';
import { PixCobranca } from '../types';
import { formatPhone, unformatPhone } from '../utils/formatters';
import { validatePhone, formatPhone as formatPhoneValidation } from '../services/validationService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentData: any) => void;
  onOpenFullPage?: () => void;
  selectedPlan?: { name: string; priceCents: number; interval: 'monthly'|'yearly' } | null;
}

export default function PaymentModal({ isOpen, onClose, onPaymentComplete, onOpenFullPage, selectedPlan }: PaymentModalProps) {
  const { user: authUser } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit'>('pix');
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [showFullForm, setShowFullForm] = useState(false);
  const [cobranca, setCobranca] = useState<PixCobranca | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: ''
  });

  const [coupon, setCoupon] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const baseAmount = selectedPlan ? selectedPlan.priceCents/100 : 29.99;
  const pixAmount = Math.max(0, baseAmount * (1 - discountPct/100));

  // Gerar cobrança PIX real
  useEffect(() => {
    if (isOpen && paymentMethod === 'pix') {
      gerarCobrancaPIX();
    }
  }, [isOpen, paymentMethod, selectedPlan, discountPct]);

  const gerarCobrancaPIX = async () => {
    setLoading(true);
    setError(null);
    try {
      const title = selectedPlan?.name ? `Assinatura ${selectedPlan.name} (${selectedPlan.interval==='monthly'?'Mensal':'Anual'})` : 'Teste de 30 Dias - Sistema Movimento de Caixa';
      const novaCobranca = await pixService.criarCobranca(
        pixAmount,
        formData,
        title
      );
      setCobranca(novaCobranca);
      setQrCodeDataUrl(novaCobranca.qrCodeImage);
      // Agendar renovação do QR em 5 minutos
      const ms = new Date(novaCobranca.dataExpiracao).getTime() - Date.now();
      setTimeout(()=>{
        if (paymentMethod==='pix' && isOpen) gerarCobrancaPIX();
      }, Math.max(1000, ms));
      setExpiresIn(Math.max(0, Math.floor(ms/1000)));
      // contador regressivo de expiração
      const timer = setInterval(()=>{
        setExpiresIn(prev => prev>0 ? prev-1 : 0);
      }, 1000);
      setTimeout(()=>clearInterval(timer), Math.max(1000, ms));
      // Validação extra: garantir que a imagem do QR foi gerada
      const valido = await pixService.validarQRCodePIX(novaCobranca.qrCode);
      if (!valido) {
        setError('Não foi possível gerar o QR Code. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro ao gerar cobrança PIX:', err);
      setError('Erro ao gerar cobrança PIX. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
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
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = 'pix-qrcode.png';
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === 'pix' && cobranca) {
      // Abrir WhatsApp com informações do pagamento
      const message = `Olá! Realizei o pagamento ${selectedPlan?.name ? 'do plano '+selectedPlan.name : 'do teste de 30 dias'} do Sistema de Movimento de Caixa.

📋 **Dados do Pagamento:**
• Valor: R$ ${pixAmount.toFixed(2)}
• Chave PIX: ${cobranca.chave}
• TXID: ${cobranca.txid}
• Método: PIX

👤 **Meus Dados:**
• Nome: ${formData.name}
• E-mail: ${formData.email}
• Telefone: ${formData.phone}
• Empresa: ${formData.company}

Por favor, confirme o recebimento e envie as instruções de acesso.`;

      const whatsappUrl = `https://wa.me/5511984801839?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      onPaymentComplete({
        method: 'pix',
        amount: pixAmount,
        data: formData,
        cobranca: cobranca,
        plan: selectedPlan || null,
        discountPct
      });
    }
    onClose();
  };

  // Simulação de webhook/baixa e acesso automático (modo demo)
  const handleSimulatePaid = async () => {
    if (!cobranca) return;
    try {
      await pixService.marcarComoPaga(cobranca.txid);
      // gravar assinatura demo e preparar auto login
      const subs = JSON.parse(localStorage.getItem('demo_subscriptions')||'[]');
      subs.push({ txid: cobranca.txid, plan: selectedPlan||null, createdAt: new Date().toISOString(), status: 'active' });
      localStorage.setItem('demo_subscriptions', JSON.stringify(subs));
      // preparar autologin somente se não houver usuário autenticado
      if (!authUser) {
        localStorage.setItem('autologin', JSON.stringify({ username: 'Webyte', password: 'Webyte' }));
      }
      // notificar cliente via WhatsApp e e-mail (demo)
      if (formData.phone) {
        const msg = `✅ Pagamento confirmado! Plano: ${selectedPlan?.name || 'Teste'}. Use usuário Webyte para acessar.`;
        const ok = await whatsappService.sendMessage(formData.phone, msg);
        // persistir log no backend se online
        try {
          const online = await backendService.isOnline();
          if (online) {
            const base = backendService.getBaseUrl();
            await fetch(`${base}/api/comms/logs`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ type:'whatsapp', to: formData.phone, ok, message: msg }) });
          } else {
            const logs = JSON.parse(localStorage.getItem('comm_logs')||'[]');
            logs.push({ type:'whatsapp', to: formData.phone, ok, message: msg, at: new Date().toISOString() });
            localStorage.setItem('comm_logs', JSON.stringify(logs));
          }
        } catch {}
      }
      if (formData.email) {
        const activationLink = typeof window !== 'undefined' ? window.location.origin : (import.meta.env.VITE_APP_DOMAIN ? `${import.meta.env.VITE_APP_PROTOCOL || 'https'}://${import.meta.env.VITE_APP_DOMAIN}` : 'http://localhost:5173');
        const payload = { name: formData.name, plan: selectedPlan?.name || 'Teste', txid: cobranca.txid, activationLink };
        const ok = await emailService.sendWelcomeEmail(formData.email, payload);
        try {
          const online = await backendService.isOnline();
          if (online) {
            const base = backendService.getBaseUrl();
            await fetch(`${base}/api/comms/logs`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ type:'email', to: formData.email, ok, payload }) });
          } else {
            const logs = JSON.parse(localStorage.getItem('comm_logs')||'[]');
            logs.push({ type:'email', to: formData.email, ok, payload, at: new Date().toISOString() });
            localStorage.setItem('comm_logs', JSON.stringify(logs));
          }
        } catch {}
      }
      // criar assinatura real no backend se online
      try {
        const online = await backendService.isOnline();
        if (online) {
          const base = backendService.getBaseUrl();
          const purchaser = authUser || 'Webyte';
          await fetch(`${base}/api/public/subscriptions`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ username: purchaser, planName: selectedPlan?.name || 'Teste de 30 Dias', txid: cobranca.txid }) });
        }
      } catch {}
      onPaymentComplete({ method:'pix', amount: pixAmount, cobranca, plan: selectedPlan||null, discountPct, simulated:true });
      onClose();
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[999999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden">
        {/* Header Compacto */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{selectedPlan?.name ? `Assinatura ${selectedPlan.name}` : 'Teste de 30 Dias'}</h1>
                <p className="text-green-100 text-xs">R$ {pixAmount.toFixed(2).replace('.', ',')} {selectedPlan?.interval ? `• ${selectedPlan.interval==='monthly'?'mês':'ano'}` : ''}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Compacto */}
        <div className="p-4">
          {/* QR Code e Informações PIX */}
          {paymentMethod === 'pix' && (
            <div className="mb-4">
              <div className="flex gap-4 items-start">
                {/* QR Code */}
                <div className="flex-shrink-0">
                  <div className="bg-white p-3 rounded-xl border-2 border-green-200 shadow-sm">
                    {loading ? (
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code PIX" 
                        className="w-32 h-32"
                      />
                    ) : (
                      <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <QrCode className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {qrCodeDataUrl && (
                    <button
                      onClick={handleDownloadQRCode}
                      className="w-full mt-2 text-xs text-green-600 hover:text-green-700 flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Baixar QR Code
                    </button>
                  )}
                  {!loading && error && (
                    <div className="mt-2 text-xs text-red-600">
                      {error}
                      <button onClick={handleRetry} className="ml-2 underline">Tentar novamente</button>
                    </div>
                  )}
                </div>

                {/* Informações PIX */}
                <div className="flex-1 space-y-3">
                  <div className="text-xs text-gray-600">Expira em: <span className="font-semibold">{expiresIn}s</span></div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Chave PIX:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cobranca?.chave || 'Carregando...'}
                        readOnly
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono bg-gray-50"
                      />
                      <button
                        onClick={handleCopyPixKey}
                        disabled={!cobranca}
                        className="px-2 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Valor:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`R$ ${pixAmount.toFixed(2).replace('.', ',')}`}
                        readOnly
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs font-mono bg-gray-50"
                      />
                      <button
                        onClick={handleCopyAmount}
                        className="px-2 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
                    <strong>Instruções:</strong> Escaneie o QR Code ou copie a chave PIX e realize o pagamento.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulário Compacto */}
          {!showFullForm ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nome completo *"
                />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="E-mail *"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e)=>setCoupon(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Cupom (ex: PROMO10)"
                />
                <button type="button" onClick={()=>{
                  const code = coupon.trim().toUpperCase();
                  if (code==='PROMO10') setDiscountPct(10); else if (code==='PROMO20') setDiscountPct(20); else setDiscountPct(0);
                }} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Aplicar</button>
              </div>
              
              <button
                type="button"
                onClick={() => setShowFullForm(true)}
                className="w-full text-sm text-green-600 hover:text-green-700 py-1"
              >
                + Adicionar telefone e empresa
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nome completo *"
                />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="E-mail *"
                />
                <div>
                  <input
                    type="tel"
                    required
                    value={formatPhone(formData.phone)}
                    onChange={(e) => {
                      const formatted = formatPhoneValidation(e.target.value);
                      const unformatted = unformatPhone(formatted);
                      setFormData({ ...formData, phone: unformatted });
                      if (unformatted.length >= 10) {
                        const isValid = validatePhone(formatted);
                        setValidations(prev => ({
                          ...prev,
                          phone: { isValid, message: isValid ? '' : 'Telefone inválido' },
                        }));
                      } else {
                        setValidations(prev => ({ ...prev, phone: { isValid: true, message: '' } }));
                      }
                    }}
                    className={`px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                      formData.phone && !validations.phone.isValid ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Telefone *"
                    maxLength={15}
                  />
                  {formData.phone && (
                    <span className={`ml-2 text-xs ${validations.phone.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {validations.phone.isValid ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Empresa"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e)=>setCoupon(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Cupom (ex: PROMO10)"
                />
                <button type="button" onClick={()=>{
                  const code = coupon.trim().toUpperCase();
                  if (code==='PROMO10') setDiscountPct(10); else if (code==='PROMO20') setDiscountPct(20); else setDiscountPct(0);
                }} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Aplicar</button>
              </div>
              
              <button
                type="button"
                onClick={() => setShowFullForm(false)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
              >
                - Ocultar campos extras
              </button>
            </div>
          )}

          {/* Benefícios Compactos */}
          <div className="my-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-xs text-green-800 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Acesso completo por 30 dias</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Suporte técnico incluído</span>
              </div>
            </div>
          </div>

          {/* Ação: Ir para página completa */}
          {onOpenFullPage && (
            <button
              type="button"
              onClick={onOpenFullPage}
              className="w-full text-xs text-gray-600 hover:text-gray-800 mb-2"
            >
              Preferir página completa de pagamento
            </button>
          )}

          {/* Botão de Confirmação */}
          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Confirmar Pagamento
            </button>
          </form>

          {/* Simular webhook (demo) */}
          <div className="mt-2 text-center">
            <button onClick={handleSimulatePaid} className="text-xs text-gray-600 underline">Simular confirmação de pagamento (demo)</button>
          </div>

          {/* Aviso de Segurança Compacto */}
          <div className="mt-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <Shield className="w-3 h-3 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <strong>Segurança:</strong> Dados protegidos. Pagamento seguro via PIX.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
