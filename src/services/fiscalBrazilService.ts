// Serviço de Padrões Fiscais Brasileiros - SAT, NFCe, NFe
export interface SATConfig {
  enabled: boolean;
  cnpj: string;
  codigoAtivacao: string;
  numeroSerie: string;
  versao: string;
}

export interface NFCeData {
  numero: string;
  serie: string;
  chaveAcesso: string;
  dataEmissao: string;
  modelo: '65'; // NFCe sempre modelo 65
  ambiente: '1' | '2'; // 1=Produção, 2=Homologação
  dadosEmitente: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    endereco: {
      logradouro: string;
      numero: string;
      bairro: string;
      municipio: string;
      uf: string;
      cep: string;
    };
  };
  dadosDestinatario?: {
    cpf?: string;
    cnpj?: string;
    nome: string;
  };
  itens: Array<{
    codigo: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    icms?: {
      origem: string;
      cst: string;
      aliquota: number;
    };
  }>;
  totais: {
    valorProdutos: number;
    valorDesconto: number;
    valorFrete: number;
    valorTotal: number;
    valorICMS: number;
    valorPIS: number;
    valorCOFINS: number;
  };
  formaPagamento: Array<{
    tipo: string;
    valor: number;
  }>;
  qrCode?: string;
  urlConsulta?: string;
}

export interface NFeData {
  numero: string;
  serie: string;
  chaveAcesso: string;
  dataEmissao: string;
  modelo: '55'; // NFe sempre modelo 55
  ambiente: '1' | '2';
  naturezaOperacao: string;
  dadosEmitente: {
    cnpj: string;
    razaoSocial: string;
    nomeFantasia: string;
    ie: string;
    endereco: {
      logradouro: string;
      numero: string;
      bairro: string;
      municipio: string;
      uf: string;
      cep: string;
    };
  };
  dadosDestinatario: {
    cpf?: string;
    cnpj?: string;
    nome: string;
    ie?: string;
    endereco: {
      logradouro: string;
      numero: string;
      bairro: string;
      municipio: string;
      uf: string;
      cep: string;
    };
  };
  itens: Array<{
    codigo: string;
    descricao: string;
    ncm: string;
    cfop: string;
    unidade: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    icms: {
      origem: string;
      cst: string;
      aliquota: number;
      base: number;
      valor: number;
    };
    ipi?: {
      cst: string;
      aliquota: number;
      base: number;
      valor: number;
    };
    pis: {
      cst: string;
      aliquota: number;
      base: number;
      valor: number;
    };
    cofins: {
      cst: string;
      aliquota: number;
      base: number;
      valor: number;
    };
  }>;
  totais: {
    valorProdutos: number;
    valorDesconto: number;
    valorFrete: number;
    valorTotal: number;
    valorICMS: number;
    valorIPI: number;
    valorPIS: number;
    valorCOFINS: number;
  };
  formaPagamento: Array<{
    tipo: string;
    valor: number;
  }>;
}

class FiscalBrazilService {
  private readonly SAT_CONFIG_KEY = 'pdv_sat_config';
  private readonly NFCe_KEY = 'pdv_nfces';
  private readonly NFe_KEY = 'pdv_nfes';

  // ========== SAT (Sistema Autenticador e Transmissor) ==========
  
  getSATConfig(): SATConfig {
    try {
      const stored = localStorage.getItem(this.SAT_CONFIG_KEY);
      return stored ? JSON.parse(stored) : {
        enabled: false,
        cnpj: '',
        codigoAtivacao: '',
        numeroSerie: '',
        versao: '0.07.00'
      };
    } catch {
      return {
        enabled: false,
        cnpj: '',
        codigoAtivacao: '',
        numeroSerie: '',
        versao: '0.07.00'
      };
    }
  }

  saveSATConfig(config: SATConfig): void {
    localStorage.setItem(this.SAT_CONFIG_KEY, JSON.stringify(config));
  }

  // ========== NFCe (Nota Fiscal de Consumidor Eletrônica) ==========
  
  generateNFCe(saleData: any, emitenteData: any): NFCeData {
    const numero = this.generateNumeroNFCe();
    const chaveAcesso = this.generateChaveAcesso('65', emitenteData.uf, emitenteData.cnpj, numero);
    
    const nfce: NFCeData = {
      numero,
      serie: '1',
      chaveAcesso,
      dataEmissao: new Date().toISOString(),
      modelo: '65',
      ambiente: '2', // Homologação por padrão
      dadosEmitente: {
        cnpj: emitenteData.cnpj,
        razaoSocial: emitenteData.razaoSocial,
        nomeFantasia: emitenteData.nomeFantasia || emitenteData.razaoSocial,
        endereco: emitenteData.endereco
      },
      itens: saleData.items.map((item: any) => ({
        codigo: item.product_id || item.codigo || '',
        descricao: item.product_name || item.descricao || '',
        ncm: item.ncm || '00000000',
        cfop: item.cfop || '5102',
        unidade: 'UN',
        quantidade: item.quantity || 1,
        valorUnitario: item.unit_price || 0,
        valorTotal: item.total_price || 0,
        icms: {
          origem: '0',
          cst: '00',
          aliquota: 18
        }
      })),
      totais: {
        valorProdutos: saleData.total || 0,
        valorDesconto: 0,
        valorFrete: 0,
        valorTotal: saleData.total || 0,
        valorICMS: (saleData.total || 0) * 0.18,
        valorPIS: (saleData.total || 0) * 0.0165,
        valorCOFINS: (saleData.total || 0) * 0.076
      },
      formaPagamento: [{
        tipo: saleData.paymentMethod || '01',
        valor: saleData.total || 0
      }]
    };

    // Gerar QR Code (formato simplificado)
    nfce.qrCode = this.generateQRCodeNFCe(nfce);
    nfce.urlConsulta = `https://www.sefaz.ce.gov.br/nfce/consulta?chNFe=${nfce.chaveAcesso}&nVersao=100&tpAmb=2`;

    // Salvar NFCe
    const nfces = this.getNFCes();
    nfces.unshift(nfce);
    localStorage.setItem(this.NFCe_KEY, JSON.stringify(nfces.slice(0, 1000))); // Limitar a 1000

    return nfce;
  }

  getNFCes(): NFCeData[] {
    try {
      const stored = localStorage.getItem(this.NFCe_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // ========== NFe (Nota Fiscal Eletrônica) ==========
  
  generateNFe(saleData: any, emitenteData: any, destinatarioData: any): NFeData {
    const numero = this.generateNumeroNFe();
    const chaveAcesso = this.generateChaveAcesso('55', emitenteData.uf, emitenteData.cnpj, numero);
    
    const nfe: NFeData = {
      numero,
      serie: '1',
      chaveAcesso,
      dataEmissao: new Date().toISOString(),
      modelo: '55',
      ambiente: '2', // Homologação por padrão
      naturezaOperacao: 'VENDA',
      dadosEmitente: {
        cnpj: emitenteData.cnpj,
        razaoSocial: emitenteData.razaoSocial,
        nomeFantasia: emitenteData.nomeFantasia || emitenteData.razaoSocial,
        ie: emitenteData.ie || '',
        endereco: emitenteData.endereco
      },
      dadosDestinatario: {
        cpf: destinatarioData.cpf,
        cnpj: destinatarioData.cnpj,
        nome: destinatarioData.nome,
        ie: destinatarioData.ie,
        endereco: destinatarioData.endereco
      },
      itens: saleData.items.map((item: any) => ({
        codigo: item.product_id || item.codigo || '',
        descricao: item.product_name || item.descricao || '',
        ncm: item.ncm || '00000000',
        cfop: item.cfop || '5102',
        unidade: 'UN',
        quantidade: item.quantity || 1,
        valorUnitario: item.unit_price || 0,
        valorTotal: item.total_price || 0,
        icms: {
          origem: '0',
          cst: '00',
          aliquota: 18,
          base: item.total_price || 0,
          valor: (item.total_price || 0) * 0.18
        },
        pis: {
          cst: '01',
          aliquota: 1.65,
          base: item.total_price || 0,
          valor: (item.total_price || 0) * 0.0165
        },
        cofins: {
          cst: '01',
          aliquota: 7.6,
          base: item.total_price || 0,
          valor: (item.total_price || 0) * 0.076
        }
      })),
      totais: {
        valorProdutos: saleData.total || 0,
        valorDesconto: 0,
        valorFrete: 0,
        valorTotal: saleData.total || 0,
        valorICMS: (saleData.total || 0) * 0.18,
        valorIPI: 0,
        valorPIS: (saleData.total || 0) * 0.0165,
        valorCOFINS: (saleData.total || 0) * 0.076
      },
      formaPagamento: [{
        tipo: saleData.paymentMethod || '01',
        valor: saleData.total || 0
      }]
    };

    // Salvar NFe
    const nfes = this.getNFe();
    nfes.unshift(nfe);
    localStorage.setItem(this.NFe_KEY, JSON.stringify(nfes.slice(0, 1000))); // Limitar a 1000

    return nfe;
  }

  getNFe(): NFeData[] {
    try {
      const stored = localStorage.getItem(this.NFe_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // ========== Utilitários ==========
  
  private generateNumeroNFCe(): string {
    const lastNFCe = this.getNFCes()[0];
    const lastNum = lastNFCe ? parseInt(lastNFCe.numero) : 0;
    return String(lastNum + 1).padStart(9, '0');
  }

  private generateNumeroNFe(): string {
    const lastNFe = this.getNFe()[0];
    const lastNum = lastNFe ? parseInt(lastNFe.numero) : 0;
    return String(lastNum + 1).padStart(9, '0');
  }

  private generateChaveAcesso(modelo: string, uf: string, cnpj: string, numero: string): string {
    // Formato simplificado da chave de acesso (44 dígitos)
    // Em produção, usar biblioteca ACBr ou similar
    const ano = new Date().getFullYear().toString().slice(-2);
    const mes = String(new Date().getMonth() + 1).padStart(2, '0');
    const cnpjClean = cnpj.replace(/\D/g, '');
    const serie = '001';
    const numeroPadded = numero.padStart(9, '0');
    const codigoNumerico = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const dv = Math.floor(Math.random() * 10).toString();
    
    return `${uf}${ano}${mes}${cnpjClean}${modelo}${serie}${numeroPadded}${codigoNumerico}${dv}`;
  }

  private generateQRCodeNFCe(nfce: NFCeData): string {
    // QR Code simplificado (em produção usar biblioteca)
    return `https://www.sefaz.ce.gov.br/nfce/qrcode?p=${nfce.chaveAcesso}|2|1|1|${nfce.totais.valorTotal.toFixed(2)}`;
  }

  // Validar CNPJ para emissão fiscal
  validateCNPJForFiscal(cnpj: string): boolean {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return false;
    
    // Validação básica (em produção usar validação completa)
    return /^\d{14}$/.test(clean);
  }
}

export const fiscalBrazilService = new FiscalBrazilService();
