/**
 * Serviço de Armazenamento Local para Controle de Ponto
 * Salva dados no localStorage quando o servidor não está disponível
 */

import { Company, Branch, Department, Employee, WorkSchedule, TimeClock } from './timeClockService';

export interface QRCode {
  id: string;
  employeeId: string;
  code: string;
  expiresAt: string;
  used: boolean;
  usedAt?: string;
  createdAt: string;
}

export const STORAGE_KEYS = {
  companies: 'timeclock_companies',
  branches: 'timeclock_branches',
  departments: 'timeclock_departments',
  employees: 'timeclock_employees',
  schedules: 'timeclock_schedules',
  records: 'timeclock_records',
  qrcodes: 'timeclock_qrcodes',
};

// Função auxiliar para obter dados do localStorage
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Erro ao ler ${key} do localStorage:`, error);
    return [];
  }
}

// Função auxiliar para salvar no localStorage
function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar ${key} no localStorage:`, error);
    throw error;
  }
}

// ============================================
// EMPRESAS
// ============================================

export const companyStorage = {
  getAll(): Company[] {
    return getFromStorage<Company>(STORAGE_KEYS.companies);
  },

  getById(id: string): Company | null {
    const companies = this.getAll();
    return companies.find(c => c.id === id) || null;
  },

  create(data: Partial<Company>): Company {
    const companies = this.getAll();
    const newCompany: Company = {
      id: `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name || '',
      cnpj: data.cnpj || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zipCode || undefined,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    companies.push(newCompany);
    saveToStorage(STORAGE_KEYS.companies, companies);
    return newCompany;
  },

  update(id: string, data: Partial<Company>): Company {
    const companies = this.getAll();
    const index = companies.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Empresa não encontrada');
    }
    companies[index] = {
      ...companies[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.companies, companies);
    return companies[index];
  },

  delete(id: string): void {
    const companies = this.getAll();
    const filtered = companies.filter(c => c.id !== id);
    saveToStorage(STORAGE_KEYS.companies, filtered);
  },
};

// ============================================
// DEPARTAMENTOS
// ============================================

export const departmentStorage = {
  getAll(): Department[] {
    return getFromStorage<Department>(STORAGE_KEYS.departments);
  },

  getById(id: string): Department | null {
    const departments = this.getAll();
    return departments.find(d => d.id === id) || null;
  },

  create(data: Partial<Department>): Department {
    const departments = this.getAll();
    const newDepartment: Department = {
      id: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name || '',
      code: data.code || undefined,
      description: data.description || undefined,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    departments.push(newDepartment);
    saveToStorage(STORAGE_KEYS.departments, departments);
    return newDepartment;
  },

  update(id: string, data: Partial<Department>): Department {
    const departments = this.getAll();
    const index = departments.findIndex(d => d.id === id);
    if (index === -1) {
      throw new Error('Departamento não encontrado');
    }
    departments[index] = {
      ...departments[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.departments, departments);
    return departments[index];
  },

  delete(id: string): void {
    const departments = this.getAll();
    const filtered = departments.filter(d => d.id !== id);
    saveToStorage(STORAGE_KEYS.departments, filtered);
  },
};

// ============================================
// FILIAIS
// ============================================

export const branchStorage = {
  getAll(): Branch[] {
    return getFromStorage<Branch>(STORAGE_KEYS.branches);
  },

  getById(id: string): Branch | null {
    const branches = this.getAll();
    return branches.find(b => b.id === id) || null;
  },

  create(data: Partial<Branch>): Branch {
    const branches = this.getAll();
    const newBranch: Branch = {
      id: `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId: data.companyId || '',
      name: data.name || '',
      code: data.code || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      state: data.state || undefined,
      zipCode: data.zipCode || undefined,
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      radius: data.radius || undefined,
      authorizedIPs: typeof data.authorizedIPs === 'string' ? data.authorizedIPs : (data.authorizedIPs ? JSON.stringify(data.authorizedIPs) : undefined),
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    branches.push(newBranch);
    saveToStorage(STORAGE_KEYS.branches, branches);
    return newBranch;
  },

  update(id: string, data: Partial<Branch>): Branch {
    const branches = this.getAll();
    const index = branches.findIndex(b => b.id === id);
    if (index === -1) {
      throw new Error('Filial não encontrada');
    }
    branches[index] = {
      ...branches[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.branches, branches);
    return branches[index];
  },

  delete(id: string): void {
    const branches = this.getAll();
    const filtered = branches.filter(b => b.id !== id);
    saveToStorage(STORAGE_KEYS.branches, filtered);
  },
};

// ============================================
// FUNCIONÁRIOS
// ============================================

export const employeeStorage = {
  getAll(): Employee[] {
    return getFromStorage<Employee>(STORAGE_KEYS.employees);
  },

  getById(id: string): Employee | null {
    const employees = this.getAll();
    return employees.find(e => e.id === id) || null;
  },

  create(data: Partial<Employee>): Employee {
    const employees = this.getAll();
    const newEmployee: Employee = {
      id: `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId: data.companyId || '',
      branchId: data.branchId || undefined,
      departmentId: data.departmentId || undefined,
      userId: data.userId || undefined,
      name: data.name || '',
      cpf: data.cpf || undefined,
      rg: data.rg || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      birthDate: data.birthDate || undefined,
      address: data.address || undefined,
      employeeCode: data.employeeCode || undefined,
      position: data.position || undefined,
      function: data.function || undefined,
      contractType: data.contractType || undefined,
      hireDate: data.hireDate || undefined,
      dismissalDate: data.dismissalDate || undefined,
      salary: data.salary || undefined,
      workScheduleId: data.workScheduleId || undefined,
      workHours: data.workHours || undefined,
      workDays: Array.isArray(data.workDays) ? data.workDays : undefined,
      accessLevel: data.accessLevel || 'employee',
      canRegisterPoint: data.canRegisterPoint !== undefined ? data.canRegisterPoint : true,
      qrCode: data.qrCode || undefined,
      qrCodeExpiresAt: data.qrCodeExpiresAt || undefined,
      biometricId: data.biometricId || undefined,
      isActive: data.isActive !== undefined ? data.isActive : true,
      status: data.status || 'active',
      hourBalance: data.hourBalance || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    employees.push(newEmployee);
    saveToStorage(STORAGE_KEYS.employees, employees);
    return newEmployee;
  },

  update(id: string, data: Partial<Employee>): Employee {
    const employees = this.getAll();
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error('Funcionário não encontrado');
    }
    employees[index] = {
      ...employees[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.employees, employees);
    return employees[index];
  },

  delete(id: string): void {
    const employees = this.getAll();
    const filtered = employees.filter(e => e.id !== id);
    saveToStorage(STORAGE_KEYS.employees, filtered);
  },
};

// ============================================
// JORNADAS DE TRABALHO
// ============================================

export const scheduleStorage = {
  getAll(): WorkSchedule[] {
    return getFromStorage<WorkSchedule>(STORAGE_KEYS.schedules);
  },

  getById(id: string): WorkSchedule | null {
    const schedules = this.getAll();
    return schedules.find(s => s.id === id) || null;
  },

  create(data: Partial<WorkSchedule>): WorkSchedule {
    const schedules = this.getAll();
    const newSchedule: WorkSchedule = {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyId: data.companyId || '',
      name: data.name || '',
      description: data.description || undefined,
      type: data.type || 'fixed',
      workDays: typeof data.workDays === 'string' ? data.workDays : (Array.isArray(data.workDays) ? JSON.stringify(data.workDays) : JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])),
      workHours: data.workHours || 8,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      breakStart: data.breakStart || undefined,
      breakEnd: data.breakEnd || undefined,
      breakDuration: data.breakDuration || undefined,
      minHours: data.minHours || undefined,
      maxHours: data.maxHours || undefined,
      shiftDays: data.shiftDays || undefined,
      restDays: data.restDays || undefined,
      allowOvertime: data.allowOvertime !== undefined ? data.allowOvertime : true,
      maxOvertime: data.maxOvertime || undefined,
      tolerance: data.tolerance || 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    schedules.push(newSchedule);
    saveToStorage(STORAGE_KEYS.schedules, schedules);
    return newSchedule;
  },

  update(id: string, data: Partial<WorkSchedule>): WorkSchedule {
    const schedules = this.getAll();
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error('Jornada não encontrada');
    }
    schedules[index] = {
      ...schedules[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.schedules, schedules);
    return schedules[index];
  },

  delete(id: string): void {
    const schedules = this.getAll();
    const filtered = schedules.filter(s => s.id !== id);
    saveToStorage(STORAGE_KEYS.schedules, filtered);
  },
};

// ============================================
// REGISTROS DE PONTO
// ============================================

export const timeClockStorage = {
  getAll(): TimeClock[] {
    return getFromStorage<TimeClock>(STORAGE_KEYS.records);
  },

  getById(id: string): TimeClock | null {
    const records = this.getAll();
    return records.find(r => r.id === id) || null;
  },

  create(data: Partial<TimeClock> & { 
    employeeId: string; 
    type: TimeClock['type']; 
    method: TimeClock['method'];
    companyId?: string;
    employeeName?: string;
    employeeCode?: string;
    authenticationMethod?: string;
    deviceType?: 'web' | 'mobile' | 'hardware';
    deviceId?: string;
    userAgent?: string;
    ipAddress?: string;
    status?: 'valid' | 'adjusted' | 'invalidated' | 'under_review';
  }): TimeClock {
    const records = this.getAll();
    
    // Buscar funcionário para obter dados se não fornecidos
    const employees = employeeStorage.getAll();
    const employee = employees.find(e => e.id === data.employeeId);
    
    const newRecord: TimeClock = {
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      employeeId: data.employeeId,
      employeeName: data.employeeName || employee?.name || 'N/A', // Snapshot obrigatório
      employeeCode: data.employeeCode || employee?.employeeCode || undefined, // Snapshot obrigatório
      companyId: data.companyId || employee?.companyId || '', // Obrigatório
      branchId: data.branchId || employee?.branchId || undefined,
      type: data.type,
      timestamp: new Date().toISOString(),
      latitude: data.latitude || undefined,
      longitude: data.longitude || undefined,
      address: data.address || undefined,
      ipAddress: data.ipAddress || '0.0.0.0',
      method: data.method,
      authenticationMethod: data.authenticationMethod || data.method, // Método de autenticação
      deviceType: data.deviceType || 'web',
      deviceId: data.deviceId || undefined,
      userAgent: data.userAgent || navigator.userAgent || undefined,
      qrCodeId: data.qrCodeId || undefined,
      isValid: true,
      validationMessage: undefined,
      isDuplicate: false,
      status: data.status || 'valid', // Status inicial: válido
      notes: data.notes || undefined,
      justificationId: data.justificationId || undefined,
      adjustedBy: data.adjustedBy || undefined,
      adjustedAt: data.adjustedAt || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    records.push(newRecord);
    saveToStorage(STORAGE_KEYS.records, records);
    
    // Atualizar saldo de horas do funcionário
    this.updateEmployeeHourBalance(data.employeeId);
    
    return newRecord;
  },

  update(id: string, data: Partial<TimeClock>): TimeClock {
    const records = this.getAll();
    const index = records.findIndex(r => r.id === id);
    if (index === -1) {
      throw new Error('Registro não encontrado');
    }
    records[index] = {
      ...records[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(STORAGE_KEYS.records, records);
    
    if (data.employeeId || records[index].employeeId) {
      this.updateEmployeeHourBalance(data.employeeId || records[index].employeeId);
    }
    
    return records[index];
  },

  delete(id: string): void {
    const records = this.getAll();
    const record = records.find(r => r.id === id);
    const filtered = records.filter(r => r.id !== id);
    saveToStorage(STORAGE_KEYS.records, filtered);
    
    if (record) {
      this.updateEmployeeHourBalance(record.employeeId);
    }
  },

  // Atualizar saldo de horas do funcionário baseado nos registros
  updateEmployeeHourBalance(employeeId: string): void {
    const records = this.getAll().filter(r => r.employeeId === employeeId);
    const employees = employeeStorage.getAll();
    const employee = employees.find(e => e.id === employeeId);
    
    if (!employee) return;
    
    // Calcular saldo de horas (lógica simplificada)
    // Em produção, isso seria mais complexo
    let balance = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRecords = records.filter(r => {
      const recordDate = new Date(r.timestamp);
      return recordDate >= today;
    });
    
    // Calcular horas trabalhadas hoje
    const entryRecords = todayRecords.filter(r => r.type === 'entry');
    const exitRecords = todayRecords.filter(r => r.type === 'exit');
    
    if (entryRecords.length > 0 && exitRecords.length > 0) {
      const entryTime = new Date(entryRecords[0].timestamp).getTime();
      const exitTime = new Date(exitRecords[exitRecords.length - 1].timestamp).getTime();
      const workedHours = (exitTime - entryTime) / (1000 * 60 * 60);
      const expectedHours = employee.workHours || 8;
      balance = workedHours - expectedHours;
    }
    
    employeeStorage.update(employeeId, { hourBalance: balance });
  },
};

// ============================================
// QR CODES
// ============================================

export const qrCodeStorage = {
  getAll(): QRCode[] {
    return getFromStorage<QRCode>(STORAGE_KEYS.qrcodes);
  },

  getById(id: string): QRCode | null {
    const qrcodes = this.getAll();
    return qrcodes.find(q => q.id === id) || null;
  },

  create(data: Partial<QRCode> & { employeeId: string; expiresInMinutes: number }): QRCode {
    const qrcodes = this.getAll();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + data.expiresInMinutes);
    
    const newQRCode: QRCode = {
      id: `qrcode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      employeeId: data.employeeId,
      code: data.code || `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      expiresAt: expiresAt.toISOString(),
      used: false,
      usedAt: undefined,
      createdAt: new Date().toISOString(),
    };
    
    qrcodes.push(newQRCode);
    saveToStorage(STORAGE_KEYS.qrcodes, qrcodes);
    return newQRCode;
  },

  update(id: string, data: Partial<QRCode>): QRCode {
    const qrcodes = this.getAll();
    const index = qrcodes.findIndex(q => q.id === id);
    if (index === -1) {
      throw new Error('QR Code não encontrado');
    }
    qrcodes[index] = {
      ...qrcodes[index],
      ...data,
    };
    saveToStorage(STORAGE_KEYS.qrcodes, qrcodes);
    return qrcodes[index];
  },

  delete(id: string): void {
    const qrcodes = this.getAll();
    const filtered = qrcodes.filter(q => q.id !== id);
    saveToStorage(STORAGE_KEYS.qrcodes, filtered);
  },
};

