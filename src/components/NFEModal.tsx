import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  DollarSign,
  Receipt,
  Clock,
  Eye,
  Search
} from 'lucide-react';
import pdvService, { NFE, Sale } from '../services/pdvService';

interface NFEModalProps {
  onClose: () => void;
}

function NFEModal({ onClose }: NFEModalProps) {
  const [nfes, setNfes] = useState<NFE[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [nfesData, salesData] = await Promise.all([
        pdvService.getNFEs(),
        pdvService.getSales()
      ]);
      setNfes(nfesData);
      setSales(salesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueNFE = async () => {
    if (!selectedSale) return;

    setIssueLoading(true);
    try {
      const newNFE = await pdvService.issueNFE(selectedSale.id);
      setNfes(prev => [newNFE, ...prev]);
      setShowIssueForm(false);
      setSelectedSale(null);
    } catch (error) {
      console.error('Erro ao emitir NFE:', error);
    } finally {
      setIssueLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'issued':
        return 'Emitida';
      case 'cancelled':
        return 'Cancelada';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  };

  const filteredNfes = nfes.filter(nfe => {
    const matchesSearch = nfe.nfe_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         nfe.access_key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || nfe.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Nota Fiscal Eletrônica (NFE)</h2>
              <p className="text-sm text-gray-600">Emissão e Gestão de NFEs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Header com Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Emitidas</p>
                  <p className="text-3xl font-bold">{nfes.length}</p>
                </div>
                <FileText className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Valor Total</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(nfes.reduce((sum, n) => sum + n.total_amount, 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Este Mês</p>
                  <p className="text-3xl font-bold">
                    {nfes.filter(n => {
                      const nfeDate = new Date(n.issue_date);
                      const now = new Date();
                      return nfeDate.getMonth() === now.getMonth() && 
                             nfeDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Pendentes</p>
                  <p className="text-3xl font-bold">
                    {nfes.filter(n => n.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar por número da NFE ou chave de acesso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Todos os Status</option>
                <option value="issued">Emitidas</option>
                <option value="pending">Pendentes</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
            <button
              onClick={() => setShowIssueForm(true)}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>Emitir NFE</span>
            </button>
          </div>

          {/* Lista de NFEs */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Notas Fiscais Eletrônicas</h3>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-600">Carregando NFEs...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número NFE
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chave de Acesso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Venda
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Taxa
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Emissão
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredNfes.map((nfe) => {
                      const sale = sales.find(s => s.id === nfe.sale_id);
                      return (
                        <tr key={nfe.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {nfe.nfe_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                            <div className="max-w-xs truncate" title={nfe.access_key}>
                              {nfe.access_key}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale ? `#${sale.id}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(nfe.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(nfe.tax_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(nfe.issue_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(nfe.status)}`}>
                              {getStatusText(nfe.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                                <Eye className="w-4 h-4" />
                                <span>Ver</span>
                              </button>
                              <button className="text-green-600 hover:text-green-900 flex items-center space-x-1">
                                <Download className="w-4 h-4" />
                                <span>Baixar</span>
                              </button>
                              <button className="text-purple-600 hover:text-purple-900 flex items-center space-x-1">
                                <Printer className="w-4 h-4" />
                                <span>Imprimir</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {filteredNfes.length === 0 && !loading && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhuma NFE encontrada</h3>
                <p className="text-gray-600">Não há NFEs que correspondam aos filtros selecionados.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal para Emitir NFE */}
        {showIssueForm && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Emitir Nota Fiscal Eletrônica</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecionar Venda
                    </label>
                    <select
                      value={selectedSale?.id || ''}
                      onChange={(e) => {
                        const sale = sales.find(s => s.id === e.target.value);
                        setSelectedSale(sale || null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Selecione uma venda</option>
                      {sales.map((sale) => (
                        <option key={sale.id} value={sale.id}>
                          #{sale.id} - {sale.customer_name} - {formatCurrency(sale.total)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSale && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Detalhes da Venda</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Cliente:</span>
                          <p className="font-medium">{selectedSale.customer_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Vendedor:</span>
                          <p className="font-medium">{selectedSale.seller_name}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Total:</span>
                          <p className="font-medium">{formatCurrency(selectedSale.total)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Itens:</span>
                          <p className="font-medium">{selectedSale.items.length}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h5 className="font-medium text-gray-800 mb-2">Itens da Venda:</h5>
                        <div className="space-y-2">
                          {selectedSale.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.product_name} x{item.quantity}</span>
                              <span>{formatCurrency(item.total_price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowIssueForm(false);
                      setSelectedSale(null);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleIssueNFE}
                    disabled={!selectedSale || issueLoading}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {issueLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Emitindo...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Emitir NFE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NFEModal;
