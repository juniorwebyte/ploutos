import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log detalhado do erro (usar logger quando disponível)
    const errorDetails = {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };
    
    // Usar console.error diretamente aqui pois logger pode não estar disponível ainda
    if (typeof console !== 'undefined' && console.error) {
      console.error('ErrorBoundary capturou um erro:', errorDetails);
    }

    // Salvar erro no localStorage para análise posterior (apenas em desenvolvimento)
    // Com tratamento seguro de erro
    if (process.env.NODE_ENV === 'development' || import.meta.env.DEV) {
      try {
        if (typeof localStorage !== 'undefined') {
          const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
          errorLogs.push({
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
          });
          // Manter apenas os últimos 10 erros
          const recentLogs = errorLogs.slice(-10);
          localStorage.setItem('errorLogs', JSON.stringify(recentLogs));
        }
      } catch (e) {
        // Falha silenciosa ao salvar logs (localStorage pode estar bloqueado)
      }
    }

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Recarregar a página em caso de erro crítico
    if (this.state.error?.message.includes('chunk')) {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;
      const { error } = this.state;

      if (Fallback && error) {
        return <Fallback error={error} resetError={this.handleReset} />;
      }

      return (
        <div 
          role="alert" 
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl border border-red-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-white" aria-hidden="true" />
              <h2 className="text-xl font-bold text-white">Erro Inesperado</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Ocorreu um erro inesperado ao carregar a aplicação. Isso pode ser temporário.
              </p>
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-semibold text-red-800 mb-1">Detalhes do erro:</p>
                  <p className="text-xs text-red-700 font-mono break-words" aria-live="polite">
                    {error.message || 'Erro desconhecido'}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  aria-label="Tentar novamente"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Tentar Novamente
                </button>
                
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-200 px-4 py-2.5 text-gray-800 font-medium shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-200"
                  aria-label="Voltar ao início"
                >
                  <Home className="w-4 h-4" aria-hidden="true" />
                  Início
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    Detalhes técnicos (apenas em desenvolvimento)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

export default ErrorBoundary;


