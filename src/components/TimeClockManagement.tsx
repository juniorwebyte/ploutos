/**
 * Painel Completo de Gerenciamento de Ponto para RH/Administrador
 * Visualização em tempo real de todos os funcionários, registros, atrasos e horas extras
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  MapPin,
  Building,
  Briefcase,
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  Bell,
  Timer,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  employeeService,
  timeClockService,
  companyService,
  branchService,
  departmentService,
  type Employee,
  type TimeClock,
  type Company,
  type Branch,
  type Department,
} from '../services/timeClockService';

interface TimeClockManagementProps {
  onBack?: () => void;
}

interface EmployeeStatus {
  employee: Employee;
  todayRecords: TimeClock[];
  status: 'working' | 'on_break' | 'left' | 'not_started' | 'late';
  entryTime?: Date;
  exitTime?: Date;
  breakStartTime?: Date;
  breakEndTime?: Date;
  workedHours: number;
  expectedHours: number;
  balance: number;
  isLate: boolean;
  lateMinutes: number;
  nextAction: string;
  timeToLeave?: Date;
  hasOvertime: boolean;
  overtimeHours: number;
}

export default function TimeClockManagement({ onBack }: TimeClockManagementProps) {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [todayRecords, setTodayRecords] = useState<TimeClock[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<EmployeeStatus[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'working' | 'on_break' | 'left' | 'not_started' | 'late'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
    
    // Atualizar relógio a cada segundo
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Auto-refresh a cada 30 segundos
    const refreshInterval = autoRefresh ? setInterval(() => {
      loadData();
    }, 30000) : null;
    
    return () => {
      clearInterval(timeInterval);
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [emps, comps, brs, depts, records] = await Promise.all([
        employeeService.getAll({ status: 'active' }).catch(() => []),
        companyService.getAll().catch(() => []),
        branchService.getAll().catch(() => []),
        departmentService.getAll().catch(() => []),
        timeClockService.getAll({
          startDate: today.toISOString(),
          endDate: tomorrow.toISOString(),
        }).catch(() => []),
      ]);

      setEmployees(emps || []);
      setCompanies(comps || []);
      setBranches(brs || []);
      setDepartments(depts || []);
      setTodayRecords(records || []);

      // Calcular status de cada funcionário
      const statuses = (emps || []).map((emp) => calculateEmployeeStatus(emp, records || []));
      setEmployeeStatuses(statuses);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEmployeeStatus = (employee: Employee, records: TimeClock[]): EmployeeStatus => {
    const empRecords = records
      .filter(r => r.employeeId === employee.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const entryRecord = empRecords.find(r => r.type === 'entry');
    const exitRecord = empRecords.find(r => r.type === 'exit');
    const breakStartRecord = empRecords.find(r => r.type === 'break_start');
    const breakEndRecord = empRecords.find(r => r.type === 'break_end');

    const entryTime = entryRecord ? new Date(entryRecord.timestamp) : undefined;
    const exitTime = exitRecord ? new Date(exitRecord.timestamp) : undefined;
    const breakStartTime = breakStartRecord ? new Date(breakStartRecord.timestamp) : undefined;
    const breakEndTime = breakEndRecord ? new Date(breakEndRecord.timestamp) : undefined;

    // Determinar status
    let status: EmployeeStatus['status'] = 'not_started';
    if (exitTime) {
      status = 'left';
    } else if (breakStartTime && !breakEndTime) {
      status = 'on_break';
    } else if (entryTime) {
      status = 'working';
    }

    // Verificar atraso
    let isLate = false;
    let lateMinutes = 0;
    if (entryTime && employee.workScheduleId) {
      // Assumindo horário padrão de 8h (pode ser melhorado com dados da jornada)
      const expectedEntry = new Date(entryTime);
      expectedEntry.setHours(8, 0, 0, 0);
      if (entryTime > expectedEntry) {
        isLate = true;
        lateMinutes = Math.round((entryTime.getTime() - expectedEntry.getTime()) / (1000 * 60));
      }
    }

    // Calcular horas trabalhadas
    let workedMinutes = 0;
    if (entryTime) {
      const endTime = exitTime || currentTime;
      workedMinutes = (endTime.getTime() - entryTime.getTime()) / (1000 * 60);
      
      // Subtrair intervalo
      if (breakStartTime && breakEndTime) {
        const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
        workedMinutes -= breakMinutes;
      } else if (breakStartTime && !breakEndTime) {
        const breakMinutes = (currentTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
        workedMinutes -= breakMinutes;
      }
    }

    const workedHours = workedMinutes / 60;
    const expectedHours = employee.workHours || 8;
    const balance = workedHours - expectedHours;
    const hasOvertime = balance > 0;
    const overtimeHours = hasOvertime ? balance : 0;

    // Calcular horário de saída esperado
    let timeToLeave: Date | undefined;
    if (entryTime && !exitTime) {
      timeToLeave = new Date(entryTime);
      timeToLeave.setHours(timeToLeave.getHours() + expectedHours);
      if (breakStartTime && breakEndTime) {
        const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
        timeToLeave = new Date(timeToLeave.getTime() + breakMinutes * 60000);
      }
    }

    // Próxima ação
    let nextAction = 'Entrada';
    if (entryTime && !breakStartTime) {
      nextAction = 'Início Intervalo';
    } else if (breakStartTime && !breakEndTime) {
      nextAction = 'Fim Intervalo';
    } else if (breakEndTime && !exitTime) {
      nextAction = 'Saída';
    }

    if (isLate) {
      status = 'late';
    }

    return {
      employee,
      todayRecords: empRecords,
      status,
      entryTime,
      exitTime,
      breakStartTime,
      breakEndTime,
      workedHours,
      expectedHours,
      balance,
      isLate,
      lateMinutes,
      nextAction,
      timeToLeave,
      hasOvertime,
      overtimeHours,
    };
  };

  const filteredStatuses = employeeStatuses.filter((status) => {
    const matchesSearch = status.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      status.employee.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCompany = !filterCompany || status.employee.companyId === filterCompany;
    const matchesBranch = !filterBranch || status.employee.branchId === filterBranch;
    const matchesDepartment = !filterDepartment || status.employee.departmentId === filterDepartment;
    const matchesStatus = filterStatus === 'all' || status.status === filterStatus;

    return matchesSearch && matchesCompany && matchesBranch && matchesDepartment && matchesStatus;
  });

  const stats = {
    total: employeeStatuses.length,
    working: employeeStatuses.filter(s => s.status === 'working').length,
    onBreak: employeeStatuses.filter(s => s.status === 'on_break').length,
    left: employeeStatuses.filter(s => s.status === 'left').length,
    notStarted: employeeStatuses.filter(s => s.status === 'not_started').length,
    late: employeeStatuses.filter(s => s.isLate).length,
    overtime: employeeStatuses.filter(s => s.hasOvertime).length,
  };

  const formatTime = (date?: Date) => {
    if (!date) return '-';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusColor = (status: EmployeeStatus['status']) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'on_break':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'left':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'late':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  };

  const getStatusLabel = (status: EmployeeStatus['status']) => {
    switch (status) {
      case 'working':
        return 'Trabalhando';
      case 'on_break':
        return 'Em Intervalo';
      case 'left':
        return 'Saiu';
      case 'late':
        return 'Atrasado';
      default:
        return 'Não Iniciou';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            Gerenciamento de Ponto em Tempo Real
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Monitoramento completo de funcionários e registros de ponto
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {currentTime.toLocaleTimeString('pt-BR')}
            </div>
            <div className="text-xs text-gray-500">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg ${autoRefresh ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}
            title={autoRefresh ? 'Auto-atualização ativa' : 'Auto-atualização desativada'}
          >
            {autoRefresh ? <Zap className="w-5 h-5" /> : <Zap className="w-5 h-5 opacity-50" />}
          </button>
          <button
            onClick={loadData}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
            title="Atualizar agora"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Voltar
            </button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatCard icon={Users} title="Total" value={stats.total} color="blue" />
        <StatCard icon={CheckCircle} title="Trabalhando" value={stats.working} color="green" />
        <StatCard icon={Timer} title="Intervalo" value={stats.onBreak} color="yellow" />
        <StatCard icon={XCircle} title="Sairam" value={stats.left} color="gray" />
        <StatCard icon={Clock} title="Não Iniciaram" value={stats.notStarted} color="blue" />
        <StatCard icon={AlertCircle} title="Atrasados" value={stats.late} color="red" />
        <StatCard icon={TrendingUp} title="Hora Extra" value={stats.overtime} color="purple" />
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <select
            value={filterCompany}
            onChange={(e) => {
              setFilterCompany(e.target.value);
              setFilterBranch('');
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas as empresas</option>
            {companies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            disabled={!filterCompany}
          >
            <option value="">Todas as filiais</option>
            {branches
              .filter(b => !filterCompany || b.companyId === filterCompany)
              .map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todos os status</option>
            <option value="working">Trabalhando</option>
            <option value="on_break">Em Intervalo</option>
            <option value="left">Sairam</option>
            <option value="not_started">Não Iniciaram</option>
            <option value="late">Atrasados</option>
          </select>
        </div>
      </div>

      {/* Lista de Funcionários */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Funcionário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Entrada
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Intervalo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Saída
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Horas Trabalhadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStatuses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhum funcionário encontrado
                  </td>
                </tr>
              ) : (
                filteredStatuses.map((status) => (
                  <React.Fragment key={status.employee.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {status.employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {status.employee.employeeCode || 'Sem código'} • {status.employee.position || 'Sem cargo'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status.status)}`}>
                          {getStatusLabel(status.status)}
                        </span>
                        {status.isLate && (
                          <div className="text-xs text-red-600 mt-1">
                            Atraso: {status.lateMinutes} min
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatTime(status.entryTime)}
                        </div>
                        {status.isLate && status.entryTime && (
                          <div className="text-xs text-red-600">
                            ⚠️ Atrasado
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {status.breakStartTime ? formatTime(status.breakStartTime) : '-'}
                        </div>
                        {status.breakEndTime && (
                          <div className="text-xs text-gray-500">
                            Fim: {formatTime(status.breakEndTime)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatTime(status.exitTime)}
                        </div>
                        {status.timeToLeave && !status.exitTime && (
                          <div className="text-xs text-emerald-600">
                            Saída: {formatTime(status.timeToLeave)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {status.workedHours.toFixed(2)}h
                        </div>
                        <div className="text-xs text-gray-500">
                          de {status.expectedHours}h
                        </div>
                        {status.hasOvertime && (
                          <div className="text-xs text-purple-600 font-semibold">
                            +{status.overtimeHours.toFixed(2)}h extra
                          </div>
                        )}
                        {status.timeToLeave && !status.exitTime && currentTime >= status.timeToLeave && (
                          <div className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-1">
                            <Bell className="w-3 h-3" />
                            Hora de sair!
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setShowDetails({
                            ...showDetails,
                            [status.employee.id]: !showDetails[status.employee.id]
                          })}
                          className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          {showDetails[status.employee.id] ? (
                            <>
                              <EyeOff className="w-4 h-4" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Detalhes
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {showDetails[status.employee.id] && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Registros do Dia</h4>
                              <div className="space-y-2">
                                {status.todayRecords.length === 0 ? (
                                  <p className="text-sm text-gray-500">Nenhum registro hoje</p>
                                ) : (
                                  status.todayRecords.map((record) => (
                                    <div key={record.id} className="text-sm">
                                      <span className="font-medium">
                                        {record.type === 'entry' ? 'Entrada' :
                                         record.type === 'exit' ? 'Saída' :
                                         record.type === 'break_start' ? 'Início Intervalo' :
                                         record.type === 'break_end' ? 'Fim Intervalo' : record.type}
                                      </span>
                                      {' '}
                                      <span className="text-gray-600 dark:text-gray-400">
                                        {formatTime(new Date(record.timestamp))}
                                      </span>
                                      {' '}
                                      <span className="text-xs text-gray-500">
                                        ({record.method})
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Informações</h4>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Saldo:</span>{' '}
                                  <span className={`font-medium ${status.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {status.balance >= 0 ? '+' : ''}{status.balance.toFixed(2)}h
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 dark:text-gray-400">Próxima ação:</span>{' '}
                                  <span className="font-medium text-emerald-600">{status.nextAction}</span>
                                </div>
                                {status.timeToLeave && !status.exitTime && (
                                  <div>
                                    <span className="text-gray-600 dark:text-gray-400">Saída esperada:</span>{' '}
                                    <span className="font-medium text-blue-600">
                                      {formatTime(status.timeToLeave)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Alertas</h4>
                              <div className="space-y-1">
                                {status.isLate && (
                                  <div className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Atraso de {status.lateMinutes} minutos
                                  </div>
                                )}
                                {status.hasOvertime && (
                                  <div className="text-sm text-purple-600 flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4" />
                                    {status.overtimeHours.toFixed(2)}h de hora extra
                                  </div>
                                )}
                                {status.timeToLeave && !status.exitTime && currentTime >= status.timeToLeave && (
                                  <div className="text-sm text-amber-600 flex items-center gap-1">
                                    <Bell className="w-4 h-4" />
                                    Hora de sair!
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'gray' | 'red' | 'purple';
}

function StatCard({ icon: Icon, title, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

