// Serviço para cálculos fiscais brasileiros (ICMS, PIS, COFINS)
export interface FiscalCalculation {
  baseICMS: number;
  valorICMS: number;
  basePIS: number;
  valorPIS: number;
  baseCOFINS: number;
  valorCOFINS: number;
  valorTotal: number;
  valorLiquido: number;
}

export interface FiscalReceiptData {
  cpf?: string;
  cnpj?: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  items: Array<{
    codigo: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    ncm?: string;
    cfop?: string;
    icms?: {
      aliquota: number;
      base: number;
      valor: number;
    };
    pis?: {
      aliquota: number;
      base: number;
      valor: number;
    };
    cofins?: {
      aliquota: number;
      base: number;
      valor: number;
    };
  }>;
  totalProdutos: number;
  totalICMS: number;
  totalPIS: number;
  totalCOFINS: number;
  valorTotal: number;
  formaPagamento: string;
  dataEmissao: Date;
}

class FiscalService {
  // Alíquotas padrão (podem ser configuradas)
  private defaultICMS = 18; // 18% padrão (varia por estado)
  private defaultPIS = 1.65; // 1.65% padrão
  private defaultCOFINS = 7.6; // 7.6% padrão

  /**
   * Calcula impostos fiscais brasileiros
   */
  calculateTaxes(
    valor: number,
    icmsAliquota?: number,
    pisAliquota?: number,
    cofinsAliquota?: number
  ): FiscalCalculation {
    const icms = icmsAliquota || this.defaultICMS;
    const pis = pisAliquota || this.defaultPIS;
    const cofins = cofinsAliquota || this.defaultCOFINS;

    // Base de cálculo ICMS = valor total
    const baseICMS = valor;
    const valorICMS = (baseICMS * icms) / 100;

    // Base de cálculo PIS e COFINS = valor total - ICMS
    const basePISCOFINS = valor - valorICMS;
    const basePIS = basePISCOFINS;
    const valorPIS = (basePIS * pis) / 100;
    const baseCOFINS = basePISCOFINS;
    const valorCOFINS = (baseCOFINS * cofins) / 100;

    const valorTotal = valor;
    const valorLiquido = valorTotal - valorICMS - valorPIS - valorCOFINS;

    return {
      baseICMS,
      valorICMS,
      basePIS,
      valorPIS,
      baseCOFINS,
      valorCOFINS,
      valorTotal,
      valorLiquido,
    };
  }

  /**
   * Gera cupom fiscal com CPF
   */
  generateFiscalReceiptCPF(data: FiscalReceiptData): string {
    const numeroCupom = `CF${Date.now().toString().slice(-8)}`;
    const dataEmissao = data.dataEmissao.toLocaleDateString('pt-BR');
    const horaEmissao = data.dataEmissao.toLocaleTimeString('pt-BR');

    let cupom = `
═══════════════════════════════════════
        CUPOM FISCAL ELETRÔNICO
═══════════════════════════════════════

Número: ${numeroCupom}
Data: ${dataEmissao} ${horaEmissao}

CLIENTE (CPF):
Nome: ${data.nome}
CPF: ${this.formatCPF(data.cpf || '')}
${data.endereco ? `Endereço: ${data.endereco}` : ''}
${data.cidade && data.uf ? `${data.cidade}/${data.uf}` : ''}
${data.cep ? `CEP: ${this.formatCEP(data.cep)}` : ''}

═══════════════════════════════════════
ITEM | DESCRIÇÃO | QTD | VLR UNIT | TOTAL
═══════════════════════════════════════
`;

    data.items.forEach((item, index) => {
      const taxes = this.calculateTaxes(item.valorTotal);
      cupom += `${String(index + 1).padStart(3, '0')} | ${item.descricao.substring(0, 20).padEnd(20)} | ${item.quantidade.toString().padStart(3)} | ${this.formatCurrency(item.valorUnitario)} | ${this.formatCurrency(item.valorTotal)}\n`;
      cupom += `     ICMS: ${taxes.valorICMS.toFixed(2)}% | PIS: ${taxes.valorPIS.toFixed(2)}% | COFINS: ${taxes.valorCOFINS.toFixed(2)}%\n`;
    });

    const totalTaxes = this.calculateTaxes(data.valorTotal);

    cupom += `
═══════════════════════════════════════
TOTAIS:
═══════════════════════════════════════
Subtotal Produtos: ${this.formatCurrency(data.totalProdutos)}
ICMS: ${this.formatCurrency(totalTaxes.valorICMS)}
PIS: ${this.formatCurrency(totalTaxes.valorPIS)}
COFINS: ${this.formatCurrency(totalTaxes.valorCOFINS)}
───────────────────────────────────────
TOTAL: ${this.formatCurrency(data.valorTotal)}
───────────────────────────────────────

Forma de Pagamento: ${data.formaPagamento}

═══════════════════════════════════════
    DOCUMENTO AUXILIAR DE NOTA FISCAL
═══════════════════════════════════════
`;

    return cupom;
  }

  /**
   * Gera cupom fiscal com CNPJ
   */
  generateFiscalReceiptCNPJ(data: FiscalReceiptData): string {
    const numeroCupom = `CF${Date.now().toString().slice(-8)}`;
    const dataEmissao = data.dataEmissao.toLocaleDateString('pt-BR');
    const horaEmissao = data.dataEmissao.toLocaleTimeString('pt-BR');

    let cupom = `
═══════════════════════════════════════
        CUPOM FISCAL ELETRÔNICO
═══════════════════════════════════════

Número: ${numeroCupom}
Data: ${dataEmissao} ${horaEmissao}

CLIENTE (CNPJ):
Razão Social: ${data.nome}
CNPJ: ${this.formatCNPJ(data.cnpj || '')}
${data.endereco ? `Endereço: ${data.endereco}` : ''}
${data.cidade && data.uf ? `${data.cidade}/${data.uf}` : ''}
${data.cep ? `CEP: ${this.formatCEP(data.cep)}` : ''}

═══════════════════════════════════════
ITEM | DESCRIÇÃO | QTD | VLR UNIT | TOTAL
═══════════════════════════════════════
`;

    data.items.forEach((item, index) => {
      const taxes = this.calculateTaxes(item.valorTotal);
      cupom += `${String(index + 1).padStart(3, '0')} | ${item.descricao.substring(0, 20).padEnd(20)} | ${item.quantidade.toString().padStart(3)} | ${this.formatCurrency(item.valorUnitario)} | ${this.formatCurrency(item.valorTotal)}\n`;
      cupom += `     ICMS: ${taxes.valorICMS.toFixed(2)}% | PIS: ${taxes.valorPIS.toFixed(2)}% | COFINS: ${taxes.valorCOFINS.toFixed(2)}%\n`;
    });

    const totalTaxes = this.calculateTaxes(data.valorTotal);

    cupom += `
═══════════════════════════════════════
TOTAIS:
═══════════════════════════════════════
Subtotal Produtos: ${this.formatCurrency(data.totalProdutos)}
ICMS: ${this.formatCurrency(totalTaxes.valorICMS)}
PIS: ${this.formatCurrency(totalTaxes.valorPIS)}
COFINS: ${this.formatCurrency(totalTaxes.valorCOFINS)}
───────────────────────────────────────
TOTAL: ${this.formatCurrency(data.valorTotal)}
───────────────────────────────────────

Forma de Pagamento: ${data.formaPagamento}

═══════════════════════════════════════
    DOCUMENTO AUXILIAR DE NOTA FISCAL
═══════════════════════════════════════
`;

    return cupom;
  }

  /**
   * Gera NFE (Nota Fiscal Eletrônica)
   */
  generateNFE(data: FiscalReceiptData): any {
    const numeroNFE = `NFE${Date.now().toString().slice(-10)}`;
    const chaveAcesso = this.generateChaveAcesso();

    const nfe = {
      numero: numeroNFE,
      chaveAcesso,
      serie: '1',
      dataEmissao: data.dataEmissao.toISOString(),
      naturezaOperacao: 'VENDA',
      cliente: {
        tipo: data.cnpj ? 'J' : 'F',
        cpf: data.cpf,
        cnpj: data.cnpj,
        nome: data.nome,
        endereco: data.endereco,
        cidade: data.cidade,
        uf: data.uf,
        cep: data.cep,
        telefone: data.telefone,
        email: data.email,
      },
      itens: data.items.map((item, index) => {
        const taxes = this.calculateTaxes(item.valorTotal);
        return {
          numero: index + 1,
          codigo: item.codigo,
          descricao: item.descricao,
          ncm: item.ncm || '00000000',
          cfop: item.cfop || '5102',
          quantidade: item.quantidade,
          unidade: 'UN',
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
          icms: {
            origem: '0',
            cst: '00',
            aliquota: this.defaultICMS,
            baseCalculo: taxes.baseICMS,
            valor: taxes.valorICMS,
          },
          pis: {
            cst: '01',
            aliquota: this.defaultPIS,
            baseCalculo: taxes.basePIS,
            valor: taxes.valorPIS,
          },
          cofins: {
            cst: '01',
            aliquota: this.defaultCOFINS,
            baseCalculo: taxes.baseCOFINS,
            valor: taxes.valorCOFINS,
          },
        };
      }),
      totais: {
        baseICMS: this.calculateTaxes(data.valorTotal).baseICMS,
        valorICMS: this.calculateTaxes(data.valorTotal).valorICMS,
        basePIS: this.calculateTaxes(data.valorTotal).basePIS,
        valorPIS: this.calculateTaxes(data.valorTotal).valorPIS,
        baseCOFINS: this.calculateTaxes(data.valorTotal).baseCOFINS,
        valorCOFINS: this.calculateTaxes(data.valorTotal).valorCOFINS,
        valorTotal: data.valorTotal,
        valorLiquido: this.calculateTaxes(data.valorTotal).valorLiquido,
      },
      pagamento: {
        forma: data.formaPagamento,
        valor: data.valorTotal,
      },
    };

    return nfe;
  }

  /**
   * Gera chave de acesso NFE (44 dígitos)
   */
  private generateChaveAcesso(): string {
    const uf = '35'; // SP (pode ser configurado)
    const anoMes = new Date().toISOString().slice(2, 7).replace('-', '');
    const cnpj = '00000000000000'; // CNPJ da empresa (deve ser configurado)
    const modelo = '55'; // NFE
    const serie = '001';
    const numero = Date.now().toString().slice(-9);
    const tipoEmissao = '1';
    const codigoNumerico = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const dv = Math.floor(Math.random() * 10).toString();

    return `${uf}${anoMes}${cnpj}${modelo}${serie}${numero}${tipoEmissao}${codigoNumerico}${dv}`;
  }

  /**
   * Formata CPF
   */
  formatCPF(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formata CNPJ
   */
  formatCNPJ(cnpj: string): string {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return cnpj;
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  /**
   * Formata CEP
   */
  formatCEP(cep: string): string {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return cep;
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  /**
   * Formata moeda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}

export default new FiscalService();

