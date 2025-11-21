import React, { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import ProdutosPage from './ProdutosPage';
import RelatoriosPage from './RelatoriosPage';
import IntegracoesPage from './IntegracoesPage';
import SuportePage from './SuportePage';
import AboutPage from './AboutPage';

type PageType = 'produtos' | 'relatorios' | 'integracoes' | 'suporte' | 'sobre' | null;

interface FooterPagesProps {
  onBackToLanding: () => void;
}

const FooterPages: React.FC<FooterPagesProps> = ({ onBackToLanding }) => {
  const [currentPage, setCurrentPage] = useState<PageType>(null);

  const renderPage = () => {
    switch (currentPage) {
      case 'produtos':
        return <ProdutosPage />;
      case 'relatorios':
        return <RelatoriosPage />;
      case 'integracoes':
        return <IntegracoesPage />;
      case 'suporte':
        return <SuportePage />;
      case 'sobre':
        return <AboutPage />;
      default:
        return null;
    }
  };

  if (!currentPage) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-xl font-bold text-gray-900">Menu de Páginas</h1>
              <button
                onClick={onBackToLanding}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <X className="w-5 h-5" />
                Fechar
              </button>
            </div>
          </div>
        </div>

        {/* Menu de Páginas */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => setCurrentPage('sobre')}
              className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
            >
              <h3 className="text-xl font-bold mb-2">Sobre Nós</h3>
              <p className="text-emerald-100">História, Missão, Visão e Valores da PloutosLedger</p>
            </button>

            <button
              onClick={() => setCurrentPage('produtos')}
              className="p-6 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105"
            >
              <h3 className="text-xl font-bold mb-2">Produtos</h3>
              <p className="text-blue-100">Sistema de Caixa, Gestão Financeira, Controle de Estoque</p>
            </button>

            <button
              onClick={() => setCurrentPage('relatorios')}
              className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105"
            >
              <h3 className="text-xl font-bold mb-2">Relatórios</h3>
              <p className="text-green-100">Relatórios de Vendas, Financeiro, Estoque</p>
            </button>

            <button
              onClick={() => setCurrentPage('integracoes')}
              className="p-6 bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-800 transition-all duration-300 transform hover:scale-105"
            >
              <h3 className="text-xl font-bold mb-2">Integrações</h3>
              <p className="text-blue-100">PIX, APIs REST, Webhooks</p>
            </button>

            <button
              onClick={() => setCurrentPage('suporte')}
              className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all duration-300 transform hover:scale-105"
            >
              <h3 className="text-xl font-bold mb-2">Suporte</h3>
              <p className="text-orange-100">Chat Online, Telefone, E-mail</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setCurrentPage(null)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar ao Menu
            </button>
            <button
              onClick={onBackToLanding}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      {renderPage()}
    </div>
  );
};

export default FooterPages;
