// Validador de Licenças em Tempo Real para Landing Page
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Loader2, Key, Shield, AlertCircle } from 'lucide-react';
import subscriptionService from '../services/subscriptionService';

interface LicenseValidatorProps {
  onValidLicense?: (licenseKey: string) => void;
  onInvalidLicense?: (message: string) => void;
}

export default function LicenseValidator({
  onValidLicense,
  onInvalidLicense,
}: LicenseValidatorProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message?: string;
  } | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Limpar timer ao desmontar
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const validateLicense = async (key: string, shouldActivate: boolean = false) => {
    if (!key || key.length < 6) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    try {
      // Usar serviço centralizado de validação
      const licenseValidationService = await import('../services/licenseValidationService');
      const result = licenseValidationService.default.validateLicense(key, 'landing_page');
      
      if (result.valid && result.license) {
        // Se a validação foi bem-sucedida, mostrar mensagem positiva
        setValidationResult({
          valid: true,
          message: '✅ Licença válida! Clique em "Validar e Ativar" para ativar.'
        });
        
        // Só ativar se o usuário clicou no botão
        if (shouldActivate) {
          try {
            // Normalizar chave para busca
            const normalizedKey = key.trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
            const allLicenses = JSON.parse(localStorage.getItem('ploutos_licenses') || '[]');
            const licenseToActivate = allLicenses.find((l: any) => {
              if (!l || !l.key) return false;
              const normalizedLicenseKey = String(l.key).trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
              return normalizedLicenseKey === normalizedKey;
            });
            
            if (licenseToActivate) {
              // Atualizar status da licença para 'trial' ou 'active'
              const updatedLicenses = allLicenses.map((l: any) => {
                if (!l || !l.key) return l;
                const normalizedLicenseKey = String(l.key).trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
                return normalizedLicenseKey === normalizedKey
                  ? { ...l, status: 'trial', lastUsed: new Date().toISOString() }
                  : l;
              });
              localStorage.setItem('ploutos_licenses', JSON.stringify(updatedLicenses));
              
              // Marcar chave aprovada como ativada (se existir)
              const approvedKeys = JSON.parse(localStorage.getItem('approved_license_keys') || '[]');
              const updatedApprovedKeys = approvedKeys.map((k: any) => {
                if (!k || !k.licenseKey) return k;
                const normalizedApprovedKey = String(k.licenseKey).trim().toUpperCase().replace(/\s+/g, '').replace(/_/g, '');
                return normalizedApprovedKey === normalizedKey && k.status === 'pending_activation'
                  ? { ...k, status: 'activated', activatedAt: new Date().toISOString() }
                  : k;
              });
              localStorage.setItem('approved_license_keys', JSON.stringify(updatedApprovedKeys));
              
              // Disparar evento para atualizar o contexto de autenticação
              window.dispatchEvent(new CustomEvent('licenseActivated', {
                detail: { licenseKey: key, license: result.license }
              }));
              
              setValidationResult({
                valid: true,
                message: '✅ Licença ativada com sucesso! Redirecionando para o login...'
              });
              
              if (onValidLicense) {
                onValidLicense(key);
              }
              
              // Redirecionar para login após ativação bem-sucedida
              setTimeout(() => {
                window.location.href = '/login';
              }, 1500);
            } else {
              // Se não encontrou a licença, o serviço já deve ter criado
              setValidationResult({
                valid: true,
                message: '✅ Licença ativada com sucesso! Redirecionando para o login...'
              });
              
              if (onValidLicense) {
                onValidLicense(key);
              }
              
              setTimeout(() => {
                window.location.href = '/login';
              }, 1500);
            }
          } catch (error) {
            console.error('Erro ao ativar licença:', error);
            setValidationResult({
              valid: false,
              message: 'Erro ao ativar licença. Tente novamente.'
            });
          }
        }
      } else {
        setValidationResult({
          valid: false,
          message: result.message || result.reason || 'Licença inválida'
        });
        if (onInvalidLicense) {
          onInvalidLicense(result.message || result.reason || 'Licença inválida');
        }
      }
    } catch (error) {
      console.error('Erro ao validar licença:', error);
      setValidationResult({
        valid: false,
        message: 'Erro ao validar licença. Tente novamente.',
      });
      if (onInvalidLicense) {
        onInvalidLicense('Erro ao validar licença');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir letras, números, underscores e hífens
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    setLicenseKey(value);

    // Limpar timer anterior
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Validar apenas para mostrar feedback visual (sem ativar automaticamente)
    if (value.length >= 6) {
      const timer = setTimeout(() => {
        validateLicense(value, false); // false = apenas validar, não ativar
      }, 800); // Aumentar delay para não atrapalhar a digitação
      setDebounceTimer(timer);
    } else {
      setValidationResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (licenseKey.length >= 6) {
      // Quando o usuário clica no botão, ativar a licença
      await validateLicense(licenseKey, true); // true = ativar a licença
    }
  };

  // Detectar se está em tema escuro verificando o elemento pai
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  
  useEffect(() => {
    const checkTheme = () => {
      if (!containerRef.current) return;
      // Verificar se algum elemento pai tem classe de tema escuro
      let element: HTMLElement | null = containerRef.current.parentElement;
      while (element) {
        const bgColor = window.getComputedStyle(element).backgroundColor;
        const classes = element.className || '';
        if (
          classes.includes('bg-[#0a0a0f]') ||
          classes.includes('bg-black') ||
          bgColor.includes('rgb(10, 10, 15)') ||
          bgColor === 'rgb(0, 0, 0)'
        ) {
          setIsDarkTheme(true);
          return;
        }
        element = element.parentElement;
      }
      setIsDarkTheme(false);
    };
    
    checkTheme();
    // Verificar novamente após um pequeno delay
    const timer = setTimeout(checkTheme, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`w-full max-w-xl mx-auto ${isDarkTheme ? 'bg-white/5 backdrop-blur-xl border-white/10 text-white' : 'bg-white border-gray-200'} rounded-2xl shadow-2xl p-6 border relative overflow-hidden`}
    >
      {/* Efeito de brilho animado */}
      <div className={`absolute inset-0 bg-gradient-to-r ${isDarkTheme ? 'from-purple-500/10 via-blue-500/10 to-purple-500/10' : 'from-blue-500/5 via-purple-500/5 to-blue-500/5'} animate-shimmer opacity-50`}></div>
      
      <div className="relative z-10">
        <div className="text-center mb-4">
          <div className={`w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 ${isDarkTheme ? 'shadow-lg shadow-purple-500/50' : 'shadow-md'} animate-pulse-glow`}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className={`text-2xl font-bold mb-1 ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>Validador de Licenças</h2>
          <p className={`text-sm ${isDarkTheme ? 'text-white/60' : 'text-gray-500'}`}>
            Validação em tempo real
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Key className={`w-4 h-4 ${isDarkTheme ? 'text-white/40' : 'text-gray-400'}`} />
            </div>
            <input
              type="text"
              value={licenseKey}
              onChange={handleKeyChange}
              placeholder="CF30D_XXXX_XXXX ou CF30DXXXXXXXX"
              className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-2 outline-none transition-all font-mono text-base tracking-wider ${
                isDarkTheme 
                  ? 'bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-purple-400 focus:ring-purple-400/20' 
                  : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-200'
              }`}
              maxLength={30}
            />
          </div>

          {/* Resultado da Validação Compacto */}
          {validationResult && (
            <div
              className={`p-3 rounded-lg border ${
                validationResult.valid
                  ? isDarkTheme 
                    ? 'bg-green-500/20 border-green-400/30' 
                    : 'bg-green-50 border-green-200'
                  : isDarkTheme
                    ? 'bg-red-500/20 border-red-400/30'
                    : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {validationResult.valid ? (
                  <>
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${isDarkTheme ? 'text-green-400' : 'text-green-600'}`} />
                    <p className={`text-sm font-medium ${isDarkTheme ? 'text-green-300' : 'text-green-900'}`}>
                      Licença válida! Redirecionando...
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className={`w-5 h-5 flex-shrink-0 ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`} />
                    <p className={`text-sm font-medium ${isDarkTheme ? 'text-red-300' : 'text-red-900'}`}>
                      {validationResult.message || 'Licença inválida'}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Indicador de Validação */}
          {isValidating && (
            <div className={`flex items-center justify-center gap-2 py-2 ${isDarkTheme ? 'text-purple-400' : 'text-blue-600'}`}>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Validando...</span>
            </div>
          )}

          {/* Informações Adicionais */}
          {!isValidating && !validationResult && licenseKey.length > 0 && licenseKey.length < 6 && (
            <div className={`flex items-center gap-2 text-xs py-1 ${isDarkTheme ? 'text-amber-400' : 'text-amber-600'}`}>
              <AlertCircle className="w-3 h-3" />
              <span>Mínimo 6 caracteres</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isValidating || licenseKey.length < 6}
            className={`w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] text-sm ${isDarkTheme ? 'shadow-purple-500/30' : ''}`}
          >
            {isValidating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando...
              </span>
            ) : (
              'Validar e Ativar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

