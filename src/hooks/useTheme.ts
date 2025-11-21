import { useState, useEffect, useCallback } from 'react';

export type ThemeType = 'classic' | 'modern';

const THEME_STORAGE_KEY = 'ploutos_theme';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeType>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'modern' || saved === 'classic') {
          return saved as ThemeType;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar tema:', error);
    }
    return 'classic';
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        document.documentElement.setAttribute('data-theme', theme);
      }
    } catch (error) {
      console.error('Erro ao salvar tema:', error);
    }
  }, [theme]);

  const changeTheme = useCallback((newTheme: ThemeType) => {
    if (newTheme === 'modern' || newTheme === 'classic') {
      setTheme(newTheme);
      // Forçar recarregamento do tema imediatamente
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, newTheme);
          document.documentElement.setAttribute('data-theme', newTheme);
        } catch (error) {
          console.error('Erro ao alterar tema:', error);
        }
      }
    }
  }, []);

  return {
    theme,
    changeTheme,
    isModern: theme === 'modern',
    isClassic: theme === 'classic',
  };
};

