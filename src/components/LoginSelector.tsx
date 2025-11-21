import React, { useState } from 'react';
import { Building, Shield, ArrowRight, Users, Settings } from 'lucide-react';

interface LoginSelectorProps {
  onSelectLogin: (type: 'client' | 'superadmin') => void;
}

function LoginSelector({ onSelectLogin }: LoginSelectorProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="container max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-6 animate-pulse">
            <Building className="w-10 h-10 text-white" />
          </div>
          <h1 className="display-3 fw-bold text-white mb-4 animate-fade-in" style={{ fontFamily: 'Poppins, sans-serif' }}>
            PloutosLedger
          </h1>
          <p className="lead text-emerald-200 mb-2 animate-fade-in" style={{animationDelay: '200ms', fontFamily: 'Inter, sans-serif'}}>
            Sistema de Gestão Financeira
          </p>
          <p className="h5 text-emerald-300 animate-fade-in" style={{animationDelay: '400ms', fontFamily: 'Inter, sans-serif'}}>
            Escolha seu tipo de acesso
          </p>
        </div>

        {/* Login Cards */}
        <div className="row g-4 justify-content-center">
          {/* Cliente/Loja */}
          <div className="col-md-6">
          <div
              className={`group relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:-translate-y-2 h-100 ${
              hoveredCard === 'client'
                ? 'border-emerald-400 shadow-2xl shadow-emerald-500/25'
                : 'border-white/20 hover:border-emerald-300'
            }`}
            onMouseEnter={() => setHoveredCard('client')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onSelectLogin('client')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-6 mx-auto group-hover:rotate-12 transition-transform duration-300">
                <Building className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="h3 fw-bold text-white text-center mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Acesso da Loja
              </h2>
              
              <p className="text-emerald-200 text-center mb-6 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                Dashboard completo para gerenciar sua loja, estoque, vendas e relatórios financeiros.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-emerald-100">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                  <span>Controle de caixa e vendas</span>
                </div>
                <div className="flex items-center text-emerald-100">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                  <span>Gestão de estoque</span>
                </div>
                <div className="flex items-center text-emerald-100">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                  <span>Relatórios financeiros</span>
                </div>
                <div className="flex items-center text-emerald-100">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                  <span>Configurações da loja</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center text-emerald-300 group-hover:text-white transition-colors duration-300">
                <span className="mr-2">Acessar Dashboard</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              </div>
            </div>
          </div>

          {/* Super Administrador */}
          <div className="col-md-6">
          <div
              className={`group relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border-2 transition-all duration-500 cursor-pointer transform hover:scale-105 hover:-translate-y-2 h-100 ${
              hoveredCard === 'superadmin' 
                ? 'border-red-400 shadow-2xl shadow-red-500/25' 
                : 'border-white/20 hover:border-red-300'
            }`}
            onMouseEnter={() => setHoveredCard('superadmin')}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onSelectLogin('superadmin')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl mb-6 mx-auto group-hover:rotate-12 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="h3 fw-bold text-white text-center mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Super Administrador
              </h2>
              
              <p className="text-red-200 text-center mb-6 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                Painel de controle total do sistema. Gerencie usuários, licenças, planos e toda a infraestrutura.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center text-red-100">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span>Gerenciar usuários e roles</span>
                </div>
                <div className="flex items-center text-red-100">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span>Controle de licenças</span>
                </div>
                <div className="flex items-center text-red-100">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span>Gerenciar planos e assinaturas</span>
                </div>
                <div className="flex items-center text-red-100">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                  <span>Monitoramento do sistema</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center text-red-300 group-hover:text-white transition-colors duration-300">
                <span className="mr-2">Acessar Painel Admin</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-emerald-300" style={{ fontFamily: 'Inter, sans-serif' }}>
            © 2025 PloutosLedger - Sistema de Gestão Financeira
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginSelector;
