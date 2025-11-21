import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Store as StoreIcon, 
  Users, 
  Truck, 
  Factory, 
  Tag, 
  Receipt, 
  FileText, 
  TrendingUp,
  DollarSign,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Calculator,
  CreditCard,
  Smartphone
} from 'lucide-react';
import pdvService, { Product, Sale, Store, Supplier } from '../services/pdvService';
import FiscalReceiptModal from './FiscalReceiptModal';
import NFEModal from './NFEModal';
import VirtualKeyboard from './VirtualKeyboard';
import ChangeCalculator from './ChangeCalculator';
import { formatCPFCNPJ } from '../utils/formatters';

interface PDVSystemProps {
  onClose: () => void;
}

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount: number;
}

function PDVSystem({ onClose }: PDVSystemProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentSale, setCurrentSale] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showFiscalReceiptModal, setShowFiscalReceiptModal] = useState(false);
  const [showNFEModal, setShowNFEModal] = useState(false);
  const [showVirtualKeyboard, setShowVirtualKeyboard] = useState(false);
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [showDailyHistory, setShowDailyHistory] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [isMobileView, setIsMobileView] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'blue' },
    { id: 'pos', label: 'PDV', icon: ShoppingCart, color: 'emerald' },
    { id: 'products', label: 'Produtos', icon: Package, color: 'teal' },
    { id: 'inventory', label: 'Estoque', icon: TrendingUp, color: 'orange' },
    { id: 'sales', label: 'Vendas', icon: DollarSign, color: 'green' },
    { id: 'stores', label: 'Lojas', icon: StoreIcon, color: 'cyan' },
    { id: 'suppliers', label: 'Fornecedores', icon: Truck, color: 'red' },
    { id: 'manufacturers', label: 'Fabricantes', icon: Factory, color: 'amber' },
    { id: 'brands', label: 'Marcas', icon: Tag, color: 'blue' },
    { id: 'receipts', label: 'Cupons Fiscais', icon: Receipt, color: 'cyan' },
    { id: 'nfe', label: 'NFE', icon: FileText, color: 'teal' },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, color: 'gray' },
    { id: 'settings', label: 'Configurações', icon: Settings, color: 'slate' }
  ];

  useEffect(() => {
    loadData();
    
    // Detectar se é mobile
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsData, salesData, storesData, suppliersData] = await Promise.all([
        pdvService.getProducts(),
        pdvService.getSales(),
        pdvService.getStores(),
        pdvService.getSuppliers()
      ]);

      setProducts(productsData);
      setSales(salesData);
      setStores(storesData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = () => {
    // Super Admin sempre tem acesso total - SEM RESTRIÇÕES
    const userRole = localStorage.getItem('user_role');
    if (userRole === 'super_admin') {
      return true;
    }
    
    // Verificar se o usuário tem assinatura ativa
    const subscription = localStorage.getItem('active_subscription');
    if (!subscription) {
      setShowSubscriptionModal(true);
      return false;
    }
    return true;
  };

  const addToCart = (product: Product) => {
    // Super Admin sempre pode adicionar produtos - SEM VERIFICAÇÃO
    console.log('Tentando adicionar produto ao carrinho:', product.name);
    
    const existingItem = currentSale.find(item => item.product_id === product.id);
    if (existingItem) {
      setCurrentSale(prev => prev.map(item =>
        item.product_id === product.id
          ? { ...item, quantity: item.quantity + 1, total_price: (item.quantity + 1) * item.unit_price }
          : item
      ));
    } else {
      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price,
        discount: 0
      };
      setCurrentSale(prev => [...prev, newItem]);
    }
    console.log('Produto adicionado ao carrinho com sucesso!');
  };

  const removeFromCart = (productId: string) => {
    setCurrentSale(prev => prev.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCurrentSale(prev => prev.map(item =>
      item.product_id === productId
        ? { ...item, quantity, total_price: quantity * item.unit_price }
        : item
    ));
  };

  const calculateTotal = () => {
    const subtotal = currentSale.reduce((total, item) => total + item.total_price, 0);
    const discountAmount = subtotal * (discountPercentage / 100);
    return subtotal - discountAmount;
  };

  const calculateDiscount = () => {
    const subtotal = currentSale.reduce((total, item) => total + item.total_price, 0);
    return subtotal * (discountPercentage / 100);
  };

  const finalizeSale = async () => {
    // Super Admin sempre pode finalizar vendas - SEM VERIFICAÇÃO
    console.log('Finalizando venda...');
    
    const total = calculateTotal();
    const newSale: Omit<Sale, 'id' | 'created_at' | 'updated_at'> = {
      customer_id: 'cust_demo',
      customer_name: 'Cliente Demo',
      seller_id: 'seller_demo',
      seller_name: 'Vendedor Demo',
      store_id: 'store_001',
      store_name: 'Loja Centro',
      total,
      discount: 0,
      tax: 0,
      net_total: total,
      payment_method: 'credit_card',
      status: 'completed',
      items: [...currentSale]
    };

    try {
      const createdSale = await pdvService.createSale(newSale);
      setSales(prev => [createdSale, ...prev]);
      setCurrentSale([]);
      console.log('Venda finalizada com sucesso!');
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600 text-white',
      green: 'bg-green-500 hover:bg-green-600 text-white',
      amber: 'bg-amber-500 hover:bg-amber-600 text-white',
      orange: 'bg-orange-500 hover:bg-orange-600 text-white',
      emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      red: 'bg-red-500 hover:bg-red-600 text-white',
      cyan: 'bg-cyan-500 hover:bg-cyan-600 text-white',
      teal: 'bg-teal-500 hover:bg-teal-600 text-white',
      gray: 'bg-gray-500 hover:bg-gray-600 text-white',
      slate: 'bg-slate-500 hover:bg-slate-600 text-white'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  // Calcular métricas do dashboard dinamicamente
  const dashboardMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Vendas de hoje
    const todaySales = sales.filter((sale) => {
      if (!sale.created_at) return false;
      const saleDate = new Date(sale.created_at);
      return saleDate >= today && saleDate <= todayEnd;
    });
    const todayTotal = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    
    // Estoque baixo (produtos com estoque <= 5)
    const lowStockProducts = products.filter((p) => (p.stock || 0) <= 5 && (p.stock || 0) > 0).length;
    
    return {
      todayTotal,
      lowStockProducts
    };
  }, [sales, products]);

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Vendas Hoje</p>
              <p className="text-3xl font-bold">
                R$ {dashboardMetrics.todayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-blue-200 text-sm">Total do dia</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Produtos</p>
              <p className="text-3xl font-bold">{products.length}</p>
              <p className="text-green-200 text-sm">Em estoque</p>
            </div>
            <Package className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Vendas</p>
              <p className="text-3xl font-bold">{sales.length}</p>
              <p className="text-purple-200 text-sm">Este mês</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Estoque Baixo</p>
              <p className="text-3xl font-bold">{dashboardMetrics.lowStockProducts}</p>
              <p className="text-orange-200 text-sm">Produtos</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendas Recentes</h3>
          <div className="space-y-3">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{sale.customer_name}</p>
                  <p className="text-sm text-gray-600">{sale.items.length} itens</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Produtos em Falta</h3>
          <div className="space-y-3">
            {products.filter(p => p.stock <= p.min_stock).map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-800">{product.name}</p>
                  <p className="text-sm text-red-600">Estoque: {product.stock}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-red-600">Mín: {product.min_stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPOS = () => (
    <div className="space-y-4 md:space-y-6">
      {/* Header do PDV */}
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">PDV - Ponto de Venda</h2>
            <p className="text-gray-600 text-sm md:text-base">Sistema de frente de caixa profissional</p>
          </div>
          <div className="grid grid-cols-2 md:flex md:items-center md:space-x-4 gap-2">
            <div className="text-center md:text-right">
              <p className="text-xs md:text-sm text-gray-600">Vendedor</p>
              <p className="font-semibold text-gray-800 text-sm md:text-base">João Silva</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs md:text-sm text-gray-600">Caixa</p>
              <p className="font-semibold text-gray-800 text-sm md:text-base">001</p>
            </div>
            <div className="text-center md:text-right col-span-2 md:col-span-1">
              <p className="text-xs md:text-sm text-gray-600">Data/Hora</p>
              <p className="font-semibold text-gray-800 text-sm md:text-base">{new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        
        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowDailyHistory(true)}
            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Histórico</span>
          </button>
          <button
            onClick={() => setShowQuickActions(true)}
            className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Ações</span>
          </button>
          <button
            onClick={() => setCurrentSale([])}
            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      <div className={`grid gap-4 md:gap-6 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Busca de Produtos */}
        <div className={`${isMobileView ? 'order-2' : 'lg:col-span-1'}`}>
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Buscar Produtos</h3>
            
            {/* Leitor de Código de Barras */}
            <div className="mb-4 md:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Código de Barras</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Passe o código de barras..."
                  className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-base md:text-lg font-mono"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const barcode = e.currentTarget.value;
                      const product = products.find(p => p.sku === barcode || p.barcode === barcode);
                      if (product) {
                        addToCart(product);
                        e.currentTarget.value = '';
                      } else {
                        alert('Produto não encontrado!');
                      }
                    }
                  }}
                />
                <div className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 md:w-6 md:h-6 border-2 border-gray-400 rounded"></div>
                </div>
              </div>
            </div>

            {/* Busca por Referência */}
            <div className="mb-4 md:mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Referência/SKU</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Digite a referência..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Lista de Produtos */}
            <div className="space-y-2 max-h-64 md:max-h-96 overflow-y-auto">
              {products
                .filter(product => 
                  product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  product.barcode.includes(searchTerm)
                )
                .map((product) => (
                <div key={product.id} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 text-sm truncate">{product.name}</h4>
                    <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                    <p className="text-sm font-semibold text-green-600">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-2 md:px-3 py-1 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors flex-shrink-0"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Carrinho e Pagamento */}
        <div className={`${isMobileView ? 'order-1' : 'lg:col-span-2'}`}>
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Carrinho de Vendas</h3>
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{currentSale.length} itens</span>
            </div>

            {currentSale.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Carrinho vazio</p>
                <p className="text-sm text-gray-400">Passe os produtos pelo código de barras ou busque por referência</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4 md:mb-6 max-h-48 md:max-h-60 overflow-y-auto">
                  {currentSale.map((item) => (
                    <div key={item.product_id} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 text-sm truncate">{item.product_name}</h4>
                        <div className={`flex items-center text-xs md:text-sm text-gray-600 ${isMobileView ? 'flex-col space-y-1' : 'space-x-4'}`}>
                          <span>Qtd: {item.quantity}</span>
                          <span>R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              if (item.quantity > 1) {
                                setCurrentSale(prev => prev.map(i =>
                                  i.product_id === item.product_id
                                    ? { ...i, quantity: i.quantity - 1, total_price: (i.quantity - 1) * i.unit_price }
                                    : i
                                ));
                              }
                            }}
                            className="w-5 h-5 md:w-6 md:h-6 bg-gray-200 text-gray-600 rounded flex items-center justify-center hover:bg-gray-300 text-sm"
                          >
                            -
                          </button>
                          <span className="w-6 md:w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => {
                              setCurrentSale(prev => prev.map(i =>
                                i.product_id === item.product_id
                                  ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
                                  : i
                              ));
                            }}
                            className="w-5 h-5 md:w-6 md:h-6 bg-gray-200 text-gray-600 rounded flex items-center justify-center hover:bg-gray-300 text-sm"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-semibold text-gray-800 text-sm md:text-base w-16 md:w-20 text-right">R$ {item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <button
                          onClick={() => removeFromCart(item.product_id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumo da Venda */}
                <div className="border-t pt-4">
                  <div className={`grid gap-4 mb-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cliente (CPF/CNPJ)</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Digite o CPF ou CNPJ..."
                          value={formatCPFCNPJ(customerCpfCnpj)}
                          onChange={(e) => {
                            const unformatted = e.target.value.replace(/\D/g, '');
                            setCustomerCpfCnpj(unformatted);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                          maxLength={18}
                        />
                        <button
                          onClick={() => setShowVirtualKeyboard(true)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Desconto (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0"
                          value={discountPercentage}
                          onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base"
                        />
                        <button
                          onClick={() => setShowVirtualKeyboard(true)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Campo de Observações */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Observações da Venda</label>
                    <textarea
                      placeholder="Adicione observações sobre a venda..."
                      value={saleNotes}
                      onChange={(e) => setSaleNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm md:text-base resize-none"
                      rows={2}
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">R$ {currentSale.reduce((total, item) => total + item.total_price, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Desconto ({discountPercentage}%):</span>
                      <span className="font-semibold text-red-600">R$ {calculateDiscount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                      <span>TOTAL:</span>
                      <span className="text-green-600">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* Formas de Pagamento */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                    <div className={`grid gap-2 ${isMobileView ? 'grid-cols-1' : 'grid-cols-3'}`}>
                      <button 
                        onClick={() => setSelectedPaymentMethod('dinheiro')}
                        className={`px-3 md:px-4 py-2 rounded-lg transition-colors font-medium text-sm md:text-base ${
                          selectedPaymentMethod === 'dinheiro' 
                            ? 'bg-green-500 text-white' 
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        💰 Dinheiro
                      </button>
                      <button 
                        onClick={() => setSelectedPaymentMethod('cartao')}
                        className={`px-3 md:px-4 py-2 rounded-lg transition-colors font-medium text-sm md:text-base ${
                          selectedPaymentMethod === 'cartao' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        💳 Cartão
                      </button>
                      <button 
                        onClick={() => setSelectedPaymentMethod('pix')}
                        className={`px-3 md:px-4 py-2 rounded-lg transition-colors font-medium text-sm md:text-base ${
                          selectedPaymentMethod === 'pix' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        📱 PIX
                      </button>
                    </div>
                    
                    {selectedPaymentMethod === 'dinheiro' && (
                      <div className="mt-3">
                        <button
                          onClick={() => setShowChangeCalculator(true)}
                          className="px-3 md:px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium flex items-center space-x-2 text-sm md:text-base"
                        >
                          <Calculator className="w-4 h-4" />
                          <span>Calcular Troco</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className={`grid gap-3 ${isMobileView ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm md:text-base">
                      Cancelar Venda
                    </button>
                    <button
                      onClick={finalizeSale}
                      className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm md:text-base"
                    >
                      Finalizar Venda
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestão de Produtos</h2>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Importar</span>
          </button>
          <button className="px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.brand} - {product.category}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock > product.min_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Editar</button>
                      <button className="text-red-600 hover:text-red-900">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReceipts = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Cupons Fiscais</h2>
            <p className="text-gray-600">Emissão e gestão de cupons fiscais</p>
          </div>
          <button
            onClick={() => setShowFiscalReceiptModal(true)}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Receipt className="w-5 h-5" />
            <span>Gerenciar Cupons</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Emitidos</p>
                <p className="text-3xl font-bold">12</p>
                <p className="text-blue-200 text-sm">Este mês</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Valor Total</p>
                <p className="text-3xl font-bold">R$ 45.890,00</p>
                <p className="text-green-200 text-sm">Em cupons</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Taxa Média</p>
                <p className="text-3xl font-bold">R$ 0,00</p>
                <p className="text-purple-200 text-sm">Por cupom</p>
              </div>
              <FileText className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Funcionalidades dos Cupons Fiscais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Emissão automática de cupons</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Numeração sequencial</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Impressão em impressoras térmicas</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Cancelamento de cupons</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Relatórios detalhados</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Backup automático</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Integração com SEFAZ</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Conformidade fiscal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNFE = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Nota Fiscal Eletrônica (NFE)</h2>
            <p className="text-gray-600">Emissão e gestão de NFEs</p>
          </div>
          <button
            onClick={() => setShowNFEModal(true)}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <FileText className="w-5 h-5" />
            <span>Gerenciar NFEs</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Emitidas</p>
                <p className="text-3xl font-bold">8</p>
                <p className="text-green-200 text-sm">Este mês</p>
              </div>
              <FileText className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Valor Total</p>
                <p className="text-3xl font-bold">R$ 32.450,00</p>
                <p className="text-blue-200 text-sm">Em NFEs</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Pendentes</p>
                <p className="text-3xl font-bold">2</p>
                <p className="text-purple-200 text-sm">Aguardando</p>
              </div>
              <Clock className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Taxa Média</p>
                <p className="text-3xl font-bold">R$ 0,00</p>
                <p className="text-orange-200 text-sm">Por NFE</p>
              </div>
              <FileText className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Funcionalidades da NFE</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Emissão automática de NFE</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Chave de acesso única</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Validação com SEFAZ</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Cancelamento de NFEs</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Download em PDF/XML</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Envio por e-mail</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Relatórios fiscais</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Conformidade legal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Controle de Estoque</h2>
            <p className="text-gray-600">Gestão completa do estoque</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span>Entrada</span>
            </button>
            <button className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Saída</span>
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Ajuste</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Produtos</p>
                <p className="text-3xl font-bold">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Em Estoque</p>
                <p className="text-3xl font-bold">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Estoque Baixo</p>
                <p className="text-3xl font-bold">{products.filter(p => p.stock <= p.min_stock).length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Valor Total</p>
                <p className="text-3xl font-bold">R$ {products.reduce((sum, p) => sum + (p.stock * p.cost), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Atual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estoque Mínimo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{product.brand}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.min_stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {product.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.stock > product.min_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock > product.min_stock ? 'OK' : 'Baixo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Ajustar</button>
                      <button className="text-green-600 hover:text-green-900">Entrada</button>
                      <button className="text-red-600 hover:text-red-900">Saída</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSales = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Vendas</h2>
            <p className="text-gray-600">Controle completo de vendas e cancelamentos</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nova Venda</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Vendas Hoje</p>
                <p className="text-3xl font-bold">{sales.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Valor Total</p>
                <p className="text-3xl font-bold">R$ {sales.reduce((sum, s) => sum + s.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Ticket Médio</p>
                <p className="text-3xl font-bold">R$ {sales.length > 0 ? (sales.reduce((sum, s) => sum + s.total, 0) / sales.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Canceladas</p>
                <p className="text-3xl font-bold">{sales.filter(s => s.status === 'cancelled').length}</p>
              </div>
              <X className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{sale.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.seller_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.payment_method}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                      sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sale.status === 'completed' ? 'Concluída' :
                       sale.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Ver</button>
                      <button className="text-red-600 hover:text-red-900">Cancelar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStores = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Lojas</h2>
            <p className="text-gray-600">Controle de múltiplas lojas</p>
          </div>
          <button className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Nova Loja</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{store.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  store.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {store.status === 'active' ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Endereço:</strong> {store.address}</p>
                <p><strong>Telefone:</strong> {store.phone}</p>
                <p><strong>E-mail:</strong> {store.email}</p>
                <p><strong>CNPJ:</strong> {store.cnpj}</p>
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                  Editar
                </button>
                <button className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm">
                  Usuários
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSuppliers = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Fornecedores</h2>
            <p className="text-gray-600">Controle de fornecedores e compras</p>
          </div>
          <button className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Novo Fornecedor</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.cnpj}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.contact}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Editar</button>
                      <button className="text-green-600 hover:text-green-900">Produtos</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderManufacturers = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Fabricantes</h2>
            <p className="text-gray-600">Controle de fabricantes e marcas</p>
          </div>
          <button className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Novo Fabricante</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Factory className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Samsung Electronics</h3>
                <p className="text-sm text-gray-600">Eletrônicos</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>CNPJ:</strong> 00.000.000/0001-00</p>
              <p><strong>Contato:</strong> Samsung Brasil</p>
              <p><strong>Telefone:</strong> (11) 4000-0000</p>
              <p><strong>E-mail:</strong> contato@samsung.com.br</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                Editar
              </button>
              <button className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm">
                Produtos
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Factory className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Dell Technologies</h3>
                <p className="text-sm text-gray-600">Informática</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>CNPJ:</strong> 00.000.000/0002-00</p>
              <p><strong>Contato:</strong> Dell Brasil</p>
              <p><strong>Telefone:</strong> (11) 4000-0001</p>
              <p><strong>E-mail:</strong> contato@dell.com.br</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                Editar
              </button>
              <button className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm">
                Produtos
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Factory className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Apple Inc.</h3>
                <p className="text-sm text-gray-600">Tecnologia</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>CNPJ:</strong> 00.000.000/0003-00</p>
              <p><strong>Contato:</strong> Apple Store Brasil</p>
              <p><strong>Telefone:</strong> (11) 4000-0002</p>
              <p><strong>E-mail:</strong> contato@apple.com.br</p>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                Editar
              </button>
              <button className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm">
                Produtos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBrands = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Marcas</h2>
            <p className="text-gray-600">Controle de marcas e produtos</p>
          </div>
          <button className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Nova Marca</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Samsung</h3>
            <p className="text-sm text-gray-600 mb-4">Tecnologia móvel e eletrônicos</p>
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                Editar
              </button>
              <button className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm">
                Produtos
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Dell</h3>
            <p className="text-sm text-gray-600 mb-4">Computadores e tecnologia</p>
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                Editar
              </button>
              <button className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm">
                Produtos
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Apple</h3>
            <p className="text-sm text-gray-600 mb-4">Tecnologia premium</p>
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                Editar
              </button>
              <button className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm">
                Produtos
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">LG</h3>
            <p className="text-sm text-gray-600 mb-4">Eletrodomésticos</p>
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                Editar
              </button>
              <button className="flex-1 px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors text-sm">
                Produtos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Relatórios</h2>
            <p className="text-gray-600">Relatórios detalhados do sistema</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Gerar Relatório</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Relatório de Vendas</p>
                <p className="text-2xl font-bold">Diário</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Relatório de Estoque</p>
                <p className="text-2xl font-bold">Mensal</p>
              </div>
              <Package className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Relatório Fiscal</p>
                <p className="text-2xl font-bold">Anual</p>
              </div>
              <FileText className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Relatório Financeiro</p>
                <p className="text-2xl font-bold">Trimestral</p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Relatório de Clientes</p>
                <p className="text-2xl font-bold">Semanal</p>
              </div>
              <Users className="w-8 h-8 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm">Relatório de Fornecedores</p>
                <p className="text-2xl font-bold">Mensal</p>
              </div>
              <Truck className="w-8 h-8 text-teal-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Configurações</h2>
            <p className="text-gray-600">Configurações gerais do sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações Gerais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Empresa</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" defaultValue="PloutosLedger" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" defaultValue="12.345.678/0001-90" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" defaultValue="Rua das Flores, 123 - Centro" />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações de Venda</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imposto Padrão (%)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" defaultValue="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Desconto Máximo (%)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" defaultValue="10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Margem Mínima (%)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" defaultValue="20" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações de Estoque</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alerta de Estoque Baixo</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" defaultValue="5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backup Automático</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sincronização</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="auto">Automática</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações Fiscais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Regime Tributário</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="simples">Simples Nacional</option>
                    <option value="presumido">Lucro Presumido</option>
                    <option value="real">Lucro Real</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alíquota ICMS (%)</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" defaultValue="18" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificado Digital</label>
                  <input type="file" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'pos':
        return renderPOS();
      case 'products':
        return renderProducts();
      case 'inventory':
        return renderInventory();
      case 'sales':
        return renderSales();
      case 'stores':
        return renderStores();
      case 'suppliers':
        return renderSuppliers();
      case 'manufacturers':
        return renderManufacturers();
      case 'brands':
        return renderBrands();
      case 'receipts':
        return renderReceipts();
      case 'nfe':
        return renderNFE();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] md:max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Sistema PDV Completo</h2>
              <p className="text-xs md:text-sm text-gray-600">Ponto de Venda Profissional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`flex h-full ${isMobileView ? 'flex-col' : ''}`}>
          {/* Sidebar */}
          <div className={`bg-gray-50 border-r ${isMobileView ? 'w-full border-b' : 'w-64'}`}>
            <div className="p-2 md:p-4">
              <div className={`space-y-1 md:space-y-2 ${isMobileView ? 'flex flex-wrap gap-2' : ''}`}>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors ${
                        activeTab === item.id
                          ? getColorClasses(item.color)
                          : 'text-gray-600 hover:bg-gray-100'
                      } ${isMobileView ? 'flex-1 min-w-0 text-xs' : 'w-full font-medium'}`}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 md:p-6">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Modal de Assinatura - Só aparece para usuários normais */}
        {showSubscriptionModal && localStorage.getItem('user_role') !== 'super_admin' && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Assinatura Necessária</h3>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Acesso Restrito</h4>
                  <p className="text-gray-600">
                    Esta funcionalidade requer uma assinatura ativa. 
                    Entre em contato com o administrador para liberar o acesso.
                  </p>
                </div>
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    Entrar em Contato
                  </button>
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Continuar Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Cupons Fiscais */}
        {showFiscalReceiptModal && (
          <FiscalReceiptModal onClose={() => setShowFiscalReceiptModal(false)} />
        )}

        {/* Modal NFE */}
        {showNFEModal && (
          <NFEModal onClose={() => setShowNFEModal(false)} />
        )}

        {/* Modal Calculadora de Troco */}
        {showChangeCalculator && (
          <ChangeCalculator 
            total={calculateTotal()} 
            onClose={() => setShowChangeCalculator(false)} 
          />
        )}

        {/* Modal Teclado Virtual */}
        {showVirtualKeyboard && (
          <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Teclado Virtual</h3>
                  <button
                    onClick={() => setShowVirtualKeyboard(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4">
                <VirtualKeyboard
                  onKeyPress={(key) => {
                    if (key === 'C') {
                      setCustomerCpfCnpj('');
                    } else {
                      setCustomerCpfCnpj(prev => prev + key);
                    }
                  }}
                  onClear={() => setCustomerCpfCnpj('')}
                  onBackspace={() => setCustomerCpfCnpj(prev => prev.slice(0, -1))}
                  onEnter={() => setShowVirtualKeyboard(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PDVSystem;
