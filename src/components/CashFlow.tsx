import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LogOut, Calculator, TrendingUp, TrendingDown, Save, RotateCcw, Download, FileText, Building, Info, CheckCircle2, XCircle, AlertCircle, BarChart3, X, Filter, Bell, AlertTriangle, ExternalLink, Maximize2, Minimize2, Search, Keyboard, FileSpreadsheet } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useCashFlow } from '../hooks/useCashFlow';
import { useDemoTimer } from '../hooks/useDemoTimer';
import { useAccessControl } from '../hooks/useAccessControl';
import { formatCurrency, formatCurrencyInput } from '../utils/currency';
import { saveFundoCaixaPadrao, validatePIM } from '../hooks/useCashFlow';
import PrintReport, { printCashFlow } from './PrintReport';
import * as XLSX from 'xlsx';
import ConfirmDialog from './ConfirmDialog';
import CancelamentosModal from './CancelamentosModal';
import Notification, { NotificationType } from './Notification';
import DemoTimer from './DemoTimer';
import DemoExpiredModal from './DemoExpiredModal';
import OwnerPanel from './OwnerPanel';
import AccessLimitationModal from './AccessLimitationModal';
import CashFlowDashboard from './CashFlowDashboard';
import CashFlowFiltersComponent, { CashFlowFilters } from './CashFlowFilters';
import AlertCenter from './AlertCenter';
import ToastNotification from './ToastNotification';
import BackupRestoreModal from './BackupRestoreModal';
import ValidationModal from './ValidationModal';
import TemplatesModal from './TemplatesModal';
import PDVIntegrationModal from './PDVIntegrationModal';
import WebhooksModal from './WebhooksModal';
import { useDarkMode } from '../hooks/useDarkMode';
import { cashFlowAuditService } from '../services/cashFlowAuditService';
import { cashFlowAlertsService } from '../services/cashFlowAlertsService';
import { cashFlowBackupService } from '../services/cashFlowBackupService';
import { cashFlowValidationService, ValidationResult } from '../services/cashFlowValidationService';
import { cashFlowTemplateService, ClosingTemplate } from '../services/cashFlowTemplateService';
import { webhookService } from '../services/webhookService';
import { pdvIntegrationService } from '../services/pdvIntegrationService';
import { CompanyConfig, Taxa } from '../types';

interface CashFlowProps {
  isDemo?: boolean;
  onBackToLanding?: () => void;
}

function CashFlow({ isDemo = false, onBackToLanding }: CashFlowProps) {
  const { logout, user, role } = useAuth();
  const [showOwnerPanel, setShowOwnerPanel] = useState(false);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  const { startDemo, resetDemo, timeInfo, isDemoActive } = useDemoTimer();
  const accessControl = useAccessControl();
  const [showAccessLimitation, setShowAccessLimitation] = useState(false);
  const {
    entries,
    exits,
    total,
    totalEntradas,
    totalCheques,
    totalDevolucoes,
    totalValesFuncionarios,
    valesImpactoEntrada,
    totalFinal,
    cancelamentos,
    setCancelamentos,
    updateEntries,
    updateExits,
    clearForm,
    hasChanges,
    saveToLocal,
    loadFromLocal,
    validateSaidaValues,
    validatePixContaValues,
    validateCartaoLinkValues,
    validateBoletosValues,
    canSave,
    adicionarCheque,
    removerCheque,
    adicionarSaidaRetirada,
    removerSaidaRetirada,
    atualizarSaidaRetirada,
    totalSaidasRetiradas,
    totalEnviosCorreios
  } = useCashFlow();

  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showConfirmFechamento, setShowConfirmFechamento] = useState(false);
  const [showCancelamentosModal, setShowCancelamentosModal] = useState(false);
  const [showDemoExpiredModal, setShowDemoExpiredModal] = useState(false);
  const [showFundoCaixaModal, setShowFundoCaixaModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSavedRecords, setShowSavedRecords] = useState(false);
  const [showAlertCenter, setShowAlertCenter] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; type: any; title: string; message: string; action?: { label: string; onClick: () => void } }>>([]);
  const [pimCode, setPimCode] = useState('');
  const [novoFundoCaixa, setNovoFundoCaixa] = useState('');
  const [pimError, setPimError] = useState('');
  const [novoValeNome, setNovoValeNome] = useState('');
  const [novoValeValor, setNovoValeValor] = useState(0);
  const [savedRecordsFilters, setSavedRecordsFilters] = useState<CashFlowFilters>({
    quickSearch: '',
    dateStart: '',
    dateEnd: '',
    entryType: 'all',
    exitType: 'all',
    valueMin: '',
    valueMax: '',
    status: 'all'
  });
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showPDVIntegrationModal, setShowPDVIntegrationModal] = useState(false);
  const [showWebhooksModal, setShowWebhooksModal] = useState(false);
  const [pendingHighValueAction, setPendingHighValueAction] = useState<{ field: string; value: number; callback: () => void } | null>(null);
  const { isDark, toggleDarkMode } = useDarkMode();
  // Exibir/Recolher seções
  const [mostrarEntradas, setMostrarEntradas] = useState(true);
  const [mostrarSaidas, setMostrarSaidas] = useState(true);
  // Micro-acordeões Entradas
  const [showCartaoLinkDetails, setShowCartaoLinkDetails] = useState(true);
  const [showBoletosDetails, setShowBoletosDetails] = useState(true);
  const [showPixContaDetails, setShowPixContaDetails] = useState(true);
  const [showChequesDetails, setShowChequesDetails] = useState(true);
  const [showTaxasDetails, setShowTaxasDetails] = useState(true);
  
  // Estados para múltiplas taxas
  const [novaTaxaNome, setNovaTaxaNome] = useState('');
  const [novaTaxaValor, setNovaTaxaValor] = useState(0);
  // Micro-acordeões Saídas
  const [showSaidaDetails, setShowSaidaDetails] = useState(true);
  const [showValesDetails, setShowValesDetails] = useState(true);
  const [showTransportadoraDetails, setShowTransportadoraDetails] = useState(true);
  const [showCorreiosDetails, setShowCorreiosDetails] = useState(true);
  // Recolher seções principais
  const [mostrarBotoesPrincipais, setMostrarBotoesPrincipais] = useState(true);
  const [mostrarResumoRapido, setMostrarResumoRapido] = useState(true);
  // Estado para tela cheia
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Ref para o container do sistema
  const systemContainerRef = useRef<HTMLDivElement>(null);
  // Estado para busca rápida
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Estado para gráficos
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  // Estado para observações/notas
  const [observacoes, setObservacoes] = useState<string>('');
  const [anexarObservacoes, setAnexarObservacoes] = useState<boolean>(false);

  type DailyRecord = {
    date: string;
    entradas: number;
    saidas: number;
    saldo: number;
  };

  const [dailyGoal, setDailyGoal] = useState<number>(5000);
  const [dailyGoalDraft, setDailyGoalDraft] = useState<string>('5000');
  const [isEditingDailyGoal, setIsEditingDailyGoal] = useState(false);
  const [dailyHistory, setDailyHistory] = useState<DailyRecord[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedGoal = window.localStorage.getItem('cashflow_daily_goal');
    if (storedGoal) {
      const value = Number(storedGoal);
      if (!Number.isNaN(value) && value > 0) {
        setDailyGoal(value);
        setDailyGoalDraft(String(value));
      }
    }
    const storedHistory = window.localStorage.getItem('cashflow_daily_history');
    if (storedHistory) {
      try {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter((item: any) =>
            item && typeof item.date === 'string'
          );
          setDailyHistory(sanitized);
        }
      } catch (error) {
        // Histórico diário inválido - ignorar cache
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('cashflow_daily_goal', String(dailyGoal));
  }, [dailyGoal]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('cashflow_daily_history', JSON.stringify(dailyHistory));
  }, [dailyHistory]);

  // Função para mostrar toast
  const showToast = useCallback((type: any, title: string, message: string, action?: { label: string; onClick: () => void }) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message, action }]);
  }, []);

  // Remover toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Verificar alertas automaticamente
  useEffect(() => {
    const checkAlerts = () => {
      // Verificar meta diária
      const metaAlert = cashFlowAlertsService.checkDailyGoal(total, dailyGoal);
      if (metaAlert) {
        cashFlowAlertsService.addAlert(metaAlert);
        // Mostrar toast apenas se for meta atingida (não apenas próximo)
        if (metaAlert.type === 'success') {
          showToast(metaAlert.type, metaAlert.title, metaAlert.message);
        }
      }

      // Verificar saldo negativo
      const saldoAlert = cashFlowAlertsService.checkNegativeBalance(total);
      if (saldoAlert) {
        cashFlowAlertsService.addAlert(saldoAlert);
        showToast(saldoAlert.type, saldoAlert.title, saldoAlert.message);
        
        // Disparar webhook de alerta criado
        webhookService.triggerEvent('cashflow.alert_created', {
          type: saldoAlert.type,
          category: saldoAlert.category,
          title: saldoAlert.title,
          message: saldoAlert.message
        }, { userId: user || undefined });
      }

      // Verificar movimentação acima do normal
      if (dailyHistory.length > 0) {
        const averageTotal = dailyHistory.reduce((sum, record) => sum + (record.entradas || 0), 0) / dailyHistory.length;
        const movimentacaoAlert = cashFlowAlertsService.checkHighMovement(totalEntradas, averageTotal);
        if (movimentacaoAlert) {
          cashFlowAlertsService.addAlert(movimentacaoAlert);
        }
      }

      // Verificar último fechamento
      const lastClose = dailyHistory.length > 0 
        ? new Date(dailyHistory[dailyHistory.length - 1].date)
        : undefined;
      const fechamentoAlert = cashFlowAlertsService.createClosingReminder(lastClose);
      if (fechamentoAlert) {
        cashFlowAlertsService.addAlert(fechamentoAlert);
      }
    };

    // Verificar a cada 30 segundos
    const interval = setInterval(checkAlerts, 30000);
    checkAlerts(); // Verificar imediatamente

    return () => clearInterval(interval);
  }, [total, dailyGoal, totalEntradas, dailyHistory, showToast]);

  // Atualizar contador de alertas não lidos
  useEffect(() => {
    const updateUnreadCount = () => {
      const count = cashFlowAlertsService.getUnreadCount();
      setUnreadAlertsCount(count);
    };

    // Atualizar imediatamente
    updateUnreadCount();

    // Subscrever para atualizações em tempo real
    const unsubscribe = cashFlowAlertsService.subscribe(() => {
      updateUnreadCount();
    });

    return unsubscribe;
  }, []);

  // Funções para controlar tela cheia (apenas do sistema)
  const toggleFullscreen = useCallback(() => {
    if (!systemContainerRef.current) return;

    // Verificar se está em fullscreen
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    if (!isCurrentlyFullscreen) {
      // Entrar em tela cheia
      const element = systemContainerRef.current;
      if (element.requestFullscreen) {
        element.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch((err) => {
          // Erro ao entrar em tela cheia - silencioso
        });
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
        setIsFullscreen(true);
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen();
        setIsFullscreen(true);
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      // Sair da tela cheia
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch((err) => {
          // Erro ao sair da tela cheia - silencioso
        });
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
        setIsFullscreen(false);
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
        setIsFullscreen(false);
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);

  // Listener para detectar mudanças no estado de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const totalSaidasCalculado = useMemo(() => {
    const totalValesFuncionarios = Array.isArray(exits.valesFuncionarios)
      ? exits.valesFuncionarios.reduce((sum: number, item: { valor: number }) => sum + (Number(item.valor) || 0), 0)
      : 0;
    return (
      (Number(exits.descontos) || 0) +
      (Number(exits.saida) || 0) +
      (Number(exits.creditoDevolucao) || 0) +
      totalValesFuncionarios +
      (Number(exits.puxadorValor) || 0)
    );
  }, [exits]);

  // Backup automático diário
  useEffect(() => {
    const lastBackupDate = localStorage.getItem('cashflow_last_backup_date');
    const today = new Date().toISOString().split('T')[0];

    // Fazer backup diário se ainda não foi feito hoje
    if (lastBackupDate !== today && totalEntradas > 0) {
      const backupData = {
        entries,
        exits,
        cancelamentos: cancelamentos || [],
        total,
        totalEntradas,
        totalSaidas: totalSaidasCalculado,
        fundoCaixa: entries.fundoCaixa || 400,
        dailyGoal
      };

      cashFlowBackupService.createBackup(backupData, 'daily');
      localStorage.setItem('cashflow_last_backup_date', today);
      
      // Disparar webhook de backup criado
      webhookService.triggerEvent('cashflow.backup_created', {
        type: 'daily',
        date: today
      }, { userId: user || undefined });
    }
  }, [entries, exits, cancelamentos, total, totalEntradas, totalSaidasCalculado, dailyGoal, user]);

  // Validação automática
  useEffect(() => {
    if (totalEntradas > 0 || totalSaidasCalculado > 0) {
      const result = cashFlowValidationService.validateAll(
        entries,
        exits,
        cancelamentos || [],
        total,
        totalEntradas,
        totalSaidasCalculado
      );
      setValidationResult(result);
      
      // Disparar webhook se validação falhou
      if (!result.isValid) {
        webhookService.triggerEvent('cashflow.validation_failed', {
          errors: result.errors,
          warnings: result.warnings
        }, { userId: user || undefined });
      }
    }
  }, [entries, exits, cancelamentos, total, totalEntradas, totalSaidasCalculado, user]);

  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], []);
  const yesterdayKey = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }, []);

  const previousDayRecord = useMemo(() => {
    return dailyHistory.find(record => record.date === yesterdayKey) || null;
  }, [dailyHistory, yesterdayKey]);

  const progressPercent = useMemo(() => {
    if (dailyGoal <= 0) return 0;
    return Math.min((totalEntradas / dailyGoal) * 100, 130);
  }, [dailyGoal, totalEntradas]);

  const variationValor = useMemo(() => {
    if (!previousDayRecord) return null;
    return totalEntradas - previousDayRecord.entradas;
  }, [previousDayRecord, totalEntradas]);

  const variationPercent = useMemo(() => {
    if (!previousDayRecord || previousDayRecord.entradas === 0 || variationValor === null) return null;
    return (variationValor / previousDayRecord.entradas) * 100;
  }, [variationValor, previousDayRecord]);

  const lastClosingRecord = useMemo(() => {
    if (dailyHistory.length === 0) return null;
    const sorted = [...dailyHistory].sort((a, b) => b.date.localeCompare(a.date));
    return sorted[0];
  }, [dailyHistory]);

  const handleDailyGoalSave = () => {
    const numeric = Number(dailyGoalDraft);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setDailyGoal(5000);
      setDailyGoalDraft('5000');
    } else {
      setDailyGoal(numeric);
      setDailyGoalDraft(String(numeric));
    }
    setIsEditingDailyGoal(false);
  };

  const handleDailyGoalCancel = () => {
    setDailyGoalDraft(String(dailyGoal));
    setIsEditingDailyGoal(false);
  };

  // Função para gerar arquivo de fechamento para download
  const generateFechamentoFile = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    // Calcular total de cheques
    const totalChequesFechamento = Array.isArray(entries.cheques)
      ? entries.cheques.reduce((sum, cheque) => sum + (Number(cheque.valor) || 0), 0)
      : (Number(entries.cheque) || 0);

    // Calcular total de taxas
    const totalTaxasFechamento = Array.isArray(entries.taxas)
      ? entries.taxas.reduce((sum, taxa) => sum + (Number(taxa.valor) || 0), 0)
      : 0;
    
    const totalEntradas = 
      (Number(entries.dinheiro) || 0) + 
      (Number(entries.fundoCaixa) || 0) + 
      (Number(entries.cartao) || 0) + 
      (Number(entries.cartaoLink) || 0) + 
      (Number(entries.boletos) || 0) + 
      (Number(entries.pixMaquininha) || 0) + 
      (Number(entries.pixConta) || 0) +
      totalChequesFechamento +
      totalTaxasFechamento +
      (Number(totalEnviosCorreios) || 0);

    // Calcular total das devoluções incluídas no movimento
    const totalDevolucoes = Array.isArray(exits.devolucoes)
      ? exits.devolucoes
          .filter(devolucao => devolucao.incluidoNoMovimento)
          .reduce((sum, devolucao) => sum + (Number(devolucao.valor) || 0), 0)
      : 0;

    // Vales de funcionários
    const totalValesFuncionarios = Array.isArray(exits.valesFuncionarios)
      ? exits.valesFuncionarios.reduce((sum: number, item: { nome: string; valor: number }) => sum + (Number(item.valor) || 0), 0)
      : 0;
    const valesImpactoEntrada = exits.valesIncluidosNoMovimento ? totalValesFuncionarios : 0;

    const totalEntradasComVales = (Number(totalEntradas) || 0) + (Number(totalDevolucoes) || 0) + (Number(valesImpactoEntrada) || 0);

    const totalSaidas = 
      (Number(exits.descontos) || 0) + 
      (Number(exits.saida) || 0) + 
      (Number(exits.creditoDevolucao) || 0) + 
      (Number(totalValesFuncionarios) || 0) + 
      (Number(exits.puxadorValor) || 0);

    const saldo = (Number(totalEntradasComVales) || 0) - (Number(totalSaidas) || 0);

    const content = `FECHAMENTO DE CAIXA - ${dateStr} ${timeStr}\n\n` +
      `ENTRADAS:\n` +
      `Dinheiro: ${formatCurrency(entries.dinheiro)}\n` +
      `Fundo de Caixa: ${formatCurrency(entries.fundoCaixa)}\n` +
      `Cartão: ${formatCurrency(entries.cartao)}\n` +
      `Cartão Link: ${formatCurrency(entries.cartaoLink)}\n` +
      `Boletos: ${formatCurrency(entries.boletos)}\n` +
      `PIX Maquininha: ${formatCurrency(entries.pixMaquininha)}\n` +
      `PIX Conta: ${formatCurrency(entries.pixConta)}\n` +
      (totalChequesFechamento > 0 ? `Cheques: ${formatCurrency(totalChequesFechamento)}\n` : '') +
      (totalTaxasFechamento > 0 ? `Taxas: ${formatCurrency(totalTaxasFechamento)}\n` : '') +
      `Correios/Frete: ${formatCurrency(totalEnviosCorreios)}\n` +
      (totalDevolucoes > 0 ? `Devoluções (Incluídas): ${formatCurrency(totalDevolucoes)}\n` : '') +
      (valesImpactoEntrada > 0 ? `Vales (Incluídos): ${formatCurrency(valesImpactoEntrada)}\n` : '') +
      `\nTOTAL ENTRADAS: ${formatCurrency(totalEntradasComVales)}\n\n` +
      `SAÍDAS:\n` +
      `Descontos: ${formatCurrency(exits.descontos)}\n` +
      `Saída (Retirada): ${formatCurrency(exits.saida)}\n` +
      `Crédito/Devolução: ${formatCurrency(exits.creditoDevolucao)}\n` +
      `Vales Funcionários: ${formatCurrency(totalValesFuncionarios)}\n` +
      `Comissão Puxador: ${formatCurrency(Number(exits.puxadorValor) || 0)}\n` +
      `\nTOTAL SAÍDAS: ${formatCurrency(totalSaidas)}\n\n` +
      `SALDO: ${formatCurrency(saldo)}\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fechamento_${dateStr.replace(/\//g, '_')}_${timeStr.replace(/:/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, [entries, exits, totalEnviosCorreios, totalCheques, total]);

  // Função para exportar relatório em CSV
  const exportToCSV = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    // Calcular totais
    const totalChequesFechamento = Array.isArray(entries.cheques)
      ? entries.cheques.reduce((sum, cheque) => sum + (Number(cheque.valor) || 0), 0)
      : (Number(entries.cheque) || 0);

    const totalTaxasFechamento = Array.isArray(entries.taxas)
      ? entries.taxas.reduce((sum, taxa) => sum + (Number(taxa.valor) || 0), 0)
      : 0;
    
    const totalEntradas = 
      (Number(entries.dinheiro) || 0) + 
      (Number(entries.fundoCaixa) || 0) + 
      (Number(entries.cartao) || 0) + 
      (Number(entries.cartaoLink) || 0) + 
      (Number(entries.boletos) || 0) + 
      (Number(entries.pixMaquininha) || 0) + 
      (Number(entries.pixConta) || 0) +
      totalChequesFechamento +
      totalTaxasFechamento +
      (Number(totalEnviosCorreios) || 0);

    const totalDevolucoes = Array.isArray(exits.devolucoes)
      ? exits.devolucoes
          .filter(devolucao => devolucao.incluidoNoMovimento)
          .reduce((sum, devolucao) => sum + (Number(devolucao.valor) || 0), 0)
      : 0;

    const totalValesFuncionarios = Array.isArray(exits.valesFuncionarios)
      ? exits.valesFuncionarios.reduce((sum: number, item: { nome: string; valor: number }) => sum + (Number(item.valor) || 0), 0)
      : 0;
    const valesImpactoEntrada = exits.valesIncluidosNoMovimento ? totalValesFuncionarios : 0;

    const totalEntradasComVales = (Number(totalEntradas) || 0) + (Number(totalDevolucoes) || 0) + (Number(valesImpactoEntrada) || 0);

    const totalSaidas = 
      (Number(exits.descontos) || 0) + 
      (Number(exits.saida) || 0) + 
      (Number(exits.creditoDevolucao) || 0) + 
      (Number(totalValesFuncionarios) || 0) + 
      (Number(exits.puxadorValor) || 0);

    const saldo = (Number(totalEntradasComVales) || 0) - (Number(totalSaidas) || 0);

    // Preparar dados para CSV
    const csvRows: string[][] = [];
    
    // Cabeçalho
    csvRows.push(['FECHAMENTO DE CAIXA', dateStr, timeStr]);
    csvRows.push([]);
    
    // Entradas
    csvRows.push(['ENTRADAS']);
    csvRows.push(['Tipo', 'Valor']);
    csvRows.push(['Dinheiro', formatCurrency(entries.dinheiro)]);
    csvRows.push(['Fundo de Caixa', formatCurrency(entries.fundoCaixa)]);
    csvRows.push(['Cartão', formatCurrency(entries.cartao)]);
    csvRows.push(['Cartão Link', formatCurrency(entries.cartaoLink)]);
    csvRows.push(['Boletos', formatCurrency(entries.boletos)]);
    csvRows.push(['PIX Maquininha', formatCurrency(entries.pixMaquininha)]);
    csvRows.push(['PIX Conta', formatCurrency(entries.pixConta)]);
    if (totalChequesFechamento > 0) {
      csvRows.push(['Cheques', formatCurrency(totalChequesFechamento)]);
    }
    if (totalTaxasFechamento > 0) {
      csvRows.push(['Taxas', formatCurrency(totalTaxasFechamento)]);
    }
    csvRows.push(['Correios/Frete', formatCurrency(totalEnviosCorreios)]);
    if (totalDevolucoes > 0) {
      csvRows.push(['Devoluções (Incluídas)', formatCurrency(totalDevolucoes)]);
    }
    if (valesImpactoEntrada > 0) {
      csvRows.push(['Vales (Incluídos)', formatCurrency(valesImpactoEntrada)]);
    }
    csvRows.push([]);
    csvRows.push(['TOTAL ENTRADAS', formatCurrency(totalEntradasComVales)]);
    csvRows.push([]);
    
    // Saídas
    csvRows.push(['SAÍDAS']);
    csvRows.push(['Tipo', 'Valor']);
    csvRows.push(['Descontos', formatCurrency(exits.descontos)]);
    csvRows.push(['Saída (Retirada)', formatCurrency(exits.saida)]);
    csvRows.push(['Crédito/Devolução', formatCurrency(exits.creditoDevolucao)]);
    csvRows.push(['Vales Funcionários', formatCurrency(totalValesFuncionarios)]);
    csvRows.push(['Comissão Puxador', formatCurrency(Number(exits.puxadorValor) || 0)]);
    
    // Saídas Retiradas detalhadas
    if (Array.isArray(exits.saidasRetiradas) && exits.saidasRetiradas.length > 0) {
      csvRows.push([]);
      csvRows.push(['Saídas Retiradas Detalhadas']);
      csvRows.push(['Descrição', 'Valor', 'Incluído no Movimento']);
      exits.saidasRetiradas.forEach(saida => {
        csvRows.push([saida.descricao, formatCurrency(saida.valor), saida.incluidoNoMovimento ? 'Sim' : 'Não']);
      });
    }
    
    // Cheques detalhados
    if (Array.isArray(entries.cheques) && entries.cheques.length > 0) {
      csvRows.push([]);
      csvRows.push(['Cheques Detalhados']);
      csvRows.push(['Banco', 'Agência', 'Número', 'Cliente', 'Valor', 'Vencimento']);
      entries.cheques.forEach(cheque => {
        csvRows.push([
          cheque.banco || '',
          cheque.agencia || '',
          cheque.numeroCheque || '',
          cheque.nomeCliente || '',
          formatCurrency(cheque.valor),
          cheque.dataVencimento ? new Date(cheque.dataVencimento).toLocaleDateString('pt-BR') : 'À vista'
        ]);
      });
    }
    
    // Taxas detalhadas
    if (Array.isArray(entries.taxas) && entries.taxas.length > 0) {
      csvRows.push([]);
      csvRows.push(['Taxas Detalhadas']);
      csvRows.push(['Descrição', 'Valor']);
      entries.taxas.forEach(taxa => {
        csvRows.push([(taxa as any).descricao || (taxa as any).nome || 'Taxa', formatCurrency(taxa.valor)]);
      });
    }
    
    // Vales Funcionários detalhados
    if (Array.isArray(exits.valesFuncionarios) && exits.valesFuncionarios.length > 0) {
      csvRows.push([]);
      csvRows.push(['Vales Funcionários Detalhados']);
      csvRows.push(['Nome', 'Valor']);
      exits.valesFuncionarios.forEach(vale => {
        csvRows.push([vale.nome, formatCurrency(vale.valor)]);
      });
    }
    
    csvRows.push([]);
    csvRows.push(['TOTAL SAÍDAS', formatCurrency(totalSaidas)]);
    csvRows.push([]);
    csvRows.push(['SALDO', formatCurrency(saldo)]);
    
    // Converter para CSV
    const csvContent = csvRows.map(row => 
      row.map(cell => {
        // Escapar células que contêm vírgulas ou aspas
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\n');
    
    // Adicionar BOM para Excel reconhecer UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fechamento_caixa_${dateStr.replace(/\//g, '_')}_${timeStr.replace(/:/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setNotification({
      type: 'success',
      message: 'Relatório exportado em CSV com sucesso!',
      isVisible: true
    });
  }, [entries, exits, totalEnviosCorreios, totalCheques, total]);

  // Função para exportar relatório em Excel
  const exportToExcel = useCallback(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    // Calcular totais
    const totalChequesFechamento = Array.isArray(entries.cheques)
      ? entries.cheques.reduce((sum, cheque) => sum + (Number(cheque.valor) || 0), 0)
      : (Number(entries.cheque) || 0);

    const totalTaxasFechamento = Array.isArray(entries.taxas)
      ? entries.taxas.reduce((sum, taxa) => sum + (Number(taxa.valor) || 0), 0)
      : 0;
    
    const totalEntradas = 
      (Number(entries.dinheiro) || 0) + 
      (Number(entries.fundoCaixa) || 0) + 
      (Number(entries.cartao) || 0) + 
      (Number(entries.cartaoLink) || 0) + 
      (Number(entries.boletos) || 0) + 
      (Number(entries.pixMaquininha) || 0) + 
      (Number(entries.pixConta) || 0) +
      totalChequesFechamento +
      totalTaxasFechamento +
      (Number(totalEnviosCorreios) || 0);

    const totalDevolucoes = Array.isArray(exits.devolucoes)
      ? exits.devolucoes
          .filter(devolucao => devolucao.incluidoNoMovimento)
          .reduce((sum, devolucao) => sum + (Number(devolucao.valor) || 0), 0)
      : 0;

    const totalValesFuncionarios = Array.isArray(exits.valesFuncionarios)
      ? exits.valesFuncionarios.reduce((sum: number, item: { nome: string; valor: number }) => sum + (Number(item.valor) || 0), 0)
      : 0;
    const valesImpactoEntrada = exits.valesIncluidosNoMovimento ? totalValesFuncionarios : 0;

    const totalEntradasComVales = (Number(totalEntradas) || 0) + (Number(totalDevolucoes) || 0) + (Number(valesImpactoEntrada) || 0);

    const totalSaidas = 
      (Number(exits.descontos) || 0) + 
      (Number(exits.saida) || 0) + 
      (Number(exits.creditoDevolucao) || 0) + 
      (Number(totalValesFuncionarios) || 0) + 
      (Number(exits.puxadorValor) || 0);

    const saldo = (Number(totalEntradasComVales) || 0) - (Number(totalSaidas) || 0);

    // Criar workbook
    const wb = XLSX.utils.book_new();
    
    // Aba 1: Resumo
    const resumoData: any[][] = [
      ['FECHAMENTO DE CAIXA'],
      ['Data', dateStr],
      ['Hora', timeStr],
      [],
      ['ENTRADAS'],
      ['Tipo', 'Valor'],
      ['Dinheiro', Number(entries.dinheiro) || 0],
      ['Fundo de Caixa', Number(entries.fundoCaixa) || 0],
      ['Cartão', Number(entries.cartao) || 0],
      ['Cartão Link', Number(entries.cartaoLink) || 0],
      ['Boletos', Number(entries.boletos) || 0],
      ['PIX Maquininha', Number(entries.pixMaquininha) || 0],
      ['PIX Conta', Number(entries.pixConta) || 0],
    ];
    
    if (totalChequesFechamento > 0) {
      resumoData.push(['Cheques', totalChequesFechamento]);
    }
    if (totalTaxasFechamento > 0) {
      resumoData.push(['Taxas', totalTaxasFechamento]);
    }
    resumoData.push(['Correios/Frete', Number(totalEnviosCorreios) || 0]);
    if (totalDevolucoes > 0) {
      resumoData.push(['Devoluções (Incluídas)', totalDevolucoes]);
    }
    if (valesImpactoEntrada > 0) {
      resumoData.push(['Vales (Incluídos)', valesImpactoEntrada]);
    }
    resumoData.push([], ['TOTAL ENTRADAS', totalEntradasComVales], []);
    resumoData.push(['SAÍDAS']);
    resumoData.push(['Tipo', 'Valor']);
    resumoData.push(['Descontos', Number(exits.descontos) || 0]);
    resumoData.push(['Saída (Retirada)', Number(exits.saida) || 0]);
    resumoData.push(['Crédito/Devolução', Number(exits.creditoDevolucao) || 0]);
    resumoData.push(['Vales Funcionários', totalValesFuncionarios]);
    resumoData.push(['Comissão Puxador', Number(exits.puxadorValor) || 0]);
    resumoData.push([], ['TOTAL SAÍDAS', totalSaidas], []);
    resumoData.push(['SALDO', saldo]);
    
    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    
    // Aba 2: Cheques (se houver)
    if (Array.isArray(entries.cheques) && entries.cheques.length > 0) {
      const chequesData: any[][] = [
        ['Banco', 'Agência', 'Número', 'Cliente', 'Valor', 'Vencimento']
      ];
      entries.cheques.forEach(cheque => {
        chequesData.push([
          cheque.banco || '',
          cheque.agencia || '',
          cheque.numeroCheque || '',
          cheque.nomeCliente || '',
          Number(cheque.valor) || 0,
          cheque.dataVencimento ? new Date(cheque.dataVencimento).toLocaleDateString('pt-BR') : 'À vista'
        ]);
      });
      const wsCheques = XLSX.utils.aoa_to_sheet(chequesData);
      XLSX.utils.book_append_sheet(wb, wsCheques, 'Cheques');
    }
    
    // Aba 3: Taxas (se houver)
    if (Array.isArray(entries.taxas) && entries.taxas.length > 0) {
      const taxasData: any[][] = [
        ['Descrição', 'Valor']
      ];
      entries.taxas.forEach(taxa => {
        taxasData.push([
          (taxa as any).descricao || (taxa as any).nome || 'Taxa',
          Number(taxa.valor) || 0
        ]);
      });
      const wsTaxas = XLSX.utils.aoa_to_sheet(taxasData);
      XLSX.utils.book_append_sheet(wb, wsTaxas, 'Taxas');
    }
    
    // Aba 4: Saídas Retiradas (se houver)
    if (Array.isArray(exits.saidasRetiradas) && exits.saidasRetiradas.length > 0) {
      const saidasData: any[][] = [
        ['Descrição', 'Valor', 'Incluído no Movimento']
      ];
      exits.saidasRetiradas.forEach(saida => {
        saidasData.push([
          saida.descricao,
          Number(saida.valor) || 0,
          saida.incluidoNoMovimento ? 'Sim' : 'Não'
        ]);
      });
      const wsSaidas = XLSX.utils.aoa_to_sheet(saidasData);
      XLSX.utils.book_append_sheet(wb, wsSaidas, 'Saídas Retiradas');
    }
    
    // Aba 5: Vales Funcionários (se houver)
    if (Array.isArray(exits.valesFuncionarios) && exits.valesFuncionarios.length > 0) {
      const valesData: any[][] = [
        ['Nome', 'Valor']
      ];
      exits.valesFuncionarios.forEach(vale => {
        valesData.push([
          vale.nome,
          Number(vale.valor) || 0
        ]);
      });
      const wsVales = XLSX.utils.aoa_to_sheet(valesData);
      XLSX.utils.book_append_sheet(wb, wsVales, 'Vales Funcionários');
    }
    
    // Exportar arquivo
    XLSX.writeFile(wb, `fechamento_caixa_${dateStr.replace(/\//g, '_')}_${timeStr.replace(/:/g, '_')}.xlsx`);
    
    setNotification({
      type: 'success',
      message: 'Relatório exportado em Excel com sucesso!',
      isVisible: true
    });
  }, [entries, exits, totalEnviosCorreios, totalCheques, total]);

  // Verificar valores altos e solicitar confirmação
  const checkHighValues = useCallback((): boolean => {
    const warnings = cashFlowValidationService.validateHighValues(
      entries,
      exits,
      cancelamentos || []
    );

    if (warnings.length > 0) {
      const highValues = warnings.map(w => w.message).join('\n');
      return confirm(
        `⚠️ Valores altos detectados:\n\n${highValues}\n\nDeseja continuar mesmo assim?`
      );
    }

    return true;
  }, [entries, exits, cancelamentos]);

  // Função wrapper para salvar com validação de valores altos
  const handleSaveWithValidation = useCallback(() => {
    // Verificar valores altos antes de salvar
    if (!checkHighValues()) {
      return;
    }
    // Salvar dados incluindo observações
    const dataToSave: any = { entries, exits, cancelamentos };
    if (observacoes) {
      dataToSave.observacoes = observacoes;
    }
    localStorage.setItem('cashFlowData', JSON.stringify(dataToSave));
    
    // Disparar webhook de salvamento
    webhookService.triggerEvent('cashflow.saved', {
      entries,
      exits,
      total,
      totalEntradas,
      totalSaidas: totalSaidasCalculado
    }, { userId: user || undefined });
    
    setNotification({
      type: 'success',
      message: 'Dados salvos com sucesso!',
      isVisible: true
    });
  }, [checkHighValues, entries, exits, cancelamentos, observacoes, total, totalEntradas, totalSaidasCalculado, user]);

  // Função para fechar movimento (imprimir + gerar arquivo + zerar valores)
  const handleFecharMovimento = useCallback(() => {
    // Verificar valores altos antes de fechar
    if (!checkHighValues()) {
      return;
    }
    // Registrar fechamento no log de auditoria
    if (user) {
      cashFlowAuditService.logAction(
        user,
        user,
        'close',
        'fechamento',
        `fechamento-${todayKey}`,
        undefined,
        undefined,
        { totalEntradas, totalSaidas: totalSaidasCalculado, saldo: total },
        `Fechamento de caixa - Entradas: ${formatCurrency(totalEntradas)}, Saídas: ${formatCurrency(totalSaidasCalculado)}, Saldo: ${formatCurrency(total)}`
      );
    }

    // Criar backup do fechamento com versionamento
    cashFlowBackupService.createBackup(
      {
        entries,
        exits,
        cancelamentos: cancelamentos || [],
        total,
        totalEntradas,
        totalSaidas: totalSaidasCalculado,
        fundoCaixa: entries.fundoCaixa || 400,
        dailyGoal
      },
      'closing',
      { version: cashFlowBackupService.getCurrentVersion(), notes: `Fechamento de ${todayKey}` }
    );
    
    // Incrementar versão após fechamento
    cashFlowBackupService.incrementVersion();

    // 1. Gerar arquivo de fechamento
    generateFechamentoFile();

    // 2. Abrir impressão (relatório completo) usando o novo fluxo
    setTimeout(() => {
      try {
        const cashFlowData = {
          entries,
          exits,
          total,
          date: new Date().toISOString(),
          cancelamentos,
          observacoes: observacoes || undefined
        };
        printCashFlow(cashFlowData, false, anexarObservacoes);
      } catch (e) {
        // Falha ao abrir impressão - continuar normalmente
      }

      // 3. Mostrar confirmação após breve atraso
      setTimeout(() => {
        setShowConfirmFechamento(true);
      }, 1000);
    }, 500);

    // 4. Notificação
    setNotification({
      type: 'success',
      message: 'Movimento fechado! Arquivo gerado e impressão aberta.',
      isVisible: true
    });
    // Salvar histórico básico
    setDailyHistory(prev => {
      const filtered = prev.filter(record => record.date !== todayKey);
      const updated = [
        ...filtered,
        {
          date: todayKey,
          entradas: totalEntradas,
          saidas: totalSaidasCalculado,
          saldo: total
        }
      ];
      const ordered = [...updated].sort((a, b) => a.date.localeCompare(b.date));
      return ordered.slice(-30);
    });

    // Salvar fechamento completo com detalhes
    try {
      const fechamentoCompleto = {
        date: todayKey,
        timestamp: new Date().toISOString(),
        entradas: totalEntradas,
        saidas: totalSaidasCalculado,
        saldo: total,
        detalhes: {
          dinheiro: entries.dinheiro || 0,
          fundoCaixa: entries.fundoCaixa || 0,
          cartao: entries.cartao || 0,
          cartaoLink: entries.cartaoLink || 0,
          boletos: entries.boletos || 0,
          pixMaquininha: entries.pixMaquininha || 0,
          pixConta: entries.pixConta || 0,
          cheques: Array.isArray(entries.cheques)
            ? entries.cheques.reduce((sum: number, c: any) => sum + (c.valor || 0), 0)
            : (entries.cheque || 0),
          taxas: Array.isArray(entries.taxas)
            ? entries.taxas.reduce((sum: number, t: any) => sum + (t.valor || 0), 0)
            : 0,
          descontos: exits.descontos || 0,
          saida: exits.saida || 0,
          valesFuncionarios: Array.isArray(exits.valesFuncionarios)
            ? exits.valesFuncionarios.reduce((sum: number, v: any) => sum + (v.valor || 0), 0)
            : 0,
        },
        entries: { ...entries },
        exits: { ...exits },
        cancelamentos: cancelamentos || [],
        observacoes: observacoes || undefined
      };

      const storedFechamentos = localStorage.getItem('cashflow_fechamentos');
      let fechamentos: any[] = [];
      
      if (storedFechamentos) {
        try {
          fechamentos = JSON.parse(storedFechamentos);
          if (!Array.isArray(fechamentos)) fechamentos = [];
        } catch (e) {
          fechamentos = [];
        }
      }

      // Remover fechamento do mesmo dia se existir
      fechamentos = fechamentos.filter((f: any) => f.date !== todayKey);
      
      // Adicionar novo fechamento
      fechamentos.push(fechamentoCompleto);
      
      // Manter apenas os últimos 90 dias
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      fechamentos = fechamentos.filter((f: any) => {
        const fechaDate = new Date(f.date);
        return fechaDate >= ninetyDaysAgo;
      });

      // Ordenar por data
      fechamentos.sort((a: any, b: any) => a.date.localeCompare(b.date));
      
      localStorage.setItem('cashflow_fechamentos', JSON.stringify(fechamentos));
      
      // Disparar webhook de fechamento
      webhookService.triggerEvent('cashflow.closed', {
        date: todayKey,
        totalEntradas,
        totalSaidas: totalSaidasCalculado,
        saldo: total
      }, { userId: user || undefined });
    } catch (error) {
      // Erro ao salvar fechamento - não crítico
    }
  }, [generateFechamentoFile, entries, exits, total, cancelamentos, totalEntradas, totalSaidasCalculado, todayKey, user]);

  // Aplicar template
  const handleApplyTemplate = useCallback((template: ClosingTemplate) => {
    // Aplicar dados do template
    Object.keys(template.data.entries).forEach((key) => {
      updateEntries(key as keyof typeof entries, template.data.entries[key]);
    });
    
    Object.keys(template.data.exits).forEach((key) => {
      updateExits(key as keyof typeof exits, template.data.exits[key]);
    });
    
    if (template.data.cancelamentos && template.data.cancelamentos.length > 0) {
      setCancelamentos(template.data.cancelamentos);
    }
    
    setNotification({
      type: 'success',
      message: `Template "${template.name}" aplicado com sucesso!`,
      isVisible: true
    });
  }, [updateEntries, updateExits, setCancelamentos]);

  
  // Componente de Tooltip simples
  const HelpTooltip = ({ text }: { text: string }) => (
    <div className="relative group inline-block ml-1">
      <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
  
  // Função para calcular checklist de fechamento
  const getChecklistFechamento = useMemo(() => {
    const items = [];
    
    // Validação PIX Conta
    if (entries.pixConta > 0) {
      const isValid = validatePixContaValues();
      items.push({
        id: 'pix-conta',
        label: 'PIX Conta - Valores conferem',
        status: isValid ? 'ok' : 'error',
        message: isValid ? 'Valores dos clientes conferem com o total' : 'Valores dos clientes não conferem com o total'
      });
    }
    
    // Validação Cartão Link
    if (entries.cartaoLink > 0) {
      const isValid = validateCartaoLinkValues();
      items.push({
        id: 'cartao-link',
        label: 'Cartão Link - Valores conferem',
        status: isValid ? 'ok' : 'error',
        message: isValid ? 'Valores dos clientes conferem com o total' : 'Valores dos clientes não conferem com o total'
      });
    }
    
    // Validação Boletos
    if (entries.boletos > 0) {
      const isValid = validateBoletosValues();
      items.push({
        id: 'boletos',
        label: 'Boletos - Valores conferem',
        status: isValid ? 'ok' : 'error',
        message: isValid ? 'Valores dos clientes conferem com o total' : 'Valores dos clientes não conferem com o total'
      });
    }
    
    // Validação Saída (Retirada)
    if (exits.saida > 0) {
      const isValid = validateSaidaValues();
      items.push({
        id: 'saida-retirada',
        label: 'Saída (Retirada) - Valores conferem',
        status: isValid ? 'ok' : 'error',
        message: isValid ? 'Valores das justificativas conferem com o total' : 'Valores das justificativas não conferem com o total'
      });
    }
    
    // Verificar se há valores preenchidos
    const hasEntries = totalEntradas > 0;
    items.push({
      id: 'has-entries',
      label: 'Há valores de entrada registrados',
      status: hasEntries ? 'ok' : 'warning',
      message: hasEntries ? 'Valores de entrada registrados' : 'Nenhum valor de entrada registrado'
    });
    
    const allOk = items.every(item => item.status === 'ok');
    const hasErrors = items.some(item => item.status === 'error');
    
    return { items, allOk, hasErrors };
  }, [entries, exits, totalEntradas, validatePixContaValues, validateCartaoLinkValues, validateBoletosValues, validateSaidaValues]);
  
  // Estados para múltiplas devoluções
  const [novaDevolucaoNome, setNovaDevolucaoNome] = useState('');
  const [novaDevolucaoCpf, setNovaDevolucaoCpf] = useState('');
  const [novaDevolucaoValor, setNovaDevolucaoValor] = useState(0);
  
  // Estados para múltiplos envios de correios
  const [novoEnvioCorreiosTipo, setNovoEnvioCorreiosTipo] = useState<'' | 'PAC' | 'SEDEX'>('');
  const [novoEnvioCorreiosEstado, setNovoEnvioCorreiosEstado] = useState('');
  const [novoEnvioCorreiosCliente, setNovoEnvioCorreiosCliente] = useState('');
  const [novoEnvioCorreiosValor, setNovoEnvioCorreiosValor] = useState(0);
  const [novoEnvioCorreiosIncluido, setNovoEnvioCorreiosIncluido] = useState(false);

  // Estados para múltiplas saídas retiradas
  const [novaSaidaRetiradaDescricao, setNovaSaidaRetiradaDescricao] = useState('');
  const [novaSaidaRetiradaValor, setNovaSaidaRetiradaValor] = useState(0);
  const [novaSaidaRetiradaIncluida, setNovaSaidaRetiradaIncluida] = useState(false);
  // Estados para modal de adicionar saída retirada
  const [showModalAdicionarSaida, setShowModalAdicionarSaida] = useState(false);
  const [tipoSaidaSelecionado, setTipoSaidaSelecionado] = useState<'compra' | 'dinheiro' | null>(null);
  const [novaSaidaJustificativa, setNovaSaidaJustificativa] = useState('');
  const [novaSaidaValor, setNovaSaidaValor] = useState(0);
  // Estados para edição de saída
  const [editandoSaidaIndex, setEditandoSaidaIndex] = useState<number | null>(null);
  const [saidaEditandoTipo, setSaidaEditandoTipo] = useState<'compra' | 'dinheiro' | null>(null);
  const [saidaEditandoJustificativa, setSaidaEditandoJustificativa] = useState('');
  const [saidaEditandoValor, setSaidaEditandoValor] = useState(0);

  // Memoizar cálculos pesados para evitar re-renderizações
  const totalPixContaClientes = useMemo(() => {
    return Array.isArray(entries.pixContaClientes) 
      ? entries.pixContaClientes.reduce((sum, cliente) => sum + (Number(cliente.valor) || 0), 0)
      : 0;
  }, [entries.pixContaClientes]);

  const totalCartaoLinkClientes = useMemo(() => {
    return Array.isArray(entries.cartaoLinkClientes)
      ? entries.cartaoLinkClientes.reduce((sum, cliente) => sum + (Number(cliente.valor) || 0), 0)
      : 0;
  }, [entries.cartaoLinkClientes]);

  const totalBoletosClientes = useMemo(() => {
    return Array.isArray(entries.boletosClientes)
      ? entries.boletosClientes.reduce((sum, cliente) => sum + (Number(cliente.valor) || 0), 0)
      : 0;
  }, [entries.boletosClientes]);

  // Calcular total de taxas
  const totalTaxas = useMemo(() => {
    return Array.isArray(entries.taxas)
      ? entries.taxas.reduce((sum, taxa) => sum + (Number(taxa.valor) || 0), 0)
      : 0;
  }, [entries.taxas]);

  const totalJustificativasSaida = useMemo(() => {
    // Calcular total das saídas retiradas (novo sistema)
    const totalSaidasRetiradas = Array.isArray(exits.saidasRetiradas)
      ? exits.saidasRetiradas.reduce((sum, sr) => sum + (Number(sr.valor) || 0), 0)
      : 0;
    
    // Manter compatibilidade com campos legados
    const totalLegado = exits.valorCompra + exits.valorSaidaDinheiro;
    
    // Retornar o maior valor (se houver saídas retiradas, usar elas; senão usar legado)
    return totalSaidasRetiradas > 0 ? totalSaidasRetiradas : totalLegado;
  }, [exits.saidasRetiradas, exits.valorCompra, exits.valorSaidaDinheiro]);

  // Lista de estados brasileiros
  const estadosBrasileiros = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  // Estados para transportadora
  const [novoEnvioTransportadoraNome, setNovoEnvioTransportadoraNome] = useState('');
  const [novoEnvioTransportadoraEstado, setNovoEnvioTransportadoraEstado] = useState('');
  const [novoEnvioTransportadoraPeso, setNovoEnvioTransportadoraPeso] = useState(0);
  const [novoEnvioTransportadoraQuantidade, setNovoEnvioTransportadoraQuantidade] = useState(0);
  const [novoEnvioTransportadoraValor, setNovoEnvioTransportadoraValor] = useState(0);
  const [novoEnvioTransportadoraValorMercadoria, setNovoEnvioTransportadoraValorMercadoria] = useState(0);
  const [novoEnvioTransportadoraNfe, setNovoEnvioTransportadoraNfe] = useState('');
  
  // Estados para múltiplos clientes PIX Conta
  const [novoPixContaClienteNome, setNovoPixContaClienteNome] = useState('');
  const [novoPixContaClienteValor, setNovoPixContaClienteValor] = useState(0);
  
  // Estados para múltiplos clientes Cartão Link
  const [novoCartaoLinkClienteNome, setNovoCartaoLinkClienteNome] = useState('');
  const [novoCartaoLinkClienteValor, setNovoCartaoLinkClienteValor] = useState(0);
  const [novoCartaoLinkClienteParcelas, setNovoCartaoLinkClienteParcelas] = useState(1);
  
  // Estados para múltiplos clientes Boletos
  const [novoBoletosClienteNome, setNovoBoletosClienteNome] = useState('');
  const [novoBoletosClienteValor, setNovoBoletosClienteValor] = useState(0);
  const [novoBoletosClienteParcelas, setNovoBoletosClienteParcelas] = useState(1);
  
  // Estados para cheques
  const [novoChequeBanco, setNovoChequeBanco] = useState('');
  const [novoChequeAgencia, setNovoChequeAgencia] = useState('');
  const [novoChequeNumero, setNovoChequeNumero] = useState('');
  const [novoChequeNomeCliente, setNovoChequeNomeCliente] = useState('');
  const [novoChequeValor, setNovoChequeValor] = useState(0);
  const [novoChequeDataVencimento, setNovoChequeDataVencimento] = useState('');
  const [novoChequeParcelas, setNovoChequeParcelas] = useState(1);
  const [novoChequeTipo, setNovoChequeTipo] = useState<'avista' | 'predatado' | ''>('');
  // Removido mostrarCamposCheque - agora sempre mostra os campos
  
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    isVisible: boolean;
  }>({
    type: 'info',
    message: '',
    isVisible: false
  });

  // Iniciar demo quando o componente for montado
  useEffect(() => {
    if (isDemo && !isDemoActive) {
      startDemo();
    }
  }, [isDemo, isDemoActive, startDemo]);

  // Controlar expiração da demo
  useEffect(() => {
    if (isDemo && timeInfo.isExpired && !showDemoExpiredModal) {
      setShowDemoExpiredModal(true);
    }
  }, [isDemo, timeInfo.isExpired, showDemoExpiredModal]);

  const handleEntryChange = (field: keyof typeof entries, value: string | number | any[]) => {
    const oldValue = entries[field];
    updateEntries(field, value);
    
    // Registrar alteração no log de auditoria
    if (user && oldValue !== value) {
      cashFlowAuditService.logAction(
        user,
        user,
        'update',
        'entry',
        `entry-${field}`,
        field as string,
        oldValue,
        value,
        `Alteração em ${field}: ${oldValue} → ${value}`
      );
    }
  };

  const handleExitChange = (field: keyof typeof exits, value: any) => {
    const oldValue = exits[field];
    updateExits(field, value);
    
    // Registrar alteração no log de auditoria
    if (user && JSON.stringify(oldValue) !== JSON.stringify(value)) {
      cashFlowAuditService.logAction(
        user,
        user,
        'update',
        'exit',
        `exit-${field}`,
        field as string,
        oldValue,
        value,
        `Alteração em ${field}`
      );
    }
  };

  const handleCurrencyInput = (
    field: keyof typeof entries | keyof typeof exits, 
    value: string, 
    isEntry: boolean
  ) => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    if (numbers === '') {
      // Se não há números, define como 0
      if (isEntry) {
        handleEntryChange(field as keyof typeof entries, 0);
      } else {
        handleExitChange(field as keyof typeof exits, 0);
      }
      return;
    }
    
    // Converte para centavos e depois para reais
    const cents = parseInt(numbers);
    const reais = cents / 100;
    
    if (isEntry) {
      handleEntryChange(field as keyof typeof entries, reais);
    } else {
      handleExitChange(field as keyof typeof exits, reais);
    }
  };

  const handleClearForm = () => {
    // Registrar limpeza no log de auditoria
    if (user) {
      cashFlowAuditService.logAction(
        user,
        user,
        'clear',
        'movement',
        'movement-clear',
        undefined,
        { entries, exits },
        undefined,
        'Formulário limpo - todos os campos zerados'
      );
    }
    
    clearForm();
    setObservacoes('');
    setShowConfirmClear(false);
    
    // Disparar webhook de limpeza
    webhookService.triggerEvent('cashflow.cleared', {
      timestamp: new Date().toISOString()
    }, { userId: user || undefined });
    
    setNotification({
      type: 'success',
      message: 'Formulário limpo com sucesso!',
      isVisible: true
    });
  };

  const handleSaveToLocal = () => {
    // Verificar limitações de acesso
    if (!accessControl.canCreateRecords()) {
      setShowAccessLimitation(true);
      return;
    }

    saveToLocal();
    setNotification({
      type: 'success',
      message: 'Dados salvos localmente!',
      isVisible: true
    });
  };

  // Função para formatar CPF ou CNPJ
  const formatCPFCNPJ = (value: string) => {
    let formatted = value.replace(/\D/g, '');
    // Se tiver 11 dígitos ou menos, formata como CPF
    if (formatted.length <= 11) {
      if (formatted.length > 9) {
        formatted = formatted.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      } else if (formatted.length > 6) {
        formatted = formatted.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
      } else if (formatted.length > 3) {
        formatted = formatted.replace(/(\d{3})(\d{3})/, '$1.$2');
      }
    } else {
      // Se tiver mais de 11 dígitos, formata como CNPJ
      if (formatted.length > 12) {
        formatted = formatted.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      } else if (formatted.length > 8) {
        formatted = formatted.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '$1.$2.$3/$4');
      } else if (formatted.length > 5) {
        formatted = formatted.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2.$3');
      } else if (formatted.length > 2) {
        formatted = formatted.replace(/(\d{2})(\d{3})/, '$1.$2');
      }
    }
    return formatted;
  };

  // Função para adicionar nova devolução
  const adicionarDevolucao = () => {
    if (novaDevolucaoCpf && novaDevolucaoValor > 0) {
      const novaDevolucao = {
        nome: novaDevolucaoNome,
        cpf: novaDevolucaoCpf,
        valor: novaDevolucaoValor,
        incluidoNoMovimento: false
      };
      const novasDevolucoes = [...exits.devolucoes, novaDevolucao];
      handleExitChange('devolucoes', novasDevolucoes);
      setNovaDevolucaoNome('');
      setNovaDevolucaoCpf('');
      setNovaDevolucaoValor(0);
    }
  };

  // Função para remover devolução
  const removerDevolucao = (index: number) => {
    const novasDevolucoes = exits.devolucoes.filter((_, i) => i !== index);
    handleExitChange('devolucoes', novasDevolucoes);
  };

  // Função para adicionar novo envio de correios
  const adicionarEnvioCorreios = () => {
    if (novoEnvioCorreiosTipo && novoEnvioCorreiosCliente && novoEnvioCorreiosValor > 0) {
      const novoEnvio = {
        tipo: novoEnvioCorreiosTipo,
        estado: novoEnvioCorreiosEstado,
        cliente: novoEnvioCorreiosCliente,
        valor: novoEnvioCorreiosValor,
        incluidoNoMovimento: novoEnvioCorreiosIncluido
      };
      const novosEnvios = [...exits.enviosCorreios, novoEnvio];
      handleExitChange('enviosCorreios', novosEnvios);
      setNovoEnvioCorreiosTipo('');
      setNovoEnvioCorreiosEstado('');
      setNovoEnvioCorreiosCliente('');
      setNovoEnvioCorreiosValor(0);
      setNovoEnvioCorreiosIncluido(false);
    }
  };

  // Função para remover envio de correios
  const removerEnvioCorreios = (index: number) => {
    const novosEnvios = exits.enviosCorreios.filter((_, i) => i !== index);
    handleExitChange('enviosCorreios', novosEnvios);
  };

  // Função para adicionar nova taxa
  const adicionarTaxa = () => {
    if (novaTaxaNome.trim() && novaTaxaValor > 0) {
      const novaTaxa: Taxa = {
        nome: novaTaxaNome.trim(),
        valor: novaTaxaValor,
      };
      const novasTaxas = [...(entries.taxas || []), novaTaxa];
      handleEntryChange('taxas', novasTaxas);
      setNovaTaxaNome('');
      setNovaTaxaValor(0);
    }
  };

  // Função para remover taxa
  const removerTaxa = (index: number) => {
    const novasTaxas = (entries.taxas || []).filter((_, i) => i !== index);
    handleEntryChange('taxas', novasTaxas);
  };

  // Função para adicionar novo envio via transportadora
  const adicionarEnvioTransportadora = () => {
    if (novoEnvioTransportadoraNome && novoEnvioTransportadoraEstado) {
      const novoEnvio = {
        nomeCliente: novoEnvioTransportadoraNome,
        estado: novoEnvioTransportadoraEstado,
        peso: novoEnvioTransportadoraPeso,
        quantidade: novoEnvioTransportadoraQuantidade,
        valor: novoEnvioTransportadoraValor || 0,
        valorMercadoria: novoEnvioTransportadoraValorMercadoria || undefined,
        numeroNfe: novoEnvioTransportadoraNfe || undefined
      };
      const novosEnvios = [...exits.enviosTransportadora, novoEnvio];
      handleExitChange('enviosTransportadora', novosEnvios);
      setNovoEnvioTransportadoraNome('');
      setNovoEnvioTransportadoraEstado('');
      setNovoEnvioTransportadoraPeso(0);
      setNovoEnvioTransportadoraQuantidade(0);
      setNovoEnvioTransportadoraValor(0);
      setNovoEnvioTransportadoraValorMercadoria(0);
      setNovoEnvioTransportadoraNfe('');
    }
  };

  // Função para remover envio via transportadora
  const removerEnvioTransportadora = (index: number) => {
    const novosEnvios = exits.enviosTransportadora.filter((_, i) => i !== index);
    handleExitChange('enviosTransportadora', novosEnvios);
  };

  // Função para adicionar novo cliente PIX Conta
  const adicionarPixContaCliente = () => {
    if (novoPixContaClienteNome && novoPixContaClienteValor > 0) {
      const novoCliente = {
        nome: novoPixContaClienteNome,
        valor: novoPixContaClienteValor
      };
      const novosClientes = [...entries.pixContaClientes, novoCliente];
      updateEntries('pixContaClientes', novosClientes);
      setNovoPixContaClienteNome('');
      setNovoPixContaClienteValor(0);
    }
  };

  // Função para remover cliente PIX Conta
  const removerPixContaCliente = (index: number) => {
    const novosClientes = entries.pixContaClientes.filter((_, i) => i !== index);
    updateEntries('pixContaClientes', novosClientes);
  };

  // Função para adicionar novo cliente Cartão Link
  const adicionarCartaoLinkCliente = () => {
    if (novoCartaoLinkClienteNome && novoCartaoLinkClienteValor > 0) {
      const novoCliente = {
        nome: novoCartaoLinkClienteNome,
        valor: novoCartaoLinkClienteValor,
        parcelas: novoCartaoLinkClienteParcelas
      };
      const novosClientes = [...entries.cartaoLinkClientes, novoCliente];
      updateEntries('cartaoLinkClientes', novosClientes);
      setNovoCartaoLinkClienteNome('');
      setNovoCartaoLinkClienteValor(0);
      setNovoCartaoLinkClienteParcelas(1);
    }
  };

  // Função para remover cliente Cartão Link
  const removerCartaoLinkCliente = (index: number) => {
    const novosClientes = entries.cartaoLinkClientes.filter((_, i) => i !== index);
    updateEntries('cartaoLinkClientes', novosClientes);
  };

  // Função para adicionar novo cliente Boletos
  const adicionarBoletosCliente = () => {
    if (novoBoletosClienteNome && novoBoletosClienteValor > 0) {
      const novoCliente = {
        nome: novoBoletosClienteNome,
        valor: novoBoletosClienteValor,
        parcelas: novoBoletosClienteParcelas
      };
      const novosClientes = [...entries.boletosClientes, novoCliente];
      updateEntries('boletosClientes', novosClientes);
      setNovoBoletosClienteNome('');
      setNovoBoletosClienteValor(0);
      setNovoBoletosClienteParcelas(1);
    }
  };

  // Função para remover cliente Boletos
  const removerBoletosCliente = (index: number) => {
    const novosClientes = entries.boletosClientes.filter((_, i) => i !== index);
    updateEntries('boletosClientes', novosClientes);
  };

  // Função para adicionar nova saída retirada (legado - mantido para compatibilidade)
  const adicionarNovaSaidaRetirada = () => {
    if (novaSaidaRetiradaDescricao && novaSaidaRetiradaValor > 0) {
      const novaSaida = {
        descricao: novaSaidaRetiradaDescricao,
        valor: novaSaidaRetiradaValor,
        incluidoNoMovimento: novaSaidaRetiradaIncluida
      };
      adicionarSaidaRetirada(novaSaida);
      setNovaSaidaRetiradaDescricao('');
      setNovaSaidaRetiradaValor(0);
      setNovaSaidaRetiradaIncluida(false);
    }
  };

  // Função para adicionar nova saída retirada (novo sistema com tipo)
  const adicionarNovaSaidaRetiradaComTipo = () => {
    if (tipoSaidaSelecionado && novaSaidaJustificativa && novaSaidaValor > 0) {
      const novaSaida = {
        descricao: `${tipoSaidaSelecionado === 'compra' ? 'Compra' : 'Saída de Dinheiro'}: ${novaSaidaJustificativa}`,
        valor: novaSaidaValor,
        incluidoNoMovimento: false
      };
      adicionarSaidaRetirada(novaSaida);
      
      // Limpar campos
      setTipoSaidaSelecionado(null);
      setNovaSaidaJustificativa('');
      setNovaSaidaValor(0);
      setShowModalAdicionarSaida(false);
    }
  };

  // Função para iniciar edição de saída
  const iniciarEdicaoSaida = (index: number) => {
    const saida = exits.saidasRetiradas[index];
    if (saida) {
      const isCompra = saida.descricao.toLowerCase().includes('compra');
      const justificativa = saida.descricao.replace(/^(Compra|Saída de Dinheiro):\s*/, '');
      
      setEditandoSaidaIndex(index);
      setSaidaEditandoTipo(isCompra ? 'compra' : 'dinheiro');
      setSaidaEditandoJustificativa(justificativa);
      setSaidaEditandoValor(saida.valor);
      setShowModalAdicionarSaida(true);
    }
  };

  // Função para salvar edição de saída
  const salvarEdicaoSaida = () => {
    if (editandoSaidaIndex !== null && saidaEditandoTipo && saidaEditandoJustificativa && saidaEditandoValor > 0) {
      const saidaEditada = {
        descricao: `${saidaEditandoTipo === 'compra' ? 'Compra' : 'Saída de Dinheiro'}: ${saidaEditandoJustificativa}`,
        valor: saidaEditandoValor,
        incluidoNoMovimento: exits.saidasRetiradas[editandoSaidaIndex].incluidoNoMovimento
      };
      atualizarSaidaRetirada(editandoSaidaIndex, saidaEditada);
      
      // Limpar campos
      setEditandoSaidaIndex(null);
      setSaidaEditandoTipo(null);
      setSaidaEditandoJustificativa('');
      setSaidaEditandoValor(0);
      setShowModalAdicionarSaida(false);
    }
  };

  // Atalhos de teclado
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || (e as any).metaKey;
      const k = (e.key || '').toLowerCase();
      const target = e.target as HTMLElement;
      
      // Não executar atalhos se estiver digitando em inputs, textareas, etc
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      // Esc - Fechar modais
      if (k === 'escape' && !isInputFocused) {
        // Fechar modais na ordem de prioridade
        if (showModalAdicionarSaida) {
          setShowModalAdicionarSaida(false);
          setTipoSaidaSelecionado(null);
          setNovaSaidaJustificativa('');
          setNovaSaidaValor(0);
          setEditandoSaidaIndex(null);
          setSaidaEditandoTipo(null);
          setSaidaEditandoJustificativa('');
          setSaidaEditandoValor(0);
          e.preventDefault();
          return;
        }
        if (showSearchModal) {
          setShowSearchModal(false);
          setSearchTerm('');
          e.preventDefault();
          return;
        }
        if (showCancelamentosModal) {
          setShowCancelamentosModal(false);
          e.preventDefault();
          return;
        }
        if (showFundoCaixaModal) {
          setShowFundoCaixaModal(false);
          setPimCode('');
          setNovoFundoCaixa('');
          setPimError('');
          e.preventDefault();
          return;
        }
        if (showDashboard) {
          setShowDashboard(false);
          e.preventDefault();
          return;
        }
        if (showSavedRecords) {
          setShowSavedRecords(false);
          e.preventDefault();
          return;
        }
        if (showAlertCenter) {
          setShowAlertCenter(false);
          e.preventDefault();
          return;
        }
        if (showBackupModal) {
          setShowBackupModal(false);
          e.preventDefault();
          return;
        }
        if (showValidationModal) {
          setShowValidationModal(false);
          e.preventDefault();
          return;
        }
        if (showTemplatesModal) {
          setShowTemplatesModal(false);
          e.preventDefault();
          return;
        }
        if (showPDVIntegrationModal) {
          setShowPDVIntegrationModal(false);
          e.preventDefault();
          return;
        }
        if (showWebhooksModal) {
          setShowWebhooksModal(false);
          e.preventDefault();
          return;
        }
        if (showChartsModal) {
          setShowChartsModal(false);
          e.preventDefault();
          return;
        }
        if (showOwnerPanel) {
          setShowOwnerPanel(false);
          e.preventDefault();
          return;
        }
      }
      
      // Enter - Confirmar em modais (apenas se não estiver em input de texto)
      if (k === 'enter' && !isInputFocused) {
        if (showModalAdicionarSaida) {
          if (editandoSaidaIndex !== null) {
            salvarEdicaoSaida();
          } else if (tipoSaidaSelecionado && novaSaidaJustificativa && novaSaidaValor > 0) {
            adicionarNovaSaidaRetiradaComTipo();
          }
          e.preventDefault();
          return;
        }
      }
      
      // Atalhos com Ctrl (não funcionam quando digitando em inputs)
      if (!isCtrl || isInputFocused) return;
      
      // Ctrl+S - Salvar
      if (k === 's') {
        e.preventDefault();
        handleSaveWithValidation();
        return;
      }
      
      // Ctrl+F - Buscar
      if (k === 'f') {
        e.preventDefault();
        setShowSearchModal(true);
        // Focar no campo de busca após um pequeno delay
        setTimeout(() => {
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
        }, 100);
        return;
      }
      
      // Ctrl+P - Imprimir
      if (k === 'p') {
        e.preventDefault();
        printCashFlow({
          entries,
          exits,
          total,
          date: new Date().toISOString(),
          cancelamentos,
          observacoes: observacoes || undefined
        }, false, anexarObservacoes);
        return;
      }
      
      // Ctrl+L - Limpar
      if (k === 'l') {
        e.preventDefault();
        setShowConfirmClear(true);
        return;
      }
      
      // Ctrl+T - Templates
      if (k === 't') {
        e.preventDefault();
        setShowTemplatesModal(true);
        return;
      }
      
      // Ctrl+D - Toggle Dark Mode
      if (k === 'd') {
        e.preventDefault();
        toggleDarkMode();
        return;
      }
      
      // Ctrl+Shift+F - Fechar movimento (mudado de Ctrl+F)
      if (k === 'f' && e.shiftKey) {
        e.preventDefault();
        handleFecharMovimento();
        return;
      }
    };
    
    window.addEventListener('keydown', handler as any);
    return () => window.removeEventListener('keydown', handler as any);
  }, [
    handleSaveWithValidation, 
    handleFecharMovimento, 
    toggleDarkMode, 
    entries, 
    exits, 
    total, 
    cancelamentos,
    showModalAdicionarSaida,
    showSearchModal,
    showCancelamentosModal,
    showFundoCaixaModal,
    showDashboard,
    showSavedRecords,
    showAlertCenter,
    showBackupModal,
    showValidationModal,
    showTemplatesModal,
    showPDVIntegrationModal,
    showWebhooksModal,
    showChartsModal,
    showOwnerPanel,
    tipoSaidaSelecionado,
    novaSaidaJustificativa,
    novaSaidaValor,
    editandoSaidaIndex,
    salvarEdicaoSaida,
    adicionarNovaSaidaRetiradaComTipo
  ]);

  // Função para adicionar novo cheque (com suporte a à vista e predatado)
  const adicionarNovoCheque = () => {
    if (novoChequeBanco && novoChequeAgencia && novoChequeNumero && novoChequeNomeCliente && novoChequeValor > 0 && novoChequeTipo) {
      if (novoChequeTipo === 'avista') {
        // Cheque à vista - valor único
        const novoCheque = {
          banco: novoChequeBanco,
          agencia: novoChequeAgencia,
          numeroCheque: novoChequeNumero,
          nomeCliente: novoChequeNomeCliente,
          valor: novoChequeValor,
          dataVencimento: undefined // À vista não tem data de vencimento
        };
        adicionarCheque(novoCheque);
        
        setNotification({
          type: 'success',
          message: `Cheque à vista de ${formatCurrency(novoChequeValor)} adicionado com sucesso!`,
          isVisible: true
        });
      } else if (novoChequeTipo === 'predatado') {
        // Cheque predatado - pode ser parcelado
        const valorPorParcela = novoChequeValor / novoChequeParcelas;
        
        // Criar cheques para cada parcela
        for (let i = 0; i < novoChequeParcelas; i++) {
          const dataVencimento = new Date();
          if (novoChequeDataVencimento) {
            dataVencimento.setTime(new Date(novoChequeDataVencimento).getTime());
          }
          // Adicionar meses para cada parcela
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
          
          const novoCheque = {
            banco: novoChequeBanco,
            agencia: novoChequeAgencia,
            numeroCheque: `${novoChequeNumero}-${i + 1}`, // Adicionar sufixo da parcela
            nomeCliente: novoChequeNomeCliente,
            valor: valorPorParcela,
            dataVencimento: dataVencimento.toISOString().split('T')[0]
          };
          adicionarCheque(novoCheque);
        }
        
        setNotification({
          type: 'success',
          message: `${novoChequeParcelas} cheque(s) predatado(s) de ${formatCurrency(novoChequeValor)} adicionado(s) com sucesso!`,
          isVisible: true
        });
      }
      
      // Limpar campos
      setNovoChequeBanco('');
      setNovoChequeAgencia('');
      setNovoChequeNumero('');
      setNovoChequeNomeCliente('');
      setNovoChequeValor(0);
      setNovoChequeDataVencimento('');
      setNovoChequeParcelas(1);
      setNovoChequeTipo('');
    }
  };

  // Função para remover cheque
  const removerNovoCheque = (index: number) => {
    removerCheque(index);
  };

  // Função para formatar valores de entrada
  const formatInputValue = (value: number) => {
    if (value === 0) return '';
    return formatCurrency(value);
  };

  // Carregar observações ao inicializar
  useEffect(() => {
    const savedData = localStorage.getItem('cashFlowData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.observacoes) {
          setObservacoes(parsed.observacoes);
        }
      } catch (error) {
        // Ignorar erro
      }
    }
  }, []);

  const handleLoadFromLocal = () => {
    loadFromLocal();
    // Carregar observações do localStorage
    const savedData = localStorage.getItem('cashFlowData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.observacoes) {
          setObservacoes(parsed.observacoes);
        } else {
          setObservacoes('');
        }
      } catch (error) {
        setObservacoes('');
      }
    } else {
      setObservacoes('');
    }
    setNotification({
      type: 'info',
      message: 'Dados carregados do armazenamento local!',
      isVisible: true
    });
  };


  // Função para confirmar fechamento e zerar valores
  const handleConfirmFechamento = () => {
    clearForm();
    setShowConfirmFechamento(false);
    setNotification({
      type: 'success',
      message: 'Movimento confirmado e valores zerados com sucesso!',
      isVisible: true
    });
  };

  const cashFlowData = {
    entries,
    exits,
    total,
    date: new Date().toISOString(),
    cancelamentos,
    observacoes: observacoes || undefined
  };



  // Calcular total sempre que entries ou exits mudarem
  useEffect(() => {
    const totalEntradas = 
      entries.dinheiro + 
      entries.fundoCaixa + 
      entries.cartao + 
      entries.cartaoLink + 
      entries.boletos + 
      entries.pixMaquininha + 
      entries.pixConta +
      // entries.cheque removido - agora é calculado pela soma dos cheques individuais
      totalTaxas +
      totalEnviosCorreios;

    // Calcular total das devoluções incluídas no movimento
    const totalDevolucoes = Array.isArray(exits.devolucoes)
      ? exits.devolucoes
          .filter(devolucao => devolucao.incluidoNoMovimento)
          .reduce((sum, devolucao) => sum + (Number(devolucao.valor) || 0), 0)
      : 0;

    // Vales de funcionários
    const totalValesFuncionarios = Array.isArray(exits.valesFuncionarios)
      ? exits.valesFuncionarios.reduce((sum: number, item: { nome: string; valor: number }) => sum + (Number(item.valor) || 0), 0)
      : 0;
    const valesImpactoEntrada = exits.valesIncluidosNoMovimento ? totalValesFuncionarios : 0;

    // Total final (sincronizado com o hook)
    const totalFinal = totalEntradas + totalCheques + totalDevolucoes + valesImpactoEntrada;

    // O total exibido no card é calculado pelo hook e já inclui as entradas opcionais
  }, [entries, exits]);



  const totalCancelamentos = useMemo(() => (
    cancelamentos.reduce((total, c) => total + c.valor, 0)
  ), [cancelamentos]);

  return (
    <>
      <div 
        ref={systemContainerRef} 
        className={`min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 relative ${
          isFullscreen ? 'overflow-y-auto h-screen' : 'overflow-hidden'
        }`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-indigo-100/20"></div>
        </div>
        <div className="relative z-10">
        {/* HEADER COMPACTO E MODERNO */}
        <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-3 sm:py-0 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg transform hover:rotate-12 transition-all duration-300 relative overflow-hidden group">
                    <Calculator className="w-5 h-5 text-white relative z-10" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></div>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {isDemo ? 'Demonstração - Movimento de Caixa' : 'Movimento de Caixa'}
                  </h1>
                  <p className="text-purple-200 text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    {isDemo ? 'Teste todas as funcionalidades' : 'Controle financeiro automatizado'}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-row items-center gap-2">
                {isDemo && onBackToLanding ? (
                  <button
                    onClick={onBackToLanding}
                    className="group flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm font-medium"
                  >
                    <span>←</span>
                    <span className="hidden sm:inline">Voltar</span>
                  </button>
                ) : (
                  <>
                    {/* Informações do Usuário */}
                    <div className="text-right hidden sm:block">
                      <p className="text-purple-200 text-xs">Usuário</p>
                      <p className="font-semibold text-white text-sm">{user}</p>
                    </div>
                    
                    {/* Botões de Sistema */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowOwnerPanel(true)}
                        className="flex items-center space-x-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs font-medium"
                      >
                        <Building className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Proprietário</span>
                      </button>
                      {!onBackToLanding && (
                        <button
                          onClick={logout}
                          className="flex items-center space-x-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-all duration-200 text-xs font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Sair</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Demo Timer */}
        {isDemo && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <DemoTimer timeInfo={timeInfo} />
          </div>
        )}

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">

          {/* Botões de Acesso Rápido - Compacto */}
          <section className="mb-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 p-2.5">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowDashboard(true)}
                  className="flex items-center justify-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-all duration-200 text-xs font-medium"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setShowSavedRecords(true)}
                  className="flex items-center justify-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all duration-200 text-xs font-medium"
                >
                  <FileText className="w-4 h-4" />
                  <span>Registros</span>
                </button>
                <button
                  onClick={() => setShowAlertCenter(true)}
                  className="relative flex items-center justify-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition-all duration-200 text-xs font-medium"
                >
                  <Bell className="w-4 h-4" />
                  <span>Alertas</span>
                  {unreadAlertsCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                      {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowBackupModal(true)}
                  className="flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-xs font-medium"
                >
                  <FileText className="w-4 h-4" />
                  <span>Backup</span>
                </button>
                <button
                  onClick={() => setShowValidationModal(true)}
                  className="relative flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all duration-200 text-xs font-medium"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validação</span>
                  {validationResult && (!validationResult.isValid || validationResult.warnings.length > 0) && (
                    <span className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                      !
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setShowTemplatesModal(true)}
                  className="flex items-center justify-center gap-1.5 bg-pink-600 text-white px-3 py-1.5 rounded-lg hover:bg-pink-700 transition-all duration-200 text-xs font-medium"
                  title="Templates (Ctrl+T)"
                >
                  <FileText className="w-4 h-4" />
                  <span>Templates</span>
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center justify-center gap-1.5 bg-gray-700 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all duration-200 text-xs font-medium"
                  title="Modo Escuro (Ctrl+D)"
                >
                  {isDark ? (
                    <>
                      <span className="text-sm">☀️</span>
                      <span>Claro</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">🌙</span>
                      <span>Escuro</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowChartsModal(true)}
                  className="flex items-center justify-center gap-1.5 bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-all duration-200 text-xs font-medium"
                  title="Gráficos e Visualizações"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Gráficos</span>
                </button>
                <button
                  onClick={() => setShowPDVIntegrationModal(true)}
                  className="flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all duration-200 text-xs font-medium"
                  title="Integração com PDV"
                >
                  <Download className="w-4 h-4" />
                  <span>PDV</span>
                </button>
                <button
                  onClick={() => setShowWebhooksModal(true)}
                  className="flex items-center justify-center gap-1.5 bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-all duration-200 text-xs font-medium"
                  title="Webhooks"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Webhooks</span>
                </button>
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center justify-center gap-1.5 bg-slate-600 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-all duration-200 text-xs font-medium"
                  title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      <span>Sair Tela Cheia</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" />
                      <span>Tela Cheia</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Painel de Acompanhamento Diário - Compacto */}
          <section className="mb-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50">
              <div className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Desempenho Diário</h2>
                    <p className="text-xs text-gray-500">Acompanhe o progresso das metas</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditingDailyGoal ? (
                      <>
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={dailyGoalDraft}
                          onChange={(e) => setDailyGoalDraft(e.target.value)}
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleDailyGoalSave}
                          className="px-2.5 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={handleDailyGoalCancel}
                          className="px-2.5 py-1.5 bg-gray-100 text-xs rounded-lg hover:bg-gray-200 transition"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditingDailyGoal(true)}
                        className="px-3 py-1.5 bg-indigo-500 text-white text-xs rounded-lg hover:bg-indigo-600 transition"
                      >
                        Editar Meta
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div className="bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 text-white rounded-xl p-4 shadow-md">
                    <p className="text-xs opacity-90">Meta Diária</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(dailyGoal)}</p>
                    {lastClosingRecord && (
                      <p className="text-[10px] opacity-80 mt-2">
                        Último: {new Date(lastClosingRecord.date).toLocaleDateString('pt-BR')} ({formatCurrency(lastClosingRecord.entradas)})
                      </p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs text-gray-500">Progresso Hoje</p>
                        <p className="text-xl font-bold text-gray-800">{formatCurrency(totalEntradas)}</p>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600">{progressPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all`}
                        style={{ width: `${Math.min(progressPercent, 130)}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1.5">
                      {progressPercent >= 100 ? '✅ Meta atingida' : 'Em andamento'}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-2">Comparativo com Ontem</p>
                    {variationValor === null ? (
                      <p className="text-xs text-gray-500">Sem registro anterior</p>
                    ) : (
                      <div>
                        <p className={`text-xl font-bold ${variationValor >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {variationValor >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(variationValor))}
                        </p>
                        {variationPercent !== null && (
                          <p className="text-[10px] text-gray-500 mt-1">
                            {variationPercent >= 0 ? 'Acima' : 'Abaixo'} {Math.abs(variationPercent).toFixed(1)}%
                          </p>
                        )}
                        {previousDayRecord && (
                          <p className="text-[10px] text-gray-400 mt-1">
                            Ontem: {formatCurrency(previousDayRecord.entradas)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* FORMULÁRIO DE ENTRADAS */}
            <div className="xl:col-span-2 space-y-4">
              {/* ENTRADAS */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50">
                <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white p-4 rounded-t-xl">
                  <h2 className="text-lg font-bold flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    ENTRADAS
                    <span className="ml-auto text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded cursor-pointer" onClick={() => setMostrarEntradas(v=>!v)}>
                      {mostrarEntradas ? '▼' : '▶'}
                    </span>
                  </h2>
                </div>
                {mostrarEntradas && (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Dinheiro
                      </label>
                      <input
                        type="text"
                        value={formatInputValue(entries.dinheiro)}
                        onChange={(e) => handleCurrencyInput('dinheiro', e.target.value, true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="R$ 0,00"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                        Fundo de Caixa
                        <button
                          type="button"
                          onClick={() => {
                            setShowFundoCaixaModal(true);
                            setPimCode('');
                            setNovoFundoCaixa('');
                            setPimError('');
                          }}
                          className="text-blue-500 hover:text-blue-700 text-xs px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                          title="Alterar valor padrão do Fundo de Caixa"
                        >
                          ✏️
                        </button>
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(entries.fundoCaixa)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-sm"
                        placeholder="R$ 400,00"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Cartão
                      </label>
                      <input
                        type="text"
                        value={formatInputValue(entries.cartao)}
                        onChange={(e) => handleCurrencyInput('cartao', e.target.value, true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="R$ 0,00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        Cartão Link
                        <HelpTooltip text="Valor total recebido via link de pagamento com cartão. Adicione os clientes abaixo com seus valores e parcelas." />
                      </label>
                      <input
                        type="text"
                        value={formatInputValue(entries.cartaoLink)}
                        onChange={(e) => handleCurrencyInput('cartaoLink', e.target.value, true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 focus:shadow-lg"
                        placeholder="R$ 0,00"
                      />
                      <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                        <span className="font-medium">Total: {formatCurrency(entries.cartaoLink)}</span>
                        <button type="button" onClick={() => setShowCartaoLinkDetails(v=>!v)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
                          {showCartaoLinkDetails ? 'Recolher' : 'Expandir'}
                        </button>
                      </div>
                      {entries.cartaoLink > 0 && showCartaoLinkDetails && (
                        <div className="mt-6 border-t border-gray-200 pt-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">💳</span>
                            </div>
                            Clientes Cartão Link
                          </h3>
                          
                          {/* Formulário para adicionar novo cliente */}
                          <div className="space-y-4 mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Nome do Cliente
                                </label>
                                <input
                                  type="text"
                                  value={novoCartaoLinkClienteNome}
                                  onChange={(e) => setNovoCartaoLinkClienteNome(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-blue-300 focus:shadow-lg"
                                  placeholder="Nome do cliente"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Valor
                                </label>
                                <input
                                  type="text"
                                  value={formatInputValue(novoCartaoLinkClienteValor)}
                                  onChange={(e) => {
                                    const numbers = e.target.value.replace(/\D/g, '');
                                    const cents = numbers === '' ? 0 : parseInt(numbers);
                                    const reais = cents / 100;
                                    setNovoCartaoLinkClienteValor(reais);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-blue-300 focus:shadow-lg"
                                  placeholder="R$ 0,00"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Parcelas
                                </label>
                                <select
                                  value={novoCartaoLinkClienteParcelas}
                                  onChange={(e) => setNovoCartaoLinkClienteParcelas(parseInt(e.target.value) || 1)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-blue-300 focus:shadow-lg"
                                >
                                  <option value={1}>1x</option>
                                  <option value={2}>2x</option>
                                  <option value={3}>3x</option>
                                  <option value={4}>4x</option>
                                  <option value={5}>5x</option>
                                  <option value={6}>6x</option>
                                  <option value={7}>7x</option>
                                  <option value={8}>8x</option>
                                  <option value={9}>9x</option>
                                  <option value={10}>10x</option>
                                  <option value={11}>11x</option>
                                  <option value={12}>12x</option>
                                </select>
                              </div>
                            </div>
                            {novoCartaoLinkClienteNome && novoCartaoLinkClienteValor > 0 && (
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={adicionarCartaoLinkCliente}
                                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                                  title="Adicionar cliente"
                                >
                                  ➕ Adicionar Cliente Cartão Link
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Lista de clientes Cartão Link */}
                          {Array.isArray(entries.cartaoLinkClientes) && entries.cartaoLinkClientes.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-700">Clientes Registrados:</h4>
                              {entries.cartaoLinkClientes.map((cliente, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{cliente.nome}</div>
                                    <div className="text-sm text-gray-600">
                                      Valor: {formatCurrency(cliente.valor)} | Parcelas: {cliente.parcelas}x
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removerCartaoLinkCliente(index)}
                                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm font-medium"
                                    title="Remover cliente"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Validação dos valores */}
                          {Array.isArray(entries.cartaoLinkClientes) && entries.cartaoLinkClientes.length > 0 && (
                            <div className={`mt-4 p-3 rounded-xl border text-sm ${
                              totalCartaoLinkClientes === entries.cartaoLink
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                {totalCartaoLinkClientes === entries.cartaoLink ? (
                                  <span className="text-green-600">✅</span>
                                ) : (
                                  <span className="text-red-600">❌</span>
                                )}
                                <span className="font-medium">
                                  {totalCartaoLinkClientes === entries.cartaoLink
                                    ? 'Valores Conferem'
                                    : 'Valores Não Conferem'
                                  }
                                </span>
                              </div>
                              <div className="text-xs space-y-1">
                                <div>Total dos Clientes: {formatCurrency(totalCartaoLinkClientes)}</div>
                                <div className="font-medium">
                                  Valor Cartão Link: {formatCurrency(entries.cartaoLink)}
                                </div>
                                {totalCartaoLinkClientes !== entries.cartaoLink && (
                                  <div className="font-bold mt-1">
                                    Diferença: {formatCurrency(Math.abs(totalCartaoLinkClientes - entries.cartaoLink))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        Boletos
                        <HelpTooltip text="Valor total recebido via boletos bancários. Adicione os clientes abaixo com seus valores e parcelas." />
                      </label>
                      <input
                        type="text"
                        value={formatInputValue(entries.boletos)}
                        onChange={(e) => handleCurrencyInput('boletos', e.target.value, true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 focus:shadow-lg"
                        placeholder="R$ 0,00"
                      />
                      <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                        <span className="font-medium">Total: {formatCurrency(entries.boletos)}</span>
                        <button type="button" onClick={() => setShowBoletosDetails(v=>!v)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
                          {showBoletosDetails ? 'Recolher' : 'Expandir'}
                        </button>
                      </div>
                      {entries.boletos > 0 && showBoletosDetails && (
                        <div className="mt-6 border-t border-gray-200 pt-6">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">📄</span>
                            </div>
                            Clientes Boletos
                          </h3>
                          
                          {/* Formulário para adicionar novo cliente */}
                          <div className="space-y-4 mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Nome do Cliente
                                </label>
                                <input
                                  type="text"
                                  value={novoBoletosClienteNome}
                                  onChange={(e) => setNovoBoletosClienteNome(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-blue-300 focus:shadow-lg"
                                  placeholder="Nome do cliente"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Valor
                                </label>
                                <input
                                  type="text"
                                  value={formatInputValue(novoBoletosClienteValor)}
                                  onChange={(e) => {
                                    const numbers = e.target.value.replace(/\D/g, '');
                                    const cents = numbers === '' ? 0 : parseInt(numbers);
                                    const reais = cents / 100;
                                    setNovoBoletosClienteValor(reais);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-blue-300 focus:shadow-lg"
                                  placeholder="R$ 0,00"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Parcelas
                                </label>
                                <select
                                  value={novoBoletosClienteParcelas}
                                  onChange={(e) => setNovoBoletosClienteParcelas(parseInt(e.target.value) || 1)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200 hover:border-blue-300 focus:shadow-lg"
                                >
                                  <option value={1}>1x</option>
                                  <option value={2}>2x</option>
                                  <option value={3}>3x</option>
                                  <option value={4}>4x</option>
                                  <option value={5}>5x</option>
                                  <option value={6}>6x</option>
                                  <option value={7}>7x</option>
                                  <option value={8}>8x</option>
                                  <option value={9}>9x</option>
                                  <option value={10}>10x</option>
                                  <option value={11}>11x</option>
                                  <option value={12}>12x</option>
                                </select>
                              </div>
                            </div>
                            {novoBoletosClienteNome && novoBoletosClienteValor > 0 && (
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={adicionarBoletosCliente}
                                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                                  title="Adicionar cliente"
                                >
                                  ➕ Adicionar Cliente Boleto
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Lista de clientes Boletos */}
                          {Array.isArray(entries.boletosClientes) && entries.boletosClientes.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-700">Clientes Registrados:</h4>
                              {entries.boletosClientes.map((cliente, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">{cliente.nome}</div>
                                    <div className="text-sm text-gray-600">
                                      Valor: {formatCurrency(cliente.valor)} | Parcelas: {cliente.parcelas}x
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removerBoletosCliente(index)}
                                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm font-medium"
                                    title="Remover cliente"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Validação dos valores */}
                          {Array.isArray(entries.boletosClientes) && entries.boletosClientes.length > 0 && (
                            <div className={`mt-4 p-3 rounded-xl border text-sm ${
                              totalBoletosClientes === entries.boletos
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                {totalBoletosClientes === entries.boletos ? (
                                  <span className="text-green-600">✅</span>
                                ) : (
                                  <span className="text-red-600">❌</span>
                                )}
                                <span className="font-medium">
                                  {totalBoletosClientes === entries.boletos
                                    ? 'Valores Conferem'
                                    : 'Valores Não Conferem'
                                  }
                                </span>
                              </div>
                              <div className="text-xs space-y-1">
                                <div>Total dos Clientes: {formatCurrency(totalBoletosClientes)}</div>
                                <div className="font-medium">
                                  Valor Boletos: {formatCurrency(entries.boletos)}
                                </div>
                                {totalBoletosClientes !== entries.boletos && (
                                  <div className="font-bold mt-1">
                                    Diferença: {formatCurrency(Math.abs(totalBoletosClientes - entries.boletos))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PIX Maquininha
                      </label>
                      <input
                        type="text"
                        value={formatInputValue(entries.pixMaquininha)}
                        onChange={(e) => handleCurrencyInput('pixMaquininha', e.target.value, true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300 focus:shadow-lg"
                        placeholder="R$ 0,00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        PIX Conta
                        <HelpTooltip text="Valor total recebido via PIX na conta bancária. Adicione os clientes abaixo para detalhar os valores individuais." />
                      </label>
                      <input
                        type="text"
                        value={formatInputValue(entries.pixConta)}
                        onChange={(e) => handleCurrencyInput('pixConta', e.target.value, true)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:border-purple-300 focus:shadow-lg"
                        placeholder="R$ 0,00"
                      />
                      <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
                        <span className="font-medium">Total: {formatCurrency(entries.pixConta)}</span>
                        {entries.pixConta > 0 && (
                          <button type="button" onClick={() => setShowPixContaDetails(v=>!v)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
                            {showPixContaDetails ? 'Recolher' : 'Expandir'}
                          </button>
                        )}
                      </div>

                      {/* Seção de Clientes PIX Conta - Diretamente abaixo do campo */}
                      {entries.pixConta > 0 && showPixContaDetails && (
                        <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                          {/* CLIENTES PIX CONTA */}
                          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-xs font-bold">👥</span>
                            </div>
                            Clientes PIX Conta
                          </h3>
                          
                          {/* Formulário para adicionar novo cliente */}
                          <div className="space-y-3 mb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Nome do Cliente
                                </label>
                                <input
                                  type="text"
                                  value={novoPixContaClienteNome}
                                  onChange={(e) => setNovoPixContaClienteNome(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-200 hover:border-purple-300"
                                  placeholder="Nome do cliente"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Valor
                                </label>
                                <input
                                  type="text"
                                  value={formatInputValue(novoPixContaClienteValor)}
                                  onChange={(e) => {
                                    const numbers = e.target.value.replace(/\D/g, '');
                                    const cents = numbers === '' ? 0 : parseInt(numbers);
                                    const reais = cents / 100;
                                    setNovoPixContaClienteValor(reais);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all duration-200 hover:border-purple-300"
                                  placeholder="R$ 0,00"
                                />
                              </div>
                            </div>
                            {novoPixContaClienteNome && novoPixContaClienteValor > 0 && (
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={adicionarPixContaCliente}
                                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg"
                                  title="Adicionar cliente"
                                >
                                  ➕ Adicionar Cliente PIX
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Lista de clientes PIX Conta */}
                          {Array.isArray(entries.pixContaClientes) && entries.pixContaClientes.length > 0 && (
                            <div className="space-y-2 mb-4">
                              <h4 className="text-xs font-medium text-gray-700">Clientes Registrados:</h4>
                              {entries.pixContaClientes.map((cliente, index) => (
                                <div key={index} className="flex items-center justify-between gap-2 p-3 bg-white rounded-lg border border-purple-100 shadow-sm">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-800">{cliente.nome}</div>
                                    <div className="text-xs text-gray-600">
                                      Valor: {formatCurrency(cliente.valor)}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removerPixContaCliente(index)}
                                    className="px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-xs font-medium"
                                    title="Remover cliente"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Validação dos valores */}
                          {Array.isArray(entries.pixContaClientes) && entries.pixContaClientes.length > 0 && (
                            <div className={`p-3 rounded-lg border text-xs ${
                              totalPixContaClientes === entries.pixConta
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                              <div className="flex items-center gap-2 mb-1">
                                {totalPixContaClientes === entries.pixConta ? (
                                  <span className="text-green-600">✅</span>
                                ) : (
                                  <span className="text-red-600">❌</span>
                                )}
                                <span className="font-medium">
                                  {totalPixContaClientes === entries.pixConta
                                    ? 'Valores Conferem'
                                    : 'Valores Não Conferem'
                                  }
                                </span>
                              </div>
                              <div className="text-xs space-y-0.5">
                                <div>Total dos Clientes: {formatCurrency(totalPixContaClientes)}</div>
                                <div className="font-medium">
                                  Valor PIX Conta: {formatCurrency(entries.pixConta)}
                                </div>
                                {totalPixContaClientes !== entries.pixConta && (
                                  <div className="font-bold mt-1">
                                    Diferença: {formatCurrency(Math.abs(totalPixContaClientes - entries.pixConta))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Seção de Cheques */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Valor Total dos Cheques
                        </label>
                        <div className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(totalCheques)}</span>
                          <button type="button" onClick={() => setShowChequesDetails(v=>!v)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
                            {showChequesDetails ? 'Recolher' : 'Expandir'}
                          </button>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 mb-2">
                            {formatCurrency(totalCheques)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {entries.cheques.length > 0 
                              ? `${entries.cheques.length} cheque(s) adicionado(s)` 
                              : 'Nenhum cheque adicionado'
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Taxas <span className="text-xs text-gray-500">(múltiplas taxas)</span>
                        </label>
                        <div className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(totalTaxas)}</span>
                          <button type="button" onClick={() => setShowTaxasDetails(v=>!v)} className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">
                            {showTaxasDetails ? 'Recolher' : 'Expandir'}
                          </button>
                        </div>
                      </div>
                      
                      {showTaxasDetails && (
                        <div className="space-y-4">
                          {/* Formulário para adicionar nova taxa */}
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Adicionar Taxa</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Nome da Taxa
                                </label>
                      <input
                        type="text"
                                  value={novaTaxaNome}
                                  onChange={(e) => setNovaTaxaNome(e.target.value)}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                  placeholder="Ex: Taxa de entrega, Taxa de serviço..."
                                />
                              </div>
                              <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Valor
                          </label>
                          <input
                            type="text"
                                  value={formatInputValue(novaTaxaValor)}
                                  onChange={(e) => {
                                    const numbers = e.target.value.replace(/\D/g, '');
                                    const cents = numbers === '' ? 0 : parseInt(numbers);
                                    const reais = cents / 100;
                                    setNovaTaxaValor(reais);
                                  }}
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                  placeholder="R$ 0,00"
                                />
                              </div>
                              {novaTaxaNome.trim() && novaTaxaValor > 0 && (
                                <button
                                  type="button"
                                  onClick={adicionarTaxa}
                                  className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 text-sm font-medium"
                                >
                                  ➕ Adicionar Taxa
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Lista de taxas adicionadas */}
                          {Array.isArray(entries.taxas) && entries.taxas.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium text-gray-700">Taxas Registradas:</h4>
                              {entries.taxas.map((taxa, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-800">{taxa.nome}</div>
                                    <div className="text-sm text-gray-600">
                                      Valor: {formatCurrency(taxa.valor)}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removerTaxa(index)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm font-medium"
                                    title="Remover taxa"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-sm font-medium text-green-800">
                                  Total de Taxas: {formatCurrency(totalTaxas)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seção de detalhes do cheque */}
                  {showChequesDetails && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs font-bold">📄</span>
                        </div>
                        Adicionar Cheques
                      </h3>
                      
                      {/* Formulário para adicionar novo cheque */}
                      <div className="space-y-4 mb-4">
                        {/* Seleção do tipo de cheque */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Tipo de Cheque
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setNovoChequeTipo('avista')}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                novoChequeTipo === 'avista'
                                  ? 'bg-green-500 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              💰 À Vista
                            </button>
                            <button
                              type="button"
                              onClick={() => setNovoChequeTipo('predatado')}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                novoChequeTipo === 'predatado'
                                  ? 'bg-blue-500 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              📅 Predatado
                            </button>
                          </div>
                        </div>

                        {novoChequeTipo && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Banco
                            </label>
                            <input
                              type="text"
                              value={novoChequeBanco}
                              onChange={(e) => setNovoChequeBanco(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Nome do banco"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Agência
                            </label>
                            <input
                              type="text"
                              value={novoChequeAgencia}
                              onChange={(e) => setNovoChequeAgencia(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Número da agência"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Cheque N°
                            </label>
                            <input
                              type="text"
                              value={novoChequeNumero}
                              onChange={(e) => setNovoChequeNumero(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Número do cheque"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nome do Cliente
                            </label>
                            <input
                              type="text"
                              value={novoChequeNomeCliente}
                              onChange={(e) => setNovoChequeNomeCliente(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Nome do cliente"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Valor
                            </label>
                            <input
                              type="text"
                              value={formatInputValue(novoChequeValor)}
                              onChange={(e) => {
                                const numbers = e.target.value.replace(/\D/g, '');
                                const cents = numbers === '' ? 0 : parseInt(numbers);
                                const reais = cents / 100;
                                setNovoChequeValor(reais);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="R$ 0,00"
                            />
                          </div>
                          {/* Campos específicos para predatado */}
                          {novoChequeTipo === 'predatado' && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Número de Parcelas
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="12"
                                  value={novoChequeParcelas}
                                  onChange={(e) => setNovoChequeParcelas(parseInt(e.target.value) || 1)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  placeholder="1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Data do Primeiro Vencimento
                                </label>
                                <input
                                  type="date"
                                  value={novoChequeDataVencimento}
                                  onChange={(e) => setNovoChequeDataVencimento(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                              </div>
                            </>
                          )}
                          </div>
                        )}
                        
                        {novoChequeBanco && novoChequeAgencia && novoChequeNumero && novoChequeNomeCliente && novoChequeValor > 0 && novoChequeTipo && (
                          <div className="space-y-3">
                            {/* Resumo do cheque */}
                            <div className={`border rounded-lg p-3 ${
                              novoChequeTipo === 'avista' 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-blue-50 border-blue-200'
                            }`}>
                              <div className={`text-sm ${
                                novoChequeTipo === 'avista' ? 'text-green-800' : 'text-blue-800'
                              }`}>
                                <div className="font-medium mb-1">
                                  Resumo do Cheque {novoChequeTipo === 'avista' ? 'À Vista' : 'Predatado'}:
                                </div>
                                <div>• Valor Total: {formatCurrency(novoChequeValor)}</div>
                                {novoChequeTipo === 'predatado' && (
                                  <>
                                    <div>• Parcelas: {novoChequeParcelas}x de {formatCurrency(novoChequeValor / novoChequeParcelas)}</div>
                                    <div>• Primeiro Vencimento: {novoChequeDataVencimento || 'Não definido'}</div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex justify-center">
                              <button
                                type="button"
                                onClick={adicionarNovoCheque}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                                title={`Adicionar cheque ${novoChequeTipo === 'avista' ? 'à vista' : 'predatado'}`}
                              >
                                ➕ Adicionar Cheque {novoChequeTipo === 'avista' ? 'À Vista' : `Predatado (${novoChequeParcelas}x)`}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lista de cheques */}
                      {Array.isArray(entries.cheques) && entries.cheques.length > 0 && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-gray-700">
                            Cheques Adicionados ({entries.cheques.length}):
                          </div>
                          {entries.cheques.map((cheque, index) => (
                            <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div><span className="font-medium">Banco:</span> {cheque.banco}</div>
                                <div><span className="font-medium">Agência:</span> {cheque.agencia}</div>
                                <div><span className="font-medium">Cheque N°:</span> {cheque.numeroCheque}</div>
                                <div><span className="font-medium">Cliente:</span> {cheque.nomeCliente}</div>
                                <div><span className="font-medium">Valor:</span> {formatCurrency(cheque.valor)}</div>
                                <div><span className="font-medium">Vencimento:</span> {cheque.dataVencimento || 'À vista'}</div>
                              </div>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={() => removerCheque(index)}
                                  className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  🗑️ Remover
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
                )}
              </div>


              {/* SAÍDAS */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50">
                <div className="bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 text-white p-4 rounded-t-xl">
                  <h2 className="text-lg font-bold flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    SAÍDAS
                    <span className="ml-auto text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded cursor-pointer" onClick={() => setMostrarSaidas(v=>!v)}>
                      {mostrarSaidas ? '▼' : '▶'}
                    </span>
                  </h2>
                </div>
                {mostrarSaidas && (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Descontos <span className="text-[10px] text-gray-500">(apenas registro)</span>
                      </label>
                      <input
                        type="text"
                        value={formatInputValue(exits.descontos)}
                        onChange={(e) => handleCurrencyInput('descontos', e.target.value, false)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="R$ 0,00"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center">
                        Saída (Retirada) <span className="text-[10px] text-gray-500">(apenas registro)</span>
                        <HelpTooltip text="Valor total retirado do caixa. Adicione múltiplas saídas (compras ou retiradas de dinheiro) que devem somar exatamente este valor." />
                      </label>
                      <input
                        type="text"
                        value={formatInputValue(exits.saida)}
                        onChange={(e) => handleCurrencyInput('saida', e.target.value, false)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-sm"
                        placeholder="R$ 0,00"
                      />
                      
                      {/* Botão para adicionar nova saída */}
                      {exits.saida > 0 && (
                            <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowModalAdicionarSaida(true);
                              setTipoSaidaSelecionado(null);
                              setNovaSaidaJustificativa('');
                              setNovaSaidaValor(0);
                            }}
                            className="w-full px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 transition-all duration-200 text-xs font-medium flex items-center justify-center gap-2"
                          >
                            <span>➕</span>
                            <span>Adicionar Saída</span>
                          </button>
                            </div>
                      )}

                      {/* Lista de saídas retiradas */}
                      {Array.isArray(exits.saidasRetiradas) && exits.saidasRetiradas.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <h4 className="text-xs font-medium text-gray-700">Saídas Adicionadas:</h4>
                          {exits.saidasRetiradas.map((saida, index) => {
                            const isCompra = saida.descricao.toLowerCase().includes('compra');
                            return (
                              <div key={index} className={`p-2.5 rounded-lg border ${
                                isCompra ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
                              }`}>
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className={`text-xs font-semibold ${
                                        isCompra ? 'text-blue-700' : 'text-orange-700'
                                      }`}>
                                        {isCompra ? '🛒 Compra' : '💰 Saída de Dinheiro'}
                                      </span>
                          </div>
                                    <div className="text-xs text-gray-700 mb-1">
                                      {saida.descricao.replace(/^(Compra|Saída de Dinheiro):\s*/, '')}
                            </div>
                                    <div className="text-xs font-semibold text-gray-800">
                                      {formatCurrency(saida.valor)}
                          </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => iniciarEdicaoSaida(index)}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
                                      title="Editar saída"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removerSaidaRetirada(index)}
                                      className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs font-medium"
                                      title="Remover saída"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Validação dos valores */}
                      {exits.saida > 0 && (
                        <div className={`mt-3 p-2.5 rounded-lg border text-xs ${
                              totalJustificativasSaida === exits.saida
                                ? 'bg-green-50 border-green-200 text-green-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                                {totalJustificativasSaida === exits.saida ? (
                                  <span className="text-green-600">✅</span>
                                ) : (
                                  <span className="text-red-600">❌</span>
                                )}
                                <span className="font-medium">
                                  {totalJustificativasSaida === exits.saida
                                    ? 'Valores Conferem'
                                    : 'Valores Não Conferem'
                                  }
                                </span>
                              </div>
                          <div className="space-y-0.5 text-[10px]">
                            <div>Total das Justificativas: {formatCurrency(totalJustificativasSaida)}</div>
                                <div className="font-medium">
                                  Valor Total (Saída Retirada): {formatCurrency(exits.saida)}
                                </div>
                                {totalJustificativasSaida !== exits.saida && (
                              <div className="font-bold text-red-700 mt-1">
                                    ⚠️ Os valores devem bater exatamente! Ajuste os valores para continuar.
                                  </div>
                                )}
                              </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Crédito/Devolução <span className="text-xs text-gray-500">(múltiplas devoluções)</span>
                      </label>
                      
                      {/* Formulário para adicionar nova devolução */}
                      <div className="space-y-4 mb-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nome do Cliente
                            </label>
                            <input
                              type="text"
                              value={novaDevolucaoNome}
                              onChange={(e) => setNovaDevolucaoNome(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                              placeholder="Nome do cliente"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              CPF / CNPJ
                            </label>
                            <input
                              type="text"
                              value={novaDevolucaoCpf}
                              onChange={(e) => setNovaDevolucaoCpf(formatCPFCNPJ(e.target.value))}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                              placeholder="000.000.000-00 ou 00.000.000/0000-00"
                              maxLength={18}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Valor da Devolução
                            </label>
                            <input
                              type="text"
                              value={novaDevolucaoValor === 0 ? '' : formatCurrency(novaDevolucaoValor)}
                              onChange={(e) => {
                                const numbers = e.target.value.replace(/\D/g, '');
                                const cents = numbers === '' ? 0 : parseInt(numbers);
                                const reais = cents / 100;
                                setNovaDevolucaoValor(reais);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                              placeholder="R$ 0,00"
                            />
                          </div>
                        </div>
                        {novaDevolucaoCpf && novaDevolucaoValor > 0 && (
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={adicionarDevolucao}
                              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                              title="Adicionar devolução"
                            >
                              💰 Adicionar Devolução
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Lista de devoluções */}
                          {Array.isArray(exits.devolucoes) && exits.devolucoes.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Devoluções Registradas:</h4>
                          {exits.devolucoes.map((devolucao, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                    <div className="text-sm font-medium">{devolucao.nome ? `Cliente: ${devolucao.nome}` : 'Cliente: —'}</div>
                                    <div className="text-sm text-gray-600">CPF/CNPJ: {devolucao.cpf}</div>
                                <div className="text-sm text-gray-600">Valor: {formatCurrency(devolucao.valor)}</div>
                              </div>
                              <button
                                onClick={() => {
                                  const novasDevolucoes = [...exits.devolucoes];
                                  novasDevolucoes[index].incluidoNoMovimento = !novasDevolucoes[index].incluidoNoMovimento;
                                  handleExitChange('devolucoes', novasDevolucoes);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                  devolucao.incluidoNoMovimento
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                {devolucao.incluidoNoMovimento ? '✅ Incluído' : '➕ Incluir'}
                              </button>
                              <button
                                onClick={() => removerDevolucao(index)}
                                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm font-medium"
                                title="Remover devolução"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}


                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correios/Frete <span className="text-xs text-gray-500">(múltiplos envios)</span>
                      </label>
                      
                      {/* Formulário para adicionar novo envio de correios */}
                      <div className="space-y-4 mb-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Tipo de Envio
                            </label>
                            <select
                              value={novoEnvioCorreiosTipo}
                              onChange={(e) => {
                                const tipo = e.target.value as '' | 'PAC' | 'SEDEX';
                                setNovoEnvioCorreiosTipo(tipo);
                                // Se for SEDEX, preencher automaticamente com SP
                                if (tipo === 'SEDEX') {
                                  setNovoEnvioCorreiosEstado('SP');
                                } else {
                                  setNovoEnvioCorreiosEstado('');
                                }
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                            >
                              <option value="">Selecione o tipo</option>
                              <option value="PAC">PAC</option>
                              <option value="SEDEX">SEDEX</option>
                            </select>
                          </div>
                          {novoEnvioCorreiosTipo && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Estado
                                </label>
                                {novoEnvioCorreiosTipo === 'SEDEX' ? (
                                  <input
                                    type="text"
                                    value={novoEnvioCorreiosEstado}
                                    readOnly
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 text-sm"
                                    placeholder="SP (automático para SEDEX)"
                                  />
                                ) : (
                                  <select
                                    value={novoEnvioCorreiosEstado}
                                    onChange={(e) => setNovoEnvioCorreiosEstado(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                  >
                                    <option value="">Selecione o estado</option>
                                    {estadosBrasileiros.map((estado) => (
                                      <option key={estado} value={estado}>{estado}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Nome do Cliente
                                </label>
                                <input
                                  type="text"
                                  value={novoEnvioCorreiosCliente}
                                  onChange={(e) => setNovoEnvioCorreiosCliente(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                  placeholder="Nome do cliente"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Valor
                                </label>
                                <input
                                  type="text"
                                  value={novoEnvioCorreiosValor === 0 ? '' : formatCurrency(novoEnvioCorreiosValor)}
                                  onChange={(e) => {
                                    const numbers = e.target.value.replace(/\D/g, '');
                                    const cents = numbers === '' ? 0 : parseInt(numbers);
                                    const reais = cents / 100;
                                    setNovoEnvioCorreiosValor(reais);
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                  placeholder="R$ 0,00"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                  <input
                                    type="checkbox"
                                    checked={novoEnvioCorreiosIncluido}
                                    onChange={(e) => setNovoEnvioCorreiosIncluido(e.target.checked)}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                  />
                                  Incluir ao Movimento de Caixa
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                        {novoEnvioCorreiosTipo && novoEnvioCorreiosCliente && novoEnvioCorreiosValor > 0 && (
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={adicionarEnvioCorreios}
                              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                              title="Adicionar envio"
                            >
                              ➕ Adicionar Envio de Correios
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Lista de envios de correios */}
                      {Array.isArray(exits.enviosCorreios) && exits.enviosCorreios.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Envios Registrados:</h4>
                          {exits.enviosCorreios.map((envio, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="text-sm font-medium">{envio.tipo} - {envio.cliente}</div>
                                <div className="text-sm text-gray-600">
                                  Estado: {envio.estado} | Valor: {formatCurrency(envio.valor)}
                                </div>
                                <div className={`text-xs ${envio.incluidoNoMovimento ? 'text-green-600' : 'text-gray-500'}`}>
                                  {envio.incluidoNoMovimento ? '✅ Incluído no Movimento' : '❌ Apenas Registro'}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const novosEnvios = [...exits.enviosCorreios];
                                    novosEnvios[index].incluidoNoMovimento = !novosEnvios[index].incluidoNoMovimento;
                                    handleExitChange('enviosCorreios', novosEnvios);
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                                    envio.incluidoNoMovimento
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  }`}
                                >
                                  {envio.incluidoNoMovimento ? '✅ Incluído' : '➕ Incluir'}
                                </button>
                                <button
                                  onClick={() => removerEnvioCorreios(index)}
                                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm font-medium"
                                  title="Remover envio"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}


                    </div>

                    {/* TRANSPORTADORA */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transportadora <span className="text-xs text-gray-500">(envio para destinatário)</span>
                      </label>
                      
                      {/* Formulário para adicionar novo envio via transportadora */}
                      <div className="space-y-4 mb-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nome do Cliente
                            </label>
                            <input
                              type="text"
                              value={novoEnvioTransportadoraNome}
                              onChange={(e) => setNovoEnvioTransportadoraNome(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                              placeholder="Nome do cliente"
                            />
                          </div>
                          {novoEnvioTransportadoraNome && (
                            <>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Estado
                                </label>
                                <input
                                  type="text"
                                  value={novoEnvioTransportadoraEstado}
                                  onChange={(e) => setNovoEnvioTransportadoraEstado(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                  placeholder="Ex: SP, RJ, MG..."
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Peso (kg)
                                  </label>
                                  <input
                                    type="number"
                                    value={novoEnvioTransportadoraPeso || ''}
                                    onChange={(e) => setNovoEnvioTransportadoraPeso(Number(e.target.value) || 0)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                    placeholder="0.0"
                                    step="0.1"
                                    min="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Quantidade
                                  </label>
                                  <input
                                    type="number"
                                    value={novoEnvioTransportadoraQuantidade || ''}
                                    onChange={(e) => setNovoEnvioTransportadoraQuantidade(Number(e.target.value) || 0)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                    placeholder="1"
                                    min="1"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Valor do Envio
                                  </label>
                                  <input
                                    type="text"
                                    value={novoEnvioTransportadoraValor === 0 ? '' : formatCurrency(novoEnvioTransportadoraValor)}
                                    onChange={(e) => {
                                      const numbers = e.target.value.replace(/\D/g, '');
                                      const cents = numbers === '' ? 0 : parseInt(numbers);
                                      const reais = cents / 100;
                                      setNovoEnvioTransportadoraValor(reais);
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                    placeholder="R$ 0,00"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Valor da Mercadoria
                                  </label>
                                  <input
                                    type="text"
                                    value={novoEnvioTransportadoraValorMercadoria === 0 ? '' : formatCurrency(novoEnvioTransportadoraValorMercadoria)}
                                    onChange={(e) => {
                                      const numbers = e.target.value.replace(/\D/g, '');
                                      const cents = numbers === '' ? 0 : parseInt(numbers);
                                      const reais = cents / 100;
                                      setNovoEnvioTransportadoraValorMercadoria(reais);
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                    placeholder="R$ 0,00"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                  Número da NFE
                                </label>
                                <input
                                  type="text"
                                  value={novoEnvioTransportadoraNfe}
                                  onChange={(e) => setNovoEnvioTransportadoraNfe(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                  placeholder="Informe a NFE (opcional)"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        {novoEnvioTransportadoraNome && novoEnvioTransportadoraEstado && (
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={adicionarEnvioTransportadora}
                              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                              title="Adicionar envio"
                            >
                              🚚 Adicionar Envio via Transportadora
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Lista de envios via transportadora */}
                      {Array.isArray(exits.enviosTransportadora) && exits.enviosTransportadora.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700">Envios via Transportadora:</h4>
                          {exits.enviosTransportadora.map((envio, index) => (
                            <div key={index} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                              <div className="flex-1">
                                <div className="text-sm font-medium">{envio.nomeCliente}</div>
                                <div className="text-sm text-gray-600">
                                  Estado: {envio.estado} | Peso: {envio.peso}kg | Qtd: {envio.quantidade} | 
                                  Valor Envio: {formatCurrency(envio.valor)}
                                  {envio.valorMercadoria && envio.valorMercadoria > 0 && (
                                    <> | Valor Mercadoria: {formatCurrency(envio.valorMercadoria)}</>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => removerEnvioTransportadora(index)}
                                className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm font-medium"
                                title="Remover envio"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* OUTROS (VALE FUNCIONÁRIO) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Outros (Vale Funcionário) <span className="text-xs text-gray-500">(apenas registro)</span>
                      </label>
                      <div className="space-y-2">
                        {/* Linha de inclusão (o botão + aparece somente quando digitar o valor) */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={novoValeNome}
                            onChange={(e) => setNovoValeNome(e.target.value)}
                            className="col-span-7 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                            placeholder="Funcionário"
                          />
                          <input
                            type="text"
                            value={novoValeValor === 0 ? '' : formatCurrency(novoValeValor)}
                            onChange={(e) => {
                              const numbers = e.target.value.replace(/\D/g, '');
                              const cents = numbers === '' ? 0 : parseInt(numbers);
                              const reais = cents / 100;
                              setNovoValeValor(reais);
                            }}
                            className="col-span-4 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                            placeholder="R$ 0,00"
                          />
                          {novoValeValor > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const novosVales = [...(exits.valesFuncionarios || []), { nome: novoValeNome, valor: novoValeValor }];
                                handleExitChange('valesFuncionarios', novosVales);
                                setNovoValeNome('');
                                setNovoValeValor(0);
                              }}
                              className="col-span-1 px-3 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                              title="Adicionar vale de funcionário"
                            >
                              +
                            </button>
                          )}
                        </div>

                        {/* Lista de Vales */}
                        {Array.isArray(exits.valesFuncionarios) && exits.valesFuncionarios.length > 0 && (
                          <div className="space-y-2">
                            {exits.valesFuncionarios.map((vale, index) => (
                              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <input
                                  type="text"
                                  value={vale.nome}
                                  onChange={(e) => {
                                    const novosVales = [...exits.valesFuncionarios];
                                    novosVales[index] = { ...novosVales[index], nome: e.target.value };
                                    handleExitChange('valesFuncionarios', novosVales);
                                  }}
                                  className="col-span-7 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                  placeholder={`Funcionário ${index + 1}`}
                                />
                                <input
                                  type="text"
                                  value={formatInputValue(Number(vale.valor) || 0)}
                                  onChange={(e) => {
                                    const numbers = e.target.value.replace(/\D/g, '');
                                    const cents = numbers === '' ? 0 : parseInt(numbers);
                                    const reais = cents / 100;
                                    const novosVales = [...exits.valesFuncionarios];
                                    novosVales[index] = { ...novosVales[index], valor: reais };
                                    handleExitChange('valesFuncionarios', novosVales);
                                  }}
                                  className="col-span-4 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                                  placeholder="R$ 0,00"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const novosVales = exits.valesFuncionarios.filter((_, i) => i !== index);
                                    handleExitChange('valesFuncionarios', novosVales);
                                  }}
                                  className="col-span-1 px-3 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                                  title="Remover vale"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Total e opção de incluir no movimento */}
                        {Array.isArray(exits.valesFuncionarios) && exits.valesFuncionarios.length > 0 && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                              <span className="text-gray-700 text-sm font-medium">Total Vales:</span>
                              <span className="font-bold text-red-700 text-lg">
                                {formatCurrency(exits.valesFuncionarios.reduce((s, v) => s + (Number(v.valor) || 0), 0))}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleExitChange('valesIncluidosNoMovimento', !exits.valesIncluidosNoMovimento)}
                                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 ${
                                  exits.valesIncluidosNoMovimento
                                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                                }`}
                              >
                                {exits.valesIncluidosNoMovimento ? '✅ Incluído no Movimento (Entrada)' : '➕ Adicionar ao Movimento de Caixa'}
                              </button>
                              {exits.valesIncluidosNoMovimento && (
                                <span className="text-xs text-green-600 font-medium">
                                  Valor somado ao caixa: {formatCurrency(exits.valesFuncionarios.reduce((s, v) => s + (Number(v.valor) || 0), 0))}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* COMISSÃO PUXADOR (APENAS REGISTRO) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comissão Puxador <span className="text-xs text-gray-500">(apenas registro)</span>
                      </label>
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 gap-2 items-center">
                          <input
                            type="text"
                            value={exits.puxadorNome}
                            onChange={(e) => handleExitChange('puxadorNome', e.target.value)}
                            className="col-span-5 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                            placeholder="Nome do puxador"
                          />
                          <div className="col-span-3 px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-sm text-gray-600 flex items-center justify-center">
                            4% (Fixo)
                          </div>
                          <input
                            type="text"
                            value={formatInputValue(exits.puxadorValor)}
                            onChange={(e) => {
                              const numbers = e.target.value.replace(/\D/g, '');
                              const cents = numbers === '' ? 0 : parseInt(numbers);
                              const reais = cents / 100;
                              handleExitChange('puxadorValor', reais);
                              // Definir porcentagem fixa de 4%
                              if (reais > 0) {
                                handleExitChange('puxadorPorcentagem', 4);
                              }
                            }}
                            className="col-span-4 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all duration-200 hover:border-red-300 focus:shadow-lg"
                            placeholder="Valor da comissão"
                          />
                        </div>
                        
                        {/* Botão para adicionar mais clientes do puxador */}
                        {exits.puxadorNome && exits.puxadorValor > 0 && (
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                // Adicionar novo campo para cliente do puxador
                                const novoCliente = {
                                  nome: `Cliente ${exits.puxadorClientes ? exits.puxadorClientes.length + 1 : 1}`,
                                  valor: 0
                                };
                                const novosClientes = [...(exits.puxadorClientes || []), novoCliente];
                                handleExitChange('puxadorClientes', novosClientes);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                              title="Adicionar cliente do puxador"
                            >
                              ➕ Adicionar Cliente
                            </button>
                          </div>
                        )}

                        {/* Lista de clientes do puxador */}
                        {Array.isArray(exits.puxadorClientes) && exits.puxadorClientes.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-700">Clientes do Puxador:</h4>
                            {exits.puxadorClientes.map((cliente, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                <input
                                  type="text"
                                  value={cliente.nome}
                                  onChange={(e) => {
                                    const novosClientes = [...exits.puxadorClientes];
                                    novosClientes[index].nome = e.target.value;
                                    handleExitChange('puxadorClientes', novosClientes);
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                  placeholder="Nome do cliente"
                                />
                                <input
                                  type="text"
                                  value={formatInputValue(cliente.valor)}
                                  onChange={(e) => {
                                    const numbers = e.target.value.replace(/\D/g, '');
                                    const cents = numbers === '' ? 0 : parseInt(numbers);
                                    const reais = cents / 100;
                                    const novosClientes = [...exits.puxadorClientes];
                                    novosClientes[index].valor = reais;
                                    handleExitChange('puxadorClientes', novosClientes);
                                  }}
                                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                  placeholder="R$ 0,00"
                                />
                                <button
                                  onClick={() => {
                                    const novosClientes = exits.puxadorClientes.filter((_, i) => i !== index);
                                    handleExitChange('puxadorClientes', novosClientes);
                                  }}
                                  className="px-2 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm"
                                  title="Remover cliente"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {exits.puxadorNome && exits.puxadorValor > 0 && (
                          <div className="text-xs text-gray-600 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                            <span className="font-medium">Registro:</span> {exits.puxadorNome} | 4% | Valor da Comissão: {formatCurrency(exits.puxadorValor)}
                          </div>
                        )}
                        
                        {/* Botão para adicionar outro puxador */}
                        {exits.puxadorNome && exits.puxadorValor > 0 && (
                          <div className="flex justify-center mt-2">
                            <button
                              type="button"
                              onClick={() => {
                                // Adicionar o puxador atual ao array de puxadores
                                const novoPuxador = {
                                  nome: exits.puxadorNome,
                                  porcentagem: exits.puxadorPorcentagem,
                                  valor: exits.puxadorValor,
                                  clientes: exits.puxadorClientes || []
                                };
                                const novosPuxadores = [...(exits.puxadores || []), novoPuxador];
                                handleExitChange('puxadores', novosPuxadores);
                                
                                // Limpar campos do puxador atual
                                handleExitChange('puxadorNome', '');
                                handleExitChange('puxadorPorcentagem', 0);
                                handleExitChange('puxadorValor', 0);
                                handleExitChange('puxadorClientes', []);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                              title="Adicionar outro puxador"
                            >
                              ➕ Adicionar Outro Puxador
                            </button>
                      </div>
                        )}
                        
                        {/* Lista de puxadores adicionados */}
                        {Array.isArray(exits.puxadores) && exits.puxadores.length > 0 && (
                          <div className="space-y-3 mt-4">
                            <h4 className="text-sm font-medium text-gray-700">Puxadores Adicionados:</h4>
                            {exits.puxadores.map((puxador, index) => (
                              <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="font-medium text-gray-800">{puxador.nome}</span>
                                    <span className="text-xs text-gray-600 ml-2">({puxador.porcentagem}%)</span>
                                    <span className="text-sm font-semibold text-blue-600 ml-2">{formatCurrency(puxador.valor)}</span>
                    </div>
                                  <button
                                    onClick={() => {
                                      const novosPuxadores = exits.puxadores.filter((_, i) => i !== index);
                                      handleExitChange('puxadores', novosPuxadores);
                                    }}
                                    className="px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 text-xs"
                                    title="Remover puxador"
                                  >
                                    ×
                                  </button>
                  </div>
                                {Array.isArray(puxador.clientes) && puxador.clientes.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    <div className="text-xs font-medium text-gray-600">Clientes:</div>
                                    {puxador.clientes.map((cliente, clienteIndex) => (
                                      <div key={clienteIndex} className="text-xs text-gray-600 ml-2">
                                        • {cliente.nome}: {formatCurrency(cliente.valor)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>

            {/* RESUMO E AÇÕES */}
            <div className="xl:col-span-1">
              <div className="space-y-4">
                {/* Total em Caixa */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50">
                  <div className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white p-4 rounded-t-xl">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Calculator className="w-5 h-5" />
                      TOTAL EM CAIXA
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="text-center">
                      <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent">{formatCurrency(total)}</span>
                    </div>
                    {total < 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-xs text-center font-semibold flex items-center justify-center gap-2">
                          <span>⚠️</span>
                          Valor negativo detectado!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50">
                  <div className="p-3 border-b border-gray-200">
                    <button
                      onClick={() => setMostrarBotoesPrincipais(!mostrarBotoesPrincipais)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                        <span>⚙️</span>
                        Ações Principais
                      </h3>
                      <span className="text-xs text-gray-600 font-medium">
                        {mostrarBotoesPrincipais ? '▼' : '▶'}
                      </span>
                    </button>
                  </div>
                  {mostrarBotoesPrincipais && (
                  <div className="p-4 space-y-4">
                    <PrintReport 
                      data={cashFlowData} 
                      incluirObservacoes={anexarObservacoes}
                    />
                    
                    {/* Botões de Ação Principais */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={handleSaveToLocal}
                        disabled={!canSave()}
                        className="flex items-center justify-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar</span>
                      </button>
                      
                      {/* Mensagem de erro quando os valores não conferem */}
                      {hasChanges && !canSave() && (
                        <div className="col-span-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-red-600">⚠️</span>
                            <span className="font-medium">Não é possível salvar</span>
                          </div>
                          
                          {/* Erro de validação de Saída (Retirada) */}
                          {exits.saida > 0 && !validateSaidaValues() && (
                            <div className="mb-1.5">
                              <p className="text-[10px]">❌ Valores das justificativas devem bater com "Saída (Retirada)".</p>
                              <p className="mt-0.5 text-[10px]">
                                Total: {formatCurrency(totalJustificativasSaida)} | 
                                Esperado: {formatCurrency(exits.saida)}
                              </p>
                            </div>
                          )}
                          
                          {/* Erro de validação PIX Conta */}
                          {entries.pixConta > 0 && !validatePixContaValues() && (
                            <div className="mb-1.5">
                              <p className="text-[10px]">❌ Valores dos clientes PIX Conta devem bater.</p>
                              <p className="mt-0.5 text-[10px]">
                                Total: {formatCurrency(entries.pixContaClientes.reduce((sum, cliente) => sum + cliente.valor, 0))} | 
                                Esperado: {formatCurrency(entries.pixConta)}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={handleLoadFromLocal}
                        className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium text-xs shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Carregar</span>
                      </button>
                    </div>

                    {/* Botão de Cancelamentos */}
                    <div>
                      <button
                        onClick={() => setShowCancelamentosModal(true)}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-medium text-xs flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>📋</span>
                        <span>Cancelamentos</span>
                      </button>
                    </div>

                    {/* Checklist de Fechamento */}
                    {getChecklistFechamento.items.length > 0 && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-200/50">
                        <div className="p-6">
                          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <CheckCircle2 className={`w-5 h-5 ${getChecklistFechamento.allOk ? 'text-green-600' : getChecklistFechamento.hasErrors ? 'text-red-600' : 'text-yellow-600'}`} />
                            Checklist de Fechamento
                          </h3>
                          <div className="space-y-2">
                            {getChecklistFechamento.items.map((item) => (
                              <div key={item.id} className={`flex items-start gap-2 p-3 rounded-lg border ${
                                item.status === 'ok' ? 'bg-green-50 border-green-200' :
                                item.status === 'error' ? 'bg-red-50 border-red-200' :
                                'bg-yellow-50 border-yellow-200'
                              }`}>
                                {item.status === 'ok' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                ) : item.status === 'error' ? (
                                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <div className={`text-sm font-medium ${
                                    item.status === 'ok' ? 'text-green-800' :
                                    item.status === 'error' ? 'text-red-800' :
                                    'text-yellow-800'
                                  }`}>
                                    {item.label}
                                  </div>
                                  <div className={`text-xs mt-1 ${
                                    item.status === 'ok' ? 'text-green-600' :
                                    item.status === 'error' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>
                                    {item.message}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          {getChecklistFechamento.hasErrors && (
                            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                              <p className="text-sm text-red-800 font-medium">
                                ⚠️ Corrija os erros antes de fechar o movimento
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botões de Fechamento */}
                    <div className="space-y-3">
                      <button
                        onClick={generateFechamentoFile}
                        className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white px-6 py-4 rounded-xl hover:from-purple-700 hover:via-indigo-700 hover:to-purple-800 active:from-purple-800 active:via-indigo-800 active:to-purple-900 transition-all duration-300 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Download className="w-5 h-5 relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10 hidden sm:inline">Gerar Arquivo de Fechamento</span>
                      </button>

                      {/* Botões de Exportação */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={exportToCSV}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 active:from-green-800 active:to-emerald-800 transition-all duration-300 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden group"
                          title="Exportar para CSV"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <FileText className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">CSV</span>
                        </button>
                        <button
                          onClick={exportToExcel}
                          className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 active:from-blue-800 active:to-cyan-800 transition-all duration-300 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden group"
                          title="Exportar para Excel"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <FileSpreadsheet className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">Excel</span>
                        </button>
                      </div>

                      <button
                        onClick={handleFecharMovimento}
                        disabled={getChecklistFechamento.hasErrors}
                        className={`w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white px-6 py-4 rounded-xl hover:from-orange-600 hover:via-amber-600 hover:to-orange-700 active:from-orange-700 active:via-amber-700 active:to-orange-800 transition-all duration-300 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden group ${
                          getChecklistFechamento.hasErrors ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <FileText className="w-5 h-5 relative z-10 group-hover:animate-bounce" />
                        <span className="relative z-10 hidden sm:inline">Fechar Movimento</span>
                      </button>
                      {getChecklistFechamento.hasErrors && (
                        <p className="text-xs text-red-600 text-center">
                          Corrija os erros acima para fechar o movimento
                        </p>
                      )}
                    </div>

                    {/* Campo de Observações/Notas */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <label className="text-sm font-semibold text-gray-800">Observações / Notas</label>
                        </div>
                        <button
                          onClick={() => setAnexarObservacoes(!anexarObservacoes)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5 ${
                            anexarObservacoes
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                          title={anexarObservacoes ? 'Observações serão incluídas no relatório' : 'Clique para anexar observações ao relatório'}
                        >
                          {anexarObservacoes ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Anexado</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-3.5 h-3.5" />
                              <span>Anexar</span>
                            </>
                          )}
                        </button>
                      </div>
                      <textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Adicione observações importantes sobre este movimento de caixa..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm resize-none"
                        rows={4}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {observacoes.length} caracteres
                        </p>
                        {anexarObservacoes && observacoes && (
                          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Será incluído no relatório
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setShowConfirmClear(true)}
                      className="w-full bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white px-6 py-4 rounded-xl hover:from-red-600 hover:via-pink-600 hover:to-red-700 active:from-red-700 active:via-pink-700 active:to-red-800 transition-all duration-300 font-semibold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="text-xl relative z-10 group-hover:animate-bounce">🗑️</span>
                      <span className="relative z-10 hidden sm:inline">Limpar Formulário</span>
                    </button>
                  </div>
                  )}
                </div>

                {/* Resumo Rápido */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-purple-200/50 hover:shadow-purple-500/25 transition-all duration-500 transform hover:scale-[1.02]">
                  <div className="p-6 border-b border-purple-200/50">
                    <button
                      onClick={() => setMostrarResumoRapido(!mostrarResumoRapido)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-sm font-bold">📊</span>
                        </div>
                        Resumo Rápido
                      </h3>
                      <span className="text-sm text-gray-600 font-medium">
                        {mostrarResumoRapido ? 'Recolher' : 'Expandir'}
                      </span>
                    </button>
                  </div>
                  {mostrarResumoRapido && (
                  <div className="p-8">
                    {/* Indicadores de Status e Alertas */}
                    <div className="mb-4 space-y-2">
                      {/* Badge de Meta */}
                      {total >= dailyGoal && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-100 border border-emerald-200 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-800">
                            Meta diária atingida! ({((total / dailyGoal) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      )}
                      {total >= dailyGoal * 0.9 && total < dailyGoal && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 border border-blue-200 rounded-lg">
                          <Info className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Próximo da meta: {formatCurrency(dailyGoal - total)} restantes
                          </span>
                        </div>
                      )}
                      
                      {/* Badge de Saldo Negativo */}
                      {total < 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-100 border border-red-200 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">
                            Saldo negativo: {formatCurrency(total)}
                          </span>
                        </div>
                      )}
                      
                      {/* Badge de Movimentação Alta */}
                      {dailyHistory.length > 0 && (() => {
                        const averageTotal = dailyHistory.reduce((sum, record) => sum + (record.entradas || 0), 0) / dailyHistory.length;
                        if (totalEntradas > averageTotal * 1.5) {
                          return (
                            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 border border-yellow-200 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm font-medium text-yellow-800">
                                Movimentação acima do normal ({((totalEntradas / averageTotal - 1) * 100).toFixed(1)}% acima da média)
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* Badge de Lembrete de Fechamento */}
                      {dailyHistory.length > 0 && (() => {
                        const lastClose = new Date(dailyHistory[dailyHistory.length - 1].date);
                        const hoursSinceLastClose = (Date.now() - lastClose.getTime()) / (1000 * 60 * 60);
                        if (hoursSinceLastClose >= 8) {
                          return (
                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 border border-orange-200 rounded-lg">
                              <Info className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800">
                                Lembrete: {Math.floor(hoursSinceLastClose)}h desde o último fechamento
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                    {/* Badges de validação rápidas */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {entries.pixConta > 0 && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${validatePixContaValues() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          PIX Conta: {validatePixContaValues() ? 'OK' : 'Verificar valores'}
                        </span>
                      )}
                      {entries.cartaoLink > 0 && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${validateCartaoLinkValues() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          Cartão Link: {validateCartaoLinkValues() ? 'OK' : 'Verificar clientes/parcelas'}
                        </span>
                      )}
                      {entries.boletos > 0 && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${validateBoletosValues() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          Boletos: {validateBoletosValues() ? 'OK' : 'Verificar clientes/parcelas'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                        <span className="text-gray-700 text-sm font-medium">Total Entradas:</span>
                        <span className="font-bold text-green-700 text-lg">
                          {formatCurrency(totalFinal)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                        <span className="text-gray-700 text-sm font-medium">Total Saídas (Registro):</span>
                        <span className="font-bold text-red-700 text-lg">
                          {formatCurrency(
                            exits.descontos + 
                            exits.saida + 
                            exits.creditoDevolucao +
                            (Array.isArray(exits.valesFuncionarios) ? exits.valesFuncionarios.reduce((s, v) => s + (Number(v.valor) || 0), 0) : 0) +
                            (Number(exits.puxadorValor) || 0)
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                        <p className="font-bold text-gray-800 mb-3 text-center">📋 CAMPOS APENAS PARA REGISTRO</p>
                        
                        {/* DESCONTOS */}
                        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <p className="font-medium text-gray-700">• Descontos: {formatCurrency(exits.descontos)}</p>
                        </div>

                        {/* SAÍDA (RETIRADA) */}
                        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <p className="font-medium text-gray-700">• Saída (Retirada): {formatCurrency(exits.saida)}</p>
                          {exits.saida > 0 && (
                            <>
                              {exits.justificativaCompra && (
                                <p className="ml-4 text-gray-500 mt-1">- Compra: {exits.justificativaCompra} ({formatCurrency(exits.valorCompra)})</p>
                              )}
                              {exits.justificativaSaidaDinheiro && (
                                <p className="ml-4 text-gray-500 mt-1">- Saída: {exits.justificativaSaidaDinheiro} ({formatCurrency(exits.valorSaidaDinheiro)})</p>
                              )}
                              {/* Status da validação */}
                              <div className={`ml-4 mt-2 p-2 rounded-lg text-xs ${
                                exits.valorCompra + exits.valorSaidaDinheiro === exits.saida
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {totalJustificativasSaida === exits.saida ? (
                                    <span className="text-green-600">✅</span>
                                  ) : (
                                    <span className="text-red-600">❌</span>
                                  )}
                                  <span className="font-medium">
                                    {totalJustificativasSaida === exits.saida
                                      ? 'Valores Conferem'
                                      : 'Valores Não Conferem'
                                    }
                                  </span>
                                </div>
                                <div className="text-xs">
                                  <div>Total das justificativas: {formatCurrency(totalJustificativasSaida)}</div>
                                  <div>Valor total: {formatCurrency(exits.saida)}</div>
                                  {totalJustificativasSaida !== exits.saida && (
                                    <div className="font-bold mt-1">
                                      Diferença: {formatCurrency(Math.abs(totalJustificativasSaida - exits.saida))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        {/* CRÉDITO/DEVOLUÇÃO */}
                        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <p className="font-medium text-gray-700">• Crédito/Devolução: {formatCurrency(exits.creditoDevolucao)} 
                            {exits.creditoDevolucaoIncluido && (
                              <span className="text-green-600 font-medium"> ✅ Incluído no Movimento</span>
                            )}
                          </p>
                          {exits.creditoDevolucao > 0 && exits.cpfCreditoDevolucao && (
                            <p className="ml-4 text-gray-500 mt-1">- CPF: {exits.cpfCreditoDevolucao}</p>
                          )}
                        </div>

                        {/* VALES FUNCIONÁRIO */}
                        {Array.isArray(exits.valesFuncionarios) && exits.valesFuncionarios.length > 0 && (
                          <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <p className="font-medium text-gray-700">• Vales Funcionário: {formatCurrency(exits.valesFuncionarios.reduce((s, v) => s + (Number(v.valor) || 0), 0))}
                              {exits.valesIncluidosNoMovimento && (
                                <span className="text-green-600 text-xs font-medium"> ✅ Incluído no Movimento</span>
                              )}
                            </p>
                          </div>
                        )}

                        {/* COMISSÃO PUXADOR */}
                        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <p className="font-medium text-gray-700">• Comissão Puxador: {formatCurrency(exits.puxadorValor)}</p>
                          {exits.puxadorNome && (
                            <p className="ml-4 text-gray-500 mt-1">- Puxador: {exits.puxadorNome} (4%)</p>
                          )}
                          {Array.isArray(exits.puxadorClientes) && exits.puxadorClientes.length > 0 && (
                            <div className="ml-4 mt-1">
                              <p className="text-gray-500 text-xs">- Clientes:</p>
                              {exits.puxadorClientes.map((cliente, index) => (
                                <p key={index} className="ml-4 text-gray-500 text-xs">
                                  • {cliente.nome}: {formatCurrency(cliente.valor)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* CORREIOS/FRETE */}
                        {exits.correiosFrete > 0 && (
                          <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <p className="font-medium text-gray-700">• Correios/Frete: {formatCurrency(exits.correiosFrete)} <span className="text-blue-600 text-xs">(registro separado)</span></p>
                            {exits.correiosFrete > 0 && exits.correiosClientes.length > 0 && (
                              <p className="ml-4 text-gray-500 mt-1">- Clientes adicionais: {exits.correiosClientes.filter(c => c.trim()).join(', ')}</p>
                            )}
                          </div>
                        )}

                        {/* TOTAL SAÍDAS */}
                        <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-lg border border-red-200">
                          <p className="font-bold text-red-800 text-center">
                            <strong>Total Saídas (Registro):</strong> {formatCurrency(
                              exits.descontos + 
                              exits.saida + 
                              exits.creditoDevolucao +
                              (Array.isArray(exits.valesFuncionarios) ? exits.valesFuncionarios.reduce((s, v) => s + (Number(v.valor) || 0), 0) : 0) +
                              (Number(exits.puxadorValor) || 0)
                            )}
                          </p>
                        </div>

                        {/* CRÉDITO/DEVOLUÇÃO INCLUÍDO */}
                        {exits.creditoDevolucaoIncluido && (
                          <div className="mt-3 p-2 bg-green-100 rounded-lg border border-green-200">
                            <p className="text-green-800 font-medium text-center">
                              <strong>Crédito/Devolução incluído no movimento (entrada):</strong> +{formatCurrency(exits.creditoDevolucao)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                          <span className="text-gray-800 font-bold text-sm">Saldo Final:</span>
                          <span className={`text-xl font-bold ${total >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {formatCurrency(total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        </div>
      </div>

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={showConfirmClear}
        title="Limpar Formulário"
        message="Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita."
        confirmText="Sim, Limpar"
        cancelText="Cancelar"
        onConfirm={handleClearForm}
        onCancel={() => setShowConfirmClear(false)}
        type="danger"
      />

      {/* CONFIRM FECHAMENTO DIALOG */}
      <ConfirmDialog
        isOpen={showConfirmFechamento}
        title="Confirmar Fechamento"
        message="O movimento foi fechado e impresso. Deseja confirmar o fechamento e zerar todos os valores?"
        confirmText="Sim, Confirmar"
        cancelText="Não, Manter Dados"
        onConfirm={handleConfirmFechamento}
        onCancel={() => setShowConfirmFechamento(false)}
        type="info"
      />

      {/* NOTIFICATION */}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification(prev => ({ ...prev, isVisible: false }))}
        autoHide={true}
        duration={3000}
      />

      {/* MODAL DE CANCELAMENTOS */}
      <CancelamentosModal
        isOpen={showCancelamentosModal}
        onClose={() => setShowCancelamentosModal(false)}
        isDemo={isDemo}
      />

      {/* Modal de Demo Expirada */}
      <DemoExpiredModal
        isOpen={showDemoExpiredModal}
        onClose={() => setShowDemoExpiredModal(false)}
        onContact={() => {
          setShowDemoExpiredModal(false);
          if (onBackToLanding) {
            onBackToLanding();
          }
        }}
      />

      {/* Painel do Proprietário */}
      <OwnerPanel
        isOpen={showOwnerPanel}
        onClose={() => setShowOwnerPanel(false)}
        onConfigUpdate={(config) => setCompanyConfig(config)}
      />

      {/* Modal de Limitação de Acesso */}
      <AccessLimitationModal
        isOpen={showAccessLimitation}
        onClose={() => setShowAccessLimitation(false)}
        onUpgrade={() => {
          setShowAccessLimitation(false);
          if (onBackToLanding) {
            onBackToLanding();
          }
        }}
        limitation={{
          maxRecords: accessControl.maxRecords,
          currentRecords: accessControl.currentRecords,
          isTrialExpired: accessControl.isTrialExpired,
          daysLeftInTrial: accessControl.daysLeftInTrial
        }}
      />

      {/* Modal de Alteração do Fundo de Caixa */}
      {showFundoCaixaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full my-8">
            {/* Header do Modal */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Alterar Fundo de Caixa</h2>
                    <p className="text-blue-100 text-sm">Configure o valor padrão do fundo de caixa</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFundoCaixaModal(false);
                    setPimCode('');
                    setNovoFundoCaixa('');
                    setPimError('');
                  }}
                  className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-lg"
                  title="Fechar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-6">
              {/* Informação do Valor Atual */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Valor Atual do Fundo de Caixa</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(entries.fundoCaixa)}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Campo de Código PIM */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Código PIM (4 dígitos) *
                </label>
                <input
                  type="text"
                  value={pimCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPimCode(value);
                    setPimError('');
                  }}
                  className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-center text-xl tracking-widest ${
                    pimError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="0000"
                  maxLength={4}
                  autoFocus
                />
                {pimError && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{pimError}</span>
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  🔒 Digite o código PIM de segurança para autorizar a alteração
                </p>
              </div>

              {/* Campo de Novo Valor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Novo Valor do Fundo de Caixa *
                </label>
                <input
                  type="text"
                  value={novoFundoCaixa}
                  onChange={(e) => {
                    const numbers = e.target.value.replace(/\D/g, '');
                    const formatted = formatCurrencyInput(numbers);
                    setNovoFundoCaixa(formatted);
                  }}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-semibold"
                  placeholder="R$ 0,00"
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 Este valor será usado como padrão para todos os novos registros
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowFundoCaixaModal(false);
                    setPimCode('');
                    setNovoFundoCaixa('');
                    setPimError('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium border border-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Validar PIM
                    if (!pimCode || pimCode.length !== 4) {
                      setPimError('Por favor, informe o código PIM de 4 dígitos');
                      return;
                    }

                    if (!validatePIM(pimCode)) {
                      setPimError('Código PIM incorreto');
                      return;
                    }

                    // Validar valor
                    const numbers = novoFundoCaixa.replace(/\D/g, '');
                    if (numbers === '' || parseInt(numbers) === 0) {
                      setPimError('Por favor, informe um valor válido');
                      return;
                    }

                    const valor = parseInt(numbers) / 100;
                    
                    // Salvar o novo valor padrão
                    saveFundoCaixaPadrao(valor);
                    
                    // Atualizar o valor atual
                    updateEntries('fundoCaixa', valor);
                    
                    // Fechar modal e limpar campos
                    setShowFundoCaixaModal(false);
                    setPimCode('');
                    setNovoFundoCaixa('');
                    setPimError('');
                    
                    // Mostrar notificação de sucesso
                    setNotification({
                      type: 'success',
                      message: `Fundo de Caixa alterado para ${formatCurrency(valor)}`,
                      isVisible: true
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  ✓ Confirmar Alteração
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard de Análises */}
      <CashFlowDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        currentData={{
          entries,
          exits,
          totalEntradas,
          totalSaidas: totalSaidasCalculado,
          saldo: total
        }}
      />

      {/* Modal de Registros Salvos */}
      {showSavedRecords && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-1 overflow-y-auto pt-16">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-1.5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Registros Salvos</h2>
                <p className="text-xs text-gray-600">Visualize e filtre seus registros salvos</p>
              </div>
              <button
                onClick={() => setShowSavedRecords(false)}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Filtros */}
            <div className="p-2 border-b border-gray-200 overflow-y-auto">
              <CashFlowFiltersComponent
                filters={savedRecordsFilters}
                onFiltersChange={setSavedRecordsFilters}
                showAdvanced={true}
              />
            </div>

            {/* Lista de Registros */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {(() => {
                const savedData = localStorage.getItem('cashFlowData');
                if (!savedData) {
                  return (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg mb-2">Nenhum registro salvo</p>
                      <p className="text-gray-500 text-sm">
                        Salve um registro para visualizá-lo aqui
                      </p>
                    </div>
                  );
                }

                try {
                  const parsed = JSON.parse(savedData);
                  const record = {
                    id: 'current',
                    date: new Date().toISOString(),
                    entries: parsed.entries,
                    exits: parsed.exits,
                    cancelamentos: parsed.cancelamentos || [],
                    status: 'aberto'
                  };

                  // Aplicar filtros
                  let showRecord = true;

                  // Filtro por busca rápida
                  if (savedRecordsFilters.quickSearch) {
                    const search = savedRecordsFilters.quickSearch.toLowerCase();
                    const entriesStr = JSON.stringify(record.entries).toLowerCase();
                    const exitsStr = JSON.stringify(record.exits).toLowerCase();
                    showRecord = entriesStr.includes(search) || exitsStr.includes(search);
                  }

                  // Filtro por status
                  if (savedRecordsFilters.status === 'fechado') {
                    showRecord = false; // Registro atual está sempre aberto
                  } else if (savedRecordsFilters.status === 'aberto') {
                    showRecord = true;
                  }

                  // Filtro por tipo de entrada
                  if (savedRecordsFilters.entryType !== 'all' && showRecord) {
                    const entryTypes: { [key: string]: string } = {
                      'dinheiro': 'dinheiro',
                      'cartao': 'cartao',
                      'pix': 'pixConta',
                      'boletos': 'boletos',
                      'cheques': 'cheque'
                    };
                    const field = entryTypes[savedRecordsFilters.entryType];
                    if (field && (!record.entries[field] || record.entries[field] === 0)) {
                      showRecord = false;
                    }
                  }

                  // Filtro por tipo de saída
                  if (savedRecordsFilters.exitType !== 'all' && showRecord) {
                    const exitTypes: { [key: string]: string } = {
                      'saida': 'saida',
                      'devolucao': 'devolucoes',
                      'vale': 'valesFuncionarios',
                      'transportadora': 'enviosTransportadora',
                      'correios': 'enviosCorreios'
                    };
                    const field = exitTypes[savedRecordsFilters.exitType];
                    if (field && (!record.exits[field] || 
                        (Array.isArray(record.exits[field]) && record.exits[field].length === 0) ||
                        record.exits[field] === 0)) {
                      showRecord = false;
                    }
                  }

                  // Filtro por faixa de valores
                  if (savedRecordsFilters.valueMin && showRecord) {
                    const minValue = Number(savedRecordsFilters.valueMin) / 100;
                    const totalEntradas = Object.values(record.entries).reduce((sum: number, val: any) => {
                      if (typeof val === 'number') return sum + val;
                      if (Array.isArray(val)) return sum + val.reduce((s, v) => s + (v.valor || 0), 0);
                      return sum;
                    }, 0);
                    if (totalEntradas < minValue) showRecord = false;
                  }

                  if (savedRecordsFilters.valueMax && showRecord) {
                    const maxValue = Number(savedRecordsFilters.valueMax) / 100;
                    const totalEntradas = Object.values(record.entries).reduce((sum: number, val: any) => {
                      if (typeof val === 'number') return sum + val;
                      if (Array.isArray(val)) return sum + val.reduce((s, v) => s + (v.valor || 0), 0);
                      return sum;
                    }, 0);
                    if (totalEntradas > maxValue) showRecord = false;
                  }

                  if (!showRecord) {
                  return (
                    <div className="text-center py-6">
                      <Filter className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-xs mb-1">Nenhum registro encontrado</p>
                      <p className="text-gray-500 text-xs">
                        Tente ajustar os filtros
                      </p>
                    </div>
                  );
                  }

                  return (
                    <div className="space-y-2">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-2.5 border border-emerald-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-xs font-semibold text-gray-900">
                              Registro Atual
                            </h3>
                            <p className="text-xs text-gray-600">
                              Salvo em {new Date(record.date).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                            Aberto
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                          <div className="bg-white rounded-lg p-2 border border-emerald-200">
                            <p className="text-xs text-gray-600 mb-0.5">Total Entradas</p>
                            <p className="text-sm font-bold text-emerald-600">
                              {formatCurrency(
                                Object.values(record.entries).reduce((sum: number, val: any) => {
                                  if (typeof val === 'number') return sum + val;
                                  if (Array.isArray(val)) return sum + val.reduce((s, v) => s + (v.valor || 0), 0);
                                  return sum;
                                }, 0)
                              )}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-red-200">
                            <p className="text-xs text-gray-600 mb-0.5">Total Saídas</p>
                            <p className="text-sm font-bold text-red-600">
                              {formatCurrency(
                                Object.values(record.exits).reduce((sum: number, val: any) => {
                                  if (typeof val === 'number') return sum + val;
                                  if (Array.isArray(val)) return sum + val.reduce((s, v) => s + (v.valor || 0), 0);
                                  return sum;
                                }, 0)
                              )}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-gray-200">
                            <p className="text-xs text-gray-600 mb-0.5">Cancelamentos</p>
                            <p className="text-sm font-bold text-gray-900">
                              {record.cancelamentos?.length || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              loadFromLocal();
                              setShowSavedRecords(false);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium"
                          >
                            Carregar Registro
                          </button>
                          <button
                            onClick={() => {
                              printCashFlow({
                                entries: record.entries,
                                exits: record.exits,
                                cancelamentos: record.cancelamentos || [],
                                total: 0,
                                date: record.date,
                                observacoes: (record as any).observacoes || undefined
                              }, false, false);
                            }}
                            className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                          >
                            Imprimir
                          </button>
                        </div>
                        
                        {/* Exibir Observações se existirem */}
                        {(record as any).observacoes && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-semibold text-blue-800">Observações:</span>
                            </div>
                            <p className="text-sm text-blue-700 whitespace-pre-wrap">{(record as any).observacoes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } catch (error) {
                  return (
                    <div className="text-center py-6">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                      <p className="text-red-600 text-xs mb-1">Erro ao carregar registro</p>
                      <p className="text-gray-500 text-xs">
                        O registro pode estar corrompido
                      </p>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Central de Alertas */}
      <AlertCenter
        isOpen={showAlertCenter}
        onClose={() => setShowAlertCenter(false)}
      />

      {/* Modal de Backup e Restauração */}
      <BackupRestoreModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        onRestore={() => {
          // Recarregar dados após restauração
          loadFromLocal();
        }}
      />

      {/* Modal de Validação */}
      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        validationResult={validationResult}
      />

      {/* Modal de Templates */}
      <TemplatesModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onApplyTemplate={handleApplyTemplate}
        currentData={{
          entries,
          exits,
          cancelamentos: cancelamentos || []
        }}
      />

      {/* Modal de Integração PDV */}
      <PDVIntegrationModal
        isOpen={showPDVIntegrationModal}
        onClose={() => setShowPDVIntegrationModal(false)}
        onImportSales={(importedEntries) => {
          // Aplicar entradas importadas - SOMAR aos valores existentes
          const importedDetails: string[] = [];
          const fieldsToUpdate: Array<{ field: keyof typeof entries; value: number }> = [];
          
          // Mapear e validar campos
          Object.entries(importedEntries).forEach(([key, value]) => {
            if (typeof value === 'number' && value > 0) {
              const fieldName = key as keyof typeof entries;
              
              // Verificar se o campo existe em entries
              if (fieldName in entries) {
                // Obter valor atual e somar
                const currentValue = entries[fieldName] as number || 0;
                const newValue = currentValue + value;
                
                fieldsToUpdate.push({ field: fieldName, value: newValue });
                
                const fieldNames: Record<string, string> = {
                  dinheiro: 'Dinheiro',
                  cartao: 'Cartão',
                  cartaoLink: 'Cartão Link',
                  pixMaquininha: 'PIX Maquininha',
                  pixConta: 'PIX Conta',
                  boletos: 'Boletos',
                  cheque: 'Cheque'
                };
                
                importedDetails.push(
                  `${fieldNames[key] || key}: ${formatCurrency(currentValue)} + ${formatCurrency(value)} = ${formatCurrency(newValue)}`
                );
              }
            }
          });
          
          // Aplicar todas as atualizações
          fieldsToUpdate.forEach(({ field, value }) => {
            updateEntries(field, value);
          });
          
          if (importedDetails.length > 0) {
            setNotification({
              type: 'success',
              message: `✅ ${fieldsToUpdate.length} método(s) de pagamento importado(s)!\n\n${importedDetails.join('\n')}`,
              isVisible: true
            });
          } else {
            setNotification({
              type: 'warning',
              message: '⚠️ Nenhum valor válido encontrado para importar.',
              isVisible: true
            });
          }
        }}
      />

      {/* Modal de Webhooks */}
      <WebhooksModal
        isOpen={showWebhooksModal}
        onClose={() => setShowWebhooksModal(false)}
      />

      {/* Modal para Adicionar/Editar Nova Saída Retirada */}
      {showModalAdicionarSaida && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">
                {editandoSaidaIndex !== null ? 'Editar Saída' : 'Adicionar Nova Saída'}
              </h3>
              <button
                onClick={() => {
                  setShowModalAdicionarSaida(false);
                  setTipoSaidaSelecionado(null);
                  setNovaSaidaJustificativa('');
                  setNovaSaidaValor(0);
                  setEditandoSaidaIndex(null);
                  setSaidaEditandoTipo(null);
                  setSaidaEditandoJustificativa('');
                  setSaidaEditandoValor(0);
                }}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {(() => {
                const tipoAtual = editandoSaidaIndex !== null ? saidaEditandoTipo : tipoSaidaSelecionado;
                const justificativaAtual = editandoSaidaIndex !== null ? saidaEditandoJustificativa : novaSaidaJustificativa;
                const valorAtual = editandoSaidaIndex !== null ? saidaEditandoValor : novaSaidaValor;
                
                return !tipoAtual ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700 font-medium">Selecione o tipo de saída:</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          if (editandoSaidaIndex !== null) {
                            setSaidaEditandoTipo('compra');
                          } else {
                            setTipoSaidaSelecionado('compra');
                          }
                        }}
                        className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 text-center"
                      >
                        <div className="text-2xl mb-2">🛒</div>
                        <div className="text-sm font-semibold text-blue-700">Compra</div>
                        <div className="text-xs text-blue-600 mt-1">Lançamento de despesa de compra</div>
                      </button>
                      <button
                        onClick={() => {
                          if (editandoSaidaIndex !== null) {
                            setSaidaEditandoTipo('dinheiro');
                          } else {
                            setTipoSaidaSelecionado('dinheiro');
                          }
                        }}
                        className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 transition-all duration-200 text-center"
                      >
                        <div className="text-2xl mb-2">💰</div>
                        <div className="text-sm font-semibold text-orange-700">Retirada de Dinheiro</div>
                        <div className="text-xs text-orange-600 mt-1">Saída de dinheiro do caixa</div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      {editandoSaidaIndex === null && (
                        <button
                          onClick={() => {
                            setTipoSaidaSelecionado(null);
                            setNovaSaidaJustificativa('');
                            setNovaSaidaValor(0);
                          }}
                          className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <span>←</span>
                        </button>
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {tipoAtual === 'compra' ? '🛒 Compra' : '💰 Retirada de Dinheiro'}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        {tipoAtual === 'compra' ? 'Descrição da Compra' : 'Justificativa da Saída'}
                      </label>
                      <input
                        type="text"
                        value={justificativaAtual}
                        onChange={(e) => {
                          if (editandoSaidaIndex !== null) {
                            setSaidaEditandoJustificativa(e.target.value);
                          } else {
                            setNovaSaidaJustificativa(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        placeholder={tipoAtual === 'compra' ? 'Ex: Compra de produtos, materiais...' : 'Ex: Retirada para pagamento, troco...'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Valor
                      </label>
                      <input
                        type="text"
                        value={formatInputValue(valorAtual)}
                        onChange={(e) => {
                          const numbers = e.target.value.replace(/\D/g, '');
                          const cents = numbers === '' ? 0 : parseInt(numbers);
                          const reais = cents / 100;
                          if (editandoSaidaIndex !== null) {
                            setSaidaEditandoValor(reais);
                          } else {
                            setNovaSaidaValor(reais);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                        placeholder="R$ 0,00"
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setShowModalAdicionarSaida(false);
                          setTipoSaidaSelecionado(null);
                          setNovaSaidaJustificativa('');
                          setNovaSaidaValor(0);
                          setEditandoSaidaIndex(null);
                          setSaidaEditandoTipo(null);
                          setSaidaEditandoJustificativa('');
                          setSaidaEditandoValor(0);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          if (editandoSaidaIndex !== null) {
                            salvarEdicaoSaida();
                          } else {
                            adicionarNovaSaidaRetiradaComTipo();
                          }
                        }}
                        disabled={!justificativaAtual || valorAtual <= 0}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editandoSaidaIndex !== null ? 'Salvar Alterações' : 'Adicionar'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Busca Rápida */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-800">Busca Rápida</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Ctrl+F</span>
              </div>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchTerm('');
                }}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 flex-shrink-0">
              <input
                data-search-input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg"
                placeholder="Buscar por valores, clientes, descrições..."
                autoFocus
              />
            </div>
              
            {/* Resultados da busca */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {(() => {
                if (!searchTerm.trim()) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Keyboard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">Digite para buscar valores, clientes ou descrições</p>
                      <div className="mt-4 text-xs text-gray-400 space-y-1">
                        <p>💡 Dica: Busque por nomes de campos, valores, clientes ou descrições</p>
                        <p>🔍 A busca é feita em tempo real enquanto você digita</p>
                      </div>
                    </div>
                  );
                }

                const searchLower = searchTerm.toLowerCase();
                const results: {
                  type: 'entrada' | 'saida' | 'cliente' | 'cheque' | 'taxa' | 'vale' | 'saidaRetirada' | 'envio';
                  title: string;
                  value?: string;
                  details?: string;
                  icon?: string;
                }[] = [];

                // Buscar em entradas simples
                Object.entries(entries).forEach(([key, value]) => {
                  if (Array.isArray(value) || typeof value === 'object') return;
                  
                  const keyLower = key.toLowerCase();
                  const valueStr = typeof value === 'number' ? formatCurrency(value) : String(value || '');
                  const valueLower = valueStr.toLowerCase();
                  
                  if (
                    (keyLower.includes(searchLower) || valueLower.includes(searchLower)) &&
                    value !== 0 &&
                    value !== ''
                  ) {
                    results.push({
                      type: 'entrada',
                      title: key.replace(/([A-Z])/g, ' $1').trim(),
                      value: valueStr,
                      icon: '💰'
                    });
                  }
                });

                // Buscar em saídas simples
                Object.entries(exits).forEach(([key, value]) => {
                  if (Array.isArray(value) || typeof value === 'object') return;
                  
                  const keyLower = key.toLowerCase();
                  const valueStr = typeof value === 'number' ? formatCurrency(value) : String(value || '');
                  const valueLower = valueStr.toLowerCase();
                  
                  if (
                    (keyLower.includes(searchLower) || valueLower.includes(searchLower)) &&
                    value !== 0 &&
                    value !== ''
                  ) {
                    results.push({
                      type: 'saida',
                      title: key.replace(/([A-Z])/g, ' $1').trim(),
                      value: valueStr,
                      icon: '💸'
                    });
                  }
                });

                // Buscar em cheques (clientes)
                if (Array.isArray(entries.cheques)) {
                  entries.cheques.forEach((cheque, idx) => {
                    const clienteLower = (cheque.nomeCliente || '').toLowerCase();
                    const bancoLower = (cheque.banco || '').toLowerCase();
                    const valorStr = formatCurrency(cheque.valor);
                    const valorLower = valorStr.toLowerCase();
                    
                    if (
                      clienteLower.includes(searchLower) ||
                      bancoLower.includes(searchLower) ||
                      valorLower.includes(searchLower) ||
                      (cheque.numeroCheque || '').toLowerCase().includes(searchLower)
                    ) {
                      results.push({
                        type: 'cheque',
                        title: cheque.nomeCliente || 'Cliente sem nome',
                        value: valorStr,
                        details: `${cheque.banco || 'Banco'} - ${cheque.numeroCheque || 'N/A'}`,
                        icon: '🏦'
                      });
                    }
                  });
                }

                // Buscar em taxas
                if (Array.isArray(entries.taxas)) {
                  entries.taxas.forEach((taxa) => {
                    const nomeLower = ((taxa as any).nome || '').toLowerCase();
                    const valorStr = formatCurrency(taxa.valor);
                    const valorLower = valorStr.toLowerCase();
                    
                    if (nomeLower.includes(searchLower) || valorLower.includes(searchLower)) {
                      results.push({
                        type: 'taxa',
                        title: (taxa as any).nome || 'Taxa',
                        value: valorStr,
                        icon: '📋'
                      });
                    }
                  });
                }

                // Buscar em vales funcionários
                if (Array.isArray(exits.valesFuncionarios)) {
                  exits.valesFuncionarios.forEach((vale) => {
                    const nomeLower = (vale.nome || '').toLowerCase();
                    const valorStr = formatCurrency(vale.valor);
                    const valorLower = valorStr.toLowerCase();
                    
                    if (nomeLower.includes(searchLower) || valorLower.includes(searchLower)) {
                      results.push({
                        type: 'vale',
                        title: vale.nome,
                        value: valorStr,
                        icon: '👤'
                      });
                    }
                  });
                }

                // Buscar em saídas retiradas
                if (Array.isArray(exits.saidasRetiradas)) {
                  exits.saidasRetiradas.forEach((saida) => {
                    const descLower = saida.descricao.toLowerCase();
                    const valorStr = formatCurrency(saida.valor);
                    const valorLower = valorStr.toLowerCase();
                    
                    if (descLower.includes(searchLower) || valorLower.includes(searchLower)) {
                      results.push({
                        type: 'saidaRetirada',
                        title: saida.descricao,
                        value: valorStr,
                        icon: '🛒'
                      });
                    }
                  });
                }

                // Buscar em PIX Conta Clientes
                if (Array.isArray(entries.pixContaClientes)) {
                  entries.pixContaClientes.forEach((cliente) => {
                    const nomeLower = (cliente.nome || '').toLowerCase();
                    const valorStr = formatCurrency(cliente.valor);
                    const valorLower = valorStr.toLowerCase();
                    
                    if (nomeLower.includes(searchLower) || valorLower.includes(searchLower)) {
                      results.push({
                        type: 'cliente',
                        title: cliente.nome || 'Cliente sem nome',
                        value: valorStr,
                        details: 'PIX Conta',
                        icon: '💳'
                      });
                    }
                  });
                }

                // Buscar em Cartão Link Clientes
                if (Array.isArray(entries.cartaoLinkClientes)) {
                  entries.cartaoLinkClientes.forEach((cliente) => {
                    const nomeLower = (cliente.nome || '').toLowerCase();
                    const valorStr = formatCurrency(cliente.valor);
                    const valorLower = valorStr.toLowerCase();
                    
                    if (nomeLower.includes(searchLower) || valorLower.includes(searchLower)) {
                      results.push({
                        type: 'cliente',
                        title: cliente.nome || 'Cliente sem nome',
                        value: valorStr,
                        details: `Cartão Link${cliente.parcelas > 1 ? ` - ${cliente.parcelas}x` : ''}`,
                        icon: '💳'
                      });
                    }
                  });
                }

                // Buscar em Boletos Clientes
                if (Array.isArray(entries.boletosClientes)) {
                  entries.boletosClientes.forEach((cliente) => {
                    const nomeLower = (cliente.nome || '').toLowerCase();
                    const valorStr = formatCurrency(cliente.valor);
                    const valorLower = valorStr.toLowerCase();
                    
                    if (nomeLower.includes(searchLower) || valorLower.includes(searchLower)) {
                      results.push({
                        type: 'cliente',
                        title: cliente.nome || 'Cliente sem nome',
                        value: valorStr,
                        details: `Boleto${cliente.parcelas > 1 ? ` - ${cliente.parcelas}x` : ''}`,
                        icon: '📄'
                      });
                    }
                  });
                }

                // Buscar em Envios Correios (está em exits)
                if (Array.isArray(exits.enviosCorreios)) {
                  exits.enviosCorreios.forEach((envio) => {
                    const clienteLower = (envio.cliente || '').toLowerCase();
                    const valorStr = formatCurrency(envio.valor);
                    const valorLower = valorStr.toLowerCase();
                    
                    if (clienteLower.includes(searchLower) || valorLower.includes(searchLower)) {
                      results.push({
                        type: 'envio',
                        title: envio.cliente || 'Cliente sem nome',
                        value: valorStr,
                        details: `Correios - ${envio.tipo || ''} ${envio.estado || ''}`,
                        icon: '📦'
                      });
                    }
                  });
                }

                // Buscar em Envios Transportadora (está em exits)
                if (Array.isArray(exits.enviosTransportadora)) {
                  exits.enviosTransportadora.forEach((envio) => {
                    const clienteLower = (envio.nomeCliente || '').toLowerCase();
                    const valorStr = formatCurrency(envio.valor);
                    const valorLower = valorStr.toLowerCase();
                    
                    if (clienteLower.includes(searchLower) || valorLower.includes(searchLower)) {
                      results.push({
                        type: 'envio',
                        title: envio.nomeCliente || 'Cliente sem nome',
                        value: valorStr,
                        details: `Transportadora - ${envio.estado || ''}`,
                        icon: '🚚'
                      });
                    }
                  });
                }

                // Agrupar resultados por tipo
                const groupedResults = {
                  entradas: results.filter(r => r.type === 'entrada'),
                  saidas: results.filter(r => r.type === 'saida'),
                  clientes: results.filter(r => r.type === 'cliente'),
                  cheques: results.filter(r => r.type === 'cheque'),
                  taxas: results.filter(r => r.type === 'taxa'),
                  vales: results.filter(r => r.type === 'vale'),
                  saidasRetiradas: results.filter(r => r.type === 'saidaRetirada'),
                  envios: results.filter(r => r.type === 'envio')
                };

                const totalResults = results.length;

                if (totalResults === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="font-medium">Nenhum resultado encontrado</p>
                      <p className="text-sm text-gray-400 mt-1">Tente usar outros termos de busca</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Contador de resultados */}
                    <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="font-medium">{totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Entradas */}
                    {groupedResults.entradas.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">💰 Entradas</h4>
                        <div className="space-y-2">
                          {groupedResults.entradas.map((result, idx) => (
                            <div key={`entrada-${idx}`} className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span>{result.icon}</span>
                                  <span className="text-sm font-medium text-blue-800 capitalize">{result.title}</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">{result.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Saídas */}
                    {groupedResults.saidas.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">💸 Saídas</h4>
                        <div className="space-y-2">
                          {groupedResults.saidas.map((result, idx) => (
                            <div key={`saida-${idx}`} className="p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span>{result.icon}</span>
                                  <span className="text-sm font-medium text-red-800 capitalize">{result.title}</span>
                                </div>
                                <span className="text-lg font-bold text-red-600">{result.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clientes */}
                    {groupedResults.clientes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-purple-700 mb-2 uppercase tracking-wide">👥 Clientes</h4>
                        <div className="space-y-2">
                          {groupedResults.clientes.map((result, idx) => (
                            <div key={`cliente-${idx}`} className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span>{result.icon}</span>
                                    <span className="text-sm font-medium text-purple-800">{result.title}</span>
                                  </div>
                                  {result.details && (
                                    <div className="text-xs text-purple-600 mt-1 ml-6">{result.details}</div>
                                  )}
                                </div>
                                <span className="text-lg font-bold text-purple-600">{result.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Cheques */}
                    {groupedResults.cheques.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">🏦 Cheques</h4>
                        <div className="space-y-2">
                          {groupedResults.cheques.map((result, idx) => (
                            <div key={`cheque-${idx}`} className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span>{result.icon}</span>
                                    <span className="text-sm font-medium text-indigo-800">{result.title}</span>
                                  </div>
                                  {result.details && (
                                    <div className="text-xs text-indigo-600 mt-1 ml-6">{result.details}</div>
                                  )}
                                </div>
                                <span className="text-lg font-bold text-indigo-600">{result.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Taxas */}
                    {groupedResults.taxas.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-amber-700 mb-2 uppercase tracking-wide">📋 Taxas</h4>
                        <div className="space-y-2">
                          {groupedResults.taxas.map((result, idx) => (
                            <div key={`taxa-${idx}`} className="p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span>{result.icon}</span>
                                  <span className="text-sm font-medium text-amber-800">{result.title}</span>
                                </div>
                                <span className="text-lg font-bold text-amber-600">{result.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vales */}
                    {groupedResults.vales.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-teal-700 mb-2 uppercase tracking-wide">👤 Vales Funcionários</h4>
                        <div className="space-y-2">
                          {groupedResults.vales.map((result, idx) => (
                            <div key={`vale-${idx}`} className="p-3 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span>{result.icon}</span>
                                  <span className="text-sm font-medium text-teal-800">{result.title}</span>
                                </div>
                                <span className="text-lg font-bold text-teal-600">{result.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Saídas Retiradas */}
                    {groupedResults.saidasRetiradas.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-orange-700 mb-2 uppercase tracking-wide">🛒 Saídas Retiradas</h4>
                        <div className="space-y-2">
                          {groupedResults.saidasRetiradas.map((result, idx) => (
                            <div key={`saida-retirada-${idx}`} className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span>{result.icon}</span>
                                  <span className="text-sm font-medium text-orange-800">{result.title}</span>
                                </div>
                                <span className="text-lg font-bold text-orange-600">{result.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Envios */}
                    {groupedResults.envios.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-cyan-700 mb-2 uppercase tracking-wide">📦 Envios</h4>
                        <div className="space-y-2">
                          {groupedResults.envios.map((result, idx) => (
                            <div key={`envio-${idx}`} className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span>{result.icon}</span>
                                    <span className="text-sm font-medium text-cyan-800">{result.title}</span>
                                  </div>
                                  {result.details && (
                                    <div className="text-xs text-cyan-600 mt-1 ml-6">{result.details}</div>
                                  )}
                                </div>
                                <span className="text-lg font-bold text-cyan-600">{result.value}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gráficos e Visualizações */}
      {showChartsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-800">Gráficos e Visualizações</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Seletor de Período */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setChartPeriod('daily')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      chartPeriod === 'daily'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Diário
                  </button>
                  <button
                    onClick={() => setChartPeriod('weekly')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      chartPeriod === 'weekly'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Semanal
                  </button>
                  <button
                    onClick={() => setChartPeriod('monthly')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      chartPeriod === 'monthly'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Mensal
                  </button>
                </div>
                <button
                  onClick={() => {
                    setShowChartsModal(false);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                // Processar dados do histórico baseado no período selecionado
                const processData = () => {
                  if (!dailyHistory || dailyHistory.length === 0) {
                    return [];
                  }

                  const now = new Date();
                  let filteredData: DailyRecord[] = [];
                  let groupBy: 'day' | 'week' | 'month' = 'day';

                  if (chartPeriod === 'daily') {
                    // Últimos 30 dias
                    const thirtyDaysAgo = new Date(now);
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    filteredData = dailyHistory.filter(record => {
                      const recordDate = new Date(record.date);
                      return recordDate >= thirtyDaysAgo;
                    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    groupBy = 'day';
                  } else if (chartPeriod === 'weekly') {
                    // Últimas 12 semanas
                    const twelveWeeksAgo = new Date(now);
                    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
                    const allData = dailyHistory.filter(record => {
                      const recordDate = new Date(record.date);
                      return recordDate >= twelveWeeksAgo;
                    });

                    // Agrupar por semana
                    const weeklyMap = new Map<string, { entradas: number; saidas: number; saldo: number; count: number }>();
                    allData.forEach(record => {
                      const date = new Date(record.date);
                      const weekStart = new Date(date);
                      weekStart.setDate(date.getDate() - date.getDay());
                      const weekKey = weekStart.toISOString().split('T')[0];
                      
                      if (!weeklyMap.has(weekKey)) {
                        weeklyMap.set(weekKey, { entradas: 0, saidas: 0, saldo: 0, count: 0 });
                      }
                      const weekData = weeklyMap.get(weekKey)!;
                      weekData.entradas += record.entradas || 0;
                      weekData.saidas += record.saidas || 0;
                      weekData.saldo += record.saldo || 0;
                      weekData.count += 1;
                    });

                    filteredData = Array.from(weeklyMap.entries()).map(([date, data]) => {
                      const weekDate = new Date(date);
                      const weekNum = Math.ceil((weekDate.getDate() + (weekDate.getDay() === 0 ? 6 : weekDate.getDay() - 1)) / 7);
                      return {
                        date,
                        dateFormatted: `Sem ${weekNum}`,
                        entradas: data.entradas,
                        saidas: data.saidas,
                        saldo: data.saldo / data.count
                      };
                    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    groupBy = 'week';
                  } else if (chartPeriod === 'monthly') {
                    // Últimos 12 meses
                    const twelveMonthsAgo = new Date(now);
                    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
                    const allData = dailyHistory.filter(record => {
                      const recordDate = new Date(record.date);
                      return recordDate >= twelveMonthsAgo;
                    });

                    // Agrupar por mês
                    const monthlyMap = new Map<string, { entradas: number; saidas: number; saldo: number; count: number }>();
                    allData.forEach(record => {
                      const date = new Date(record.date);
                      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                      
                      if (!monthlyMap.has(monthKey)) {
                        monthlyMap.set(monthKey, { entradas: 0, saidas: 0, saldo: 0, count: 0 });
                      }
                      const monthData = monthlyMap.get(monthKey)!;
                      monthData.entradas += record.entradas || 0;
                      monthData.saidas += record.saidas || 0;
                      monthData.saldo += record.saldo || 0;
                      monthData.count += 1;
                    });

                    filteredData = Array.from(monthlyMap.entries()).map(([date, data]) => ({
                      date,
                      entradas: data.entradas,
                      saidas: data.saidas,
                      saldo: data.saldo / data.count
                    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    groupBy = 'month';
                  }

                  return filteredData.map(record => {
                    if (groupBy === 'week' && (record as any).dateFormatted) {
                      return record;
                    }
                    return {
                      ...record,
                      dateFormatted: groupBy === 'day'
                        ? new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                        : new Date(record.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                    };
                  });
                };

                const chartData = processData();
                const hasData = chartData.length > 0;

                // Calcular tendências
                const calculateTrends = () => {
                  if (chartData.length < 2) return null;
                  
                  const recent = chartData.slice(-7);
                  const previous = chartData.slice(-14, -7);
                  
                  if (previous.length === 0) return null;

                  const recentAvg = {
                    entradas: recent.reduce((sum, r) => sum + (r.entradas || 0), 0) / recent.length,
                    saidas: recent.reduce((sum, r) => sum + (r.saidas || 0), 0) / recent.length,
                    saldo: recent.reduce((sum, r) => sum + (r.saldo || 0), 0) / recent.length
                  };

                  const previousAvg = {
                    entradas: previous.reduce((sum, r) => sum + (r.entradas || 0), 0) / previous.length,
                    saidas: previous.reduce((sum, r) => sum + (r.saidas || 0), 0) / previous.length,
                    saldo: previous.reduce((sum, r) => sum + (r.saldo || 0), 0) / previous.length
                  };

                  return {
                    entradas: ((recentAvg.entradas - previousAvg.entradas) / previousAvg.entradas) * 100,
                    saidas: ((recentAvg.saidas - previousAvg.saidas) / previousAvg.saidas) * 100,
                    saldo: ((recentAvg.saldo - previousAvg.saldo) / previousAvg.saldo) * 100
                  };
                };

                const trends = calculateTrends();

                // Dados para gráfico de pizza (distribuição de entradas)
                const pieData = [
                  { name: 'Dinheiro', value: entries.dinheiro || 0 },
                  { name: 'Cartão', value: entries.cartao || 0 },
                  { name: 'Cartão Link', value: entries.cartaoLink || 0 },
                  { name: 'PIX Maquininha', value: entries.pixMaquininha || 0 },
                  { name: 'PIX Conta', value: entries.pixConta || 0 },
                  { name: 'Boletos', value: entries.boletos || 0 },
                  { name: 'Cheques', value: totalCheques || 0 }
                ].filter(item => item.value > 0);

                const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

                return (
                  <div className="space-y-6">
                    {!hasData ? (
                      <div className="text-center py-12 text-gray-500">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Nenhum dado histórico disponível</p>
                        <p className="text-sm text-gray-400 mt-2">
                          Os gráficos aparecerão após você fechar alguns movimentos de caixa
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Cards de Tendências */}
                        {trends && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-blue-800">Tendência Entradas</span>
                                <TrendingUp className={`w-4 h-4 ${trends.entradas >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                              </div>
                              <div className={`text-2xl font-bold ${trends.entradas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trends.entradas >= 0 ? '+' : ''}{trends.entradas.toFixed(1)}%
                              </div>
                              <div className="text-xs text-blue-600 mt-1">vs. período anterior</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-red-800">Tendência Saídas</span>
                                <TrendingDown className={`w-4 h-4 ${trends.saidas >= 0 ? 'text-red-600' : 'text-green-600'}`} />
                              </div>
                              <div className={`text-2xl font-bold ${trends.saidas >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {trends.saidas >= 0 ? '+' : ''}{trends.saidas.toFixed(1)}%
                              </div>
                              <div className="text-xs text-red-600 mt-1">vs. período anterior</div>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-purple-800">Tendência Saldo</span>
                                {trends.saldo >= 0 ? (
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                              <div className={`text-2xl font-bold ${trends.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {trends.saldo >= 0 ? '+' : ''}{trends.saldo.toFixed(1)}%
                              </div>
                              <div className="text-xs text-purple-600 mt-1">vs. período anterior</div>
                            </div>
                          </div>
                        )}

                        {/* Gráfico de Linha - Entradas vs Saídas */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">Entradas vs Saídas</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="dateFormatted" 
                                stroke="#6b7280"
                                fontSize={12}
                              />
                              <YAxis 
                                stroke="#6b7280"
                                fontSize={12}
                                tickFormatter={(value: number) => `R$ ${(value / 1000).toFixed(0)}k`}
                              />
                              <Tooltip 
                                formatter={(value: number | string) => formatCurrency(Number(value))}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="entradas" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                name="Entradas"
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="saidas" 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                name="Saídas"
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Gráfico de Barras - Comparativo */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">Comparativo Entradas/Saídas</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="dateFormatted" 
                                stroke="#6b7280"
                                fontSize={12}
                              />
                              <YAxis 
                                stroke="#6b7280"
                                fontSize={12}
                                tickFormatter={(value: number) => `R$ ${(value / 1000).toFixed(0)}k`}
                              />
                              <Tooltip 
                                formatter={(value: number | string) => formatCurrency(Number(value))}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                              />
                              <Legend />
                              <Bar dataKey="entradas" fill="#3b82f6" name="Entradas" radius={[8, 8, 0, 0]} />
                              <Bar dataKey="saidas" fill="#ef4444" name="Saídas" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Gráfico de Área - Saldo */}
                        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                          <h4 className="text-lg font-semibold text-gray-800 mb-4">Evolução do Saldo</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={chartData}>
                              <defs>
                                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="dateFormatted" 
                                stroke="#6b7280"
                                fontSize={12}
                              />
                              <YAxis 
                                stroke="#6b7280"
                                fontSize={12}
                                tickFormatter={(value: number) => `R$ ${(value / 1000).toFixed(0)}k`}
                              />
                              <Tooltip 
                                formatter={(value: number | string) => formatCurrency(Number(value))}
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="saldo" 
                                stroke="#8b5cf6" 
                                fillOpacity={1}
                                fill="url(#colorSaldo)"
                                name="Saldo"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Gráfico de Pizza - Distribuição de Entradas */}
                        {pieData.length > 0 && (
                          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">Distribuição de Entradas (Atual)</h4>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={100}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {toasts.map((toast, index) => (
        <ToastNotification
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={5000}
          onClose={() => removeToast(toast.id)}
          action={toast.action}
          index={index}
        />
      ))}

    </>
  );
}

export default React.memo(CashFlow);