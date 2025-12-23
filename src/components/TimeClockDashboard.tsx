/**
 * Dashboard Principal do Controle de Ponto
 * Exibe visão geral, estatísticas e acesso rápido às funcionalidades
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  MapPin,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Building,
  Briefcase,
  BarChart3,
  User,
} from 'lucide-react';
import {
  companyService,
  employeeService,
  timeClockService,
  justificationService,
  type Company,
  type Employee,
  type TimeClock,
  type Justification,
} from '../services/timeClockService';

interface TimeClockDashboardProps {
  onNavigate?: (view: string) => void;
}

export default function TimeClockDashboard({ onNavigate }: TimeClockDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    todayRegistrations: 0,
    pendingJustifications: 0,
    lateEmployees: 0,
    onTimeEmployees: 0,
  });
  const [recentRegistrations, setRecentRegistrations] = useState<TimeClock[]>([]);
  const [pendingJustifications, setPendingJustifications] = useState<Justification[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar estatísticas
      const employees = await employeeService.getAll({ isActive: true });
      const activeEmployees = employees.filter((e) => e.status === 'active');

      // Registros de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayRecords = await timeClockService.getAll({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
      });

      // Justificativas pendentes
      const justifications = await justificationService.getAll({ status: 'pending' });

      // Calcular funcionários em atraso (simplificado)
      const lateEmployees = activeEmployees.filter((emp) => {
        const empRecords = todayRecords.filter((r) => r.employeeId === emp.id);
        // Lógica simplificada - em produção, verificar horário esperado vs real
        return empRecords.length > 0 && empRecords[0].type === 'entry';
      });

      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        todayRegistrations: todayRecords.length,
        pendingJustifications: justifications.length,
        lateEmployees: lateEmployees.length,
        onTimeEmployees: activeEmployees.length - lateEmployees.length,
      });

      setRecentRegistrations(todayRecords.slice(0, 10));
      setPendingJustifications(justifications.slice(0, 5));
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTypeLabel = (type: TimeClock['type']) => {
    const labels: Record<TimeClock['type'], string> = {
      entry: 'Entrada',
      exit: 'Saída',
      break_start: 'Início Intervalo',
      break_end: 'Fim Intervalo',
      overtime_start: 'Início Hora Extra',
      overtime_end: 'Fim Hora Extra',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ position: 'relative', zIndex: 50, minHeight: '100vh' }}>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            Controle de Ponto Eletrônico
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gestão completa de registro de ponto e jornada de trabalho
          </p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap">Sistema Online</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onNavigate?.('management')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Gerenciar Ponto (RH)
          </button>
          <button
            onClick={() => onNavigate?.('portal')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Portal do Colaborador
          </button>
          <button
            onClick={() => onNavigate?.('register')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Ponto
          </button>
          <button
            onClick={() => onNavigate?.('reports')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Relatórios
          </button>
          <button
            onClick={() => onNavigate?.('executive')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Relatórios Executivos
          </button>
          <button
            onClick={() => onNavigate?.('executive')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Relatórios Executivos
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          title="Total de Funcionários"
          value={stats.totalEmployees}
          subtitle={`${stats.activeEmployees} ativos`}
          color="blue"
        />
        <StatCard
          icon={Clock}
          title="Registros Hoje"
          value={stats.todayRegistrations}
          subtitle="Marcações do dia"
          color="emerald"
        />
        <StatCard
          icon={FileText}
          title="Justificativas Pendentes"
          value={stats.pendingJustifications}
          subtitle="Aguardando aprovação"
          color="amber"
        />
        <StatCard
          icon={CheckCircle}
          title="Funcionários no Horário"
          value={stats.onTimeEmployees}
          subtitle="Sem atrasos"
          color="green"
        />
        <StatCard
          icon={AlertCircle}
          title="Funcionários em Atraso"
          value={stats.lateEmployees}
          subtitle="Atenção necessária"
          color="red"
        />
        <StatCard
          icon={TrendingUp}
          title="Taxa de Pontualidade"
          value={
            stats.activeEmployees > 0
              ? `${Math.round((stats.onTimeEmployees / stats.activeEmployees) * 100)}%`
              : '0%'
          }
          subtitle="Média geral"
          color="purple"
        />
      </div>

      {/* Registros Recentes e Justificativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registros Recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Registros Recentes
            </h2>
            <button
              onClick={() => onNavigate?.('records')}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              Ver todos
            </button>
          </div>
          <div className="space-y-3">
            {recentRegistrations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum registro hoje</p>
            ) : (
              recentRegistrations.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        record.type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {record.employee?.name || 'Funcionário'}
                      </p>
                      <p className="text-sm text-gray-500">{getTypeLabel(record.type)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatTime(record.timestamp)}
                    </p>
                    {record.branch && (
                      <p className="text-xs text-gray-500">{record.branch.name}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Justificativas Pendentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              Justificativas Pendentes
            </h2>
            <button
              onClick={() => onNavigate?.('justifications')}
              className="text-sm text-amber-600 hover:text-amber-700"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {pendingJustifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma justificativa pendente</p>
            ) : (
              pendingJustifications.map((justification) => (
                <div
                  key={justification.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {justification.employee?.name || 'Funcionário'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{justification.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(justification.startDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">
                      {justification.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <QuickAction
            icon={Building}
            label="Empresas"
            onClick={() => onNavigate?.('companies')}
          />
          <QuickAction
            icon={Briefcase}
            label="Departamentos"
            onClick={() => onNavigate?.('departments')}
          />
          <QuickAction
            icon={Users}
            label="Funcionários"
            onClick={() => onNavigate?.('employees')}
          />
          <QuickAction
            icon={MapPin}
            label="Filiais"
            onClick={() => onNavigate?.('branches')}
          />
          <QuickAction
            icon={Calendar}
            label="Jornadas"
            onClick={() => onNavigate?.('schedules')}
          />
          <QuickAction
            icon={Settings}
            label="Configurações"
            onClick={() => onNavigate?.('settings')}
          />
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'emerald' | 'amber' | 'green' | 'red' | 'purple';
}

function StatCard({ icon: Icon, title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}

function QuickAction({ icon: Icon, label, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
    >
      <Icon className="w-6 h-6 text-emerald-600 mb-2" />
      <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
    </button>
  );
}

