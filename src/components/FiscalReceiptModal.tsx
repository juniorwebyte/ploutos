import React, { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  Download,
  Printer,
  X,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  Clock
} from 'lucide-react';
import pdvService, { FiscalReceipt, Sale } from '../services/pdvService';
import fiscalService, { FiscalReceiptData } from '../services/fiscalService';
import FiscalReceiptPrint from './FiscalReceiptPrint';

interface FiscalReceiptModalProps {
  onClose: () => void;
}

function FiscalReceiptModal({ onClose }: FiscalReceiptModalProps) {
  const [receipts, setReceipts] = useState<FiscalReceipt[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<FiscalReceipt | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [receiptsData, salesData] = await Promise.all([
        pdvService.getFiscalReceipts(),
        pdvService.getSales()
      ]);
      setReceipts(receiptsData);
      setSales(salesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueReceipt = async () => {
    if (!selectedSale) return;

    setIssueLoading(true);
    try {
      const newReceipt = await pdvService.issueFiscalReceipt(selectedSale.id);
      setReceipts(prev => [newReceipt, ...prev]);
      setShowIssueForm(false);
      setSelectedSale(null);
    } catch (error) {
      console.error('Erro ao emitir cupom fiscal:', error);
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

  const handlePrint = (receipt: FiscalReceipt) => {
    setSelectedReceiptForPrint(receipt);
    setTimeout(() => {
      if (printRef.current) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Cupom Fiscal - ${receipt.receipt_number}</title>
                <style>
                  @media print {
                    @page {
                      size: 80mm auto;
                      margin: 0;
                    }
                    body { margin: 0; padding: 0; }
                    /* Centralização absoluta do conteúdo impresso */
                    .receipt-print-wrapper {
                      width: 100% !important;
                      min-height: 100vh !important;
                      display: flex !important;
                      align-items: flex-start !important;
                      justify-content: center !important;
                      padding: 0 !important;
                      margin: 0 !important;
                      background: #fff !important;
                    }
                    .receipt-root { margin: 0 auto !important; }
                  }
                  body {
                    font-family: 'Courier New', monospace;
                    margin: 0;
                    padding: 0;
                  }
                </style>
              </head>
              <body>
                <div class="receipt-print-wrapper">${printRef.current.innerHTML}</div>
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
            setSelectedReceiptForPrint(null);
          }, 250);
        }
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Cupons Fiscais</h2>
              <p className="text-sm text-gray-600">Emissão e Gestão de Cupons Fiscais</p>
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
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Emitidos</p>
                  <p className="text-3xl font-bold">{receipts.length}</p>
                </div>
                <Receipt className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Valor Total</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(receipts.reduce((sum, r) => sum + r.total_amount, 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Este Mês</p>
                  <p className="text-3xl font-bold">
                    {receipts.filter(r => {
                      const receiptDate = new Date(r.issue_date);
                      const now = new Date();
                      return receiptDate.getMonth() === now.getMonth() && 
                             receiptDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Taxa Média</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(receipts.reduce((sum, r) => sum + r.tax_amount, 0) / Math.max(receipts.length, 1))}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Botão para Emitir Novo Cupom */}
          <div className="mb-6">
            <button
              onClick={() => setShowIssueForm(true)}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
            >
              <Receipt className="w-5 h-5" />
              <span>Emitir Novo Cupom Fiscal</span>
            </button>
          </div>

          {/* Lista de Cupons Fiscais */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-800">Cupons Fiscais Emitidos</h3>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Carregando cupons fiscais...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Série
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
                    {receipts.map((receipt) => {
                      const sale = sales.find(s => s.id === receipt.sale_id);
                      return (
                        <tr key={receipt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {receipt.receipt_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {receipt.series}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {sale ? `#${sale.id}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(receipt.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(receipt.tax_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(receipt.issue_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              receipt.status === 'issued' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {receipt.status === 'issued' ? 'Emitido' : 'Cancelado'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handlePrint(receipt)}
                                className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                              >
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
          </div>
        </div>

        {/* Modal para Emitir Cupom */}
        {showIssueForm && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Emitir Cupom Fiscal</h3>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    onClick={handleIssueReceipt}
                    disabled={!selectedSale || issueLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {issueLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Emitindo...</span>
                      </>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4" />
                        <span>Emitir Cupom</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Print Component */}
        <div className="hidden">
          {selectedReceiptForPrint && (
            <div ref={printRef}>
              <FiscalReceiptPrint receipt={selectedReceiptForPrint} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FiscalReceiptModal;
