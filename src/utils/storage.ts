/**
 * Utilitário centralizado para gerenciamento de localStorage
 * com tratamento de erros, validação e sincronização
 */

interface StorageOptions {
  defaultValue?: any;
  validator?: (value: any) => boolean;
  serializer?: (value: any) => string;
  deserializer?: (value: string) => any;
}

class StorageManager {
  private listeners: Map<string, Set<(value: any) => void>> = new Map();
  private cache: Map<string, any> = new Map();

  /**
   * Verifica se localStorage está disponível
   */
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtém valor do localStorage com cache e tratamento de erros
   */
  get<T>(key: string, options: StorageOptions = {}): T | null {
    if (!this.isAvailable()) {
      console.warn(`localStorage não disponível para chave: ${key}`);
      return options.defaultValue ?? null;
    }

    // Verificar cache primeiro
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return options.defaultValue ?? null;
      }

      const deserializer = options.deserializer || JSON.parse;
      const value = deserializer(item);

      // Validar se necessário
      if (options.validator && !options.validator(value)) {
        console.warn(`Valor inválido para chave ${key}, usando valor padrão`);
        return options.defaultValue ?? null;
      }

      // Cachear valor
      this.cache.set(key, value);
      return value as T;
    } catch (error) {
      console.error(`Erro ao ler localStorage para chave ${key}:`, error);
      return options.defaultValue ?? null;
    }
  }

  /**
   * Salva valor no localStorage com validação e sincronização
   */
  set<T>(key: string, value: T, options: StorageOptions = {}): boolean {
    if (!this.isAvailable()) {
      console.warn(`localStorage não disponível para chave: ${key}`);
      return false;
    }

    try {
      // Validar se necessário
      if (options.validator && !options.validator(value)) {
        console.error(`Valor inválido para chave ${key}`);
        return false;
      }

      const serializer = options.serializer || JSON.stringify;
      const serialized = serializer(value);
      
      localStorage.setItem(key, serialized);
      
      // Atualizar cache
      this.cache.set(key, value);
      
      // Notificar listeners
      this.notifyListeners(key, value);
      
      return true;
    } catch (error) {
      console.error(`Erro ao salvar localStorage para chave ${key}:`, error);
      
      // Tentar limpar cache se houver erro
      this.cache.delete(key);
      
      return false;
    }
  }

  /**
   * Remove valor do localStorage
   */
  remove(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      this.cache.delete(key);
      this.notifyListeners(key, null);
      return true;
    } catch (error) {
      console.error(`Erro ao remover localStorage para chave ${key}:`, error);
      return false;
    }
  }

  /**
   * Limpa todo o localStorage (cuidado!)
   */
  clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.clear();
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar localStorage:', error);
      return false;
    }
  }

  /**
   * Inscreve-se em mudanças de uma chave específica
   */
  subscribe(key: string, callback: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    
    // Retornar função de unsubscribe
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Notifica todos os listeners de uma chave
   */
  private notifyListeners(key: string, value: any): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Erro ao executar listener para chave ${key}:`, error);
        }
      });
    }
  }

  /**
   * Sincroniza dados entre abas usando storage event
   */
  sync(): void {
    if (!this.isAvailable()) {
      return;
    }

    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key && e.newValue !== null) {
        try {
          const value = JSON.parse(e.newValue);
          this.cache.set(e.key, value);
          this.notifyListeners(e.key, value);
        } catch (error) {
          console.error(`Erro ao sincronizar chave ${e.key}:`, error);
        }
      } else if (e.key) {
        this.cache.delete(e.key);
        this.notifyListeners(e.key, null);
      }
    });
  }

  /**
   * Limpa cache (útil para forçar recarregamento)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Limpa cache de uma chave específica
   */
  clearCacheKey(key: string): void {
    this.cache.delete(key);
  }
}

// Instância singleton
const storageManager = new StorageManager();

// Inicializar sincronização entre abas
if (typeof window !== 'undefined') {
  storageManager.sync();
}

export default storageManager;

