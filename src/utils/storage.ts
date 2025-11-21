/**
 * Utilitário seguro para localStorage
 * Trata erros de quota, bloqueio, etc.
 */

class SafeStorage {
  private isAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return false;
      }
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (!this.isAvailable()) {
      return null;
    }
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Erro ao ler localStorage para chave "${key}":`, error);
      return null;
    }
  }

  setItem(key: string, value: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error: any) {
      // Tratar erro de quota excedida
      if (error.name === 'QuotaExceededError' || error.code === 22) {
        console.warn('localStorage quota excedida. Tentando limpar cache antigo...');
        // Tentar limpar itens antigos
        this.clearOldItems();
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (retryError) {
          console.error('Erro ao salvar após limpeza:', retryError);
          return false;
        }
      }
      console.warn(`Erro ao salvar no localStorage para chave "${key}":`, error);
      return false;
    }
  }

  removeItem(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Erro ao remover do localStorage para chave "${key}":`, error);
      return false;
    }
  }

  clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Erro ao limpar localStorage:', error);
      return false;
    }
  }

  private clearOldItems(): void {
    try {
      // Limpar itens de cache antigos (mais de 7 dias)
      const now = Date.now();
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cache_')) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const data = JSON.parse(item);
              if (data.timestamp && (now - data.timestamp) > 7 * 24 * 60 * 60 * 1000) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Se não conseguir parsear, remover
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Erro ao limpar itens antigos:', error);
    }
  }

  // Métodos auxiliares para JSON
  getJSON<T>(key: string, defaultValue: T | null = null): T | null {
    const item = this.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    
    try {
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Erro ao parsear JSON para chave "${key}":`, error);
      return defaultValue;
    }
  }

  setJSON<T>(key: string, value: T): boolean {
    try {
      const json = JSON.stringify(value);
      return this.setItem(key, json);
    } catch (error) {
      console.warn(`Erro ao serializar JSON para chave "${key}":`, error);
      return false;
    }
  }
}

export const safeStorage = new SafeStorage();
export default safeStorage;
