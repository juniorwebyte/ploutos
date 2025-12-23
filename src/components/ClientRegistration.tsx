import React, { useState, useEffect } from 'react';
import { X, Phone, User, Mail, Building, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import whatsappService from '../services/whatsappService';
import backendService from '../services/backendService';
import { validatePhone, formatPhone as formatPhoneValidation } from '../services/validationService';

interface ClientRegistrationProps {
  onClose: () => void;
  onSuccess: (clientData: any) => void;
}

const ClientRegistration: React.FC<ClientRegistrationProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: ''
  });
  const [step, setStep] = useState<'form' | 'code' | 'success'>('form');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [confirmedClient, setConfirmedClient] = useState<any>(null);
  const [generatedUsername, setGeneratedUsername] = useState<string>('demo');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState(0); // segundos para reenvio
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;
  const [validations, setValidations] = useState({
    phone: { isValid: true, message: '' },
  });

  // Contadores de tempo para expiração e cooldown
  useEffect(() => {
    if (!expiresAt && cooldown === 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
      if (expiresAt && Date.now() >= expiresAt) {
        // expira código
        setSentCode('');
        setError('Código expirado. Solicite um novo código.');
        setExpiresAt(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, cooldown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneValidation(e.target.value);
    const cleanPhone = formatted.replace(/\D/g, '');
    if (cleanPhone.length <= 11) {
      setFormData(prev => ({ ...prev, phone: cleanPhone }));
      if (cleanPhone.length >= 10) {
        const isValid = validatePhone(formatted);
        setValidations(prev => ({
          ...prev,
          phone: { isValid, message: isValid ? '' : 'Telefone inválido' },
        }));
      } else {
        setValidations(prev => ({ ...prev, phone: { isValid: true, message: '' } }));
      }
    }
  };

  const formatPhone = (phone: string) => {
    return formatPhoneValidation(phone);
  };

  const sendWhatsAppCode = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validar dados obrigatórios
      if (!formData.name.trim()) {
        setError('Nome é obrigatório.');
        return;
      }

      if (!formData.email.trim()) {
        setError('E-mail é obrigatório.');
        return;
      }

      if (!formData.phone.trim()) {
        setError('Telefone é obrigatório.');
        return;
      }

      // Validar formato do email
      if (!whatsappService.isValidEmail(formData.email)) {
        setError('E-mail inválido. Verifique o formato.');
        return;
      }

      // Validar formato do telefone
      if (!whatsappService.isValidPhone(formData.phone)) {
        setError('Telefone inválido. Use o formato (11) 99999-9999');
        return;
      }

      console.log('📋 Dados do formulário:', formData);

      // Gerar código de verificação aleatório
      const verificationCode = whatsappService.generateVerificationCode();
      setSentCode(verificationCode);
      // expira em 10 minutos
      const expireTs = Date.now() + 10 * 60 * 1000;
      setExpiresAt(expireTs);
      // cooldown de 60s para reenvio
      setCooldown(60);

      console.log('🔐 Código gerado:', verificationCode);

      // Preparar dados do cliente
      const clientData = {
        ...formData,
        verificationCode,
        registeredAt: new Date().toISOString(),
        status: 'pending' as const
      };

      console.log('📤 Enviando código para:', formData.phone);

      // Enviar código para o cliente
      const clientMessageSent = await whatsappService.sendVerificationCode(clientData);
      
      if (!clientMessageSent) {
        // Fallback: abrir conversa via wa.me com o código pré-preenchido
        const digits = formData.phone.replace(/\D/g, '');
        const fullPhone = digits.startsWith('55') ? digits : `55${digits}`;
        const fallbackText = `Olá! Seu código de verificação é: ${verificationCode}. Digite no site para acessar a demo.`;
        const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(fallbackText)}`;
        try { window.open(waUrl, '_blank'); } catch {}
        setSuccess('Abrimos uma conversa no seu WhatsApp com o código. Caso não abra, verifique o número e tente novamente.');
      }

      console.log('✅ Código enviado com sucesso!');
      setSuccess('Código enviado! Verifique seu WhatsApp e digite abaixo.');

      // Notificar admin
      console.log('📤 Notificando admin...');
      const adminNotified = await whatsappService.notifyAdmin(clientData);
      
      if (!adminNotified) {
        console.warn('⚠️ Não foi possível notificar o admin, mas o código foi enviado para o cliente.');
      }

      setStep('code');
    } catch (error) {
      console.error('❌ Erro ao enviar código:', error);
      setError('Erro ao enviar código. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (isLoading || cooldown > 0) return;
    await sendWhatsAppCode();
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      setError('Digite o código de verificação.');
      return;
    }
    if (!sentCode) {
      setError('O código expirou. Solicite um novo.');
      return;
    }
    if (expiresAt && Date.now() >= expiresAt) {
      setError('O código expirou. Solicite um novo.');
      setSentCode('');
      setExpiresAt(null);
      return;
    }

    if (code.trim() === sentCode) {
      console.log('✅ Código verificado com sucesso!');
      setStep('success');
      
      // Salvar dados do cliente
      const clientData = {
        ...formData,
        verificationCode: sentCode,
        registeredAt: new Date().toISOString(),
        status: 'verified'
      };
      
      // Salvar no localStorage (em produção, salvar no banco)
      const existingClients = JSON.parse(localStorage.getItem('demo_clients') || '[]');
      existingClients.push(clientData);
      localStorage.setItem('demo_clients', JSON.stringify(existingClients));
      
      console.log('💾 Cliente salvo:', clientData);

      // Criar LEAD para aprovação no painel e enviar notificações
      try {
        const base = backendService.getBaseUrl();
        const online = await backendService.isOnline();
        // username sugerido (aprovado posteriormente)
        const nameParts = clientData.name.trim().split(/\s+/);
        const baseUsername = (nameParts[nameParts.length-1] || nameParts[0] || 'cliente').toLowerCase().replace(/[^a-z0-9]/gi,'');
        const username = baseUsername || 'cliente';
        // Registrar localmente como fallback (com ID único)
        const pendingLeads = JSON.parse(localStorage.getItem('pending_leads')||'[]');
        const leadId = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        pendingLeads.push({ 
          id: leadId,
          name: clientData.name, 
          email: clientData.email, 
          phone: clientData.phone, 
          company: clientData.company, 
          username,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('pending_leads', JSON.stringify(pendingLeads));
        if (online) {
          try {
            const resp = await fetch(`${base}/api/public/leads`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ name: clientData.name, email: clientData.email, phone: clientData.phone, company: clientData.company, username }) });
            if (resp.ok) {
              // remover do pending se salvo
              const current = JSON.parse(localStorage.getItem('pending_leads')||'[]');
              const idx = current.findIndex((l:any)=> l.email===clientData.email && l.phone===clientData.phone);
              if (idx>=0) { current.splice(idx,1); localStorage.setItem('pending_leads', JSON.stringify(current)); }
            }
          } catch {}
        }
        const accessMsg = `✅ Verificação concluída!\n\nSua demonstração foi liberada. Clique em “Acessar Demo” no site.\nSeu cadastro foi enviado para aprovação.`;
        await whatsappService.sendMessage(clientData.phone, accessMsg);
        // Notificar admin com dados do cliente e username gerado
        const adminMsg = `📢 Novo cadastro de demo\n👤 ${clientData.name}\n📧 ${clientData.email}\n📱 ${clientData.phone}\n🏢 ${clientData.company}\n🔐 Código: ${clientData.verificationCode}\n👥 Usuário sugerido: ${username}`;
        await whatsappService.sendMessage('+5511984801839', adminMsg);
        setGeneratedUsername(username);
        // abrir demo sem exigir credenciais visíveis
        localStorage.setItem('force_open_demo','true');
        try { window.dispatchEvent(new Event('ploutos:open-demo')); } catch {}
      } catch {}
      setConfirmedClient(clientData);
    } else {
      console.log('❌ Código incorreto. Digitado:', code, 'Esperado:', sentCode);
      const next = attempts + 1;
      setAttempts(next);
      if (next >= maxAttempts) {
        setError('Limite de tentativas atingido. Solicite um novo código.');
        setSentCode('');
        setExpiresAt(null);
      } else {
        setError(`Código incorreto. Tentativas restantes: ${maxAttempts - next}.`);
      }
    }
  };

  const isFormValid = formData.name && formData.email && formData.phone && formData.company;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'form' && 'Cadastro para Demo'}
              {step === 'code' && 'Verificação por WhatsApp'}
              {step === 'success' && 'Cadastro Concluído'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'form' && (
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Acesso via WhatsApp</h3>
                    <p className="text-sm text-gray-600">Receba um código de verificação no seu WhatsApp</p>
                  </div>
                </div>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Seu nome completo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    E-mail *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    WhatsApp *
                    {formData.phone && (
                      <span className={`ml-2 text-xs ${validations.phone.isValid ? 'text-green-600' : 'text-red-600'}`}>
                        {validations.phone.isValid ? '✓ Válido' : '✗ Inválido'}
                      </span>
                    )}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formatPhone(formData.phone)}
                    onChange={handlePhoneChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.phone && !validations.phone.isValid ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(11) 99999-9999"
                    required
                  />
                  {!validations.phone.isValid && formData.phone && (
                    <p className="text-xs text-red-600 mt-1">{validations.phone.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Inclua o DDD. Exemplo: (11) 99999-9999
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Empresa *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome da sua empresa"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Cargo
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Seu cargo na empresa"
                  />
                </div>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">{success}</span>
            </div>
          )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={sendWhatsAppCode}
                  disabled={!isFormValid || isLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? 'Enviando...' : 'Enviar Código'}
                </button>
              </div>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Código Enviado!
                </h3>
                <p className="text-gray-600">
                  Enviamos um código de verificação para o WhatsApp:
                </p>
                <p className="font-semibold text-gray-900">
                  {formatPhone(formData.phone)}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  {expiresAt ? (
                    <span>Expira em {Math.max(0, Math.floor(((expiresAt - Date.now())/1000)))}s</span>
                  ) : (
                    <span>Código expirado</span>
                  )}
                  <span className="ml-2">• Tentativas: {attempts}/{maxAttempts}</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digite o código de 6 dígitos:
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">{success}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('form')}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={verifyCode}
                  disabled={code.length !== 6}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  Verificar Código
                </button>
              </div>
              <div className="mt-3 text-center">
                <button onClick={handleResend} disabled={cooldown>0} className="text-sm text-indigo-600 disabled:text-gray-400">
                  {cooldown>0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
          <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Cadastro Concluído!
              </h3>
              <p className="text-gray-600 mb-6">
                Seus dados foram registrados com sucesso. Você agora tem acesso à demonstração do sistema.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-700">
                  <strong>Credenciais de Demo:</strong><br />
                  Usuário: <code className="bg-green-100 px-2 py-1 rounded">{generatedUsername}</code><br />
                  Senha: <code className="bg-green-100 px-2 py-1 rounded">demo123</code>
                </p>
              </div>
              <button
                onClick={()=> { try { localStorage.setItem('force_open_demo','true'); window.dispatchEvent(new Event('ploutos:open-demo')); } catch {}; confirmedClient ? onSuccess(confirmedClient) : onClose(); }}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105"
              >
                Acessar Demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientRegistration;
