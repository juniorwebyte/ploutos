/**
 * Serviço de Controle de Ponto
 * Gerencia todas as operações relacionadas ao registro de ponto de funcionários
 */

import axios from 'axios';
import { companyStorage, departmentStorage, branchStorage, employeeStorage, scheduleStorage, timeClockStorage, qrCodeStorage } from './timeClockStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Verificar se o servidor está disponível
let serverAvailable = false;
async function checkServerAvailability(): Promise<boolean> {
  try {
    await axios.get(`${API_BASE_URL}/health`, { timeout: 2000 });
    serverAvailable = true;
    return true;
  } catch {
    serverAvailable = false;
    return false;
  }
}

// Verificar uma vez ao carregar
checkServerAvailability();

// Configurar interceptors do axios para tratamento de erros
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não transformar o erro, apenas logar para debug
    console.error('Erro na requisição:', {
      code: error.code,
      message: error.message,
      response: error.response,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      }
    });
    
    // Retornar o erro original para que o componente possa tratá-lo adequadamente
    return Promise.reject(error);
  }
);

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  authorizedIPs?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkSchedule {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  type: 'fixed' | 'flexible' | 'shift_12x36' | 'custom';
  workDays: string[];
  workHours: number;
  startTime?: string;
  endTime?: string;
  breakStart?: string;
  breakEnd?: string;
  breakDuration?: number;
  minHours?: number;
  maxHours?: number;
  shiftDays?: number;
  restDays?: number;
  allowOvertime: boolean;
  maxOvertime?: number;
  tolerance?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  companyId: string;
  branchId?: string;
  departmentId?: string;
  userId?: string;
  name: string;
  cpf?: string;
  rg?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  employeeCode?: string;
  position?: string;
  function?: string;
  contractType?: string;
  hireDate?: string;
  dismissalDate?: string;
  salary?: number;
  workScheduleId?: string;
  workHours?: number;
  workDays?: string[];
  accessLevel: 'employee' | 'manager' | 'admin';
  canRegisterPoint: boolean;
  qrCode?: string;
  qrCodeExpiresAt?: string;
  biometricId?: string;
  isActive: boolean;
  status: 'active' | 'inactive' | 'suspended' | 'dismissed';
  hourBalance: number;
  createdAt: string;
  updatedAt: string;
  workSchedule?: WorkSchedule;
  branch?: Branch;
  department?: Department;
}

export interface TimeClock {
  id: string;
  employeeId: string;
  branchId?: string;
  type: 'entry' | 'exit' | 'break_start' | 'break_end' | 'overtime_start' | 'overtime_end';
  timestamp: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  ipAddress?: string;
  method: 'manual' | 'qrcode' | 'geolocation' | 'ip' | 'biometric';
  qrCodeId?: string;
  isValid: boolean;
  validationMessage?: string;
  isDuplicate: boolean;
  notes?: string;
  justificationId?: string;
  adjustedBy?: string;
  adjustedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  branch?: Branch;
}

export interface Justification {
  id: string;
  employeeId: string;
  type: 'absence' | 'delay' | 'early_exit' | 'adjustment' | 'overtime' | 'other';
  reason: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  attachments?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedBy?: string;
  approvedBy?: string;
  rejectedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface HourAdjustment {
  id: string;
  employeeId: string;
  type: 'credit' | 'debit' | 'compensation';
  hours: number;
  reason: string;
  description?: string;
  periodStart?: string;
  periodEnd?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface Holiday {
  id: string;
  companyId: string;
  name: string;
  date: string;
  type: 'national' | 'state' | 'municipal' | 'company';
  state?: string;
  city?: string;
  isRecurring: boolean;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QRCode {
  id: string;
  employeeId?: string;
  branchId?: string;
  code: string;
  token: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  usedBy?: string;
  createdAt: string;
}

export interface TimeClockReport {
  employeeId: string;
  employeeName: string;
  period: {
    start: string;
    end: string;
  };
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  delays: number;
  absences: number;
  records: TimeClock[];
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function getAuthHeaders() {
  // Tentar diferentes chaves possíveis para o token
  let token: string | null = null;
  
  if (typeof window !== 'undefined') {
    try {
      token = localStorage.getItem('auth_token') || 
              localStorage.getItem('token') || 
              localStorage.getItem('authToken') ||
              sessionStorage.getItem('auth_token') ||
              sessionStorage.getItem('token');
      
      if (!token) {
        console.warn('Token de autenticação não encontrado. Verificando localStorage:', {
          auth_token: localStorage.getItem('auth_token'),
          token: localStorage.getItem('token'),
          authToken: localStorage.getItem('authToken'),
          allKeys: typeof window !== 'undefined' ? Object.keys(localStorage) : [],
        });
      } else {
        console.log('Token encontrado:', token.substring(0, 20) + '...');
      }
    } catch (error) {
      console.warn('Erro ao acessar localStorage:', error);
    }
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ============================================
// EMPRESAS
// ============================================

export const companyService = {
  async getAll(): Promise<Company[]> {
    if (!serverAvailable) {
      return companyStorage.getAll();
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/timeclock/companies`, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      return companyStorage.getAll();
    }
  },

  async getById(id: string): Promise<Company> {
    if (!serverAvailable) {
      const company = companyStorage.getById(id);
      if (!company) throw new Error('Empresa não encontrada');
      return company;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/timeclock/companies/${id}`, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      const company = companyStorage.getById(id);
      if (!company) throw new Error('Empresa não encontrada');
      return company;
    }
  },

  async create(data: Partial<Company>): Promise<Company> {
    // Tentar servidor primeiro, se não conseguir usar localStorage
    if (serverAvailable) {
      try {
        const headers = getAuthHeaders();
        const response = await axios.post(`${API_BASE_URL}/api/timeclock/companies`, data, {
          headers,
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    
    // Usar localStorage
    console.log('💾 Salvando empresa no localStorage');
    return companyStorage.create(data);
  },

  async update(id: string, data: Partial<Company>): Promise<Company> {
    if (serverAvailable) {
      try {
        const response = await axios.patch(`${API_BASE_URL}/api/timeclock/companies/${id}`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    
    console.log('💾 Atualizando empresa no localStorage');
    return companyStorage.update(id, data);
  },

  async delete(id: string): Promise<void> {
    if (serverAvailable) {
      try {
        await axios.delete(`${API_BASE_URL}/api/timeclock/companies/${id}`, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return;
      } catch {
        serverAvailable = false;
      }
    }
    
    console.log('💾 Removendo empresa do localStorage');
    companyStorage.delete(id);
  },
};

// ============================================
// FILIAIS
// ============================================

export const branchService = {
  async getAll(companyId?: string): Promise<Branch[]> {
    if (!serverAvailable) {
      const branches = branchStorage.getAll();
      return companyId ? branches.filter(b => b.companyId === companyId) : branches;
    }
    try {
      const url = companyId
        ? `${API_BASE_URL}/api/timeclock/branches?companyId=${companyId}`
        : `${API_BASE_URL}/api/timeclock/branches`;
      const response = await axios.get(url, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      const branches = branchStorage.getAll();
      return companyId ? branches.filter(b => b.companyId === companyId) : branches;
    }
  },

  async getById(id: string): Promise<Branch> {
    if (!serverAvailable) {
      const branch = branchStorage.getById(id);
      if (!branch) throw new Error('Filial não encontrada');
      return branch;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/timeclock/branches/${id}`, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      const branch = branchStorage.getById(id);
      if (!branch) throw new Error('Filial não encontrada');
      return branch;
    }
  },

  async create(data: Partial<Branch>): Promise<Branch> {
    if (serverAvailable) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/timeclock/branches`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Salvando filial no localStorage');
    return branchStorage.create(data);
  },

  async update(id: string, data: Partial<Branch>): Promise<Branch> {
    if (serverAvailable) {
      try {
        const response = await axios.patch(`${API_BASE_URL}/api/timeclock/branches/${id}`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Atualizando filial no localStorage');
    return branchStorage.update(id, data);
  },

  async delete(id: string): Promise<void> {
    if (serverAvailable) {
      try {
        await axios.delete(`${API_BASE_URL}/api/timeclock/branches/${id}`, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Removendo filial do localStorage');
    branchStorage.delete(id);
  },
};

// ============================================
// DEPARTAMENTOS
// ============================================

export const departmentService = {
  async getAll(): Promise<Department[]> {
    if (!serverAvailable) return departmentStorage.getAll();
    try {
      const response = await axios.get(`${API_BASE_URL}/api/timeclock/departments`, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      return departmentStorage.getAll();
    }
  },

  async getById(id: string): Promise<Department> {
    if (!serverAvailable) {
      const dept = departmentStorage.getById(id);
      if (!dept) throw new Error('Departamento não encontrado');
      return dept;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/timeclock/departments/${id}`, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      const dept = departmentStorage.getById(id);
      if (!dept) throw new Error('Departamento não encontrado');
      return dept;
    }
  },

  async create(data: Partial<Department>): Promise<Department> {
    if (serverAvailable) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/timeclock/departments`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Salvando departamento no localStorage');
    return departmentStorage.create(data);
  },

  async update(id: string, data: Partial<Department>): Promise<Department> {
    if (serverAvailable) {
      try {
        const response = await axios.patch(`${API_BASE_URL}/api/timeclock/departments/${id}`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Atualizando departamento no localStorage');
    return departmentStorage.update(id, data);
  },

  async delete(id: string): Promise<void> {
    if (serverAvailable) {
      try {
        await axios.delete(`${API_BASE_URL}/api/timeclock/departments/${id}`, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Removendo departamento do localStorage');
    departmentStorage.delete(id);
  },
};

// ============================================
// FUNCIONÁRIOS
// ============================================

export const employeeService = {
  async getAll(filters?: {
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    status?: string;
    isActive?: boolean;
  }): Promise<Employee[]> {
    if (!serverAvailable) {
      let employees = employeeStorage.getAll();
      if (filters?.companyId) employees = employees.filter(e => e.companyId === filters.companyId);
      if (filters?.branchId) employees = employees.filter(e => e.branchId === filters.branchId);
      if (filters?.departmentId) employees = employees.filter(e => e.departmentId === filters.departmentId);
      if (filters?.status) employees = employees.filter(e => e.status === filters.status);
      if (filters?.isActive !== undefined) employees = employees.filter(e => e.isActive === filters.isActive);
      return employees;
    }
    try {
      const params = new URLSearchParams();
      if (filters?.companyId) params.append('companyId', filters.companyId);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.departmentId) params.append('departmentId', filters.departmentId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));

      const url = `${API_BASE_URL}/api/timeclock/employees${params.toString() ? `?${params}` : ''}`;
      const response = await axios.get(url, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      let employees = employeeStorage.getAll();
      if (filters?.companyId) employees = employees.filter(e => e.companyId === filters.companyId);
      if (filters?.branchId) employees = employees.filter(e => e.branchId === filters.branchId);
      if (filters?.departmentId) employees = employees.filter(e => e.departmentId === filters.departmentId);
      if (filters?.status) employees = employees.filter(e => e.status === filters.status);
      if (filters?.isActive !== undefined) employees = employees.filter(e => e.isActive === filters.isActive);
      return employees;
    }
  },

  async getById(id: string): Promise<Employee> {
    if (!serverAvailable) {
      const emp = employeeStorage.getById(id);
      if (!emp) throw new Error('Funcionário não encontrado');
      return emp;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/timeclock/employees/${id}`, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      const emp = employeeStorage.getById(id);
      if (!emp) throw new Error('Funcionário não encontrado');
      return emp;
    }
  },

  async create(data: Partial<Employee>): Promise<Employee> {
    if (serverAvailable) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/timeclock/employees`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Salvando funcionário no localStorage');
    return employeeStorage.create(data);
  },

  async update(id: string, data: Partial<Employee>): Promise<Employee> {
    if (serverAvailable) {
      try {
        const response = await axios.patch(`${API_BASE_URL}/api/timeclock/employees/${id}`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Atualizando funcionário no localStorage');
    return employeeStorage.update(id, data);
  },

  async delete(id: string): Promise<void> {
    if (serverAvailable) {
      try {
        await axios.delete(`${API_BASE_URL}/api/timeclock/employees/${id}`, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Removendo funcionário do localStorage');
    employeeStorage.delete(id);
  },

  async generateQRCode(employeeId: string): Promise<QRCode> {
    const response = await axios.post(
      `${API_BASE_URL}/api/timeclock/employees/${employeeId}/qrcode`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },
};

// ============================================
// JORNADAS DE TRABALHO
// ============================================

export const workScheduleService = {
  async getAll(companyId?: string): Promise<WorkSchedule[]> {
    if (!serverAvailable) {
      const schedules = scheduleStorage.getAll();
      return companyId ? schedules.filter(s => s.companyId === companyId) : schedules;
    }
    try {
      const url = companyId
        ? `${API_BASE_URL}/api/timeclock/schedules?companyId=${companyId}`
        : `${API_BASE_URL}/api/timeclock/schedules`;
      const response = await axios.get(url, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      const schedules = scheduleStorage.getAll();
      return companyId ? schedules.filter(s => s.companyId === companyId) : schedules;
    }
  },

  async getById(id: string): Promise<WorkSchedule> {
    if (!serverAvailable) {
      const schedule = scheduleStorage.getById(id);
      if (!schedule) throw new Error('Jornada não encontrada');
      return schedule;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/timeclock/schedules/${id}`, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      const schedule = scheduleStorage.getById(id);
      if (!schedule) throw new Error('Jornada não encontrada');
      return schedule;
    }
  },

  async create(data: Partial<WorkSchedule>): Promise<WorkSchedule> {
    if (serverAvailable) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/timeclock/schedules`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Salvando jornada no localStorage');
    return scheduleStorage.create(data);
  },

  async update(id: string, data: Partial<WorkSchedule>): Promise<WorkSchedule> {
    if (serverAvailable) {
      try {
        const response = await axios.patch(`${API_BASE_URL}/api/timeclock/schedules/${id}`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Atualizando jornada no localStorage');
    return scheduleStorage.update(id, data);
  },

  async delete(id: string): Promise<void> {
    if (serverAvailable) {
      try {
        await axios.delete(`${API_BASE_URL}/api/timeclock/schedules/${id}`, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Removendo jornada do localStorage');
    scheduleStorage.delete(id);
  },
};

// ============================================
// REGISTRO DE PONTO
// ============================================

export const timeClockService = {
  async register(data: {
    employeeId: string;
    employeeName?: string; // Snapshot obrigatório
    employeeCode?: string; // Snapshot obrigatório
    companyId: string; // Obrigatório
    branchId?: string;
    type: TimeClock['type'];
    latitude?: number;
    longitude?: number;
    method: TimeClock['method'];
    authenticationMethod?: string; // Método de autenticação usado
    deviceType?: 'web' | 'mobile' | 'hardware';
    deviceId?: string;
    userAgent?: string;
    ipAddress?: string;
    qrCodeId?: string;
    notes?: string;
    status?: 'valid' | 'adjusted' | 'invalidated' | 'under_review';
  }): Promise<TimeClock> {
    if (serverAvailable) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/timeclock/register`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    
    console.log('💾 Registrando ponto no localStorage');
    return timeClockStorage.create(data);
  },

  async getAll(filters?: {
    employeeId?: string;
    branchId?: string;
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<TimeClock[]> {
    if (!serverAvailable) {
      let records = timeClockStorage.getAll();
      if (filters?.employeeId) records = records.filter(r => r.employeeId === filters.employeeId);
      if (filters?.branchId) records = records.filter(r => r.branchId === filters.branchId);
      if (filters?.type) records = records.filter(r => r.type === filters.type);
      if (filters?.startDate) {
        const startDate = new Date(filters.startDate);
        records = records.filter(r => new Date(r.timestamp) >= startDate);
      }
      if (filters?.endDate) {
        const endDate = new Date(filters.endDate);
        records = records.filter(r => new Date(r.timestamp) <= endDate);
      }
      return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    try {
      const params = new URLSearchParams();
      if (filters?.employeeId) params.append('employeeId', filters.employeeId);
      if (filters?.branchId) params.append('branchId', filters.branchId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.type) params.append('type', filters.type);

      const url = `${API_BASE_URL}/api/timeclock/records${params.toString() ? `?${params}` : ''}`;
      const response = await axios.get(url, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      let records = timeClockStorage.getAll();
      if (filters?.employeeId) records = records.filter(r => r.employeeId === filters.employeeId);
      if (filters?.branchId) records = records.filter(r => r.branchId === filters.branchId);
      if (filters?.type) records = records.filter(r => r.type === filters.type);
      if (filters?.startDate) {
        const startDate = new Date(filters.startDate);
        records = records.filter(r => new Date(r.timestamp) >= startDate);
      }
      if (filters?.endDate) {
        const endDate = new Date(filters.endDate);
        records = records.filter(r => new Date(r.timestamp) <= endDate);
      }
      return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  },

  async getById(id: string): Promise<TimeClock> {
    if (!serverAvailable) {
      const record = timeClockStorage.getById(id);
      if (!record) throw new Error('Registro não encontrado');
      return record;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/api/timeclock/records/${id}`, {
        headers: getAuthHeaders(),
        timeout: 2000,
      });
      return response.data;
    } catch {
      serverAvailable = false;
      const record = timeClockStorage.getById(id);
      if (!record) throw new Error('Registro não encontrado');
      return record;
    }
  },

  async update(id: string, data: Partial<TimeClock>): Promise<TimeClock> {
    if (serverAvailable) {
      try {
        const response = await axios.patch(`${API_BASE_URL}/api/timeclock/records/${id}`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Atualizando registro no localStorage');
    return timeClockStorage.update(id, data);
  },

  async delete(id: string): Promise<void> {
    if (serverAvailable) {
      try {
        await axios.delete(`${API_BASE_URL}/api/timeclock/records/${id}`, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return;
      } catch {
        serverAvailable = false;
      }
    }
    console.log('💾 Removendo registro do localStorage');
    timeClockStorage.delete(id);
  },

  /**
   * Limpar todos os registros de ponto (reset do ciclo)
   * ATENÇÃO: Esta ação é irreversível!
   */
  async clearAllRecords(options?: {
    resetHourBalance?: boolean; // Zerar saldo de horas dos funcionários
    keepEmployees?: boolean; // Manter funcionários cadastrados
    keepCompanies?: boolean; // Manter empresas cadastradas
  }): Promise<{ deletedRecords: number; resetEmployees: number }> {
    const resetHourBalance = options?.resetHourBalance ?? true;
    
    if (serverAvailable) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/timeclock/records/clear-all`,
          { resetHourBalance },
          { headers: getAuthHeaders(), timeout: 5000 }
        );
        return response.data;
      } catch {
        serverAvailable = false;
      }
    }
    
    // Modo offline: limpar do localStorage
    console.log('💾 Limpando todos os registros do localStorage');
    const records = timeClockStorage.getAll();
    const deletedCount = records.length;
    
    // Limpar todos os registros
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('timeclock_records');
      } catch (error) {
        console.warn('Erro ao limpar registros do localStorage:', error);
      }
    }
    
    // Resetar saldo de horas dos funcionários se solicitado
    let resetCount = 0;
    if (resetHourBalance) {
      const employees = await employeeService.getAll();
      for (const emp of employees) {
        try {
          await employeeService.update(emp.id, { hourBalance: 0 });
          resetCount++;
        } catch (error) {
          console.error(`Erro ao resetar saldo do funcionário ${emp.id}:`, error);
        }
      }
    }
    
    // Limpar QR Codes expirados/usados
    const qrcodes = qrCodeStorage.getAll();
    const activeQRCodes = qrcodes.filter(q => !q.used && new Date(q.expiresAt) > new Date());
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('timeclock_qrcodes', JSON.stringify(activeQRCodes));
      } catch (error) {
        console.warn('Erro ao salvar QR codes no localStorage:', error);
      }
    }
    
    return { deletedRecords: deletedCount, resetEmployees: resetCount };
  },

  async getReport(filters: {
    employeeId?: string;
    branchId?: string;
    departmentId?: string;
    startDate: string;
    endDate: string;
  }): Promise<TimeClockReport[]> {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);

    const response = await axios.get(
      `${API_BASE_URL}/api/timeclock/reports?${params.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },
};

// ============================================
// JUSTIFICATIVAS
// ============================================

export const justificationService = {
  async getAll(filters?: {
    employeeId?: string;
    status?: string;
    type?: string;
  }): Promise<Justification[]> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);

    const url = `${API_BASE_URL}/api/timeclock/justifications${params.toString() ? `?${params}` : ''}`;
    const response = await axios.get(url, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async getById(id: string): Promise<Justification> {
    const response = await axios.get(`${API_BASE_URL}/api/timeclock/justifications/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async create(data: Partial<Justification>): Promise<Justification> {
    const response = await axios.post(`${API_BASE_URL}/api/timeclock/justifications`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async update(id: string, data: Partial<Justification>): Promise<Justification> {
    const response = await axios.patch(`${API_BASE_URL}/api/timeclock/justifications/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async approve(id: string): Promise<Justification> {
    const response = await axios.post(
      `${API_BASE_URL}/api/timeclock/justifications/${id}/approve`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  async reject(id: string, reason: string): Promise<Justification> {
    const response = await axios.post(
      `${API_BASE_URL}/api/timeclock/justifications/${id}/reject`,
      { reason },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/timeclock/justifications/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};

// ============================================
// AJUSTES DE HORAS
// ============================================

export const hourAdjustmentService = {
  async getAll(filters?: {
    employeeId?: string;
    status?: string;
    type?: string;
  }): Promise<HourAdjustment[]> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);

    const url = `${API_BASE_URL}/api/timeclock/hour-adjustments${params.toString() ? `?${params}` : ''}`;
    const response = await axios.get(url, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async getById(id: string): Promise<HourAdjustment> {
    const response = await axios.get(`${API_BASE_URL}/api/timeclock/hour-adjustments/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async create(data: Partial<HourAdjustment>): Promise<HourAdjustment> {
    const response = await axios.post(`${API_BASE_URL}/api/timeclock/hour-adjustments`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async approve(id: string): Promise<HourAdjustment> {
    const response = await axios.post(
      `${API_BASE_URL}/api/timeclock/hour-adjustments/${id}/approve`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  async reject(id: string): Promise<HourAdjustment> {
    const response = await axios.post(
      `${API_BASE_URL}/api/timeclock/hour-adjustments/${id}/reject`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/timeclock/hour-adjustments/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};

// ============================================
// FERIADOS
// ============================================

export const holidayService = {
  async getAll(companyId?: string): Promise<Holiday[]> {
    const url = companyId
      ? `${API_BASE_URL}/api/timeclock/holidays?companyId=${companyId}`
      : `${API_BASE_URL}/api/timeclock/holidays`;
    const response = await axios.get(url, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async getById(id: string): Promise<Holiday> {
    const response = await axios.get(`${API_BASE_URL}/api/timeclock/holidays/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async create(data: Partial<Holiday>): Promise<Holiday> {
    const response = await axios.post(`${API_BASE_URL}/api/timeclock/holidays`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async update(id: string, data: Partial<Holiday>): Promise<Holiday> {
    const response = await axios.patch(`${API_BASE_URL}/api/timeclock/holidays/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/timeclock/holidays/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};

// ============================================
// QR CODES
// ============================================

export const qrCodeService = {
  async generate(data: {
    employeeId: string;
    expiresInMinutes?: number;
  }): Promise<{ code: string }> {
    if (serverAvailable) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/timeclock/qrcode/generate`, data, {
          headers: getAuthHeaders(),
          timeout: 2000,
        });
        return { code: response.data.code || response.data.token || '' };
      } catch {
        serverAvailable = false;
      }
    }
    
    console.log('💾 Gerando QR Code no localStorage');
    const qrCode = qrCodeStorage.create({
      employeeId: data.employeeId,
      expiresInMinutes: data.expiresInMinutes || 5,
    });
    return { code: qrCode.code };
  },

  async validate(code: string, token: string): Promise<{ valid: boolean; qrCode?: QRCode }> {
    if (!serverAvailable) {
      const qrcodes = qrCodeStorage.getAll();
      const qr = qrcodes.find(q => q.code === code && !q.used);
      if (qr) {
        const expiresAt = new Date(qr.expiresAt);
        if (expiresAt > new Date()) {
          return { valid: true, qrCode: qr as any };
        }
      }
      return { valid: false };
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/timeclock/qrcode/validate`,
        { code, token },
        {
          headers: getAuthHeaders(),
          timeout: 2000,
        }
      );
      return response.data;
    } catch {
      serverAvailable = false;
      const qrcodes = qrCodeStorage.getAll();
      const qr = qrcodes.find(q => q.code === code && !q.used);
      if (qr) {
        const expiresAt = new Date(qr.expiresAt);
        if (expiresAt > new Date()) {
          return { valid: true, qrCode: qr as any };
        }
      }
      return { valid: false };
    }
  },

  async use(code: string, token: string, employeeId: string): Promise<QRCode> {
    if (!serverAvailable) {
      const qrcodes = qrCodeStorage.getAll();
      const qr = qrcodes.find(q => q.code === code && !q.used);
      if (qr) {
        qrCodeStorage.update(qr.id, { used: true, usedAt: new Date().toISOString() });
        return qr as any;
      }
      throw new Error('QR Code não encontrado ou já utilizado');
    }
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/timeclock/qrcode/use`,
        { code, token, employeeId },
        {
          headers: getAuthHeaders(),
          timeout: 2000,
        }
      );
      return response.data;
    } catch {
      serverAvailable = false;
      const qrcodes = qrCodeStorage.getAll();
      const qr = qrcodes.find(q => q.code === code && !q.used);
      if (qr) {
        qrCodeStorage.update(qr.id, { used: true, usedAt: new Date().toISOString() });
        return qr as any;
      }
      throw new Error('QR Code não encontrado ou já utilizado');
    }
  },
};

// ============================================
// EXPORTAÇÃO
// ============================================

export const exportService = {
  async exportPDF(filters: {
    employeeId?: string;
    branchId?: string;
    departmentId?: string;
    startDate: string;
    endDate: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);

    const response = await axios.get(
      `${API_BASE_URL}/api/timeclock/export/pdf?${params.toString()}`,
      {
        headers: getAuthHeaders(),
        responseType: 'blob',
      }
    );
    return response.data;
  },

  async exportExcel(filters: {
    employeeId?: string;
    branchId?: string;
    departmentId?: string;
    startDate: string;
    endDate: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);

    const response = await axios.get(
      `${API_BASE_URL}/api/timeclock/export/excel?${params.toString()}`,
      {
        headers: getAuthHeaders(),
        responseType: 'blob',
      }
    );
    return response.data;
  },

  async exportCSV(filters: {
    employeeId?: string;
    branchId?: string;
    departmentId?: string;
    startDate: string;
    endDate: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters.employeeId) params.append('employeeId', filters.employeeId);
    if (filters.branchId) params.append('branchId', filters.branchId);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    params.append('startDate', filters.startDate);
    params.append('endDate', filters.endDate);

    const response = await axios.get(
      `${API_BASE_URL}/api/timeclock/export/csv?${params.toString()}`,
      {
        headers: getAuthHeaders(),
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

export default {
  companyService,
  branchService,
  departmentService,
  employeeService,
  workScheduleService,
  timeClockService,
  justificationService,
  hourAdjustmentService,
  holidayService,
  qrCodeService,
  exportService,
};

