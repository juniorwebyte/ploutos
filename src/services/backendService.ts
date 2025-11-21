// Serviço robusto para comunicação com backend com tratamento de erros aprimorado
interface RequestOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

interface ApiResponse<T = any> {
  data: T;
  error?: string;
  status: number;
}

class BackendService {
  private lastCheckTs = 0;
  private cachedOnline: boolean | null = null;
  private readonly ttlMs = 15_000; // 15s
  private readonly baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
  private readonly defaultTimeout = 10000; // 10 segundos
  private readonly defaultRetries = 3;
  private readonly defaultRetryDelay = 1000; // 1 segundo

  /**
   * Verifica se o backend está online
   */
  async isOnline(force = false): Promise<boolean> {
    const now = Date.now();
    if (!force && this.cachedOnline !== null && now - this.lastCheckTs < this.ttlMs) {
      return this.cachedOnline;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3s para health check
      
      const res = await fetch(`${this.baseUrl}/health`, { 
        cache: 'no-store',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      this.cachedOnline = res.ok;
    } catch (error) {
      this.cachedOnline = false;
      // Backend não disponível - usar modo local
    }
    
    this.lastCheckTs = now;
    return this.cachedOnline;
  }

  /**
   * Faz uma requisição HTTP com tratamento de erros robusto
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
        });
        
        clearTimeout(timeoutId);
        
        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as unknown as T;
        }
        
        if (!response.ok) {
          const errorMessage = typeof data === 'object' && data !== null && 'error' in data
            ? (data as any).error
            : `HTTP ${response.status}: ${response.statusText}`;
          
          throw new Error(errorMessage || 'Erro na requisição');
        }
        
        return {
          data,
          status: response.status,
        };
      } catch (error: any) {
        lastError = error;
        
        // Erro de rede (Failed to fetch)
        if (error.message?.includes('Failed to fetch') || error.name === 'TypeError' || error.message?.includes('NetworkError')) {
          const errorMsg = `❌ SERVIDOR NÃO ESTÁ RODANDO!\n\nO servidor precisa estar rodando para que o sistema funcione.\n\n🔧 SOLUÇÃO:\n1. Abra um terminal na pasta do projeto\n2. Execute: npm run server:dev\n3. Ou execute: start-server.bat (Windows)\n\n📌 O servidor deve estar rodando em: ${this.baseUrl}\n\n⚠️ Sem o servidor rodando, você NÃO conseguirá:\n- Aprovar cadastros\n- Excluir cadastros\n- Clientes criarem contas\n- Usar qualquer funcionalidade do sistema`;
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            continue;
          }
          throw new Error(errorMsg);
        }
        
        // Não tentar novamente para erros 4xx (erros do cliente)
        if (error.name === 'AbortError' || error.message?.includes('4')) {
          throw new Error(`Timeout ou erro de requisição: ${error.message}`);
        }
        
        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
      }
    }
    
    // Todas as tentativas falharam
    throw new Error(
      lastError?.message || 'Falha ao conectar com o servidor. Verifique sua conexão.'
    );
  }

  /**
   * Métodos de conveniência para diferentes tipos de requisições
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Obtém a URL base do backend
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Limpa o cache de status online
   */
  clearCache(): void {
    this.cachedOnline = null;
    this.lastCheckTs = 0;
  }
}

const backendService = new BackendService();
export default backendService;

