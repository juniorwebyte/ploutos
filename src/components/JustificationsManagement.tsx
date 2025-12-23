/**
 * Gerenciamento de Justificativas
 * Solicitação, aprovação e gerenciamento de justificativas
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
} from 'lucide-react';
import {
  justificationService,
  employeeService,
  type Justification,
  type Employee,
} from '../services/timeClockService';
import { useAuth } from '../contexts/AuthContext';

interface JustificationsManagementProps {
  onBack?: () => void;
}

export default function JustificationsManagement({ onBack }: JustificationsManagementProps) {
  const { role } = useAuth();
  const [justifications, setJustifications] = useState<Justification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employeeId: '',
    status: '',
    type: '',
  });
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [justs, emps] = await Promise.all([
        justificationService.getAll(filters),
        employeeService.getAll(),
      ]);
      setJustifications(justs);
      setEmployees(emps);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Deseja aprovar esta justificativa?')) return;

    try {
      await justificationService.approve(id);
      loadData();
    } catch (error) {
      console.error('Erro ao aprovar justificativa:', error);
      alert('Erro ao aprovar justificativa');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Informe o motivo da rejeição:');
    if (!reason) return;

    try {
      await justificationService.reject(id, reason);
      loadData();
    } catch (error) {
      console.error('Erro ao rejeitar justificativa:', error);
      alert('Erro ao rejeitar justificativa');
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      absence: 'Falta',
      delay: 'Atraso',
      early_exit: 'Saída Antecipada',
      adjustment: 'Ajuste',
      overtime: 'Hora Extra',
      other: 'Outro',
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      approved: 'Aprovada',
      rejected: 'Rejeitada',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  const canApprove = role === 'admin' || role === 'superadmin';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-600" />
            Justificativas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie solicitações de justificativas e ocorrências
          </p>
        </div>
        <div className="flex gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Voltar
            </button>
          )}
          {!canApprove && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Justificativa
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos</option>
              <option value="pending">Pendente</option>
              <option value="approved">Aprovada</option>
              <option value="rejected">Rejeitada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Todos</option>
              <option value="absence">Falta</option>
              <option value="delay">Atraso</option>
              <option value="early_exit">Saída Antecipada</option>
              <option value="adjustment">Ajuste</option>
              <option value="overtime">Hora Extra</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {justifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">Nenhuma justificativa encontrada</p>
            </div>
          ) : (
            justifications.map((justification) => (
              <div
                key={justification.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {justification.employee?.name || 'Funcionário'}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          justification.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : justification.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}
                      >
                        {getStatusLabel(justification.status)}
                      </span>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded">
                        {getTypeLabel(justification.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Motivo:</strong> {justification.reason}
                    </p>
                    {justification.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {justification.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        <Clock className="w-4 h-4 inline mr-1" />
                        {new Date(justification.startDate).toLocaleDateString('pt-BR')}
                        {justification.endDate &&
                          ` - ${new Date(justification.endDate).toLocaleDateString('pt-BR')}`}
                      </span>
                      {justification.startTime && justification.endTime && (
                        <span>
                          {justification.startTime} - {justification.endTime}
                        </span>
                      )}
                    </div>
                    {justification.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          <strong>Motivo da rejeição:</strong> {justification.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                  {canApprove && justification.status === 'pending' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(justification.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(justification.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Nova Justificativa */}
      {showModal && (
        <JustificationModal
          employees={employees}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface JustificationModalProps {
  employees: Employee[];
  onClose: () => void;
  onSave: () => void;
}

function JustificationModal({ employees, onClose, onSave }: JustificationModalProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'absence',
    reason: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    startTime: '',
    endTime: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await justificationService.create(formData);
      onSave();
    } catch (error) {
      console.error('Erro ao criar justificativa:', error);
      alert('Erro ao criar justificativa');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4 modal-overlay"
      data-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ pointerEvents: 'auto', position: 'fixed' }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nova Justificativa
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
              type="button"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Funcionário *
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecione...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="absence">Falta</option>
                <option value="delay">Atraso</option>
                <option value="early_exit">Saída Antecipada</option>
                <option value="adjustment">Ajuste</option>
                <option value="overtime">Hora Extra</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivo *
              </label>
              <input
                type="text"
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Inicial *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Horário Inicial
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Horário Final
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

