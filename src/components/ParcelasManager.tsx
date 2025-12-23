import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Save,
  X
} from 'lucide-react';
import { ParcelaNotaFiscal } from '../types';

interface ParcelasManagerProps {
  total: number;
  totalParcelas: number;
  valorParcela: number;
  parcelas: ParcelaNotaFiscal[];
  onParcelasChange: (parcelas: ParcelaNotaFiscal[]) => void;
  onTotalParcelasChange: (totalParcelas: number) => void;
  onValorParcelaChange: (valorParcela: number) => void;
}

export default function ParcelasManager({
  total,
  totalParcelas,
  valorParcela,
  parcelas,
  onParcelasChange,
  onTotalParcelasChange,
  onValorParcelaChange
}: ParcelasManagerProps) {
  const [showParcelasModal, setShowParcelasModal] = useState(false);
  const [editingParcela, setEditingParcela] = useState<ParcelaNotaFiscal | null>(null);
  const [parcelaForm, setParcelaForm] = useState({
    numeroParcela: 1,
    valor: 0,
    dataVencimento: '',
    observacoes: ''
  });

  // Calcular parcelas automaticamente quando total ou totalParcelas mudam
  // Apenas gerar parcelas se não existirem - a sincronização completa acontece no handleSaveNota
  useEffect(() => {
    if (total > 0 && totalParcelas > 0 && parcelas.length === 0) {
      const valorCalculado = total / totalParcelas;
      onValorParcelaChange(valorCalculado);
      
        const novasParcelas: ParcelaNotaFiscal[] = [];
        const hoje = new Date();
        
        for (let i = 1; i <= totalParcelas; i++) {
          const dataVencimento = new Date(hoje);
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
          
          novasParcelas.push({
            id: `parcela_${Date.now()}_${i}`,
            numeroParcela: i,
            valor: valorCalculado,
            dataVencimento: dataVencimento.toISOString().split('T')[0],
            status: 'pendente',
            observacoes: ''
          });
        }
        
        onParcelasChange(novasParcelas);
    } else if (total > 0 && totalParcelas > 0) {
      const valorCalculado = total / totalParcelas;
      onValorParcelaChange(valorCalculado);
    }
  }, [total, totalParcelas]);

  const handleAddParcela = () => {
    setEditingParcela(null);
    setParcelaForm({
      numeroParcela: parcelas.length + 1,
      valor: valorParcela,
      dataVencimento: '',
      observacoes: ''
    });
    setShowParcelasModal(true);
  };

  const handleEditParcela = (parcela: ParcelaNotaFiscal) => {
    setEditingParcela(parcela);
    setParcelaForm({
      numeroParcela: parcela.numeroParcela,
      valor: parcela.valor,
      dataVencimento: parcela.dataVencimento,
      observacoes: parcela.observacoes || ''
    });
    setShowParcelasModal(true);
  };

  const handleSaveParcela = () => {
    if (!parcelaForm.dataVencimento || parcelaForm.valor <= 0) {
      return;
    }

    const parcelaData: ParcelaNotaFiscal = {
      id: editingParcela?.id || `parcela_${Date.now()}`,
      numeroParcela: parcelaForm.numeroParcela,
      valor: parcelaForm.valor,
      dataVencimento: parcelaForm.dataVencimento,
      status: editingParcela?.status || 'pendente',
      observacoes: parcelaForm.observacoes
    };

    if (editingParcela) {
      const updatedParcelas = parcelas.map(p => 
        p.id === editingParcela.id ? parcelaData : p
      );
      onParcelasChange(updatedParcelas);
    } else {
      onParcelasChange([...parcelas, parcelaData]);
    }

    // Recalcular valor total das parcelas e atualizar valor da parcela
    const novasParcelas = editingParcela 
      ? parcelas.map(p => p.id === editingParcela.id ? parcelaData : p)
      : [...parcelas, parcelaData];
    
    const novoValorTotal = novasParcelas.reduce((sum, p) => sum + p.valor, 0);
    const novoValorParcela = novoValorTotal / novasParcelas.length;
    
    onValorParcelaChange(novoValorParcela);

    setShowParcelasModal(false);
  };

  const handleDeleteParcela = (id: string) => {
    const updatedParcelas = parcelas.filter(p => p.id !== id);
    onParcelasChange(updatedParcelas);
  };

  const handlePagarParcela = (id: string) => {
    const updatedParcelas = parcelas.map(p => 
      p.id === id 
        ? { ...p, status: 'paga' as const, dataPagamento: new Date().toISOString().split('T')[0] }
        : p
    );
    onParcelasChange(updatedParcelas);
    
    // Recalcular valor total das parcelas
    const novoValorTotal = updatedParcelas.reduce((sum, p) => sum + p.valor, 0);
    const novoValorParcela = novoValorTotal / updatedParcelas.length;
    onValorParcelaChange(novoValorParcela);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paga': return 'bg-green-100 text-green-800';
      case 'vencida': return 'bg-red-100 text-red-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paga': return <CheckCircle className="h-4 w-4" />;
      case 'vencida': return <AlertTriangle className="h-4 w-4" />;
      case 'pendente': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const valorTotalParcelas = parcelas.reduce((sum, p) => sum + p.valor, 0);
  const parcelasPagas = parcelas.filter(p => p.status === 'paga').length;
  const parcelasVencidas = parcelas.filter(p => p.status === 'vencida').length;

  return (
    <div className="space-y-4">
      {/* Resumo das Parcelas */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Sistema de Parcelas
          </h3>
          <button
            onClick={handleAddParcela}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Parcela
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-sm text-gray-600">Total de Parcelas</div>
            <div className="text-2xl font-bold text-blue-600">{totalParcelas}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-sm text-gray-600">Valor Total</div>
            <div className="text-2xl font-bold text-green-600">
              R$ {valorTotalParcelas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-sm text-gray-600">Parcelas Pagas</div>
            <div className="text-2xl font-bold text-green-600">{parcelasPagas}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="text-sm text-gray-600">Parcelas Vencidas</div>
            <div className="text-2xl font-bold text-red-600">{parcelasVencidas}</div>
          </div>
        </div>
      </div>

      {/* Lista de Parcelas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Parcelas da Nota Fiscal</h4>
        </div>
        
        <div className="divide-y divide-gray-200">
          {parcelas.map((parcela) => (
            <div key={parcela.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">
                      {parcela.numeroParcela}
                    </span>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900">
                      Parcela {parcela.numeroParcela}
                    </div>
                    <div className="text-sm text-gray-500">
                      Vencimento: {new Date(parcela.dataVencimento).toLocaleDateString('pt-BR')}
                    </div>
                    {parcela.dataPagamento && (
                      <div className="text-sm text-green-600">
                        Pago em: {new Date(parcela.dataPagamento).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(parcela.status)}`}>
                      {getStatusIcon(parcela.status)}
                      {parcela.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {parcela.status === 'pendente' && (
                      <button
                        onClick={() => handlePagarParcela(parcela.id)}
                        className="text-green-600 hover:text-green-800 p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="Marcar como paga"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEditParcela(parcela)}
                      className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar parcela"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteParcela(parcela.id)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir parcela"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {parcelas.length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma parcela cadastrada</h3>
            <p className="text-gray-500">Adicione parcelas para organizar os pagamentos da nota fiscal.</p>
          </div>
        )}
      </div>

      {/* Modal de Parcela */}
      {showParcelasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingParcela ? 'Editar Parcela' : 'Nova Parcela'}
              </h3>
              <button
                onClick={() => setShowParcelasModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da Parcela
                </label>
                <input
                  type="number"
                  value={parcelaForm.numeroParcela}
                  onChange={(e) => setParcelaForm(prev => ({ ...prev, numeroParcela: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor da Parcela
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={parcelaForm.valor}
                  onChange={(e) => setParcelaForm(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={parcelaForm.dataVencimento}
                  onChange={(e) => setParcelaForm(prev => ({ ...prev, dataVencimento: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={parcelaForm.observacoes}
                  onChange={(e) => setParcelaForm(prev => ({ ...prev, observacoes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowParcelasModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveParcela}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
