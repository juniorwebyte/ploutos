import { useState, useEffect, useMemo, useCallback } from 'react';
import { BUSINESS_CONFIG } from '../config/system';
import { usePerformance } from '../hooks/usePerformance';
import FooterPages from './FooterPages';
import ClientRegistration from './ClientRegistration';
import { 
  Calculator, 
  PlayCircle, 
  LogIn, 
  Shield, 
  CheckCircle2, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Mail,
  TrendingUp,
  Users,
  Clock,
  Zap,
  BarChart3,
  FileText,
  Printer,
  Smartphone,
  Globe,
  Star,
  Award,
  Target,
  Rocket,
  MapPin,
  CreditCard,
  ArrowRight,
  ArrowUp,
  CheckCircle,
  DollarSign,
  Building,
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import PaymentPage from './PaymentPage';
import OwnerPanel from './OwnerPanel';
import LicenseValidator from './LicenseValidator';
import plansService, { PlanRecord } from '../services/plansService';

interface LandingPageProps {
  onRequestLogin: () => void;
  onRequestDemo: () => void;
  onOpenAdmin?: () => void;
}

export default function LandingPage({ onRequestLogin, onRequestDemo, onOpenAdmin }: LandingPageProps) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null);
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showFooterPage, setShowFooterPage] = useState(false);
  const [showClientRegistration, setShowClientRegistration] = useState(false);
  const { isVisible, prefersReducedMotion } = usePerformance();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [plans, setPlans] = useState<PlanRecord[]>(plansService.getPlans());

  // Callbacks otimizados
  const handlePaymentComplete = useCallback((paymentData: any) => {
    console.log('Pagamento realizado:', paymentData);
    setShowPaymentPage(false);
    setShowPaymentModal(false);
    // Pós-pagamento (demo): direcionar ao login do cliente
    if (onRequestLogin) {
      onRequestLogin();
    }
  }, []);


  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const handleClientRegistrationSuccess = useCallback((clientData: any) => {
    console.log('Cliente registrado:', clientData);
    setShowClientRegistration(false);
    // Redirecionar imediatamente para a demo após confirmação do código
    try { window.dispatchEvent(new Event('ploutos:open-demo')); } catch {}
    onRequestDemo();
  }, [onRequestDemo]);

  const features = useMemo(() => [
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "Gestão Completa de Entradas",
      description: "Controle dinheiro, cartões, PIX, boletos, cheques e outras formas de pagamento com interface intuitiva.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Controle Total de Saídas",
      description: "Registre descontos, retiradas, vales e comissões com validação automática.",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Caderno de Notas Fiscais",
      description: "Controle completo de entrada e retirada de notas fiscais com data, fabricação, NFE, vencimento e total.",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Controle de Cancelamentos",
      description: "Sistema completo de gestão de cancelamentos com modal responsivo e integração ao relatório principal.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Comissão Puxador Inteligente",
      description: "Sistema automático com 4% fixo, múltiplos clientes e controle completo.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Printer className="w-8 h-8" />,
      title: "Relatórios Profissionais",
      description: "Cupom completo incluindo cancelamentos e cheques, otimizado para EPSON com impressão perfeita.",
      color: "from-purple-500 to-indigo-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Validação Inteligente",
      description: "Sistema corrige automaticamente problemas de precisão com números decimais e validações robustas.",
      color: "from-indigo-500 to-blue-500"
    },
    {
      icon: <CreditCard className="w-8 h-8" />,
      title: "Gateway de Pagamento",
      description: "Sistema completo de pagamentos com PIX, cartões, criptomoedas (Bitcoin, Ethereum, USDT, BNB) e LinkInvoice profissional.",
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: <Building className="w-8 h-8" />,
      title: "Sistema PDV Completo",
      description: "Ponto de venda profissional com leitor de código de barras, calculadora de troco, múltiplas formas de pagamento e controle de estoque.",
      color: "from-violet-500 to-purple-500"
    }
  ], []);

  const testimonials = useMemo(() => [
    {
      name: "João Silva",
      role: "Proprietário - Loja de Roupas",
      content: "O sistema reduziu em 80% o tempo de fechamento. O controle de cancelamentos em modal é fantástico!",
      rating: 5,
      avatar: "👨‍💼"
    },
    {
      name: "Maria Santos",
      role: "Gerente - Supermercado",
      content: "Interface intuitiva e validações automáticas. Agora não há mais problemas com números decimais!",
      rating: 5,
      avatar: "👩‍💼"
    },
    {
      name: "Carlos Oliveira",
      role: "Diretor - Empresa de Cosméticos",
      content: "Sistema robusto e profissional. Os relatórios com cancelamentos e cheques ficaram perfeitos.",
      rating: 5,
      avatar: "👨‍💻"
    },
    {
      name: "Ana Costa",
      role: "E-commerce - Loja Online",
      content: "O Gateway de Pagamento é incrível! Aceito PIX, cartões e até criptomoedas. LinkInvoice facilita muito as vendas.",
      rating: 5,
      avatar: "👩‍💻"
    },
    {
      name: "Roberto Lima",
      role: "Proprietário - Farmácia",
      content: "O PDV é perfeito! Leitor de código de barras, calculadora de troco e interface mobile. Vendas nunca foram tão fáceis!",
      rating: 5,
      avatar: "👨‍⚕️"
    }
  ], []);

  const stats = useMemo(() => [
    { icon: <TrendingUp className="w-6 h-6" />, value: "99.9%", label: "Precisão" },
    { icon: <Clock className="w-6 h-6" />, value: "80%", label: "Menos Tempo" },
    { icon: <Users className="w-6 h-6" />, value: "500+", label: "Usuários" },
    { icon: <Star className="w-6 h-6" />, value: "4.9/5", label: "Avaliação" },
    { icon: <CreditCard className="w-6 h-6" />, value: "R$ 2M+", label: "Processados" },
    { icon: <Building className="w-6 h-6" />, value: "1000+", label: "Vendas PDV" }
  ], []);

  const benefits = useMemo(() => [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Performance Otimizada",
      description: "Sistema rápido com cache inteligente e lazy loading para máxima eficiência"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Segurança Total",
      description: "Validações robustas, backup automático e proteção contra perda de dados"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Responsivo",
      description: "Funciona perfeitamente em desktop, tablet e smartphone"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Sempre Disponível",
      description: "Acesso 24/7 com sincronização automática e sem dependência de internet"
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Gateway Completo",
      description: "Aceite PIX, cartões, criptomoedas e LinkInvoice profissional para maximizar vendas"
    },
    {
      icon: <Building className="w-6 h-6" />,
      title: "PDV Profissional",
      description: "Sistema completo de ponto de venda com leitor de código de barras e calculadora de troco"
    }
  ], []);

  // Rotação automática dos depoimentos (respeita prefers-reduced-motion)
  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => {
      clearInterval(id);
    };
  }, [testimonials.length, prefersReducedMotion]);

  // Mostrar botão Voltar ao Topo
  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Assinar mudanças de planos (quando criados no Admin/SuperAdmin)
  useEffect(() => {
    const unsub = plansService.subscribe((updated) => setPlans(updated));
    return () => {
      unsub();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50 animate-slide-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden animate-float">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-shimmer"></div>
                <svg className="w-6 h-6 text-white relative z-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 5L17 7V9H21ZM3 9H7V7L5 5L3 7V9ZM12 7.5C8.5 7.5 5.73 10.27 5.73 13.77C5.73 15.27 6.23 16.77 7.23 17.77L12 22.5L16.77 17.77C17.77 16.77 18.27 15.27 18.27 13.77C18.27 10.27 15.5 7.5 12 7.5Z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{BUSINESS_CONFIG.COMPANY.BRAND}</h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">{BUSINESS_CONFIG.COMPANY.TAGLINE}</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors font-medium flex items-center space-x-1">
                <span>⚡</span>
                <span>Funcionalidades</span>
              </a>
              <a href="#benefits" className="text-gray-700 hover:text-blue-600 transition-colors font-medium flex items-center space-x-1">
                <span>🎯</span>
                <span>Benefícios</span>
              </a>
              <a href="#demo" className="text-gray-700 hover:text-blue-600 transition-colors font-medium flex items-center space-x-1">
                <span>🚀</span>
                <span>Demo</span>
              </a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors font-medium flex items-center space-x-1">
                <span>💼</span>
                <span>Sobre</span>
              </a>
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              {/* Botão Demo */}
              <button
                onClick={() => setShowClientRegistration(true)}
                className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-all duration-300 hover:scale-105 relative group flex items-center space-x-2"
              >
                <span className="text-lg">🎯</span>
                <span className="relative z-10">Testar Demo</span>
                <div className="absolute inset-0 bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              {/* Separador */}
              <div className="w-px h-6 bg-gray-300"></div>
              
              {/* Botões de Acesso */}
              <div className="flex items-center space-x-2">
                {onRequestLogin && (
                  <button
                    onClick={() => {
                      console.log('Botão Acesso da Loja clicado');
                      onRequestLogin();
                    }}
                    className="px-3 py-2 text-emerald-600 hover:text-emerald-700 font-medium transition-all duration-300 hover:scale-105 relative group flex items-center space-x-1"
                  >
                    <span className="text-sm">🏪</span>
                    <span className="relative z-10 text-sm">Loja</span>
                    <div className="absolute inset-0 bg-emerald-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                )}
                {onOpenAdmin && (
                  <button
                    onClick={() => {
                      console.log('Botão Super Administrador clicado');
                      onOpenAdmin();
                    }}
                    className="px-3 py-2 text-purple-600 hover:text-purple-700 font-medium transition-all duration-300 hover:scale-105 relative group flex items-center space-x-1"
                  >
                    <span className="text-sm">🛡️</span>
                    <span className="relative z-10 text-sm">Admin</span>
                    <div className="absolute inset-0 bg-purple-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                )}
              </div>
              
              {/* Botão Info */}
              <button
                onClick={() => setShowFooterPage(true)}
                className="px-3 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-all duration-300 flex items-center space-x-1"
              >
                <span className="text-sm">ℹ️</span>
                <span className="text-sm">Info</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={handleMobileMenuToggle}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4 animate-slide-down">
              <div className="space-y-4">
                {/* Mobile Navigation */}
                <nav className="space-y-2">
                  <a 
                    href="#features" 
                    className="block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium flex items-center space-x-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>⚡</span>
                    <span>Funcionalidades</span>
                  </a>
                  <a 
                    href="#benefits" 
                    className="block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium flex items-center space-x-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>🎯</span>
                    <span>Benefícios</span>
                  </a>
                  <a 
                    href="#demo" 
                    className="block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium flex items-center space-x-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>🚀</span>
                    <span>Demo</span>
                  </a>
                  <a 
                    href="#about" 
                    className="block px-4 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium flex items-center space-x-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>💼</span>
                    <span>Sobre</span>
                  </a>
                </nav>

                {/* Mobile Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowClientRegistration(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium rounded-lg transition-all duration-300 text-left"
                  >
                    🎮 Testar Demo
                  </button>
                  
                  {onRequestLogin && (
                    <button
                      onClick={() => {
                        console.log('Botão Acesso da Loja clicado');
                        onRequestLogin();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-medium rounded-lg transition-all duration-300 text-left"
                    >
                      🏪 Acesso da Loja
                    </button>
                  )}
                  
                  {onOpenAdmin && (
                    <button
                      onClick={() => {
                        console.log('Botão Super Administrador clicado');
                        onOpenAdmin();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-medium rounded-lg transition-all duration-300 text-left"
                    >
                      🛡️ Super Administrador
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Background Animations */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 rounded-full blur-3xl animate-gradient"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-full blur-3xl animate-pulse-glow"></div>
          
          {/* Floating Elements */}
          <div className="absolute top-10 left-20 w-4 h-4 bg-blue-500 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute top-32 right-32 w-6 h-6 bg-purple-500 rounded-full animate-bounce opacity-40" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-32 left-32 w-3 h-3 bg-pink-500 rounded-full animate-bounce opacity-50" style={{animationDelay: '2s'}}></div>
          
          {/* Badge PIX Real */}
          <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-4 py-2 mb-6 backdrop-blur-sm transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
            <Sparkles className="w-4 h-4 text-green-500" />
            <span className="text-green-700 text-sm font-medium">Sistema PIX Real Implementado</span>
          </div>
          
          <div className={`mb-6 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight select-none">
              Controle Total do Seu
            </h1>
            <h2 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mt-1 select-none">
              Fluxo de Caixa
            </h2>
            <div className="text-2xl md:text-3xl font-normal text-gray-600 mt-4">
              <span className="inline-block animate-bounce">💼</span> Gestão Financeira Inteligente
            </div>
          </div>
          
          <p className={`text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Sistema completo e intuitivo para gerenciar entradas, saídas, comissões, <strong className="text-blue-600">notas fiscais</strong> e relatórios 
            com <strong className="text-green-600">precisão absoluta</strong> e <strong className="text-emerald-600">facilidade extrema</strong>. 
            Ideal para pequenos e médios negócios que querem crescer.
          </p>
          
          <div className={`flex flex-col sm:flex-row gap-4 justify-center mb-12 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-10 py-5 bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 text-white font-bold text-lg rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-green-800 transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-3xl relative overflow-hidden group animate-bounce-in"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CreditCard className="w-6 h-6 inline mr-2 animate-bounce relative z-10" />
                <span className="relative z-10">Teste 30 Dias - R$ 29,99</span>
                <ArrowRight className="w-5 h-5 inline ml-2 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
              </button>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="text-sm text-green-600 hover:text-green-500 transition-colors flex items-center gap-1"
                >
                  <Smartphone className="w-3 h-3" />
                  Modal Rápido
                </button>
                <span className="text-gray-400">•</span>
                <button
                  onClick={() => setShowPaymentPage(true)}
                  className="text-sm text-green-600 hover:text-green-500 transition-colors flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  Página Completa
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowClientRegistration(true)}
              className="px-10 py-5 border-2 border-blue-500 text-gray-700 font-bold text-lg rounded-xl hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-500 hover:shadow-xl hover:scale-105 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <PlayCircle className="w-6 h-6 inline mr-2 animate-pulse" />
              <span className="relative z-10">Ver Demonstração</span>
            </button>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {stats.map((stat, index) => (
              <div key={index} className={`text-center group transition-all duration-500 hover:scale-105 animate-bounce-in`} style={{animationDelay: `${index * 200}ms`}}>
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 relative overflow-hidden animate-pulse-glow">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-full animate-rotate-slow"></div>
                  <span className="text-white relative z-10 animate-float">{stat.icon}</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-300 animate-slide-up">{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium group-hover:text-gray-800 transition-colors duration-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PIX Real Section */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-emerald-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-green-50/50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 border border-green-200 rounded-full px-4 py-2 mb-6">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-green-700 text-sm font-medium">Sistema PIX Real</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Receba Pagamentos <span className="text-green-600">Reais</span> com PIX
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              QR codes válidos que funcionam com qualquer banco brasileiro. 
              Sistema preparado para receber pagamentos reais através do PIX.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">QR Codes Válidos</h3>
              <p className="text-gray-600">
                Geração automática de QR codes PIX no formato EMV oficial do Banco Central.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Validação Automática</h3>
              <p className="text-gray-600">
                Verificação automática de chaves PIX antes da geração do QR code.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Building className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Painel do Proprietário</h3>
              <p className="text-gray-600">
                Configure sua empresa e chave PIX através do painel personalizado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Validador de Licenças */}
      <section id="license-validator" className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LicenseValidator
            onValidLicense={(key) => {
              // Redirecionar para login após validação bem-sucedida
              if (onRequestLogin) {
                onRequestLogin();
              }
            }}
            onInvalidLicense={(message) => {
              console.error('Licença inválida:', message);
            }}
          />
        </div>
      </section>

      {/* Pricing Plans (sincronizado com Admin) */}
      <section id="plans" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Planos</h2>
            <p className="text-xl text-gray-600">Escolha o melhor para o seu negócio</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.filter(p => p && p.name && p.priceCents).map((p)=> (
              <div key={p.id} className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-3xl shadow hover:shadow-xl transition">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{p.name}</h3>
                <div className="text-4xl font-extrabold text-blue-700 mb-4">R$ {(p.priceCents/100).toLocaleString('pt-BR',{minimumFractionDigits:2})}<span className="text-base text-gray-500 font-medium">/{p.interval==='monthly'?'mês':'ano'}</span></div>
                <p className="text-gray-600 mb-6">{p.features || 'Recursos profissionais'}</p>
                <button onClick={()=>{ if(p && p.name) { setSelectedPlan(p); setShowPaymentModal(true); } }} className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl hover:opacity-95">Assinar</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        {/* Background Animations */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-2xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-2xl animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl animate-pulse-glow"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 animate-bounce-in">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient">
                Funcionalidades Principais
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in">
              Tudo que você precisa para controlar seu caixa de forma eficiente e profissional
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border-2 transition-all duration-500 cursor-pointer group animate-bounce-in ${
                    activeFeature === index
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl scale-105 animate-pulse-glow'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:scale-102'
                  }`}
                  style={{animationDelay: `${index * 150}ms`}}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 relative overflow-hidden animate-float`}>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                      <span className="text-white group-hover:animate-pulse relative z-10">{feature.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 animate-slide-up">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed animate-fade-in">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 animate-bounce-in relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 via-purple-100/20 to-pink-100/20 animate-gradient"></div>
              <div className="text-center relative z-10">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 relative overflow-hidden group animate-pulse-glow">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-full animate-rotate-slow"></div>
                  <span className="text-white text-6xl relative z-10 group-hover:animate-bounce animate-float">💼</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {features[activeFeature].title}
                </h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {features[activeFeature].description}
                </p>
                <div className="mt-6">
                  <button
                    onClick={onRequestLogin}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-500 transform hover:scale-110 shadow-lg hover:shadow-xl relative overflow-hidden group animate-pulse-glow"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 animate-slide-up">Experimentar Agora</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Por que escolher nosso sistema?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Benefícios que fazem a diferença no seu dia a dia e no crescimento do seu negócio
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-6 mx-auto shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="text-white relative z-10 group-hover:animate-pulse">{benefit.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center group-hover:text-blue-600 transition-colors duration-300">{benefit.title}</h3>
                <p className="text-gray-600 text-center leading-relaxed group-hover:text-gray-800 transition-colors duration-300">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 bg-gradient-to-br from-white via-gray-50 to-blue-50/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Veja o Sistema em Ação
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Demonstração interativa das principais funcionalidades do sistema
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-gradient-to-br from-gray-900 to-slate-800 p-8 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 group">
                <div className="text-center text-white">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <PlayCircle className="w-12 h-12 relative z-10 group-hover:animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Demonstração Interativa</h3>
                  <p className="text-gray-300 mb-6">
                    Clique no botão ao lado para acessar uma demonstração completa do sistema
                  </p>
                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>Interface completa do sistema</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>Funcionalidades em tempo real</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>Sem necessidade de cadastro</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Experimente Agora</h3>
                <p className="text-gray-600 mb-6">
                  Acesse o sistema completo e teste todas as funcionalidades sem compromisso
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => setShowClientRegistration(true)}
                    className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-500 transform hover:scale-110 shadow-lg hover:shadow-xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <PlayCircle className="w-5 h-5 inline mr-2 relative z-10 animate-bounce" />
                    <span className="relative z-10">Iniciar Demonstração</span>
                  </button>
                  <button
                    onClick={onRequestLogin}
                    className="w-full px-8 py-4 border-2 border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-500 transform hover:scale-105 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <LogIn className="w-5 h-5 inline mr-2 relative z-10 group-hover:animate-pulse" />
                    <span className="relative z-10">Acessar Sistema Completo</span>
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Objetivo Alcançado</h4>
                    <p className="text-sm text-gray-600">Sistema 100% funcional e testado</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50/20 to-slate-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              O que nossos usuários dizem
            </h2>
            <p className="text-xl text-gray-600">
              Depoimentos reais de quem já transformou o controle do caixa
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 group-hover:animate-bounce transition-all duration-300">{testimonials[testimonialIndex].avatar}</div>
                <div className="flex justify-center space-x-1 mb-4">
                  {[...Array(testimonials[testimonialIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current group-hover:animate-pulse transition-all duration-300" style={{animationDelay: `${i * 100}ms`}} />
                  ))}
                </div>
                <p className="text-lg text-gray-700 italic mb-4">
                  "{testimonials[testimonialIndex].content}"
                </p>
                <h4 className="font-semibold text-gray-900">{testimonials[testimonialIndex].name}</h4>
                <p className="text-gray-600">{testimonials[testimonialIndex].role}</p>
              </div>
              
              <div className="flex justify-center space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setTestimonialIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === testimonialIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Sobre a {BUSINESS_CONFIG.COMPANY.NAME}
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                A Webyte Desenvolvimentos é especialista em soluções tecnológicas para pequenos e médios negócios. 
                Nosso sistema de movimento de caixa foi desenvolvido com base na experiência 
                real de comerciantes e empresários que enfrentam desafios diários.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Utilizamos as mais modernas tecnologias web para garantir um sistema 
                rápido, seguro e fácil de usar, que realmente resolve os problemas 
                do seu negócio e impulsiona seu crescimento.
              </p>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">5+</div>
                  <div className="text-sm text-gray-600">Anos de Experiência</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">500+</div>
                  <div className="text-sm text-gray-600">Clientes Atendidos</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">24/7</div>
                  <div className="text-sm text-gray-600">Suporte</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-slate-100 p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="w-8 h-8 text-white relative z-10 group-hover:animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 5L17 7V9H21ZM3 9H7V7L5 5L3 7V9ZM12 7.5C8.5 7.5 5.73 10.27 5.73 13.77C5.73 15.27 6.23 16.77 7.23 17.77L12 22.5L16.77 17.77C17.77 16.77 18.27 15.27 18.27 13.77C18.27 10.27 15.5 7.5 12 7.5Z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{BUSINESS_CONFIG.COMPANY.BRAND}</h3>
                    <p className="text-gray-600">Sistema de Gestão Financeira</p>
                  </div>
                </div>
                
                <div className="space-y-4 text-gray-600">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span><strong>Endereço:</strong> {BUSINESS_CONFIG.COMPANY.ADDRESS}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-purple-500" />
                    <span><strong>Cidade:</strong> {BUSINESS_CONFIG.COMPANY.CITY}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-green-500" />
                    <span><strong>Tecnologia:</strong> {BUSINESS_CONFIG.COMPANY.TECHNOLOGY}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={onRequestLogin}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-500 transform hover:scale-110 shadow-lg hover:shadow-xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">Conhecer o Sistema</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Transforme seu negócio hoje mesmo
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Junte-se a centenas de empresários que já transformaram 
            o controle do seu caixa com nosso sistema profissional
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={onRequestLogin}
              className="px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-500 transform hover:scale-110 shadow-2xl hover:shadow-3xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Rocket className="w-6 h-6 inline mr-2 relative z-10 animate-bounce" />
              <span className="relative z-10">Começar Gratuitamente</span>
            </button>
            <button
              onClick={() => setShowClientRegistration(true)}
              className="px-10 py-5 border-2 border-gray-600 text-gray-300 font-bold text-lg rounded-xl hover:border-blue-500 hover:text-blue-400 transition-all duration-500 transform hover:scale-105 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <PlayCircle className="w-6 h-6 inline mr-2 relative z-10 group-hover:animate-pulse" />
              <span className="relative z-10">Ver Demonstração</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CheckCircle2 className="w-8 h-8 text-white relative z-10 group-hover:animate-pulse" />
              </div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400 transition-colors duration-300">Sem Cadastro</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">Teste imediatamente</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Zap className="w-8 h-8 text-white relative z-10 group-hover:animate-bounce" />
              </div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-purple-400 transition-colors duration-300">Instantâneo</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">Acesso imediato</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 hover:shadow-xl transition-all duration-300 transform group-hover:scale-110 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Shield className="w-8 h-8 text-white relative z-10 group-hover:animate-pulse" />
              </div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors duration-300">100% Seguro</h3>
              <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">Dados protegidos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-slate-900 py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center hover:shadow-lg transition-all duration-300 transform hover:scale-110 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <svg className="w-5 h-5 text-white relative z-10 group-hover:animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L19 5L17 7V9H21ZM3 9H7V7L5 5L3 7V9ZM12 7.5C8.5 7.5 5.73 10.27 5.73 13.77C5.73 15.27 6.23 16.77 7.23 17.77L12 22.5L16.77 17.77C17.77 16.77 18.27 15.27 18.27 13.77C18.27 10.27 15.5 7.5 12 7.5Z"/>
                  </svg>
                </div>
                <span className="text-white font-bold text-lg">{BUSINESS_CONFIG.COMPANY.BRAND}</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Soluções tecnológicas inovadoras para o seu negócio crescer e prosperar. 
                Sistema de movimento de caixa profissional e confiável.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Produtos</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Sistema de Caixa</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Gestão Financeira</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Relatórios</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Integrações</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Suporte</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Central de Ajuda</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Documentação</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Contato</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Status</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Empresa</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Sobre Nós</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Carreiras</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Blog</button></li>
                <li><button onClick={() => setShowFooterPage(true)} className="hover:text-white transition-colors text-left">Imprensa</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm text-center md:text-left">
                © 2025 {BUSINESS_CONFIG.COMPANY.NAME}. Todos os direitos reservados. 
                Desenvolvido por {BUSINESS_CONFIG.COMPANY.TECHNOLOGY}
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de Pagamento */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
        onOpenFullPage={() => { setShowPaymentModal(false); setShowPaymentPage(true); }}
        selectedPlan={selectedPlan && selectedPlan.name ? { name: selectedPlan.name, priceCents: selectedPlan.priceCents, interval: selectedPlan.interval } : null}
      />

      {/* Página de Pagamento */}
      {showPaymentPage && (
        <PaymentPage />
      )}

      {showOwnerPanel && (
        <OwnerPanel
          isOpen={showOwnerPanel}
          onClose={() => setShowOwnerPanel(false)}
          onConfigUpdate={() => {}}
        />
      )}
      {/* Footer Pages */}
      {showFooterPage && (
        <FooterPages onBackToLanding={() => setShowFooterPage(false)} />
      )}

      {/* Client Registration Modal */}
      {showClientRegistration && (
        <ClientRegistration
          onClose={() => setShowClientRegistration(false)}
          onSuccess={handleClientRegistrationSuccess}
        />
      )}

      {/* Back to Top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-5 right-5 z-50 p-3 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition"
          aria-label="Voltar ao topo"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}


