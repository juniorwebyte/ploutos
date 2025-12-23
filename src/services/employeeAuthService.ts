/**
 * Serviço de Autenticação de Funcionários
 * Gerencia credenciais e autenticação obrigatória antes de bater ponto
 */

import { employeeService, type Employee } from './timeClockService';
import { auditService } from './auditService';

export interface EmployeeCredentials {
  employeeId: string;
  password?: string; // Hash da senha
  pin?: string; // Hash do PIN
  biometricId?: string; // ID biométrico
  rfidCard?: string; // Número do cartão RFID
  lastPasswordChange?: Date;
  pinExpiresAt?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
}

export interface AuthenticationRequest {
  method: 'password' | 'pin' | 'biometric' | 'qrcode' | 'rfid' | 'facial' | 'app_token';
  employeeId?: string;
  credential: string; // senha, PIN, template biométrico, QR code, etc
  deviceId?: string;
  deviceType?: 'web' | 'mobile' | 'hardware';
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthenticationResult {
  success: boolean;
  employee?: Employee;
  error?: string;
  requiresMFA?: boolean;
  sessionToken?: string;
}

class EmployeeAuthService {
  private credentials: Map<string, EmployeeCredentials> = new Map();

  constructor() {
    this.loadCredentials();
  }

  /**
   * Registrar credenciais de um funcionário
   */
  async registerCredentials(
    employeeId: string,
    credentials: {
      password?: string;
      pin?: string;
      biometricId?: string;
      rfidCard?: string;
    }
  ): Promise<void> {
    const creds: EmployeeCredentials = {
      employeeId,
      password: credentials.password ? await this.hashPassword(credentials.password) : undefined,
      pin: credentials.pin ? await this.hashPassword(credentials.pin) : undefined,
      biometricId: credentials.biometricId,
      rfidCard: credentials.rfidCard,
      failedAttempts: 0,
    };

    this.credentials.set(employeeId, creds);
    this.saveCredentials();

    await auditService.logAction(
      'employee.credentials.registered',
      'employee',
      { entityId: employeeId, details: { methods: Object.keys(credentials) } }
    );
  }

  /**
   * Autenticar funcionário ANTES de permitir bater ponto
   */
  async authenticate(request: AuthenticationRequest): Promise<AuthenticationResult> {
    try {
      // Validar método
      if (!request.method) {
        return { success: false, error: 'Método de autenticação não especificado' };
      }

      // Buscar funcionário
      let employee: Employee | null = null;
      
      if (request.method === 'rfid' && request.credential) {
        // Buscar por RFID
        const employees = await employeeService.getAll();
        employee = employees.find(e => {
          const creds = this.credentials.get(e.id);
          return creds?.rfidCard === request.credential;
        }) || null;
      } else if (request.method === 'qrcode' && request.credential) {
        // Validar QR Code
        const { qrCodeService } = await import('./timeClockService');
        const validation = await qrCodeService.validate(request.credential, 'token');
        if (validation.valid && validation.qrCode) {
          employee = await employeeService.getById(validation.qrCode.employeeId);
        }
      } else if (request.employeeId || request.credential) {
        // Buscar funcionário por identificador flexível (CPF, matrícula, email, ID)
        const identifier = request.employeeId || request.credential;
        const employees = await employeeService.getAll();
        
        // Remover formatação do CPF para comparação
        const cleanIdentifier = identifier.replace(/\D/g, '');
        
        employee = employees.find(e => {
          // Buscar por ID (UUID)
          if (e.id === identifier) return true;
          
          // Buscar por matrícula (employeeCode)
          if (e.employeeCode && e.employeeCode.toLowerCase() === identifier.toLowerCase()) return true;
          
          // Buscar por CPF (com e sem formatação)
          if (e.cpf) {
            const cleanCpf = e.cpf.replace(/\D/g, '');
            if (cleanCpf === cleanIdentifier || e.cpf === identifier) return true;
          }
          
          // Buscar por email
          if (e.email && e.email.toLowerCase() === identifier.toLowerCase()) return true;
          
          return false;
        }) || null;
      }

      if (!employee) {
        await auditService.logAction(
          'employee.auth.failed',
          'employee',
          { details: { method: request.method, reason: 'employee_not_found' } }
        );
        return { success: false, error: 'Funcionário não encontrado' };
      }

      // Validar funcionário ativo
      if (!employee.isActive || employee.status !== 'active') {
        await auditService.logAction(
          'employee.auth.failed',
          'employee',
          { entityId: employee.id, details: { method: request.method, reason: 'inactive' } }
        );
        return { success: false, error: 'Funcionário inativo' };
      }

      // Validar permissão
      if (!employee.canRegisterPoint) {
        await auditService.logAction(
          'employee.auth.failed',
          'employee',
          { entityId: employee.id, details: { method: request.method, reason: 'no_permission' } }
        );
        return { success: false, error: 'Funcionário não tem permissão para registrar ponto' };
      }

      // Verificar bloqueio
      const creds = this.credentials.get(employee.id);
      if (creds?.lockedUntil && new Date(creds.lockedUntil) > new Date()) {
        return { success: false, error: 'Conta temporariamente bloqueada devido a múltiplas tentativas falhas' };
      }

      // Autenticar conforme método
      let authenticated = false;

      switch (request.method) {
        case 'password':
          authenticated = await this.authenticatePassword(employee.id, request.credential);
          break;
        case 'pin':
          authenticated = await this.authenticatePIN(employee.id, request.credential);
          break;
        case 'biometric':
          authenticated = await this.authenticateBiometric(employee.id, request.credential);
          break;
        case 'rfid':
          authenticated = await this.authenticateRFID(employee.id, request.credential);
          break;
        case 'qrcode':
          authenticated = true; // Já validado acima
          break;
        case 'facial':
          authenticated = await this.authenticateFacial(employee.id, request.credential);
          break;
        case 'app_token':
          authenticated = await this.authenticateAppToken(employee.id, request.credential);
          break;
        default:
          return { success: false, error: 'Método de autenticação não suportado' };
      }

      if (!authenticated) {
        // Incrementar tentativas falhas
        if (creds) {
          creds.failedAttempts = (creds.failedAttempts || 0) + 1;
          if (creds.failedAttempts >= 5) {
            creds.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Bloquear por 30 minutos
          }
          this.credentials.set(employee.id, creds);
          this.saveCredentials();
        }

        await auditService.logAction(
          'employee.auth.failed',
          'employee',
          {
            entityId: employee.id,
            details: {
              method: request.method,
              reason: 'invalid_credentials',
              deviceId: request.deviceId,
              ipAddress: request.ipAddress,
            },
          }
        );

        return { success: false, error: 'Credenciais inválidas' };
      }

      // Resetar tentativas falhas
      if (creds) {
        creds.failedAttempts = 0;
        creds.lockedUntil = undefined;
        this.credentials.set(employee.id, creds);
        this.saveCredentials();
      }

      // Gerar token de sessão
      const sessionToken = this.generateSessionToken(employee.id);

      // Log de sucesso
      await auditService.logAction(
        'employee.auth.success',
        'employee',
        {
          entityId: employee.id,
          details: {
            method: request.method,
            deviceId: request.deviceId,
            deviceType: request.deviceType,
            ipAddress: request.ipAddress,
          },
        }
      );

      return {
        success: true,
        employee,
        sessionToken,
      };
    } catch (error: any) {
      console.error('Erro na autenticação:', error);
      return { success: false, error: error.message || 'Erro na autenticação' };
    }
  }

  /**
   * Validar token de sessão
   */
  async validateSession(token: string): Promise<Employee | null> {
    try {
      const payload = this.decodeSessionToken(token);
      if (!payload || payload.exp < Date.now()) {
        return null;
      }
      return await employeeService.getById(payload.employeeId);
    } catch {
      return null;
    }
  }

  // Métodos privados de autenticação

  private async authenticatePassword(employeeId: string, password: string): Promise<boolean> {
    const creds = this.credentials.get(employeeId);
    if (!creds || !creds.password) return false;
    const hash = await this.hashPassword(password);
    return hash === creds.password;
  }

  private async authenticatePIN(employeeId: string, pin: string): Promise<boolean> {
    const creds = this.credentials.get(employeeId);
    if (!creds || !creds.pin) return false;
    
    // Verificar expiração do PIN
    if (creds.pinExpiresAt && new Date(creds.pinExpiresAt) < new Date()) {
      return false;
    }

    const hash = await this.hashPassword(pin);
    return hash === creds.pin;
  }

  private async authenticateBiometric(employeeId: string, template: string): Promise<boolean> {
    const creds = this.credentials.get(employeeId);
    if (!creds || !creds.biometricId) return false;
    // Em produção, comparar templates biométricos
    return creds.biometricId === template;
  }

  private async authenticateRFID(employeeId: string, cardNumber: string): Promise<boolean> {
    const creds = this.credentials.get(employeeId);
    if (!creds || !creds.rfidCard) return false;
    return creds.rfidCard === cardNumber;
  }

  private async authenticateFacial(employeeId: string, imageData: string): Promise<boolean> {
    // Em produção, integrar com SDK de reconhecimento facial
    const creds = this.credentials.get(employeeId);
    return !!creds; // Simplificado
  }

  private async authenticateAppToken(employeeId: string, token: string): Promise<boolean> {
    // Validar token JWT ou similar
    try {
      const payload = this.decodeSessionToken(token);
      return payload?.employeeId === employeeId;
    } catch {
      return false;
    }
  }

  // Utilitários

  private async hashPassword(password: string): Promise<string> {
    // Em produção, usar bcrypt ou similar
    // Por enquanto, usar hash simples (NÃO SEGURO PARA PRODUÇÃO)
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateSessionToken(employeeId: string): string {
    const payload = {
      employeeId,
      exp: Date.now() + 8 * 60 * 60 * 1000, // 8 horas
      iat: Date.now(),
    };
    return btoa(JSON.stringify(payload));
  }

  private decodeSessionToken(token: string): { employeeId: string; exp: number; iat: number } | null {
    try {
      return JSON.parse(atob(token));
    } catch {
      return null;
    }
  }

  private saveCredentials() {
    try {
      const data = Array.from(this.credentials.entries()).map(([id, creds]) => ({
        ...creds,
        employeeId: id,
      }));
      localStorage.setItem('employee_credentials', JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
    }
  }

  private loadCredentials() {
    try {
      const stored = localStorage.getItem('employee_credentials');
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((creds: EmployeeCredentials) => {
          this.credentials.set(creds.employeeId, creds);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
    }
  }
}

export const employeeAuthService = new EmployeeAuthService();

