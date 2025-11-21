import React, { useState } from 'react';
import { ArrowLeft, FileText, Lock, User, Eye, EyeOff, Zap } from 'lucide-react';

interface CadernoLoginProps {
  onLoginSuccess: () => void;
  onBackToLanding: () => void;
}

export default function CadernoLogin({ onLoginSuccess, onBackToLanding }: CadernoLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validação offline das credenciais
    const validCredentials = {
      'caderno': 'caderno2025',
      'admin': 'admin123'
    };

    if (validCredentials[username as keyof typeof validCredentials] === password) {
      // Login bem-sucedido
      localStorage.setItem('cadernoAuthenticated', 'true');
      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess();
      }, 1000);
    } else {
      setTimeout(() => {
        setIsLoading(false);
        setError('Usuário ou senha incorretos');
      }, 1000);
    }
  };

  const handleDemoFill = () => {
    setUsername('caderno');
    setPassword('caderno2025');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background com imagem login.jpg */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/login.jpg)',
        }}
      ></div>
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-4 drop-shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </button>
          
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <FileText className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Caderno de Notas</h1>
          <p className="text-white/90 drop-shadow-md">Faça login para acessar o sistema de notas fiscais</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuário
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Digite seu usuário"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Digite sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar no Caderno de Notas'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <h3 className="text-sm font-medium text-blue-800 mb-3">Credenciais de Demonstração:</h3>
            <div className="text-xs text-blue-700 space-y-1 mb-3">
              <div className="flex justify-between items-center">
                <span><strong>caderno:</strong> caderno2025</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Caderno</span>
              </div>
              <div className="flex justify-between items-center">
                <span><strong>admin:</strong> admin123</span>
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Admin</span>
              </div>
            </div>
            <button
              onClick={handleDemoFill}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl w-full"
            >
              <Zap className="w-3 h-3" />
              Preencher Caderno
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2025 Webyte Desenvolvimentos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
