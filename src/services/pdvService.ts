// Serviço para gerenciar dados do Sistema PDV
export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  category: string;
  brand: string;
  manufacturer: string;
  supplier: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  customer_id: string;
  customer_name: string;
  seller_id: string;
  seller_name: string;
  store_id: string;
  store_name: string;
  total: number;
  discount: number;
  tax: number;
  net_total: number;
  payment_method: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  items: SaleItem[];
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount: number;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  cnpj: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Manufacturer {
  id: string;
  name: string;
  cnpj: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf_cnpj: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  customer_type: 'individual' | 'company';
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Seller {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  commission_rate: number;
  store_id: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface FiscalReceipt {
  id: string;
  sale_id: string;
  receipt_number: string;
  series: string;
  issue_date: string;
  total_amount: number;
  tax_amount: number;
  status: 'issued' | 'cancelled';
  created_at: string;
  items?: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  payment_method?: string;
  notes?: string;
}

export interface NFE {
  id: string;
  sale_id: string;
  nfe_number: string;
  access_key: string;
  issue_date: string;
  total_amount: number;
  tax_amount: number;
  status: 'issued' | 'cancelled' | 'pending';
  created_at: string;
}

class PDVService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';

  // Produtos
  async getProducts(): Promise<Product[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/products`);
      if (!response.ok) throw new Error('Falha ao carregar produtos');
      return await response.json();
    } catch (error) {
      // Erro ao carregar produtos - retornar array vazio
      return this.getMockProducts();
    }
  }

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (!response.ok) throw new Error('Falha ao criar produto');
      return await response.json();
    } catch (error) {
      // Erro ao criar produto
      throw error;
    }
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      if (!response.ok) throw new Error('Falha ao atualizar produto');
      return await response.json();
    } catch (error) {
      // Erro ao atualizar produto
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/products/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Falha ao excluir produto');
    } catch (error) {
      // Erro ao excluir produto
      throw error;
    }
  }

  // Vendas
  async getSales(): Promise<Sale[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/sales`);
      if (!response.ok) throw new Error('Falha ao carregar vendas');
      return await response.json();
    } catch (error) {
      // Erro ao carregar vendas - retornar array vazio
      return this.getMockSales();
    }
  }

  async createSale(sale: Omit<Sale, 'id' | 'created_at' | 'updated_at'>): Promise<Sale> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      if (!response.ok) throw new Error('Falha ao criar venda');
      return await response.json();
    } catch (error) {
      // Erro ao criar venda
      throw error;
    }
  }

  async cancelSale(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/sales/${id}/cancel`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Falha ao cancelar venda');
    } catch (error) {
      // Erro ao cancelar venda
      throw error;
    }
  }

  // Lojas
  async getStores(): Promise<Store[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/stores`);
      if (!response.ok) throw new Error('Falha ao carregar lojas');
      return await response.json();
    } catch (error) {
      // Erro ao carregar lojas - retornar array vazio
      return this.getMockStores();
    }
  }

  // Fornecedores
  async getSuppliers(): Promise<Supplier[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/suppliers`);
      if (!response.ok) throw new Error('Falha ao carregar fornecedores');
      return await response.json();
    } catch (error) {
      // Erro ao carregar fornecedores - retornar array vazio
      return this.getMockSuppliers();
    }
  }

  // Fabricantes
  async getManufacturers(): Promise<Manufacturer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/manufacturers`);
      if (!response.ok) throw new Error('Falha ao carregar fabricantes');
      return await response.json();
    } catch (error) {
      // Erro ao carregar fabricantes - retornar array vazio
      return this.getMockManufacturers();
    }
  }

  // Marcas
  async getBrands(): Promise<Brand[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/brands`);
      if (!response.ok) throw new Error('Falha ao carregar marcas');
      return await response.json();
    } catch (error) {
      // Erro ao carregar marcas - retornar array vazio
      return this.getMockBrands();
    }
  }

  // Clientes
  async getCustomers(): Promise<Customer[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/customers`);
      if (!response.ok) throw new Error('Falha ao carregar clientes');
      return await response.json();
    } catch (error) {
      // Erro ao carregar clientes - retornar array vazio
      return this.getMockCustomers();
    }
  }

  // Vendedores
  async getSellers(): Promise<Seller[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/sellers`);
      if (!response.ok) throw new Error('Falha ao carregar vendedores');
      return await response.json();
    } catch (error) {
      // Erro ao carregar vendedores - retornar array vazio
      return this.getMockSellers();
    }
  }

  // Cupons Fiscais
  async getFiscalReceipts(): Promise<FiscalReceipt[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/fiscal-receipts`);
      if (!response.ok) throw new Error('Falha ao carregar cupons fiscais');
      return await response.json();
    } catch (error) {
      // Erro ao carregar cupons fiscais - retornar array vazio
      return this.getMockFiscalReceipts();
    }
  }

  async issueFiscalReceipt(saleId: string): Promise<FiscalReceipt> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/fiscal-receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale_id: saleId })
      });
      if (!response.ok) throw new Error('Falha ao emitir cupom fiscal');
      return await response.json();
    } catch (error) {
      // Erro ao emitir cupom fiscal
      throw error;
    }
  }

  // NFE
  async getNFEs(): Promise<NFE[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/nfes`);
      if (!response.ok) throw new Error('Falha ao carregar NFEs');
      return await response.json();
    } catch (error) {
      // Erro ao carregar NFEs - retornar array vazio
      return this.getMockNFEs();
    }
  }

  async issueNFE(saleId: string): Promise<NFE> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/nfes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale_id: saleId })
      });
      if (!response.ok) throw new Error('Falha ao emitir NFE');
      return await response.json();
    } catch (error) {
      // Erro ao emitir NFE
      throw error;
    }
  }

  // Relatórios
  async getSalesReport(startDate: string, endDate: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/reports/sales?start=${startDate}&end=${endDate}`);
      if (!response.ok) throw new Error('Falha ao carregar relatório de vendas');
      return await response.json();
    } catch (error) {
      // Erro ao carregar relatório de vendas
      return this.getMockSalesReport();
    }
  }

  async getInventoryReport(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pdv/reports/inventory`);
      if (!response.ok) throw new Error('Falha ao carregar relatório de estoque');
      return await response.json();
    } catch (error) {
      // Erro ao carregar relatório de estoque
      return this.getMockInventoryReport();
    }
  }

  // Dados Mock para Demo
  private getMockProducts(): Product[] {
    return [
      {
        id: 'prod_001',
        name: 'Smartphone Samsung Galaxy S23',
        sku: 'SAM-S23-128',
        barcode: '7891234567890',
        price: 2999.90,
        cost: 1800.00,
        stock: 25,
        min_stock: 5,
        category: 'Eletrônicos',
        brand: 'Samsung',
        manufacturer: 'Samsung Electronics',
        supplier: 'Distribuidora Tech Ltda',
        status: 'active',
        created_at: '2025-01-10T10:00:00Z',
        updated_at: '2025-01-15T14:30:00Z'
      },
      {
        id: 'prod_002',
        name: 'Notebook Dell Inspiron 15',
        sku: 'DELL-INS15-512',
        barcode: '7891234567891',
        price: 4599.90,
        cost: 3200.00,
        stock: 12,
        min_stock: 3,
        category: 'Informática',
        brand: 'Dell',
        manufacturer: 'Dell Technologies',
        supplier: 'Tech Solutions Brasil',
        status: 'active',
        created_at: '2025-01-12T15:30:00Z',
        updated_at: '2025-01-14T09:15:00Z'
      },
      {
        id: 'prod_003',
        name: 'Tablet iPad Air 5',
        sku: 'APPLE-IPAD5-256',
        barcode: '7891234567892',
        price: 5999.90,
        cost: 4200.00,
        stock: 8,
        min_stock: 2,
        category: 'Eletrônicos',
        brand: 'Apple',
        manufacturer: 'Apple Inc.',
        supplier: 'Apple Store Brasil',
        status: 'active',
        created_at: '2025-01-08T11:20:00Z',
        updated_at: '2025-01-13T16:45:00Z'
      }
    ];
  }

  private getMockSales(): Sale[] {
    return [
      {
        id: 'sale_001',
        customer_id: 'cust_001',
        customer_name: 'João Silva',
        seller_id: 'seller_001',
        seller_name: 'Maria Santos',
        store_id: 'store_001',
        store_name: 'Loja Centro',
        total: 2999.90,
        discount: 0,
        tax: 0,
        net_total: 2999.90,
        payment_method: 'credit_card',
        status: 'completed',
        items: [
          {
            product_id: 'prod_001',
            product_name: 'Smartphone Samsung Galaxy S23',
            quantity: 1,
            unit_price: 2999.90,
            total_price: 2999.90,
            discount: 0
          }
        ],
        created_at: '2025-01-15T14:30:00Z',
        updated_at: '2025-01-15T14:30:00Z'
      },
      {
        id: 'sale_002',
        customer_id: 'cust_002',
        customer_name: 'Ana Costa',
        seller_id: 'seller_002',
        seller_name: 'Pedro Oliveira',
        store_id: 'store_001',
        store_name: 'Loja Centro',
        total: 4599.90,
        discount: 100.00,
        tax: 0,
        net_total: 4499.90,
        payment_method: 'pix',
        status: 'completed',
        items: [
          {
            product_id: 'prod_002',
            product_name: 'Notebook Dell Inspiron 15',
            quantity: 1,
            unit_price: 4599.90,
            total_price: 4599.90,
            discount: 100.00
          }
        ],
        created_at: '2025-01-14T16:45:00Z',
        updated_at: '2025-01-14T16:45:00Z'
      }
    ];
  }

  private getMockStores(): Store[] {
    return [
      {
        id: 'store_001',
        name: 'Loja Centro',
        address: 'Rua das Flores, 123 - Centro',
        phone: '(11) 99999-9999',
        email: 'centro@loja.com',
        cnpj: '12.345.678/0001-90',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'store_002',
        name: 'Loja Shopping',
        address: 'Av. Paulista, 1000 - Shopping Center',
        phone: '(11) 88888-8888',
        email: 'shopping@loja.com',
        cnpj: '98.765.432/0001-10',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];
  }

  private getMockSuppliers(): Supplier[] {
    return [
      {
        id: 'supp_001',
        name: 'Distribuidora Tech Ltda',
        cnpj: '98.765.432/0001-10',
        contact: 'Carlos Tech',
        phone: '(11) 88888-8888',
        email: 'contato@techdist.com',
        address: 'Av. Paulista, 1000 - São Paulo',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'supp_002',
        name: 'Fornecedor Eletrônicos SA',
        cnpj: '11.222.333/0001-44',
        contact: 'Maria Eletrônicos',
        phone: '(11) 77777-7777',
        email: 'vendas@eletronicos.com',
        address: 'Rua da Tecnologia, 500 - São Paulo',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];
  }

  private getMockManufacturers(): Manufacturer[] {
    return [
      {
        id: 'manuf_001',
        name: 'Samsung Electronics',
        cnpj: '00.000.000/0001-00',
        contact: 'Samsung Brasil',
        phone: '(11) 4000-0000',
        email: 'contato@samsung.com.br',
        address: 'Av. das Nações Unidas, 12551 - São Paulo',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'manuf_002',
        name: 'Dell Technologies',
        cnpj: '00.000.000/0002-00',
        contact: 'Dell Brasil',
        phone: '(11) 4000-0001',
        email: 'contato@dell.com.br',
        address: 'Av. das Nações Unidas, 12552 - São Paulo',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];
  }

  private getMockBrands(): Brand[] {
    return [
      {
        id: 'brand_001',
        name: 'Samsung',
        description: 'Tecnologia móvel e eletrônicos',
        logo_url: 'https://logo.clearbit.com/samsung.com',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'brand_002',
        name: 'Dell',
        description: 'Computadores e tecnologia',
        logo_url: 'https://logo.clearbit.com/dell.com',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'brand_003',
        name: 'Apple',
        description: 'Tecnologia premium',
        logo_url: 'https://logo.clearbit.com/apple.com',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];
  }

  private getMockCustomers(): Customer[] {
    return [
      {
        id: 'cust_001',
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '(11) 99999-9999',
        cpf_cnpj: '123.456.789-00',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567',
        customer_type: 'individual',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'cust_002',
        name: 'Ana Costa',
        email: 'ana@email.com',
        phone: '(11) 88888-8888',
        cpf_cnpj: '987.654.321-00',
        address: 'Av. Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310-100',
        customer_type: 'individual',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];
  }

  private getMockSellers(): Seller[] {
    return [
      {
        id: 'seller_001',
        name: 'Maria Santos',
        email: 'maria@loja.com',
        phone: '(11) 99999-9999',
        cpf: '111.222.333-44',
        commission_rate: 2.5,
        store_id: 'store_001',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'seller_002',
        name: 'Pedro Oliveira',
        email: 'pedro@loja.com',
        phone: '(11) 88888-8888',
        cpf: '555.666.777-88',
        commission_rate: 3.0,
        store_id: 'store_001',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];
  }

  private getMockFiscalReceipts(): FiscalReceipt[] {
    return [
      {
        id: 'receipt_001',
        sale_id: 'sale_001',
        receipt_number: '000001',
        series: '001',
        issue_date: '2025-01-15T14:30:00Z',
        total_amount: 2999.90,
        tax_amount: 0,
        status: 'issued',
        created_at: '2025-01-15T14:30:00Z'
      }
    ];
  }

  private getMockNFEs(): NFE[] {
    return [
      {
        id: 'nfe_001',
        sale_id: 'sale_002',
        nfe_number: '000000001',
        access_key: '35250114200166000187550010000000011234567890',
        issue_date: '2025-01-14T16:45:00Z',
        total_amount: 4499.90,
        tax_amount: 0,
        status: 'issued',
        created_at: '2025-01-14T16:45:00Z'
      }
    ];
  }

  private getMockSalesReport(): any {
    return {
      total_sales: 7599.80,
      total_items: 2,
      average_ticket: 3799.90,
      payment_methods: {
        credit_card: 2999.90,
        pix: 4499.90
      },
      top_products: [
        { name: 'Notebook Dell Inspiron 15', quantity: 1, total: 4499.90 },
        { name: 'Smartphone Samsung Galaxy S23', quantity: 1, total: 2999.90 }
      ]
    };
  }

  private getMockInventoryReport(): any {
    return {
      total_products: 3,
      total_value: 13599.70,
      low_stock_products: 0,
      categories: {
        'Eletrônicos': 2,
        'Informática': 1
      },
      brands: {
        'Samsung': 1,
        'Dell': 1,
        'Apple': 1
      }
    };
  }
}

export default new PDVService();
