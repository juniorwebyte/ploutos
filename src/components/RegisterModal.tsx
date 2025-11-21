import React, { useState } from 'react';
import { X, User, Mail, Phone, Building, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import whatsappService from '../services/whatsappService';
import backendService from '../services/backendService';

interface RegisterModalProps {
  onClose: () => void;
  onSuccess: (userData: any) => void;
  userType: 'pessoa-fisica' | 'pessoa-juridica';
}

const RegisterModal: React.FC<RegisterModalProps> = ({ onClose, onSuccess, userType }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    company: '',
    cnpj: '',
    cpf: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setFormData(prev => ({ ...prev, phone: value }));
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 14) {
      setFormData(prev => ({ ...prev, cnpj: value }));
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setFormData(prev => ({ ...prev, cpf: value }));
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

  const formatCnpj = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCpf = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório.');
      return false;
    }
    if (!formData.email.trim()) {
      setError('E-mail é obrigatório.');
      return false;
    }
    if (!whatsappService.isValidEmail(formData.email)) {
      setError('E-mail inválido.');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Telefone é obrigatório.');
      return false;
    }
    if (!whatsappService.isValidPhone(formData.phone)) {
      setError('Telefone inválido. Use o formato (11) 99999-9999');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Senha é obrigatória.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem.');
      return false;
    }
    if (userType === 'pessoa-juridica') {
      if (!formData.company.trim()) {
        setError('Nome da empresa é obrigatório.');
        return false;
      }
      if (!formData.cnpj.trim()) {
        setError('CNPJ é obrigatório.');
        return false;
      }
      if (formData.cnpj.length !== 14) {
        setError('CNPJ deve ter 14 dígitos.');
        return false;
      }
    } else {
      if (!formData.cpf.trim()) {
        setError('CPF é obrigatório.');
        return false;
      }
      if (formData.cpf.length !== 11) {
        setError('CPF deve ter 11 dígitos.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Gerar ID único se não existir
      const id = `pending_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      
      const userData = {
        id,
        ...formData,
        userType,
        registeredAt: new Date().toISOString(),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Salvar localmente PRIMEIRO (funciona offline)
      const existingUsers = JSON.parse(localStorage.getItem('pending_users') || '[]');
      existingUsers.push(userData);
      localStorage.setItem('pending_users', JSON.stringify(existingUsers));
      
      // Disparar evento customizado para notificar sobre novo cadastro pendente
      window.dispatchEvent(new CustomEvent('newPendingUser', { detail: { count: existingUsers.length } }));

      // Tentar enviar para o backend
      const online = await backendService.isOnline();
      if (online) {
        const base = backendService.getBaseUrl();
        await fetch(`${base}/api/public/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
      }

      // Enviar notificação para admin
      const adminMsg = `🆕 Nova solicitação de cadastro\n👤 ${formData.name}\n📧 ${formData.email}\n📱 ${formData.phone}\n🏢 ${userType === 'pessoa-juridica' ? formData.company : 'Pessoa Física'}\n📋 Tipo: ${userType === 'pessoa-juridica' ? 'PJ' : 'PF'}`;
      await whatsappService.sendMessage('+5511984801839', adminMsg);

      setSuccess('Cadastro realizado com sucesso! Aguarde aprovação do administrador.');
      setTimeout(() => {
        onSuccess(userData);
      }, 2000);

    } catch (error) {
      console.error('Erro ao registrar:', error);
      setError('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Cadastro - {userType === 'pessoa-fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
              </label>
              <input
                type="tel"
                name="phone"
                value={formatPhone(formData.phone)}
                onChange={handlePhoneChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(11) 99999-9999"
                required
              />
            </div>

            {userType === 'pessoa-juridica' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Nome da Empresa *
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
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    value={formatCnpj(formData.cnpj)}
                    onChange={handleCnpjChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </div>
              </>
            )}

            {userType === 'pessoa-fisica' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formatCpf(formData.cpf)}
                  onChange={handleCpfChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="000.000.000-00"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Confirmar Senha *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite a senha novamente"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
                {isLoading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
