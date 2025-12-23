/**
 * Componente de Autenticação Obrigatória de Funcionário
 * Deve ser exibido ANTES de permitir qualquer batida de ponto
 */

import React, { useState } from 'react';
import {
  Lock,
  User,
  Key,
  Fingerprint,
  CreditCard,
  QrCode,
  Smartphone,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { employeeAuthService, type AuthenticationRequest } from '../services/employeeAuthService';
import { type Employee } from '../services/timeClockService';

interface EmployeeAuthenticationProps {
  onAuthenticated: (employee: Employee, sessionToken: string) => void;
  onCancel?: () => void;
  allowedMethods?: string[];
}

export default function EmployeeAuthentication({
  onAuthenticated,
  onCancel,
  allowedMethods = ['password', 'pin', 'qrcode', 'rfid', 'biometric', 'facial', 'app_token'],
}: EmployeeAuthenticationProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [credential, setCredential] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'method' | 'credential'>('method');

  const methods = [
    { id: 'password', name: 'Senha', icon: Key, description: 'Login com senha' },
    { id: 'pin', name: 'PIN', icon: Lock, description: 'PIN de 4-6 dígitos' },
    { id: 'qrcode', name: 'QR Code', icon: QrCode, description: 'Escaneie seu QR Code' },
    { id: 'rfid', name: 'Cartão/RFID', icon: CreditCard, description: 'Aproxime o cartão' },
    { id: 'biometric', name: 'Biometria', icon: Fingerprint, description: 'Impressão digital' },
    { id: 'facial', name: 'Reconhecimento Facial', icon: User, description: 'Reconhecimento facial' },
    { id: 'app_token', name: 'Aplicativo', icon: Smartphone, description: 'Token do aplicativo' },
  ].filter(m => allowedMethods.includes(m.id));

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setError(null);
    setCredential('');
    setEmployeeId('');

    // Métodos que precisam de employeeId primeiro
    if (['password', 'pin', 'biometric', 'facial', 'app_token'].includes(methodId)) {
      setStep('credential');
    } else {
      // QR Code e RFID podem autenticar diretamente
      setStep('credential');
    }
  };

  const handleAuthenticate = async () => {
    // Validar campos obrigatórios conforme o método
    if (!selectedMethod) {
      setError('Selecione um método de autenticação');
      return;
    }

    // Para métodos que precisam de employeeId e credential
    if (['password', 'pin'].includes(selectedMethod)) {
      if (!employeeId || !credential) {
        setError('Preencha a matrícula/ID e a senha/PIN');
        return;
      }
    } else if (selectedMethod === 'biometric' || selectedMethod === 'facial' || selectedMethod === 'app_token') {
      if (!employeeId) {
        setError('Preencha a matrícula/ID do funcionário');
        return;
      }
    } else if (selectedMethod === 'qrcode' || selectedMethod === 'rfid') {
      if (!credential) {
        setError('Escaneie ou digite o código');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const request: AuthenticationRequest = {
        method: selectedMethod as any,
        // Para password/pin, usar employeeId como identificador
        // Para outros métodos, usar credential como identificador
        employeeId: ['password', 'pin', 'biometric', 'facial', 'app_token'].includes(selectedMethod) 
          ? employeeId 
          : undefined,
        credential: credential || employeeId, // Se não tiver credential, usar employeeId
        deviceType: 'web',
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent,
      };

      console.log('🔐 Tentando autenticar:', { method: selectedMethod, employeeId, hasCredential: !!credential });

      const result = await employeeAuthService.authenticate(request);

      if (result.success && result.employee && result.sessionToken) {
        console.log('✅ Autenticação bem-sucedida:', result.employee.name);
        onAuthenticated(result.employee, result.sessionToken, selectedMethod);
      } else {
        console.error('❌ Autenticação falhou:', result.error);
        setError(result.error || 'Autenticação falhou. Verifique suas credenciais.');
      }
    } catch (error: any) {
      console.error('❌ Erro na autenticação:', error);
      setError(error.message || 'Erro ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-6 h-6 text-emerald-600" />
              Identificação Obrigatória
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Você deve se identificar antes de registrar ponto
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
            >
              ✕
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {step === 'method' && (
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Selecione o método de autenticação:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {methods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left"
                  >
                    <Icon className="w-6 h-6 text-emerald-600 mb-2" />
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{method.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'credential' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setStep('method');
                setError(null);
                setCredential('');
                setEmployeeId('');
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              ← Voltar
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {selectedMethod === 'password' && 'Senha'}
                {selectedMethod === 'pin' && 'PIN'}
                {selectedMethod === 'qrcode' && 'Código QR'}
                {selectedMethod === 'rfid' && 'Número do Cartão'}
                {selectedMethod === 'biometric' && 'Template Biométrico'}
                {selectedMethod === 'facial' && 'Dados Faciais'}
                {selectedMethod === 'app_token' && 'Token do Aplicativo'}
                {['password', 'pin'].includes(selectedMethod) && ' *'}
              </label>
              <div className="relative">
                <input
                  type={selectedMethod === 'password' && !showPassword ? 'password' : 'text'}
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder={
                    selectedMethod === 'password' ? 'Digite sua senha' :
                    selectedMethod === 'pin' ? 'Digite seu PIN' :
                    selectedMethod === 'qrcode' ? 'Cole o código QR' :
                    selectedMethod === 'rfid' ? 'Número do cartão' :
                    'Credencial'
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 pr-10"
                  autoFocus
                />
                {selectedMethod === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>

            {['password', 'pin', 'biometric', 'facial', 'app_token'].includes(selectedMethod) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Matrícula, CPF ou Email *
                </label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Digite sua matrícula, CPF ou email"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  autoFocus={selectedMethod !== 'password' && selectedMethod !== 'pin'}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Você pode usar sua matrícula, CPF (com ou sem formatação) ou email cadastrado
                </p>
              </div>
            )}

            {selectedMethod === 'qrcode' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Escaneie ou cole o código QR gerado pelo sistema
                </p>
              </div>
            )}

            {selectedMethod === 'rfid' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Aproxime o cartão RFID do leitor ou digite o número do cartão
                </p>
              </div>
            )}

            {selectedMethod === 'biometric' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Coloque o dedo no leitor biométrico
                </p>
              </div>
            )}

            {selectedMethod === 'facial' && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Posicione seu rosto em frente à câmera
                </p>
              </div>
            )}

            <button
              onClick={handleAuthenticate}
              disabled={loading || !credential || (['password', 'pin', 'biometric', 'facial', 'app_token'].includes(selectedMethod) && !employeeId)}
              className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Autenticando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Autenticar
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

