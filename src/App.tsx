import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useVisualConfig } from './hooks/useVisualConfig';
import { useTheme } from './hooks/useTheme';
import ErrorBoundary from './components/ErrorBoundary';
import LoginSelector from './components/LoginSelector';
import ClientDashboard from './components/ClientDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import LicenseModal from './components/LicenseModal';
import PaymentPage from './components/PaymentPage';

// Lazy load components com tratamento de erro
const lazyWithErrorHandling = (importFn: () => Promise<any>) => {
  return React.lazy(() => {
    return importFn().catch((error) => {
      console.error('Erro ao carregar componente:', error);
      // Retornar um componente de erro como fallback
      return {
        default: () => (
          <div className="min-h-screen flex items-center justify-center bg-red-50">
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold text-red-800 mb-4">Erro ao Carregar Componente</h2>
              <p className="text-red-600 mb-4">{error.message || 'Erro desconhecido'}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Recarregar Página
              </button>
            </div>
          </div>
        ),
      };
    });
  });
};

const Login = lazyWithErrorHandling(() => import('./components/Login'));
const CashFlow = lazyWithErrorHandling(() => import('./components/CashFlow'));
const LandingPage = lazyWithErrorHandling(() => import('./components/LandingPageNew'));
const LandingPageModern = lazyWithErrorHandling(() => import('./components/LandingPageModern'));
const AdminPanel = lazyWithErrorHandling(() => import('./components/AdminPanel'));
const ClientDashboardModern = lazyWithErrorHandling(() => import('./components/ClientDashboardModern'));
const SuperAdminDashboardModern = lazyWithErrorHandling(() => import('./components/SuperAdminDashboardModern'));

// Componente para rota de pagamento
function PaymentRoute() {
  return <PaymentPage />;
}

type LoginType = 'client' | 'superadmin' | null;

function AppContent() {
  const { isAuthenticated, role, license } = useAuth();
  const { carregarConfiguracoesVisuais } = useVisualConfig();
  const { theme, isModern } = useTheme();
  const [loginType, setLoginType] = useState<LoginType>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  // Carregar configurações visuais ao inicializar
  useEffect(() => {
    carregarConfiguracoesVisuais();
  }, [carregarConfiguracoesVisuais]);

  useEffect(() => {
    // Se logado e licença bloqueada, exibir modal
    if (isAuthenticated && license && license.status === 'blocked') {
      setShowLicenseModal(true);
    }
  }, [isAuthenticated, license]);

  // Abrir demo via evento/global flag (pós-cadastro)
  useEffect(() => {
    const handler = () => {
      setShowDemo(true);
      setShowLanding(false);
    };
    window.addEventListener('ploutos:open-demo', handler);
    // flag de segurança
    const force = localStorage.getItem('force_open_demo');
    if (force === 'true') {
      handler();
      localStorage.removeItem('force_open_demo');
    }
    return () => window.removeEventListener('ploutos:open-demo', handler);
  }, []);

  const handleSelectLogin = useCallback((type: 'client' | 'superadmin') => {
    setLoginType(type);
    setShowLanding(false);
  }, []);

  const handleBackToLogin = useCallback(() => {
    setLoginType(null);
    setShowLanding(true);
  }, []);

  const handleBackToLanding = useCallback(() => {
    setShowLanding(true);
    setShowAdmin(false);
    setShowDemo(false);
  }, []);

  const handleShowAdmin = useCallback(() => {
    setShowAdmin(true);
    setShowLanding(false);
  }, []);

  const handleShowDemo = useCallback(() => {
    setShowDemo(true);
    setShowLanding(false);
  }, []);


  // Se não está autenticado, mostrar seletor de login
  if (!isAuthenticated) {
    if (showLanding) {
      return (
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center" role="status" aria-live="polite">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4" aria-hidden="true"></div>
              <div className="text-white text-xl font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Carregando...</div>
            </div>
          </div>
        }>
          {isModern ? (
            <LandingPageModern 
              onRequestLogin={() => handleSelectLogin('client')}
              onRequestDemo={handleShowDemo}
              onOpenAdmin={() => handleSelectLogin('superadmin')}
            />
          ) : (
            <LandingPage 
              onRequestLogin={() => handleSelectLogin('client')}
              onRequestDemo={handleShowDemo}
              onOpenAdmin={() => handleSelectLogin('superadmin')}
            />
          )}
        </Suspense>
      );
    }

    if (showAdmin) {
      return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center">
          <div className="text-white text-xl">Carregando...</div>
        </div>}>
          <AdminPanel onBackToLanding={handleBackToLanding} />
        </Suspense>
      );
    }

    if (showDemo) {
      return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center">
          <div className="text-white text-xl">Carregando...</div>
        </div>}>
          <CashFlow isDemo={true} onBackToLanding={handleBackToLanding} />
        </Suspense>
      );
    }


    // Se há tipo de login selecionado, mostrar tela de login
    if (loginType) {
      return (
        <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center">
          <div className="text-white text-xl">Carregando...</div>
        </div>}>
          <Login 
            loginType={loginType}
            onBackToSelector={handleBackToLogin}
          />
        </Suspense>
      );
    }

    // Se não há tipo de login selecionado, mostrar seletor
    return <LoginSelector onSelectLogin={handleSelectLogin} />;
  }

  // Se está autenticado, mostrar dashboard baseado no role e tema
  if (role === 'superadmin') {
    return isModern ? (
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center" role="status" aria-live="polite">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4" aria-hidden="true"></div>
            <div className="text-white text-xl font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Carregando Dashboard...</div>
          </div>
        </div>
      }>
        <SuperAdminDashboardModern onBackToLogin={handleBackToLogin} />
      </Suspense>
    ) : (
      <SuperAdminDashboard onBackToLogin={handleBackToLogin} />
    );
  } else {
    return isModern ? (
      <Suspense fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center" role="status" aria-live="polite">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4" aria-hidden="true"></div>
            <div className="text-white text-xl font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Carregando Dashboard...</div>
          </div>
        </div>
      }>
        <ClientDashboardModern onBackToLogin={handleBackToLogin} />
      </Suspense>
    ) : (
      <ClientDashboard onBackToLogin={handleBackToLogin} />
    );
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center" role="status" aria-live="polite" aria-label="Carregando aplicação">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4" aria-hidden="true"></div>
                <div className="text-white text-xl font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>Carregando PloutosLedger...</div>
                <div className="text-white/80 text-sm mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>Por favor, aguarde</div>
              </div>
            </div>
          }>
            <Routes>
              <Route path="/pay/:linkinvoiceId" element={<PaymentRoute />} />
              <Route path="/*" element={<AppContent />} />
            </Routes>
            <LicenseModal isOpen={false} onClose={() => {}} onSubmitKey={() => {}} />
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;