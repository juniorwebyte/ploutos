/**
 * Dashboard e Relatórios Executivos
 * Relatórios customizáveis por período, departamento, turno, colaborador
 * Dashboards de produtividade, absenteísmo, custos de horas extras
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  Building,
  Briefcase,
  FileText,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  employeeService,
  timeClockService,
  companyService,
  departmentService,
  type Employee,
  type TimeClock,
} from '../services/timeClockService';
import { workScheduleService, type MonthSummary } from '../services/workScheduleService';

interface ExecutiveReportsProps {
  onBack?: () => void;
}

export default function ExecutiveReports({ onBack }: ExecutiveReportsProps) {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [filterCompany, setFilterCompany] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, filterCompany, filterDepartment]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [emps, comps, depts] = await Promise.all([
        employeeService.getAll().catch(() => []),
        companyService.getAll().catch(() => []),
        departmentService.getAll().catch(() => []),
      ]);

      setEmployees(emps || []);
      setCompanies(comps || []);
      setDepartments(depts || []);

      // Filtrar funcionários
      let filteredEmps = emps || [];
      if (filterCompany) {
        filteredEmps = filteredEmps.filter(e => e.companyId === filterCompany);
      }
      if (filterDepartment) {
        filteredEmps = filteredEmps.filter(e => e.departmentId === filterDepartment);
      }

      // Calcular relatórios
      const reportsData = await calculateReports(filteredEmps, startDate, endDate);
      setReports(reportsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateReports = async (employees: Employee[], start: Date, end: Date) => {
    const month = start.getMonth() + 1;
    const year = start.getFullYear();

    // Calcular resumos mensais para cada funcionário
    const summaries = await Promise.all(
      employees.map(async (emp) => {
        try {
          const summary = await workScheduleService.calculateMonthSummary(emp.id, month, year);
          return { employee: emp, summary };
        } catch {
          return null;
        }
      })
    );

    const validSummaries = summaries.filter(s => s !== null) as any[];

    // Calcular totais
    const totalEmployees = employees.length;
    const totalWorkedHours = validSummaries.reduce((sum, s) => sum + s.summary.totalWorkedHours, 0);
    const totalExpectedHours = validSummaries.reduce((sum, s) => sum + s.summary.totalExpectedHours, 0);
    const totalOvertimeHours = validSummaries.reduce((sum, s) => sum + s.summary.totalOvertimeHours, 0);
    const totalAbsences = validSummaries.reduce((sum, s) => sum + s.summary.totalAbsences, 0);
    const totalLateMinutes = validSummaries.reduce((sum, s) => sum + s.summary.totalLateMinutes, 0);
    const averageAbsenteeism = totalEmployees > 0 ? (totalAbsences / (totalEmployees * 30)) * 100 : 0;

    // Calcular custos (assumindo salário médio)
    const averageSalary = 3000; // Em produção, buscar do banco
    const hourlyRate = averageSalary / 160; // 160h/mês
    const overtimeCost = totalOvertimeHours * hourlyRate * 1.5; // 50% adicional
    const absenceCost = totalAbsences * (averageSalary / 22); // Custo por dia

    return {
      period: { start, end },
      totals: {
        totalEmployees,
        totalWorkedHours,
        totalExpectedHours,
        totalOvertimeHours,
        totalAbsences,
        totalLateMinutes,
        averageAbsenteeism,
        overtimeCost,
        absenceCost,
        totalCost: overtimeCost + absenceCost,
      },
      byDepartment: calculateByDepartment(validSummaries),
      byEmployee: validSummaries.map(s => ({
        employee: s.employee,
        summary: s.summary,
      })),
    };
  };

  const calculateByDepartment = (summaries: any[]) => {
    const byDept: Record<string, any> = {};
    
    summaries.forEach(({ employee, summary }) => {
      const deptId = employee.departmentId || 'sem_departamento';
      if (!byDept[deptId]) {
        byDept[deptId] = {
          departmentId: deptId,
          employees: 0,
          totalWorkedHours: 0,
          totalOvertimeHours: 0,
          totalAbsences: 0,
        };
      }
      byDept[deptId].employees++;
      byDept[deptId].totalWorkedHours += summary.totalWorkedHours;
      byDept[deptId].totalOvertimeHours += summary.totalOvertimeHours;
      byDept[deptId].totalAbsences += summary.totalAbsences;
    });

    return Object.values(byDept);
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (!reports) return;

    if (format === 'csv') {
      const csv = generateCSV(reports);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_executivo_${startDate.toISOString().split('T')[0]}.csv`;
      link.click();
    }
  };

  const generateCSV = (reports: any): string => {
    const headers = ['Funcionário', 'Departamento', 'Horas Trabalhadas', 'Horas Esperadas', 'Horas Extras', 'Faltas', 'Atrasos (min)'];
    const rows = reports.byEmployee.map((item: any) => [
      item.employee.name,
      item.employee.departmentId || 'N/A',
      item.summary.totalWorkedHours.toFixed(2),
      item.summary.totalExpectedHours.toFixed(2),
      item.summary.totalOvertimeHours.toFixed(2),
      item.summary.totalAbsences,
      item.summary.totalLateMinutes,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
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

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ position: 'relative', zIndex: 50, minHeight: '100vh' }}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
            Relatórios Executivos
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Análise de produtividade, absenteísmo e custos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
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

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={(e) => setEndDate(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Empresa
            </label>
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="">Todas</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departamento
            </label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="">Todos</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {reports && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              icon={Users}
              title="Total de Funcionários"
              value={reports.totals.totalEmployees}
              color="blue"
            />
            <KPICard
              icon={Clock}
              title="Horas Trabalhadas"
              value={`${reports.totals.totalWorkedHours.toFixed(1)}h`}
              subtitle={`de ${reports.totals.totalExpectedHours.toFixed(1)}h esperadas`}
              color="green"
            />
            <KPICard
              icon={TrendingUp}
              title="Horas Extras"
              value={`${reports.totals.totalOvertimeHours.toFixed(1)}h`}
              subtitle={`Custo: R$ ${reports.totals.overtimeCost.toFixed(2)}`}
              color="purple"
            />
            <KPICard
              icon={AlertCircle}
              title="Taxa de Absenteísmo"
              value={`${reports.totals.averageAbsenteeism.toFixed(1)}%`}
              subtitle={`${reports.totals.totalAbsences} faltas`}
              color="red"
            />
          </div>

          {/* Tabela de Funcionários */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detalhamento por Funcionário
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Funcionário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Horas Trabalhadas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Horas Extras</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Faltas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">Atrasos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.byEmployee.map((item: any) => (
                    <tr key={item.employee.id}>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {item.employee.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {item.summary.totalWorkedHours.toFixed(2)}h
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {item.summary.totalOvertimeHours.toFixed(2)}h
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {item.summary.totalAbsences}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {item.summary.totalLateMinutes} min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface KPICardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle?: string;
  color: 'blue' | 'green' | 'purple' | 'red';
}

function KPICard({ icon: Icon, title, value, subtitle, color }: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
    red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

