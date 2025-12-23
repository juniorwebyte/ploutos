/**
 * Gerenciamento de Funcionários
 * CRUD completo de funcionários com integração a empresas, filiais e departamentos
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  MapPin,
  Lock,
} from 'lucide-react';
import {
  employeeService,
  companyService,
  branchService,
  departmentService,
  workScheduleService,
  qrCodeService,
  type Employee,
  type Company,
  type Branch,
  type Department,
  type WorkSchedule,
} from '../services/timeClockService';
import { validateCPF, formatCPF, validatePhone, formatPhone } from '../services/validationService';

interface EmployeeManagementProps {
  onBack?: () => void;
}

export default function EmployeeManagement({ onBack }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    companyId: '',
    branchId: '',
    departmentId: '',
    status: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadData();
  }, [filters.companyId, filters.branchId, filters.departmentId, filters.status]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados básicos primeiro
      const [emps, comps, depts, allBranches] = await Promise.all([
        employeeService.getAll(filters).catch(() => []),
        companyService.getAll().catch(() => []),
        departmentService.getAll().catch(() => []),
        branchService.getAll().catch(() => []),
      ]);

      // Enriquecer funcionários com dados de empresa, filial e departamento
      const enrichedEmployees = (emps || []).map((emp: Employee) => {
        const company = (comps || []).find((c: Company) => c.id === emp.companyId);
        const branch = (allBranches || []).find((b: Branch) => b.id === emp.branchId);
        const department = (depts || []).find((d: Department) => d.id === emp.departmentId);
        
        return {
          ...emp,
          company: company || undefined,
          branch: branch || undefined,
          department: department || undefined,
        };
      });

      setEmployees(enrichedEmployees);
      setCompanies(comps || []);
      setDepartments(depts || []);

      // Carregar filiais se houver empresa selecionada
      if (filters.companyId) {
        try {
          const brs = await branchService.getAll(filters.companyId);
          setBranches(Array.isArray(brs) ? brs : []);
        } catch (error) {
          console.error('Erro ao carregar filiais:', error);
          setBranches([]);
        }
      } else {
        setBranches(allBranches || []);
      }

      // Carregar jornadas se houver empresa selecionada
      if (filters.companyId) {
        try {
          const scheds = await workScheduleService.getAll(filters.companyId);
          setSchedules(Array.isArray(scheds) ? scheds : []);
        } catch (error) {
          console.error('Erro ao carregar jornadas:', error);
          setSchedules([]);
        }
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      // Garantir que os estados sejam definidos mesmo em caso de erro
      setEmployees([]);
      setCompanies([]);
      setBranches([]);
      setDepartments([]);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;

    try {
      await employeeService.delete(id);
      loadData();
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      alert('Erro ao excluir funcionário');
    }
  };

  const handleGenerateQRCode = async (employeeId: string) => {
    try {
      const qrCode = await qrCodeService.generate({
        employeeId: employeeId,
        expiresInMinutes: 5,
      });
      alert(`QR Code gerado com sucesso!\n\nCódigo: ${qrCode.code}\n\nVálido por 5 minutos.`);
      loadData();
    } catch (error: any) {
      console.error('Erro ao gerar QR Code:', error);
      alert(`Erro ao gerar QR Code: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cpf?.includes(searchTerm) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ position: 'relative', zIndex: 50, minHeight: '100vh' }}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-600" />
            Gerenciamento de Funcionários
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Cadastre e gerencie funcionários do sistema
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
            Novo Funcionário
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar funcionário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.companyId}
            onChange={(e) => {
              setFilters({ ...filters, companyId: e.target.value, branchId: '' });
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
            value={filters.branchId}
            onChange={(e) => setFilters({ ...filters, branchId: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            disabled={!filters.companyId}
          >
            <option value="">Todas as filiais</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            value={filters.departmentId}
            onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos os departamentos</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="suspended">Suspenso</option>
            <option value="dismissed">Demitido</option>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Código/CPF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Empresa/Filial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Saldo de Horas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Nenhum funcionário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500">{employee.position || '-'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {employee.employeeCode || '-'}
                        </div>
                        <div className="text-sm text-gray-500">{employee.cpf || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {employee.company?.name || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.branch?.name ? `Filial: ${employee.branch.name}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {employee.department?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            employee.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : employee.status === 'suspended'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {employee.status === 'active' ? 'Ativo' : employee.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`text-sm font-medium ${
                            employee.hourBalance >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {employee.hourBalance >= 0 ? '+' : ''}
                          {employee.hourBalance.toFixed(2)}h
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleGenerateQRCode(employee.id)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                            title="Gerar QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(employee)}
                            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(employee.id)}
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

      {/* Modal de criação/edição */}
      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          companies={companies}
          branches={branches}
          departments={departments}
          schedules={schedules}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingEmployee(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface EmployeeModalProps {
  employee: Employee | null;
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  schedules: WorkSchedule[];
  onClose: () => void;
  onSave: () => void;
}

function EmployeeModal({
  employee,
  companies,
  branches: initialBranches,
  departments,
  schedules: initialSchedules,
  onClose,
  onSave,
}: EmployeeModalProps) {
  const [formData, setFormData] = useState({
    companyId: employee?.companyId || '',
    branchId: employee?.branchId || '',
    departmentId: employee?.departmentId || '',
    name: employee?.name || '',
    cpf: employee?.cpf || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    employeeCode: employee?.employeeCode || '',
    position: employee?.position || '',
    function: employee?.function || '',
    contractType: employee?.contractType || '',
    workScheduleId: employee?.workScheduleId || '',
    accessLevel: employee?.accessLevel || 'employee',
    canRegisterPoint: employee?.canRegisterPoint ?? true,
    // Credenciais de autenticação
    password: '',
    pin: '',
    biometricId: '',
    rfidCard: '',
  });
  const [saving, setSaving] = useState(false);
  const [validations, setValidations] = useState({
    cpf: { isValid: true, message: '' },
    phone: { isValid: true, message: '' },
  });
  const [branches, setBranches] = useState<Branch[]>(initialBranches || []);
  const [schedules, setSchedules] = useState<WorkSchedule[]>(initialSchedules || []);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Carregar filiais e jornadas quando a empresa mudar
  useEffect(() => {
    const loadBranchesAndSchedules = async () => {
      if (!formData.companyId) {
        setBranches([]);
        setSchedules([]);
        setFormData(prev => ({ ...prev, branchId: '', workScheduleId: '' }));
        return;
      }

      // Carregar filiais
      setLoadingBranches(true);
      try {
        const brs = await branchService.getAll(formData.companyId);
        setBranches(Array.isArray(brs) ? brs : []);
        // Limpar filial selecionada se não pertencer à nova empresa
        setFormData(prev => {
          const branchExists = Array.isArray(brs) && brs.some(b => b.id === prev.branchId);
          return { ...prev, branchId: branchExists ? prev.branchId : '' };
        });
      } catch (error) {
        console.error('Erro ao carregar filiais:', error);
        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }

      // Carregar jornadas
      setLoadingSchedules(true);
      try {
        const scheds = await workScheduleService.getAll(formData.companyId);
        setSchedules(Array.isArray(scheds) ? scheds : []);
        // Limpar jornada selecionada se não pertencer à nova empresa
        setFormData(prev => {
          const scheduleExists = Array.isArray(scheds) && scheds.some(s => s.id === prev.workScheduleId);
          return { ...prev, workScheduleId: scheduleExists ? prev.workScheduleId : '' };
        });
      } catch (error) {
        console.error('Erro ao carregar jornadas:', error);
        setSchedules([]);
      } finally {
        setLoadingSchedules(false);
      }
    };

    loadBranchesAndSchedules();
  }, [formData.companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyId) {
      alert('Selecione uma empresa');
      return;
    }
    
    if (!formData.name.trim()) {
      alert('O nome completo é obrigatório');
      return;
    }

    setSaving(true);

    try {
      // Preparar dados
      const data: any = {
        companyId: formData.companyId,
        name: formData.name.trim(),
        accessLevel: formData.accessLevel || 'employee',
        canRegisterPoint: formData.canRegisterPoint ?? true,
      };

      // Campos opcionais - enviar null se vazio
      data.branchId = formData.branchId || null;
      data.departmentId = formData.departmentId || null;
      data.cpf = formData.cpf?.trim() || null;
      data.email = formData.email?.trim() || null;
      data.phone = formData.phone?.trim() || null;
      data.employeeCode = formData.employeeCode?.trim() || null;
      data.position = formData.position?.trim() || null;
      data.function = formData.function?.trim() || null;
      data.contractType = formData.contractType?.trim() || null;
      data.workScheduleId = formData.workScheduleId || null;

      let savedEmployee: Employee;
      if (employee) {
        savedEmployee = await employeeService.update(employee.id, data);
      } else {
        savedEmployee = await employeeService.create(data);
      }

      // Registrar credenciais de autenticação se fornecidas
      if (formData.password || formData.pin || formData.biometricId || formData.rfidCard) {
        try {
          const { employeeAuthService } = await import('../services/employeeAuthService');
          await employeeAuthService.registerCredentials(savedEmployee.id, {
            password: formData.password || undefined,
            pin: formData.pin || undefined,
            biometricId: formData.biometricId || undefined,
            rfidCard: formData.rfidCard || undefined,
          });
        } catch (error) {
          console.error('Erro ao registrar credenciais:', error);
          // Não bloquear o salvamento do funcionário se houver erro nas credenciais
        }
      }

      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar funcionário:', error);
      let errorMessage = 'Erro ao salvar funcionário';
      
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] modal-overlay"
      data-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{ pointerEvents: 'auto', position: 'fixed' }}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
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
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CPF
                  {formData.cpf && (
                    <span className={`ml-2 text-xs ${validations.cpf.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {validations.cpf.isValid ? '✓ Válido' : '✗ Inválido'}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => {
                    const formatted = formatCPF(e.target.value);
                    setFormData({ ...formData, cpf: formatted });
                    if (formatted.replace(/\D/g, '').length === 11) {
                      const isValid = validateCPF(formatted);
                      setValidations({
                        ...validations,
                        cpf: {
                          isValid,
                          message: isValid ? '' : 'CPF inválido',
                        },
                      });
                    } else {
                      setValidations({
                        ...validations,
                        cpf: { isValid: true, message: '' },
                      });
                    }
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                    formData.cpf && !validations.cpf.isValid
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {!validations.cpf.isValid && formData.cpf && (
                  <p className="text-xs text-red-600 mt-1">{validations.cpf.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Empresa *
                </label>
                <select
                  required
                  value={formData.companyId}
                  onChange={(e) => {
                    setFormData({ ...formData, companyId: e.target.value, branchId: '', workScheduleId: '' });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  disabled={!companies || companies.length === 0}
                >
                  <option value="">
                    {!companies || companies.length === 0
                      ? 'Nenhuma empresa cadastrada'
                      : 'Selecione...'}
                  </option>
                  {companies && companies.length > 0
                    ? companies.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name}
                        </option>
                      ))
                    : null}
                </select>
                {(!companies || companies.length === 0) && (
                  <p className="text-xs text-amber-600 mt-1">
                    Cadastre uma empresa primeiro
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filial
                  {loadingBranches && (
                    <span className="ml-2 text-xs text-gray-500">Carregando...</span>
                  )}
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  disabled={!formData.companyId || loadingBranches}
                >
                  <option value="">
                    {!formData.companyId
                      ? 'Selecione uma empresa primeiro'
                      : loadingBranches
                      ? 'Carregando...'
                      : branches.length === 0
                      ? 'Nenhuma filial cadastrada'
                      : 'Selecione...'}
                  </option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {formData.companyId && branches.length === 0 && !loadingBranches && (
                  <p className="text-xs text-gray-500 mt-1">
                    Nenhuma filial cadastrada para esta empresa
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Departamento
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jornada de Trabalho
                  {loadingSchedules && (
                    <span className="ml-2 text-xs text-gray-500">Carregando...</span>
                  )}
                </label>
                <select
                  value={formData.workScheduleId}
                  onChange={(e) => setFormData({ ...formData, workScheduleId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  disabled={!formData.companyId || loadingSchedules}
                >
                  <option value="">
                    {!formData.companyId
                      ? 'Selecione uma empresa primeiro'
                      : loadingSchedules
                      ? 'Carregando...'
                      : schedules.length === 0
                      ? 'Nenhuma jornada cadastrada'
                      : 'Selecione...'}
                  </option>
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name}
                    </option>
                  ))}
                </select>
                {formData.companyId && schedules.length === 0 && !loadingSchedules && (
                  <p className="text-xs text-gray-500 mt-1">
                    Nenhuma jornada cadastrada para esta empresa
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código do Funcionário
                </label>
                <input
                  type="text"
                  value={formData.employeeCode}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Função
                </label>
                <input
                  type="text"
                  value={formData.function}
                  onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                  {formData.phone && (
                    <span className={`ml-2 text-xs ${validations.phone.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {validations.phone.isValid ? '✓ Válido' : '✗ Inválido'}
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setFormData({ ...formData, phone: formatted });
                    if (formatted.replace(/\D/g, '').length >= 10) {
                      const isValid = validatePhone(formatted);
                      setValidations({
                        ...validations,
                        phone: {
                          isValid,
                          message: isValid ? '' : 'Telefone inválido (formato: (00) 0000-0000 ou (00) 00000-0000)',
                        },
                      });
                    } else {
                      setValidations({
                        ...validations,
                        phone: { isValid: true, message: '' },
                      });
                    }
                  }}
                  placeholder="(00) 00000-0000"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                    formData.phone && !validations.phone.isValid
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {!validations.phone.isValid && formData.phone && (
                  <p className="text-xs text-red-600 mt-1">{validations.phone.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Jornada de Trabalho
                </label>
                <select
                  value={formData.workScheduleId}
                  onChange={(e) => setFormData({ ...formData, workScheduleId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione...</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nível de Acesso
                </label>
                <select
                  value={formData.accessLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, accessLevel: e.target.value as any })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="employee">Funcionário</option>
                  <option value="manager">Gestor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="canRegisterPoint"
                checked={formData.canRegisterPoint}
                onChange={(e) =>
                  setFormData({ ...formData, canRegisterPoint: e.target.checked })
                }
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <label
                htmlFor="canRegisterPoint"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Pode registrar ponto
              </label>
            </div>

            {/* Seção: Identificação Obrigatória */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                Identificação Obrigatória
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Configure as credenciais de autenticação do funcionário para permitir o registro de ponto.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Senha
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Senha para autenticação"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    PIN
                  </label>
                  <input
                    type="text"
                    value={formData.pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setFormData({ ...formData, pin: value });
                    }}
                    placeholder="PIN numérico (até 6 dígitos)"
                    maxLength={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Apenas números, até 6 dígitos</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID Biométrico
                  </label>
                  <input
                    type="text"
                    value={formData.biometricId}
                    onChange={(e) => setFormData({ ...formData, biometricId: e.target.value })}
                    placeholder="ID do template biométrico"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cartão RFID
                  </label>
                  <input
                    type="text"
                    value={formData.rfidCard}
                    onChange={(e) => setFormData({ ...formData, rfidCard: e.target.value })}
                    placeholder="Número do cartão RFID"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <strong>Nota:</strong> Pelo menos uma forma de identificação deve ser configurada para permitir o registro de ponto.
              </p>
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

