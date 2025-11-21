import React, { useState, useEffect, useRef } from 'react';
import { Lock, User, Eye, EyeOff, Zap, ArrowRight, Building, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Notification, { NotificationType } from './Notification';
import RegisterModal from './RegisterModal';
import ResetPasswordModal from './ResetPasswordModal';
import ResetUsernameModal from './ResetUsernameModal';

interface LoginProps {
  onBackToLanding?: () => void;
  loginType?: 'client' | 'superadmin';
  onBackToSelector?: () => void;
}

interface LoginAttempt {
  timestamp: number;
  count: number;
}

export default function Login({ onBackToLanding, loginType, onBackToSelector }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRegisterTypeSelector, setShowRegisterTypeSelector] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showResetUsernameModal, setShowResetUsernameModal] = useState(false);
  const [registerType, setRegisterType] = useState<'pessoa-fisica' | 'pessoa-juridica'>('pessoa-fisica');
  const [rememberMe, setRememberMe] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const loginAttemptsRef = useRef<Map<string, LoginAttempt>>(new Map());
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'info',
    message: '',
    isVisible: false
  });

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameTouched(true);
    setPasswordTouched(true);

    // Validação antes de submeter
    if (usernameError || passwordError || !username.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos corretamente');
      return;
    }

    // Verificar rate limiting
    const identifier = username.toLowerCase().trim();
    if (!checkRateLimit(identifier)) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (success) {
        // Salvar credenciais se "Lembrar-me" estiver marcado
        if (rememberMe) {
          localStorage.setItem('ploutos_remembered_credentials', JSON.stringify({ username }));
        } else {
          localStorage.removeItem('ploutos_remembered_credentials');
        }

        // Limpar tentativas de login após sucesso
        loginAttemptsRef.current.delete(identifier);

        setNotification({
          type: 'success',
          message: 'Login realizado com sucesso!',
          isVisible: true
        });
      } else {
        const attempts = loginAttemptsRef.current.get(identifier);
        const remainingAttempts = attempts ? Math.max(0, 5 - attempts.count) : 4;
        
        if (remainingAttempts > 0) {
          setError(`Credenciais inválidas. ${remainingAttempts} tentativa(s) restante(s).`);
        } else {
          setError('Credenciais inválidas. Muitas tentativas falharam.');
        }
        
        setNotification({
          type: 'error',
          message: 'Credenciais inválidas. Verifique seu usuário e senha.',
          isVisible: true
        });
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Erro desconhecido';
      setError(`Erro ao fazer login: ${errorMessage}`);
      setNotification({
        type: 'error',
        message: 'Erro ao conectar com o servidor. Verifique sua conexão.',
        isVisible: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Autologin pós-pagamento (demo)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('autologin');
      if (raw) {
        const creds = JSON.parse(raw);
        setUsername(creds.username || '');
        setPassword(creds.password || '');
        localStorage.removeItem('autologin');
      }
    } catch {}
  }, []);

  // Carregar credenciais salvas se "Lembrar-me" foi usado anteriormente
  useEffect(() => {
    try {
      const savedCredentials = localStorage.getItem('ploutos_remembered_credentials');
      if (savedCredentials) {
        const creds = JSON.parse(savedCredentials);
        setUsername(creds.username || '');
        setRememberMe(true);
      }
    } catch {}
  }, []);

  // Validação em tempo real do username/email
  useEffect(() => {
    if (!usernameTouched && !username) return;
    
    if (!username.trim()) {
      setUsernameError('Usuário ou email é obrigatório');
    } else if (username.includes('@')) {
      // Validação de email básica
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(username)) {
        setUsernameError('Email inválido');
      } else {
        setUsernameError('');
      }
    } else if (username.length < 3) {
      setUsernameError('Usuário deve ter pelo menos 3 caracteres');
    } else {
      setUsernameError('');
    }
  }, [username, usernameTouched]);

  // Validação em tempo real da senha
  useEffect(() => {
    if (!passwordTouched && !password) return;
    
    if (!password.trim()) {
      setPasswordError('Senha é obrigatória');
    } else if (password.length < 3) {
      setPasswordError('Senha deve ter pelo menos 3 caracteres');
    } else {
      setPasswordError('');
    }
  }, [password, passwordTouched]);

  // Rate limiting - proteção contra força bruta
  const checkRateLimit = (identifier: string): boolean => {
    const now = Date.now();
    const attempts = loginAttemptsRef.current.get(identifier);
    const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
    const MAX_ATTEMPTS = 5;

    if (!attempts || now - attempts.timestamp > WINDOW_MS) {
      loginAttemptsRef.current.set(identifier, { timestamp: now, count: 1 });
      return true;
    }

    if (attempts.count >= MAX_ATTEMPTS) {
      const remainingTime = Math.ceil((WINDOW_MS - (now - attempts.timestamp)) / 1000 / 60);
      setError(`Muitas tentativas. Aguarde ${remainingTime} minuto(s) antes de tentar novamente.`);
      return false;
    }

    attempts.count++;
    loginAttemptsRef.current.set(identifier, attempts);
    return true;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  };

  const handleDemoFill = (type: 'client'|'demo' = 'client') => {
    if (type==='demo') {
      setUsername('demo');
      setPassword('demo123');
    } else {
      setUsername('Webyte');
      setPassword('Webyte');
    }
    setNotification({
      type: 'info',
      message: 'Credenciais de demonstração preenchidas automaticamente!',
      isVisible: true
    });
  };

  return (
    <>
      <div className="min-h-screen flex relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
        
        {/* Background com imagem login.jpg */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/login.jpg)',
          }}
        ></div>
        {/* Overlay escuro para melhorar legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60"></div>
        {/* Padrão de grade sutil animado */}
        <div 
          className="absolute inset-0 opacity-30 animate-pulse"
          style={{
            backgroundImage: `
              linear-gradient(rgba(16,185,129,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(16,185,129,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
        
        {/* Elementos decorativos animados */}
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-emerald-400/30 rounded-full animate-pulse blur-sm"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 border-4 border-teal-400/30 rounded-full animate-pulse blur-sm"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-cyan-400/20 rounded-full animate-float"></div>
        <div className="absolute bottom-1/3 right-1/3 w-20 h-20 border-2 border-emerald-400/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>

        {/* Lado Esquerdo - Welcome Area */}
        <div className="hidden lg:flex lg:w-2/3 flex-col items-center justify-center p-12 relative z-10">
          {/* Círculo com texto rotacionado e animações */}
          <div className="relative mb-12 animate-scale-in">
            <div className="w-64 h-64 lg:w-72 lg:h-72 rounded-full border-4 border-emerald-400/60 flex items-center justify-center relative group hover:border-emerald-400 transition-all duration-300 animate-pulse-glow" style={{ boxShadow: '0 0 60px rgba(16, 185, 129, 0.5), 0 0 120px rgba(20, 184, 166, 0.3)' }}>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 via-teal-400/30 to-cyan-400/30 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-cyan-400/20 group-hover:from-emerald-400/50 group-hover:via-teal-400/50 group-hover:to-cyan-400/50 transition-all duration-500"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/30 to-emerald-500/0 animate-shimmer opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-50 h-50 lg:w-44 lg:h-44 rounded-full bg-transparent flex items-center justify-center relative z-10 shadow-2xl transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <img 
                  src="/logo_header.png" 
                  alt="PloutosLedger" 
                  className="w-32 h-32 lg:w-36 lg:h-36 object-contain drop-shadow-2xl filter brightness-110 animate-pulse"
                />
              </div>
              {/* Texto rotacionado ao redor do círculo */}
              <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
                <svg className="w-full h-full" viewBox="0 0 320 320" style={{ transform: 'rotate(-90deg)' }}>
                  <defs>
                    <path id="circle-login" d="M 160, 160 m -120, 0 a 120,120 0 1,1 240,0 a 120,120 0 1,1 -240,0" />
                  </defs>
                  <text fill="#10b981" fontSize="14" fontFamily="Poppins, sans-serif" fontWeight="700" letterSpacing="0.3">
                    <textPath href="#circle-login" startOffset="0%">
                      PloutosLedger - Sistema completo de gestão financeira • Controle total do seu caixa • PDV • PIX Real•
                    </textPath>
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* Texto de boas-vindas */}
          <div className="text-center mb-8">
            <p className="text-sm uppercase tracking-widest text-white/90 mb-6 drop-shadow-lg" style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '0.2em' }}>
              ACESSE SUA CONTA
            </p>
            <h1 className="text-7xl lg:text-8xl font-black text-white leading-none mb-6 drop-shadow-[0_0_30px_rgba(16,185,129,0.8)] animate-fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>
              OLÁ<br />BEM-VINDO<br /><span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_40px_rgba(16,185,129,0.9)]">DE VOLTA!</span>
            </h1>
            <p className="text-xl text-white/90 mt-6 drop-shadow-lg animate-fade-in" style={{ fontFamily: 'Inter, sans-serif', animationDelay: '0.2s' }}>
              Sistema completo de gestão financeira com PDV avançado, analytics em tempo real e controle total do caixa.
            </p>
          </div>

          {/* Link Back to Home */}
          {onBackToLanding && (
            <button 
              onClick={onBackToLanding}
              className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors duration-200 group drop-shadow-lg"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
              <span>Voltar ao Início</span>
            </button>
          )}
        </div>

        {/* Lado Direito - Login Form */}
        <div className="w-full lg:w-1/3 flex items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md p-8 lg:p-10 border-2 border-emerald-200/50 animate-scale-in relative overflow-hidden group" style={{ boxShadow: '0 0 80px rgba(16, 185, 129, 0.3), 0 0 160px rgba(20, 184, 166, 0.2), inset 0 0 60px rgba(255, 255, 255, 0.1)' }}>
            {/* Efeito de brilho animado */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/30 via-teal-400/20 to-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl blur-2xl animate-pulse-slow"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 rounded-3xl animate-shimmer opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10">
            {/* Logo e título no mobile */}
            <div className="lg:hidden text-center mb-8">
              <div className="relative inline-block group mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <img 
                  src="/logo_header.png" 
                  alt="PloutosLedger Logo" 
                  className="h-32 sm:h-40 w-auto object-contain mx-auto relative z-10 drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300 filter brightness-110"
                />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2 animate-gradient drop-shadow-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
              PloutosLedger
              </h2>
              <p className="text-sm text-gray-600">
              {loginType === 'superadmin' 
                ? 'Acesso Super Administrador' 
                : loginType === 'client'
                ? 'Acesso da Loja'
                : 'Faça login para acessar o sistema'
              }
            </p>
              </div>

            {/* Título no desktop */}
            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2 animate-gradient" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {loginType === 'superadmin' 
                  ? 'Super Administrador' 
                  : loginType === 'client'
                  ? 'Dashboard da Loja'
                  : 'PloutosLedger'
                }
              </h2>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                {loginType === 'superadmin' 
                  ? 'Painel de controle total do sistema PloutosLedger'
                  : loginType === 'client'
                  ? 'Gerencie sua loja, estoque, vendas e relatórios financeiros'
                  : 'Sistema completo de gestão financeira com PDV avançado'
                }
              </p>
          </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Usuário ou Email <span className="text-red-500">*</span>
              </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameTouched(true);
                    }}
                    onBlur={() => setUsernameTouched(true)}
                    onKeyPress={handleKeyPress}
                    className={`w-full px-4 py-3 pr-10 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 hover:border-emerald-300 focus:shadow-lg hover:shadow-md transform hover:scale-[1.01] ${
                      usernameError && usernameTouched
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : usernameTouched && !usernameError && username
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-gray-200'
                    }`}
                    placeholder="Digite seu usuário ou email"
                    required
                    autoComplete="username"
                    disabled={isLoading}
                    aria-invalid={usernameError && usernameTouched ? 'true' : 'false'}
                    aria-describedby={usernameError && usernameTouched ? 'username-error' : undefined}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  {usernameTouched && !usernameError && username && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                    </div>
                  )}
                  {usernameTouched && usernameError && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                    </div>
                  )}
                </div>
                {usernameTouched && usernameError && (
                  <p id="username-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-4 h-4" />
                    {usernameError}
                  </p>
                )}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Senha <span className="text-red-500">*</span>
              </label>
                <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordTouched(true);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  onKeyPress={handleKeyPress}
                    className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 hover:border-emerald-300 focus:shadow-lg hover:shadow-md transform hover:scale-[1.01] ${
                      passwordError && passwordTouched
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : passwordTouched && !passwordError && password
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-gray-200'
                    }`}
                  placeholder="Digite sua senha"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  aria-invalid={passwordError && passwordTouched ? 'true' : 'false'}
                  aria-describedby={passwordError && passwordTouched ? 'password-error' : undefined}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded p-1"
                  disabled={isLoading}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordTouched && passwordError && (
                <p id="password-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </p>
              )}
            </div>

            {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4" role="alert" aria-live="polite">
                <p className="text-red-700 text-sm font-medium text-center flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </p>
              </div>
            )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                    aria-label="Lembrar credenciais de login"
                  />
                  <span className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>Lembrar-me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(true)}
                  className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Esqueci a senha
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isLoading || (usernameTouched && (!!usernameError || !!passwordError)) || !username.trim() || !password.trim()}
                  className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-3 px-6 rounded-full hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-300 font-semibold text-base shadow-xl hover:shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transform hover:scale-[1.05] hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  aria-label="Fazer login no sistema"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center relative z-10">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Entrando...
                    </div>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                      <span className="relative z-10">Entrar</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="w-12 h-12 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-full hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 flex items-center justify-center transform hover:scale-110 hover:rotate-12"
                  title="Acesso Rápido"
                >
                  <ArrowRight className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setShowRegisterTypeSelector(true)}
                    className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors hover:underline"
                  >
                    Cadastre-se
                  </button>
                </p>
            </div>
            </form>
            {/* Credenciais de Demo - Apenas em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-600 font-medium mb-3 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <strong>Credenciais de Teste:</strong>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={()=>handleDemoFill('client')} 
                    className="group flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white text-xs font-medium rounded-lg hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                    <Zap className="w-3 h-3 relative z-10" /> 
                    <span className="relative z-10">Cliente</span>
                  </button>
            <button
                    onClick={()=>handleDemoFill('demo')} 
                    className="group flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 text-white text-xs font-medium rounded-lg hover:from-teal-700 hover:via-cyan-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                    <Zap className="w-3 h-3 relative z-10" /> 
                    <span className="relative z-10">Demo</span>
                  </button>
                </div>
              </div>
              )}
          
            {/* Links adicionais */}
            <div className="mt-4 space-y-2 text-center">
            {onBackToSelector && (
              <button 
                onClick={onBackToSelector} 
                  className="text-sm text-gray-600 hover:text-emerald-600 transition-colors duration-200"
                  style={{ fontFamily: 'Inter, sans-serif' }}
              >
                ← Voltar ao seletor de acesso
              </button>
            )}
            </div>
            </div>
          </div>
        </div>
      </div>

      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        autoHide={true}
        duration={3000}
      />

      {/* Modais */}
      {/* Modal de Seleção de Tipo de Cadastro */}
      {showRegisterTypeSelector && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-gray-100">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2 animate-gradient" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Escolha o Tipo de Cadastro
              </h2>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                Selecione se você é pessoa física ou jurídica
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setRegisterType('pessoa-fisica');
                  setShowRegisterTypeSelector(false);
                  setShowRegisterModal(true);
                }}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-300 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-emerald-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Pessoa Física
                    </h3>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Para uso pessoal ou autônomo
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center group-hover:from-emerald-600 group-hover:to-teal-700 transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setRegisterType('pessoa-juridica');
                  setShowRegisterTypeSelector(false);
                  setShowRegisterModal(true);
                }}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-300 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-emerald-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Pessoa Jurídica
                    </h3>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                      Para empresas e estabelecimentos comerciais
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center group-hover:from-emerald-600 group-hover:to-teal-700 transition-all duration-300 transform group-hover:rotate-12 group-hover:scale-110 shadow-lg">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowRegisterTypeSelector(false)}
              className="w-full mt-6 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSuccess={(userData) => {
            setShowRegisterModal(false);
            setNotification({
              type: 'success',
              message: 'Cadastro realizado! Aguarde aprovação do administrador.',
              isVisible: true
            });
          }}
          userType={registerType}
        />
      )}

      {showResetPasswordModal && (
        <ResetPasswordModal
          onClose={() => setShowResetPasswordModal(false)}
          onSuccess={() => {
            setShowResetPasswordModal(false);
            setNotification({
              type: 'success',
              message: 'Código de recuperação enviado! Verifique seu WhatsApp.',
              isVisible: true
            });
          }}
        />
      )}

      {showResetUsernameModal && (
        <ResetUsernameModal
          onClose={() => setShowResetUsernameModal(false)}
          onSuccess={() => {
            setShowResetUsernameModal(false);
            setNotification({
              type: 'success',
              message: 'Código de recuperação enviado! Verifique seu WhatsApp.',
              isVisible: true
            });
          }}
        />
      )}
    </>
  );
}