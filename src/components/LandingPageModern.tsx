import { useState, useEffect } from 'react';
import {
  Calculator,
  PlayCircle,
  LogIn,
  Shield,
  TrendingUp,
  Users,
  Clock,
  Zap,
  BarChart3,
  FileText,
  Printer,
  CreditCard,
  ArrowRight,
  CheckCircle,
  DollarSign,
  Building,
  Menu,
  X,
  ChevronRight,
  Star,
  MessageCircle,
  Bell,
  Database,
  ShoppingCart,
  Target,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Server,
  Cloud,
  Lock,
  Sparkles,
  Rocket
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import PaymentPage from './PaymentPage';
import LicenseValidator from './LicenseValidator';
import WebGLBackground from './WebGLBackground';
import plansService, { PlanRecord } from '../services/plansService';
import LiveChat from './LiveChat';
import CadernoDemo from './CadernoDemo';
import backendService from '../services/backendService';

interface LandingPageModernProps {
  onRequestLogin: () => void;
  onRequestDemo: () => void;
  onOpenAdmin?: () => void;
}

export default function LandingPageModern({ onRequestLogin, onRequestDemo, onOpenAdmin }: LandingPageModernProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFooterPage, setShowFooterPage] = useState(false);
  const [showClientRegistration, setShowClientRegistration] = useState(false);
  const [plans, setPlans] = useState<PlanRecord[]>(plansService.getPlans());
  const [showChat, setShowChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [showCadernoDemo, setShowCadernoDemo] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormData, setContactFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const unsub = plansService.subscribe((updated) => setPlans(updated));
    return () => unsub();
  }, []);

  // Rastrear posição do mouse para efeitos de parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSelectPlan = (plan: PlanRecord) => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
    onRequestLogin();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden relative" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* WebGL Background */}
      <WebGLBackground 
        intensity={0.4} 
        speed={1.2}
        colors={[[0.3, 0.1, 0.5], [0.2, 0.2, 0.6], [0.4, 0.1, 0.4]]}
      />
      
      {/* Efeito de partículas de fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20"></div>
        {/* Partículas flutuantes */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-30 animate-float"
            style={{
              width: Math.random() * 120 + 20,
              height: Math.random() * 120 + 20,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${i % 4 === 0 ? '#a855f7' : i % 4 === 1 ? '#3b82f6' : i % 4 === 2 ? '#ec4899' : '#10b981'} 0%, transparent 70%)`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 15 + 10}s`,
              filter: 'blur(1px)',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-50 bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50 transform hover:rotate-12 transition-transform duration-300 animate-pulse-glow">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-gradient" style={{ fontFamily: 'Poppins, sans-serif' }}>
                PloutosLedger
              </span>
            </div>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Recursos</a>
              <a href="#pricing" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Planos</a>
              <a href="#about" className="text-white/80 hover:text-white transition-colors text-sm font-medium">Sobre</a>
              <button
                onClick={onRequestLogin}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 text-sm font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:scale-105"
              >
                Entrar
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/10">
            <div className="container mx-auto px-4 py-6 space-y-4">
              <a href="#features" className="block text-white/80 hover:text-white transition-colors">Recursos</a>
              <a href="#pricing" className="block text-white/80 hover:text-white transition-colors">Planos</a>
              <a href="#about" className="block text-white/80 hover:text-white transition-colors">Sobre</a>
              <button
                onClick={onRequestLogin}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 text-sm font-semibold"
              >
                Entrar
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-300 text-sm font-medium mb-4 backdrop-blur-sm animate-fade-in hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-300 shadow-lg shadow-purple-500/20">
                <Sparkles className="w-4 h-4 animate-pulse" />
                Sistema Completo de Gestão Financeira
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight animate-fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>
                <span className="block text-white drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]">Descubra seu</span>
                <span className="block bg-gradient-to-r from-purple-400 via-pink-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_30px_rgba(139,92,246,0.8)]">
                  caminho para o
                </span>
                <span className="block text-white drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]">sucesso financeiro</span>
              </h1>

              <p className="text-xl text-white/70 max-w-2xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                Aprenda e gerencie seu negócio financeiro rapidamente, diretamente do seu dispositivo. 
                Controle total do caixa, PDV avançado e analytics em tempo real.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={onRequestLogin}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 via-indigo-600 to-purple-600 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 text-white font-semibold text-lg shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/70 transform hover:scale-110 hover:-translate-y-1 flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                  <span className="relative z-10">Começar Agora</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                </button>
                <button
                  onClick={onRequestDemo}
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 hover:border-purple-400/50 transition-all duration-300 text-white font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/30 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5" />
                  Ver Demo
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 justify-center lg:justify-start pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 border-2 border-black/50"
                      />
                    ))}
                  </div>
                  <span className="text-white/60 text-sm">+500 empresas ativas</span>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              {/* Container com efeito glassmorphism e glow melhorado */}
              <div 
                className="relative bg-white/10 backdrop-blur-2xl border-2 border-white/20 rounded-3xl p-6 shadow-2xl transform hover:scale-[1.05] transition-all duration-500 group"
                style={{
                  boxShadow: '0 0 100px rgba(139, 92, 246, 0.6), 0 0 200px rgba(236, 72, 153, 0.4), 0 0 300px rgba(99, 102, 241, 0.3), inset 0 0 60px rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Efeito de brilho animado melhorado */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/40 via-pink-500/30 to-indigo-500/0 rounded-3xl animate-shimmer opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-transparent to-indigo-500/30 rounded-3xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 via-transparent to-transparent rounded-3xl" />
                
                {/* Validador de Licenças */}
                <div className="relative z-10">
                  <LicenseValidator
                    onValidLicense={(key) => {
                      if (onRequestLogin) {
                        onRequestLogin();
                      }
                    }}
                    onInvalidLicense={(message) => {
                      console.error('Licença inválida:', message);
                    }}
                  />
                </div>
              </div>

              {/* Efeito de brilho ao redor */}
              <div 
                className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 via-pink-600/20 to-indigo-600/30 rounded-3xl blur-3xl -z-10 animate-pulse"
              />
              <div 
                className="absolute -inset-8 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 rounded-3xl blur-[60px] -z-20 animate-pulse-slow"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Recursos Revolucionários
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Tecnologia de ponta para maximizar sua produtividade e controle financeiro
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 hover:border-purple-400/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0 rounded-2xl opacity-0 group-hover:opacity-100 animate-shimmer" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/40 group-hover:shadow-purple-500/60 transform group-hover:rotate-12 transition-all duration-300">
                  <Zap className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Rápido</h3>
                <p className="text-white/70 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Sem tempo? Sem problemas! O PloutosLedger ensina você a gerenciar suas finanças e ajuda você a lançar seu primeiro projeto mais rápido do que você pode imaginar.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 hover:border-blue-400/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/20 to-blue-500/0 rounded-2xl opacity-0 group-hover:opacity-100 animate-shimmer" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/40 group-hover:shadow-blue-500/60 transform group-hover:rotate-12 transition-all duration-300">
                  <Target className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Profundo</h3>
                <p className="text-white/70 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Aprenda Web3 de forma simplificada. O PloutosLedger leva você do zero ao herói, tornando o aprendizado complexo simples e acessível.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:border-white/20 hover:border-emerald-400/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 rounded-2xl opacity-0 group-hover:opacity-100 animate-shimmer" />
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/40 group-hover:shadow-emerald-500/60 transform group-hover:rotate-12 transition-all duration-300">
                  <Smartphone className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>Mobile</h3>
                <p className="text-white/70 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Você precisa aprender quando funciona para você. Acesse de qualquer lugar, a qualquer momento, diretamente do seu dispositivo móvel.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Escolha seu Plano
              </span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Planos flexíveis para empresas de todos os tamanhos
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative bg-white/5 backdrop-blur-xl border-2 rounded-2xl p-8 transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 ${
                  plan.isRecommended
                    ? 'border-purple-500/50 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50'
                    : 'border-white/10 hover:border-white/20 hover:border-purple-400/30'
                }`}
              >
                {plan.isRecommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 rounded-full text-white text-sm font-semibold shadow-lg shadow-purple-500/50 animate-pulse-glow">
                    Recomendado
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-black text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      R$ {(plan.priceCents / 100).toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-white/60">/mês</span>
                  </div>
                  <p className="text-white/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {plan.description}
                  </p>
                </div>
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    plan.isRecommended
                      ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60'
                      : 'bg-white/10 hover:bg-white/20 hover:bg-purple-500/20 text-white border border-white/20 hover:border-purple-400/50'
                  }`}
                >
                  Escolher Plano
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transform hover:rotate-12 transition-all duration-300">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent animate-gradient" style={{ fontFamily: 'Poppins, sans-serif' }}>
                PloutosLedger
              </span>
            </div>
            <p className="text-white/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              © 2024 PloutosLedger. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          onPaymentComplete={handlePaymentComplete}
          selectedPlan={selectedPlan}
        />
      )}

      {showChat && (
        <LiveChat
          isOpen={showChat}
          onToggle={() => setShowChat(false)}
          isMinimized={isChatMinimized}
          onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
        />
      )}
    </div>
  );
}

