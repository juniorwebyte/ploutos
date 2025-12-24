/**
 * Utilitários de debug para ajudar a identificar problemas em produção
 */

export const debugLog = (message: string, data?: any) => {
  if (import.meta.env.DEV || import.meta.env.VITE_LOG_LEVEL === 'debug') {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

export const logEnvInfo = () => {
  const envInfo = {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    VITE_API_URL: import.meta.env.VITE_API_URL || 'NÃO CONFIGURADO',
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'NÃO CONFIGURADO',
    VITE_APP_DOMAIN: import.meta.env.VITE_APP_DOMAIN || 'NÃO CONFIGURADO',
    VITE_APP_PROTOCOL: import.meta.env.VITE_APP_PROTOCOL || 'NÃO CONFIGURADO',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
  };
  
  console.log('🔍 Informações de Ambiente:', envInfo);
  
  // Avisar se variáveis críticas não estão configuradas
  if (!import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_BASE_URL) {
    console.warn('⚠️ ATENÇÃO: VITE_API_URL e VITE_API_BASE_URL não estão configuradas!');
  }
  
  return envInfo;
};

// Auto-log no início (apenas em produção para debug)
if (import.meta.env.PROD && typeof window !== 'undefined') {
  // Aguardar um pouco para garantir que o console está pronto
  setTimeout(() => {
    logEnvInfo();
  }, 1000);
}

