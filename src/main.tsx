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

// Remove loading fallback quando a aplicação carrega
const rootElement = document.getElementById('root');
const loadingFallback = document.getElementById('loading-fallback');

if (rootElement) {
  // Função para remover loading fallback
  const removeLoadingFallback = () => {
    // Marcar app como carregado
    document.body.classList.add('app-loaded');
    
    // Remover loading fallback após um pequeno delay para transição suave
    if (loadingFallback) {
      loadingFallback.style.opacity = '0';
      loadingFallback.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => {
        if (loadingFallback.parentNode) {
          loadingFallback.parentNode.removeChild(loadingFallback);
        }
      }, 300);
    }
  };

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

    // Remove loading após React carregar (aumentado para garantir que renderizou)
    // Usar requestAnimationFrame para garantir que o DOM foi atualizado
    requestAnimationFrame(() => {
      setTimeout(removeLoadingFallback, 200);
    });
  } catch (error) {
    console.error('Erro ao inicializar React:', error);
    // Mostrar erro ao usuário
    if (loadingFallback) {
      loadingFallback.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h2 style="color: white; margin-bottom: 10px;">Erro ao carregar aplicação</h2>
          <p style="color: rgba(255,255,255,0.9); margin-bottom: 20px;">Por favor, recarregue a página.</p>
          <button onclick="location.reload()" style="padding: 10px 20px; background: white; color: #10b981; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            Recarregar Página
          </button>
        </div>
      `;
    }
  }
} else {
  console.error('Elemento #root não encontrado');
}
