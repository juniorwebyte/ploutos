export interface PDVSale {
  id: string;
  date: string;
  time: string;
  total: number;
  paymentMethod: 'dinheiro' | 'cartao' | 'cartaoLink' | 'pix' | 'pixMaquininha' | 'pixConta' | 'boleto' | 'boletos' | 'cheque';
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  customer?: {
    name: string;
    document?: string;
  };
}

export interface PDVIntegrationConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // em minutos
  lastSync?: Date;
  pdvEndpoint?: string;
  apiKey?: string;
}

class PDVIntegrationService {
  private readonly CONFIG_KEY = 'pdv_integration_config';
  private readonly SALES_KEY = 'pdv_sales_cache';
  private syncIntervalId: NodeJS.Timeout | null = null;

  // Obter configuração
  getConfig(): PDVIntegrationConfig {
    try {
      const stored = localStorage.getItem(this.CONFIG_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        return {
          ...config,
          lastSync: config.lastSync ? new Date(config.lastSync) : undefined
        };
      }
    } catch (error) {
      // Erro silencioso - retorna configuração padrão
    }
    
    return {
      enabled: false,
      autoSync: false,
      syncInterval: 5 // 5 minutos padrão
    };
  }

  // Salvar configuração
  saveConfig(config: PDVIntegrationConfig): void {
    try {
      // Converter Date para string antes de salvar
      const configToSave = {
        ...config,
        lastSync: config.lastSync ? config.lastSync.toISOString() : undefined
      };
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(configToSave));
    } catch (error) {
      throw error;
    }
  }

  // Importar vendas do PDV (em produção, isso seria uma chamada API real)
  async importSales(startDate?: Date, endDate?: Date): Promise<PDVSale[]> {
    try {
      const config = this.getConfig();
      let sales: PDVSale[] = [];
      
      // Se tiver endpoint configurado e habilitado, tentar buscar da API
      if (config.pdvEndpoint && config.pdvEndpoint.trim() !== '' && config.enabled) {
        try {
          // Em produção, fazer fetch real aqui
          // const response = await fetch(config.pdvEndpoint, {
          //   method: 'GET',
          //   headers: {
          //     'Authorization': `Bearer ${config.apiKey || ''}`,
          //     'Content-Type': 'application/json'
          //   }
          // });
          // if (response.ok) {
          //   const apiSales = await response.json();
          //   // Salvar no cache
          //   this.addMockSales(apiSales);
          //   sales = apiSales;
          // }
        } catch (apiError) {
          // Se falhar, usar cache local
        }
      }
      
      // Buscar do cache local (sempre como fallback)
      const cached = localStorage.getItem(this.SALES_KEY);
      if (cached) {
        const cachedSales = JSON.parse(cached) as PDVSale[];
        
        // Filtrar por data se especificado
        if (startDate && endDate) {
          sales = cachedSales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
          });
        } else {
          // Retornar apenas vendas de hoje por padrão
          const today = new Date().toISOString().split('T')[0];
          const todaySales = cachedSales.filter(sale => sale.date === today);
          
          // Se não houver vendas de hoje, retornar todas
          sales = todaySales.length > 0 ? todaySales : cachedSales;
        }
      }
      
      return sales;
    } catch (error) {
      return [];
    }
  }

  // Sincronizar vendas automaticamente
  async syncSales(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const config = this.getConfig();
      if (!config.enabled) {
        return { success: false, count: 0, error: 'Integração não habilitada. Marque a opção "Habilitar integração" e salve a configuração.' };
      }

      let sales: PDVSale[] = [];

      // Se tiver endpoint configurado, tentar buscar da API
      if (config.pdvEndpoint && config.pdvEndpoint.trim() !== '') {
        try {
          // Em produção, fazer chamada real à API do PDV
          // const response = await fetch(config.pdvEndpoint, {
          //   method: 'GET',
          //   headers: {
          //     'Authorization': `Bearer ${config.apiKey || ''}`,
          //     'Content-Type': 'application/json'
          //   }
          // });
          // if (!response.ok) throw new Error(`Erro na API: ${response.status}`);
          // const apiSales = await response.json();
          // 
          // // Validar formato das vendas
          // if (Array.isArray(apiSales)) {
          //   sales = apiSales;
          //   // Salvar no cache para uso offline
          //   this.addMockSales(sales);
          // }
          
          // Por enquanto, usar dados locais mesmo com endpoint configurado
          sales = await this.importSales();
        } catch (apiError: any) {
          // Se falhar, usar dados locais como fallback
          sales = await this.importSales();
        }
      } else {
        // Modo demo/teste - usar dados locais
        sales = await this.importSales();
      }
      
      // Se não houver vendas, criar algumas de exemplo para demonstração (apenas em modo demo)
      if (sales.length === 0 && (!config.pdvEndpoint || config.pdvEndpoint.trim() === '')) {
        const today = new Date();
        const mockSales: PDVSale[] = [
          {
            id: `sale-${Date.now()}-1`,
            date: today.toISOString().split('T')[0],
            time: today.toTimeString().split(' ')[0],
            total: 150.00,
            paymentMethod: 'dinheiro',
            items: [{ productId: '1', productName: 'Produto Exemplo', quantity: 1, unitPrice: 150.00, total: 150.00 }]
          },
          {
            id: `sale-${Date.now()}-2`,
            date: today.toISOString().split('T')[0],
            time: today.toTimeString().split(' ')[0],
            total: 250.00,
            paymentMethod: 'pixMaquininha',
            items: [{ productId: '2', productName: 'Produto Exemplo 2', quantity: 1, unitPrice: 250.00, total: 250.00 }]
          }
        ];
        
        // Salvar vendas de exemplo
        this.addMockSales(mockSales);
        sales = mockSales;
      }
      
      // Atualizar última sincronização apenas se houver vendas
      if (sales.length > 0) {
        config.lastSync = new Date();
        this.saveConfig(config);
      }

      return { success: true, count: sales.length };
    } catch (error: any) {
      return { success: false, count: 0, error: error.message || 'Erro desconhecido' };
    }
  }

  // Iniciar sincronização automática
  startAutoSync(callback: (result: { success: boolean; count: number }) => void): void {
    const config = this.getConfig();
    
    if (!config.enabled || !config.autoSync) {
      return;
    }

    // Limpar intervalo anterior se existir
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
    }

    // Sincronizar imediatamente
    this.syncSales().then(callback);

    // Configurar sincronização periódica
    const intervalMs = config.syncInterval * 60 * 1000;
    this.syncIntervalId = setInterval(() => {
      this.syncSales().then(callback);
    }, intervalMs);
  }

  // Parar sincronização automática
  stopAutoSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  // Converter vendas do PDV para formato de entradas do CashFlow (com cálculos precisos)
  convertSalesToEntries(sales: PDVSale[]): {
    dinheiro: number;
    cartao: number;
    cartaoLink: number;
    pixMaquininha: number;
    pixConta: number;
    boletos: number;
    cheque: number;
  } {
    // Importar função de precisão
    const preciseCurrency = {
      toCents: (value: number): number => Math.round(value * 100),
      fromCents: (cents: number): number => cents / 100,
      add: (...values: number[]): number => {
        const totalCents = values.reduce((sum, val) => sum + Math.round((val || 0) * 100), 0);
        return totalCents / 100;
      }
    };

    const entries = {
      dinheiro: 0,
      cartao: 0,
      cartaoLink: 0,
      pixMaquininha: 0,
      pixConta: 0,
      boletos: 0,
      cheque: 0
    };

    sales.forEach(sale => {
      const value = sale.total;
      const method = sale.paymentMethod?.toLowerCase() || '';
      
      // Mapear métodos de pagamento do PDV para campos do CashFlow com precisão
      switch (method) {
        case 'dinheiro':
        case 'cash':
        case 'money':
          entries.dinheiro = preciseCurrency.add(entries.dinheiro, value);
          break;
        
        case 'cartao':
        case 'cartão':
        case 'card':
        case 'credito':
        case 'crédito':
        case 'debito':
        case 'débito':
          entries.cartao = preciseCurrency.add(entries.cartao, value);
          break;
        
        case 'cartaolink':
        case 'cartao_link':
        case 'cartão_link':
        case 'cardlink':
          entries.cartaoLink = preciseCurrency.add(entries.cartaoLink, value);
          break;
        
        case 'pix':
        case 'pixmaquininha':
        case 'pix_maquininha':
          // PIX via maquininha (padrão quando não especificado)
          entries.pixMaquininha = preciseCurrency.add(entries.pixMaquininha, value);
          break;
        
        case 'pixconta':
        case 'pix_conta':
          // PIX direto na conta
          entries.pixConta = preciseCurrency.add(entries.pixConta, value);
          break;
        
        case 'boleto':
        case 'boletos':
        case 'bank_slip':
          entries.boletos = preciseCurrency.add(entries.boletos, value);
          break;
        
        case 'cheque':
        case 'check':
          entries.cheque = preciseCurrency.add(entries.cheque, value);
          break;
        
        default:
          // Se não reconhecer, tentar inferir pelo nome
          if (method.includes('pix')) {
            if (method.includes('conta') || method.includes('account')) {
              entries.pixConta = preciseCurrency.add(entries.pixConta, value);
            } else {
              entries.pixMaquininha = preciseCurrency.add(entries.pixMaquininha, value);
            }
          } else if (method.includes('cartao') || method.includes('card')) {
            if (method.includes('link')) {
              entries.cartaoLink = preciseCurrency.add(entries.cartaoLink, value);
            } else {
              entries.cartao = preciseCurrency.add(entries.cartao, value);
            }
          } else {
            // Fallback: se não reconhecer, adiciona como dinheiro (com aviso)
            entries.dinheiro = preciseCurrency.add(entries.dinheiro, value);
          }
          break;
      }
    });

    return entries;
  }

  // Adicionar vendas ao cache (simuladas ou reais)
  addMockSales(sales: PDVSale[]): void {
    try {
      const existing = localStorage.getItem(this.SALES_KEY);
      const allSales: PDVSale[] = existing ? JSON.parse(existing) : [];
      
      // Evitar duplicatas por ID
      const existingIds = new Set(allSales.map(s => s.id));
      const newSales = sales.filter(s => !existingIds.has(s.id));
      
      if (newSales.length > 0) {
        allSales.push(...newSales);
        // Manter apenas últimos 1000 registros para não sobrecarregar localStorage
        const limitedSales = allSales.slice(-1000);
        localStorage.setItem(this.SALES_KEY, JSON.stringify(limitedSales));
      }
    } catch (error) {
      // Erro silencioso - não crítico
    }
  }
  
  // Limpar cache de vendas
  clearSalesCache(): void {
    try {
      localStorage.removeItem(this.SALES_KEY);
    } catch (error) {
      // Erro silencioso
    }
  }
  
  // Obter estatísticas de vendas
  getSalesStats(): { total: number; today: number; byMethod: Record<string, number> } {
    try {
      const cached = localStorage.getItem(this.SALES_KEY);
      if (!cached) {
        return { total: 0, today: 0, byMethod: {} };
      }
      
      const sales = JSON.parse(cached) as PDVSale[];
      const today = new Date().toISOString().split('T')[0];
      const todaySales = sales.filter(s => s.date === today);
      
      const byMethod: Record<string, number> = {};
      sales.forEach(sale => {
        const method = sale.paymentMethod || 'unknown';
        byMethod[method] = (byMethod[method] || 0) + sale.total;
      });
      
      return {
        total: sales.length,
        today: todaySales.length,
        byMethod
      };
    } catch (error) {
      return { total: 0, today: 0, byMethod: {} };
    }
  }
}

export const pdvIntegrationService = new PDVIntegrationService();

