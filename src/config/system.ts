// Configurações avançadas do sistema de fluxo de caixa

export const SYSTEM_CONFIG = {
  // Configurações de impressão
  PRINT: {
    // Configurações para impressora EPSON
    EPSON: {
      PAGE_SIZE: '80mm auto',
      MARGIN: '0',
      ORIENTATION: 'portrait',
      REDUCED_WIDTH: '72mm',
      REDUCED_PADDING: '2mm',
      FULL_PADDING: '8mm'
    },
    
    // Configurações para impressora padrão
    DEFAULT: {
      PAGE_SIZE: 'A4',
      MARGIN: '10mm',
      ORIENTATION: 'portrait'
    },
    
    // Configurações de fonte
    FONTS: {
      REDUCED: '10px',
      FULL: '11px',
      HEADER: '12px',
      TITLE: '14px'
    },
    
    // Configurações de layout
    LAYOUT: {
      REDUCED_MAX_WIDTH: 'max-w-xs',
      FULL_MAX_WIDTH: 'max-w-md',
      CENTER_MARGIN: 'mx-auto'
    }
  },
  
  // Configurações de validação
  VALIDATION: {
    // Tempo de delay para validação em tempo real
    REAL_TIME_DELAY: 500,
    
    // Configurações de campos obrigatórios
    REQUIRED_FIELDS: {
      ENTRIES: ['dinheiro', 'fundoCaixa'],
      EXITS: []
    },
    
    // Limites de valores
    LIMITS: {
      MIN_VALOR: 0,
      MAX_VALOR: 999999.99,
      MIN_CPF_LENGTH: 11,
      MAX_CPF_LENGTH: 14
    }
  },
  
  // Configurações de localStorage
  STORAGE: {
    KEYS: {
      CASH_FLOW_DATA: 'cashFlowData',
      USER_PREFERENCES: 'userPreferences',
      SYSTEM_SETTINGS: 'systemSettings',
      PRINT_HISTORY: 'printHistory'
    },
    
    // Tempo de expiração dos dados (em dias)
    EXPIRATION_DAYS: 30,
    
    // Configurações de backup automático
    AUTO_BACKUP: {
      ENABLED: true,
      INTERVAL_HOURS: 24,
      MAX_BACKUPS: 7
    }
  },
  
  // Configurações de performance
  PERFORMANCE: {
    // Debounce para inputs
    DEBOUNCE_DELAY: 300,
    
    // Lazy loading para componentes pesados
    LAZY_LOADING: {
      ENABLED: true,
      THRESHOLD: 0.1
    },
    
    // Cache de cálculos
    CACHE: {
      ENABLED: true,
      TTL_MS: 5000
    }
  },
  
  // Configurações de UI/UX
  UI: {
    // Animações
    ANIMATIONS: {
      ENABLED: true,
      DURATION: 300,
      EASING: 'ease-in-out'
    },
    
    // Temas
    THEMES: {
      LIGHT: 'light',
      DARK: 'dark',
      AUTO: 'auto'
    },
    
    // Configurações de responsividade
    RESPONSIVE: {
      BREAKPOINTS: {
        SM: 640,
        MD: 768,
        LG: 1024,
        XL: 1280
      }
    }
  },
  
  // Configurações de notificações
  NOTIFICATIONS: {
    // Duração das notificações (em ms)
    DURATION: 5000,
    
    // Posição das notificações
    POSITION: 'top-right',
    
    // Tipos de notificação
    TYPES: ['success', 'error', 'warning', 'info']
  },
  
  // Configurações de exportação
  EXPORT: {
    // Formatos suportados
    FORMATS: ['pdf', 'csv', 'xlsx'],
    
    // Configurações de PDF
    PDF: {
      ORIENTATION: 'portrait',
      UNIT: 'mm',
      FORMAT: 'a4'
    },
    
    // Configurações de CSV
    CSV: {
      DELIMITER: ',',
      ENCODING: 'utf-8'
    }
  },
  
  // Configurações de segurança
  SECURITY: {
    // Validação de entrada
    INPUT_VALIDATION: {
      ENABLED: true,
      SANITIZE_HTML: true,
      MAX_LENGTH: 1000
    },
    
    // Rate limiting
    RATE_LIMITING: {
      ENABLED: true,
      MAX_REQUESTS: 100,
      WINDOW_MS: 60000
    }
  }
} as const;

// Configurações específicas do negócio
export const BUSINESS_CONFIG = {
  // Informações da empresa
  COMPANY: {
    NAME: 'Webyte Desenvolvimentos',
    ADDRESS: 'Rua Agrimensor Sugaya 1203, Bloco 5 Sala 32',
    CITY: 'São Paulo - SP',
    TECHNOLOGY: 'Webyte | Tecnologia Laravel',
    BRAND: 'PloutosLedger',
    TAGLINE: 'A riqueza começa com controle.'
  },
  
  // Configurações financeiras
  FINANCIAL: {
    // Fundo de caixa padrão
    DEFAULT_FUNDO_CAIXA: 400,
    
    // Comissão padrão do puxador
    DEFAULT_PUXADOR_PORCENTAGEM: 4,
    
    // Moeda padrão
    DEFAULT_CURRENCY: 'BRL',
    
    // Formato de moeda
    CURRENCY_FORMAT: {
      LOCALE: 'pt-BR',
      STYLE: 'currency',
      CURRENCY: 'BRL'
    }
  },
  
  // Configurações de impressão específicas
  PRINT_SPECIFIC: {
    // Cabeçalho do cupom reduzido
    REDUCED_HEADER: {
      TITLE_1: 'PLOUTOSLEDGER',
      TITLE_2: 'PLOUTOS LEDGER'
    },
    
    // Campos obrigatórios no cupom reduzido
    REDUCED_FIELDS: [
      'ENTRADAS',
      'SAIDAS', 
      'TOTAL CAIXA',
      'Comissão Puxador'
    ],
    
    // Rodapé do cupom
    FOOTER: {
      COMPANY_INFO: 'Webyte Desenvolvimentos - Rua Agrimensor Sugaya 1203, Bloco 5 Sala 32',
      ADDRESS: 'São Paulo - SP',
      TECHNOLOGY: 'Webyte | Tecnologia Laravel'
    }
  }
} as const;

// Configurações de desenvolvimento
export const DEV_CONFIG = {
  // Modo de desenvolvimento
  DEBUG: import.meta.env.DEV,
  
  // Logs
  LOGGING: {
    ENABLED: import.meta.env.DEV,
    LEVEL: 'info',
    CONSOLE: true
  },
  
  // Hot reload
  HOT_RELOAD: {
    ENABLED: import.meta.env.DEV,
    INTERVAL: 1000
  }
} as const;
