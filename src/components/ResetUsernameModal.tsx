import React, { useState } from 'react';
import { X, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import whatsappService from '../services/whatsappService';
import backendService from '../services/backendService';

interface ResetUsernameModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ResetUsernameModal: React.FC<ResetUsernameModalProps> = ({ onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setPhone(value);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('E-mail é obrigatório.');
      return;
    }

    if (!whatsappService.isValidEmail(email)) {
      setError('E-mail inválido.');
      return;
    }

    if (!phone.trim()) {
      setError('Telefone é obrigatório.');
      return;
    }

    if (!whatsappService.isValidPhone(phone)) {
      setError('Telefone inválido. Use o formato (11) 99999-9999');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Gerar código de recuperação
      const resetCode = Math.random().toString(36).slice(2, 8).toUpperCase();
      
      // Salvar solicitação localmente
      const resetRequests = JSON.parse(localStorage.getItem('username_reset_requests') || '[]');
      resetRequests.push({
        email,
        phone,
        code: resetCode,
        createdAt: new Date().toISOString(),
        status: 'pending'
      });
      localStorage.setItem('username_reset_requests', JSON.stringify(resetRequests));

      // Tentar enviar para o backend
      const online = await backendService.isOnline();
      if (online) {
        const base = backendService.getBaseUrl();
        await fetch(`${base}/api/public/reset-username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, phone, code: resetCode })
        });
      }

      // Enviar código por WhatsApp
      const message = `👤 Recuperação de Usuário\n\nSeu código é: ${resetCode}\n\nUse este código para recuperar seu usuário.\n\n_PloutosLedger_`;
      
      try {
        await whatsappService.sendMessage(phone, message);
      } catch {
        // Fallback: mostrar código na tela
        setSuccess(`Código enviado! Seu código de recuperação é: ${resetCode}`);
      }

      // Notificar admin
      const adminMsg = `👤 Solicitação de recuperação de usuário\n📧 E-mail: ${email}\n📱 Telefone: ${phone}\n🔑 Código: ${resetCode}`;
      await whatsappService.sendMessage('+5511984801839', adminMsg);

      setSuccess('Código de recuperação enviado! Verifique seu WhatsApp.');
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);
      setError('Erro ao solicitar recuperação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Recuperar Usuário</h2>
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
          <p className="text-gray-600 mb-6">
            Digite seu e-mail e telefone para receber um código de recuperação de usuário.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                E-mail *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                WhatsApp *
              </label>
              <input
                type="tel"
                value={formatPhone(phone)}
                onChange={handlePhoneChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{success}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {isLoading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetUsernameModal;
