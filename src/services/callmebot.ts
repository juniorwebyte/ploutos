// Wrapper da CallMeBot com retries, normalização de telefone e templates

type SendResult = { ok: boolean; status?: number; body?: string };

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

export class CallMeBotClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  normalize(phone: string): string {
    const digits = (phone || '').replace(/\D/g, '');
    if (!digits) return '';
    const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
    return `+${withCountry}`; // CallMeBot aceita com +
  }

  isLikelySuccess(status: number, body: string): boolean {
    if (status >= 200 && status < 300) return true;
    const txt = (body || '').toLowerCase();
    return ['message queued', 'ok', 'success', 'enviado', 'sent'].some(s => txt.includes(s));
  }

  async sendMessage(rawPhone: string, message: string, maxRetries = 3): Promise<SendResult> {
    const phone = this.normalize(rawPhone);
    if (!phone || phone.length < 12) return { ok: false };
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(this.apiKey)}`;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        const res = await fetch(url);
        const text = await res.text();
        const ok = this.isLikelySuccess(res.status, text);
        if (ok) return { ok: true, status: res.status, body: text };
        attempt++;
        if (attempt >= maxRetries) return { ok: false, status: res.status, body: text };
        await sleep(1000 * Math.pow(1.5, attempt));
      } catch (e) {
        attempt++;
        if (attempt >= maxRetries) return { ok: false };
        await sleep(1000 * Math.pow(1.5, attempt));
      }
    }
    return { ok: false };
  }

  buildVerificationTemplate(name: string, code: string) {
    return (
      `🔐 *Código de Verificação - PloutosLedger*\n\n` +
      `Olá ${name}!\n\n` +
      `Seu código é: *${code}*\n` +
      `Validade: 10 minutos.\n\n` +
      `_Webyte · PloutosLedger_`
    );
  }

  buildAdminNotifyTemplate(client: { name: string; email: string; phone: string; company: string; position?: string; verificationCode: string }) {
    return (
      `📊 *Novo Cliente Demo*\n\n` +
      `👤 ${client.name}\n` +
      `📧 ${client.email}\n` +
      `📱 ${this.normalize(client.phone)}\n` +
      `🏢 ${client.company}${client.position ? ` · ${client.position}` : ''}\n` +
      `🔐 Código: ${client.verificationCode}`
    );
  }
}

export default function createCallMeBotClient(apiKey: string) {
  return new CallMeBotClient(apiKey);
}


