// Constantes do sistema de fluxo de caixa

export const SYSTEM_CONSTANTS = {
  // Valores padrão
  DEFAULT_FUNDO_CAIXA: 400,
  DEFAULT_PUXADOR_PORCENTAGEM: 4,
  
  // Chaves de localStorage
  STORAGE_KEYS: {
    CASH_FLOW_DATA: 'cashFlowData',
    USER_PREFERENCES: 'userPreferences',
    SYSTEM_SETTINGS: 'systemSettings'
  },
  
  // Limites do sistema
  LIMITS: {
    MAX_CLIENTES_PIX: 50,
    MAX_CLIENTES_PUXADOR: 50,
    MAX_DEVOLUCOES: 100,
    MAX_ENVIOS_CORREIOS: 100,
    MAX_ENVIOS_TRANSPORTADORA: 100,
    MAX_VALES_FUNCIONARIOS: 50
  },
  
  // Configurações de validação
  VALIDATION: {
    MIN_CPF_LENGTH: 11,
    MAX_CPF_LENGTH: 14,
    MIN_VALOR: 0,
    MAX_VALOR: 999999.99
  },
  
  // Configurações de impressão
  PRINT: {
    REDUCED_FONT_SIZE: '10px',
    FULL_FONT_SIZE: '11px',
    MAX_WIDTH: 'max-w-xs',
    MARGIN: 'mx-auto'
  }
} as const;

export const BUSINESS_INFO = {
  NOME: 'MASTER BOYS - GENIALI - SILVA TELES, 22 - PARI',
  ENDERECO: 'BRÁS - SP',
  TECNOLOGIA: 'Webyte | Tecnologia Laravel',
  MARCA: 'Webyte®'
} as const;

export const VALIDATION_MESSAGES = {
  SUCCESS: {
    VALUES_MATCH: 'Valores conferem',
    PIX_CONTA_MATCH: 'Valores PIX Conta conferem',
    SYSTEM_READY: 'Sistema válido para salvamento'
  },
  ERROR: {
    VALUES_NOT_MATCH: 'Valores não conferem',
    PIX_CONTA_NOT_MATCH: 'Valores PIX Conta não conferem',
    SYSTEM_NOT_READY: 'Sistema não pode ser salvo',
    REQUIRED_FIELDS: 'Campos obrigatórios não preenchidos'
  },
  WARNING: {
    SAVE_DISABLED: 'Não é possível salvar',
    VALIDATION_REQUIRED: 'Validação necessária'
  }
} as const;

export const UI_THEMES = {
  COLORS: {
    PRIMARY: {
      LIGHT: 'from-blue-500 to-blue-600',
      DARK: 'from-blue-600 to-blue-700',
      HOVER: 'from-blue-600 to-blue-700'
    },
    SUCCESS: {
      LIGHT: 'from-green-500 to-green-600',
      DARK: 'from-green-600 to-green-700',
      HOVER: 'from-green-600 to-green-700'
    },
    DANGER: {
      LIGHT: 'from-red-500 to-red-600',
      DARK: 'from-red-600 to-red-700',
      HOVER: 'from-red-600 to-red-700'
    },
    WARNING: {
      LIGHT: 'from-yellow-500 to-yellow-600',
      DARK: 'from-yellow-600 to-yellow-700',
      HOVER: 'from-yellow-600 to-yellow-700'
    }
  },
  SHADOWS: {
    SMALL: 'shadow-md',
    MEDIUM: 'shadow-lg',
    LARGE: 'shadow-xl',
    NONE: 'shadow-none'
  },
  TRANSITIONS: {
    FAST: 'transition-all duration-200',
    NORMAL: 'transition-all duration-300',
    SLOW: 'transition-all duration-500'
  }
} as const;
