import { useRef, useCallback, useState, useEffect } from 'react';

// Cache simples em memória
class MemoryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 5 * 60 * 1000) { // 5 minutos por padrão
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  size() {
    return this.cache.size;
  }
}

// Instância global do cache
const globalCache = new MemoryCache();

// Hook para usar cache
export const useCache = () => {
  const cacheRef = useRef(globalCache);

  const get = useCallback((key: string) => {
    return cacheRef.current.get(key);
  }, []);

  const set = useCallback((key: string, data: any, ttl?: number) => {
    cacheRef.current.set(key, data, ttl);
  }, []);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const remove = useCallback((key: string) => {
    cacheRef.current.delete(key);
  }, []);

  return {
    get,
    set,
    clear,
    remove,
    size: cacheRef.current.size(),
  };
};

// Hook para requisições com cache
export const useCachedRequest = <T>(
  key: string,
  requestFn: () => Promise<T>,
  options: {
    ttl?: number;
    enabled?: boolean;
    refetchOnMount?: boolean;
  } = {}
) => {
  const { ttl = 5 * 60 * 1000, enabled = true, refetchOnMount = false } = options;
  const cache = useCache();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Verificar cache primeiro
    const cachedData = cache.get(key);
    if (cachedData && !refetchOnMount) {
      setData(cachedData);
      return cachedData;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      cache.set(key, result, ttl);
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, requestFn, ttl, enabled, refetchOnMount, cache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    cache.remove(key);
    return fetchData();
  }, [key, fetchData, cache]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};

// Hook para debounce com cache
export const useDebouncedCache = <T>(
  key: string,
  value: T,
  delay: number = 300,
  ttl: number = 5 * 60 * 1000
) => {
  const cache = useCache();
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Verificar cache primeiro
    const cachedValue = cache.get(key);
    if (cachedValue) {
      setDebouncedValue(cachedValue);
      return;
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      cache.set(key, value, ttl);
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [value, delay, key, ttl, cache]);

  return debouncedValue;
};
