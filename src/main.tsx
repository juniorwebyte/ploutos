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
    rootElement.classList.add('loaded');
    // Remove estilos inline de loading após React carregar
    const inlineStyle = document.querySelector('style');
    if (inlineStyle && inlineStyle.textContent?.includes('#root::before')) {
      // Adiciona regra CSS para ocultar o loading quando a classe 'loaded' está presente
      const style = document.createElement('style');
      style.textContent = '#root.loaded::before, #root.loaded::after { display: none !important; }';
      document.head.appendChild(style);
    }
  };

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>
  );

  // Remove loading após React carregar
  setTimeout(removeInlineLoading, 100);
}
