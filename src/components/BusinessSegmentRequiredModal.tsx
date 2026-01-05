// Modal obrigatório para seleção de ramo de atuação
import React, { useState, useEffect } from 'react';
import { Building, AlertCircle, Search, X, CheckCircle2 } from 'lucide-react';
import { businessSegmentService } from '../services/businessSegmentService';
import {
  BusinessSegment,
  CompanyBusinessSegment,
  BusinessSegmentCategory
} from '../types/businessSegment';

interface BusinessSegmentRequiredModalProps {
  isOpen: boolean;
  onSegmentSelected: (segment: CompanyBusinessSegment) => void;
}

export default function BusinessSegmentRequiredModal({
  isOpen,
  onSegmentSelected
}: BusinessSegmentRequiredModalProps) {
  const [segments, setSegments] = useState<BusinessSegment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSegments();
    }
  }, [isOpen]);

  const loadSegments = () => {
    try {
      setLoading(true);
      const allSegments = businessSegmentService.getAllSegments();
      setSegments(allSegments);
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error);
      setSegments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSegment = (segment: BusinessSegment) => {
    try {
      const companySegment = businessSegmentService.setCompanySegment(segment.id);
      onSegmentSelected(companySegment);
    } catch (error) {
      console.error('Erro ao selecionar segmento:', error);
      alert('Erro ao selecionar ramo de atuação. Tente novamente.');
    }
  };

  const filteredSegments = segments.filter(segment => {
    const matchesSearch = segment.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         segment.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || segment.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryLabels: Record<string, string> = {
    all: 'Todos',
    comercio_varejista: 'Comércio Varejista',
    alimentacao_bebidas: 'Alimentação e Bebidas',
    prestacao_servicos: 'Prestação de Serviços',
    industria_producao: 'Indústria, Produção e Manufatura',
    atacado_distribuicao: 'Atacado e Distribuição',
    saude_bemestar: 'Saúde, Bem-estar e Social',
    imobiliario_patrimonial: 'Imobiliário e Patrimonial',
    rural_agro: 'Rural e Agro',
    outros_especiais: 'Outros / Operações Especiais'
  };

  const categoryOptions: { value: string; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'comercio_varejista', label: 'Comércio Varejista' },
    { value: 'alimentacao_bebidas', label: 'Alimentação e Bebidas' },
    { value: 'prestacao_servicos', label: 'Prestação de Serviços' },
    { value: 'industria_producao', label: 'Indústria, Produção e Manufatura' },
    { value: 'atacado_distribuicao', label: 'Atacado e Distribuição' },
    { value: 'saude_bemestar', label: 'Saúde, Bem-estar e Social' },
    { value: 'imobiliario_patrimonial', label: 'Imobiliário e Patrimonial' },
    { value: 'rural_agro', label: 'Rural e Agro' },
    { value: 'outros_especiais', label: 'Outros / Operações Especiais' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Selecione o Ramo de Atuação</h2>
                <p className="text-emerald-100 text-sm mt-1">
                  Esta informação é obrigatória para personalizar o sistema
                </p>
              </div>
            </div>
            <AlertCircle className="w-6 h-6 text-yellow-300" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Filtros */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar ramo de atuação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {categoryOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Segmentos */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando ramos de atuação...</p>
            </div>
          ) : filteredSegments.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Nenhum ramo encontrado com os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredSegments.map(segment => (
                <button
                  key={segment.id}
                  onClick={() => handleSelectSegment(segment)}
                  className="text-left p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                        {segment.nome}
                      </h3>
                      {segment.descricao && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {segment.descricao}
                        </p>
                      )}
                      <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {categoryLabels[segment.categoria]}
                      </span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800 p-4 rounded-b-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">Por que isso é importante?</p>
              <p>
                O ramo de atuação define quais formas de pagamento estarão disponíveis, 
                quais campos são obrigatórios e quais relatórios serão exibidos. 
                Você pode alterar isso depois nas configurações.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

