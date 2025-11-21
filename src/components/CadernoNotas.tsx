import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Printer, 
  FileText, 
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Save,
  X,
  Eye,
  Download,
  ArrowLeft
} from 'lucide-react';
import { NotaFiscal, CadernoNotasData, ParcelaNotaFiscal } from '../types';
import { formatCurrency } from '../utils/currency';
import { useCadernoNotas } from '../hooks/useCadernoNotas';
import ConfirmDialog from './ConfirmDialog';
import Notification from './Notification';
import ParcelasManager from './ParcelasManager';
import NotaFiscalReport from './NotaFiscalReport';
import { auditService } from '../services/auditService';
import { syncService } from '../services/syncService';

interface CadernoNotasProps {
  onBackToLanding?: () => void;
}

export default function CadernoNotas({ onBackToLanding }: CadernoNotasProps) {
  // Componente já está sendo chamado do dashboard autenticado, não precisa verificar novamente
  
  const {
    notas,
    filteredNotas,
    stats,
    searchTerm,
    filterStatus,
    setSearchTerm,
    setFilterStatus,
    addNota,
    updateNota,
    deleteNota,
    changeStatus
  } = useCadernoNotas();

  const [showModal, setShowModal] = useState(false);
  const [editingNota, setEditingNota] = useState<NotaFiscal | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notaToDelete, setNotaToDelete] = useState<NotaFiscal | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  // Estado do formulário
  const [formData, setFormData] = useState({
    dataEntrada: '',
    fabricacao: '',
    numeroNfe: '',
    vencimento: '',
    total: '',
    totalParcelas: '',
    valorParcela: '',
    observacoes: ''
  });

  // Estado para parcelas
  const [parcelas, setParcelas] = useState<ParcelaNotaFiscal[]>([]);
  const [showParcelasManager, setShowParcelasManager] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [notaForReport, setNotaForReport] = useState<NotaFiscal | null>(null);


  // Abrir modal para nova nota
  const handleNewNota = () => {
    setEditingNota(null);
    setFormData({
      dataEntrada: new Date().toISOString().split('T')[0],
      fabricacao: '',
      numeroNfe: '',
      vencimento: '',
      total: '',
      totalParcelas: '',
      valorParcela: '',
      observacoes: ''
    });
    setParcelas([]);
    setShowModal(true);
  };

  // Abrir modal para editar nota
  const handleEditNota = (nota: NotaFiscal) => {
    setEditingNota(nota);
    setFormData({
      dataEntrada: nota.dataEntrada,
      fabricacao: nota.fabricacao,
      numeroNfe: nota.numeroNfe,
      vencimento: nota.vencimento || '',
      total: nota.total.toString(),
      totalParcelas: nota.totalParcelas?.toString() || '',
      valorParcela: nota.valorParcela?.toString() || '',
      observacoes: nota.observacoes || ''
    });
    setParcelas(nota.parcelas || []);
    setShowModal(true);
  };

  // Salvar nota
  // Função para atualizar status das parcelas automaticamente
  const updateParcelasStatus = (parcelas: ParcelaNotaFiscal[]) => {
    const hoje = new Date();
    return parcelas.map(parcela => {
      const vencimento = new Date(parcela.dataVencimento);
      if (parcela.status === 'pendente' && vencimento < hoje) {
        return { ...parcela, status: 'vencida' as const };
      }
      return parcela;
    });
  };

  // Função para determinar status da nota baseado nas parcelas
  const determineNotaStatus = (parcelas: ParcelaNotaFiscal[]) => {
    if (parcelas.length === 0) return 'ativa';
    
    const parcelasPagas = parcelas.filter(p => p.status === 'paga').length;
    const parcelasVencidas = parcelas.filter(p => p.status === 'vencida').length;
    
    if (parcelasPagas === parcelas.length) {
      return 'quitada';
    } else if (parcelasPagas > 0) {
      return 'parcialmente_paga';
    } else if (parcelasVencidas > 0) {
      return 'vencida';
    }
    
    return 'ativa';
  };

  const handleSaveNota = () => {
    if (!formData.dataEntrada || !formData.fabricacao || !formData.numeroNfe || !formData.total) {
      setNotification({ type: 'error', message: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    const totalValue = parseFloat(formData.total);
    if (isNaN(totalValue) || totalValue <= 0) {
      setNotification({ type: 'error', message: 'Por favor, insira um valor válido.' });
      return;
    }

    const totalParcelasValue = parseInt(formData.totalParcelas) || 1;
    const valorParcelaValue = parseFloat(formData.valorParcela) || (totalValue / totalParcelasValue);

    // Atualizar status das parcelas automaticamente
    const parcelasAtualizadas = updateParcelasStatus(parcelas);
    
    // Determinar status da nota baseado nas parcelas atualizadas
    const status = determineNotaStatus(parcelasAtualizadas);

    const notaData = {
      dataEntrada: formData.dataEntrada,
      fabricacao: formData.fabricacao,
      numeroNfe: formData.numeroNfe,
      vencimento: formData.vencimento,
      total: totalValue,
      totalParcelas: totalParcelasValue,
      valorParcela: valorParcelaValue,
      parcelas: parcelasAtualizadas,
      status,
      observacoes: formData.observacoes
    };

    if (editingNota) {
      updateNota(editingNota.id, notaData);
      // Log de auditoria para atualização
      auditService.logAction(
        'user_' + Date.now(), // Simulação de ID do usuário
        'Usuário', // Simulação de nome do usuário
        'ATUALIZAR_NOTA_FISCAL',
        'nota_fiscal',
        editingNota.id,
        editingNota,
        notaData,
        `Nota fiscal ${nota.numeroNfe} atualizada com ${parcelasAtualizadas.length} parcelas`
      );
    } else {
      addNota(notaData);
      // Log de auditoria para criação
      auditService.logAction(
        'user_' + Date.now(), // Simulação de ID do usuário
        'Usuário', // Simulação de nome do usuário
        'CRIAR_NOTA_FISCAL',
        'nota_fiscal',
        notaData.numeroNfe,
        null,
        notaData,
        `Nova nota fiscal ${nota.numeroNfe} criada com ${parcelasAtualizadas.length} parcelas`
      );
    }

    // Atualizar estado local das parcelas se houve mudanças
    if (parcelasAtualizadas !== parcelas) {
      setParcelas(parcelasAtualizadas);
    }

    setShowModal(false);
    setNotification({ 
      type: 'success', 
      message: editingNota ? 'Nota fiscal atualizada com sucesso!' : 'Nota fiscal adicionada com sucesso!' 
    });
  };

  // Confirmar exclusão
  const handleDeleteNota = (nota: NotaFiscal) => {
    setNotaToDelete(nota);
    setShowDeleteDialog(true);
  };

  // Gerar relatório
  const handleGenerateReport = (nota: NotaFiscal) => {
    setNotaForReport(nota);
    setShowReport(true);
  };

  // Executar exclusão
  const confirmDelete = () => {
    if (notaToDelete) {
      deleteNota(notaToDelete.id);
      setShowDeleteDialog(false);
      setNotaToDelete(null);
      setNotification({ type: 'success', message: 'Nota fiscal excluída com sucesso!' });
    }
  };

  // Alterar status da nota
  const handleStatusChange = (nota: NotaFiscal, newStatus: 'ativa' | 'vencida' | 'quitada') => {
    changeStatus(nota.id, newStatus);
    setNotification({ type: 'success', message: 'Status da nota atualizado com sucesso!' });
  };

  // Função para logout
  const handleLogout = () => {
    localStorage.removeItem('cadernoAuthenticated');
    if (onBackToLanding) {
      onBackToLanding();
    }
  };

  // Imprimir relatório
  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Relatório Caderno de Notas - PloutosLedger</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #1f2937; margin: 0; }
            .header p { color: #6b7280; margin: 5px 0; }
            .stats { display: flex; justify-content: space-around; margin-bottom: 30px; background: #f3f4f6; padding: 20px; border-radius: 8px; }
            .stat { text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
            .stat-label { color: #6b7280; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 12px; text-align: left; vertical-align: top; line-height: 1.35; }
            th { background: #f9fafb; font-weight: bold; }
            .status-ativa { color: #059669; font-weight: bold; }
            .status-vencida { color: #dc2626; font-weight: bold; }
            .status-quitada { color: #6b7280; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PloutosLedger</h1>
            <p>Caderno de Notas Fiscais</p>
            <p>Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${stats.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              <div class="stat-label">Valor Total</div>
            </div>
            <div class="stat">
              <div class="stat-value">${stats.ativas}</div>
              <div class="stat-label">Notas Ativas</div>
            </div>
            <div class="stat">
              <div class="stat-value">${stats.vencidas}</div>
              <div class="stat-label">Notas Vencidas</div>
            </div>
            <div class="stat">
              <div class="stat-value">${stats.quitadas}</div>
              <div class="stat-label">Notas Quitadas</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Data Entrada</th>
                <th>Fabricação</th>
                <th>N° NFE</th>
                <th>Vencimento</th>
                <th>Total</th>
                <th>Status</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${filteredNotas.map(nota => `
                <tr>
                  <td>${new Date(nota.dataEntrada).toLocaleDateString('pt-BR')}</td>
                  <td>${nota.fabricacao}</td>
                  <td>${nota.numeroNfe}</td>
                  <td>${(() => {
                    if (nota.parcelas && nota.parcelas.length > 0) {
                      return nota.parcelas
                        .map(p => `<div>${new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</div>`)
                        .join('');
                    }
                    // Gerar datas quando não houver parcelas salvas mas houver parcelamento
                    if ((nota.totalParcelas || 0) > 1 && nota.vencimento) {
                      const first = new Date(nota.vencimento as any);
                      const parts: string[] = [];
                      for (let i = 0; i < (nota.totalParcelas || 0); i++) {
                        const d = new Date(first);
                        d.setMonth(d.getMonth() + i);
                        parts.push(`<div>${d.toLocaleDateString('pt-BR')}</div>`);
                      }
                      return parts.join('');
                    }
                    return nota.vencimento ? new Date(nota.vencimento as any).toLocaleDateString('pt-BR') : '-';
                  })()}</td>
                  <td>${(() => {
                    if (nota.parcelas && nota.parcelas.length > 0) {
                      return nota.parcelas
                        .map(p => `<div>${formatCurrency(p.valor)}</div>`)
                        .join('');
                    }
                    if ((nota.totalParcelas || 0) > 1) {
                      const valorParcela = (nota.valorParcela && nota.valorParcela > 0)
                        ? nota.valorParcela
                        : (nota.total / (nota.totalParcelas || 1));
                      return new Array(nota.totalParcelas).fill(0)
                        .map(() => `<div>${formatCurrency(valorParcela)}</div>`)
                        .join('');
                    }
                    return formatCurrency(nota.total);
                  })()}</td>
                  <td class="status-${nota.status}">${nota.status.toUpperCase()}</td>
                  <td>${nota.observacoes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>© 2025 Webyte Desenvolvimentos. Todos os direitos reservados.</p>
            <p>PloutosLedger - A riqueza começa com controle.</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Exportar dados
  const handleExport = () => {
    const csvContent = [
      ['Data Entrada', 'Fabricação', 'N° NFE', 'Vencimento', 'Total', 'Status', 'Observações'].join(','),
      ...filteredNotas.map(nota => [
        new Date(nota.dataEntrada).toLocaleDateString('pt-BR'),
        nota.fabricacao,
        nota.numeroNfe,
        new Date(nota.vencimento).toLocaleDateString('pt-BR'),
        nota.total.toString().replace('.', ','),
        nota.status,
        nota.observacoes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `caderno_notas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setNotification({ type: 'success', message: 'Dados exportados com sucesso!' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {onBackToLanding && (
                <button
                  onClick={onBackToLanding}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Caderno de Notas</h1>
                <p className="text-gray-600">Controle completo de notas fiscais e parcelamentos</p>
              </div>
            </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </button>
              <button
                onClick={handleNewNota}
                className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Nota
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                title="Sair do Caderno de Notas"
              >
                <X className="w-4 h-4 mr-2" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Notas</p>
                <p className="text-2xl font-bold text-gray-900">{notas.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-green-600">{stats.ativas}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{stats.vencidas}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quitadas</p>
                <p className="text-2xl font-bold text-gray-600">{stats.quitadas}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por fabricação ou número da NFE..."
                  defaultValue={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos</option>
                <option value="ativa">Ativas</option>
                <option value="vencida">Vencidas</option>
                <option value="quitada">Quitadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela de Notas */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Entrada
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fabricação
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° NFE
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredNotas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg">Nenhuma nota fiscal encontrada</p>
                      <p className="text-sm">Clique em "Nova Nota" para adicionar a primeira nota</p>
                    </td>
                  </tr>
                ) : (
                  filteredNotas.map((nota) => (
                    <tr key={nota.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(nota.dataEntrada).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {nota.fabricacao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {nota.numeroNfe}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(nota.vencimento).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(nota.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={nota.status}
                          onChange={(e) => handleStatusChange(nota, e.target.value as any)}
                          className={`text-sm font-medium rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-blue-500 ${
                            nota.status === 'ativa' ? 'bg-green-100 text-green-800' :
                            nota.status === 'vencida' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="ativa">Ativa</option>
                          <option value="vencida">Vencida</option>
                          <option value="quitada">Quitada</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleGenerateReport(nota)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                            title="Gerar Relatório"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditNota(nota)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNota(nota)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Nota */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingNota ? 'Editar Nota Fiscal' : 'Nova Nota Fiscal'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Entrada *
                  </label>
                  <input
                    type="date"
                    value={formData.dataEntrada}
                    onChange={(e) => setFormData({ ...formData, dataEntrada: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fabricação *
                  </label>
                  <input
                    type="text"
                    value={formData.fabricacao}
                    onChange={(e) => setFormData({ ...formData, fabricacao: e.target.value })}
                    placeholder="Nome da empresa/fabricação"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° da NFE *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroNfe}
                    onChange={(e) => setFormData({ ...formData, numeroNfe: e.target.value })}
                    placeholder="Número da Nota Fiscal"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vencimento *
                  </label>
                  <input
                    type="date"
                    value={formData.vencimento}
                    onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Total *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total}
                    onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                    placeholder="0,00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
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
                    onChange={(e) => {
                      const parcelas = parseInt(e.target.value) || 1;
                      const total = parseFloat(formData.total) || 0;
                      const valorParcela = total / parcelas;
                      setFormData({ 
                        ...formData, 
                        totalParcelas: e.target.value,
                        valorParcela: valorParcela.toString()
                      });
                    }}
                    placeholder="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor por Parcela
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.valorParcela}
                    onChange={(e) => setFormData({ ...formData, valorParcela: e.target.value })}
                    placeholder="0,00"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={() => setShowParcelasManager(true)}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <DollarSign className="h-5 w-5" />
                    Gerenciar Parcelas
                  </button>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações adicionais (opcional)"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNota}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingNota ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir a nota fiscal ${notaToDelete?.numeroNfe}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Modal do Gerenciador de Parcelas */}
      {showParcelasManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Gerenciar Parcelas da Nota Fiscal
              </h2>
              <button
                onClick={() => setShowParcelasManager(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <ParcelasManager
                total={parseFloat(formData.total) || 0}
                totalParcelas={parseInt(formData.totalParcelas) || 1}
                valorParcela={parseFloat(formData.valorParcela) || 0}
                parcelas={parcelas}
                onParcelasChange={setParcelas}
                onTotalParcelasChange={(totalParcelas) => {
                  setFormData(prev => ({ ...prev, totalParcelas: totalParcelas.toString() }));
                }}
                onValorParcelaChange={(valorParcela) => {
                  setFormData(prev => ({ ...prev, valorParcela: valorParcela.toString() }));
                }}
              />
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowParcelasManager(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Relatório */}
      {showReport && notaForReport && (
        <NotaFiscalReport
          nota={notaForReport}
          onClose={() => {
            setShowReport(false);
            setNotaForReport(null);
          }}
        />
      )}

      {/* Notificação */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

