// Serviço de e-mail (demo). Em produção, integrar com provider (SES, Sendgrid, Resend, etc.)

class EmailService {
  async sendWelcomeEmail(to: string, payload: { name: string; plan?: string; txid?: string; activationLink?: string }): Promise<boolean> {
    try {
      // Enviando e-mail de boas-vindas
      // Em produção, chamada HTTP para o backend enviar via provider
      return true;
    } catch (e) {
      // Falha ao enviar e-mail
      return false;
    }
  }
}

const emailService = new EmailService();
export default emailService;


