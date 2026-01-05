// Componente para entrada de VR/VA
import React, { useState } from 'react';
import { Plus, X, CreditCard } from 'lucide-react';
import { ValeRefeicaoAlimentacao, BandeiraBeneficio } from '../types';
import { formatCurrency } from '../utils/currency';

interface ValeRefeicaoAlimentacaoInputProps {
  tipo: 'VR' | 'VA';
  lancamentos: ValeRefeicaoAlimentacao[];
  onAdd: (lancamento: ValeRefeicaoAlimentacao) => void;
  onRemove: (index: number) => void;
  total: number;
  enabled: boolean;
}

const BANDEIRAS_BENEFICIO = [
  BandeiraBeneficio.ALELO,
  BandeiraBeneficio.PLUXEE,
  BandeiraBeneficio.TICKET,
  BandeiraBeneficio.VR_BENEFICIOS,
  BandeiraBeneficio.BEN_VISA_VALE,
  BandeiraBeneficio.GREEN_CARD,
  BandeiraBeneficio.UP_BRASIL,
  BandeiraBeneficio.VEROCARD,
  BandeiraBeneficio.CAJU,
  BandeiraBeneficio.FLASH_BENEFICIOS,
  BandeiraBeneficio.SWILE,
  BandeiraBeneficio.IFOOD_BENEFICIOS
];

export default function ValeRefeicaoAlimentacaoInput({
  tipo,
  lancamentos,
  onAdd,
  onRemove,
  total,
  enabled
}: ValeRefeicaoAlimentacaoInputProps) {
  const [showForm, setShowForm] = useState(false);
  const [valor, setValor] = useState('');
  const [bandeira, setBandeira] = useState<BandeiraBeneficio>(BandeiraBeneficio.ALELO);

  const handleAdd = () => {
    const valorNum = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    if (valorNum <= 0) {
      alert('Por favor, informe um valor válido.');
      return;
    }

    const novoLancamento: ValeRefeicaoAlimentacao = {
      tipo,
      bandeira,
      valor: valorNum
    };

    onAdd(novoLancamento);
    setValor('');
    setBandeira(BandeiraBeneficio.ALELO);
    setShowForm(false);
  };

  if (!enabled) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {tipo === 'VR' ? 'Vale Refeição (VR)' : 'Vale Alimentação (VA)'}
          </h3>
        </div>
        <div className="text-lg font-bold text-emerald-600">
          {formatCurrency(total)}
        </div>
      </div>

      {/* Lista de lançamentos */}
      {lancamentos.length > 0 && (
        <div className="space-y-2 mb-4">
          {lancamentos.map((lancamento, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(lancamento.valor)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Bandeira: {lancamento.bandeira}
                </div>
              </div>
              <button
                onClick={() => onRemove(index)}
                className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Remover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de adicionar */}
      {showForm ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bandeira do Benefício *
              </label>
              <select
                value={bandeira}
                onChange={(e) => setBandeira(e.target.value as BandeiraBeneficio)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              >
                {BANDEIRAS_BENEFICIO.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Valor *
              </label>
              <input
                type="text"
                value={valor}
                onChange={(e) => {
                  const value = e.target.value;
                  // Permitir apenas números, vírgula e ponto
                  const cleaned = value.replace(/[^\d,.]/g, '');
                  setValor(cleaned);
                }}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setValor('');
                  setBandeira(BandeiraBeneficio.ALELO);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-gray-600 dark:text-gray-400"
        >
          <Plus className="w-4 h-4" />
          Adicionar {tipo === 'VR' ? 'Vale Refeição' : 'Vale Alimentação'}
        </button>
      )}
    </div>
  );
}

