// Wrapper moderno que reutiliza ClientDashboard com tema escuro
import ClientDashboard from './ClientDashboard';

interface ClientDashboardModernProps {
  onBackToLogin: () => void;
}

export default function ClientDashboardModern({ onBackToLogin }: ClientDashboardModernProps) {
  // Aplicar tema moderno via CSS
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', 'modern');
  }

  return (
    <div className="theme-modern">
      <style>{`
        .theme-modern {
          --bg-primary: #0a0a0f;
          --bg-secondary: rgba(255, 255, 255, 0.05);
          --text-primary: #ffffff;
          --text-secondary: rgba(255, 255, 255, 0.7);
          --border-color: rgba(255, 255, 255, 0.1);
          --accent-purple: #a855f7;
          --accent-indigo: #6366f1;
        }
        
        .theme-modern .min-h-screen {
          background: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }
        
        .theme-modern header {
          background: rgba(0, 0, 0, 0.3) !important;
          backdrop-filter: blur(20px) !important;
          border-color: var(--border-color) !important;
        }
        
        .theme-modern aside {
          background: rgba(255, 255, 255, 0.05) !important;
          backdrop-filter: blur(20px) !important;
          border-color: var(--border-color) !important;
        }
        
        .theme-modern .bg-white {
          background: var(--bg-secondary) !important;
          backdrop-filter: blur(20px) !important;
          border-color: var(--border-color) !important;
          color: var(--text-primary) !important;
        }
        
        .theme-modern .text-gray-800,
        .theme-modern .text-gray-900 {
          color: var(--text-primary) !important;
        }
        
        .theme-modern .text-gray-600,
        .theme-modern .text-gray-700 {
          color: var(--text-secondary) !important;
        }
      `}</style>
      <ClientDashboard onBackToLogin={onBackToLogin} />
    </div>
  );
}

