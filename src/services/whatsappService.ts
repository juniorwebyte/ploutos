// Serviço para integração com CallMeBot WhatsApp API
import createCallMeBotClient from './callmebot';
export interface WhatsAppMessage {
  phone: string;
  message: string;
  apiKey: string;
}

export interface ClientData {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  verificationCode: string;
  registeredAt: string;
  status: 'pending' | 'verified' | 'expired';
}

class WhatsAppService {
  private apiKey: string;
  private adminPhone: string;
  private client: ReturnType<typeof createCallMeBotClient>;

  constructor() {
    // API Key real do CallMeBot
    this.apiKey = import.meta.env.VITE_CALLMEBOT_API_KEY || '1782254';
    this.adminPhone = import.meta.env.VITE_ADMIN_PHONE || '5511984801839';
    this.client = createCallMeBotClient(this.apiKey);
  }

  // ... existing code ...

  /**
   * Envia mensagem via WhatsApp usando CallMeBot API
   */
  async sendMessage(phone: string, message: string): Promise<boolean> {
    try {
      // Validar telefone antes de processar
      if (!phone || phone.trim() === '') {
        return false;
      }

      // Limpar e formatar telefone
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Validar se tem pelo menos 10 dígitos (DDD + número)
      if (cleanPhone.length < 10) {
        return false;
      }

      // Normalizar via cliente CallMeBot
      const whatsappPhone = this.client.normalize(cleanPhone);

      // Validar se o telefone final tem pelo menos 12 dígitos (55 + DDD + número)
      if (whatsappPhone.length < 12) {
        return false;
      }

      // Enviar via wrapper com retries
      const result = await this.client.sendMessage(whatsappPhone, message, 3);
      return result.ok;
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Envia código de verificação para o cliente
   */
  async sendVerificationCode(clientData: ClientData): Promise<boolean> {
    const message = this.client.buildVerificationTemplate(clientData.name, clientData.verificationCode);

    return await this.sendMessage(clientData.phone, message);
  }

  /**
   * Envia notificação para o admin sobre novo cliente
   */
  async notifyAdmin(clientData: ClientData): Promise<boolean> {
    const message = this.client.buildAdminNotifyTemplate(clientData);

    return await this.sendMessage(this.adminPhone, message);
  }

  /**
   * Formata número de telefone brasileiro
   */
  private formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }

  /**
   * Gera código de verificação de 6 dígitos
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Valida formato de telefone brasileiro
   */
  isValidPhone(phone: string): boolean {
    if (!phone || phone.trim() === '') {
      return false;
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Aceitar telefones com 10 ou 11 dígitos (com ou sem código do país)
    if (cleanPhone.length === 10) {
      // Formato: DDD + 8 dígitos (telefone fixo)
      return true;
    } else if (cleanPhone.length === 11) {
      // Formato: DDD + 9 dígitos (celular)
      return true;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('55')) {
      // Formato: 55 + DDD + 8 dígitos (telefone fixo com código do país)
      return true;
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
      // Formato: 55 + DDD + 9 dígitos (celular com código do país)
      return true;
    }
    
    return false;
  }

  /**
   * Valida formato de email
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Instância singleton do serviço
const whatsappService = new WhatsAppService();

export default whatsappService;
export { WhatsAppService, type WhatsAppMessage, type ClientData };
