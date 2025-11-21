import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  X, 
  DollarSign, 
  Calendar,
  FileText,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { NotaFiscal, ParcelaNotaFiscal } from '../types';

interface CadernoDemoProps {
  onClose: () => void;
}

export default function CadernoDemo({ onClose }: CadernoDemoProps) {
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 minutos em segundos
  const [isActive, setIsActive] = useState(true);
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [showNotaModal, setShowNotaModal] = useState(false);
  const [formData, setFormData] = useState({
    fabricacao: '',
    numeroNfe: '',
    total: '',
    totalParcelas: '1',
    observacoes: ''
  });

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft => timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Demo expirou
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddNota = () => {
    if (!formData.fabricacao || !formData.numeroNfe || !formData.total) {
      return;
    }

    const totalValue = parseFloat(formData.total);
    const totalParcelas = parseInt(formData.totalParcelas) || 1;
    const valorParcela = totalValue / totalParcelas;

    // Gerar parcelas automaticamente
    const parcelas: ParcelaNotaFiscal[] = [];
    const hoje = new Date();
    
    for (let i = 1; i <= totalParcelas; i++) {
      const dataVencimento = new Date(hoje);
      dataVencimento.setMonth(dataVencimento.getMonth() + i);
      
      parcelas.push({
        id: `demo_parcela_${Date.now()}_${i}`,
        numeroParcela: i,
        valor: valorParcela,
        dataVencimento: dataVencimento.toISOString().split('T')[0],
        status: 'pendente',
        observacoes: ''
      });
    }

    const novaNota: NotaFiscal = {
      id: `demo_nota_${Date.now()}`,
      dataEntrada: new Date().toISOString().split('T')[0],
      fabricacao: formData.fabricacao,
      numeroNfe: formData.numeroNfe,
      total: totalValue,
      totalParcelas,
      valorParcela,
      parcelas,
      status: 'ativa',
      observacoes: formData.observacoes,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };

    setNotas(prev => [...prev, novaNota]);
    setFormData({
      fabricacao: '',
      numeroNfe: '',
      total: '',
      totalParcelas: '1',
      observacoes: ''
    });
    setShowNotaModal(false);
  };

  const handlePagarParcela = (notaId: string, parcelaId: string) => {
    setNotas(prev => prev.map(nota => {
      if (nota.id === notaId) {
        const parcelasAtualizadas = nota.parcelas.map(parcela => 
          parcela.id === parcelaId 
            ? { ...parcela, status: 'paga' as const, dataPagamento: new Date().toISOString().split('T')[0] }
            : parcela
        );
        
        // Atualizar status da nota
        const parcelasPagas = parcelasAtualizadas.filter(p => p.status === 'paga').length;
        let novoStatus = 'ativa';
        if (parcelasPagas === parcelasAtualizadas.length) {
          novoStatus = 'quitada';
        } else if (parcelasPagas > 0) {
          novoStatus = 'parcialmente_paga';
        }

        return {
          ...nota,
          parcelas: parcelasAtualizadas,
          status: novoStatus as any
        };
      }
      return nota;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quitada': return 'bg-green-100 text-green-800';
      case 'parcialmente_paga': return 'bg-yellow-100 text-yellow-800';
      case 'vencida': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getParcelaStatusColor = (status: string) => {
    switch (status) {
      case 'paga': return 'bg-green-100 text-green-800';
      case 'vencida': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FileText className="h-8 w-8" />
                Demo Gratuita - Caderno de Notas
              </h2>
              <p className="text-blue-100 mt-1">Teste todas as funcionalidades por 5 minutos</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-mono text-lg">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {timeLeft === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Demo Expirada</h3>
              <p className="text-gray-600 mb-6">
                Sua demonstração gratuita de 5 minutos expirou. 
                Para continuar usando o sistema, escolha um de nossos planos.
              </p>
              <button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Ver Planos
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total de Notas</p>
                      <p className="text-2xl font-bold">{notas.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Valor Total</p>
                      <p className="text-2xl font-bold">
                        R$ {notas.reduce((sum, n) => sum + n.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Parcelas Pagas</p>
                      <p className="text-2xl font-bold">
                        {notas.reduce((sum, n) => sum + n.parcelas.filter(p => p.status === 'paga').length, 0)}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-200" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Parcelas Pendentes</p>
                      <p className="text-2xl font-bold">
                        {notas.reduce((sum, n) => sum + n.parcelas.filter(p => p.status === 'pendente').length, 0)}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowNotaModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  Nova Nota Fiscal
                </button>
                
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                    isActive 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isActive ? 'Pausar' : 'Continuar'} Demo
                </button>
              </div>

              {/* Lista de Notas */}
              <div className="space-y-4">
                {notas.map(nota => (
                  <div key={nota.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{nota.fabricacao}</h3>
                        <p className="text-sm text-gray-500">NFe: {nota.numeroNfe}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          R$ {nota.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(nota.status)}`}>
                          {nota.status}
                        </span>
                      </div>
                    </div>

                    {/* Parcelas */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700">Parcelas ({nota.totalParcelas}x)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {nota.parcelas.map(parcela => (
                          <div key={parcela.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                Parcela {parcela.numeroParcela}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getParcelaStatusColor(parcela.status)}`}>
                                {parcela.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <div>Valor: R$ {parcela.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                              <div>Vencimento: {new Date(parcela.dataVencimento).toLocaleDateString('pt-BR')}</div>
                              {parcela.dataPagamento && (
                                <div className="text-green-600">
                                  Pago em: {new Date(parcela.dataPagamento).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                            {parcela.status === 'pendente' && (
                              <button
                                onClick={() => handlePagarParcela(nota.id, parcela.id)}
                                className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm transition-colors"
                              >
                                Marcar como Paga
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {notas.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma nota fiscal cadastrada</h3>
                    <p className="text-gray-500 mb-4">Comece adicionando uma nova nota fiscal para testar o sistema.</p>
                    <button
                      onClick={() => setShowNotaModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      Adicionar Primeira Nota
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal de Nova Nota */}
        {showNotaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Nova Nota Fiscal</h3>
                <button
                  onClick={() => setShowNotaModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fabricação *
                  </label>
                  <input
                    type="text"
                    value={formData.fabricacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, fabricacao: e.target.value }))}
                    placeholder="Nome da empresa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° da NFE *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroNfe}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroNfe: e.target.value }))}
                    placeholder="Número da Nota Fiscal"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Total *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.total}
                    onChange={(e) => setFormData(prev => ({ ...prev, total: e.target.value }))}
                    placeholder="0,00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total de Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalParcelas}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalParcelas: e.target.value }))}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowNotaModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddNota}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
