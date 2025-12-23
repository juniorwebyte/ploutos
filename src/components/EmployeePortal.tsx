/**
 * Portal Completo do Colaborador
 * Visualização de balanço de pontos, banco de horas, solicitações e notificações
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  FileText,
  Bell,
  User,
  Building,
  Briefcase,
  Download,
  Plus,
  Eye,
} from 'lucide-react';
import {
  employeeService,
  timeClockService,
  justificationService,
  type Employee,
  type TimeClock,
  type Justification,
} from '../services/timeClockService';
import { workScheduleService, type DaySummary, type MonthSummary } from '../services/workScheduleService';
import { complianceService, type PointMirror } from '../services/complianceService';
import { useAuth } from '../contexts/AuthContext';

interface EmployeePortalProps {
  onBack?: () => void;
}

export default function EmployeePortal({ onBack }: EmployeePortalProps) {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'justifications' | 'reports'>('overview');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [todayRecords, setTodayRecords] = useState<TimeClock[]>([]);
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadEmployeeData();
  }, [currentMonth, currentYear]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const employees = await employeeService.getAll();
      let emp = employees.find((e) => e.userId === user);
      if (!emp && employees.length > 0) {
        emp = employees[0];
      }
      if (emp) {
        setEmployee(emp);
        
        // Carregar resumo mensal
        const summary = await workScheduleService.calculateMonthSummary(emp.id, currentMonth, currentYear);
        setMonthSummary(summary);
        
        // Carregar registros de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const records = await timeClockService.getAll({
          employeeId: emp.id,
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString(),
        });
        setTodayRecords(records);
        
        // Carregar justificativas
        const justs = await justificationService.getAll({ employeeId: emp.id });
        setJustifications(justs);
        
        // Gerar notificações
        generateNotifications(summary, records);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNotifications = (summary: MonthSummary, records: TimeClock[]) => {
    const notifs: any[] = [];
    
    // Verificar atrasos
    const todaySummary = summary.days.find(d => 
      d.date.getDate() === new Date().getDate() &&
      d.date.getMonth() === new Date().getMonth()
    );
    if (todaySummary?.isLate) {
      notifs.push({
        id: 'late',
        type: 'warning',
        title: 'Atraso Detectado',
        message: `Você chegou ${todaySummary.lateMinutes} minutos atrasado hoje.`,
        icon: AlertCircle,
      });
    }
    
    // Verificar falta de marcação
    if (records.length === 0) {
      notifs.push({
        id: 'no_entry',
        type: 'info',
        title: 'Lembrete',
        message: 'Você ainda não registrou entrada hoje.',
        icon: Bell,
      });
    }
    
    // Verificar horas extras excessivas
    if (summary.totalOvertimeHours > 10) {
      notifs.push({
        id: 'overtime',
        type: 'warning',
        title: 'Horas Extras',
        message: `Você tem ${summary.totalOvertimeHours.toFixed(1)}h de horas extras este mês.`,
        icon: TrendingUp,
      });
    }
    
    setNotifications(notifs);
  };

  const handleDownloadPointMirror = async () => {
    if (!employee) return;
    
    try {
      const pointMirror = await complianceService.generatePointMirror(
        employee.id,
        currentMonth,
        currentYear
      );
      
      // Gerar PDF (em produção, usar biblioteca como jsPDF ou react-pdf)
      const content = generatePointMirrorPDF(pointMirror);
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `espelho_ponto_${currentMonth}_${currentYear}.html`;
      link.click();
    } catch (error) {
      console.error('Erro ao gerar espelho de ponto:', error);
      alert('Erro ao gerar espelho de ponto');
    }
  };

  const generatePointMirrorPDF = (pointMirror: PointMirror): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Espelho de Ponto - ${pointMirror.month}/${pointMirror.year}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Espelho de Ponto - ${pointMirror.month}/${pointMirror.year}</h1>
        <p><strong>Funcionário:</strong> ${pointMirror.employeeName} (${pointMirror.employeeCode || 'N/A'})</p>
        <p><strong>CPF:</strong> ${pointMirror.cpf || 'N/A'}</p>
        <p><strong>Empresa:</strong> ${pointMirror.companyName}</p>
        <p><strong>CNPJ:</strong> ${pointMirror.companyCNPJ || 'N/A'}</p>
        <table>
          <thead>
            <tr>
              <th>Dia</th>
              <th>Entrada</th>
              <th>Saída Intervalo</th>
              <th>Retorno Intervalo</th>
              <th>Saída</th>
              <th>Horas Trabalhadas</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>
            ${pointMirror.days.map(day => `
              <tr>
                <td>${day.day}</td>
                <td>${day.entryTime || '-'}</td>
                <td>${day.breakStartTime || '-'}</td>
                <td>${day.breakEndTime || '-'}</td>
                <td>${day.exitTime || '-'}</td>
                <td>${day.workedHours.toFixed(2)}h</td>
                <td>${day.isLate ? `Atraso: ${day.lateMinutes}min` : day.isAbsent ? 'Falta' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p><strong>Total de Horas Trabalhadas:</strong> ${pointMirror.totals.totalWorkedHours.toFixed(2)}h</p>
        <p><strong>Total de Horas Esperadas:</strong> ${pointMirror.totals.totalExpectedHours.toFixed(2)}h</p>
        <p><strong>Total de Horas Extras:</strong> ${pointMirror.totals.totalOvertimeHours.toFixed(2)}h</p>
        <p><strong>Total de Atrasos:</strong> ${pointMirror.totals.totalLateMinutes} minutos</p>
        <p><strong>Total de Faltas:</strong> ${pointMirror.totals.totalAbsences}</p>
        <p style="margin-top: 30px;"><strong>Emitido em:</strong> ${pointMirror.issuedAt.toLocaleString('pt-BR')}</p>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Funcionário não encontrado. Entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ position: 'relative', zIndex: 50, minHeight: '100vh' }}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            Portal do Colaborador
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {employee.name} - {employee.employeeCode || 'Sem código'}
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Voltar
          </button>
        )}
      </div>

      {/* Notificações */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = notif.icon;
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  notif.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <Icon className={`w-5 h-5 mt-0.5 ${
                  notif.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`} />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{notif.title}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{notif.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral', icon: Eye },
            { id: 'records', label: 'Registros', icon: Clock },
            { id: 'justifications', label: 'Justificativas', icon: FileText },
            { id: 'reports', label: 'Relatórios', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'overview' && monthSummary && (
        <div className="space-y-6">
          {/* Resumo Mensal */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Horas Trabalhadas</h3>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {monthSummary.totalWorkedHours.toFixed(1)}h
              </p>
              <p className="text-xs text-gray-500 mt-1">
                de {monthSummary.totalExpectedHours.toFixed(1)}h esperadas
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Saldo de Horas</h3>
                {monthSummary.totalBalanceHours >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
              <p className={`text-3xl font-bold ${
                monthSummary.totalBalanceHours >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {monthSummary.totalBalanceHours >= 0 ? '+' : ''}{monthSummary.totalBalanceHours.toFixed(1)}h
              </p>
              <p className="text-xs text-gray-500 mt-1">Banco de horas</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Horas Extras</h3>
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {monthSummary.totalOvertimeHours.toFixed(1)}h
              </p>
              <p className="text-xs text-gray-500 mt-1">Este mês</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Faltas</h3>
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {monthSummary.totalAbsences}
              </p>
              <p className="text-xs text-gray-500 mt-1">Dias sem registro</p>
            </div>
          </div>

          {/* Registros de Hoje */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Registros de Hoje
            </h2>
            {todayRecords.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum registro hoje</p>
            ) : (
              <div className="space-y-2">
                {todayRecords.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {record.type === 'entry' ? 'Entrada' :
                         record.type === 'exit' ? 'Saída' :
                         record.type === 'break_start' ? 'Início Intervalo' :
                         record.type === 'break_end' ? 'Fim Intervalo' : record.type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(record.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Método</p>
                      <p className="font-medium text-gray-900 dark:text-white">{record.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'records' && monthSummary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Registros do Mês
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Dia</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Entrada</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Saída</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Horas</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {monthSummary.days.map((day) => (
                  <tr key={day.date.toISOString()}>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                      {day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {day.entryTime?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {day.exitTime?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                      {(day.workedMinutes / 60).toFixed(2)}h
                    </td>
                    <td className="px-4 py-2">
                      {day.isAbsent ? (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Falta</span>
                      ) : day.isLate ? (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          Atraso: {day.lateMinutes}min
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'justifications' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Justificativas
            </h2>
            <button
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Justificativa
            </button>
          </div>
          {justifications.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma justificativa</p>
          ) : (
            <div className="space-y-3">
              {justifications.map((just) => (
                <div
                  key={just.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{just.reason}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(just.startDate).toLocaleDateString('pt-BR')}
                        {just.endDate && ` - ${new Date(just.endDate).toLocaleDateString('pt-BR')}`}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${
                      just.status === 'approved' ? 'bg-green-100 text-green-800' :
                      just.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {just.status === 'approved' ? 'Aprovada' :
                       just.status === 'rejected' ? 'Rejeitada' :
                       'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Relatórios e Documentos
          </h2>
          <div className="space-y-4">
            <button
              onClick={handleDownloadPointMirror}
              className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-emerald-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">Espelho de Ponto</p>
                  <p className="text-sm text-gray-500">
                    {currentMonth}/{currentYear} - Portaria 671/2021
                  </p>
                </div>
              </div>
              <Download className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

