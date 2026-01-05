// Tipos para sistema de ramos de atuação

export type BusinessSegmentCategory = 
  | 'comercio_varejista'
  | 'alimentacao_bebidas'
  | 'prestacao_servicos'
  | 'industria_producao'
  | 'atacado_distribuicao'
  | 'saude_bemestar'
  | 'imobiliario_patrimonial'
  | 'rural_agro'
  | 'outros_especiais';

export interface BusinessSegment {
  id: string;
  nome: string;
  categoria: BusinessSegmentCategory;
  codigo: string; // Código único para identificação
  descricao?: string;
  ativo: boolean;
  personalizado: boolean; // Se foi criado pelo usuário
  dataCriacao: string;
  dataAtualizacao: string;
}

// Configuração específica de um ramo
export interface BusinessSegmentConfig {
  segmentId: string;
  
  // Categorias financeiras padrão
  categoriasFinanceiras: {
    entradas: CategoriaFinanceira[];
    saidas: CategoriaFinanceira[];
  };
  
  // Tipos de pagamento aceitos
  tiposPagamento: TipoPagamento[];
  
  // Regras fiscais e operacionais
  regrasFiscais: RegraFiscal[];
  regrasOperacionais: RegraOperacional[];
  
  // Campos obrigatórios
  camposObrigatorios: CampoObrigatorio[];
  
  // Funcionalidades específicas
  funcionalidades: FuncionalidadeEspecifica[];
  
  // Nomenclaturas personalizadas
  nomenclaturas: Nomenclaturas;
  
  // Relatórios específicos
  relatorios: RelatorioConfig[];
  
  // Configurações de validação
  validacoes: ValidacaoConfig[];
}

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: 'entrada' | 'saida';
  descricao?: string;
  icone?: string;
  cor?: string;
  ativa: boolean;
  obrigatoria: boolean;
  ordem: number;
}

export interface TipoPagamento {
  id: string;
  nome: string;
  codigo: string; // dinheiro, cartao, pix, etc
  ativo: boolean;
  permiteParcelamento: boolean;
  exigeCliente: boolean;
  exigeDocumento: boolean;
  ordem: number;
}

export interface RegraFiscal {
  id: string;
  nome: string;
  tipo: 'icms' | 'ipi' | 'pis' | 'cofins' | 'iss' | 'outro';
  descricao: string;
  valor?: number; // Percentual ou valor fixo
  obrigatoria: boolean;
  aplicavel: boolean;
}

export interface RegraOperacional {
  id: string;
  nome: string;
  tipo: 'horario_funcionamento' | 'estoque_minimo' | 'validade_produto' | 'outro';
  descricao: string;
  valor?: string | number;
  obrigatoria: boolean;
}

export interface CampoObrigatorio {
  id: string;
  campo: string; // Nome do campo no sistema
  tipo: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  label: string;
  validacao?: string; // Regex ou tipo de validação
  mensagemErro?: string;
  opcoes?: string[]; // Para select
}

export interface FuncionalidadeEspecifica {
  id: string;
  nome: string;
  codigo: string;
  ativa: boolean;
  descricao?: string;
  configuracao?: Record<string, any>;
}

export interface Nomenclaturas {
  [key: string]: string; // Mapeamento de termos padrão para termos do ramo
  // Exemplo: { 'venda': 'atendimento', 'cliente': 'paciente', etc }
}

export interface RelatorioConfig {
  id: string;
  nome: string;
  tipo: 'diario' | 'semanal' | 'mensal' | 'anual' | 'personalizado';
  ativo: boolean;
  campos: string[]; // Campos a serem exibidos
  agrupamentos?: string[]; // Campos para agrupamento
  filtros?: FiltroRelatorio[];
}

export interface FiltroRelatorio {
  campo: string;
  tipo: 'text' | 'number' | 'date' | 'select';
  label: string;
  opcoes?: string[];
}

export interface ValidacaoConfig {
  id: string;
  campo: string;
  tipo: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  valor?: string | number;
  mensagem: string;
  ativa: boolean;
}

// Configuração de ramo para uma empresa/loja
export interface CompanyBusinessSegment {
  id: string;
  companyId?: string; // Para multi-empresa
  lojaId?: string; // Para multi-loja
  segmentId: string;
  segment: BusinessSegment;
  config: BusinessSegmentConfig;
  ativo: boolean;
  dataAtivacao: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

// Lista completa de ramos pré-definidos
export const PREDEFINED_SEGMENTS: Omit<BusinessSegment, 'id' | 'dataCriacao' | 'dataAtualizacao'>[] = [
  // Comércio Varejista
  { nome: 'Comércio Varejista Genérico', categoria: 'comercio_varejista', codigo: 'COM_VAREJISTA_GENERICO', descricao: 'Modelo padrão para comércio varejista', ativo: true, personalizado: false },
  { nome: 'Lojas de Roupas e Calçados', categoria: 'comercio_varejista', codigo: 'LOJA_ROUPAS_CALCADOS', descricao: 'Lojas especializadas em vestuário', ativo: true, personalizado: false },
  { nome: 'Lojas de Acessórios', categoria: 'comercio_varejista', codigo: 'LOJA_ACESSORIOS', descricao: 'Lojas de acessórios diversos', ativo: true, personalizado: false },
  { nome: 'Lojas de Cosméticos e Perfumaria', categoria: 'comercio_varejista', codigo: 'LOJA_COSMETICOS', descricao: 'Lojas de produtos de beleza', ativo: true, personalizado: false },
  { nome: 'Lojas de Eletrônicos e Informática', categoria: 'comercio_varejista', codigo: 'LOJA_ELETRONICOS', descricao: 'Lojas de equipamentos eletrônicos', ativo: true, personalizado: false },
  { nome: 'Lojas de Celulares e Assistência Técnica', categoria: 'comercio_varejista', codigo: 'LOJA_CELULARES', descricao: 'Lojas de celulares e reparos', ativo: true, personalizado: false },
  { nome: 'Lojas de Móveis e Decoração', categoria: 'comercio_varejista', codigo: 'LOJA_MOVEIS', descricao: 'Lojas de móveis e artigos de decoração', ativo: true, personalizado: false },
  { nome: 'Lojas de Utilidades Domésticas', categoria: 'comercio_varejista', codigo: 'LOJA_UTILIDADES', descricao: 'Lojas de produtos para casa', ativo: true, personalizado: false },
  { nome: 'Papelarias', categoria: 'comercio_varejista', codigo: 'PAPELARIA', descricao: 'Papelarias e material escolar', ativo: true, personalizado: false },
  { nome: 'Livrarias', categoria: 'comercio_varejista', codigo: 'LIVRARIA', descricao: 'Livrarias e sebos', ativo: true, personalizado: false },
  { nome: 'Lojas de Brinquedos', categoria: 'comercio_varejista', codigo: 'LOJA_BRINQUEDOS', descricao: 'Lojas de brinquedos e jogos', ativo: true, personalizado: false },
  { nome: 'Lojas de Presentes', categoria: 'comercio_varejista', codigo: 'LOJA_PRESENTES', descricao: 'Lojas de presentes e lembranças', ativo: true, personalizado: false },
  { nome: 'Lojas de Artigos Esportivos', categoria: 'comercio_varejista', codigo: 'LOJA_ESPORTIVOS', descricao: 'Lojas de artigos esportivos', ativo: true, personalizado: false },
  { nome: 'Lojas de Conveniência', categoria: 'comercio_varejista', codigo: 'LOJA_CONVENIENCIA', descricao: 'Lojas de conveniência', ativo: true, personalizado: false },
  { nome: 'Tabacarias', categoria: 'comercio_varejista', codigo: 'TABACARIA', descricao: 'Tabacarias e cigarros', ativo: true, personalizado: false },
  { nome: 'Sex Shops', categoria: 'comercio_varejista', codigo: 'SEX_SHOP', descricao: 'Lojas de produtos adultos', ativo: true, personalizado: false },
  { nome: 'Floriculturas', categoria: 'comercio_varejista', codigo: 'FLORICULTURA', descricao: 'Floriculturas e jardinagem', ativo: true, personalizado: false },
  { nome: 'Pet Shops', categoria: 'comercio_varejista', codigo: 'PET_SHOP', descricao: 'Lojas de produtos para animais', ativo: true, personalizado: false },
  { nome: 'Lojas de Autopeças', categoria: 'comercio_varejista', codigo: 'LOJA_AUTOPECAS', descricao: 'Lojas de peças automotivas', ativo: true, personalizado: false },
  { nome: 'Lojas de Material Elétrico', categoria: 'comercio_varejista', codigo: 'LOJA_ELETRICO', descricao: 'Lojas de material elétrico', ativo: true, personalizado: false },
  { nome: 'Lojas de Material Hidráulico', categoria: 'comercio_varejista', codigo: 'LOJA_HIDRAULICO', descricao: 'Lojas de material hidráulico', ativo: true, personalizado: false },
  { nome: 'Lojas de Material de Construção', categoria: 'comercio_varejista', codigo: 'LOJA_CONSTRUCAO', descricao: 'Lojas de material de construção', ativo: true, personalizado: false },
  { nome: 'Home Centers', categoria: 'comercio_varejista', codigo: 'HOME_CENTER', descricao: 'Home centers e grandes lojas', ativo: true, personalizado: false },
  
  // Alimentação e Bebidas
  { nome: 'Supermercados', categoria: 'alimentacao_bebidas', codigo: 'SUPERMERCADO', descricao: 'Supermercados e hipermercados', ativo: true, personalizado: false },
  { nome: 'Minimercados', categoria: 'alimentacao_bebidas', codigo: 'MINIMERCADO', descricao: 'Minimercados e mercearias pequenas', ativo: true, personalizado: false },
  { nome: 'Mercearias', categoria: 'alimentacao_bebidas', codigo: 'MERCERIA', descricao: 'Mercearias tradicionais', ativo: true, personalizado: false },
  { nome: 'Açougues', categoria: 'alimentacao_bebidas', codigo: 'ACOUGUE', descricao: 'Açougues e peixarias', ativo: true, personalizado: false },
  { nome: 'Peixarias', categoria: 'alimentacao_bebidas', codigo: 'PEIXARIA', descricao: 'Peixarias especializadas', ativo: true, personalizado: false },
  { nome: 'Hortifrutis', categoria: 'alimentacao_bebidas', codigo: 'HORTIFRUTI', descricao: 'Hortifrutigranjeiros', ativo: true, personalizado: false },
  { nome: 'Padarias', categoria: 'alimentacao_bebidas', codigo: 'PADARIA', descricao: 'Padarias e confeitarias', ativo: true, personalizado: false },
  { nome: 'Confeitarias', categoria: 'alimentacao_bebidas', codigo: 'CONFEITARIA', descricao: 'Confeitarias e docerias', ativo: true, personalizado: false },
  { nome: 'Lanchonetes', categoria: 'alimentacao_bebidas', codigo: 'LANCHONETE', descricao: 'Lanchonetes e fast food', ativo: true, personalizado: false },
  { nome: 'Pizzarias', categoria: 'alimentacao_bebidas', codigo: 'PIZZARIA', descricao: 'Pizzarias e delivery', ativo: true, personalizado: false },
  { nome: 'Restaurantes', categoria: 'alimentacao_bebidas', codigo: 'RESTAURANTE', descricao: 'Restaurantes em geral', ativo: true, personalizado: false },
  { nome: 'Restaurantes Self-Service', categoria: 'alimentacao_bebidas', codigo: 'RESTAURANTE_SELF', descricao: 'Restaurantes self-service', ativo: true, personalizado: false },
  { nome: 'Restaurantes por Quilo', categoria: 'alimentacao_bebidas', codigo: 'RESTAURANTE_QUILO', descricao: 'Restaurantes por quilo', ativo: true, personalizado: false },
  { nome: 'Restaurantes à La Carte', categoria: 'alimentacao_bebidas', codigo: 'RESTAURANTE_CARTE', descricao: 'Restaurantes à la carte', ativo: true, personalizado: false },
  { nome: 'Churrascarias', categoria: 'alimentacao_bebidas', codigo: 'CHURRASCARIA', descricao: 'Churrascarias e rodízios', ativo: true, personalizado: false },
  { nome: 'Hamburguerias', categoria: 'alimentacao_bebidas', codigo: 'HAMBURGUERIA', descricao: 'Hamburguerias especializadas', ativo: true, personalizado: false },
  { nome: 'Food Trucks', categoria: 'alimentacao_bebidas', codigo: 'FOOD_TRUCK', descricao: 'Food trucks e trailers', ativo: true, personalizado: false },
  { nome: 'Cafeterias', categoria: 'alimentacao_bebidas', codigo: 'CAFETERIA', descricao: 'Cafeterias e coffee shops', ativo: true, personalizado: false },
  { nome: 'Sorveterias', categoria: 'alimentacao_bebidas', codigo: 'SORVETERIA', descricao: 'Sorveterias e açaís', ativo: true, personalizado: false },
  { nome: 'Casas de Suco e Açaí', categoria: 'alimentacao_bebidas', codigo: 'CASA_SUCO', descricao: 'Casas de suco e açaí', ativo: true, personalizado: false },
  { nome: 'Bares', categoria: 'alimentacao_bebidas', codigo: 'BAR', descricao: 'Bares e botecos', ativo: true, personalizado: false },
  { nome: 'Pub e Choperias', categoria: 'alimentacao_bebidas', codigo: 'PUB', descricao: 'Pubs e choperias', ativo: true, personalizado: false },
  { nome: 'Adegas', categoria: 'alimentacao_bebidas', codigo: 'ADEGA', descricao: 'Adegas e vinharias', ativo: true, personalizado: false },
  { nome: 'Distribuidoras de Bebidas', categoria: 'alimentacao_bebidas', codigo: 'DIST_BEBIDAS', descricao: 'Distribuidoras de bebidas', ativo: true, personalizado: false },
  { nome: 'Dark Kitchens', categoria: 'alimentacao_bebidas', codigo: 'DARK_KITCHEN', descricao: 'Cozinhas escuras e delivery', ativo: true, personalizado: false },
  
  // Prestação de Serviços
  { nome: 'Oficinas Mecânicas', categoria: 'prestacao_servicos', codigo: 'OFICINA_MECANICA', descricao: 'Oficinas de reparo automotivo', ativo: true, personalizado: false },
  { nome: 'Oficinas de Motos', categoria: 'prestacao_servicos', codigo: 'OFICINA_MOTO', descricao: 'Oficinas de motocicletas', ativo: true, personalizado: false },
  { nome: 'Auto Centers', categoria: 'prestacao_servicos', codigo: 'AUTO_CENTER', descricao: 'Auto centers completos', ativo: true, personalizado: false },
  { nome: 'Lava-jatos', categoria: 'prestacao_servicos', codigo: 'LAVA_JATO', descricao: 'Lava-jatos e estética automotiva', ativo: true, personalizado: false },
  { nome: 'Borracharias', categoria: 'prestacao_servicos', codigo: 'BORRACHARIA', descricao: 'Borracharias e serviços de pneus', ativo: true, personalizado: false },
  { nome: 'Funilarias e Pinturas', categoria: 'prestacao_servicos', codigo: 'FUNILARIA', descricao: 'Funilarias e pinturas automotivas', ativo: true, personalizado: false },
  { nome: 'Assistência Técnica (Eletrônicos)', categoria: 'prestacao_servicos', codigo: 'ASSIST_ELETRONICOS', descricao: 'Assistência técnica de eletrônicos', ativo: true, personalizado: false },
  { nome: 'Assistência Técnica (Informática)', categoria: 'prestacao_servicos', codigo: 'ASSIST_INFORMATICA', descricao: 'Assistência técnica de informática', ativo: true, personalizado: false },
  { nome: 'Assistência Técnica (Eletrodomésticos)', categoria: 'prestacao_servicos', codigo: 'ASSIST_ELETRO', descricao: 'Assistência técnica de eletrodomésticos', ativo: true, personalizado: false },
  { nome: 'Salões de Beleza', categoria: 'prestacao_servicos', codigo: 'SALAO_BELEZA', descricao: 'Salões de beleza e estética', ativo: true, personalizado: false },
  { nome: 'Barbearias', categoria: 'prestacao_servicos', codigo: 'BARBEARIA', descricao: 'Barbearias e barbeiros', ativo: true, personalizado: false },
  { nome: 'Clínicas de Estética', categoria: 'prestacao_servicos', codigo: 'CLINICA_ESTETICA', descricao: 'Clínicas de estética e beleza', ativo: true, personalizado: false },
  { nome: 'Clínicas Odontológicas', categoria: 'prestacao_servicos', codigo: 'CLINICA_ODONTO', descricao: 'Clínicas odontológicas', ativo: true, personalizado: false },
  { nome: 'Clínicas Médicas', categoria: 'prestacao_servicos', codigo: 'CLINICA_MEDICA', descricao: 'Clínicas médicas e consultórios', ativo: true, personalizado: false },
  { nome: 'Clínicas Veterinárias', categoria: 'prestacao_servicos', codigo: 'CLINICA_VET', descricao: 'Clínicas veterinárias', ativo: true, personalizado: false },
  { nome: 'Laboratórios', categoria: 'prestacao_servicos', codigo: 'LABORATORIO', descricao: 'Laboratórios de análises', ativo: true, personalizado: false },
  { nome: 'Escolas e Cursos Livres', categoria: 'prestacao_servicos', codigo: 'ESCOLA', descricao: 'Escolas e cursos livres', ativo: true, personalizado: false },
  { nome: 'Autoescolas', categoria: 'prestacao_servicos', codigo: 'AUTOESCOLA', descricao: 'Autoescolas e cursos de direção', ativo: true, personalizado: false },
  { nome: 'Academias', categoria: 'prestacao_servicos', codigo: 'ACADEMIA', descricao: 'Academias e ginásios', ativo: true, personalizado: false },
  { nome: 'Estúdios de Pilates e Crossfit', categoria: 'prestacao_servicos', codigo: 'ESTUDIO_PILATES', descricao: 'Estúdios de pilates e crossfit', ativo: true, personalizado: false },
  { nome: 'Lavanderias', categoria: 'prestacao_servicos', codigo: 'LAVANDERIA', descricao: 'Lavanderias e tinturarias', ativo: true, personalizado: false },
  { nome: 'Serviços de Limpeza', categoria: 'prestacao_servicos', codigo: 'SERV_LIMPEZA', descricao: 'Serviços de limpeza e conservação', ativo: true, personalizado: false },
  { nome: 'Serviços de Manutenção Predial', categoria: 'prestacao_servicos', codigo: 'SERV_MANUTENCAO', descricao: 'Serviços de manutenção predial', ativo: true, personalizado: false },
  { nome: 'Serviços de Jardinagem', categoria: 'prestacao_servicos', codigo: 'SERV_JARDINAGEM', descricao: 'Serviços de jardinagem e paisagismo', ativo: true, personalizado: false },
  { nome: 'Serviços de Segurança', categoria: 'prestacao_servicos', codigo: 'SERV_SEGURANCA', descricao: 'Serviços de segurança e vigilância', ativo: true, personalizado: false },
  { nome: 'Serviços de Transporte', categoria: 'prestacao_servicos', codigo: 'SERV_TRANSPORTE', descricao: 'Serviços de transporte e logística', ativo: true, personalizado: false },
  { nome: 'Serviços de Delivery', categoria: 'prestacao_servicos', codigo: 'SERV_DELIVERY', descricao: 'Serviços de delivery e entrega', ativo: true, personalizado: false },
  { nome: 'Serviços Digitais (SaaS, Agências, Marketing, TI)', categoria: 'prestacao_servicos', codigo: 'SERV_DIGITAL', descricao: 'Serviços digitais e tecnologia', ativo: true, personalizado: false },
  
  // Indústria, Produção e Manufatura
  { nome: 'Indústria Alimentícia', categoria: 'industria_producao', codigo: 'INDUSTRIA_ALIMENTICIA', descricao: 'Indústria de alimentos', ativo: true, personalizado: false },
  { nome: 'Panificadoras Industriais', categoria: 'industria_producao', codigo: 'PANIFICADORA_INDUSTRIAL', descricao: 'Panificadoras industriais', ativo: true, personalizado: false },
  { nome: 'Fábricas de Bebidas', categoria: 'industria_producao', codigo: 'FABRICA_BEBIDAS', descricao: 'Fábricas de bebidas', ativo: true, personalizado: false },
  { nome: 'Fábricas de Móveis', categoria: 'industria_producao', codigo: 'FABRICA_MOVEIS', descricao: 'Fábricas de móveis', ativo: true, personalizado: false },
  { nome: 'Confecções', categoria: 'industria_producao', codigo: 'CONFECCAO', descricao: 'Confecções e indústria têxtil', ativo: true, personalizado: false },
  { nome: 'Indústria Têxtil', categoria: 'industria_producao', codigo: 'INDUSTRIA_TEXTIL', descricao: 'Indústria têxtil', ativo: true, personalizado: false },
  { nome: 'Marcenarias', categoria: 'industria_producao', codigo: 'MARCENARIA', descricao: 'Marcenarias e carpintarias', ativo: true, personalizado: false },
  { nome: 'Serralherias', categoria: 'industria_producao', codigo: 'SERRALHERIA', descricao: 'Serralherias e metalurgia', ativo: true, personalizado: false },
  { nome: 'Metalúrgicas', categoria: 'industria_producao', codigo: 'METALURGICA', descricao: 'Metalúrgicas e siderurgia', ativo: true, personalizado: false },
  { nome: 'Gráficas', categoria: 'industria_producao', codigo: 'GRAFICA', descricao: 'Gráficas e impressão', ativo: true, personalizado: false },
  { nome: 'Indústria de Embalagens', categoria: 'industria_producao', codigo: 'INDUSTRIA_EMBALAGENS', descricao: 'Indústria de embalagens', ativo: true, personalizado: false },
  { nome: 'Indústria de Cosméticos', categoria: 'industria_producao', codigo: 'INDUSTRIA_COSMETICOS', descricao: 'Indústria de cosméticos', ativo: true, personalizado: false },
  { nome: 'Indústria de Produtos de Limpeza', categoria: 'industria_producao', codigo: 'INDUSTRIA_LIMPEZA', descricao: 'Indústria de produtos de limpeza', ativo: true, personalizado: false },
  { nome: 'Produção Artesanal', categoria: 'industria_producao', codigo: 'PRODUCAO_ARTESANAL', descricao: 'Produção artesanal', ativo: true, personalizado: false },
  { nome: 'Fábricas de Pré-moldados', categoria: 'industria_producao', codigo: 'FABRICA_PREMOLDADOS', descricao: 'Fábricas de pré-moldados', ativo: true, personalizado: false },
  
  // Atacado e Distribuição
  { nome: 'Atacadistas', categoria: 'atacado_distribuicao', codigo: 'ATACADISTA', descricao: 'Atacadistas em geral', ativo: true, personalizado: false },
  { nome: 'Distribuidores de Alimentos', categoria: 'atacado_distribuicao', codigo: 'DIST_ALIMENTOS', descricao: 'Distribuidores de alimentos', ativo: true, personalizado: false },
  { nome: 'Distribuidores de Bebidas', categoria: 'atacado_distribuicao', codigo: 'DIST_BEBIDAS_ATACADO', descricao: 'Distribuidores de bebidas', ativo: true, personalizado: false },
  { nome: 'Distribuidores de Materiais de Construção', categoria: 'atacado_distribuicao', codigo: 'DIST_CONSTRUCAO', descricao: 'Distribuidores de materiais de construção', ativo: true, personalizado: false },
  { nome: 'Distribuidores Farmacêuticos', categoria: 'atacado_distribuicao', codigo: 'DIST_FARMACEUTICO', descricao: 'Distribuidores farmacêuticos', ativo: true, personalizado: false },
  { nome: 'Distribuidores de Produtos Veterinários', categoria: 'atacado_distribuicao', codigo: 'DIST_VETERINARIO', descricao: 'Distribuidores de produtos veterinários', ativo: true, personalizado: false },
  { nome: 'Centros de Distribuição', categoria: 'atacado_distribuicao', codigo: 'CENTRO_DISTRIBUICAO', descricao: 'Centros de distribuição', ativo: true, personalizado: false },
  { nome: 'Representantes Comerciais', categoria: 'atacado_distribuicao', codigo: 'REPRESENTANTE', descricao: 'Representantes comerciais', ativo: true, personalizado: false },
  
  // Saúde, Bem-estar e Social
  { nome: 'Farmácias', categoria: 'saude_bemestar', codigo: 'FARMACIA', descricao: 'Farmácias e drogarias', ativo: true, personalizado: false },
  { nome: 'Drogarias', categoria: 'saude_bemestar', codigo: 'DROGARIA', descricao: 'Drogarias', ativo: true, personalizado: false },
  { nome: 'Clínicas Populares', categoria: 'saude_bemestar', codigo: 'CLINICA_POPULAR', descricao: 'Clínicas populares', ativo: true, personalizado: false },
  { nome: 'Casas de Repouso', categoria: 'saude_bemestar', codigo: 'CASA_REPOUSO', descricao: 'Casas de repouso e lares', ativo: true, personalizado: false },
  { nome: 'Casas de Acolhimento', categoria: 'saude_bemestar', codigo: 'CASA_ACOLHIMENTO', descricao: 'Casas de acolhimento', ativo: true, personalizado: false },
  { nome: 'Óticas', categoria: 'saude_bemestar', codigo: 'OTICA', descricao: 'Óticas e óculos', ativo: true, personalizado: false },
  { nome: 'Laboratórios de Análises', categoria: 'saude_bemestar', codigo: 'LAB_ANALISES', descricao: 'Laboratórios de análises clínicas', ativo: true, personalizado: false },
  { nome: 'Clínicas de Fisioterapia', categoria: 'saude_bemestar', codigo: 'CLINICA_FISIOTERAPIA', descricao: 'Clínicas de fisioterapia', ativo: true, personalizado: false },
  { nome: 'Psicologia e Terapias', categoria: 'saude_bemestar', codigo: 'PSICOLOGIA', descricao: 'Consultórios de psicologia e terapias', ativo: true, personalizado: false },
  
  // Imobiliário e Patrimonial
  { nome: 'Imobiliárias', categoria: 'imobiliario_patrimonial', codigo: 'IMOBILIARIA', descricao: 'Imobiliárias e corretoras', ativo: true, personalizado: false },
  { nome: 'Administradoras de Imóveis', categoria: 'imobiliario_patrimonial', codigo: 'ADMIN_IMOVEIS', descricao: 'Administradoras de imóveis', ativo: true, personalizado: false },
  { nome: 'Condomínios', categoria: 'imobiliario_patrimonial', codigo: 'CONDOMINIO', descricao: 'Condomínios residenciais e comerciais', ativo: true, personalizado: false },
  { nome: 'Loteadoras', categoria: 'imobiliario_patrimonial', codigo: 'LOTEADORA', descricao: 'Loteadoras e incorporadoras', ativo: true, personalizado: false },
  { nome: 'Construtoras', categoria: 'imobiliario_patrimonial', codigo: 'CONSTRUTORA', descricao: 'Construtoras e obras', ativo: true, personalizado: false },
  { nome: 'Incorporadoras', categoria: 'imobiliario_patrimonial', codigo: 'INCORPORADORA', descricao: 'Incorporadoras imobiliárias', ativo: true, personalizado: false },
  { nome: 'Aluguel de Equipamentos', categoria: 'imobiliario_patrimonial', codigo: 'ALUGUEL_EQUIPAMENTOS', descricao: 'Aluguel de equipamentos', ativo: true, personalizado: false },
  { nome: 'Aluguel de Veículos', categoria: 'imobiliario_patrimonial', codigo: 'ALUGUEL_VEICULOS', descricao: 'Aluguel de veículos', ativo: true, personalizado: false },
  
  // Rural e Agro
  { nome: 'Agropecuárias', categoria: 'rural_agro', codigo: 'AGROPECUARIA', descricao: 'Agropecuárias e fazendas', ativo: true, personalizado: false },
  { nome: 'Lojas de Ração', categoria: 'rural_agro', codigo: 'LOJA_RACAO', descricao: 'Lojas de ração e produtos agro', ativo: true, personalizado: false },
  { nome: 'Cooperativas Agrícolas', categoria: 'rural_agro', codigo: 'COOPERATIVA_AGRICOLA', descricao: 'Cooperativas agrícolas', ativo: true, personalizado: false },
  { nome: 'Produtores Rurais', categoria: 'rural_agro', codigo: 'PRODUTOR_RURAL', descricao: 'Produtores rurais', ativo: true, personalizado: false },
  { nome: 'Distribuidores de Insumos Agrícolas', categoria: 'rural_agro', codigo: 'DIST_INSUMOS', descricao: 'Distribuidores de insumos agrícolas', ativo: true, personalizado: false },
  { nome: 'Frigoríficos', categoria: 'rural_agro', codigo: 'FRIGORIFICO', descricao: 'Frigoríficos e abatedouros', ativo: true, personalizado: false },
  { nome: 'Silos e Armazenagem', categoria: 'rural_agro', codigo: 'SILO', descricao: 'Silos e armazenagem agrícola', ativo: true, personalizado: false },
  
  // Outros / Operações Especiais
  { nome: 'Igrejas e Instituições Religiosas', categoria: 'outros_especiais', codigo: 'IGREJA', descricao: 'Igrejas e instituições religiosas', ativo: true, personalizado: false },
  { nome: 'ONGs', categoria: 'outros_especiais', codigo: 'ONG', descricao: 'Organizações não governamentais', ativo: true, personalizado: false },
  { nome: 'Associações', categoria: 'outros_especiais', codigo: 'ASSOCIACAO', descricao: 'Associações e entidades', ativo: true, personalizado: false },
  { nome: 'Sindicatos', categoria: 'outros_especiais', codigo: 'SINDICATO', descricao: 'Sindicatos e entidades de classe', ativo: true, personalizado: false },
  { nome: 'Clubes', categoria: 'outros_especiais', codigo: 'CLUBE', descricao: 'Clubes e associações recreativas', ativo: true, personalizado: false },
  { nome: 'Eventos e Casas de Festas', categoria: 'outros_especiais', codigo: 'CASA_FESTA', descricao: 'Casas de festas e eventos', ativo: true, personalizado: false },
  { nome: 'Produtoras de Eventos', categoria: 'outros_especiais', codigo: 'PRODUTORA_EVENTOS', descricao: 'Produtoras de eventos', ativo: true, personalizado: false },
  { nome: 'Estúdios Criativos', categoria: 'outros_especiais', codigo: 'ESTUDIO_CRIATIVO', descricao: 'Estúdios criativos e agências', ativo: true, personalizado: false },
  { nome: 'Marketplaces', categoria: 'outros_especiais', codigo: 'MARKETPLACE', descricao: 'Marketplaces e plataformas', ativo: true, personalizado: false },
  { nome: 'E-commerces', categoria: 'outros_especiais', codigo: 'ECOMMERCE', descricao: 'E-commerces e lojas virtuais', ativo: true, personalizado: false },
  { nome: 'Dropshipping', categoria: 'outros_especiais', codigo: 'DROPSHIPPING', descricao: 'Dropshipping e revenda', ativo: true, personalizado: false },
  { nome: 'Vendas por Assinatura', categoria: 'outros_especiais', codigo: 'VENDA_ASSINATURA', descricao: 'Vendas por assinatura e recorrência', ativo: true, personalizado: false },
];

