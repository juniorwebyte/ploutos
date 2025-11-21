// Configurações de performance
export const PERFORMANCE_CONFIG = {
  // Configurações de animação
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
    EASING: {
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Configurações de cache
  CACHE: {
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
    LONG_TTL: 30 * 60 * 1000, // 30 minutos
    SHORT_TTL: 1 * 60 * 1000, // 1 minuto
  },

  // Configurações de debounce/throttle
  TIMING: {
    DEBOUNCE: {
      SEARCH: 300,
      INPUT: 500,
      SCROLL: 100,
    },
    THROTTLE: {
      SCROLL: 16, // ~60fps
      RESIZE: 100,
      MOUSE_MOVE: 16,
    },
  },

  // Configurações de lazy loading
  LAZY_LOADING: {
    ROOT_MARGIN: '50px',
    THRESHOLD: 0.1,
    IMAGE_PLACEHOLDER: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcnJlZ2FuZG8uLi48L3RleHQ+PC9zdmc+',
  },

  // Configurações de virtualização
  VIRTUALIZATION: {
    OVERSCAN: 5,
    ITEM_HEIGHT: {
      SMALL: 40,
      MEDIUM: 60,
      LARGE: 80,
    },
  },

  // Configurações de memória
  MEMORY: {
    MAX_CACHE_SIZE: 100, // Máximo de itens no cache
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutos
    WARNING_THRESHOLD: 80, // 80% de uso de memória
  },

  // Configurações de rede
  NETWORK: {
    TIMEOUT: 10000, // 10 segundos
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000, // 1 segundo
  },

  // Configurações de renderização
  RENDER: {
    BATCH_SIZE: 50, // Tamanho do lote para renderização
    MAX_RENDER_TIME: 16, // 16ms para manter 60fps
    SUSPENSE_DELAY: 200, // Delay para suspense
  },
};

// Utilitários de performance
class PerformanceUtilsClass {
  private cache = new Map<string, { value: any; timestamp: number; ttl: number }>();

  // Cache com TTL
  cacheResult<T>(key: string, fn: () => T, ttl: number = PERFORMANCE_CONFIG.CACHE.DEFAULT_TTL): T {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < cached.ttl) {
      return cached.value;
    }
    
    const result = fn();
    this.cache.set(key, {
      value: result,
      timestamp: now,
      ttl
    });
    
    return result;
  }

  // Limpar cache
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  // Debounce
  debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  }

  // Throttle
  throttle<T extends (...args: any[]) => any>(fn: T, delay: number): T {
    let lastCall = 0;
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn(...args);
      }
    }) as T;
  }
  // Medir tempo de execução
  measureTime(fn: () => void): number {
    const start = performance.now();
    fn();
    return performance.now() - start;
  }

  // Verificar se está em modo de desenvolvimento
  isDevelopment(): boolean {
    return import.meta.env.DEV;
  }

  // Verificar se está em modo de produção
  isProduction(): boolean {
    return import.meta.env.PROD;
  }

  // Verificar se o dispositivo é móvel
  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  // Verificar se o dispositivo tem conexão lenta
  isSlowConnection(): boolean {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    }
    return false;
  }

  // Verificar se o usuário prefere movimento reduzido
  prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && 
           window.matchMedia && 
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Verificar se o usuário prefere esquema escuro
  prefersDarkMode(): boolean {
    return typeof window !== 'undefined' && 
           window.matchMedia && 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // Obter informações de performance
  getPerformanceInfo() {
    if (typeof performance === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');

    return {
      loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
      domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
      firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
    };
  }
}

// Exportar instância singleton
export const PerformanceUtils = new PerformanceUtilsClass();