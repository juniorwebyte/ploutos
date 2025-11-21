import { useState, useEffect, useCallback } from 'react';

const DARK_MODE_KEY = 'cashflow_dark_mode';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(DARK_MODE_KEY);
        if (saved !== null) {
          return saved === 'true';
        }
        // Verificar preferência do sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return true;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar modo escuro:', error);
    }
    return false;
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(DARK_MODE_KEY, String(isDark));
        const root = document.documentElement;
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar modo escuro:', error);
    }
  }, [isDark]);

  const toggleDarkMode = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  return {
    isDark,
    toggleDarkMode,
    theme: isDark ? 'dark' : 'light'
  };
};

