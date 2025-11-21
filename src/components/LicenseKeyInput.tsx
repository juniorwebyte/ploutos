import React, { useState } from 'react';
import { Key, CheckCircle, XCircle, Gift, Lock } from 'lucide-react';

interface LicenseKeyInputProps {
  onLicenseActivated?: (licenseKey: string) => void;
}

const LicenseKeyInput: React.FC<LicenseKeyInputProps> = ({ onLicenseActivated }) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isActivated, setIsActivated] = useState(false);

  // Verificar se já tem licença ativa
  React.useEffect(() => {
    const licenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
    const currentUser = localStorage.getItem('caixa_user');
    const userLicense = licenses.find((l: any) => 
      (l.username === currentUser || l.userId === currentUser) && 
      (l.status === 'active' || l.status === 'trial')
    );
    
    if (userLicense && userLicense.key) {
      setIsActivated(true);
      setLicenseKey(userLicense.key);
    }
  }, []);

  const validateAndActivateLicense = async () => {
    if (!licenseKey.trim()) {
      setMessage({ type: 'error', text: 'Por favor, insira uma chave de licença válida.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const currentUser = localStorage.getItem('caixa_user');
      if (!currentUser) {
        throw new Error('Usuário não identificado. Faça login novamente.');
      }

      // USAR SERVIÇO CENTRALIZADO DE VALIDAÇÃO
      const licenseValidationService = await import('../services/licenseValidationService');
      const userEmail = localStorage.getItem('user_email') || '';
      const result = licenseValidationService.default.validateLicense(licenseKey.trim(), 'client_dashboard', {
        username: currentUser,
        email: userEmail
      });

      if (!result.valid) {
        throw new Error(result.message || result.reason || 'Chave de licença inválida');
      }

      // Se a validação foi bem-sucedida, a licença já foi atualizada pelo serviço
      const allLicenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
      // Normalizar para comparação (remover underscores e espaços)
      const normalizedKey = licenseKey.trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
      const license = allLicenses.find((l: any) => {
        if (!l || !l.key) return false;
        const normalizedLicenseKey = String(l.key).trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
        return normalizedLicenseKey === normalizedKey;
      });
      
      if (!license) {
        // Se não encontrou, criar a partir do resultado
        const storedUsers = JSON.parse(localStorage.getItem('ploutos_users') || '[]');
        const user = storedUsers.find((u: any) => u.username === currentUser);
        
        if (user && result.license) {
          const newLicense = {
            ...result.license,
            id: result.license.id || `license_${user.id}`,
            userId: user.id,
            username: currentUser
          };
          
          const existingIndex = allLicenses.findIndex((l: any) => 
            l.username === currentUser || l.userId === user.id
          );
          
          if (existingIndex >= 0) {
            allLicenses[existingIndex] = newLicense;
          } else {
            allLicenses.push(newLicense);
          }
          
          localStorage.setItem('ploutos_licenses', JSON.stringify(allLicenses));
        }
      }

      setIsActivated(true);
      setMessage({ 
        type: 'success', 
        text: `✅ Licença ativada com sucesso!\n\nVocê agora tem acesso ao Gerenciamento de Caixa por 30 dias grátis!\n\nChave: ${licenseKey.trim()}\nVálida até: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}` 
      });

      // Disparar evento para atualizar o acesso
      window.dispatchEvent(new CustomEvent('licenseActivated', { 
        detail: { licenseKey: licenseKey.trim() } 
      }));

      if (onLicenseActivated) {
        onLicenseActivated(licenseKey.trim());
      }

      // Recarregar página após 2 segundos para atualizar o acesso
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao ativar licença:', error);
      setMessage({ 
        type: 'error', 
        text: `❌ Erro ao ativar licença:\n\n${error?.message || 'Chave inválida ou já utilizada. Verifique se digitou corretamente.'}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isActivated) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Licença Ativada
            </h3>
            <p className="text-green-700 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
              Sua licença de 30 dias grátis está ativa! Você já pode usar o Gerenciamento de Caixa.
            </p>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-green-600" />
                <span className="text-xs text-gray-600 font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Chave de Licença:</span>
              </div>
              <p className="text-sm font-mono text-gray-900 break-all" style={{ fontFamily: 'Inter, sans-serif' }}>
                {licenseKey}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 mb-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Key className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-indigo-800 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Ativar Licença de 30 Dias Grátis
          </h3>
          <p className="text-indigo-700 text-sm mb-4" style={{ fontFamily: 'Inter, sans-serif' }}>
            Insira a chave de licença fornecida pelo administrador para ativar seu acesso de 30 dias grátis ao Gerenciamento de Caixa.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                Chave de Licença
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => {
                    setLicenseKey(e.target.value.toUpperCase());
                    setMessage(null);
                  }}
                  placeholder="CF30D_XXXXXXXX"
                  className="w-full pl-10 pr-4 py-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  disabled={isLoading}
                />
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-xl border-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : message.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-start gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : message.type === 'error' ? (
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Gift className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm whitespace-pre-line" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={validateAndActivateLicense}
              disabled={isLoading || !licenseKey.trim()}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  Ativar Licença
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
              A chave de licença foi fornecida pelo administrador após aprovação da sua solicitação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseKeyInput;

