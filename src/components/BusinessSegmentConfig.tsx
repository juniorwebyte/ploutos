// Componente de configuração de ramo de atuação
import React, { useState, useEffect } from 'react';
import { Building, CheckCircle2, AlertCircle, Search, Plus, X, Save, RefreshCw, Info } from 'lucide-react';
import { businessSegmentService } from '../services/businessSegmentService';
import {
  BusinessSegment,
  BusinessSegmentCategory,
  CompanyBusinessSegment,
  BusinessSegmentConfig as BusinessSegmentConfigType
} from '../types/businessSegment';

interface BusinessSegmentConfigProps {
  onSegmentChange?: (segment: CompanyBusinessSegment) => void;
}

export default function BusinessSegmentConfig({ onSegmentChange }: BusinessSegmentConfigProps) {
  const [segments, setSegments] = useState<BusinessSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<CompanyBusinessSegment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customSegmentName, setCustomSegmentName] = useState('');
  const [customSegmentCategory, setCustomSegmentCategory] = useState<BusinessSegmentCategory>('comercio_varejista');
  const [customSegmentDescription, setCustomSegmentDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSegments();
    loadCurrentSegment();
  }, []);

  const loadSegments = () => {
    try {
      const allSegments = businessSegmentService.getAllSegments();
      setSegments(allSegments);
      console.log('Segmentos carregados:', allSegments.length);
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error);
      // Em caso de erro, tentar carregar apenas os pré-definidos
      setSegments([]);
    }
  };

  const loadCurrentSegment = () => {
    try {
      const current = businessSegmentService.getCompanySegment();
      if (current) {
        setSelectedSegment(current);
        console.log('Segmento atual carregado:', current.segment.nome);
      } else {
        // Definir padrão como Comércio Varejista Genérico
        const generic = businessSegmentService.getSegmentByCode('COM_VAREJISTA_GENERICO');
        if (generic) {
          const companySegment = businessSegmentService.setCompanySegment(generic.id);
          setSelectedSegment(companySegment);
          console.log('Segmento padrão configurado:', companySegment.segment.nome);
          if (onSegmentChange) {
            onSegmentChange(companySegment);
          }
        } else {
          console.warn('Segmento genérico não encontrado');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar segmento atual:', error);
    }
  };

  const handleSelectSegment = (segment: BusinessSegment) => {
    if (selectedSegment && selectedSegment.segmentId === segment.id) {
      return; // Já está selecionado
    }

    // Confirmar alteração se já houver um segmento selecionado
    if (selectedSegment && selectedSegment.segmentId !== segment.id) {
      const confirmChange = window.confirm(
        `Deseja alterar o ramo de atuação de "${selectedSegment.segment.nome}" para "${segment.nome}"?\n\n` +
        'Esta alteração pode afetar categorias, campos obrigatórios e relatórios disponíveis.'
      );
      if (!confirmChange) return;
    }

    setSaving(true);
    try {
      const companySegment = businessSegmentService.setCompanySegment(segment.id);
      setSelectedSegment(companySegment);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      
      if (onSegmentChange) {
        onSegmentChange(companySegment);
      }
    } catch (error) {
      console.error('Erro ao selecionar segmento:', error);
      alert('Erro ao selecionar ramo de atuação. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomSegment = () => {
    if (!customSegmentName.trim()) {
      alert('Por favor, informe o nome do ramo de atuação.');
      return;
    }

    try {
      const newSegment = businessSegmentService.createCustomSegment(
        customSegmentName,
        customSegmentCategory,
        customSegmentDescription
      );
      
      // Selecionar automaticamente o novo segmento
      handleSelectSegment(newSegment);
      
      // Limpar formulário
      setCustomSegmentName('');
      setCustomSegmentDescription('');
      setShowCustomModal(false);
      
      // Recarregar lista
      loadSegments();
    } catch (error) {
      console.error('Erro ao criar segmento personalizado:', error);
      alert('Erro ao criar ramo de atuação personalizado. Tente novamente.');
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

  // Debug: verificar se o componente está sendo renderizado
  console.log('BusinessSegmentConfig renderizado', { segmentsCount: segments.length, selectedSegment: selectedSegment?.segment?.nome });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building className="w-6 h-6 text-emerald-600" />
            Ramo de Atuação
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure o ramo de atuação da sua empresa para personalizar funcionalidades, categorias e relatórios
          </p>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Salvo!</span>
          </div>
        )}
      </div>

      {/* Segmento Atual */}
      {selectedSegment && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  Ramo Atual: {selectedSegment.segment.nome}
                </span>
              </div>
              {selectedSegment.segment.descricao && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedSegment.segment.descricao}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Categoria: {categoryLabels[selectedSegment.segment.categoria]}</span>
                {selectedSegment.segment.personalizado && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    Personalizado
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar ramo de atuação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            {categoryOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Segmentos */}
      {segments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando ramos de atuação...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Ramos Disponíveis ({filteredSegments.length})
            </h4>
          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Personalizado
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredSegments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum ramo encontrado com os filtros selecionados.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSegments.map(segment => {
                const isSelected = selectedSegment?.segmentId === segment.id;
                return (
                  <div
                    key={segment.id}
                    onClick={() => handleSelectSegment(segment)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold text-gray-900 dark:text-white">
                            {segment.nome}
                          </h5>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          )}
                          {segment.personalizado && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              Personalizado
                            </span>
                          )}
                        </div>
                        {segment.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {segment.descricao}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{categoryLabels[segment.categoria]}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Modal Criar Personalizado */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Criar Ramo Personalizado
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Ramo *
                </label>
                <input
                  type="text"
                  value={customSegmentName}
                  onChange={(e) => setCustomSegmentName(e.target.value)}
                  placeholder="Ex: Loja de Artesanato"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria *
                </label>
                <select
                  value={customSegmentCategory}
                  onChange={(e) => setCustomSegmentCategory(e.target.value as BusinessSegmentCategory)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {categoryOptions.filter(opt => opt.value !== 'all').map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={customSegmentDescription}
                  onChange={(e) => setCustomSegmentDescription(e.target.value)}
                  placeholder="Descreva o ramo de atuação..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleCreateCustomSegment}
                disabled={!customSegmentName.trim() || saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                Criar e Selecionar
              </button>
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Informações */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Como funciona:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>O ramo de atuação define categorias financeiras, tipos de pagamento e campos obrigatórios</li>
              <li>Você pode alterar o ramo a qualquer momento, mas isso pode afetar os dados existentes</li>
              <li>Ramos personalizados podem ser criados para atender necessidades específicas</li>
              <li>Múltiplos ramos podem ser configurados para diferentes lojas/filiais</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

