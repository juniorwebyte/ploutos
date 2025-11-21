import { useMemo, useCallback, useEffect, useState } from 'react';

// Hook para otimização de performance
export const usePerformance = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Verificar preferência de movimento reduzido
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    // Delay para animações de entrada
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Função para debounce
  const useDebounce = useCallback((value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }, []);

  // Função para throttle
  const useThrottle = useCallback((callback: Function, delay: number) => {
    const [throttledCallback, setThrottledCallback] = useState(callback);

    useEffect(() => {
      let timeoutId: NodeJS.Timeout;
      let lastExecTime = 0;

      const throttled = (...args: any[]) => {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
          callback(...args);
          lastExecTime = currentTime;
        } else {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            callback(...args);
            lastExecTime = Date.now();
          }, delay - (currentTime - lastExecTime));
        }
      };

      setThrottledCallback(() => throttled);
    }, [callback, delay]);

    return throttledCallback;
  }, []);

  // Função para lazy loading de imagens
  const useLazyImage = useCallback((src: string, placeholder?: string) => {
    const [imageSrc, setImageSrc] = useState(placeholder || '');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }, [src]);

    return { imageSrc, isLoaded };
  }, []);

  // Função para intersection observer (lazy loading de componentes)
  const useIntersectionObserver = useCallback((
    elementRef: React.RefObject<HTMLElement>,
    options: IntersectionObserverInit = {}
  ) => {
    const [isIntersecting, setIsIntersecting] = useState(false);

    useEffect(() => {
      const element = elementRef.current;
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsIntersecting(entry.isIntersecting);
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
          ...options,
        }
      );

      observer.observe(element);

      return () => {
        observer.unobserve(element);
      };
    }, [elementRef, options]);

    return isIntersecting;
  }, []);

  return {
    isVisible,
    prefersReducedMotion,
    useDebounce,
    useThrottle,
    useLazyImage,
    useIntersectionObserver,
  };
};

// Hook para otimização de listas
export const useOptimizedList = <T>(
  items: T[],
  searchTerm: string = '',
  filterFn?: (item: T, searchTerm: string) => boolean
) => {
  const filteredItems = useMemo(() => {
    if (!searchTerm || !filterFn) return items;
    return items.filter(item => filterFn(item, searchTerm));
  }, [items, searchTerm, filterFn]);

  const memoizedItems = useMemo(() => filteredItems, [filteredItems]);

  return memoizedItems;
};

// Hook para otimização de formulários
export const useOptimizedForm = <T extends Record<string, any>>(
  initialValues: T,
  validationFn?: (values: T) => Record<string, string>
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    if (validationFn) {
      const newErrors = validationFn({ ...values, [field]: value });
      setErrors(prev => ({ ...prev, [field]: newErrors[field] || '' }));
    }
  }, [values, validationFn]);

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    resetForm,
    isValid,
  };
};

// Hook para otimização de API calls
export const useOptimizedAPI = <T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    enabled?: boolean;
    retryCount?: number;
    retryDelay?: number;
  } = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { enabled = true, retryCount = 3, retryDelay = 1000 } = options;

  const execute = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    let attempts = 0;
    while (attempts < retryCount) {
      try {
        const result = await apiCall();
        setData(result);
        setLoading(false);
        return result;
      } catch (err) {
        attempts++;
        if (attempts >= retryCount) {
          setError(err as Error);
          setLoading(false);
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }, [apiCall, enabled, retryCount, retryDelay]);

  useEffect(() => {
    execute();
  }, dependencies);

  return { data, loading, error, refetch: execute };
};