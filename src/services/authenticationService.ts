/**
 * Serviço de Autenticação Multi-Método para Controle de Ponto
 * Suporta: Biometria, Senha/PIN, QR Code, RFID, Reconhecimento Facial, Login+OTP
 */

export interface AuthenticationMethod {
  id: string;
  type: 'biometric' | 'password' | 'pin' | 'qrcode' | 'rfid' | 'facial' | 'login_otp';
  name: string;
  enabled: boolean;
  requiresHardware?: boolean;
}

export interface BiometricData {
  type: 'fingerprint' | 'facial' | 'iris';
  template: string; // Hash/template criptografado
  deviceId?: string;
}

export interface AuthenticationResult {
  success: boolean;
  employeeId?: string;
  method: string;
  timestamp: Date;
  deviceId?: string;
  location?: { lat: number; lng: number };
  error?: string;
}

export interface PINConfig {
  minLength: number;
  maxLength: number;
  requireComplexity: boolean;
  expiresInDays?: number;
  maxAttempts: number;
}

class AuthenticationService {
  private methods: AuthenticationMethod[] = [
    { id: 'biometric', type: 'biometric', name: 'Biometria', enabled: true, requiresHardware: true },
    { id: 'password', type: 'password', name: 'Senha', enabled: true },
    { id: 'pin', type: 'pin', name: 'PIN', enabled: true },
    { id: 'qrcode', type: 'qrcode', name: 'QR Code', enabled: true },
    { id: 'rfid', type: 'rfid', name: 'Cartão/RFID', enabled: true, requiresHardware: true },
    { id: 'facial', type: 'facial', name: 'Reconhecimento Facial', enabled: true, requiresHardware: true },
    { id: 'login_otp', type: 'login_otp', name: 'Login + OTP', enabled: true },
  ];

  /**
   * Autenticar por Biometria (Impressão Digital, Facial, Íris)
   */
  async authenticateBiometric(
    employeeId: string,
    biometricType: 'fingerprint' | 'facial' | 'iris',
    template: string,
    deviceId?: string
  ): Promise<AuthenticationResult> {
    try {
      // Simular verificação biométrica
      // Em produção, integrar com SDK de biometria (ex: DigitalPersona, FaceID, etc.)
      console.log(`🔐 Autenticação biométrica: ${biometricType} para funcionário ${employeeId}`);
      
      // Validar template (em produção, comparar com templates armazenados)
      if (!template || template.length < 10) {
        return {
          success: false,
          method: 'biometric',
          timestamp: new Date(),
          error: 'Template biométrico inválido',
        };
      }

      return {
        success: true,
        employeeId,
        method: `biometric_${biometricType}`,
        timestamp: new Date(),
        deviceId,
      };
    } catch (error: any) {
      return {
        success: false,
        method: 'biometric',
        timestamp: new Date(),
        error: error.message || 'Erro na autenticação biométrica',
      };
    }
  }

  /**
   * Autenticar por Senha/PIN
   */
  async authenticatePassword(
    employeeId: string,
    password: string,
    isPIN: boolean = false
  ): Promise<AuthenticationResult> {
    try {
      // Em produção, buscar hash da senha/PIN do funcionário e comparar
      console.log(`🔐 Autenticação por ${isPIN ? 'PIN' : 'Senha'} para funcionário ${employeeId}`);
      
      if (!password || password.length < 4) {
        return {
          success: false,
          method: isPIN ? 'pin' : 'password',
          timestamp: new Date(),
          error: `${isPIN ? 'PIN' : 'Senha'} inválida`,
        };
      }

      // Validar complexidade se necessário
      if (!isPIN && password.length < 6) {
        return {
          success: false,
          method: 'password',
          timestamp: new Date(),
          error: 'Senha deve ter no mínimo 6 caracteres',
        };
      }

      return {
        success: true,
        employeeId,
        method: isPIN ? 'pin' : 'password',
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        method: isPIN ? 'pin' : 'password',
        timestamp: new Date(),
        error: error.message || 'Erro na autenticação',
      };
    }
  }

  /**
   * Autenticar por QR Code
   */
  async authenticateQRCode(
    qrCode: string,
    employeeId?: string
  ): Promise<AuthenticationResult> {
    try {
      // Validar QR Code (já implementado em qrCodeService)
      const { qrCodeService } = await import('./timeClockService');
      const validation = await qrCodeService.validate(qrCode, 'token');
      
      if (!validation.valid || !validation.qrCode) {
        return {
          success: false,
          method: 'qrcode',
          timestamp: new Date(),
          error: 'QR Code inválido ou expirado',
        };
      }

      return {
        success: true,
        employeeId: validation.qrCode.employeeId || employeeId,
        method: 'qrcode',
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        method: 'qrcode',
        timestamp: new Date(),
        error: error.message || 'Erro na validação do QR Code',
      };
    }
  }

  /**
   * Autenticar por Cartão/RFID
   */
  async authenticateRFID(
    cardNumber: string,
    employeeId?: string
  ): Promise<AuthenticationResult> {
    try {
      console.log(`🔐 Autenticação por RFID: ${cardNumber}`);
      
      if (!cardNumber || cardNumber.length < 8) {
        return {
          success: false,
          method: 'rfid',
          timestamp: new Date(),
          error: 'Número do cartão inválido',
        };
      }

      // Em produção, buscar funcionário pelo número do cartão
      // const employee = await findEmployeeByCardNumber(cardNumber);

      return {
        success: true,
        employeeId,
        method: 'rfid',
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        method: 'rfid',
        timestamp: new Date(),
        error: error.message || 'Erro na leitura do cartão',
      };
    }
  }

  /**
   * Autenticar por Reconhecimento Facial
   */
  async authenticateFacial(
    employeeId: string,
    imageData: string, // Base64 ou URL da imagem
    deviceId?: string
  ): Promise<AuthenticationResult> {
    try {
      console.log(`🔐 Autenticação facial para funcionário ${employeeId}`);
      
      // Em produção, integrar com SDK de reconhecimento facial
      // Comparar com templates faciais armazenados
      if (!imageData || imageData.length < 100) {
        return {
          success: false,
          method: 'facial',
          timestamp: new Date(),
          error: 'Imagem facial inválida',
        };
      }

      return {
        success: true,
        employeeId,
        method: 'facial',
        timestamp: new Date(),
        deviceId,
      };
    } catch (error: any) {
      return {
        success: false,
        method: 'facial',
        timestamp: new Date(),
        error: error.message || 'Erro no reconhecimento facial',
      };
    }
  }

  /**
   * Autenticar por Login + OTP (One-Time Password)
   */
  async authenticateLoginOTP(
    employeeId: string,
    password: string,
    otp: string
  ): Promise<AuthenticationResult> {
    try {
      // Validar senha primeiro
      const passwordAuth = await this.authenticatePassword(employeeId, password);
      if (!passwordAuth.success) {
        return passwordAuth;
      }

      // Validar OTP (em produção, usar biblioteca como speakeasy)
      console.log(`🔐 Autenticação Login+OTP para funcionário ${employeeId}`);
      
      if (!otp || otp.length !== 6) {
        return {
          success: false,
          method: 'login_otp',
          timestamp: new Date(),
          error: 'OTP inválido',
        };
      }

      // Em produção, validar OTP com servidor de autenticação
      // const isValidOTP = await validateOTP(employeeId, otp);

      return {
        success: true,
        employeeId,
        method: 'login_otp',
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        method: 'login_otp',
        timestamp: new Date(),
        error: error.message || 'Erro na autenticação',
      };
    }
  }

  /**
   * Obter métodos de autenticação disponíveis para uma empresa
   */
  getAvailableMethods(companyId?: string): AuthenticationMethod[] {
    // Em produção, buscar configurações da empresa
    return this.methods.filter(m => m.enabled);
  }

  /**
   * Validar configuração de PIN
   */
  validatePINConfig(pin: string, config: PINConfig): { valid: boolean; error?: string } {
    if (pin.length < config.minLength) {
      return { valid: false, error: `PIN deve ter no mínimo ${config.minLength} caracteres` };
    }
    if (pin.length > config.maxLength) {
      return { valid: false, error: `PIN deve ter no máximo ${config.maxLength} caracteres` };
    }
    if (config.requireComplexity) {
      // Verificar se tem números e letras
      const hasNumbers = /\d/.test(pin);
      const hasLetters = /[a-zA-Z]/.test(pin);
      if (!hasNumbers || !hasLetters) {
        return { valid: false, error: 'PIN deve conter números e letras' };
      }
    }
    return { valid: true };
  }
}

export const authenticationService = new AuthenticationService();

