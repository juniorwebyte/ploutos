/**
 * Gerenciamento de Jornadas de Trabalho
 * CRUD completo de jornadas (fixa, flexível, 12x36, custom)
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  Clock,
  Building,
} from 'lucide-react';
import {
  workScheduleService,
  companyService,
  type WorkSchedule,
  type Company,
} from '../services/timeClockService';

interface WorkScheduleManagementProps {
  onBack?: () => void;
}

export default function WorkScheduleManagement({ onBack }: WorkScheduleManagementProps) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        await loadData();
      } catch (error) {
        if (isMounted) {
          console.error('Erro ao carregar dados:', error);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [filterCompany]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheds, comps] = await Promise.all([
        workScheduleService.getAll(filterCompany || undefined).catch(() => []),
        companyService.getAll().catch(() => []),
      ]);
      setSchedules(scheds || []);
      setCompanies(comps || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setSchedules([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSchedule(null);
    setShowModal(true);
  };

  const handleEdit = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta jornada?')) return;

    try {
      await workScheduleService.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir jornada:', error);
      alert('Erro ao excluir jornada');
    }
  };

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fixed: 'Fixa',
      flexible: 'Flexível',
      shift_12x36: '12x36',
      custom: 'Personalizada',
    };
    return labels[type] || type;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ position: 'relative', zIndex: 50, minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-emerald-600" />
            Jornadas de Trabalho
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure jornadas fixas, flexíveis, escalas e personalizadas
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
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Jornada
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar jornada..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todas as empresas</option>
            {companies.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Horário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Horas/Dia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma jornada encontrada
                    </td>
                  </tr>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {schedule.name}
                          </div>
                          {schedule.description && (
                            <div className="text-sm text-gray-500">{schedule.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded">
                          {getTypeLabel(schedule.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {schedule.startTime && schedule.endTime ? (
                          <div className="text-sm text-gray-900 dark:text-white">
                            {schedule.startTime} - {schedule.endTime}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Flexível</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {schedule.workHours}h
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {companies.find((c) => c.id === schedule.companyId)?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400"
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
      )}

      {/* Modal */}
      {showModal && (
        <WorkScheduleModal
          schedule={editingSchedule}
          companies={companies}
          onClose={() => {
            setShowModal(false);
            setEditingSchedule(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingSchedule(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface WorkScheduleModalProps {
  schedule: WorkSchedule | null;
  companies: Company[];
  onClose: () => void;
  onSave: () => void;
}

function WorkScheduleModal({
  schedule,
  companies,
  onClose,
  onSave,
}: WorkScheduleModalProps) {
  const [formData, setFormData] = useState({
    companyId: schedule?.companyId || '',
    name: schedule?.name || '',
    description: schedule?.description || '',
    type: schedule?.type || 'fixed',
    workDays: (() => {
      if (!schedule?.workDays) return 'monday,tuesday,wednesday,thursday,friday';
      if (Array.isArray(schedule.workDays)) {
        return schedule.workDays.join(', ');
      }
      if (typeof schedule.workDays === 'string') {
        try {
          const parsed = JSON.parse(schedule.workDays);
          if (Array.isArray(parsed)) {
            return parsed.join(', ');
          }
          return schedule.workDays;
        } catch {
          return schedule.workDays;
        }
      }
      return 'monday,tuesday,wednesday,thursday,friday';
    })(),
    workHours: schedule?.workHours?.toString() || '8',
    startTime: schedule?.startTime || '08:00',
    endTime: schedule?.endTime || '17:00',
    breakStart: schedule?.breakStart || '12:00',
    breakEnd: schedule?.breakEnd || '13:00',
    breakDuration: schedule?.breakDuration?.toString() || '60',
    minHours: schedule?.minHours?.toString() || '',
    maxHours: schedule?.maxHours?.toString() || '',
    shiftDays: schedule?.shiftDays?.toString() || '',
    restDays: schedule?.restDays?.toString() || '',
    allowOvertime: schedule?.allowOvertime ?? true,
    maxOvertime: schedule?.maxOvertime?.toString() || '',
    tolerance: schedule?.tolerance?.toString() || '5',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyId) {
      alert('Selecione uma empresa');
      return;
    }
    
    if (!formData.name.trim()) {
      alert('O nome da jornada é obrigatório');
      return;
    }

    setSaving(true);

    try {
      // Preparar dados básicos
      const data: any = {
        companyId: formData.companyId,
        name: formData.name.trim(),
        type: formData.type,
        workHours: parseFloat(formData.workHours) || 8,
        allowOvertime: formData.allowOvertime ?? true,
      };

      // Descrição
      data.description = formData.description?.trim() || null;
      
      // Horários (apenas para tipo fixo)
      if (formData.type === 'fixed') {
        data.startTime = formData.startTime || null;
        data.endTime = formData.endTime || null;
        data.breakStart = formData.breakStart || null;
        data.breakEnd = formData.breakEnd || null;
      }

      // Dias da semana
      if (formData.workDays?.trim()) {
        const days = formData.workDays.split(',').map((d) => d.trim().toLowerCase()).filter(d => d.length > 0);
        if (days.length > 0) {
          data.workDays = JSON.stringify(days);
        }
      }

      // Campos numéricos opcionais
      if (formData.breakDuration?.trim()) {
        const breakDur = parseInt(formData.breakDuration);
        if (!isNaN(breakDur)) data.breakDuration = breakDur;
      }
      if (formData.minHours?.trim()) {
        const minH = parseFloat(formData.minHours);
        if (!isNaN(minH)) data.minHours = minH;
      }
      if (formData.maxHours?.trim()) {
        const maxH = parseFloat(formData.maxHours);
        if (!isNaN(maxH)) data.maxHours = maxH;
      }
      if (formData.shiftDays?.trim()) {
        const shiftD = parseInt(formData.shiftDays);
        if (!isNaN(shiftD)) data.shiftDays = shiftD;
      }
      if (formData.restDays?.trim()) {
        const restD = parseInt(formData.restDays);
        if (!isNaN(restD)) data.restDays = restD;
      }
      if (formData.maxOvertime?.trim()) {
        const maxO = parseFloat(formData.maxOvertime);
        if (!isNaN(maxO)) data.maxOvertime = maxO;
      }
      if (formData.tolerance?.trim()) {
        const tol = parseInt(formData.tolerance);
        if (!isNaN(tol)) data.tolerance = tol;
      } else {
        data.tolerance = 5; // Valor padrão
      }

      if (schedule) {
        await workScheduleService.update(schedule.id, data);
      } else {
        await workScheduleService.create(data);
      }
      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar jornada:', error);
      let errorMessage = 'Erro ao salvar jornada';
      
      if (error?.message?.includes('conexão') || error?.code === 'ERR_NETWORK') {
        errorMessage = 'Erro de conexão. Verifique se o servidor está rodando em http://localhost:4000';
      } else if (error?.response?.status === 401) {
        errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
        const errorDetails = error?.response?.data?.details;
        if (errorDetails) {
          errorMessage += `\n\nDetalhes: ${JSON.stringify(errorDetails, null, 2)}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {schedule ? 'Editar Jornada' : 'Nova Jornada'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Empresa *
                </label>
                <select
                  required
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione...</option>
                  {companies.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                />
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
                  <option value="fixed">Fixa</option>
                  <option value="flexible">Flexível</option>
                  <option value="shift_12x36">12x36</option>
                  <option value="custom">Personalizada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Horas Diárias *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="24"
                  step="0.5"
                  value={formData.workHours}
                  onChange={(e) => setFormData({ ...formData, workHours: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Horários Fixos */}
            {formData.type === 'fixed' && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Horários
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Entrada
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
                      Saída
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Início Intervalo
                    </label>
                    <input
                      type="time"
                      value={formData.breakStart}
                      onChange={(e) => setFormData({ ...formData, breakStart: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fim Intervalo
                    </label>
                    <input
                      type="time"
                      value={formData.breakEnd}
                      onChange={(e) => setFormData({ ...formData, breakEnd: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Horários Flexíveis */}
            {formData.type === 'flexible' && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Limites Flexíveis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Horas Mínimas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      value={formData.minHours}
                      onChange={(e) => setFormData({ ...formData, minHours: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Horas Máximas
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      step="0.5"
                      value={formData.maxHours}
                      onChange={(e) => setFormData({ ...formData, maxHours: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Escala 12x36 */}
            {formData.type === 'shift_12x36' && (
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Configuração 12x36
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dias Trabalhados
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.shiftDays}
                      onChange={(e) => setFormData({ ...formData, shiftDays: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dias de Descanso
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.restDays}
                      onChange={(e) => setFormData({ ...formData, restDays: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Configurações Gerais */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Configurações
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dias da Semana (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formData.workDays}
                    onChange={(e) => setFormData({ ...formData, workDays: e.target.value })}
                    placeholder="monday,tuesday,wednesday..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tolerância (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.tolerance}
                    onChange={(e) => setFormData({ ...formData, tolerance: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Horas Extras Máximas
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.maxOvertime}
                    onChange={(e) => setFormData({ ...formData, maxOvertime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allowOvertime}
                    onChange={(e) =>
                      setFormData({ ...formData, allowOvertime: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Permitir horas extras
                  </span>
                </label>
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

