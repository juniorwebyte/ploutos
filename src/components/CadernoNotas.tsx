import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Package
} from 'lucide-react';
import { NotaFiscal, CadernoNotasData, ParcelaNotaFiscal } from '../types';
import { formatCurrency, parseCurrency, formatCurrencyInput } from '../utils/currency';
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

  // Função para formatar valor de entrada
  const formatInputValue = (value: number | string) => {
    if (!value || value === '' || value === '0') return '';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue === 0) return '';
    return formatCurrency(numValue);
  };

  // Função para lidar com entrada de moeda
  const handleCurrencyInput = (field: 'total' | 'valorParcela', value: string) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    if (numbers === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    
    // Converte para centavos
    const cents = parseInt(numbers);
    
    // Converte para reais
    const reais = cents / 100;
    
    // Atualiza o estado com o valor numérico
    setFormData(prev => ({ ...prev, [field]: reais.toString() }));
    
    // Se for o campo total e houver parcelas, recalcula o valor da parcela
    if (field === 'total' && formData.totalParcelas) {
      const totalParcelas = parseInt(formData.totalParcelas) || 1;
      const valorParcela = reais / totalParcelas;
      setFormData(prev => ({ ...prev, valorParcela: valorParcela.toString() }));
    }
  };
  const [sortBy, setSortBy] = useState<'dataEntrada' | 'vencimento' | 'total' | 'fabricacao'>('dataEntrada');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [expandedNotas, setExpandedNotas] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintDateModal, setShowPrintDateModal] = useState(false);
  const [printDate, setPrintDate] = useState('');
  const [showPaymentConfirmDialog, setShowPaymentConfirmDialog] = useState(false);
  const [itemToPay, setItemToPay] = useState<{
    type: 'nota' | 'parcela';
    notaId: string;
    parcelaId?: string;
    valor: number;
    vencimento: string;
    descricao: string;
  } | null>(null);
  const checkedVencimentosRef = useRef<Set<string>>(new Set());

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N para nova nota
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !showModal) {
        e.preventDefault();
        handleNewNota();
      }
      // ESC para fechar modais
      if (e.key === 'Escape') {
        if (showModal) setShowModal(false);
        if (showParcelasManager) setShowParcelasManager(false);
        if (showPrintDateModal) setShowPrintDateModal(false);
        if (showReport) setShowReport(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, showParcelasManager, showPrintDateModal, showReport]);

  // Função para ordenar e filtrar notas
  const sortedAndFilteredNotas = React.useMemo(() => {
    let result = [...filteredNotas];

    // Filtro por data
    if (filterDateStart) {
      const startDate = new Date(filterDateStart);
      startDate.setHours(0, 0, 0, 0);
      result = result.filter(nota => {
        const notaDate = new Date(nota.dataEntrada);
        notaDate.setHours(0, 0, 0, 0);
        return notaDate >= startDate;
      });
    }

    if (filterDateEnd) {
      const endDate = new Date(filterDateEnd);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(nota => {
        const notaDate = new Date(nota.dataEntrada);
        notaDate.setHours(0, 0, 0, 0);
        return notaDate <= endDate;
      });
    }

    // Ordenação
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'dataEntrada':
          aValue = new Date(a.dataEntrada).getTime();
          bValue = new Date(b.dataEntrada).getTime();
          break;
        case 'vencimento':
          // Para vencimento, usar a primeira parcela pendente ou vencimento da nota
          if (a.parcelas && a.parcelas.length > 0) {
            const aParcela = a.parcelas
              .filter(p => p.status === 'pendente' || p.status === 'vencida')
              .sort((p1, p2) => new Date(p1.dataVencimento).getTime() - new Date(p2.dataVencimento).getTime())[0];
            aValue = aParcela ? new Date(aParcela.dataVencimento).getTime() : 0;
          } else {
          aValue = a.vencimento ? new Date(a.vencimento).getTime() : 0;
          }
          if (b.parcelas && b.parcelas.length > 0) {
            const bParcela = b.parcelas
              .filter(p => p.status === 'pendente' || p.status === 'vencida')
              .sort((p1, p2) => new Date(p1.dataVencimento).getTime() - new Date(p2.dataVencimento).getTime())[0];
            bValue = bParcela ? new Date(bParcela.dataVencimento).getTime() : 0;
          } else {
          bValue = b.vencimento ? new Date(b.vencimento).getTime() : 0;
          }
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'fabricacao':
          aValue = a.fabricacao.toLowerCase();
          bValue = b.fabricacao.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [filteredNotas, sortBy, sortOrder, filterDateStart, filterDateEnd]);

  // Função para alternar expansão de parcelas
  const toggleParcelas = (notaId: string) => {
    setExpandedNotas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notaId)) {
        newSet.delete(notaId);
      } else {
        newSet.add(notaId);
      }
      return newSet;
    });
  };


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
    // Garantir que parcelas seja sempre um array
    const parcelasNota = Array.isArray(nota.parcelas) ? nota.parcelas : [];
    setParcelas(parcelasNota);
    setShowModal(true);
  };

  // Salvar nota
  // Função para atualizar status das parcelas automaticamente
  const updateParcelasStatus = (parcelas: ParcelaNotaFiscal[]) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return parcelas.map(parcela => {
      const vencimento = new Date(parcela.dataVencimento);
      vencimento.setHours(0, 0, 0, 0);
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

  // Verificar vencimentos e perguntar sobre pagamento
  useEffect(() => {
    if (showPaymentConfirmDialog || itemToPay || notas.length === 0) return;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Aguardar um pouco antes de verificar para não sobrecarregar
    const timer = setTimeout(() => {
      // Verificar se há itens vencidos para perguntar sobre pagamento
      for (const nota of notas) {
        const parcelas = nota.parcelas || [];
        const itemKey = parcelas.length > 0 
          ? `nota_${nota.id}_parcelas`
          : `nota_${nota.id}`;
        
        // Se já verificamos este item, pular
        if (checkedVencimentosRef.current.has(itemKey)) continue;
        
        if (parcelas.length > 0) {
          // Verificar cada parcela vencida
          for (const parcela of parcelas) {
            const vencimento = new Date(parcela.dataVencimento);
            vencimento.setHours(0, 0, 0, 0);
            
            // Se está vencida e não foi paga, perguntar
            if (vencimento < hoje && parcela.status !== 'paga') {
              const parcelaKey = `parcela_${parcela.id}`;
              if (checkedVencimentosRef.current.has(parcelaKey)) continue;
              
              checkedVencimentosRef.current.add(parcelaKey);
              
              // Primeiro atualizar status para vencida se ainda está pendente
              if (parcela.status === 'pendente') {
                const parcelasAtualizadas = nota.parcelas.map(p => 
                  p.id === parcela.id 
                    ? { ...p, status: 'vencida' as const }
                    : p
                );
                const novoStatus = determineNotaStatus(parcelasAtualizadas);
                updateNota(nota.id, {
                  parcelas: parcelasAtualizadas,
                  status: novoStatus as 'ativa' | 'vencida' | 'quitada' | 'parcialmente_paga'
                });
              }
              
              // Perguntar sobre pagamento
              setItemToPay({
                type: 'parcela',
                notaId: nota.id,
                parcelaId: parcela.id,
                valor: parcela.valor,
                vencimento: parcela.dataVencimento,
                descricao: `Parcela ${parcela.numeroParcela} da nota ${nota.numeroNfe} - ${nota.fabricacao}`
              });
              setShowPaymentConfirmDialog(true);
              return; // Retorna após encontrar o primeiro item vencido
            }
          }
        } else if (nota.vencimento) {
          // Se não tem parcelas, verificar vencimento da nota
          const vencimento = new Date(nota.vencimento);
          vencimento.setHours(0, 0, 0, 0);
          
          // Se está vencida e não está quitada, perguntar
          if (vencimento < hoje && nota.status !== 'quitada') {
            checkedVencimentosRef.current.add(itemKey);
            
            // Atualizar status para vencida se ainda está ativa
            if (nota.status === 'ativa') {
              updateNota(nota.id, { status: 'vencida' });
            }
            
            // Perguntar sobre pagamento
            setItemToPay({
              type: 'nota',
              notaId: nota.id,
              valor: nota.total,
              vencimento: nota.vencimento,
              descricao: `Nota ${nota.numeroNfe} - ${nota.fabricacao}`
            });
            setShowPaymentConfirmDialog(true);
            return; // Retorna após encontrar o primeiro item vencido
          }
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [notas, showPaymentConfirmDialog, itemToPay, updateNota, determineNotaStatus]);

  // Confirmar pagamento
  const handleConfirmPayment = () => {
    if (!itemToPay) return;

    const nota = notas.find(n => n.id === itemToPay.notaId);
    if (!nota) return;

    if (itemToPay.type === 'parcela' && itemToPay.parcelaId) {
      // Marcar parcela como paga
      const parcelasAtualizadas = nota.parcelas.map(p => 
        p.id === itemToPay.parcelaId 
          ? { ...p, status: 'paga' as const, dataPagamento: new Date().toISOString().split('T')[0] }
          : p
      );
      
      // Atualizar status da nota
      const novoStatus = determineNotaStatus(parcelasAtualizadas);
      
      updateNota(nota.id, {
        parcelas: parcelasAtualizadas,
        status: novoStatus
      });
      
      setNotification({ 
        type: 'success', 
        message: `Parcela marcada como paga com sucesso!` 
      });
    } else if (itemToPay.type === 'nota') {
      // Marcar nota inteira como quitada
      updateNota(nota.id, {
        status: 'quitada'
      });
      
      setNotification({ 
        type: 'success', 
        message: `Nota fiscal marcada como quitada com sucesso!` 
      });
    }

    setShowPaymentConfirmDialog(false);
    setItemToPay(null);
    
    // Limpar check para permitir nova verificação após atualização
    if (itemToPay.type === 'parcela' && itemToPay.parcelaId) {
      checkedVencimentosRef.current.delete(`parcela_${itemToPay.parcelaId}`);
    } else {
      checkedVencimentosRef.current.delete(`nota_${itemToPay.notaId}`);
    }
  };

  // Função para sincronizar parcelas com totalParcelas
  const syncParcelasWithTotal = (parcelasAtuais: ParcelaNotaFiscal[], totalParcelas: number, total: number, vencimentoBase?: string): ParcelaNotaFiscal[] => {
    const valorParcela = total / totalParcelas;
    const hoje = new Date();
    const vencimentoInicial = vencimentoBase ? new Date(vencimentoBase) : hoje;
    
    // Se não há parcelas ou o número mudou, recriar todas
    if (parcelasAtuais.length === 0 || parcelasAtuais.length !== totalParcelas) {
      const novasParcelas: ParcelaNotaFiscal[] = [];
      
      for (let i = 1; i <= totalParcelas; i++) {
        const dataVencimento = new Date(vencimentoInicial);
        dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));
        
        // Se já existe uma parcela na posição, manter seu status e data de pagamento
        const parcelaExistente = parcelasAtuais.find(p => p.numeroParcela === i);
        
        novasParcelas.push({
          id: parcelaExistente?.id || `parcela_${Date.now()}_${i}`,
          numeroParcela: i,
          valor: valorParcela,
          dataVencimento: parcelaExistente?.dataVencimento || dataVencimento.toISOString().split('T')[0],
          status: parcelaExistente?.status || 'pendente',
          observacoes: parcelaExistente?.observacoes || '',
          dataPagamento: parcelaExistente?.dataPagamento
        });
      }
      
      return novasParcelas;
    }
    
    // Se o número de parcelas é o mesmo, apenas atualizar valores
    return parcelasAtuais.map(p => ({
      ...p,
      valor: valorParcela
    }));
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

    // Validar NFE duplicado (exceto se estiver editando a mesma nota)
    const nfeExists = notas.find(n => 
      n.numeroNfe === formData.numeroNfe && 
      (!editingNota || n.id !== editingNota.id)
    );
    if (nfeExists) {
      setNotification({ type: 'error', message: 'Já existe uma nota fiscal com este número de NFE.' });
      return;
    }

    const totalParcelasValue = parseInt(formData.totalParcelas) || 1;
    const valorParcelaValue = parseFloat(formData.valorParcela) || (totalValue / totalParcelasValue);

    // Sincronizar parcelas com totalParcelas antes de atualizar status
    const parcelasSincronizadas = syncParcelasWithTotal(
      parcelas || [], 
      totalParcelasValue, 
      totalValue,
      formData.vencimento || undefined
    );

    // Atualizar status das parcelas automaticamente
    const parcelasAtualizadas = updateParcelasStatus(parcelasSincronizadas);
    
    // Garantir que parcelas seja sempre um array
    const parcelasFinal = Array.isArray(parcelasAtualizadas) ? parcelasAtualizadas : [];
    
    // Determinar status da nota baseado nas parcelas atualizadas
    const status = determineNotaStatus(parcelasFinal) as 'ativa' | 'vencida' | 'quitada' | 'parcialmente_paga';

    const notaData = {
      dataEntrada: formData.dataEntrada,
      fabricacao: formData.fabricacao,
      numeroNfe: formData.numeroNfe,
      vencimento: formData.vencimento,
      total: totalValue,
      totalParcelas: totalParcelasValue,
      valorParcela: valorParcelaValue,
      parcelas: parcelasFinal,
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
        `Nota fiscal ${notaData.numeroNfe} atualizada com ${parcelasFinal.length} parcelas`
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
        `Nova nota fiscal ${notaData.numeroNfe} criada com ${parcelasFinal.length} parcelas`
      );
    }

    // Atualizar estado local das parcelas se houve mudanças
    if (parcelasFinal !== parcelas) {
      setParcelas(parcelasFinal);
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
  const handleStatusChange = (nota: NotaFiscal, newStatus: 'ativa' | 'vencida' | 'quitada' | 'parcialmente_paga') => {
    updateNota(nota.id, { status: newStatus });
    setNotification({ type: 'success', message: 'Status da nota atualizado com sucesso!' });
  };

  // Função para logout
  const handleLogout = () => {
    localStorage.removeItem('cadernoAuthenticated');
    if (onBackToLanding) {
      onBackToLanding();
    }
  };

  // Abrir modal de seleção de data para impressão
  const handleOpenPrintModal = () => {
    setShowPrintDateModal(true);
    setPrintDate('');
  };

  // Imprimir relatório filtrado por data
  const handlePrint = (filterDate?: string) => {
    // Filtrar notas por data se fornecida
    let notasParaImprimir = sortedAndFilteredNotas;
    
    if (filterDate) {
      const selectedDate = new Date(filterDate);
      selectedDate.setHours(0, 0, 0, 0);
      
      notasParaImprimir = notas.filter(nota => {
        const notaDate = new Date(nota.dataEntrada);
        notaDate.setHours(0, 0, 0, 0);
        return notaDate.getTime() === selectedDate.getTime();
      });
    }

    // Calcular estatísticas das notas filtradas
    const statsFiltradas = {
      total: notasParaImprimir.reduce((sum, nota) => sum + nota.total, 0),
      ativas: notasParaImprimir.filter(nota => nota.status === 'ativa').length,
      vencidas: notasParaImprimir.filter(nota => nota.status === 'vencida').length,
      quitadas: notasParaImprimir.filter(nota => nota.status === 'quitada').length,
      parcialmentePagas: notasParaImprimir.filter(nota => nota.status === 'parcialmente_paga').length
    };

    const dataFiltro = filterDate ? new Date(filterDate).toLocaleDateString('pt-BR') : null;

    const printContent = `
      <html>
        <head>
          <title>Relatório Caderno de Notas - PloutosLedger</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { color: #1f2937; margin: 0; font-size: 22px; }
            .header p { color: #6b7280; margin: 3px 0; font-size: 13px; }
            .filter-info { background: #e0f2fe; padding: 8px; border-radius: 8px; margin-bottom: 15px; text-align: center; font-size: 12px; }
            .stats { display: flex; justify-content: space-around; margin-bottom: 20px; background: #f3f4f6; padding: 15px; border-radius: 8px; }
            .stat { text-align: center; }
            .stat-value { font-size: 20px; font-weight: bold; color: #1f2937; }
            .stat-label { color: #6b7280; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; line-height: 1.3; font-size: 13px; }
            th { background: #f9fafb; font-weight: bold; }
            .status-ativa { color: #059669; font-weight: bold; }
            .status-vencida { color: #dc2626; font-weight: bold; }
            .status-quitada { color: #6b7280; font-weight: bold; }
            .status-parcialmente_paga { color: #d97706; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 12px; }
            .footer-logo { max-width: 150px; margin: 15px auto; display: block; }
            .no-data { text-align: center; padding: 40px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PloutosLedger</h1>
            <p>Caderno de Notas Fiscais</p>
            ${dataFiltro ? `<div class="filter-info"><strong>Filtro:</strong> Notas lançadas em ${dataFiltro}</div>` : ''}
            <p>Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${statsFiltradas.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              <div class="stat-label">Valor Total</div>
            </div>
            <div class="stat">
              <div class="stat-value">${notasParaImprimir.length}</div>
              <div class="stat-label">Total de Notas</div>
            </div>
            <div class="stat">
              <div class="stat-value">${statsFiltradas.ativas}</div>
              <div class="stat-label">Notas Ativas</div>
            </div>
            <div class="stat">
              <div class="stat-value">${statsFiltradas.vencidas}</div>
              <div class="stat-label">Notas Vencidas</div>
            </div>
            <div class="stat">
              <div class="stat-value">${statsFiltradas.quitadas}</div>
              <div class="stat-label">Notas Quitadas</div>
            </div>
            ${statsFiltradas.parcialmentePagas > 0 ? `
            <div class="stat">
              <div class="stat-value">${statsFiltradas.parcialmentePagas}</div>
              <div class="stat-label">Parcialmente Pagas</div>
            </div>
            ` : ''}
          </div>
          
          ${notasParaImprimir.length === 0 ? `
            <div class="no-data">
              <p style="font-size: 18px; margin-bottom: 10px;">Nenhuma nota encontrada</p>
              <p>${dataFiltro ? `Não há notas lançadas na data ${dataFiltro}` : 'Não há notas para exibir'}</p>
            </div>
          ` : `
          <table>
            <thead>
              <tr>
                <th>Data Entrada</th>
                <th>Fabricação</th>
                <th>N° NFE</th>
                <th>Vencimento</th>
                <th>Total</th>
                <th>Parcelas</th>
                <th>Status</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${notasParaImprimir.map(nota => {
                const hasParcelas = nota.parcelas && nota.parcelas.length > 0;
                
                // Formatar vencimentos - todas as datas das parcelas
                let vencimentosStr = '';
                if (hasParcelas && nota.parcelas) {
                  const vencimentos = nota.parcelas
                    .map(p => new Date(p.dataVencimento))
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map(d => d.toLocaleDateString('pt-BR'));
                  vencimentosStr = vencimentos.join('<br>');
                } else {
                  vencimentosStr = nota.vencimento ? new Date(nota.vencimento).toLocaleDateString('pt-BR') : '-';
                }
                
                // Formatar parcelas - apenas numeração e valor (sem vencimento, pois já está na coluna Vencimento)
                let parcelasStr = '';
                if (hasParcelas && nota.parcelas) {
                  const parcelasFormatadas = nota.parcelas
                    .sort((a, b) => a.numeroParcela - b.numeroParcela)
                    .map(p => {
                      const valor = formatCurrency(p.valor);
                      return `${p.numeroParcela}: ${valor}`;
                    });
                  parcelasStr = parcelasFormatadas.join('<br>');
                } else {
                  parcelasStr = 'Sem parcelas';
                }
                
                return `
                <tr>
                  <td>${new Date(nota.dataEntrada).toLocaleDateString('pt-BR')}</td>
                  <td>${nota.fabricacao}</td>
                  <td>${nota.numeroNfe}</td>
                  <td>${vencimentosStr}</td>
                  <td>${formatCurrency(nota.total)}</td>
                  <td>${parcelasStr}</td>
                  <td class="status-${nota.status}">${nota.status === 'ativa' ? 'ATIVA' : nota.status === 'vencida' ? 'VENCIDA' : nota.status === 'quitada' ? 'QUITADA' : 'PARCIALMENTE PAGA'}</td>
                  <td>${nota.observacoes || '-'}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
          `}
          
          <div class="footer">
            <img src="/logo_header.png" alt="PloutosLedger" class="footer-logo" onerror="this.style.display='none'" />
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
    
    // Fechar modal se estiver aberto
    if (showPrintDateModal) {
      setShowPrintDateModal(false);
      setPrintDate('');
    }
  };

  // Exportar dados
  const handleExport = () => {
    setIsLoading(true);
    try {
      // Função para escapar CSV
      const escapeCSV = (value: string): string => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

    const headers = ['Data Entrada', 'Fabricação', 'N° NFE', 'Vencimento', 'Total', 'Parcelas', 'Status', 'Observações'];
    const rows: string[] = [];
    
    sortedAndFilteredNotas.forEach(nota => {
      const hasParcelas = nota.parcelas && nota.parcelas.length > 0;
      
      // Formatar vencimentos - todas as datas das parcelas
      let vencimentosStr = '';
      if (hasParcelas && nota.parcelas) {
        const vencimentos = nota.parcelas
          .map(p => new Date(p.dataVencimento))
          .sort((a, b) => a.getTime() - b.getTime())
          .map(d => d.toLocaleDateString('pt-BR'));
        vencimentosStr = vencimentos.join('; ');
      } else {
        vencimentosStr = nota.vencimento ? new Date(nota.vencimento).toLocaleDateString('pt-BR') : '';
      }
      
      // Formatar parcelas - apenas numeração e valor (sem vencimento, pois já está na coluna Vencimento)
      let parcelasStr = '';
      if (hasParcelas && nota.parcelas) {
        const parcelasFormatadas = nota.parcelas
          .sort((a, b) => a.numeroParcela - b.numeroParcela)
          .map(p => {
            const valor = formatCurrency(p.valor);
            return `${p.numeroParcela}: ${valor}`;
          });
        parcelasStr = parcelasFormatadas.join(' | ');
      } else {
        parcelasStr = 'Sem parcelas';
      }
      
      rows.push([
          escapeCSV(new Date(nota.dataEntrada).toLocaleDateString('pt-BR')),
          escapeCSV(nota.fabricacao),
          escapeCSV(nota.numeroNfe),
          escapeCSV(vencimentosStr),
          escapeCSV(nota.total.toFixed(2).replace('.', ',')),
          escapeCSV(parcelasStr),
          escapeCSV(nota.status),
          escapeCSV(nota.observacoes || '')
      ].join(','));
    });
    
      // Adicionar BOM para Excel reconhecer UTF-8
      const BOM = '\uFEFF';
      const csvContent = BOM + [headers.map(escapeCSV).join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `caderno_notas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
      URL.revokeObjectURL(url);
    
    setNotification({ type: 'success', message: 'Dados exportados com sucesso!' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Erro ao exportar dados. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
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
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Caderno de Notas</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Controle completo de notas fiscais e parcelamentos</p>
              </div>
            </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar para CSV"
              >
                <Download className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
              <button
                onClick={handleOpenPrintModal}
                className="flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Imprimir relatório"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={handleNewNota}
                className="flex items-center px-4 sm:px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                title="Nova Nota (Ctrl+N)"
                aria-label="Adicionar nova nota fiscal"
              >
                <Plus className="w-4 h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Nova Nota</span>
                <span className="sm:hidden">Nova</span>
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

      {/* Stats Cards - Compacto */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-lg shadow-md hover:shadow-lg transition-all text-white">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="w-5 h-5 opacity-90" />
              <TrendingUp className="w-4 h-4 opacity-75" />
              </div>
            <p className="text-xs opacity-90 mb-0.5">Valor Total</p>
            <p className="text-lg font-bold truncate">{formatCurrency(stats.total)}</p>
              </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-lg shadow-md hover:shadow-lg transition-all text-white">
            <div className="flex items-center justify-between mb-1">
              <FileText className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-xs opacity-90 mb-0.5">Total Notas</p>
            <p className="text-lg font-bold">{notas.length}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-4 rounded-lg shadow-md hover:shadow-lg transition-all text-white">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="w-5 h-5 opacity-90" />
              </div>
            <p className="text-xs opacity-90 mb-0.5">Ativas</p>
            <p className="text-lg font-bold">{stats.ativas}</p>
              </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 p-4 rounded-lg shadow-md hover:shadow-lg transition-all text-white">
            <div className="flex items-center justify-between mb-1">
              <AlertTriangle className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-xs opacity-90 mb-0.5">Vencidas</p>
            <p className="text-lg font-bold">{stats.vencidas}</p>
            {stats.valorVencido > 0 && (
              <p className="text-[10px] opacity-80 mt-0.5 truncate">{formatCurrency(stats.valorVencido)}</p>
            )}
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 rounded-lg shadow-md hover:shadow-lg transition-all text-white">
            <div className="flex items-center justify-between mb-1">
              <Clock className="w-5 h-5 opacity-90" />
              </div>
            <p className="text-xs opacity-90 mb-0.5">Vencendo</p>
            <p className="text-lg font-bold truncate">{formatCurrency(stats.valorVencendo || 0)}</p>
              </div>

          <div className="bg-gradient-to-br from-gray-500 to-slate-600 p-4 rounded-lg shadow-md hover:shadow-lg transition-all text-white">
            <div className="flex items-center justify-between mb-1">
              <CheckCircle className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-xs opacity-90 mb-0.5">Quitadas</p>
            <p className="text-lg font-bold">{stats.quitadas}</p>
            </div>
          </div>

        {/* Cards de Parcelas - Compacto */}
        {(stats.totalParcelas || 0) > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-1">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">{stats.totalParcelas || 0}</span>
              </div>
              <p className="text-xs text-gray-600">Total Parcelas</p>
              </div>

            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center justify-between mb-1">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span className="text-xl font-bold text-gray-900">{stats.parcelasPendentes || 0}</span>
            </div>
              <p className="text-xs text-gray-600">Pendentes</p>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">{formatCurrency(stats.valorParcelasPendentes || 0)}</p>
          </div>

            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-1">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-xl font-bold text-gray-900">{stats.parcelasVencidas || 0}</span>
              </div>
              <p className="text-xs text-gray-600">Vencidas</p>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">{formatCurrency(stats.valorParcelasVencidas || 0)}</p>
              </div>

            <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-xl font-bold text-gray-900">{stats.parcelasPagas || 0}</span>
            </div>
              <p className="text-xs text-gray-600">Pagas</p>
          </div>
        </div>
        )}

        {/* Filtros e Busca - Compacto */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <div className="space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por fabricação ou número da NFE..."
                    value={searchTerm}
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
                  <option value="parcialmente_paga">Parcialmente Pagas</option>
              </select>
            </div>
            </div>

            {/* Filtros por Data e Ordenação - Compacto */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-3 border-t border-gray-200">
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Data Início</label>
                <input
                  type="date"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Data Fim</label>
                <input
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="dataEntrada">Data Entrada</option>
                  <option value="vencimento">Vencimento</option>
                  <option value="total">Valor Total</option>
                  <option value="fabricacao">Fabricação</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Ordem</label>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
                >
                  {sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  <span className="hidden sm:inline">{sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}</span>
                </button>
              </div>
            </div>

            {/* Botão para limpar filtros */}
            {(filterDateStart || filterDateEnd) && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFilterDateStart('');
                    setFilterDateEnd('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros de Data
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabela de Notas - Compacta */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Fabricação
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    NFE
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Parcelas
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAndFilteredNotas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm font-medium">Nenhuma nota fiscal encontrada</p>
                      <p className="text-xs text-gray-400 mt-1">Clique em "Nova Nota" para adicionar</p>
                    </td>
                  </tr>
                ) : (
                  sortedAndFilteredNotas.map((nota) => {
                    // Garantir que parcelas seja sempre um array
                    const parcelas = nota.parcelas || [];
                    const hasParcelas = parcelas.length > 0;
                    const isExpanded = expandedNotas.has(nota.id);
                    const parcelasPendentes = parcelas.filter(p => p.status === 'pendente').length;
                    const parcelasVencidas = parcelas.filter(p => p.status === 'vencida').length;
                    const parcelasPagas = parcelas.filter(p => p.status === 'paga').length;
                    
                    // Calcular próximo vencimento
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    let proximoVencimento: Date | null = null;
                    if (hasParcelas) {
                      const pendentes = parcelas.filter(p => p.status === 'pendente' || p.status === 'vencida')
                        .map(p => new Date(p.dataVencimento))
                        .sort((a, b) => a.getTime() - b.getTime());
                      proximoVencimento = pendentes && pendentes.length > 0 ? pendentes[0] : null;
                    } else if (nota.vencimento) {
                      proximoVencimento = new Date(nota.vencimento);
                    }

                    return (
                      <React.Fragment key={nota.id}>
                        <tr className={`hover:bg-gray-50 transition-colors ${nota.status === 'vencida' ? 'bg-red-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                        {new Date(nota.dataEntrada).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 max-w-[120px] truncate" title={nota.fabricacao}>
                        {nota.fabricacao}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {nota.numeroNfe}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {hasParcelas ? (
                          <div className="space-y-1">
                            {parcelas
                              .sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime())
                              .map((parcela, idx) => (
                                <div key={parcela.id || idx} className="text-xs">
                                  {new Date(parcela.dataVencimento).toLocaleDateString('pt-BR')}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <span>{nota.vencimento ? new Date(nota.vencimento).toLocaleDateString('pt-BR') : '-'}</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                        {formatCurrency(nota.total)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900">
                        {hasParcelas ? (
                          <div className="space-y-0.5">
                            {parcelas
                              .sort((a, b) => a.numeroParcela - b.numeroParcela)
                              .map((parcela, idx) => (
                                <div key={parcela.id || idx} className="text-xs">
                                  {parcela.numeroParcela}: {formatCurrency(parcela.valor)}
                                </div>
                              ))}
                            <button
                              onClick={() => toggleParcelas(nota.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                            >
                              {isExpanded ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              {isExpanded ? 'Ocultar' : 'Ver'} Detalhes
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sem parcelas</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <select
                          value={nota.status}
                          onChange={(e) => handleStatusChange(nota, e.target.value as any)}
                          className={`text-xs font-medium rounded-full px-2 py-0.5 border-0 focus:ring-1 focus:ring-blue-500 ${
                            nota.status === 'ativa' ? 'bg-green-100 text-green-800' :
                            nota.status === 'vencida' ? 'bg-red-100 text-red-800' :
                            nota.status === 'parcialmente_paga' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <option value="ativa">Ativa</option>
                          <option value="vencida">Vencida</option>
                          <option value="quitada">Quitada</option>
                          <option value="parcialmente_paga">Parcial</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
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
                        {/* Linha expandida com parcelas */}
                        {isExpanded && hasParcelas && (
                          <tr className="bg-blue-50">
                            <td colSpan={8} className="px-4 py-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-800">Parcelas da Nota Fiscal</h4>
                                  <div className="flex items-center gap-4 text-xs text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                                      Pendentes: {parcelasPendentes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-3 h-3 rounded-full bg-red-400"></span>
                                      Vencidas: {parcelasVencidas}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <span className="w-3 h-3 rounded-full bg-green-400"></span>
                                      Pagas: {parcelasPagas}
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {parcelas.map((parcela, index) => {
                                    const vencimento = new Date(parcela.dataVencimento);
                                    const hoje = new Date();
                                    hoje.setHours(0, 0, 0, 0);
                                    vencimento.setHours(0, 0, 0, 0);
                                    const isVencida = vencimento < hoje && parcela.status !== 'paga';
                                    
                                    return (
                                      <div
                                        key={parcela.id || index}
                                        className={`p-3 rounded-lg border-2 transition-all ${
                                          parcela.status === 'paga'
                                            ? 'bg-green-50 border-green-300'
                                            : isVencida
                                            ? 'bg-red-50 border-red-300'
                                            : 'bg-white border-gray-300 hover:border-blue-300'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-semibold text-sm">{parcela.numeroParcela}: {formatCurrency(parcela.valor)}</span>
                                          <span className={`text-xs px-2 py-1 rounded-full ${
                                            parcela.status === 'paga'
                                              ? 'bg-green-200 text-green-800'
                                              : isVencida
                                              ? 'bg-red-200 text-red-800'
                                              : 'bg-yellow-200 text-yellow-800'
                                          }`}>
                                            {parcela.status === 'paga' ? 'Paga' : isVencida ? 'Vencida' : 'Pendente'}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-0.5">
                                          <div>Vencimento: {vencimento.toLocaleDateString('pt-BR')}</div>
                                          {parcela.dataPagamento && (
                                            <div className="text-green-700 font-medium">
                                              ✓ Pago em: {new Date(parcela.dataPagamento).toLocaleDateString('pt-BR')}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
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
                    type="text"
                    value={formatInputValue(formData.total)}
                    onChange={(e) => handleCurrencyInput('total', e.target.value)}
                    placeholder="R$ 0,00"
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
                      const total = formData.total ? parseFloat(formData.total) : 0;
                      const valorParcela = total / parcelas;
                      setFormData({ 
                        ...formData, 
                        totalParcelas: e.target.value,
                        valorParcela: valorParcela > 0 ? valorParcela.toString() : ''
                      });
                    }}
                    placeholder="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.totalParcelas && parseInt(formData.totalParcelas) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      As parcelas serão sincronizadas automaticamente ao salvar
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor por Parcela
                  </label>
                  <input
                    type="text"
                    value={formatInputValue(formData.valorParcela)}
                    onChange={(e) => handleCurrencyInput('valorParcela', e.target.value)}
                    placeholder="R$ 0,00"
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
        onCancel={() => setShowDeleteDialog(false)}
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

      {/* Modal de Seleção de Data para Impressão */}
      {showPrintDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Imprimir Relatório
              </h2>
              <button
                onClick={() => {
                  setShowPrintDateModal(false);
                  setPrintDate('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione a data de entrada das notas
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Selecione uma data para imprimir apenas as notas lançadas naquele dia. Deixe em branco para imprimir todas as notas.
                </p>
                <input
                  type="date"
                  value={printDate}
                  onChange={(e) => setPrintDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Lista de datas disponíveis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datas disponíveis (clique para selecionar)
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {Array.from(new Set(notas.map(nota => {
                    const date = new Date(nota.dataEntrada);
                    return date.toISOString().split('T')[0];
                  })))
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .map(dateStr => {
                      const date = new Date(dateStr);
                      const count = notas.filter(nota => {
                        const notaDate = new Date(nota.dataEntrada);
                        return notaDate.toISOString().split('T')[0] === dateStr;
                      }).length;
                      
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setPrintDate(dateStr)}
                          className={`w-full text-left px-3 py-2 rounded hover:bg-blue-50 transition-colors ${
                            printDate === dateStr ? 'bg-blue-100 border border-blue-300' : ''
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {date.toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {count} nota{count !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowPrintDateModal(false);
                  setPrintDate('');
                }}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (printDate) {
                    handlePrint(printDate);
                  } else {
                    handlePrint();
                  }
                }}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Printer className="w-4 h-4 mr-2" />
                {printDate ? `Imprimir Notas de ${new Date(printDate).toLocaleDateString('pt-BR')}` : 'Imprimir Todas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Confirmação de Pagamento */}
      {showPaymentConfirmDialog && itemToPay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Confirmar Pagamento</h3>
                  <p className="text-sm text-gray-500">Item vencido detectado</p>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Item:</strong> {itemToPay.descricao}
                </p>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-bold text-green-600">{formatCurrency(itemToPay.valor)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vencimento:</span>
                  <span className="font-medium text-red-600">
                    {new Date(itemToPay.vencimento).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-700">
                Este item está vencido. Deseja marcar como <strong>pago</strong>?
              </p>
            </div>

            <div className="flex gap-3 p-6">
              <button
                onClick={() => {
                  setShowPaymentConfirmDialog(false);
                  setItemToPay(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Não, ainda não foi pago
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Sim, marcar como pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificação */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          isVisible={true}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

