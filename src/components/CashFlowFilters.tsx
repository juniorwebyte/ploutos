import React, { useState } from 'react';
import { Search, Filter, X, Calendar, DollarSign, Tag, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '../utils/currency';

export interface CashFlowFilters {
  // Busca rápida
  quickSearch: string;
  
  // Filtros por período
  dateStart: string;
  dateEnd: string;
  
  // Filtro por tipo
  entryType: string; // 'all' | 'dinheiro' | 'cartao' | 'pix' | 'boletos' | 'cheques'
  exitType: string; // 'all' | 'saida' | 'devolucao' | 'vale' | 'transportadora' | 'correios'
  
  // Faixa de valores
  valueMin: string;
  valueMax: string;
  
  // Status
  status: string; // 'all' | 'fechado' | 'aberto'
}

interface CashFlowFiltersProps {
  filters: CashFlowFilters;
  onFiltersChange: (filters: CashFlowFilters) => void;
  showAdvanced?: boolean;
}

const CashFlowFiltersComponent: React.FC<CashFlowFiltersProps> = ({
  filters,
  onFiltersChange,
  showAdvanced = false
}) => {
  const [isExpanded, setIsExpanded] = useState(showAdvanced);

  const updateFilter = (key: keyof CashFlowFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      quickSearch: '',
      dateStart: '',
      dateEnd: '',
      entryType: 'all',
      exitType: 'all',
      valueMin: '',
      valueMax: '',
      status: 'all'
    });
  };

  const hasActiveFilters = 
    filters.quickSearch !== '' ||
    filters.dateStart !== '' ||
    filters.dateEnd !== '' ||
    filters.entryType !== 'all' ||
    filters.exitType !== 'all' ||
    filters.valueMin !== '' ||
    filters.valueMax !== '' ||
    filters.status !== 'all';

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <h3 className="text-xs font-semibold text-gray-900">Filtros e Buscas</h3>
        </div>
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-3 h-3" />
              Limpar
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-1.5 py-0.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
          >
            {isExpanded ? 'Recolher' : 'Expandir'}
          </button>
        </div>
      </div>

      {/* Busca Rápida - Sempre visível */}
      <div className="border-b border-gray-200 pb-2">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          <Search className="w-3 h-3 inline mr-1" />
          Busca Rápida
        </label>
        <input
          type="text"
          value={filters.quickSearch}
          onChange={(e) => updateFilter('quickSearch', e.target.value)}
          placeholder="Buscar por descrição, valor ou data..."
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-0.5">
          Busque por qualquer termo relacionado ao movimento
        </p>
      </div>

      {/* Filtros Avançados */}
      {isExpanded && (
        <div className="space-y-2 pt-2 border-t border-gray-200">
          {/* Período */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <Calendar className="w-3 h-3 inline mr-1" />
              Período
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Data Inicial</label>
                <input
                  type="date"
                  value={filters.dateStart}
                  onChange={(e) => updateFilter('dateStart', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Data Final</label>
                <input
                  type="date"
                  value={filters.dateEnd}
                  onChange={(e) => updateFilter('dateEnd', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Tipo de Entrada/Saída */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Tag className="w-3 h-3 inline mr-1" />
                Tipo de Entrada
              </label>
              <select
                value={filters.entryType}
                onChange={(e) => updateFilter('entryType', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="pix">PIX</option>
                <option value="boletos">Boletos</option>
                <option value="cheques">Cheques</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                <Tag className="w-3 h-3 inline mr-1" />
                Tipo de Saída
              </label>
              <select
                value={filters.exitType}
                onChange={(e) => updateFilter('exitType', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas</option>
                <option value="saida">Saída</option>
                <option value="devolucao">Devolução</option>
                <option value="vale">Vale</option>
                <option value="transportadora">Transportadora</option>
                <option value="correios">Correios</option>
              </select>
            </div>
          </div>

          {/* Faixa de Valores */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              <DollarSign className="w-3 h-3 inline mr-1" />
              Faixa de Valores
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Valor Mínimo</label>
                <input
                  type="text"
                  value={filters.valueMin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    updateFilter('valueMin', value);
                  }}
                  placeholder="0,00"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-0.5">Valor Máximo</label>
                <input
                  type="text"
                  value={filters.valueMax}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    updateFilter('valueMax', value);
                  }}
                  placeholder="0,00"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            {(filters.valueMin || filters.valueMax) && (
              <div className="flex gap-2 mt-0.5">
                {filters.valueMin && (
                  <p className="text-xs text-gray-500">
                    Mín: {formatCurrency(Number(filters.valueMin) / 100)}
                  </p>
                )}
                {filters.valueMax && (
                  <p className="text-xs text-gray-500">
                    Máx: {formatCurrency(Number(filters.valueMax) / 100)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex gap-1.5">
              <button
                onClick={() => updateFilter('status', 'all')}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filters.status === 'all'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => updateFilter('status', 'fechado')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filters.status === 'fechado'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                Fechado
              </button>
              <button
                onClick={() => updateFilter('status', 'aberto')}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filters.status === 'aberto'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <XCircle className="w-3 h-3" />
                Aberto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de Filtros Ativos */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <Filter className="w-3 h-3" />
            <span>Filtros ativos</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlowFiltersComponent;

