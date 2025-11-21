/**
 * Sistema de logging otimizado para produção
 * Remove console.logs em produção e mantém apenas erros importantes
 */

const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';

class Logger {
  private shouldLog(level: 'log' | 'warn' | 'error' | 'info'): boolean {
    // Em produção, apenas erros são logados
    if (!isDevelopment) {
      return level === 'error';
    }
    return true;
  }

  log(...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(...args);
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    // Erros sempre são logados
    console.error(...args);
    
    // Em produção, pode enviar para serviço de monitoramento
    if (!isDevelopment && typeof window !== 'undefined') {
      // Aqui você pode adicionar integração com Sentry, LogRocket, etc.
      // Exemplo: Sentry.captureException(new Error(args.join(' ')));
    }
  }

  // Método para debug (apenas em desenvolvimento)
  debug(...args: any[]): void {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }

  // Método para performance (apenas em desenvolvimento)
  performance(label: string, fn: () => void): void {
    if (isDevelopment && typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
      fn();
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      console.log(`[PERF] ${label}: ${measure.duration.toFixed(2)}ms`);
    } else {
      fn();
    }
  }
}

export const logger = new Logger();
export default logger;
