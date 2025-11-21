import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart, Calendar, Download, RefreshCw, ArrowUpRight, ArrowDownRight, FileText, Search, Filter, History, Eye, User, Clock, GitCompare } from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { cashFlowAuditService, AuditLog } from '../services/cashFlowAuditService';
import { useAuth } from '../contexts/AuthContext';
import CashFlowFiltersComponent, { CashFlowFilters } from './CashFlowFilters';

interface CashFlowDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  currentData?: {
    entries: any;
    exits: any;
    totalEntradas: number;
    totalSaidas: number;
    saldo: number;
  };
}

interface DailyRecord {
  date: string;
  entradas: number;
  saidas: number;
  saldo: number;
  detalhes?: {
    dinheiro?: number;
    cartao?: number;
    pix?: number;
    boletos?: number;
    cheques?: number;
    [key: string]: any;
  };
}

function CashFlowDashboard({ isOpen, onClose, currentData }: CashFlowDashboardProps) {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [history, setHistory] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'audit'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedFechamento, setSelectedFechamento] = useState<DailyRecord | null>(null);
  const [comparePeriods, setComparePeriods] = useState(false);
  const [period1, setPeriod1] = useState({ start: '', end: '' });
  const [period2, setPeriod2] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState<CashFlowFilters>({
    quickSearch: '',
    dateStart: '',
    dateEnd: '',
    entryType: 'all',
    exitType: 'all',
    valueMin: '',
    valueMax: '',
    status: 'all'
  });
  const [savedRecords, setSavedRecords] = useState<any[]>([]);

  // Carregar histórico do localStorage
  useEffect(() => {
    if (isOpen) {
      loadHistory();
      loadAuditLogs();
      loadSavedRecords();
    }
  }, [isOpen, timeRange]);

  // Carregar registros salvos
  const loadSavedRecords = () => {
    try {
      const savedData = localStorage.getItem('cashFlowData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // Criar um array de registros salvos com timestamp
        const records = [];
        if (parsed.entries || parsed.exits) {
          records.push({
            id: 'current',
            date: new Date().toISOString(),
            entries: parsed.entries,
            exits: parsed.exits,
            cancelamentos: parsed.cancelamentos || [],
            status: 'aberto' // Registro atual está sempre aberto
          });
        }
        setSavedRecords(records);
      }
    } catch (error) {
      console.error('Erro ao carregar registros salvos:', error);
    }
  };

  // Carregar logs de auditoria
  const loadAuditLogs = () => {
    try {
      const logs = cashFlowAuditService.getLogs();
      setAuditLogs(logs);
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
    }
  };

  const loadHistory = () => {
    setLoading(true);
    try {
      const storedHistory = localStorage.getItem('cashflow_daily_history');
      const storedFechamentos = localStorage.getItem('cashflow_fechamentos');
      
      let historyData: DailyRecord[] = [];
      
      // Carregar histórico diário básico
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory);
        if (Array.isArray(parsed)) {
          historyData = parsed.filter((item: any) =>
            item && typeof item.date === 'string'
          );
        }
      }
      
      // Carregar fechamentos completos
      if (storedFechamentos) {
        try {
          const fechamentos = JSON.parse(storedFechamentos);
          if (Array.isArray(fechamentos)) {
            // Combinar com histórico existente
            fechamentos.forEach((fechamento: any) => {
              const existingIndex = historyData.findIndex(h => h.date === fechamento.date);
              if (existingIndex >= 0) {
                historyData[existingIndex] = { ...historyData[existingIndex], ...fechamento };
              } else {
                historyData.push(fechamento);
              }
            });
          }
        } catch (e) {
          console.warn('Erro ao carregar fechamentos:', e);
        }
      }
      
      // Ordenar por data
      historyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Filtrar por período
      const now = new Date();
      let filteredData = historyData;
      
      if (timeRange === '7d') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredData = historyData.filter(h => new Date(h.date) >= sevenDaysAgo);
      } else if (timeRange === '30d') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredData = historyData.filter(h => new Date(h.date) >= thirtyDaysAgo);
      } else if (timeRange === '90d') {
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filteredData = historyData.filter(h => new Date(h.date) >= ninetyDaysAgo);
      }
      
      setHistory(filteredData);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular dados mensais (mês atual vs mês anterior)
  const monthlyComparison = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Mês anterior
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const currentMonthData = history.filter(h => {
      const date = new Date(h.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const lastMonthData = history.filter(h => {
      const date = new Date(h.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });
    
    const calcMonthMetrics = (data: DailyRecord[]) => {
      const entradas = data.reduce((sum, h) => sum + (h.entradas || 0), 0);
      const saidas = data.reduce((sum, h) => sum + (h.saidas || 0), 0);
      const saldo = entradas - saidas;
      const dias = data.filter(h => (h.entradas || 0) > 0 || (h.saidas || 0) > 0).length;
      const ticketMedio = dias > 0 ? entradas / dias : 0;
      const maiorEntrada = data.length > 0 ? Math.max(...data.map(h => h.entradas || 0)) : 0;
      
      return { entradas, saidas, saldo, dias, ticketMedio, maiorEntrada };
    };
    
    const current = calcMonthMetrics(currentMonthData);
    const last = calcMonthMetrics(lastMonthData);
    
    const calcGrowth = (current: number, last: number) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return ((current - last) / last) * 100;
    };
    
    return {
      current: {
        ...current,
        monthName: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      },
      last: {
        ...last,
        monthName: new Date(lastMonthYear, lastMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      },
      growth: {
        entradas: calcGrowth(current.entradas, last.entradas),
        saidas: calcGrowth(current.saidas, last.saidas),
        saldo: calcGrowth(current.saldo, last.saldo),
        ticketMedio: calcGrowth(current.ticketMedio, last.ticketMedio),
      }
    };
  }, [history]);

  // Calcular métricas
  const metrics = useMemo(() => {
    if (history.length === 0) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        saldoMedio: 0,
        maiorEntrada: 0,
        maiorSaida: 0,
        diasComMovimento: 0,
        crescimento: 0,
        ticketMedio: 0,
      };
    }

    const totalEntradas = history.reduce((sum, h) => sum + (h.entradas || 0), 0);
    const totalSaidas = history.reduce((sum, h) => sum + (h.saidas || 0), 0);
    const saldos = history.map(h => h.saldo || 0).filter(s => s !== 0);
    const saldoMedio = saldos.length > 0 ? saldos.reduce((a, b) => a + b, 0) / saldos.length : 0;
    const maiorEntrada = Math.max(...history.map(h => h.entradas || 0));
    const maiorSaida = Math.max(...history.map(h => h.saidas || 0));
    const diasComMovimento = history.filter(h => (h.entradas || 0) > 0 || (h.saidas || 0) > 0).length;
    
    // Calcular crescimento (comparar últimos 7 dias com 7 dias anteriores)
    let crescimento = 0;
    if (history.length >= 14) {
      const ultimos7 = history.slice(-7).reduce((sum, h) => sum + (h.entradas || 0), 0);
      const anteriores7 = history.slice(-14, -7).reduce((sum, h) => sum + (h.entradas || 0), 0);
      if (anteriores7 > 0) {
        crescimento = ((ultimos7 - anteriores7) / anteriores7) * 100;
      }
    }
    
    const ticketMedio = diasComMovimento > 0 ? totalEntradas / diasComMovimento : 0;

    return {
      totalEntradas,
      totalSaidas,
      saldoMedio,
      maiorEntrada,
      maiorSaida,
      diasComMovimento,
      crescimento,
      ticketMedio,
    };
  }, [history]);

  // Dados para gráfico de linha
  const lineChartData = useMemo(() => {
    return history.map(h => ({
      date: new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      entradas: h.entradas || 0,
      saidas: h.saidas || 0,
      saldo: h.saldo || 0,
    }));
  }, [history]);

  // Dados para gráfico de pizza (distribuição de pagamentos)
  const pieChartData = useMemo(() => {
    if (!currentData?.entries) return [];
    
    const data = [];
    if (currentData.entries.dinheiro > 0) {
      data.push({ name: 'Dinheiro', value: currentData.entries.dinheiro, color: '#10b981' });
    }
    if (currentData.entries.cartao > 0) {
      data.push({ name: 'Cartão', value: currentData.entries.cartao, color: '#3b82f6' });
    }
    if (currentData.entries.pixMaquininha > 0) {
      data.push({ name: 'PIX Maquininha', value: currentData.entries.pixMaquininha, color: '#8b5cf6' });
    }
    if (currentData.entries.pixConta > 0) {
      data.push({ name: 'PIX Conta', value: currentData.entries.pixConta, color: '#ec4899' });
    }
    if (currentData.entries.boletos > 0) {
      data.push({ name: 'Boletos', value: currentData.entries.boletos, color: '#f59e0b' });
    }
    if (currentData.entries.cartaoLink > 0) {
      data.push({ name: 'Cartão Link', value: currentData.entries.cartaoLink, color: '#06b6d4' });
    }
    
    const totalCheques = Array.isArray(currentData.entries.cheques)
      ? currentData.entries.cheques.reduce((sum: number, c: any) => sum + (c.valor || 0), 0)
      : (currentData.entries.cheque || 0);
    if (totalCheques > 0) {
      data.push({ name: 'Cheques', value: totalCheques, color: '#14b8a6' });
    }
    
    return data;
  }, [currentData]);

  // Renderizar gráfico de linha
  const renderLineChart = () => {
    if (lineChartData.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum dado disponível</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(
      ...lineChartData.map(d => Math.max(d.entradas, d.saidas, Math.abs(d.saldo)))
    );
    const chartHeight = 150;
    const chartWidth = Math.max(500, lineChartData.length * 35);
    const padding = 30;

    return (
      <div className="overflow-x-auto">
        <svg width={chartWidth} height={chartHeight + padding * 2} className="w-full">
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line
                x1={padding}
                y1={padding + ratio * chartHeight}
                x2={chartWidth - padding}
                y2={padding + ratio * chartHeight}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding - 10}
                y={padding + ratio * chartHeight + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
              >
                {formatCurrency(maxValue * (1 - ratio))}
              </text>
            </g>
          ))}

          {/* Linha de Entradas */}
          {lineChartData.map((point, index) => {
            if (index === 0) return null;
            const x1 = padding + ((index - 1) / (lineChartData.length - 1)) * (chartWidth - padding * 2);
            const y1 = padding + chartHeight - ((lineChartData[index - 1].entradas / maxValue) * chartHeight);
            const x2 = padding + (index / (lineChartData.length - 1)) * (chartWidth - padding * 2);
            const y2 = padding + chartHeight - ((point.entradas / maxValue) * chartHeight);
            
            return (
              <line
                key={`entrada-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#10b981"
                strokeWidth="2"
                fill="none"
              />
            );
          })}

          {/* Linha de Saídas */}
          {lineChartData.map((point, index) => {
            if (index === 0) return null;
            const x1 = padding + ((index - 1) / (lineChartData.length - 1)) * (chartWidth - padding * 2);
            const y1 = padding + chartHeight - ((lineChartData[index - 1].saidas / maxValue) * chartHeight);
            const x2 = padding + (index / (lineChartData.length - 1)) * (chartWidth - padding * 2);
            const y2 = padding + chartHeight - ((point.saidas / maxValue) * chartHeight);
            
            return (
              <line
                key={`saida-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#ef4444"
                strokeWidth="2"
                fill="none"
              />
            );
          })}

          {/* Pontos */}
          {lineChartData.map((point, index) => {
            const x = padding + (index / (lineChartData.length - 1)) * (chartWidth - padding * 2);
            const yEntrada = padding + chartHeight - ((point.entradas / maxValue) * chartHeight);
            const ySaida = padding + chartHeight - ((point.saidas / maxValue) * chartHeight);
            
            return (
              <g key={`points-${index}`}>
                <circle cx={x} cy={yEntrada} r="4" fill="#10b981" />
                <circle cx={x} cy={ySaida} r="4" fill="#ef4444" />
                <text
                  x={x}
                  y={chartHeight + padding + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                  transform={`rotate(-45 ${x} ${chartHeight + padding + 15})`}
                >
                  {point.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  // Função para exportar para Excel (CSV)
  const exportToExcel = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '_');
    
    // Cabeçalho
    const csvRows: string[] = [];
    csvRows.push('RELATÓRIO DE MOVIMENTO DE CAIXA');
    csvRows.push(`Gerado em: ${now.toLocaleString('pt-BR')}`);
    csvRows.push('');
    
    // Métricas Gerais
    csvRows.push('=== MÉTRICAS GERAIS ===');
    csvRows.push(`Total Entradas,${formatCurrency(metrics.totalEntradas)}`);
    csvRows.push(`Total Saídas,${formatCurrency(metrics.totalSaidas)}`);
    csvRows.push(`Saldo Médio,${formatCurrency(metrics.saldoMedio)}`);
    csvRows.push(`Ticket Médio,${formatCurrency(metrics.ticketMedio)}`);
    csvRows.push(`Maior Entrada,${formatCurrency(metrics.maiorEntrada)}`);
    csvRows.push(`Maior Saída,${formatCurrency(metrics.maiorSaida)}`);
    csvRows.push(`Dias com Movimento,${metrics.diasComMovimento}`);
    csvRows.push('');
    
    // Comparativo Mensal
    csvRows.push('=== COMPARATIVO MENSAL ===');
    csvRows.push(`Mês Atual,${monthlyComparison.current.monthName}`);
    csvRows.push(`Mês Anterior,${monthlyComparison.last.monthName}`);
    csvRows.push('');
    csvRows.push('Métrica,Mês Atual,Mês Anterior,Crescimento %');
    csvRows.push(`Entradas,${formatCurrency(monthlyComparison.current.entradas)},${formatCurrency(monthlyComparison.last.entradas)},${monthlyComparison.growth.entradas.toFixed(2)}%`);
    csvRows.push(`Saídas,${formatCurrency(monthlyComparison.current.saidas)},${formatCurrency(monthlyComparison.last.saidas)},${monthlyComparison.growth.saidas.toFixed(2)}%`);
    csvRows.push(`Saldo,${formatCurrency(monthlyComparison.current.saldo)},${formatCurrency(monthlyComparison.last.saldo)},${monthlyComparison.growth.saldo.toFixed(2)}%`);
    csvRows.push(`Ticket Médio,${formatCurrency(monthlyComparison.current.ticketMedio)},${formatCurrency(monthlyComparison.last.ticketMedio)},${monthlyComparison.growth.ticketMedio.toFixed(2)}%`);
    csvRows.push('');
    
    // Histórico de Movimentações
    csvRows.push('=== HISTÓRICO DE MOVIMENTAÇÕES ===');
    csvRows.push('Data,Entradas,Saídas,Saldo');
    history.slice().reverse().forEach(record => {
      csvRows.push(`${new Date(record.date).toLocaleDateString('pt-BR')},${formatCurrency(record.entradas || 0)},${formatCurrency(record.saidas || 0)},${formatCurrency(record.saldo || 0)}`);
    });
    
    // Converter para CSV
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_caixa_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Função para exportar para PDF
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Movimento de Caixa - ${dateStr}</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
                size: A4 landscape;
              }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #059669;
              border-bottom: 3px solid #059669;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            h2 {
              color: #047857;
              margin-top: 30px;
              margin-bottom: 15px;
              border-bottom: 2px solid #d1fae5;
              padding-bottom: 5px;
            }
            h3 {
              color: #065f46;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .metric-card {
              border: 1px solid #d1fae5;
              border-radius: 8px;
              padding: 15px;
              background: #f0fdf4;
            }
            .metric-label {
              font-size: 12px;
              color: #047857;
              margin-bottom: 5px;
            }
            .metric-value {
              font-size: 20px;
              font-weight: bold;
              color: #065f46;
            }
            .comparison-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 20px 0;
            }
            .comparison-card {
              border: 1px solid #e0e7ff;
              border-radius: 8px;
              padding: 15px;
              background: #f5f3ff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: #059669;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: bold;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #e5e7eb;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            .positive {
              color: #059669;
              font-weight: bold;
            }
            .negative {
              color: #dc2626;
              font-weight: bold;
            }
            .header-info {
              text-align: right;
              color: #6b7280;
              margin-bottom: 20px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <strong>Relatório Gerado em:</strong> ${dateStr} às ${timeStr}
          </div>
          
          <h1>📊 Relatório de Movimento de Caixa</h1>
          
          <h2>Métricas Gerais</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Total Entradas</div>
              <div class="metric-value">${formatCurrency(metrics.totalEntradas)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Saídas</div>
              <div class="metric-value">${formatCurrency(metrics.totalSaidas)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Saldo Médio</div>
              <div class="metric-value">${formatCurrency(metrics.saldoMedio)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Ticket Médio</div>
              <div class="metric-value">${formatCurrency(metrics.ticketMedio)}</div>
            </div>
          </div>
          
          <h2>Comparativo Mensal</h2>
          <p><strong>Mês Atual:</strong> ${monthlyComparison.current.monthName} | <strong>Mês Anterior:</strong> ${monthlyComparison.last.monthName}</p>
          
          <div class="comparison-grid">
            <div class="comparison-card">
              <div class="metric-label">Entradas</div>
              <div class="metric-value">${formatCurrency(monthlyComparison.current.entradas)}</div>
              <div style="font-size: 11px; margin-top: 5px;">
                Anterior: ${formatCurrency(monthlyComparison.last.entradas)}<br>
                <span class="${monthlyComparison.growth.entradas >= 0 ? 'positive' : 'negative'}">
                  ${monthlyComparison.growth.entradas >= 0 ? '↑' : '↓'} ${Math.abs(monthlyComparison.growth.entradas).toFixed(2)}%
                </span>
              </div>
            </div>
            <div class="comparison-card">
              <div class="metric-label">Saídas</div>
              <div class="metric-value">${formatCurrency(monthlyComparison.current.saidas)}</div>
              <div style="font-size: 11px; margin-top: 5px;">
                Anterior: ${formatCurrency(monthlyComparison.last.saidas)}<br>
                <span class="${monthlyComparison.growth.saidas >= 0 ? 'negative' : 'positive'}">
                  ${monthlyComparison.growth.saidas >= 0 ? '↑' : '↓'} ${Math.abs(monthlyComparison.growth.saidas).toFixed(2)}%
                </span>
              </div>
            </div>
            <div class="comparison-card">
              <div class="metric-label">Saldo</div>
              <div class="metric-value ${monthlyComparison.current.saldo >= 0 ? 'positive' : 'negative'}">
                ${formatCurrency(monthlyComparison.current.saldo)}
              </div>
              <div style="font-size: 11px; margin-top: 5px;">
                Anterior: ${formatCurrency(monthlyComparison.last.saldo)}<br>
                <span class="${monthlyComparison.growth.saldo >= 0 ? 'positive' : 'negative'}">
                  ${monthlyComparison.growth.saldo >= 0 ? '↑' : '↓'} ${Math.abs(monthlyComparison.growth.saldo).toFixed(2)}%
                </span>
              </div>
            </div>
            <div class="comparison-card">
              <div class="metric-label">Ticket Médio</div>
              <div class="metric-value">${formatCurrency(monthlyComparison.current.ticketMedio)}</div>
              <div style="font-size: 11px; margin-top: 5px;">
                Anterior: ${formatCurrency(monthlyComparison.last.ticketMedio)}<br>
                <span class="${monthlyComparison.growth.ticketMedio >= 0 ? 'positive' : 'negative'}">
                  ${monthlyComparison.growth.ticketMedio >= 0 ? '↑' : '↓'} ${Math.abs(monthlyComparison.growth.ticketMedio).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <h2>Histórico de Movimentações</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th style="text-align: right;">Entradas</th>
                <th style="text-align: right;">Saídas</th>
                <th style="text-align: right;">Saldo</th>
              </tr>
            </thead>
            <tbody>
              ${history.slice().reverse().map(record => `
                <tr>
                  <td>${new Date(record.date).toLocaleDateString('pt-BR')}</td>
                  <td style="text-align: right;" class="positive">${formatCurrency(record.entradas || 0)}</td>
                  <td style="text-align: right;" class="negative">${formatCurrency(record.saidas || 0)}</td>
                  <td style="text-align: right;" class="${(record.saldo || 0) >= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(record.saldo || 0)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>PloutosLedger - Sistema de Gestão Financeira</p>
            <p>Relatório gerado automaticamente em ${dateStr} às ${timeStr}</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Aguardar carregamento e imprimir
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Renderizar gráfico de pizza
  const renderPieChart = () => {
    if (pieChartData.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <PieChart className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum dado disponível</p>
          </div>
        </div>
      );
    }

    const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
    const size = 160;
    const radius = 60;
    const centerX = size / 2;
    const centerY = size / 2;
    
    let currentAngle = -90; // Começar do topo
    
    return (
      <div className="flex items-center justify-center gap-4">
        <svg width={size} height={size}>
          {pieChartData.map((item, index) => {
            const percentage = item.value / total;
            const angle = percentage * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
            
            const largeArcFlag = angle > 180 ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle = endAngle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={item.color}
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        <div className="space-y-1.5">
          {pieChartData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-gray-700">{item.name}</span>
                <span className="text-xs font-semibold text-gray-900">
                  {formatCurrency(item.value)} ({percentage}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-1 overflow-y-auto pt-16">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-3 py-1.5 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xs font-bold text-gray-900">Dashboard de Movimento de Caixa</h2>
            <p className="text-xs text-gray-600">Análises e gráficos do seu caixa</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium"
              title="Exportar para Excel"
            >
              <Download className="w-3 h-3" />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-0.5 px-2 py-0.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium"
              title="Exportar para PDF"
            >
              <FileText className="w-3 h-3" />
              PDF
            </button>
            <button
              onClick={() => {
                loadHistory();
                loadAuditLogs();
              }}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tabs de Navegação */}
        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
            <div className="flex items-center gap-0.5 flex-wrap">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'history', label: 'Histórico', icon: History },
                { id: 'audit', label: 'Auditoria', icon: Eye }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>
            {activeTab === 'dashboard' && (
              <div className="flex items-center gap-0.5 flex-wrap">
                <span className="text-xs font-medium text-gray-700">Período:</span>
                {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-1.5 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : range === '90d' ? '90 dias' : 'Todos'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <>
                  {/* Cards de Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-2 border border-emerald-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-emerald-700">Total Entradas</span>
                    <TrendingUp className="w-3 h-3 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-emerald-900">
                    {formatCurrency(metrics.totalEntradas)}
                  </p>
                  {metrics.crescimento !== 0 && (
                    <p className={`text-xs mt-0.5 ${metrics.crescimento > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {metrics.crescimento > 0 ? '↑' : '↓'} {Math.abs(metrics.crescimento).toFixed(1)}%
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-2 border border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-red-700">Total Saídas</span>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                  </div>
                  <p className="text-sm font-bold text-red-900">
                    {formatCurrency(metrics.totalSaidas)}
                  </p>
                  <p className="text-xs mt-0.5 text-red-700">
                    {metrics.diasComMovimento} dias
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-blue-700">Saldo Médio</span>
                    <DollarSign className="w-3 h-3 text-blue-600" />
                  </div>
                  <p className="text-sm font-bold text-blue-900">
                    {formatCurrency(metrics.saldoMedio)}
                  </p>
                  <p className="text-xs mt-0.5 text-blue-700">
                    Média de {history.length} dias
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2 border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-purple-700">Ticket Médio</span>
                    <BarChart3 className="w-3 h-3 text-purple-600" />
                  </div>
                  <p className="text-sm font-bold text-purple-900">
                    {formatCurrency(metrics.ticketMedio)}
                  </p>
                  <p className="text-xs mt-0.5 text-purple-700">
                    Por dia
                  </p>
                </div>
              </div>

              {/* Comparativo Mensal */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-md p-4 border border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Comparativo Mensal</h3>
                    <p className="text-xs text-gray-600">Este mês vs mês anterior</p>
                  </div>
                </div>

                {/* Cards Comparativos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {/* Entradas */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-600">Total Entradas</span>
                      {monthlyComparison.growth.entradas >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-base font-bold text-gray-900">
                        {formatCurrency(monthlyComparison.current.entradas)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {monthlyComparison.last.monthName}: {formatCurrency(monthlyComparison.last.entradas)}
                      </p>
                      <p className={`text-xs font-semibold ${
                        monthlyComparison.growth.entradas >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {monthlyComparison.growth.entradas >= 0 ? '↑' : '↓'} {Math.abs(monthlyComparison.growth.entradas).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Saídas */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-600">Total Saídas</span>
                      {monthlyComparison.growth.saidas >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-base font-bold text-gray-900">
                        {formatCurrency(monthlyComparison.current.saidas)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {monthlyComparison.last.monthName}: {formatCurrency(monthlyComparison.last.saidas)}
                      </p>
                      <p className={`text-xs font-semibold ${
                        monthlyComparison.growth.saidas >= 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {monthlyComparison.growth.saidas >= 0 ? '↑' : '↓'} {Math.abs(monthlyComparison.growth.saidas).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Saldo */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-600">Saldo Final</span>
                      {monthlyComparison.growth.saldo >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-base font-bold ${
                        monthlyComparison.current.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(monthlyComparison.current.saldo)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {monthlyComparison.last.monthName}: {formatCurrency(monthlyComparison.last.saldo)}
                      </p>
                      <p className={`text-xs font-semibold ${
                        monthlyComparison.growth.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {monthlyComparison.growth.saldo >= 0 ? '↑' : '↓'} {Math.abs(monthlyComparison.growth.saldo).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Ticket Médio */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-600">Ticket Médio</span>
                      {monthlyComparison.growth.ticketMedio >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-base font-bold text-gray-900">
                        {formatCurrency(monthlyComparison.current.ticketMedio)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {monthlyComparison.last.monthName}: {formatCurrency(monthlyComparison.last.ticketMedio)}
                      </p>
                      <p className={`text-xs font-semibold ${
                        monthlyComparison.growth.ticketMedio >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {monthlyComparison.growth.ticketMedio >= 0 ? '↑' : '↓'} {Math.abs(monthlyComparison.growth.ticketMedio).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gráfico Comparativo de Barras */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Comparativo Visual</h4>
                  <div className="space-y-2">
                    {/* Entradas */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-700">Entradas</span>
                        <span className="text-xs text-gray-500">
                          {monthlyComparison.current.monthName} vs {monthlyComparison.last.monthName}
                        </span>
                      </div>
                      <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex">
                          <div
                            className="bg-emerald-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(100, (monthlyComparison.current.entradas / Math.max(monthlyComparison.current.entradas, monthlyComparison.last.entradas, 1)) * 100)}%` }}
                          >
                            {monthlyComparison.current.entradas > 0 && (
                              <span className="text-xs font-semibold text-white">
                                {formatCurrency(monthlyComparison.current.entradas)}
                              </span>
                            )}
                          </div>
                          <div
                            className="bg-emerald-300 flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(100, (monthlyComparison.last.entradas / Math.max(monthlyComparison.current.entradas, monthlyComparison.last.entradas, 1)) * 100)}%` }}
                          >
                            {monthlyComparison.last.entradas > 0 && (
                              <span className="text-xs font-semibold text-emerald-800">
                                {formatCurrency(monthlyComparison.last.entradas)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-emerald-600 font-medium">
                          {monthlyComparison.current.monthName}
                        </span>
                        <span className="text-emerald-800 font-medium">
                          {monthlyComparison.last.monthName}
                        </span>
                      </div>
                    </div>

                    {/* Saídas */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-700">Saídas</span>
                      </div>
                      <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex">
                          <div
                            className="bg-red-500 flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(100, (monthlyComparison.current.saidas / Math.max(monthlyComparison.current.saidas, monthlyComparison.last.saidas, 1)) * 100)}%` }}
                          >
                            {monthlyComparison.current.saidas > 0 && (
                              <span className="text-xs font-semibold text-white">
                                {formatCurrency(monthlyComparison.current.saidas)}
                              </span>
                            )}
                          </div>
                          <div
                            className="bg-red-300 flex items-center justify-end pr-2"
                            style={{ width: `${Math.min(100, (monthlyComparison.last.saidas / Math.max(monthlyComparison.current.saidas, monthlyComparison.last.saidas, 1)) * 100)}%` }}
                          >
                            {monthlyComparison.last.saidas > 0 && (
                              <span className="text-xs font-semibold text-red-800">
                                {formatCurrency(monthlyComparison.last.saidas)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-red-600 font-medium">
                          {monthlyComparison.current.monthName}
                        </span>
                        <span className="text-red-800 font-medium">
                          {monthlyComparison.last.monthName}
                        </span>
                      </div>
                    </div>

                    {/* Saldo */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-700">Saldo Final</span>
                      </div>
                      <div className="relative h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div className="absolute inset-0 flex">
                          <div
                            className={`flex items-center justify-end pr-2 ${
                              monthlyComparison.current.saldo >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.abs(monthlyComparison.current.saldo) / Math.max(Math.abs(monthlyComparison.current.saldo), Math.abs(monthlyComparison.last.saldo), 1) * 100)}%` }}
                          >
                            {monthlyComparison.current.saldo !== 0 && (
                              <span className="text-xs font-semibold text-white">
                                {formatCurrency(monthlyComparison.current.saldo)}
                              </span>
                            )}
                          </div>
                          <div
                            className={`flex items-center justify-end pr-2 ${
                              monthlyComparison.last.saldo >= 0 ? 'bg-emerald-300' : 'bg-red-300'
                            }`}
                            style={{ width: `${Math.min(100, Math.abs(monthlyComparison.last.saldo) / Math.max(Math.abs(monthlyComparison.current.saldo), Math.abs(monthlyComparison.last.saldo), 1) * 100)}%` }}
                          >
                            {monthlyComparison.last.saldo !== 0 && (
                              <span className={`text-xs font-semibold ${
                                monthlyComparison.last.saldo >= 0 ? 'text-emerald-800' : 'text-red-800'
                              }`}>
                                {formatCurrency(monthlyComparison.last.saldo)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className={`font-medium ${
                          monthlyComparison.current.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {monthlyComparison.current.monthName}
                        </span>
                        <span className={`font-medium ${
                          monthlyComparison.last.saldo >= 0 ? 'text-emerald-800' : 'text-red-800'
                        }`}>
                          {monthlyComparison.last.monthName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Gráfico de Linha */}
                <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">Evolução Diária</h3>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-gray-600">Entradas</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className="text-gray-600">Saídas</span>
                      </div>
                    </div>
                  </div>
                  {renderLineChart()}
                </div>

                {/* Gráfico de Pizza */}
                <div className="bg-white rounded-lg shadow-md p-3 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Distribuição por Tipo de Pagamento
                  </h3>
                  {renderPieChart()}
                </div>
              </div>

              {/* Tabela de Histórico */}
              {history.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Histórico de Movimentações</h3>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Entradas</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Saídas</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {history.slice().reverse().map((record, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                {new Date(record.date).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-right text-emerald-600 font-medium">
                                {formatCurrency(record.entradas || 0)}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-xs text-right text-red-600 font-medium">
                                {formatCurrency(record.saidas || 0)}
                              </td>
                              <td className={`px-3 py-2 whitespace-nowrap text-xs text-right font-semibold ${
                                (record.saldo || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(record.saldo || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
                </div>
              )}

              {history.length === 0 && (
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm mb-1.5">Nenhum histórico disponível</p>
                  <p className="text-gray-500 text-xs">
                    Os dados aparecerão aqui após você fechar movimentos de caixa
                  </p>
                </div>
              )}
                </>
              )}

              {/* Tab Histórico */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  {/* Componente de Filtros Avançados */}
                  <CashFlowFiltersComponent
                    filters={filters}
                    onFiltersChange={setFilters}
                    showAdvanced={true}
                  />

                  {/* Comparação de Períodos */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Comparação de Períodos</h3>
                      <button
                        onClick={() => setComparePeriods(!comparePeriods)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          comparePeriods
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <GitCompare className="w-4 h-4" />
                        {comparePeriods ? 'Ocultar' : 'Mostrar'} Comparação
                      </button>
                    </div>
                  </div>

                  {/* Comparação de Períodos */}
                  {comparePeriods && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <GitCompare className="w-5 h-5" />
                        Comparação de Períodos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Período 1 - Início</label>
                          <input
                            type="date"
                            value={period1.start}
                            onChange={(e) => setPeriod1(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Período 1 - Fim</label>
                          <input
                            type="date"
                            value={period1.end}
                            onChange={(e) => setPeriod1(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Período 2 - Início</label>
                          <input
                            type="date"
                            value={period2.start}
                            onChange={(e) => setPeriod2(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Período 2 - Fim</label>
                          <input
                            type="date"
                            value={period2.end}
                            onChange={(e) => setPeriod2(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>
                      {period1.start && period1.end && period2.start && period2.end && (() => {
                        const p1Data = history.filter(h => {
                          const date = new Date(h.date);
                          return date >= new Date(period1.start) && date <= new Date(period1.end);
                        });
                        const p2Data = history.filter(h => {
                          const date = new Date(h.date);
                          return date >= new Date(period2.start) && date <= new Date(period2.end);
                        });
                        const p1Total = p1Data.reduce((sum, h) => sum + (h.entradas || 0), 0);
                        const p2Total = p2Data.reduce((sum, h) => sum + (h.entradas || 0), 0);
                        const diff = p2Total - p1Total;
                        const diffPercent = p1Total > 0 ? ((diff / p1Total) * 100) : 0;
                        
                        return (
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Período 1</p>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(p1Total)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Período 2</p>
                                <p className="text-xl font-bold text-indigo-600">{formatCurrency(p2Total)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Diferença</p>
                                <p className={`text-xl font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {formatCurrency(diff)} ({diffPercent >= 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Lista de Fechamentos */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Fechamentos Anteriores</h3>
                      <span className="text-sm text-gray-600">{history.length} {history.length === 1 ? 'fechamento' : 'fechamentos'}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Entradas</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saídas</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(() => {
                            let filteredHistory = history;
                            
                            // Aplicar filtros avançados
                            if (filters.quickSearch) {
                              filteredHistory = filteredHistory.filter(h => {
                                const dateStr = new Date(h.date).toLocaleDateString('pt-BR');
                                const entradasStr = formatCurrency(h.entradas || 0);
                                const saidasStr = formatCurrency(h.saidas || 0);
                                const searchLower = filters.quickSearch.toLowerCase();
                                return dateStr.toLowerCase().includes(searchLower) || 
                                       entradasStr.toLowerCase().includes(searchLower) || 
                                       saidasStr.toLowerCase().includes(searchLower) ||
                                       String(h.entradas || 0).includes(searchLower) ||
                                       String(h.saidas || 0).includes(searchLower);
                              });
                            }
                            
                            // Filtro por período
                            if (filters.dateStart) {
                              filteredHistory = filteredHistory.filter(h => 
                                new Date(h.date) >= new Date(filters.dateStart)
                              );
                            }
                            
                            if (filters.dateEnd) {
                              const endDate = new Date(filters.dateEnd);
                              endDate.setHours(23, 59, 59, 999);
                              filteredHistory = filteredHistory.filter(h => 
                                new Date(h.date) <= endDate
                              );
                            }
                            
                            // Filtro por faixa de valores
                            if (filters.valueMin) {
                              const minValue = Number(filters.valueMin) / 100;
                              filteredHistory = filteredHistory.filter(h => 
                                (h.entradas || 0) >= minValue || (h.saidas || 0) >= minValue || (h.saldo || 0) >= minValue
                              );
                            }
                            
                            if (filters.valueMax) {
                              const maxValue = Number(filters.valueMax) / 100;
                              filteredHistory = filteredHistory.filter(h => 
                                (h.entradas || 0) <= maxValue && (h.saidas || 0) <= maxValue && (h.saldo || 0) <= maxValue
                              );
                            }
                            
                            // Filtro por status (fechado = histórico, aberto = registro atual)
                            if (filters.status === 'fechado') {
                              // Todos os registros do histórico são fechados
                              filteredHistory = filteredHistory;
                            } else if (filters.status === 'aberto') {
                              // Apenas registros abertos (não há no histórico, apenas no registro atual)
                              filteredHistory = [];
                            }
                            
                            // Aplicar filtros legados (para compatibilidade)
                            if (searchTerm && !filters.quickSearch) {
                              filteredHistory = filteredHistory.filter(h => {
                                const dateStr = new Date(h.date).toLocaleDateString('pt-BR');
                                const entradasStr = formatCurrency(h.entradas || 0);
                                const saidasStr = formatCurrency(h.saidas || 0);
                                return dateStr.includes(searchTerm) || 
                                       entradasStr.includes(searchTerm) || 
                                       saidasStr.includes(searchTerm);
                              });
                            }
                            
                            if (dateRange.start && !filters.dateStart) {
                              filteredHistory = filteredHistory.filter(h => 
                                new Date(h.date) >= new Date(dateRange.start)
                              );
                            }
                            
                            if (dateRange.end && !filters.dateEnd) {
                              filteredHistory = filteredHistory.filter(h => 
                                new Date(h.date) <= new Date(dateRange.end)
                              );
                            }
                            
                            return filteredHistory.slice().reverse().map((record, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(record.date).toLocaleDateString('pt-BR', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric' 
                                  })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-emerald-600 font-medium">
                                  {formatCurrency(record.entradas || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600 font-medium">
                                  {formatCurrency(record.saidas || 0)}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                                  (record.saldo || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(record.saldo || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <button
                                    onClick={() => setSelectedFechamento(record)}
                                    className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                                  >
                                    <Eye className="w-4 h-4 inline mr-1" />
                                    Detalhes
                                  </button>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Auditoria */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  {/* Filtros de Auditoria */}
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Search className="w-4 h-4 inline mr-2" />
                          Buscar
                        </label>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Buscar por usuário, ação, tipo ou detalhes..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Ação</label>
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="all">Todas</option>
                          <option value="create">Criar</option>
                          <option value="update">Atualizar</option>
                          <option value="delete">Excluir</option>
                          <option value="close">Fechar</option>
                          <option value="clear">Limpar</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setFilterType('all');
                          setDateRange({ start: '', end: '' });
                          setSearchTerm('');
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  </div>

                  {/* Lista de Logs de Auditoria */}
                  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Log de Alterações</h3>
                      <span className="text-sm text-gray-600">{auditLogs.length} {auditLogs.length === 1 ? 'registro' : 'registros'}</span>
                    </div>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Antigo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Novo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalhes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(() => {
                            let filteredLogs = auditLogs;
                            
                            if (filterType !== 'all') {
                              filteredLogs = filteredLogs.filter(log => log.action === filterType);
                            }
                            
                            if (dateRange.start) {
                              filteredLogs = filteredLogs.filter(log => 
                                log.timestamp >= new Date(dateRange.start)
                              );
                            }
                            
                            if (dateRange.end) {
                              const endDate = new Date(dateRange.end);
                              endDate.setHours(23, 59, 59, 999);
                              filteredLogs = filteredLogs.filter(log => 
                                log.timestamp <= endDate
                              );
                            }
                            
                            if (searchTerm) {
                              filteredLogs = filteredLogs.filter(log =>
                                log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()))
                              );
                            }
                            
                            return filteredLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {log.timestamp.toLocaleString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    {log.userName}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    log.action === 'create' ? 'bg-green-100 text-green-800' :
                                    log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                                    log.action === 'delete' ? 'bg-red-100 text-red-800' :
                                    log.action === 'close' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {log.entityType}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {log.field || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                  {log.oldValue !== undefined ? (
                                    typeof log.oldValue === 'object' ? 
                                      JSON.stringify(log.oldValue).substring(0, 50) + '...' :
                                      String(log.oldValue).substring(0, 30)
                                  ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate font-medium">
                                  {log.newValue !== undefined ? (
                                    typeof log.newValue === 'object' ? 
                                      JSON.stringify(log.newValue).substring(0, 50) + '...' :
                                      String(log.newValue).substring(0, 30)
                                  ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                  {log.details || '-'}
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                      {auditLogs.length === 0 && (
                        <div className="p-12 text-center">
                          <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 text-lg mb-2">Nenhum log de auditoria disponível</p>
                          <p className="text-gray-500 text-sm">
                            Os logs aparecerão aqui quando houver alterações no sistema
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal de Detalhes do Fechamento */}
              {selectedFechamento && (
                <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">
                        Detalhes do Fechamento - {new Date(selectedFechamento.date).toLocaleDateString('pt-BR')}
                      </h3>
                      <button
                        onClick={() => setSelectedFechamento(null)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                          <p className="text-sm text-emerald-700 mb-1">Total Entradas</p>
                          <p className="text-2xl font-bold text-emerald-900">
                            {formatCurrency(selectedFechamento.entradas || 0)}
                          </p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                          <p className="text-sm text-red-700 mb-1">Total Saídas</p>
                          <p className="text-2xl font-bold text-red-900">
                            {formatCurrency(selectedFechamento.saidas || 0)}
                          </p>
                        </div>
                        <div className={`rounded-lg p-4 border ${
                          (selectedFechamento.saldo || 0) >= 0 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <p className={`text-sm mb-1 ${
                            (selectedFechamento.saldo || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}>
                            Saldo Final
                          </p>
                          <p className={`text-2xl font-bold ${
                            (selectedFechamento.saldo || 0) >= 0 ? 'text-emerald-900' : 'text-red-900'
                          }`}>
                            {formatCurrency(selectedFechamento.saldo || 0)}
                          </p>
                        </div>
                      </div>
                      
                      {selectedFechamento.detalhes && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">Detalhes por Tipo</h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {Object.entries(selectedFechamento.detalhes).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="font-medium text-gray-900">{formatCurrency(Number(value) || 0)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CashFlowDashboard;

