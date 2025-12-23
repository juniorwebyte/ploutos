import { useState, useEffect } from 'react';
import { BUSINESS_CONFIG } from '../config/system';
import FooterPages from './FooterPages';
import ClientRegistration from './ClientRegistration';
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
  Shield as ShieldIcon,
  Lock,
  Unlock,
  Eye,
  Settings,
  PieChart,
  LineChart,
  AreaChart,
  Mail,
  Phone,
  Send,
  Info,
  MapPin,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import PaymentPage from './PaymentPage';
import LicenseValidator from './LicenseValidator';
import plansService, { PlanRecord } from '../services/plansService';
import LiveChat from './LiveChat';
import CadernoDemo from './CadernoDemo';
import TimeClockDemo from './TimeClockDemo';
import backendService from '../services/backendService';

interface LandingPageNewProps {
  onRequestLogin: () => void;
  onRequestDemo: () => void;
  onOpenAdmin?: () => void;
}

export default function LandingPageNew({ onRequestLogin, onRequestDemo, onOpenAdmin }: LandingPageNewProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFooterPage, setShowFooterPage] = useState(false);
  const [showClientRegistration, setShowClientRegistration] = useState(false);
  const [plans, setPlans] = useState<PlanRecord[]>(plansService.getPlans());
  const [showChat, setShowChat] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [showCadernoDemo, setShowCadernoDemo] = useState(false);
  const [showTimeClockDemo, setShowTimeClockDemo] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormData, setContactFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactFormErrors, setContactFormErrors] = useState({ name: '', email: '', message: '' });
  const [contactFormTouched, setContactFormTouched] = useState({ name: false, email: false, message: false });

  useEffect(() => {
    const unsub = plansService.subscribe((updated) => setPlans(updated));
    return () => unsub();
  }, []);

  // Validação em tempo real do formulário de contato
  useEffect(() => {
    const errors: { name: string; email: string; message: string } = { name: '', email: '', message: '' };
    
    if (contactFormTouched.name) {
      if (!contactFormData.name.trim()) {
        errors.name = 'Nome é obrigatório';
      } else if (contactFormData.name.trim().length < 3) {
        errors.name = 'Nome deve ter pelo menos 3 caracteres';
      }
    }
    
    if (contactFormTouched.email) {
      if (!contactFormData.email.trim()) {
        errors.email = 'E-mail é obrigatório';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contactFormData.email)) {
          errors.email = 'E-mail inválido';
        }
      }
    }
    
    if (contactFormTouched.message) {
      if (!contactFormData.message.trim()) {
        errors.message = 'Mensagem é obrigatória';
      } else if (contactFormData.message.trim().length < 10) {
        errors.message = 'Mensagem deve ter pelo menos 10 caracteres';
      }
    }
    
    setContactFormErrors(errors);
  }, [contactFormData, contactFormTouched]);

  const handlePaymentComplete = (paymentData: any) => {
    setShowPaymentModal(false);
    // Salvar TXID no localStorage para ativação posterior
    if (paymentData?.cobranca?.txid) {
      localStorage.setItem('pending_subscription_txid', paymentData.cobranca.txid);
    }
    // Redirecionar para login/criação de conta
    onRequestLogin();
  };

  const handleClientRegistrationSuccess = (clientData: any) => {
    setShowClientRegistration(false);
    onRequestDemo();
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header moderno e limpo com animação em espelho */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm animate-slide-down">
        {/* Efeito de espelho/reflexo */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-20">
            {/* Logo e Nome da Empresa */}
            <div className="flex items-center space-x-3 animate-fade-in-left">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300 animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-xl group-hover:from-emerald-500/40 group-hover:via-teal-500/40 group-hover:to-cyan-500/40 transition-all duration-500"></div>
                <img 
                  src="/cabecalho.png" 
                  alt="PloutosLedger Logo" 
                  className="h-12 sm:h-14 lg:h-16 w-auto object-contain relative z-10 drop-shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 filter brightness-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div className="animate-fade-in-left" style={{ animationDelay: '0.1s' }}>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent animate-gradient drop-shadow-lg transform hover:scale-105 transition-transform duration-300" style={{ fontFamily: 'Poppins, sans-serif' }}>{BUSINESS_CONFIG.COMPANY.BRAND}</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-6 animate-fade-in-right" role="navigation" aria-label="Navegação principal">
              <a 
                href="#features" 
                className="relative text-gray-700 hover:text-emerald-600 transition-all duration-300 font-medium text-sm group py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                aria-label="Ir para seção de recursos"
              >
                <span className="relative z-10">Recursos</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a 
                href="#pricing" 
                className="relative text-gray-700 hover:text-emerald-600 transition-all duration-300 font-medium text-sm group py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                aria-label="Ir para seção de planos"
              >
                <span className="relative z-10">Planos</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
              </a>
              <button 
                onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="relative text-gray-700 hover:text-emerald-600 transition-all duration-300 font-medium text-sm group py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                aria-label="Ir para seção sobre"
              >
                <span className="relative z-10">Sobre</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
              </button>
              <button 
                onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="relative text-gray-700 hover:text-emerald-600 transition-all duration-300 font-medium text-sm group py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
                aria-label="Ir para seção de contato"
              >
                <span className="relative z-10">Contato</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 group-hover:w-full transition-all duration-300"></span>
              </button>
              <button
                onClick={onRequestLogin}
                className="group relative text-gray-700 hover:text-emerald-600 transition-all duration-300 font-medium text-sm flex items-center space-x-1.5 py-2 px-3 rounded-lg hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                aria-label="Fazer login no sistema"
              >
                <LogIn className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" aria-hidden="true" />
                <span className="relative z-10">Entrar</span>
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              </button>
              <button
                onClick={() => setShowClientRegistration(true)}
                className="group relative px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-lg hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transform hover:scale-105 hover:-translate-y-0.5 overflow-hidden"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>Começar Grátis</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-110 animate-fade-in-right focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 transform rotate-90 transition-transform duration-300" aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6 transform transition-transform duration-300" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Mobile Menu com animação */}
          <div 
            id="mobile-menu"
            className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            role="menu"
            aria-label="Menu de navegação mobile"
          >
            <div className="border-t border-gray-100 py-4 space-y-2">
              <a 
                href="#features" 
                className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all duration-300 transform hover:translate-x-2 hover:shadow-sm" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Recursos
              </a>
              <a 
                href="#pricing" 
                className="block px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all duration-300 transform hover:translate-x-2 hover:shadow-sm" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Planos
              </a>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' }); }} 
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all duration-300 transform hover:translate-x-2 hover:shadow-sm"
              >
                Sobre
              </button>
              <button 
                onClick={() => { setIsMobileMenuOpen(false); document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }); }} 
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all duration-300 transform hover:translate-x-2 hover:shadow-sm"
              >
                Contato
              </button>
              <button 
                onClick={() => { onRequestLogin(); setIsMobileMenuOpen(false); }} 
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all duration-300 transform hover:translate-x-2 hover:shadow-sm flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </button>
              <button 
                onClick={() => { setShowClientRegistration(true); setIsMobileMenuOpen(false); }} 
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-lg hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Começar Grátis
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Vídeo de Fundo */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster="/logo_header.png"
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
          >
            <source src="/banner.mp4" type="video/mp4" />
          </video>
          <div className="hidden absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600" style={{ display: 'none' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60"></div>
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-white">
              <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-1.5 mb-6 animate-fade-in hover:bg-white/30 hover:border-emerald-400/50 transition-all duration-300 shadow-lg shadow-emerald-500/20">
                <DollarSign className="w-4 h-4 text-emerald-300 animate-pulse" />
                <span className="text-white text-sm font-medium">Sistema PIX Real Integrado</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Controle Total do Seu <span className="text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)] bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">Caixa</span>
              </h1>

              <p className="text-lg text-white/90 mb-8 leading-relaxed max-w-xl" style={{ fontFamily: 'Inter, sans-serif' }}>
                Sistema completo de gestão financeira com PDV avançado, analytics em tempo real, 
                chat interno, notificações inteligentes, backup automático, login seguro com validação 
                em tempo real e proteção contra força bruta.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button
                  onClick={() => setShowClientRegistration(true)}
                  className="group px-6 py-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-lg hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 shadow-xl hover:shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 flex items-center justify-center space-x-2 font-semibold transform hover:scale-110 hover:-translate-y-1 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  aria-label="Testar sistema gratuitamente por 30 dias"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                  <PlayCircle className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" aria-hidden="true" />
                  <span className="relative z-10">Testar Grátis por 30 Dias</span>
                </button>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-lg hover:bg-white/20 hover:border-emerald-400/50 transition-all duration-300 flex items-center justify-center space-x-2 font-semibold hover:shadow-lg hover:shadow-emerald-500/30 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  aria-label="Ver planos e preços disponíveis"
                >
                  <CreditCard className="w-5 h-5" aria-hidden="true" />
                  <span>Ver Planos</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Cancelamento gratuito</span>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 via-teal-400/20 to-cyan-400/30 rounded-2xl blur-3xl animate-pulse"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-2xl blur-xl animate-pulse-slow"></div>
              <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-6 transform hover:scale-[1.02] transition-all duration-500" style={{ boxShadow: '0 0 60px rgba(16, 185, 129, 0.4), 0 0 120px rgba(20, 184, 166, 0.3), inset 0 0 40px rgba(255, 255, 255, 0.1)' }}>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 rounded-2xl animate-shimmer opacity-50 group-hover:opacity-100 transition-opacity"></div>
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
            </div>
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 animate-fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>Novos Recursos Revolucionários</h2>
            <p className="text-xl text-gray-600 animate-fade-in" style={{ fontFamily: 'Inter, sans-serif' }}>Tecnologia de ponta para maximizar sua produtividade</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: PieChart, title: "Analytics Avançado", desc: "Dashboard executivo com métricas em tempo real", color: "from-blue-500 to-purple-600" },
              { icon: MessageCircle, title: "Chat em Tempo Real", desc: "Comunicação instantânea entre equipes", color: "from-green-500 to-emerald-600" },
              { icon: Bell, title: "Notificações Inteligentes", desc: "Central de notificações com categorização", color: "from-orange-500 to-red-600" },
              { icon: Database, title: "Backup Automático", desc: "Proteção total dos seus dados", color: "from-purple-500 to-pink-600" }
            ].map((feature, index) => (
              <div key={index} className="group bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:scale-105 border border-gray-100 hover:border-emerald-300/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/50 rounded-xl transition-all duration-300"></div>
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10`}>
                  <feature.icon className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{feature.title}</h3>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 animate-fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>Sistema Completo de Gestão</h2>
            <p className="text-xl text-gray-600 animate-fade-in" style={{ fontFamily: 'Inter, sans-serif' }}>Mais de 20 recursos profissionais para transformar seu negócio</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: Clock, 
                title: "Controle de Ponto Eletrônico", 
                desc: "Sistema completo de registro de ponto com múltiplos métodos: manual, geolocalização, QR Code e IP autorizado. Gestão de jornadas, escalas, justificativas e relatórios completos.",
                demo: 'timeclock',
                highlight: true
              },
              { 
                icon: FileText, 
                title: "Caderno de Notas Fiscais", 
                desc: "Gestão completa de notas fiscais com sistema de parcelas, controle de entrada/saída, datas de fabricação, NFE, vencimento e total. Interface intuitiva e relatórios detalhados.",
                demo: 'caderno',
                highlight: true
              },
              { 
                icon: DollarSign, 
                title: "Movimento de Caixa", 
                desc: "Controle total de entradas e saídas financeiras. Registre dinheiro, cartões, PIX, boletos, cheques, descontos, retiradas e comissões com validação automática e relatórios profissionais.",
                highlight: true
              },
              { icon: Calculator, title: "Gestão de Entradas", desc: "Controle total de dinheiro, cartões, PIX, boletos e cheques" },
              { icon: BarChart3, title: "Controle de Saídas", desc: "Registre descontos, retiradas, vales e comissões" },
              { icon: Users, title: "Comissões", desc: "Sistema automático de cálculo de comissões" },
              { icon: Printer, title: "Relatórios Completos", desc: "Cupons profissionais otimizados" },
              { icon: Shield, title: "Segurança Total", desc: "Backup automático, validações robustas e proteção contra força bruta" },
              { icon: CreditCard, title: "Gateway de Pagamento", desc: "Aceite PIX, cartões e criptomoedas" },
              { icon: Building, title: "PDV Completo", desc: "Ponto de venda com leitor de código de barras" },
              { icon: Zap, title: "Performance", desc: "Sistema rápido e responsivo" },
              { icon: ShoppingCart, title: "PDV Avançado", desc: "Ponto de venda moderno integrado" },
              { icon: PieChart, title: "Analytics Dashboard", desc: "Dashboard executivo com métricas avançadas" },
              { icon: Bell, title: "Sistema de Notificações", desc: "Central de notificações inteligente" },
              { icon: MessageCircle, title: "Chat Interno", desc: "Sistema de comunicação em tempo real" },
              { icon: Database, title: "Backup Automático", desc: "Sistema de backup inteligente" },
              { icon: Activity, title: "Monitoramento", desc: "Monitoramento em tempo real" },
              { icon: Target, title: "Gestão de Metas", desc: "Defina e acompanhe metas de vendas" },
              { icon: Globe, title: "Multi-plataforma", desc: "Acesse de qualquer dispositivo" },
              { icon: Lock, title: "Login Seguro", desc: "Validação em tempo real, lembrar-me e proteção avançada" },
              { icon: Eye, title: "Acessibilidade", desc: "Interface acessível com suporte completo a leitores de tela" },
              { icon: Settings, title: "Personalização", desc: "Configure cores, logo e preferências do sistema" }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`group bg-gray-50 p-6 rounded-xl border-2 transition-all duration-300 hover:-translate-y-2 hover:scale-105 relative overflow-hidden ${
                  feature.highlight 
                    ? 'border-emerald-400 hover:border-emerald-500 hover:shadow-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/50' 
                    : 'border-gray-200 hover:border-emerald-300 hover:shadow-xl'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br rounded-xl transition-all duration-300 ${
                  feature.highlight
                    ? 'from-emerald-50/50 to-teal-50/50 group-hover:from-emerald-50/80 group-hover:to-teal-50/80'
                    : 'from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/50'
                }`}></div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white shadow-lg transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10 ${
                  feature.highlight
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}>
                  <feature.icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 relative z-10 group-hover:text-emerald-600 transition-colors flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {feature.title}
                  {feature.highlight && (
                    <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">NOVO</span>
                  )}
                </h3>
                <p className="text-gray-600 text-sm relative z-10 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>{feature.desc}</p>
                {feature.demo && (
                  <button
                    onClick={() => {
                      if (feature.demo === 'timeclock') {
                        setShowTimeClockDemo(true);
                      } else if (feature.demo === 'caderno') {
                        setShowCadernoDemo(true);
                      }
                    }}
                    className="relative z-10 text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group/btn"
                  >
                    <PlayCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    Testar Demo
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Demo Section */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
              <h3 className="text-2xl font-bold mb-4 relative z-10">Teste as Funcionalidades Gratuitamente</h3>
              <p className="text-emerald-100 mb-6">
                Experimente o Controle de Ponto Eletrônico e o Caderno de Notas sem cadastro ou compromisso.
              </p>
              <div className="flex flex-wrap justify-center gap-3 relative z-10">
                <button
                  onClick={() => setShowTimeClockDemo(true)}
                  className="group bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-all duration-300 flex items-center gap-2 transform hover:scale-110 hover:shadow-xl shadow-lg"
                >
                  <Clock className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Demo Controle de Ponto
                </button>
              <button
                onClick={() => setShowCadernoDemo(true)}
                  className="group bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-all duration-300 flex items-center gap-2 transform hover:scale-110 hover:shadow-xl shadow-lg"
              >
                  <FileText className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Demo Caderno de Notas
              </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 animate-fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>Planos Transparentes</h2>
            <p className="text-xl text-gray-600 animate-fade-in" style={{ fontFamily: 'Inter, sans-serif' }}>Escolha o plano ideal para o seu negócio</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.filter(plan => plan && plan.name && plan.priceCents).map((plan, index) => (
              <div 
                key={plan.id} 
                className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 ${
                  plan.isRecommended 
                    ? 'border-2 border-emerald-500 ring-4 ring-emerald-100 scale-105 shadow-2xl shadow-emerald-500/20' 
                    : 'border border-gray-200 hover:border-emerald-300'
                }`}
              >
                {plan.isRecommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-xl shadow-emerald-500/50 animate-pulse-glow">
                      <Star className="h-4 w-4 fill-current animate-pulse" />
                      Mais Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">R$ {(plan.priceCents / 100).toFixed(2)}</span>
                    <span className="text-gray-600 text-lg">/{plan.interval === 'monthly' ? 'mês' : 'ano'}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.featuresList && plan.featuresList.length > 0 ? (
                    plan.featuresList.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{plan.features || 'Recursos completos do sistema'}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { 
                    if(plan && plan.name) {
                      setSelectedPlan(plan); 
                      setShowPaymentModal(true); 
                    }
                  }}
                  className={`group w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${
                    plan.isRecommended
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 shadow-xl hover:shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60'
                      : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                  <span className="relative z-10">Assinar Agora</span>
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Todos os planos incluem:</p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                Segurança SSL
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-500" />
                Backup automático
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-500" />
                Suporte 24/7
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                Atualizações gratuitas
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Pronto para transformar sua gestão financeira?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
            Junte-se a centenas de empresários que já otimizaram o controle do caixa
          </p>
          <button
            onClick={() => setShowClientRegistration(true)}
            className="group px-8 py-4 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all duration-300 shadow-xl hover:shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 font-semibold inline-flex items-center space-x-2 transform hover:scale-110 hover:-translate-y-1 relative overflow-hidden"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/0 via-emerald-50/50 to-emerald-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
            <span className="relative z-10">Começar Agora - Grátis</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Sobre Section */}
      <section id="about-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <img 
                  src="/cabecalho.png" 
                  alt="PloutosLedger Logo" 
                  className="h-40 sm:h-48 lg:h-56 w-auto object-contain relative z-10 drop-shadow-2xl transform group-hover:scale-110 transition-transform duration-300 filter brightness-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 animate-fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>Sobre o PloutosLedger</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Somos uma equipe dedicada a transformar a gestão financeira de pequenas e médias empresas
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 mb-8">
                <Info className="w-12 h-12 text-emerald-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Nossa Missão</h3>
                <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Democratizar o acesso a ferramentas profissionais de gestão financeira, oferecendo 
                  tecnologia de ponta a preços acessíveis para que todas as empresas possam ter controle 
                  total do seu caixa.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
                <Target className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>Nossa Visão</h3>
                <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Ser referência nacional em sistemas de gestão financeira, reconhecido pela inovação, 
                  confiabilidade e pelo compromisso em entregar resultados reais para nossos clientes.
                </p>
              </div>
            </div>

            <div>
              <div className="space-y-6">
                {[
                  { icon: TrendingUp, title: "Inovação Constante", desc: "Desenvolvemos continuamente novas funcionalidades baseadas no feedback dos nossos clientes.", color: "emerald" },
                  { icon: Shield, title: "Segurança Total", desc: "Seus dados financeiros estão protegidos com criptografia de nível bancário.", color: "blue" },
                  { icon: Users, title: "Suporte Especializado", desc: "Nossa equipe está sempre disponível para ajudar você a maximizar os resultados.", color: "purple" },
                  { icon: Zap, title: "Simplicidade", desc: "Interface intuitiva que qualquer pessoa consegue usar, sem necessidade de treinamento complexo.", color: "orange" }
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`w-12 h-12 bg-${item.color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.title}</h4>
                      <p className="text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contato Section */}
      <section id="contact-section" className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4 animate-fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>Entre em Contato</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Estamos aqui para ajudar você a transformar a gestão financeira da sua empresa
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Informações de Contato</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">E-mail</h4>
                      <a href="mailto:contato@ploutosledger.com" className="text-emerald-600 hover:text-emerald-700">
                        contato@ploutosledger.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Telefone</h4>
                      <a href="tel:+5511984801839" className="text-blue-600 hover:text-blue-700">
                        (11) 98480-1839
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Endereço</h4>
                      <p className="text-gray-600">São Paulo, SP - Brasil</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3">Horário de Atendimento</h4>
                <div className="space-y-2 text-gray-600">
                  <p><strong className="text-gray-900">Segunda a Sexta:</strong> 9h às 18h</p>
                  <p><strong className="text-gray-900">Sábado:</strong> 9h às 13h</p>
                  <p><strong className="text-gray-900">Domingo:</strong> Fechado</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.01] border border-gray-100">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>Envie uma Mensagem</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                
                // Marcar todos os campos como tocados
                setContactFormTouched({ name: true, email: true, message: true });
                
                // Verificar se há erros
                if (contactFormErrors.name || contactFormErrors.email || contactFormErrors.message || 
                    !contactFormData.name.trim() || !contactFormData.email.trim() || !contactFormData.message.trim()) {
                  return;
                }
                
                setIsSubmittingContact(true);
                try {
                  const contacts = JSON.parse(localStorage.getItem('contact_leads') || '[]');
                  contacts.push({
                    ...contactFormData,
                    date: new Date().toISOString(),
                    status: 'new'
                  });
                  localStorage.setItem('contact_leads', JSON.stringify(contacts));

                  const online = await backendService.isOnline();
                  if (online) {
                    await backendService.post('/api/public/leads', {
                      name: contactFormData.name,
                      email: contactFormData.email,
                      phone: '',
                      company: '',
                      message: contactFormData.message
                    });
                  }

                  alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
                  setContactFormData({ name: '', email: '', message: '' });
                  setContactFormTouched({ name: false, email: false, message: false });
                  setContactFormErrors({ name: '', email: '', message: '' });
                } catch (error) {
                  alert('Erro ao enviar mensagem. Por favor, tente novamente.');
                } finally {
                  setIsSubmittingContact(false);
                }
              }} className="space-y-6" noValidate>
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    required
                    value={contactFormData.name}
                    onChange={(e) => {
                      setContactFormData(prev => ({ ...prev, name: e.target.value }));
                      setContactFormTouched(prev => ({ ...prev, name: true }));
                    }}
                    onBlur={() => setContactFormTouched(prev => ({ ...prev, name: true }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 ${
                      contactFormErrors.name && contactFormTouched.name
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : contactFormTouched.name && !contactFormErrors.name && contactFormData.name
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Seu nome"
                    aria-invalid={contactFormErrors.name && contactFormTouched.name ? 'true' : 'false'}
                    aria-describedby={contactFormErrors.name && contactFormTouched.name ? 'contact-name-error' : undefined}
                  />
                  {contactFormTouched.name && contactFormErrors.name && (
                    <p id="contact-name-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-4 h-4" />
                      {contactFormErrors.name}
                    </p>
                  )}
                  {contactFormTouched.name && !contactFormErrors.name && contactFormData.name && (
                    <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Nome válido
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    required
                    value={contactFormData.email}
                    onChange={(e) => {
                      setContactFormData(prev => ({ ...prev, email: e.target.value }));
                      setContactFormTouched(prev => ({ ...prev, email: true }));
                    }}
                    onBlur={() => setContactFormTouched(prev => ({ ...prev, email: true }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 ${
                      contactFormErrors.email && contactFormTouched.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : contactFormTouched.email && !contactFormErrors.email && contactFormData.email
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="seu@email.com"
                    aria-invalid={contactFormErrors.email && contactFormTouched.email ? 'true' : 'false'}
                    aria-describedby={contactFormErrors.email && contactFormTouched.email ? 'contact-email-error' : undefined}
                  />
                  {contactFormTouched.email && contactFormErrors.email && (
                    <p id="contact-email-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-4 h-4" />
                      {contactFormErrors.email}
                    </p>
                  )}
                  {contactFormTouched.email && !contactFormErrors.email && contactFormData.email && (
                    <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      E-mail válido
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensagem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={contactFormData.message}
                    onChange={(e) => {
                      setContactFormData(prev => ({ ...prev, message: e.target.value }));
                      setContactFormTouched(prev => ({ ...prev, message: true }));
                    }}
                    onBlur={() => setContactFormTouched(prev => ({ ...prev, message: true }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all duration-300 ${
                      contactFormErrors.message && contactFormTouched.message
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : contactFormTouched.message && !contactFormErrors.message && contactFormData.message
                        ? 'border-green-300 focus:border-green-500'
                        : 'border-gray-300'
                    }`}
                    placeholder="Como podemos ajudar você?"
                    aria-invalid={contactFormErrors.message && contactFormTouched.message ? 'true' : 'false'}
                    aria-describedby={contactFormErrors.message && contactFormTouched.message ? 'contact-message-error' : undefined}
                  />
                  {contactFormTouched.message && contactFormErrors.message && (
                    <p id="contact-message-error" className="mt-1 text-sm text-red-600 flex items-center gap-1" role="alert">
                      <AlertCircle className="w-4 h-4" />
                      {contactFormErrors.message}
                    </p>
                  )}
                  {contactFormTouched.message && !contactFormErrors.message && contactFormData.message && (
                    <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Mensagem válida
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingContact || (contactFormTouched.name && (!!contactFormErrors.name || !!contactFormErrors.email || !!contactFormErrors.message)) || !contactFormData.name.trim() || !contactFormData.email.trim() || !contactFormData.message.trim()}
                  className="group w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transform hover:scale-105 relative overflow-hidden"
                  aria-label="Enviar mensagem de contato"
                >
                  {isSubmittingContact ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                      <Send className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                      <span className="relative z-10">Enviar Mensagem</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-lg blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                  <img 
                    src="/logo_header.png" 
                    alt="PloutosLedger Logo" 
                    className="h-12 w-auto object-contain relative z-10 drop-shadow-xl transform group-hover:scale-110 transition-transform duration-300 filter brightness-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <span className="text-white font-bold text-lg">{BUSINESS_CONFIG.COMPANY.BRAND}</span>
              </div>
              <p className="text-gray-400 text-sm">
                Sistema profissional de gestão financeira para pequenas e médias empresas.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setShowFooterPage(true)} className="text-gray-400 hover:text-white transition-colors">Recursos</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="text-gray-400 hover:text-white transition-colors">Preços</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="text-gray-400 hover:text-white transition-colors">Segurança</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button 
                    onClick={() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' })} 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Sobre
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' })} 
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contato
                  </button>
                </li>
                <li><button onClick={() => setShowFooterPage(true)} className="text-gray-400 hover:text-white transition-colors">Blog</button></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => setShowFooterPage(true)} className="text-gray-400 hover:text-white transition-colors">Central de Ajuda</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="text-gray-400 hover:text-white transition-colors">Documentação</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="text-gray-400 hover:text-white transition-colors">Status</button></li>
              </ul>
            </div>
          </div>

          {/* Logo do Rodapé - Centralizada */}
          <div className="border-t border-gray-800 pt-8 pb-6">
            <div className="flex justify-center items-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-cyan-400/20 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <img 
                  src="/rodape.png" 
                  alt="PloutosLedger" 
                  className="h-16 sm:h-20 lg:h-20 w-auto object-contain relative z-10 drop-shadow-2xl transform group-hover:scale-105 transition-all duration-300 filter brightness-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 text-center text-gray-400 text-sm">
            <p>© 2025 {BUSINESS_CONFIG.COMPANY.NAME}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
        selectedPlan={selectedPlan && selectedPlan.name ? { name: selectedPlan.name, priceCents: selectedPlan.priceCents, interval: selectedPlan.interval } : null}
      />

      {showFooterPage && <FooterPages onBackToLanding={() => setShowFooterPage(false)} />}
      {showClientRegistration && (
        <ClientRegistration
          onClose={() => setShowClientRegistration(false)}
          onSuccess={handleClientRegistrationSuccess}
        />
      )}

      {/* Live Chat */}
      <LiveChat 
        isOpen={showChat}
        onToggle={() => setShowChat(!showChat)}
        isMinimized={isChatMinimized}
        onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
      />

      {/* Chat Button */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all duration-300 hover:scale-110 z-40 animate-pulse-glow transform hover:rotate-12"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Caderno Demo */}
      {showCadernoDemo && (
        <CadernoDemo onClose={() => setShowCadernoDemo(false)} />
      )}

      {/* Time Clock Demo */}
      {showTimeClockDemo && (
        <TimeClockDemo 
          onClose={() => setShowTimeClockDemo(false)} 
          onRequestLogin={onRequestLogin}
        />
      )}

    </div>
  );
}
