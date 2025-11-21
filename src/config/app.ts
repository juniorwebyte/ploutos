export const APP_CONFIG = {
  // Configurações da aplicação
  name: 'Sistema de Movimento de Caixa',
  version: '1.0.0',
  company: 'Webyte | Tecnologia Laravel',
  
  // Configurações de autenticação
  auth: {
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 horas em milissegundos
    credentials: {
      username: 'Admin',
      password: 'Admin'
    }
  },
  
  // Configurações de impressão
  printing: {
    defaultPageSize: '80mm auto',
    margins: '1mm',
    footerText: 'MASTER BOYS - GENIALI - SILVA TELES, 22 - PARI BRÁS - SP'
  },
  
  // Configurações de armazenamento local
  storage: {
    keys: {
      user: 'caixa_user',
      lastLogin: 'caixa_last_login',
      flowData: 'caixa_flow_data'
    }
  },
  
  // Configurações de validação
  validation: {
    minAmount: 0,
    maxAmount: 999999.99,
    currencyDecimals: 2
  },
  
  // Configurações de notificação
  notifications: {
    defaultDuration: 4000,
    position: 'top-right'
  },
  
  // Configurações de tema
  theme: {
    primaryColor: '#1d4ed8', // blue-700
    successColor: '#16a34a', // green-600
    warningColor: '#ca8a04', // yellow-600
    errorColor: '#dc2626',   // red-600
    infoColor: '#2563eb'     // blue-600
  }
} as const;

export type AppConfig = typeof APP_CONFIG;
