import React from 'react';
import { Printer, Download, X, FileText, Calendar, DollarSign, CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { NotaFiscal } from '../types';

interface NotaFiscalReportProps {
  nota: NotaFiscal;
  onClose: () => void;
}

export default function NotaFiscalReport({ nota, onClose }: NotaFiscalReportProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'text-blue-600';
      case 'quitada': return 'text-green-600';
      case 'vencida': return 'text-red-600';
      case 'parcialmente_paga': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativa': return 'Ativa';
      case 'quitada': return 'Quitada';
      case 'vencida': return 'Vencida';
      case 'parcialmente_paga': return 'Parcialmente Paga';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativa': return <Clock className="h-4 w-4" />;
      case 'quitada': return <CheckCircle className="h-4 w-4" />;
      case 'vencida': return <AlertCircle className="h-4 w-4" />;
      case 'parcialmente_paga': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // Simular exportação PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Nota Fiscal - ${nota.numeroNfe}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-info { background: #f5f5f5; padding: 20px; margin-bottom: 20px; }
            .invoice-details { margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; }
            .total-section { background: #f9f9f9; padding: 15px; margin-top: 20px; }
            .status { font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NOTA FISCAL ELETRÔNICA</h1>
            <h2>PloutosLedger - Sistema de Gestão Financeira</h2>
          </div>
          
          <div class="company-info">
            <h3>Dados da Empresa</h3>
            <p><strong>Razão Social:</strong> PloutosLedger Tecnologia</p>
            <p><strong>CNPJ:</strong> 00.000.000/0001-00</p>
            <p><strong>Endereço:</strong> Rua das Tecnologias, 123 - São Paulo/SP</p>
            <p><strong>Telefone:</strong> (11) 99999-9999</p>
            <p><strong>E-mail:</strong> contato@ploutosledger.com</p>
          </div>

          <div class="invoice-details">
            <h3>Dados da Nota Fiscal</h3>
            <table class="table">
              <tr><td><strong>Número da NFE:</strong></td><td>${nota.numeroNfe}</td></tr>
              <tr><td><strong>Data de Emissão:</strong></td><td>${formatDate(nota.dataEntrada)}</td></tr>
              <tr><td><strong>Data de Fabricação:</strong></td><td>${formatDate(nota.fabricacao)}</td></tr>
              <tr><td><strong>Status:</strong></td><td class="status">${getStatusText(nota.status)}</td></tr>
              <tr><td><strong>Valor Total:</strong></td><td><strong>${formatCurrency(nota.total)}</strong></td></tr>
              <tr><td><strong>Total de Parcelas:</strong></td><td>${nota.totalParcelas}</td></tr>
              <tr><td><strong>Valor por Parcela:</strong></td><td>${formatCurrency(nota.valorParcela)}</td></tr>
            </table>
          </div>

          ${nota.parcelas && nota.parcelas.length > 0 ? `
          <div class="parcelas-section">
            <h3>Detalhamento das Parcelas</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Parcela</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Data Pagamento</th>
                </tr>
              </thead>
              <tbody>
                ${nota.parcelas.map(parcela => `
                  <tr>
                    <td>${parcela.numeroParcela}</td>
                    <td>${formatCurrency(parcela.valor)}</td>
                    <td>${formatDate(parcela.dataVencimento)}</td>
                    <td class="status">${parcela.status}</td>
                    <td>${parcela.dataPagamento ? formatDate(parcela.dataPagamento) : '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="total-section">
            <h3>Resumo Financeiro</h3>
            <p><strong>Valor Total da Nota:</strong> ${formatCurrency(nota.total)}</p>
            <p><strong>Total de Parcelas:</strong> ${nota.totalParcelas}</p>
            <p><strong>Valor Médio por Parcela:</strong> ${formatCurrency(nota.valorParcela)}</p>
            ${nota.parcelas && nota.parcelas.length > 0 ? `
              <p><strong>Parcelas Pagas:</strong> ${nota.parcelas.filter(p => p.status === 'paga').length}</p>
              <p><strong>Parcelas Pendentes:</strong> ${nota.parcelas.filter(p => p.status === 'pendente').length}</p>
              <p><strong>Parcelas Vencidas:</strong> ${nota.parcelas.filter(p => p.status === 'vencida').length}</p>
            ` : ''}
          </div>

          ${nota.observacoes ? `
          <div class="observacoes">
            <h3>Observações</h3>
            <p>${nota.observacoes}</p>
          </div>
          ` : ''}

          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            <p>Documento gerado automaticamente pelo sistema PloutosLedger</p>
            <p>Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Relatório de Nota Fiscal</h2>
                <p className="text-blue-100">Número: {nota.numeroNfe}</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] print:p-0 print:max-h-none">
          {/* Company Header */}
          <div className="text-center mb-8 print:mb-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 print:text-2xl">NOTA FISCAL ELETRÔNICA</h1>
            <h2 className="text-xl text-gray-600 mb-4 print:text-lg">PloutosLedger - Sistema de Gestão Financeira</h2>
            <div className="bg-gray-100 rounded-lg p-4 print:bg-transparent print:p-0">
              <h3 className="font-semibold text-gray-900 mb-2">Dados da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><strong>Razão Social:</strong> PloutosLedger Tecnologia</p>
                <p><strong>CNPJ:</strong> 00.000.000/0001-00</p>
                <p><strong>Endereço:</strong> Rua das Tecnologias, 123 - São Paulo/SP</p>
                <p><strong>Telefone:</strong> (11) 99999-9999</p>
                <p><strong>E-mail:</strong> contato@ploutosledger.com</p>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-8 print:border print:p-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center print:text-lg">DADOS DA NOTA FISCAL</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-700 font-medium">Número da NFE:</span>
                  <span className="font-bold text-lg">{nota.numeroNfe}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-700 font-medium">Data de Emissão:</span>
                  <span className="font-semibold">{formatDate(nota.dataEntrada)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-700 font-medium">Data de Fabricação:</span>
                  <span className="font-semibold">{formatDate(nota.fabricacao)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-700 font-medium">Status da Nota:</span>
                  <span className={`font-bold flex items-center gap-1 ${getStatusColor(nota.status)}`}>
                    {getStatusIcon(nota.status)}
                    {getStatusText(nota.status)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-700 font-medium">Valor Total da Nota:</span>
                  <span className="font-bold text-xl text-green-600">
                    {formatCurrency(nota.total)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-700 font-medium">Total de Parcelas:</span>
                  <span className="font-bold text-lg">{nota.totalParcelas}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-700 font-medium">Valor por Parcela:</span>
                  <span className="font-bold text-lg text-blue-600">
                    {formatCurrency(nota.valorParcela)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-700 font-medium">Data de Criação:</span>
                  <span className="font-semibold">{formatDate(nota.dataCriacao)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parcelas Details */}
          {nota.parcelas && nota.parcelas.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg">DETALHAMENTO DAS PARCELAS</h3>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden print:border">
                <table className="w-full">
                  <thead className="bg-gray-50 print:bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 print:px-2 print:py-2">Parcela</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 print:px-2 print:py-2">Valor</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 print:px-2 print:py-2">Vencimento</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 print:px-2 print:py-2">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 print:px-2 print:py-2">Data Pagamento</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 print:px-2 print:py-2">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {nota.parcelas.map((parcela) => (
                      <tr key={parcela.id} className="hover:bg-gray-50 print:hover:bg-transparent">
                        <td className="px-4 py-3 text-sm text-gray-900 print:px-2 print:py-2">
                          {parcela.numeroParcela}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 print:px-2 print:py-2">
                          {formatCurrency(parcela.valor)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 print:px-2 print:py-2">
                          {formatDate(parcela.dataVencimento)}
                        </td>
                        <td className="px-4 py-3 text-sm print:px-2 print:py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            parcela.status === 'paga' ? 'bg-green-100 text-green-800' :
                            parcela.status === 'vencida' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {parcela.status === 'paga' && <CheckCircle className="h-3 w-3" />}
                            {parcela.status === 'vencida' && <AlertCircle className="h-3 w-3" />}
                            {parcela.status === 'pendente' && <Clock className="h-3 w-3" />}
                            {parcela.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 print:px-2 print:py-2">
                          {parcela.dataPagamento ? formatDate(parcela.dataPagamento) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 print:px-2 print:py-2">
                          {parcela.observacoes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financial Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 print:bg-gray-100 print:p-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg">RESUMO FINANCEIRO</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-green-600 print:text-lg">{formatCurrency(nota.total)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Parcelas</p>
                <p className="text-2xl font-bold text-blue-600 print:text-lg">{nota.totalParcelas}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Valor Médio</p>
                <p className="text-2xl font-bold text-purple-600 print:text-lg">{formatCurrency(nota.valorParcela)}</p>
              </div>
              {nota.parcelas && nota.parcelas.length > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Pagas</p>
                  <p className="text-2xl font-bold text-green-600 print:text-lg">
                    {nota.parcelas.filter(p => p.status === 'paga').length}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Observations */}
          {nota.observacoes && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-8 print:bg-gray-100 print:p-3">
              <h3 className="font-semibold text-gray-900 mb-2 print:text-sm">OBSERVAÇÕES</h3>
              <p className="text-gray-700 print:text-sm">{nota.observacoes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 print:text-xs">
            <p>Documento gerado automaticamente pelo sistema PloutosLedger</p>
            <p>Data de geração: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 p-6 flex gap-4 justify-end print:hidden">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Exportar PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="h-5 w-5" />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}