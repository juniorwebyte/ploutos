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

// Renderiza a aplicação React
const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <App />
        </Suspense>
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  console.error('Elemento root não encontrado!');
}
