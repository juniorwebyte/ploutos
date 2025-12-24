import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css'
import './styles/performance.css';
import ErrorBoundary from './components/ErrorBoundary';

// Componente de loading otimizado
const LoadingFallback = () => (
  <div 
    role="status" 
    aria-live="polite"
    className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center"
  >
    <div className="text-center">
      <div 
        className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4" 
        aria-hidden="true" 
      />
      <p className="text-white text-xl font-semibold">Carregando PloutosLedger...</p>
      <p className="text-white/80 text-sm mt-2">Por favor, aguarde</p>
    </div>
  </div>
);

// Remove loading inline do HTML quando a aplicação carrega
const rootElement = document.getElementById('root');
if (rootElement) {
  // Remove loading após a aplicação iniciar
  const removeInlineLoading = () => {
    try {
      rootElement.classList.add('loaded');
      // Remove estilos inline de loading após React carregar
      const inlineStyle = document.querySelector('style');
      if (inlineStyle && inlineStyle.textContent?.includes('#root::before')) {
        // Adiciona regra CSS para ocultar o loading quando a classe 'loaded' está presente
        const style = document.createElement('style');
        style.textContent = '#root.loaded::before, #root.loaded::after { display: none !important; }';
        document.head.appendChild(style);
      }
    } catch (e) {
      console.warn('Erro ao remover loading:', e);
    }
  };

  // Timeout de segurança: se após 10 segundos ainda estiver carregando, mostrar erro
  const loadingTimeout = setTimeout(() => {
    console.error('⚠️ Aplicação demorou mais de 10 segundos para carregar. Verifique o console para erros.');
    // Não fazer nada aqui, deixar o ErrorBoundary ou Suspense lidar com isso
  }, 10000);

  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <App />
          </Suspense>
        </ErrorBoundary>
      </StrictMode>
    );

    // Remove loading após React carregar e limpa timeout
    setTimeout(() => {
      clearTimeout(loadingTimeout);
      removeInlineLoading();
    }, 100);
  } catch (error) {
    clearTimeout(loadingTimeout);
    console.error('Erro ao inicializar aplicação:', error);
    // Mostrar erro na tela
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; text-align: center;">
        <div>
          <h1 style="font-size: 24px; margin-bottom: 16px;">Erro ao Carregar Aplicação</h1>
          <p style="margin-bottom: 16px;">${error instanceof Error ? error.message : 'Erro desconhecido'}</p>
          <p style="margin-bottom: 16px; font-size: 12px; opacity: 0.8;">Verifique o console do navegador (F12) para mais detalhes</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; background: white; color: #059669; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
            Recarregar Página
          </button>
        </div>
      </div>
    `;
  }
} else {
  console.error('❌ Elemento root não encontrado! Verifique se o HTML tem um elemento com id="root"');
  document.body.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #dc2626; color: white; padding: 20px; text-align: center;">
      <div>
        <h1 style="font-size: 24px; margin-bottom: 16px;">Erro Crítico</h1>
        <p>Elemento root não encontrado. Verifique o arquivo index.html</p>
      </div>
    </div>
  `;
}
