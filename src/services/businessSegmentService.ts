// Serviço para gerenciamento de ramos de atuação
import {
  BusinessSegment,
  BusinessSegmentConfig,
  CompanyBusinessSegment,
  PREDEFINED_SEGMENTS,
  CategoriaFinanceira,
  TipoPagamento,
  RegraFiscal,
  RegraOperacional,
  CampoObrigatorio,
  FuncionalidadeEspecifica,
  Nomenclaturas,
  RelatorioConfig,
  ValidacaoConfig
} from '../types/businessSegment';

const STORAGE_KEY_SEGMENTS = 'businessSegments';
const STORAGE_KEY_COMPANY_SEGMENT = 'companyBusinessSegment';

class BusinessSegmentService {
  // Obter todos os segmentos disponíveis
  getAllSegments(): BusinessSegment[] {
    const saved = localStorage.getItem(STORAGE_KEY_SEGMENTS);
    let segments: BusinessSegment[] = [];
    
    if (saved) {
      try {
        segments = JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao carregar segmentos:', e);
      }
    }
    
    // Adicionar segmentos pré-definidos se não existirem
    const predefinedIds = segments.map(s => s.codigo);
    let hasNewSegments = false;
    
    PREDEFINED_SEGMENTS.forEach(predef => {
      if (!predefinedIds.includes(predef.codigo)) {
        segments.push({
          ...predef,
          id: this.generateId(),
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString()
        });
        hasNewSegments = true;
      }
    });
    
    // Salvar segmentos atualizados se houver novos
    if (hasNewSegments) {
      this.saveSegments(segments);
    }
    
    return segments.sort((a, b) => a.nome.localeCompare(b.nome));
  }
  
  // Obter segmento por ID
  getSegmentById(id: string): BusinessSegment | null {
    const segments = this.getAllSegments();
    return segments.find(s => s.id === id) || null;
  }
  
  // Obter segmento por código
  getSegmentByCode(codigo: string): BusinessSegment | null {
    const segments = this.getAllSegments();
    return segments.find(s => s.codigo === codigo) || null;
  }
  
  // Criar novo segmento personalizado
  createCustomSegment(nome: string, categoria: string, descricao?: string): BusinessSegment {
    const segment: BusinessSegment = {
      id: this.generateId(),
      nome,
      categoria: categoria as any,
      codigo: `CUSTOM_${Date.now()}`,
      descricao,
      ativo: true,
      personalizado: true,
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };
    
    const segments = this.getAllSegments();
    segments.push(segment);
    this.saveSegments(segments);
    
    return segment;
  }
  
  // Atualizar segmento
  updateSegment(segment: BusinessSegment): void {
    const segments = this.getAllSegments();
    const index = segments.findIndex(s => s.id === segment.id);
    if (index >= 0) {
      segments[index] = {
        ...segment,
        dataAtualizacao: new Date().toISOString()
      };
      this.saveSegments(segments);
    }
  }
  
  // Obter configuração padrão para um segmento
  getDefaultConfig(segmentId: string): BusinessSegmentConfig {
    const segment = this.getSegmentById(segmentId);
    if (!segment) {
      return this.getGenericConfig();
    }
    
    // Configurações específicas por categoria ou código
    switch (segment.codigo) {
      case 'COM_VAREJISTA_GENERICO':
        return this.getGenericConfig();
      case 'FARMACIA':
      case 'DROGARIA':
        return this.getFarmaciaConfig(segmentId);
      case 'RESTAURANTE':
      case 'RESTAURANTE_SELF':
      case 'RESTAURANTE_QUILO':
      case 'RESTAURANTE_CARTE':
      case 'CHURRASCARIA':
      case 'HAMBURGUERIA':
      case 'PIZZARIA':
      case 'LANCHONETE':
      case 'PADARIA':
      case 'CAFETERIA':
      case 'DARK_KITCHEN':
      case 'FOOD_TRUCK':
        return this.getRestauranteConfig(segmentId);
      case 'SUPERMERCADO':
      case 'MINIMERCADO':
      case 'MERCERIA':
      case 'ACOUGUE':
      case 'PEIXARIA':
      case 'HORTIFRUTI':
      case 'PADARIA':
      case 'CONFEITARIA':
      case 'SORVETERIA':
      case 'CASA_SUCO':
      case 'DIST_BEBIDAS':
        return this.getSupermercadoConfig(segmentId);
      case 'BAR':
      case 'PUB':
        // Bares podem ter VR/VA quando configurado
        return this.getRestauranteConfig(segmentId);
      case 'CLINICA_MEDICA':
      case 'CLINICA_ODONTO':
      case 'CLINICA_VET':
      case 'CLINICA_ESTETICA':
        return this.getClinicaConfig(segmentId);
      case 'SALAO_BELEZA':
      case 'BARBEARIA':
        return this.getSalaoBelezaConfig(segmentId);
      case 'OFICINA_MECANICA':
      case 'OFICINA_MOTO':
      case 'AUTO_CENTER':
        return this.getOficinaConfig(segmentId);
      default:
        return this.getGenericConfig();
    }
  }
  
  // Configuração genérica (padrão)
  private getGenericConfig(): BusinessSegmentConfig {
    return {
      segmentId: 'generic',
      categoriasFinanceiras: {
        entradas: [
          { id: '1', nome: 'Vendas', tipo: 'entrada', ativa: true, obrigatoria: true, ordem: 1 },
          { id: '2', nome: 'Serviços', tipo: 'entrada', ativa: true, obrigatoria: false, ordem: 2 },
          { id: '3', nome: 'Outras Receitas', tipo: 'entrada', ativa: true, obrigatoria: false, ordem: 3 }
        ],
        saidas: [
          { id: '1', nome: 'Compras', tipo: 'saida', ativa: true, obrigatoria: false, ordem: 1 },
          { id: '2', nome: 'Despesas Operacionais', tipo: 'saida', ativa: true, obrigatoria: false, ordem: 2 },
          { id: '3', nome: 'Impostos', tipo: 'saida', ativa: true, obrigatoria: false, ordem: 3 }
        ]
      },
      tiposPagamento: [
        { id: '1', nome: 'Dinheiro', codigo: 'dinheiro', ativo: true, permiteParcelamento: false, exigeCliente: false, exigeDocumento: false, ordem: 1 },
        { id: '2', nome: 'Cartão de Débito', codigo: 'cartao_debito', ativo: true, permiteParcelamento: false, exigeCliente: false, exigeDocumento: false, ordem: 2 },
        { id: '3', nome: 'Cartão de Crédito', codigo: 'cartao_credito', ativo: true, permiteParcelamento: true, exigeCliente: false, exigeDocumento: false, ordem: 3 },
        { id: '4', nome: 'PIX', codigo: 'pix', ativo: true, permiteParcelamento: false, exigeCliente: false, exigeDocumento: false, ordem: 4 },
        { id: '5', nome: 'Boleto', codigo: 'boleto', ativo: true, permiteParcelamento: true, exigeCliente: true, exigeDocumento: true, ordem: 5 },
        { id: '6', nome: 'Cheque', codigo: 'cheque', ativo: true, permiteParcelamento: false, exigeCliente: true, exigeDocumento: true, ordem: 6 }
      ],
      regrasFiscais: [],
      regrasOperacionais: [],
      camposObrigatorios: [],
      funcionalidades: [],
      nomenclaturas: {},
      relatorios: [
        {
          id: '1',
          nome: 'Relatório Diário',
          tipo: 'diario',
          ativo: true,
          campos: ['data', 'totalEntradas', 'totalSaidas', 'saldo']
        }
      ],
      validacoes: []
    };
  }
  
  // Configuração para farmácias
  private getFarmaciaConfig(segmentId: string): BusinessSegmentConfig {
    const generic = this.getGenericConfig();
    return {
      ...generic,
      segmentId,
      categoriasFinanceiras: {
        entradas: [
          ...generic.categoriasFinanceiras.entradas,
          { id: '4', nome: 'Venda de Medicamentos', tipo: 'entrada', ativa: true, obrigatoria: true, ordem: 1 },
          { id: '5', nome: 'Venda de Produtos de Beleza', tipo: 'entrada', ativa: true, obrigatoria: false, ordem: 2 }
        ],
        saidas: generic.categoriasFinanceiras.saidas
      },
      camposObrigatorios: [
        { id: '1', campo: 'cpf', tipo: 'text', label: 'CPF do Cliente', validacao: 'cpf', mensagemErro: 'CPF inválido' }
      ],
      nomenclaturas: {
        'venda': 'atendimento',
        'cliente': 'paciente'
      },
      regrasFiscais: [
        {
          id: '1',
          nome: 'Nota Fiscal Obrigatória',
          tipo: 'outro',
          descricao: 'Todas as vendas devem ter nota fiscal',
          obrigatoria: true,
          aplicavel: true
        }
      ]
    };
  }
  
  // Configuração para restaurantes e ramos alimentícios
  private getRestauranteConfig(segmentId: string): BusinessSegmentConfig {
    const generic = this.getGenericConfig();
    // Filtrar tipos de pagamento - remover os que não são permitidos para alimentação
    const tiposPagamentoAlimentacao = generic.tiposPagamento.filter(tp => 
      tp.codigo !== 'boleto' && 
      tp.codigo !== 'cheque'
    );
    
    return {
      ...generic,
      segmentId,
      categoriasFinanceiras: {
        entradas: [
          { id: '1', nome: 'Venda de Refeições', tipo: 'entrada', ativa: true, obrigatoria: true, ordem: 1 },
          { id: '2', nome: 'Venda de Bebidas', tipo: 'entrada', ativa: true, obrigatoria: false, ordem: 2 },
          { id: '3', nome: 'Delivery', tipo: 'entrada', ativa: true, obrigatoria: false, ordem: 3 },
          { id: '4', nome: 'Taxa de Serviço', tipo: 'entrada', ativa: true, obrigatoria: false, ordem: 4 }
        ],
        saidas: [
          ...generic.categoriasFinanceiras.saidas,
          { id: '4', nome: 'Compra de Insumos', tipo: 'saida', ativa: true, obrigatoria: false, ordem: 1 }
        ]
      },
      tiposPagamento: [
        ...tiposPagamentoAlimentacao,
        { id: '7', nome: 'Vale Refeição (VR)', codigo: 'vale_refeicao', ativo: true, permiteParcelamento: false, exigeCliente: false, exigeDocumento: false, ordem: 7 },
        { id: '8', nome: 'Vale Alimentação (VA)', codigo: 'vale_alimentacao', ativo: true, permiteParcelamento: false, exigeCliente: false, exigeDocumento: false, ordem: 8 }
      ],
      nomenclaturas: {
        'venda': 'atendimento',
        'cliente': 'cliente'
      },
      funcionalidades: [
        { id: '1', nome: 'Controle de Mesa', codigo: 'controle_mesa', ativa: true },
        { id: '2', nome: 'Delivery', codigo: 'delivery', ativa: true },
        { id: '3', nome: 'VR/VA', codigo: 'vr_va', ativa: true }
      ],
      // Regras específicas para ramo alimentício
      regrasOperacionais: [
        {
          id: '1',
          nome: 'Formas de Pagamento Restritas',
          tipo: 'outro',
          descricao: 'Cartão Link, Boletos, Cheques, Taxas, Transportadora, Correios e Comissão Puxador não são permitidos para ramo alimentício',
          obrigatoria: true
        }
      ]
    };
  }
  
  // Configuração para supermercados (também é ramo alimentício)
  private getSupermercadoConfig(segmentId: string): BusinessSegmentConfig {
    // Supermercados também são ramo alimentício, então usam a mesma configuração
    return this.getRestauranteConfig(segmentId);
  }
  
  // Configuração para clínicas
  private getClinicaConfig(segmentId: string): BusinessSegmentConfig {
    const generic = this.getGenericConfig();
    return {
      ...generic,
      segmentId,
      categoriasFinanceiras: {
        entradas: [
          { id: '1', nome: 'Consultas', tipo: 'entrada', ativa: true, obrigatoria: true, ordem: 1 },
          { id: '2', nome: 'Exames', tipo: 'entrada', ativa: true, obrigatoria: false, ordem: 2 },
          { id: '3', nome: 'Procedimentos', tipo: 'entrada', ativa: true, obrigatoria: false, ordem: 3 }
        ],
        saidas: generic.categoriasFinanceiras.saidas
      },
      camposObrigatorios: [
        { id: '1', campo: 'cpf', tipo: 'text', label: 'CPF do Paciente', validacao: 'cpf', mensagemErro: 'CPF inválido' },
        { id: '2', campo: 'nome', tipo: 'text', label: 'Nome do Paciente', validacao: 'required', mensagemErro: 'Nome obrigatório' }
      ],
      nomenclaturas: {
        'venda': 'atendimento',
        'cliente': 'paciente'
      }
    };
  }
  
  // Configuração para salões de beleza
  private getSalaoBelezaConfig(segmentId: string): BusinessSegmentConfig {
    const generic = this.getGenericConfig();
    return {
      ...generic,
      segmentId,
      categoriasFinanceiras: {
        entradas: [
          { id: '1', nome: 'Serviços de Beleza', tipo: 'entrada', ativa: true, obrigatoria: true, ordem: 1 },
          { id: '2', nome: 'Venda de Produtos', tipo: 'entrada', ativa: true, obrigatoria: false, ordem: 2 }
        ],
        saidas: generic.categoriasFinanceiras.saidas
      },
      nomenclaturas: {
        'venda': 'atendimento',
        'cliente': 'cliente'
      }
    };
  }
  
  // Configuração para oficinas
  private getOficinaConfig(segmentId: string): BusinessSegmentConfig {
    const generic = this.getGenericConfig();
    return {
      ...generic,
      segmentId,
      categoriasFinanceiras: {
        entradas: [
          { id: '1', nome: 'Serviços de Reparo', tipo: 'entrada', ativa: true, obrigatoria: true, ordem: 1 },
          { id: '2', nome: 'Venda de Peças', tipo: 'entrada', ativa: true, obrigatoria: false, ordem: 2 }
        ],
        saidas: [
          ...generic.categoriasFinanceiras.saidas,
          { id: '4', nome: 'Compra de Peças', tipo: 'saida', ativa: true, obrigatoria: false, ordem: 1 }
        ]
      },
      nomenclaturas: {
        'venda': 'serviço',
        'cliente': 'cliente'
      }
    };
  }
  
  // Obter segmento ativo da empresa/loja
  getCompanySegment(companyId?: string, lojaId?: string): CompanyBusinessSegment | null {
    const saved = localStorage.getItem(STORAGE_KEY_COMPANY_SEGMENT);
    if (!saved) return null;
    
    try {
      const data: CompanyBusinessSegment = JSON.parse(saved);
      // Verificar se corresponde à empresa/loja solicitada
      if (companyId && data.companyId !== companyId) return null;
      if (lojaId && data.lojaId !== lojaId) return null;
      return data;
    } catch (e) {
      console.error('Erro ao carregar segmento da empresa:', e);
      return null;
    }
  }
  
  // Definir segmento para empresa/loja
  setCompanySegment(
    segmentId: string,
    companyId?: string,
    lojaId?: string
  ): CompanyBusinessSegment {
    const segment = this.getSegmentById(segmentId);
    if (!segment) {
      throw new Error('Segmento não encontrado');
    }
    
    const config = this.getDefaultConfig(segmentId);
    
    const companySegment: CompanyBusinessSegment = {
      id: this.generateId(),
      companyId,
      lojaId,
      segmentId,
      segment,
      config,
      ativo: true,
      dataAtivacao: new Date().toISOString(),
      dataCriacao: new Date().toISOString(),
      dataAtualizacao: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY_COMPANY_SEGMENT, JSON.stringify(companySegment));
    return companySegment;
  }
  
  // Atualizar configuração do segmento
  updateSegmentConfig(
    segmentId: string,
    config: Partial<BusinessSegmentConfig>,
    companyId?: string,
    lojaId?: string
  ): void {
    const companySegment = this.getCompanySegment(companyId, lojaId);
    if (!companySegment || companySegment.segmentId !== segmentId) {
      throw new Error('Segmento não encontrado para esta empresa/loja');
    }
    
    companySegment.config = {
      ...companySegment.config,
      ...config
    };
    companySegment.dataAtualizacao = new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEY_COMPANY_SEGMENT, JSON.stringify(companySegment));
  }
  
  // Migrar dados ao alterar segmento
  migrateData(
    fromSegmentId: string,
    toSegmentId: string,
    data: any
  ): any {
    // Implementar lógica de migração conforme necessário
    // Por enquanto, retorna os dados sem alteração
    return data;
  }
  
  // Salvar segmentos
  private saveSegments(segments: BusinessSegment[]): void {
    localStorage.setItem(STORAGE_KEY_SEGMENTS, JSON.stringify(segments));
  }
  
  // Gerar ID único
  private generateId(): string {
    return `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const businessSegmentService = new BusinessSegmentService();

