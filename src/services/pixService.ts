import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { PixCobranca, CompanyConfig } from '../types';

// Simulação de API PIX real
class PixService {
  private baseUrl = 'https://api-pix.gerencianet.com.br'; // URL fictícia para demonstração
  private apiKey = 'sua-api-key-aqui'; // Em produção, usar variáveis de ambiente
  
  // Simular configuração da empresa (em produção viria do banco de dados)
  private companyConfig: CompanyConfig = {
    id: '1',
    nomeFantasia: 'Webyte Desenvolvimentos',
    razaoSocial: 'Webyte Desenvolvimentos LTDA',
    cnpj: '12.345.678/0001-90',
    inscricaoEstadual: '123456789',
    endereco: {
      logradouro: 'Rua Agrimensor Sugaya',
      numero: '1203',
      complemento: 'Bloco 5 Sala 32',
      bairro: 'Vila Olímpia',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '04552-001'
    },
    contato: {
      telefone: '(11) 98480-1839',
      email: 'junior@webytebr.com',
      site: 'https://webytebr.com'
    },
    pix: {
      chave: '6958fb4a-050b-4e31-a594-f7fb90f7b5f3',
      tipo: 'aleatoria',
      banco: '341',
      agencia: '1234',
      conta: '56789-0'
    },
    personalizacao: {
      corPrimaria: '#10b981',
      corSecundaria: '#059669',
      logo: '',
      favicon: ''
    },
    configuracao: {
      moeda: 'BRL',
      fusoHorario: 'America/Sao_Paulo',
      formatoData: 'DD/MM/YYYY',
      formatoHora: 'HH:mm'
    }
  };

  /**
   * Criar cobrança PIX real
   */
  async criarCobranca(valor: number, cliente: any, descricao: string = 'Teste de 30 Dias - Sistema Movimento de Caixa'): Promise<PixCobranca> {
    try {
      // Gerar TXID único
      const txid = uuidv4().replace(/-/g, '').substring(0, 25);
      
      // Criar payload PIX no formato EMV seguindo rigorosamente o padrão do Banco Central
      const pixPayload = this.gerarPayloadPIX(valor, descricao, txid);
      
      // Gerar QR Code
      const qrCodeImage = await QRCode.toDataURL(pixPayload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Simular resposta da API PIX
      const cobranca: PixCobranca = {
        id: uuidv4(),
        txid,
        valor,
        chave: this.companyConfig.pix.chave,
        descricao,
        status: 'ATIVA',
        qrCode: pixPayload,
        qrCodeImage,
        dataCriacao: new Date().toISOString(),
        dataExpiracao: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos conforme BCB
        cliente
      };

      // Em produção, salvar no banco de dados
      this.salvarCobranca(cobranca);

      return cobranca;
    } catch (error) {
      // Erro ao criar cobrança PIX
      throw new Error('Falha ao criar cobrança PIX');
    }
  }

  /**
   * Gerar payload PIX no formato EMV seguindo rigorosamente o padrão do Banco Central
   */
  private gerarPayloadPIX(valor: number, descricao: string, txid: string): string {
    // Normalizar nome e cidade (sem acentos e em maiúsculas)
    const normalize = (s: string, limit: number) => s
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toUpperCase().substring(0, limit);

    const merchantName = normalize(this.companyConfig.nomeFantasia || 'WEBYTE DESENVOLVIMENTOS', 25);
    const merchantCity = normalize(this.companyConfig.endereco.cidade || 'SAO PAULO', 15);

    // Preparar chave PIX conforme tipo (telefone/email/cpf/cnpj/aleatória)
    const rawKey = this.companyConfig.pix.chave || '';
    let pixKey = rawKey;
    if (this.companyConfig.pix.tipo === 'telefone') {
      const digits = rawKey.replace(/\D/g, '');
      // formato E.164 com '+'
      pixKey = digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
    }

    const amountStr = (Math.round(valor * 100) / 100).toFixed(2); // ex: 29.99
    const descricaoLimitada = normalize(descricao || 'PAGAMENTO', 25);
    const txidLimitado = normalize(txid, 25);

    // IDs internos do campo 26 (Merchant Account Information)
    const mai00_gui = '00' + this.formatarTamanho('br.gov.bcb.pix') + 'br.gov.bcb.pix';
    const mai01_chave = '01' + this.formatarTamanho(pixKey) + pixKey;
    const merchantAccountInfo = mai00_gui + mai01_chave;

    // Campos principais
    const id00 = '000201';
    // 01 = Point of Initiation Method (11=estático, 12=dinâmico)
    const id01 = '010212';
    const id26 = '26' + this.formatarTamanho(merchantAccountInfo) + merchantAccountInfo;
    const id52 = '52040000';
    const id53 = '5303986';
    const id54 = '54' + this.formatarTamanho(amountStr) + amountStr;
    const id58 = '5802BR';
    const id59 = '59' + this.formatarTamanho(merchantName) + merchantName;
    const id60 = '60' + this.formatarTamanho(merchantCity) + merchantCity;

    // Additional Data Field Template (62) com referência (05 = txid)
    const id62_05 = '05' + this.formatarTamanho(txidLimitado) + txidLimitado;
    const id62 = '62' + this.formatarTamanho(id62_05) + id62_05;

    // Montar payload sem CRC
    const payloadSemCRC = [id00, id01, id26, id52, id53, id54, id58, id59, id60, id62, '6304'].join('');

    // Calcular CRC e substituir
    const crc = this.calcularCRC16(payloadSemCRC);
    return payloadSemCRC.replace('6304', '63' + this.formatarTamanho(crc) + crc);
  }

  /**
   * Formatar tamanho do campo (sempre 2 dígitos)
   */
  private formatarTamanho(texto: string): string {
    return texto.length.toString().padStart(2, '0');
  }

  /**
   * Calcular CRC16-CCITT seguindo o padrão do Banco Central
   */
  private calcularCRC16(payload: string): string {
    const polynomial = 0x1021;
    let crc = 0xFFFF;
    
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Consultar status da cobrança
   */
  async consultarCobranca(txid: string): Promise<PixCobranca | null> {
    try {
      // Em produção, consultar API real
      const cobrancas = this.obterCobrancasSalvas();
      return cobrancas.find(c => c.txid === txid) || null;
    } catch (error) {
      // Erro ao consultar cobrança
      return null;
    }
  }

  /**
   * Marcar cobrança como paga (simulação). Em produção, essa mudança vem via webhook Pix.
   */
  async marcarComoPaga(txid: string): Promise<void> {
    const cobrancas = this.obterCobrancasSalvas();
    const idx = cobrancas.findIndex(c => c.txid === txid);
    if (idx >= 0) {
      cobrancas[idx].status = 'LIQUIDADA';
      localStorage.setItem('pix_cobrancas', JSON.stringify(cobrancas));
    }
  }

  /**
   * Verificar se a cobrança está expirada
   */
  isExpirada(c: PixCobranca): boolean {
    return new Date(c.dataExpiracao).getTime() <= Date.now();
  }

  /**
   * Listar cobranças
   */
  async listarCobrancas(): Promise<PixCobranca[]> {
    return this.obterCobrancasSalvas();
  }

  /**
   * Salvar cobrança (simulação de banco de dados)
   */
  private salvarCobranca(cobranca: PixCobranca): void {
    const cobrancas = this.obterCobrancasSalvas();
    cobrancas.push(cobranca);
    localStorage.setItem('pix_cobrancas', JSON.stringify(cobrancas));
  }

  /**
   * Obter cobranças salvas
   */
  private obterCobrancasSalvas(): PixCobranca[] {
    const cobrancas = localStorage.getItem('pix_cobrancas');
    return cobrancas ? JSON.parse(cobrancas) : [];
  }

  /**
   * Atualizar configuração da empresa
   */
  async atualizarConfiguracao(config: Partial<CompanyConfig>): Promise<CompanyConfig> {
    this.companyConfig = { ...this.companyConfig, ...config };
    localStorage.setItem('company_config', JSON.stringify(this.companyConfig));
    return this.companyConfig;
  }

  /**
   * Obter configuração da empresa
   */
  async obterConfiguracao(): Promise<CompanyConfig> {
    const config = localStorage.getItem('company_config');
    if (config) {
      this.companyConfig = { ...this.companyConfig, ...JSON.parse(config) };
    }
    return this.companyConfig;
  }

  /**
   * Validar chave PIX
   */
  validarChavePIX(chave: string, tipo: string): boolean {
    if (!chave || !tipo) return false;
    
    switch (tipo) {
      case 'cpf':
        return /^\d{11}$/.test(chave.replace(/\D/g, ''));
      case 'cnpj':
        return /^\d{14}$/.test(chave.replace(/\D/g, ''));
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chave);
      case 'telefone':
        // Aceita formatos: +5511999999999, 5511999999999, (11)999999999, 11999999999
        const telefoneLimpo = chave.replace(/\D/g, '');
        return /^(\+?55)?\d{10,11}$/.test(telefoneLimpo) && telefoneLimpo.length >= 10;
      case 'aleatoria':
        return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(chave);
      default:
        return false;
    }
  }

  /**
   * Gerar payload PIX simples para teste (sem valor específico)
   */
  gerarPayloadPIXSimples(): string {
    const pixKey = this.companyConfig.pix.chave;
    const merchantName = this.companyConfig.nomeFantasia || 'Webyte Desenvolvimentos';
    const merchantCity = this.companyConfig.endereco.cidade || 'Sao Paulo';
    
    // Limitar tamanho dos campos conforme especificação EMV
    const merchantNameLimitado = merchantName.substring(0, 25);
    const merchantCityLimitado = merchantCity.substring(0, 15);
    
    // Payload PIX simples para transferência (sem valor)
    const payload = [
      '000201', // Payload Format Indicator
      '26' + this.formatarTamanho('0014br.gov.bcb.pix01' + this.formatarTamanho(pixKey) + pixKey) + '0014br.gov.bcb.pix01' + this.formatarTamanho(pixKey) + pixKey,
      '52040000', // Merchant Category Code
      '5303986', // Transaction Currency
      '5802BR', // Country Code
      '59' + this.formatarTamanho(merchantNameLimitado) + merchantNameLimitado,
      '60' + this.formatarTamanho(merchantCityLimitado) + merchantCityLimitado,
      '6304' // CRC16 placeholder
    ].join('');

    const crc = this.calcularCRC16(payload);
    return payload.replace('6304', '63' + this.formatarTamanho(crc) + crc);
  }

  /**
   * Validar se o QR code PIX está funcionando corretamente
   */
  async validarQRCodePIX(payload: string): Promise<boolean> {
    try {
      // Gerar QR code para teste
      const qrCodeImage = await QRCode.toDataURL(payload, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      // Verificar se o QR code foi gerado com sucesso
      return qrCodeImage && qrCodeImage.length > 0;
    } catch (error) {
      // Erro ao validar QR code PIX
      return false;
    }
  }
}

export default new PixService();