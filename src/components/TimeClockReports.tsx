/**
 * Relatórios de Controle de Ponto
 * Geração de relatórios com exportação PDF/Excel/CSV
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import {
  timeClockService,
  employeeService,
  branchService,
  departmentService,
  exportService,
  type TimeClockReport,
  type Employee,
  type Branch,
  type Department,
} from '../services/timeClockService';

interface TimeClockReportsProps {
  onBack?: () => void;
}

export default function TimeClockReports({ onBack }: TimeClockReportsProps) {
  const [reports, setReports] = useState<TimeClockReport[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    employeeId: '',
    branchId: '',
    departmentId: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const [emps, brs, depts] = await Promise.all([
        employeeService.getAll(),
        branchService.getAll(),
        departmentService.getAll(),
      ]);
      setEmployees(emps);
      setBranches(brs);
      setDepartments(depts);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const reportsData = await timeClockService.getReport(filters);
      setReports(reportsData);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      let blob: Blob;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'pdf':
          blob = await exportService.exportPDF(filters);
          filename = `relatorio-ponto-${Date.now()}.pdf`;
          mimeType = 'application/pdf';
          break;
        case 'excel':
          blob = await exportService.exportExcel(filters);
          filename = `relatorio-ponto-${Date.now()}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'csv':
          blob = await exportService.exportCSV(filters);
          filename = `relatorio-ponto-${Date.now()}.csv`;
          mimeType = 'text/csv';
          break;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar relatório');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            Relatórios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gere relatórios detalhados e exporte em diferentes formatos
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

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Funcionário
            </label>
            <select
              value={filters.employeeId}
              onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Filial
            </label>
            <select
              value={filters.branchId}
              onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todas</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departamento
            </label>
            <select
              value={filters.departmentId}
              onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
          >
            <BarChart3 className="w-4 h-4" />
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </button>
          {reports.length > 0 && (
            <>
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </>
          )}
        </div>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.employeeId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {report.employeeName}
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(report.period.start).toLocaleDateString('pt-BR')} a{' '}
                  {new Date(report.period.end).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Horas</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {report.totalHours.toFixed(2)}h
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Horas Normais</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {report.regularHours.toFixed(2)}h
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Horas Extras</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {report.overtimeHours.toFixed(2)}h
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Atrasos</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {report.delays}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Faltas</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {report.absences}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum relatório gerado ainda</p>
          <p className="text-sm text-gray-400 mt-2">
            Configure os filtros e clique em "Gerar Relatório"
          </p>
        </div>
      )}
    </div>
  );
}

