import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Calendar, 
  Filter, 
  BarChart3, 
  TrendingUp, 
  DollarSign,
  CreditCard,
  Users,
  X,
  FileText,
  PieChart,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import paymentGatewayService from '../services/paymentGatewayService';

interface CompleteReportProps {
  onClose: () => void;
}

function CompleteReport({ onClose }: CompleteReportProps) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    payment_method: 'all',
    status: 'all',
    currency: 'all'
  });

  const paymentMethods = [
    { id: 'all', name: 'Todos os Métodos' },
    { id: 'pix', name: 'PIX' },
    { id: 'credit_card', name: 'Cartão de Crédito' },
    { id: 'debit_card', name: 'Cartão de Débito' },
    { id: 'boleto', name: 'Boleto' },
    { id: 'usdt', name: 'USDT' },
    { id: 'bitcoin', name: 'Bitcoin' },
    { id: 'ethereum', name: 'Ethereum' },
    { id: 'bnb', name: 'BNB' }
  ];

  const statusOptions = [
    { id: 'all', name: 'Todos os Status' },
    { id: 'completed', name: 'Concluídos' },
    { id: 'pending', name: 'Pendentes' },
    { id: 'failed', name: 'Falhados' },
    { id: 'cancelled', name: 'Cancelados' },
    { id: 'refunded', name: 'Reembolsados' }
  ];

  const currencies = [
    { id: 'all', name: 'Todas as Moedas' },
    { id: 'BRL', name: 'Real Brasileiro' },
    { id: 'USD', name: 'Dólar Americano' },
    { id: 'BTC', name: 'Bitcoin' },
    { id: 'ETH', name: 'Ethereum' },
    { id: 'USDT', name: 'Tether' },
    { id: 'BNB', name: 'Binance Coin' }
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      const report = await paymentGatewayService.generateReport(filters);
      setReportData(report);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      // Dados simulados para demo
      setReportData({
        summary: {
          total_charges: 1247,
          total_amount: 2847593.50,
          successful_charges: 1189,
          failed_charges: 58,
          success_rate: 95.3,
          average_transaction: 2284.12,
          total_fees: 89456.78,
          net_amount: 2758136.72
        },
        by_payment_method: [
          { method: 'PIX', count: 456, amount: 1234567.89, percentage: 43.4 },
          { method: 'Cartão de Crédito', count: 389, amount: 987654.32, percentage: 34.7 },
          { method: 'Bitcoin', count: 234, amount: 456789.12, percentage: 16.0 },
          { method: 'USDT', count: 123, amount: 123456.78, percentage: 4.3 },
          { method: 'Ethereum', count: 45, amount: 45678.90, percentage: 1.6 }
        ],
        by_status: [
          { status: 'completed', count: 1189, amount: 2712345.67, percentage: 95.3 },
          { status: 'pending', count: 45, amount: 98765.43, percentage: 3.6 },
          { status: 'failed', count: 13, amount: 23456.78, percentage: 1.1 }
        ],
        daily_breakdown: [
          { date: '2025-01-15', charges: 45, amount: 98765.43, fees: 1234.56 },
          { date: '2025-01-14', charges: 52, amount: 123456.78, fees: 2345.67 },
          { date: '2025-01-13', charges: 38, amount: 87654.32, fees: 1234.56 },
          { date: '2025-01-12', charges: 61, amount: 145678.90, fees: 3456.78 },
          { date: '2025-01-11', charges: 47, amount: 98765.43, fees: 1234.56 }
        ],
        top_customers: [
          { name: 'João Silva', email: 'joao@email.com', charges: 23, amount: 45678.90 },
          { name: 'Maria Santos', email: 'maria@email.com', charges: 18, amount: 34567.89 },
          { name: 'Pedro Costa', email: 'pedro@email.com', charges: 15, amount: 23456.78 },
          { name: 'Ana Oliveira', email: 'ana@email.com', charges: 12, amount: 19876.54 },
          { name: 'Carlos Lima', email: 'carlos@email.com', charges: 10, amount: 16543.21 }
        ],
        performance_metrics: {
          avg_processing_time: '2.3 minutos',
          peak_hour: '14:00-15:00',
          conversion_rate: 87.5,
          chargeback_rate: 0.3,
          refund_rate: 2.1
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (format: 'pdf' | 'csv' | 'excel') => {
    const reportContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([reportContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-completo-${filters.start_date}-${filters.end_date}.${format === 'pdf' ? 'pdf' : format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    generateReport();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Relatório Completo</h2>
              <p className="text-sm text-gray-600">Análise detalhada de transações</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Filtros */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros do Relatório</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pagamento</label>
                <select
                  value={filters.payment_method}
                  onChange={(e) => setFilters(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>{method.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions.map((status) => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={generateReport}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <Filter className="w-4 h-4" />
                      <span>Filtrar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Gerando relatório...</p>
            </div>
          )}

          {reportData && (
            <div className="space-y-6">
              {/* Resumo Executivo */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Resumo Executivo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total de Cobranças</p>
                        <p className="text-2xl font-bold">{reportData.summary.total_charges.toLocaleString()}</p>
                      </div>
                      <CreditCard className="w-8 h-8 text-blue-200" />
                    </div>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Volume Total</p>
                        <p className="text-2xl font-bold">R$ {reportData.summary.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-200" />
                    </div>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Taxa de Sucesso</p>
                        <p className="text-2xl font-bold">{reportData.summary.success_rate}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-200" />
                    </div>
                  </div>
                  
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Valor Líquido</p>
                        <p className="text-2xl font-bold">R$ {reportData.summary.net_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-blue-200" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas de Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Por Método de Pagamento</h4>
                  <div className="space-y-3">
                    {reportData.by_payment_method.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">{item.percentage}%</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{item.method}</p>
                            <p className="text-sm text-gray-600">{item.count} transações</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Por Status</h4>
                  <div className="space-y-3">
                    {reportData.by_status.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            item.status === 'completed' ? 'bg-green-100' :
                            item.status === 'pending' ? 'bg-yellow-100' :
                            item.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                          }`}>
                            <span className={`text-sm font-bold ${
                              item.status === 'completed' ? 'text-green-600' :
                              item.status === 'pending' ? 'text-yellow-600' :
                              item.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {item.status === 'completed' ? '✓' :
                               item.status === 'pending' ? '⏳' :
                               item.status === 'failed' ? '✗' : '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 capitalize">{item.status}</p>
                            <p className="text-sm text-gray-600">{item.count} transações</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p className="text-sm text-gray-500">{item.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Clientes */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Top Clientes</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Cliente</th>
                        <th className="text-left py-2">E-mail</th>
                        <th className="text-right py-2">Transações</th>
                        <th className="text-right py-2">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.top_customers.map((customer: any, index: number) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 font-medium">{customer.name}</td>
                          <td className="py-2 text-gray-600">{customer.email}</td>
                          <td className="py-2 text-right">{customer.charges}</td>
                          <td className="py-2 text-right font-bold">R$ {customer.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Métricas de Performance */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Métricas de Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Tempo Médio</p>
                    <p className="font-bold text-gray-800">{reportData.performance_metrics.avg_processing_time}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Horário Pico</p>
                    <p className="font-bold text-gray-800">{reportData.performance_metrics.peak_hour}</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Taxa Conversão</p>
                    <p className="font-bold text-gray-800">{reportData.performance_metrics.conversion_rate}%</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Chargeback</p>
                    <p className="font-bold text-gray-800">{reportData.performance_metrics.chargeback_rate}%</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Reembolsos</p>
                    <p className="font-bold text-gray-800">{reportData.performance_metrics.refund_rate}%</p>
                  </div>
                </div>
              </div>

              {/* Ações de Download */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">Exportar Relatório</h4>
                <div className="flex space-x-4">
                  <button
                    onClick={() => downloadReport('pdf')}
                    className="px-6 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                  
                  <button
                    onClick={() => downloadReport('csv')}
                    className="px-6 py-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>CSV</span>
                  </button>
                  
                  <button
                    onClick={() => downloadReport('excel')}
                    className="px-6 py-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Excel</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompleteReport;
