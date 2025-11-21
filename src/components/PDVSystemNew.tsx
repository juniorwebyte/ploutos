import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
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
  Smartphone,
  Zap,
  Eye,
  Edit,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight,
  Minus,
  Percent,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  Heart,
  Share2,
  Printer,
  QrCode,
  Shield,
  Lock,
  Unlock,
  Bell,
  MessageCircle,
  HelpCircle,
  Info,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';
// Lazy load de componentes pesados
const InventoryManagement = lazy(() => import('./InventoryManagement'));
const FiscalReceiptModal = lazy(() => import('./FiscalReceiptModal'));
const NFEModal = lazy(() => import('./NFEModal'));
const WebGLBackground = lazy(() => import('./WebGLBackground'));
import inventoryService from '../services/inventoryService';
import paymentGatewayService from '../services/paymentGatewayService';
import fiscalService from '../services/fiscalService';
import cnpjService, { EmpresaData } from '../services/cnpjService';
import { formatPhone, formatCPFCNPJ, formatCPF, formatCNPJ, unformatPhone, unformatCPF, unformatCNPJ, formatCurrencyInput, unformatCurrency } from '../utils/formatters';
import storageManager from '../utils/storage';
import ProductCard from './ProductCard';
import CartItem from './CartItem';

interface PDVSystemNewProps {
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  barcode?: string;
  image?: string;
  description?: string;
  cost?: number;
  margin?: number;
}

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount: number;
  category: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  cnpj?: string;
  address?: string;
  points?: number;
}

interface StoreRecord {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  status: 'active' | 'inactive';
}

interface SupplierRecord {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
}

interface CommissionRecord {
  id: string;
  sellerName: string;
  percentage: number; // %
  salesAmount: number;
  commissionAmount: number;
  date: string; // ISO
}

function PDVSystemNew({ onClose }: PDVSystemNewProps) {
  const [activeTab, setActiveTab] = useState('pos');
  const [loading, setLoading] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentSale, setCurrentSale] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [customerCpfCnpj, setCustomerCpfCnpj] = useState<string>('');
  const [loadingCNPJ, setLoadingCNPJ] = useState<boolean>(false);
  const [empresaData, setEmpresaData] = useState<EmpresaData | null>(null);

  // Usa a função centralizada de formatação
  const formatCpfCnpj = formatCPFCNPJ;

  // Buscar dados da empresa quando CNPJ estiver completo
  useEffect(() => {
    const cleanCnpj = customerCpfCnpj.replace(/\D/g, '');
    
    // Se tiver 14 dígitos, é CNPJ - buscar dados
    if (cleanCnpj.length === 14) {
      // Evitar múltiplas chamadas
      const timeoutId = setTimeout(() => {
        setLoadingCNPJ(true);
        cnpjService.consultarCNPJ(cleanCnpj)
          .then((data) => {
            if (data) {
              setEmpresaData(data);
              // Preencher automaticamente os dados do cliente
              setCurrentCustomer({
                id: `cnpj_${cleanCnpj}`,
                name: data.nomeFantasia || data.razaoSocial,
                email: data.email || '',
                phone: data.telefone || '',
                cpf: cleanCnpj,
              });
            }
            setLoadingCNPJ(false);
          })
          .catch((error) => {
            console.error('Erro ao buscar dados do CNPJ:', error);
            setLoadingCNPJ(false);
            setEmpresaData(null);
            // Não mostrar erro para não interromper o fluxo
          });
      }, 500); // Debounce de 500ms para evitar múltiplas chamadas

      return () => clearTimeout(timeoutId);
    } else if (cleanCnpj.length < 14) {
      // Limpar dados se CNPJ não estiver completo
      setEmpresaData(null);
      setLoadingCNPJ(false);
      if (cleanCnpj.length === 0) {
        setCurrentCustomer(null);
      }
    }
  }, [customerCpfCnpj]);

  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [isMobileView, setIsMobileView] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<{
    items: SaleItem[];
    total: number;
    customer: Customer | null;
    paymentMethod: string;
    date: Date;
  } | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModalForm, setShowCustomerModalForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    points: 0
  });
  const [productFormData, setProductFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    barcode: '',
    description: ''
  });
  const [showFiscalReceiptModal, setShowFiscalReceiptModal] = useState(false);
  const [showNFEModal, setShowNFEModal] = useState(false);
  const [fiscalDocumentType, setFiscalDocumentType] = useState<'cpf' | 'cnpj' | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  
  // Estados para gerenciamento de produtos
  const [productsSubTab, setProductsSubTab] = useState<'list' | 'import' | 'labels' | 'adjustments' | 'count'>('list');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showCountModal, setShowCountModal] = useState(false);
  const [selectedProductForLabel, setSelectedProductForLabel] = useState<Product | null>(null);
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({ type: 'add' as 'add' | 'subtract' | 'set', quantity: 0, reason: '' });
  const [stockCounts, setStockCounts] = useState<Array<{ productId: string; productName: string; currentStock: number; countedStock: number }>>([]);
  
  // Estados para gerenciamento de vendas
  const [salesSubTab, setSalesSubTab] = useState<'list' | 'pdv' | 'add' | 'import' | 'deliveries' | 'coupons'>('list');
  const [showAddSaleModal, setShowAddSaleModal] = useState(false);
  const [showImportSalesModal, setShowImportSalesModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [deliveries, setDeliveries] = useState<Array<{
    id: string;
    saleId: string;
    customerName: string;
    address: string;
    phone: string;
    status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
    scheduledDate?: string;
    deliveredDate?: string;
  }>>([]);
  const [coupons, setCoupons] = useState<Array<{
    id: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    usedCount: number;
    active: boolean;
  }>>([]);
  
  // Estados para gerenciamento de cotações
  const [quotations, setQuotations] = useState<Array<{
    id: string;
    number: string;
    supplierId: string;
    supplierName: string;
    date: string;
    validUntil: string;
    status: 'pending' | 'approved' | 'rejected' | 'expired';
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    notes?: string;
  }>>([]);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [quotationFormData, setQuotationFormData] = useState({
    supplierId: '',
    validUntil: '',
    items: [] as Array<{ productId: string; productName: string; quantity: number; unitPrice: number; total: number }>,
    discount: 0,
    notes: ''
  });
  
  // Estados para gerenciamento de compras
  const [purchases, setPurchases] = useState<Array<{
    id: string;
    number: string;
    supplierId: string;
    supplierName: string;
    date: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    notes?: string;
  }>>([]);
  const [expenses, setExpenses] = useState<Array<{
    id: string;
    description: string;
    category: string;
    amount: number;
    date: string;
    paymentMethod: string;
    notes?: string;
  }>>([]);
  const [purchasesSubTab, setPurchasesSubTab] = useState<'list' | 'add' | 'import' | 'expenses' | 'addExpense'>('list');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showImportPurchaseModal, setShowImportPurchaseModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [purchaseFormData, setPurchaseFormData] = useState({
    supplierId: '',
    items: [] as Array<{ productId: string; productName: string; quantity: number; unitPrice: number; total: number }>,
    discount: 0,
    paymentMethod: 'cash',
    notes: ''
  });
  const [expenseFormData, setExpenseFormData] = useState({
    description: '',
    category: '',
    amount: 0,
    paymentMethod: 'cash',
    notes: ''
  });
  
  // Estados para gerenciamento de transferências
  const [transfers, setTransfers] = useState<Array<{
    id: string;
    number: string;
    fromStoreId: string;
    fromStoreName: string;
    toStoreId: string;
    toStoreName: string;
    date: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
    }>;
    status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
    notes?: string;
  }>>([]);
  const [transfersSubTab, setTransfersSubTab] = useState<'list' | 'add' | 'import'>('list');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showImportTransferModal, setShowImportTransferModal] = useState(false);
  const [transferFormData, setTransferFormData] = useState({
    fromStoreId: '',
    toStoreId: '',
    items: [] as Array<{ productId: string; productName: string; quantity: number }>,
    notes: ''
  });
  
  // Estados para gerenciamento de usuários
  const [systemUsers, setSystemUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'manager' | 'cashier' | 'seller';
    status: 'active' | 'inactive';
    createdAt: string;
  }>>([]);
  const [sellers, setSellers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    commission: number;
    status: 'active' | 'inactive';
    createdAt: string;
  }>>([]);
  const [babies, setBabies] = useState<Array<{
    id: string;
    name: string;
    birthDate: string;
    gender: 'male' | 'female';
    parentName: string;
    parentPhone: string;
    parentEmail?: string;
    createdAt: string;
  }>>([]);
  const [usersSubTab, setUsersSubTab] = useState<'users' | 'addUser' | 'sellers' | 'addSeller' | 'customers' | 'addCustomer' | 'babies'>('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showBabyModal, setShowBabyModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'cashier' as 'admin' | 'manager' | 'cashier' | 'seller',
    password: ''
  });
  const [sellerFormData, setSellerFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    commission: 0
  });
  const [babyFormData, setBabyFormData] = useState({
    name: '',
    birthDate: '',
    parentName: '',
    parentPhone: '',
    parentEmail: ''
  });
  
  // Estados para abertura/fechamento de caixa
  const [cashRegisterOpen, setCashRegisterOpen] = useState<boolean>(false);
  const [initialCashAmount, setInitialCashAmount] = useState<number>(0);
  const [showOpenCashModal, setShowOpenCashModal] = useState<boolean>(false);
  const [showCloseCashModal, setShowCloseCashModal] = useState<boolean>(false);
  const [cashRegisterData, setCashRegisterData] = useState<{
    openedAt: Date | null;
    initialAmount: number;
    totalSales: number;
    totalReceived: number;
    salesCount: number;
  }>({
    openedAt: null,
    initialAmount: 0,
    totalSales: 0,
    totalReceived: 0,
    salesCount: 0
  });
  
  // Lojas, Fornecedores e Comissões (com persistência otimizada)
  const [stores, setStores] = useState<StoreRecord[]>(() => {
    return storageManager.get<StoreRecord[]>('pdv_stores', {
      defaultValue: [
        { id: 'st1', name: 'Matriz', address: 'Rua Central, 100', phone: '(11) 1111-1111', email: 'matriz@empresa.com', cnpj: '00.000.000/0001-00', status: 'active' },
      ]
    }) || [];
  });
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>(() => {
    return storageManager.get<SupplierRecord[]>('pdv_suppliers', {
      defaultValue: [
        { id: 'sp1', name: 'Fornecedor Demo', cnpj: '11.111.111/0001-11', contact: 'Carlos', phone: '(11) 99999-9999', email: 'contato@fornecedor.com', status: 'active' }
      ]
    }) || [];
  });
  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => {
    return storageManager.get<CommissionRecord[]>('pdv_commissions', {
      defaultValue: []
    }) || [];
  });

  // Persistência otimizada com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      storageManager.set('pdv_stores', stores);
    }, 300);
    return () => clearTimeout(timer);
  }, [stores]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      storageManager.set('pdv_suppliers', suppliers);
    }, 300);
    return () => clearTimeout(timer);
  }, [suppliers]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      storageManager.set('pdv_commissions', commissions);
    }, 300);
    return () => clearTimeout(timer);
  }, [commissions]);

  // Edição e exportação
  const [editingStore, setEditingStore] = useState<StoreRecord | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<SupplierRecord | null>(null);
  const [editingCommission, setEditingCommission] = useState<CommissionRecord | null>(null);

  const exportToCSV = (filename: string, rows: Array<Record<string, any>>) => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')].concat(
      rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Dados iniciais vazios - sistema inicia zerado

  const menuItems = [
    { id: 'pos', label: 'PDV', icon: ShoppingCart, color: 'emerald' },
    { id: 'cash', label: 'Caixa', icon: DollarSign, color: 'green' },
    { id: 'products', label: 'Produtos', icon: Package, color: 'teal' },
    { id: 'customers', label: 'Clientes', icon: Users, color: 'blue' },
    { id: 'users', label: 'Usuários', icon: User, color: 'purple' },
    { id: 'inventory', label: 'Estoque', icon: Package, color: 'orange' },
    { id: 'stores', label: 'Lojas', icon: StoreIcon, color: 'indigo' },
    { id: 'suppliers', label: 'Fornecedores', icon: Truck, color: 'yellow' },
    { id: 'sales', label: 'Vendas', icon: DollarSign, color: 'green' },
    { id: 'quotations', label: 'Cotações', icon: FileText, color: 'cyan' },
    { id: 'purchases', label: 'Compras', icon: ShoppingCart, color: 'blue' },
    { id: 'transfers', label: 'Transferências', icon: ArrowRight, color: 'indigo' },
    { id: 'commissions', label: 'Comissões', icon: Percent, color: 'pink' },
    { id: 'reports', label: 'Relatórios', icon: BarChart3, color: 'purple' },
    { id: 'settings', label: 'Configurações', icon: Settings, color: 'gray' }
  ];

  useEffect(() => {
    // Carregar produtos do storage otimizado
    const savedProducts = storageManager.get<Product[]>('pdv_products', {
      defaultValue: [],
      validator: (val) => Array.isArray(val)
    });
    setProducts(savedProducts || []);
    
    // Carregar cotações do storage
    const savedQuotations = storageManager.get<any[]>('pdv_quotations', { defaultValue: [] });
    if (savedQuotations && savedQuotations.length > 0) {
      setQuotations(savedQuotations);
    }
    
    // Carregar compras e despesas do storage
    const savedPurchases = storageManager.get<any[]>('pdv_purchases', { defaultValue: [] });
    if (savedPurchases && savedPurchases.length > 0) {
      setPurchases(savedPurchases);
    }
    const savedExpenses = storageManager.get<any[]>('pdv_expenses', { defaultValue: [] });
    if (savedExpenses && savedExpenses.length > 0) {
      setExpenses(savedExpenses);
    }
    
    // Carregar transferências do storage
    const savedTransfers = storageManager.get<any[]>('pdv_transfers', { defaultValue: [] });
    if (savedTransfers && savedTransfers.length > 0) {
      setTransfers(savedTransfers);
    }
    
    // Carregar usuários, vendedores e bebês do storage
    const savedUsers = storageManager.get<any[]>('pdv_users', { defaultValue: [] });
    if (savedUsers && savedUsers.length > 0) {
      setSystemUsers(savedUsers);
    }
    const savedSellers = storageManager.get<any[]>('pdv_sellers', { defaultValue: [] });
    if (savedSellers && savedSellers.length > 0) {
      setSellers(savedSellers);
    }
    const savedBabies = storageManager.get<any[]>('pdv_babies', { defaultValue: [] });
    if (savedBabies && savedBabies.length > 0) {
      setBabies(savedBabies);
    }
    
    // Carregar clientes do storage
    const savedCustomers = storageManager.get<Customer[]>('pdv_customers', { defaultValue: [] });
    setCustomers(savedCustomers || []);
    
    // Carregar vendas do storage
    const savedSales = storageManager.get<any[]>('pdv_sales', { defaultValue: [] });
    setSales(savedSales || []);
    
    // Verificar se há caixa aberto salvo
    const savedCashRegister = storageManager.get<{
      isOpen: boolean;
      openedAt: string;
      initialAmount: number;
      totalSales: number;
      totalReceived: number;
      salesCount: number;
    }>('pdv_cash_register');
    
    if (savedCashRegister?.isOpen) {
      setCashRegisterOpen(true);
      setCashRegisterData({
        openedAt: new Date(savedCashRegister.openedAt),
        initialAmount: savedCashRegister.initialAmount || 0,
        totalSales: savedCashRegister.totalSales || 0,
        totalReceived: savedCashRegister.totalReceived || 0,
        salesCount: savedCashRegister.salesCount || 0
      });
      setInitialCashAmount(savedCashRegister.initialAmount || 0);
    }
    
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Verificar se precisa abrir caixa quando entrar na aba PDV
  useEffect(() => {
    if (activeTab === 'pos' && !cashRegisterOpen && !showOpenCashModal) {
      // Pequeno delay para evitar conflitos
      const timer = setTimeout(() => {
        setShowOpenCashModal(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductImagePreview(null);
    setProductFormData({
      name: '',
      price: '',
      stock: '',
      category: '',
      barcode: '',
      description: ''
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductImagePreview(product.image || null);
    setProductFormData({
      name: product.name || '',
      price: product.price.toString() || '',
      stock: product.stock.toString() || '',
      category: product.category || '',
      barcode: product.barcode || '',
      description: product.description || ''
    });
    setShowProductModal(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      alert('Produto excluído com sucesso!');
    }
  };

  const handleSaveProduct = (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        // Editar produto existente
        const updatedProduct = { 
          ...editingProduct, 
          ...productData,
          // Garantir que a imagem seja sempre atualizada
          image: productData.image !== undefined ? productData.image : editingProduct.image
        };
        const updatedProducts = products.map(p => 
          p.id === editingProduct.id 
            ? updatedProduct
            : p
        );
        setProducts(updatedProducts);
        storageManager.set('pdv_products', updatedProducts);
        console.log('✅ Produto atualizado:', editingProduct.id, { ...productData, image: updatedProduct.image });
      } else {
        // Criar novo produto
        const newProduct: Product = {
          id: `p${Date.now()}`,
          name: productData.name || '',
          price: productData.price || 0,
          stock: productData.stock || 0,
          category: productData.category || '',
          barcode: productData.barcode || '',
          description: productData.description || '',
          image: productData.image || '',
          ...productData
        };
        const updatedProducts = [...products, newProduct];
        setProducts(updatedProducts);
        storageManager.set('pdv_products', updatedProducts);
        console.log('✅ Produto criado:', newProduct.id, { image: newProduct.image });
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductImagePreview(null);
      setProductFormData({
        name: '',
        price: '',
        stock: '',
        category: '',
        barcode: '',
        description: ''
      });
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Verifique o console para mais detalhes.');
    }
  };

  const handleCreateCustomer = () => {
    setEditingCustomer(null);
    setCustomerFormData({ name: '', email: '', phone: '', cpf: '', points: 0 });
    setShowCustomerModalForm(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      cpf: customer.cpf || '',
      points: customer.points || 0
    });
    setShowCustomerModalForm(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
      alert('Cliente excluído com sucesso!');
    }
  };

  const handleSaveCustomer = (customerData: Partial<Customer>) => {
    // Limpar formatação do CPF/CNPJ antes de salvar (apenas números)
    if (customerData.cpf) {
      customerData.cpf = customerData.cpf.replace(/\D/g, '');
    }
    
    if (editingCustomer) {
      // Editar cliente existente
      setCustomers(prev => prev.map(c => 
        c.id === editingCustomer.id 
          ? { ...c, ...customerData } 
          : c
      ));
      alert('Cliente atualizado com sucesso!');
    } else {
      // Criar novo cliente
      const newCustomer: Customer = {
        id: `c${Date.now()}`,
        name: customerData.name || '',
        email: customerData.email || '',
        phone: customerData.phone || '',
        cpf: customerData.cpf || '',
        points: customerData.points || 0,
        ...customerData
      };
      setCustomers(prev => [...prev, newCustomer]);
      alert('Cliente criado com sucesso!');
    }
    setShowCustomerModalForm(false);
    setEditingCustomer(null);
    setCustomerFormData({ name: '', email: '', phone: '', cpf: '', points: 0 });
  };

  const handleExportSales = () => {
    const csvContent = [
      ['Data', 'Cliente', 'Itens', 'Total', 'Status'],
      ...sales.map(sale => [sale.date, sale.customer, sale.items, sale.total.toFixed(2), sale.status])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert('Vendas exportadas com sucesso!');
  };

  const handlePrintSales = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir.');
      return;
    }

    const salesHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Histórico de Vendas</title>
          <style>
            @media print {
              @page { margin: 20mm; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>Histórico de Vendas</h1>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${sales.map(sale => `
                <tr>
                  <td>${sale.date}</td>
                  <td>${sale.customer}</td>
                  <td>${sale.items}</td>
                  <td>R$ ${sale.total.toFixed(2)}</td>
                  <td>${sale.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(salesHTML);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleViewSale = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      alert(`Detalhes da Venda:\n\nData: ${sale.date}\nCliente: ${sale.customer}\nItens: ${sale.items}\nTotal: R$ ${sale.total.toFixed(2)}\nStatus: ${sale.status}`);
    }
  };

  const handleReprintSale = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      alert(`Reimprimindo cupom da venda #${saleId}...`);
      // Implementar reimpressão similar ao handlePrintReceipt
    }
  };

  // Funções de abertura e fechamento de caixa
  const handleOpenCashRegister = () => {
    if (initialCashAmount <= 0) {
      alert('Por favor, informe um valor inicial para abrir o caixa.');
      return;
    }
    
    const now = new Date();
    const newCashData = {
      openedAt: now,
      initialAmount: initialCashAmount,
      totalSales: 0,
      totalReceived: initialCashAmount,
      salesCount: 0
    };
    
    setCashRegisterData(newCashData);
    setCashRegisterOpen(true);
    setShowOpenCashModal(false);
    
    // Salvar no storage
    storageManager.set('pdv_cash_register', {
      isOpen: true,
      openedAt: now.toISOString(),
      initialAmount: initialCashAmount,
      totalSales: 0,
      totalReceived: initialCashAmount,
      salesCount: 0
    });
  };
  
  const printCashClosureReport = (report: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o relatório.');
      return;
    }

    const reportHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Romaneio de Fechamento de Caixa</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 15mm;
              }
              body { margin: 0; padding: 0; }
            }
            body {
              font-family: 'Arial', sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .report-title {
              font-size: 18px;
              margin-top: 10px;
              color: #666;
            }
            .date-time {
              font-size: 14px;
              margin-top: 10px;
              color: #888;
            }
            .section {
              margin: 25px 0;
              padding: 15px;
              background: #f9f9f9;
              border-left: 4px solid #10b981;
              border-radius: 5px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #10b981;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px dotted #ddd;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              font-weight: 600;
              color: #555;
            }
            .info-value {
              font-weight: bold;
              color: #000;
            }
            .total-section {
              background: #e8f5e9;
              border-left-color: #4caf50;
              margin-top: 30px;
            }
            .total-row {
              font-size: 18px;
              padding: 12px 0;
              border-bottom: 2px solid #4caf50;
            }
            .difference {
              font-size: 20px;
              font-weight: bold;
              padding: 15px 0;
              text-align: center;
            }
            .difference.positive {
              color: #4caf50;
            }
            .difference.negative {
              color: #f44336;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px dashed #ccc;
              font-size: 12px;
              color: #888;
            }
            .sales-list {
              margin-top: 15px;
            }
            .sales-item {
              padding: 5px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">PloutosLedger</div>
            <div class="report-title">ROMANEIO DE FECHAMENTO DE CAIXA</div>
            <div class="date-time">
              ${report.closedAt ? new Date(report.closedAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">📅 Informações do Período</div>
            <div class="info-row">
              <span class="info-label">Data/Hora de Abertura:</span>
              <span class="info-value">${report.openedAt ? new Date(report.openedAt).toLocaleString('pt-BR') : 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Data/Hora de Fechamento:</span>
              <span class="info-value">${report.closedAt ? new Date(report.closedAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}</span>
            </div>
            ${report.openedAt && report.closedAt ? `
            <div class="info-row">
              <span class="info-label">Duração do Expediente:</span>
              <span class="info-value">${Math.round((new Date(report.closedAt).getTime() - new Date(report.openedAt).getTime()) / (1000 * 60 * 60) * 10) / 10} horas</span>
            </div>
            ` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">💰 Movimentação Financeira</div>
            <div class="info-row">
              <span class="info-label">Valor Inicial (Fundo de Caixa):</span>
              <span class="info-value">R$ ${report.initialAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total de Vendas Realizadas:</span>
              <span class="info-value">R$ ${report.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Quantidade de Vendas:</span>
              <span class="info-value">${report.salesCount} venda(s)</span>
            </div>
            <div class="info-row">
              <span class="info-label">Valor Esperado em Caixa:</span>
              <span class="info-value">R$ ${report.expectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Valor Encontrado no Caixa:</span>
              <span class="info-value">R$ ${report.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div class="section total-section">
            <div class="section-title">📊 Resultado do Fechamento</div>
            <div class="total-row">
              <span class="info-label">Diferença (Encontrado - Esperado):</span>
              <span class="info-value ${report.difference >= 0 ? 'positive' : 'negative'}">
                R$ ${Math.abs(report.difference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                ${report.difference >= 0 ? ' (Sobra)' : ' (Falta)'}
              </span>
            </div>
            ${report.salesCount > 0 ? `
            <div class="info-row" style="margin-top: 15px;">
              <span class="info-label">Ticket Médio:</span>
              <span class="info-value">R$ ${(report.totalSales / report.salesCount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div>Relatório gerado automaticamente pelo Sistema PDV</div>
            <div style="margin-top: 10px;">PloutosLedger - Sistema de Gestão</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
  
  const handleCloseCashRegister = () => {
    const totalInCash = cashRegisterData.initialAmount + cashRegisterData.totalSales;
    const difference = totalInCash - cashRegisterData.totalReceived;
    
    // Salvar relatório de fechamento
    const closeReport = {
      id: `closure_${Date.now()}`,
      openedAt: cashRegisterData.openedAt,
      closedAt: new Date(),
      initialAmount: cashRegisterData.initialAmount,
      totalSales: cashRegisterData.totalSales,
      totalReceived: cashRegisterData.totalReceived,
      expectedAmount: totalInCash,
      difference: difference,
      salesCount: cashRegisterData.salesCount
    };
    
    // Salvar histórico de fechamentos
    const history = storageManager.get<any[]>('pdv_cash_closures', { defaultValue: [] }) || [];
    history.push(closeReport);
    storageManager.set('pdv_cash_closures', history);
    
    // Gerar e imprimir relatório
    printCashClosureReport(closeReport);
    
    // Limpar dados do caixa
    setCashRegisterOpen(false);
    setCashRegisterData({
      openedAt: null,
      initialAmount: 0,
      totalSales: 0,
      totalReceived: 0,
      salesCount: 0
    });
    setInitialCashAmount(0);
    setShowCloseCashModal(false);
    
    // Remover do storage
    storageManager.remove('pdv_cash_register');
    
    alert(`Caixa fechado com sucesso!\n\nRelatório impresso automaticamente.\n\nResumo:\nValor inicial: R$ ${cashRegisterData.initialAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nTotal de vendas: R$ ${cashRegisterData.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nValor esperado: R$ ${totalInCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nValor encontrado: R$ ${cashRegisterData.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nDiferença: R$ ${difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nVendas realizadas: ${cashRegisterData.salesCount}`);
  };
  
  const addToCart = (product: Product) => {
    // Verificar se caixa está aberto
    if (!cashRegisterOpen) {
      alert('Por favor, abra o caixa antes de realizar vendas.');
      setShowOpenCashModal(true);
      return;
    }
    
    // Verificar estoque antes de adicionar
    if (product.stock <= 0) {
      alert('Produto sem estoque!');
      return;
    }

    const existingItem = currentSale.find(item => item.product_id === product.id);
    const requestedQuantity = existingItem ? existingItem.quantity + 1 : 1;
    
    if (requestedQuantity > product.stock) {
      alert(`Estoque insuficiente! Disponível: ${product.stock} unidades`);
      return;
    }

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
        discount: 0,
        category: product.category
      };
      setCurrentSale(prev => [...prev, newItem]);
    }
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

  const calculateChange = () => {
    const total = calculateTotal();
    return cashReceived - total;
  };

  const finalizeSale = async () => {
    setIsProcessing(true);
    
    try {
      // Validar estoque antes de finalizar
      for (const item of currentSale) {
        const product = products.find(p => p.id === item.product_id);
        if (!product) {
          alert(`Produto ${item.product_name} não encontrado`);
          setIsProcessing(false);
          return;
        }
        if (product.stock < item.quantity) {
          alert(`Estoque insuficiente para ${item.product_name}. Disponível: ${product.stock}, Solicitado: ${item.quantity}`);
          setIsProcessing(false);
          return;
        }
      }

      // Calcular total antes de limpar
      const total = calculateTotal();
      const completedSale = {
        items: [...currentSale],
        total,
        customer: currentCustomer,
        paymentMethod: selectedPaymentMethod,
        date: new Date()
      };
      
      // Processar pagamento via gateway (se aplicável)
      if (selectedPaymentMethod && selectedPaymentMethod !== 'cash') {
        try {
          const paymentMethodMap: { [key: string]: string } = {
            'credit': 'credit_card',
            'debit': 'debit_card',
            'pix': 'pix',
            'boleto': 'boleto'
          };
          
          const gatewayMethod = paymentMethodMap[selectedPaymentMethod] || selectedPaymentMethod;
          
          // Criar cobrança no gateway (simulado para PIX/cartão)
          if (gatewayMethod === 'pix' || gatewayMethod === 'credit_card' || gatewayMethod === 'debit_card') {
            await paymentGatewayService.createLinkInvoice({
              amount: Math.round(total * 100), // Converter para centavos
              currency: 'brl',
              payment_method: gatewayMethod,
              customer_email: currentCustomer?.email || 'cliente@exemplo.com',
              customer_name: currentCustomer?.name || 'Cliente',
              description: `Venda PDV - ${currentSale.length} item(ns)`,
            });
          }
        } catch (error) {
          console.warn('Erro ao processar pagamento via gateway:', error);
          // Continuar mesmo se gateway falhar
        }
      }
      
      // Registrar saída de estoque para cada item
      for (const item of currentSale) {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          inventoryService.registerExit(
            item.product_id,
            item.quantity,
            `Venda finalizada - ${item.product_name}`,
            {
              previousStock: product.stock,
              reference: `Venda ${completedSale.date.toISOString()}`
            }
          );
          
          // Atualizar estoque do produto
          setProducts(prev => prev.map(p => 
            p.id === item.product_id 
              ? { ...p, stock: p.stock - item.quantity }
              : p
          ));
        }
      }
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Salvar venda para impressão
      setLastCompletedSale(completedSale);
      
      // Adicionar à lista de vendas
      const newSale = {
        id: `sale_${Date.now()}`,
        date: completedSale.date.toLocaleDateString('pt-BR'),
        customer: completedSale.customer?.name || 'Cliente Avulso',
        items: completedSale.items.length,
        total: completedSale.total,
        status: 'Concluída',
        paymentMethod: completedSale.paymentMethod
      };
      setSales(prev => [newSale, ...prev]);
      
      // Atualizar dados do caixa
      const updatedCashData = {
        ...cashRegisterData,
        totalSales: cashRegisterData.totalSales + completedSale.total,
        totalReceived: cashRegisterData.totalReceived + completedSale.total,
        salesCount: cashRegisterData.salesCount + 1
      };
      setCashRegisterData(updatedCashData);
      
      // Salvar atualização no storage
      const savedCash = storageManager.get<any>('pdv_cash_register', { defaultValue: {} });
      if (savedCash?.isOpen) {
        storageManager.set('pdv_cash_register', {
          ...savedCash,
          totalSales: updatedCashData.totalSales,
          totalReceived: updatedCashData.totalReceived,
          salesCount: updatedCashData.salesCount
        });
      }
      
      // Salvar venda no storage
      const currentSales = storageManager.get<any[]>('pdv_sales', { defaultValue: [] });
      storageManager.set('pdv_sales', [newSale, ...(currentSales || [])]);
      
      // Limpar carrinho
      setCurrentSale([]);
      setCurrentCustomer(null);
      setCustomerCpfCnpj('');
      setDiscountPercentage(0);
      setCashReceived(0);
      setChangeAmount(0);
      setSaleNotes('');
      setSelectedPaymentMethod('');
      
      setIsProcessing(false);
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda. Por favor, tente novamente.');
      setIsProcessing(false);
    }
  };

  const getPaymentMethodName = (method: string): string => {
    const methods: { [key: string]: string } = {
      'cash': 'Dinheiro',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'pix': 'PIX'
    };
    return methods[method] || method;
  };

  const handlePrintReceipt = () => {
    if (!lastCompletedSale) {
      alert('Nenhuma venda para imprimir.');
      return;
    }

    // Criar elemento de impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir o cupom.');
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cupom de Venda</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 5mm;
              }
              body { margin: 0; padding: 0; }
            }
            body {
              font-family: 'Courier New', monospace;
              padding: 15px;
              max-width: 80mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .date-time {
              font-size: 12px;
              margin-top: 5px;
            }
            .items {
              margin: 15px 0;
            }
            .item {
              margin-bottom: 10px;
              padding-bottom: 8px;
              border-bottom: 1px dotted #ccc;
            }
            .item-name {
              font-weight: bold;
              margin-bottom: 3px;
            }
            .item-details {
              font-size: 11px;
              display: flex;
              justify-content: space-between;
            }
            .total-section {
              border-top: 2px dashed #000;
              padding-top: 10px;
              margin-top: 15px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 14px;
            }
            .grand-total {
              font-size: 18px;
              font-weight: bold;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 15px;
              border-top: 2px dashed #000;
              font-size: 11px;
            }
            .payment-method {
              margin-top: 10px;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">PloutosLedger</div>
            <div>Cupom de Venda</div>
            <div class="date-time">
              ${lastCompletedSale.date.toLocaleString('pt-BR')}
            </div>
          </div>
          
          ${lastCompletedSale.customer ? `
            <div style="margin-bottom: 10px; font-size: 12px;">
              <strong>Cliente:</strong> ${lastCompletedSale.customer.name}<br>
              ${lastCompletedSale.customer.email ? `<strong>Email:</strong> ${lastCompletedSale.customer.email}<br>` : ''}
              ${lastCompletedSale.customer.phone ? `<strong>Telefone:</strong> ${lastCompletedSale.customer.phone}` : ''}
            </div>
          ` : ''}
          
          <div class="items">
            ${lastCompletedSale.items.map(item => `
              <div class="item">
                <div class="item-name">${item.product_name}</div>
                <div class="item-details">
                  <span>${item.quantity}x R$ ${item.unit_price.toFixed(2)}</span>
                  <span>R$ ${item.total_price.toFixed(2)}</span>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>R$ ${lastCompletedSale.items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)}</span>
            </div>
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>R$ ${lastCompletedSale.total.toFixed(2)}</span>
            </div>
            <div class="payment-method">
              <strong>Pagamento:</strong> ${getPaymentMethodName(lastCompletedSale.paymentMethod)}
            </div>
          </div>
          
          <div class="footer">
            Obrigado pela preferência!<br>
            Volte sempre!
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Memoizar função de cores para evitar recriação
  const getColorClasses = useCallback((color: string) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600 text-white',
      green: 'bg-green-500 hover:bg-green-600 text-white',
      amber: 'bg-amber-500 hover:bg-amber-600 text-white',
      orange: 'bg-orange-500 hover:bg-orange-600 text-white',
      emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      red: 'bg-red-500 hover:bg-red-600 text-white',
      cyan: 'bg-cyan-500 hover:bg-cyan-600 text-white',
      teal: 'bg-teal-500 hover:bg-teal-600 text-white',
      purple: 'bg-purple-500 hover:bg-purple-600 text-white',
      gray: 'bg-gray-500 hover:bg-gray-600 text-white',
      slate: 'bg-slate-500 hover:bg-slate-600 text-white'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  }, []);

  // Memoizar produtos filtrados para evitar recálculos desnecessários
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowerSearch = searchTerm.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(lowerSearch) ||
      product.category.toLowerCase().includes(lowerSearch) ||
      product.barcode?.toLowerCase().includes(lowerSearch)
    );
  }, [products, searchTerm]);

  const renderPOS = () => (
    <div className="h-full flex flex-col lg:flex-row gap-6 relative">
      {/* WebGL Background */}
      <Suspense fallback={null}>
        <WebGLBackground 
          intensity={0.15} 
          speed={0.5}
          colors={[[0.08, 0.12, 0.25], [0.12, 0.08, 0.2], [0.1, 0.12, 0.23]]}
        />
      </Suspense>
      
      {/* Indicador de Status do Caixa */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md ${cashRegisterOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className={`w-3 h-3 rounded-full ${cashRegisterOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium text-sm">
            {cashRegisterOpen ? 'Caixa Aberto' : 'Caixa Fechado'}
          </span>
        </div>
        {cashRegisterOpen && (
          <button
            onClick={() => setShowCloseCashModal(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm font-medium shadow-md"
          >
            <X className="w-4 h-4" />
            Fechar Caixa
          </button>
        )}
      </div>
      
      {/* Área de Produtos */}
      <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Produtos</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
              />
            </div>
            <button 
              onClick={handleCreateProduct}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center"
              title="Adicionar Novo Produto"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      </div>

      {/* Área do Carrinho */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Carrinho</h2>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-sm font-medium">
            {currentSale.length} itens
          </span>
        </div>

        <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
          {currentSale.map((item) => (
            <CartItem
              key={item.product_id}
              item={item}
              onRemove={removeFromCart}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </div>

        {/* Resumo da Venda */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">
              R$ {currentSale.reduce((total, item) => total + item.total_price, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Desconto:</span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                min="0"
                max="100"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
          </div>

          <div className="border-t pt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span className="text-emerald-600">
                R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3 pt-4">
            <button
              onClick={() => setShowCustomerModal(true)}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Cliente</span>
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={currentSale.length === 0 || isProcessing}
              className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              <span>{isProcessing ? 'Processando...' : 'Finalizar Venda'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleImportProducts = (importedProducts: Product[]) => {
    setProducts(prev => [...prev, ...importedProducts]);
    storageManager.set('pdv_products', [...products, ...importedProducts]);
    setShowImportModal(false);
    alert(`${importedProducts.length} produto(s) importado(s) com sucesso!`);
  };

  const handleStockAdjustment = () => {
    if (!selectedProductForAdjustment) return;
    
    const product = products.find(p => p.id === selectedProductForAdjustment.id);
    if (!product) return;

    let newStock = product.stock;
    switch (adjustmentData.type) {
      case 'add':
        newStock = product.stock + adjustmentData.quantity;
        break;
      case 'subtract':
        newStock = Math.max(0, product.stock - adjustmentData.quantity);
        break;
      case 'set':
        newStock = adjustmentData.quantity;
        break;
    }

    const updatedProducts = products.map(p =>
      p.id === product.id ? { ...p, stock: newStock } : p
    );
    setProducts(updatedProducts);
    storageManager.set('pdv_products', updatedProducts);
    
    // Salvar histórico de ajuste
    const adjustments = storageManager.get<any[]>('pdv_stock_adjustments', { defaultValue: [] }) || [];
    adjustments.push({
      id: `adj_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type: adjustmentData.type,
      quantity: adjustmentData.quantity,
      oldStock: product.stock,
      newStock: newStock,
      reason: adjustmentData.reason,
      date: new Date().toISOString()
    });
    storageManager.set('pdv_stock_adjustments', adjustments);

    setShowAdjustmentModal(false);
    setSelectedProductForAdjustment(null);
    setAdjustmentData({ type: 'add', quantity: 0, reason: '' });
    alert('Ajuste de estoque realizado com sucesso!');
  };

  const handleStockCount = () => {
    const updatedProducts = products.map(product => {
      const count = stockCounts.find(c => c.productId === product.id);
      if (count && count.countedStock !== count.currentStock) {
        return { ...product, stock: count.countedStock };
      }
      return product;
    });
    
    setProducts(updatedProducts);
    storageManager.set('pdv_products', updatedProducts);
    
    // Salvar histórico de contagem
    const counts = storageManager.get<any[]>('pdv_stock_counts', { defaultValue: [] }) || [];
    counts.push({
      id: `count_${Date.now()}`,
      date: new Date().toISOString(),
      items: stockCounts.map(c => ({
        productId: c.productId,
        productName: c.productName,
        currentStock: c.currentStock,
        countedStock: c.countedStock,
        difference: c.countedStock - c.currentStock
      }))
    });
    storageManager.set('pdv_stock_counts', counts);

    setShowCountModal(false);
    setStockCounts([]);
    alert('Contagem de estoque finalizada com sucesso!');
  };

  const renderProducts = () => {
    const renderProductList = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Lista de Produtos</h3>
          <button 
            onClick={handleCreateProduct}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-center mb-4">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg mx-auto mb-3 border border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-20 h-20 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg mx-auto mb-3 flex items-center justify-center ${product.image ? 'hidden' : ''}`}>
                  <Package className="w-10 h-10 text-white" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2">{product.name}</h3>
                <p className="text-emerald-600 font-bold text-xl mb-1">
                  R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mb-3">{product.category}</p>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estoque:</span>
                  <span className="font-medium">{product.stock}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Código:</span>
                  <span className="font-medium">{product.barcode || 'N/A'}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button 
                  onClick={() => handleEditProduct(product)}
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded text-sm hover:bg-blue-200 transition-colors"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteProduct(product.id)}
                  className="flex-1 px-3 py-2 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Tabs de Navegação */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setProductsSubTab('list')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                productsSubTab === 'list'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Lista de Produtos
            </button>
            <button
              onClick={() => setProductsSubTab('import')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                productsSubTab === 'import'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Importar Produtos
            </button>
            <button
              onClick={() => setProductsSubTab('labels')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                productsSubTab === 'labels'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <QrCode className="w-4 h-4 inline mr-2" />
              Código/Etiquetas
            </button>
            <button
              onClick={() => setProductsSubTab('adjustments')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                productsSubTab === 'adjustments'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Ajustes de Quantidades
            </button>
            <button
              onClick={() => setProductsSubTab('count')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                productsSubTab === 'count'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Contagem de Estoque
            </button>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {productsSubTab === 'list' && renderProductList()}
        
        {productsSubTab === 'import' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Importar Produtos</h3>
            <div className="space-y-4">
              <p className="text-gray-600">Importe produtos de um arquivo CSV ou JSON</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Arraste e solte um arquivo aqui ou</p>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  Selecionar Arquivo
                </button>
                <p className="text-sm text-gray-500 mt-2">Formatos suportados: CSV, JSON</p>
              </div>
            </div>
          </div>
        )}

        {productsSubTab === 'labels' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Código/Etiquetas</h3>
              <button
                onClick={() => setShowLabelModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>Gerar Etiquetas</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{product.name}</span>
                    <button
                      onClick={() => {
                        setSelectedProductForLabel(product);
                        setShowLabelModal(true);
                      }}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">Código: {product.barcode || 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {productsSubTab === 'adjustments' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Ajustes de Quantidades</h3>
              <button
                onClick={() => setShowAdjustmentModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Ajuste</span>
              </button>
            </div>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">Estoque atual: {product.stock}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProductForAdjustment(product);
                      setShowAdjustmentModal(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Ajustar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {productsSubTab === 'count' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Contagem de Estoque</h3>
              <button
                onClick={() => {
                  setStockCounts(products.map(p => ({
                    productId: p.id,
                    productName: p.name,
                    currentStock: p.stock,
                    countedStock: p.stock
                  })));
                  setShowCountModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Contagem de Estoque</span>
              </button>
            </div>
            <p className="text-gray-600 mb-4">Inicie uma nova contagem de estoque para verificar as quantidades físicas dos produtos.</p>
          </div>
        )}
      </div>
    );
  };

  const renderCashManagement = () => {
    const closuresHistory = (storageManager.get<any[]>('pdv_cash_closures', { defaultValue: [] }) || []).reverse();
    const totalClosures = closuresHistory.length;
    const totalSalesAmount = closuresHistory.reduce((sum: number, c: any) => sum + (c.totalSales || 0), 0);
    const totalSalesCount = closuresHistory.reduce((sum: number, c: any) => sum + (c.salesCount || 0), 0);
    const averageTicket = totalSalesCount > 0 ? totalSalesAmount / totalSalesCount : 0;
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Gerenciamento de Caixa</h2>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-lg ${cashRegisterOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${cashRegisterOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">
                  {cashRegisterOpen ? 'Caixa Aberto' : 'Caixa Fechado'}
                </span>
              </div>
            </div>
            {cashRegisterOpen ? (
              <button
                onClick={() => setShowCloseCashModal(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Fechar Caixa
              </button>
            ) : (
              <button
                onClick={() => setShowOpenCashModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Abrir Caixa
              </button>
            )}
          </div>
        </div>

        {/* Status do Caixa Atual */}
        {cashRegisterOpen && (
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Status do Caixa Atual</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-emerald-100 text-sm">Valor Inicial</p>
                <p className="text-2xl font-bold">R$ {cashRegisterData.initialAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-sm">Total de Vendas</p>
                <p className="text-2xl font-bold">R$ {cashRegisterData.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-sm">Vendas Realizadas</p>
                <p className="text-2xl font-bold">{cashRegisterData.salesCount}</p>
              </div>
              <div>
                <p className="text-emerald-100 text-sm">Valor em Caixa</p>
                <p className="text-2xl font-bold">R$ {(cashRegisterData.initialAmount + cashRegisterData.totalSales).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            {cashRegisterData.openedAt && (
              <div className="mt-4 text-sm text-emerald-100">
                Aberto em: {cashRegisterData.openedAt.toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        )}

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Fechamentos</p>
                <p className="text-2xl font-bold text-gray-800">{totalClosures}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total em Vendas</p>
                <p className="text-2xl font-bold text-gray-800">R$ {totalSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-800">R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Vendas</p>
                <p className="text-2xl font-bold text-gray-800">{totalSalesCount}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Histórico de Fechamentos */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Histórico de Fechamentos</h3>
            {closuresHistory.length > 0 && (
              <button
                onClick={() => {
                  const csv = [
                    ['Data Abertura', 'Data Fechamento', 'Valor Inicial', 'Total Vendas', 'Valor Esperado', 'Valor Encontrado', 'Diferença', 'Qtd Vendas'],
                    ...closuresHistory.map((c: any) => [
                      c.openedAt ? new Date(c.openedAt).toLocaleString('pt-BR') : '',
                      c.closedAt ? new Date(c.closedAt).toLocaleString('pt-BR') : '',
                      c.initialAmount.toFixed(2),
                      c.totalSales.toFixed(2),
                      c.expectedAmount.toFixed(2),
                      c.totalReceived.toFixed(2),
                      c.difference.toFixed(2),
                      c.salesCount
                    ])
                  ].map(row => row.join(',')).join('\n');
                  
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  link.href = URL.createObjectURL(blob);
                  link.download = `fechamentos_caixa_${new Date().toISOString().split('T')[0]}.csv`;
                  link.click();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            )}
          </div>
          
          {closuresHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum fechamento de caixa registrado ainda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Inicial</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Vendas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Esperado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Encontrado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diferença</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendas</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {closuresHistory.map((closure: any) => (
                    <tr key={closure.id || closure.closedAt} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {closure.closedAt ? new Date(closure.closedAt).toLocaleString('pt-BR') : 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        R$ {closure.initialAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        R$ {closure.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        R$ {closure.expectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        R$ {closure.totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${closure.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {Math.abs(closure.difference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {closure.difference >= 0 ? ' (Sobra)' : ' (Falta)'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {closure.salesCount}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => printCashClosureReport(closure)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          title="Reimprimir Relatório"
                        >
                          <Printer className="w-4 h-4" />
                          Imprimir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCustomers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gestão de Clientes</h2>
        <button 
          onClick={handleCreateCustomer}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <div key={customer.id} className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white relative group">
              <div className="absolute top-2 right-2 flex gap-2 opacity-100 transition-opacity z-10">
                <button 
                  onClick={() => handleEditCustomer(customer)}
                  className="p-2 bg-white/30 rounded-lg hover:bg-white/40 transition-colors shadow-lg"
                  title="Editar"
                >
                  <Edit className="w-4 h-4 text-white" />
                </button>
                <button 
                  onClick={() => handleDeleteCustomer(customer.id)}
                  className="p-2 bg-red-500/70 rounded-lg hover:bg-red-500/90 transition-colors shadow-lg"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <span className="bg-blue-400 px-2 py-1 rounded-full text-xs">VIP</span>
              </div>
              <h3 className="font-bold text-lg mb-2">{customer.name}</h3>
              <p className="text-blue-100 text-sm mb-1">{customer.email}</p>
              <p className="text-blue-100 text-sm mb-3">{customer.phone}</p>
              <div className="flex justify-between text-sm">
                <span>Pontos:</span>
                <span className="font-bold">{customer.points || 0}</span>
              </div>
            </div>
          ))}
          {/* Cliente Demo (mantido para referência visual quando não há clientes) */}
          {customers.length === 0 && (
            <>
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="bg-blue-400 px-2 py-1 rounded-full text-xs">VIP</span>
                </div>
                <h3 className="font-bold text-lg mb-2">João Silva</h3>
                <p className="text-blue-100 text-sm mb-1">joao@email.com</p>
                <p className="text-blue-100 text-sm mb-3">(11) 99999-9999</p>
                <div className="flex justify-between text-sm">
                  <span>Pontos:</span>
                  <span className="font-bold">1,250</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="bg-green-400 px-2 py-1 rounded-full text-xs">Regular</span>
                </div>
                <h3 className="font-bold text-lg mb-2">Maria Santos</h3>
                <p className="text-green-100 text-sm mb-1">maria@email.com</p>
                <p className="text-green-100 text-sm mb-3">(11) 88888-8888</p>
                <div className="flex justify-between text-sm">
                  <span>Pontos:</span>
                  <span className="font-bold">750</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const handleAddSale = (saleData: any) => {
    const newSale = {
      id: `sale_${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR'),
      customer: saleData.customer || 'Cliente Avulso',
      items: saleData.items?.length || 0,
      total: saleData.total || 0,
      status: 'Concluída',
      paymentMethod: saleData.paymentMethod || 'cash',
      itemsList: saleData.items || []
    };
    setSales(prev => [newSale, ...prev]);
    setShowAddSaleModal(false);
    alert('Venda adicionada com sucesso!');
  };

  const handleImportSales = (importedSales: any[]) => {
    setSales(prev => [...prev, ...importedSales]);
    setShowImportSalesModal(false);
    alert(`${importedSales.length} venda(s) importada(s) com sucesso!`);
  };

  const renderSales = () => {
    const renderSalesList = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Lista de Vendas</h3>
          <div className="flex space-x-2">
            <button 
              onClick={handleExportSales}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Exportar</span>
            </button>
            <button 
              onClick={handlePrintSales}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma venda registrada ainda.
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.customer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sale.items}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        R$ {typeof sale.total === 'number' ? sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : sale.total}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {sale.paymentMethod === 'cash' ? 'Dinheiro' : 
                         sale.paymentMethod === 'credit_card' ? 'Cartão Crédito' :
                         sale.paymentMethod === 'debit_card' ? 'Cartão Débito' :
                         sale.paymentMethod === 'pix' ? 'PIX' : sale.paymentMethod || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => handleViewSale(sale.id)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                        <button 
                          onClick={() => handleReprintSale(sale.id)}
                          className="text-emerald-600 hover:text-emerald-800"
                        >
                          <Printer className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        {/* Tabs de Navegação */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setSalesSubTab('list')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                salesSubTab === 'list'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Receipt className="w-4 h-4 inline mr-2" />
              Lista de Vendas
            </button>
            <button
              onClick={() => setSalesSubTab('pdv')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                salesSubTab === 'pdv'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              Vendas no PDV
            </button>
            <button
              onClick={() => {
                setSalesSubTab('add');
                setShowAddSaleModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                salesSubTab === 'add'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Adicionar Venda
            </button>
            <button
              onClick={() => {
                setSalesSubTab('import');
                setShowImportSalesModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                salesSubTab === 'import'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Adicionar Vendas por CSV
            </button>
            <button
              onClick={() => setSalesSubTab('deliveries')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                salesSubTab === 'deliveries'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Truck className="w-4 h-4 inline mr-2" />
              Entregas
            </button>
            <button
              onClick={() => setSalesSubTab('coupons')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                salesSubTab === 'coupons'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tag className="w-4 h-4 inline mr-2" />
              Cupons de Desconto
            </button>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {salesSubTab === 'list' && renderSalesList()}
        
        {salesSubTab === 'pdv' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Vendas no PDV</h3>
              <button
                onClick={() => setActiveTab('pos')}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Abrir PDV</span>
              </button>
            </div>
            <p className="text-gray-600 mb-4">Acesse o PDV para realizar vendas em tempo real.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <Info className="w-4 h-4 inline mr-2" />
                As vendas realizadas no PDV aparecerão automaticamente na lista de vendas.
              </p>
            </div>
          </div>
        )}

        {salesSubTab === 'deliveries' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Entregas</h3>
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Entrega</span>
              </button>
            </div>
            <div className="space-y-4">
              {deliveries.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma entrega registrada.</p>
                </div>
              ) : (
                deliveries.map((delivery) => (
                  <div key={delivery.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{delivery.customerName}</p>
                        <p className="text-sm text-gray-600">{delivery.address}</p>
                        <p className="text-sm text-gray-600">{delivery.phone}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        delivery.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        delivery.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                        delivery.status === 'out_for_delivery' ? 'bg-purple-100 text-purple-800' :
                        delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {delivery.status === 'pending' ? 'Pendente' :
                         delivery.status === 'preparing' ? 'Preparando' :
                         delivery.status === 'out_for_delivery' ? 'Saiu para Entrega' :
                         delivery.status === 'delivered' ? 'Entregue' :
                         'Cancelada'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {salesSubTab === 'coupons' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Cupons de Desconto</h3>
              <button
                onClick={() => setShowCouponModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cupom</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum cupom cadastrado.</p>
                </div>
              ) : (
                coupons.map((coupon) => (
                  <div key={coupon.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-lg">{coupon.code}</span>
                      <span className={`px-2 py-1 rounded text-xs ${coupon.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${coupon.value.toFixed(2)}`} de desconto
                    </p>
                    <p className="text-xs text-gray-500">
                      Válido até: {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}
                    </p>
                    {coupon.usageLimit && (
                      <p className="text-xs text-gray-500">
                        Usado: {coupon.usedCount} / {coupon.usageLimit}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleAddQuotation = () => {
    if (!quotationFormData.supplierId || quotationFormData.items.length === 0) {
      alert('Preencha o fornecedor e adicione pelo menos um item.');
      return;
    }

    const supplier = suppliers.find(s => s.id === quotationFormData.supplierId);
    const subtotal = quotationFormData.items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - quotationFormData.discount;

    const newQuotation = {
      id: `quot_${Date.now()}`,
      number: `COT-${Date.now().toString().slice(-6)}`,
      supplierId: quotationFormData.supplierId,
      supplierName: supplier?.name || 'Fornecedor',
      date: new Date().toLocaleDateString('pt-BR'),
      validUntil: quotationFormData.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      status: 'pending' as const,
      items: quotationFormData.items,
      subtotal: subtotal,
      discount: quotationFormData.discount,
      total: total,
      notes: quotationFormData.notes
    };

    setQuotations(prev => [newQuotation, ...prev]);
    storageManager.set('pdv_quotations', [newQuotation, ...quotations]);
    
    setShowQuotationModal(false);
    setQuotationFormData({
      supplierId: '',
      validUntil: '',
      items: [],
      discount: 0,
      notes: ''
    });
    alert('Cotação adicionada com sucesso!');
  };

  const renderQuotations = () => {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Cotações</h2>
          <button
            onClick={() => setShowQuotationModal(true)}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Cotação</span>
          </button>
        </div>

        {/* Lista de Cotações */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Válido até</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Itens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma cotação registrada ainda.
                    </td>
                  </tr>
                ) : (
                  quotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{quotation.number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{quotation.supplierName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{quotation.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{quotation.validUntil}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{quotation.items.length}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">
                        R$ {quotation.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          quotation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          quotation.status === 'approved' ? 'bg-green-100 text-green-800' :
                          quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {quotation.status === 'pending' ? 'Pendente' :
                           quotation.status === 'approved' ? 'Aprovada' :
                           quotation.status === 'rejected' ? 'Rejeitada' :
                           'Expirada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              printWindow.document.write(`
                                <html>
                                  <head><title>Cotacao - ${quotation.number}</title></head>
                                  <body style="font-family: Arial; padding: 20px;">
                                    <h1>Cotacao ${quotation.number}</h1>
                                    <p><strong>Fornecedor:</strong> ${quotation.supplierName}</p>
                                    <p><strong>Data:</strong> ${quotation.date}</p>
                                    <p><strong>Valido ate:</strong> ${quotation.validUntil}</p>
                                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                                      <thead>
                                        <tr style="background: #f3f4f6;">
                                          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Produto</th>
                                          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Quantidade</th>
                                          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Preco Unit.</th>
                                          <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${quotation.items.map(item => `
                                          <tr>
                                            <td style="padding: 10px; border: 1px solid #ddd;">${item.productName}</td>
                                            <td style="padding: 10px; border: 1px solid #ddd;">${item.quantity}</td>
                                            <td style="padding: 10px; border: 1px solid #ddd;">R$ ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                            <td style="padding: 10px; border: 1px solid #ddd;">R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                          </tr>
                                        `).join('')}
                                      </tbody>
                                    </table>
                                    <p><strong>Subtotal:</strong> R$ ${quotation.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <p><strong>Desconto:</strong> R$ ${quotation.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <p><strong>Total:</strong> R$ ${quotation.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              setTimeout(() => printWindow.print(), 250);
                            }
                          }}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Printer className="w-4 h-4 inline" />
                        </button>
                        <button 
                          onClick={() => {
                            const quotationToView = quotations.find(q => q.id === quotation.id);
                            if (quotationToView) {
                              alert(`Cotação ${quotationToView.number}\nFornecedor: ${quotationToView.supplierName}\nTotal: R$ ${quotationToView.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
                            }
                          }}
                          className="text-emerald-600 hover:text-emerald-800"
                        >
                          <Eye className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const handleAddPurchase = () => {
    if (!purchaseFormData.supplierId || purchaseFormData.items.length === 0) {
      alert('Preencha o fornecedor e adicione pelo menos um item.');
      return;
    }

    const supplier = suppliers.find(s => s.id === purchaseFormData.supplierId);
    const subtotal = purchaseFormData.items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - purchaseFormData.discount;

    const newPurchase = {
      id: `purch_${Date.now()}`,
      number: `COMP-${Date.now().toString().slice(-6)}`,
      supplierId: purchaseFormData.supplierId,
      supplierName: supplier?.name || 'Fornecedor',
      date: new Date().toLocaleDateString('pt-BR'),
      items: purchaseFormData.items,
      subtotal: subtotal,
      discount: purchaseFormData.discount,
      total: total,
      paymentMethod: purchaseFormData.paymentMethod,
      notes: purchaseFormData.notes
    };

    setPurchases(prev => [newPurchase, ...prev]);
    storageManager.set('pdv_purchases', [newPurchase, ...purchases]);
    
    // Atualizar estoque dos produtos
    purchaseFormData.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const updatedProducts = products.map(p =>
          p.id === product.id ? { ...p, stock: p.stock + item.quantity } : p
        );
        setProducts(updatedProducts);
        storageManager.set('pdv_products', updatedProducts);
      }
    });
    
    setShowPurchaseModal(false);
    setPurchaseFormData({
      supplierId: '',
      items: [],
      discount: 0,
      paymentMethod: 'cash',
      notes: ''
    });
    alert('Compra adicionada com sucesso!');
  };

  const handleAddExpense = () => {
    if (!expenseFormData.description || !expenseFormData.category || expenseFormData.amount <= 0) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    const newExpense = {
      id: `exp_${Date.now()}`,
      description: expenseFormData.description,
      category: expenseFormData.category,
      amount: expenseFormData.amount,
      date: new Date().toLocaleDateString('pt-BR'),
      paymentMethod: expenseFormData.paymentMethod,
      notes: expenseFormData.notes
    };

    setExpenses(prev => [newExpense, ...prev]);
    storageManager.set('pdv_expenses', [newExpense, ...expenses]);
    
    setShowExpenseModal(false);
    setExpenseFormData({
      description: '',
      category: '',
      amount: 0,
      paymentMethod: 'cash',
      notes: ''
    });
    alert('Despesa adicionada com sucesso!');
  };

  const handleAddTransfer = () => {
    if (!transferFormData.fromStoreId || !transferFormData.toStoreId || transferFormData.items.length === 0) {
      alert('Preencha as lojas de origem e destino e adicione pelo menos um item.');
      return;
    }

    const fromStore = stores.find(s => s.id === transferFormData.fromStoreId);
    const toStore = stores.find(s => s.id === transferFormData.toStoreId);

    const newTransfer = {
      id: `trans_${Date.now()}`,
      number: `TRANS-${Date.now().toString().slice(-6)}`,
      fromStoreId: transferFormData.fromStoreId,
      fromStoreName: fromStore?.name || 'Loja Origem',
      toStoreId: transferFormData.toStoreId,
      toStoreName: toStore?.name || 'Loja Destino',
      date: new Date().toLocaleDateString('pt-BR'),
      items: transferFormData.items,
      status: 'pending' as const,
      notes: transferFormData.notes
    };

    setTransfers(prev => [newTransfer, ...prev]);
    storageManager.set('pdv_transfers', [newTransfer, ...transfers]);
    
    setShowTransferModal(false);
    setTransferFormData({
      fromStoreId: '',
      toStoreId: '',
      items: [],
      notes: ''
    });
    alert('Transferência adicionada com sucesso!');
  };

  const renderPurchases = () => {
    const renderPurchasesList = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Lista de Compras</h3>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhuma compra registrada.</td>
                  </tr>
                ) : (
                  purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{purchase.number}</td>
                      <td className="px-6 py-4 text-sm">{purchase.supplierName}</td>
                      <td className="px-6 py-4 text-sm">{purchase.date}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-600">
                        R$ {purchase.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm">{purchase.paymentMethod === 'cash' ? 'Dinheiro' : purchase.paymentMethod === 'credit_card' ? 'Cartão' : 'PIX'}</td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4 inline" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setPurchasesSubTab('list')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                purchasesSubTab === 'list' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Lista de Compras
            </button>
            <button
              onClick={() => {
                setPurchasesSubTab('add');
                setShowPurchaseModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                purchasesSubTab === 'add' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Adicionar Compra
            </button>
            <button
              onClick={() => {
                setPurchasesSubTab('import');
                setShowImportPurchaseModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                purchasesSubTab === 'import' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Adic. Compra por CSV
            </button>
            <button
              onClick={() => setPurchasesSubTab('expenses')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                purchasesSubTab === 'expenses' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Listar Despesas
            </button>
            <button
              onClick={() => {
                setPurchasesSubTab('addExpense');
                setShowExpenseModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                purchasesSubTab === 'addExpense' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Adicionar Despesa
            </button>
          </div>
        </div>

        {purchasesSubTab === 'list' && renderPurchasesList()}
        
        {purchasesSubTab === 'expenses' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Lista de Despesas</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma despesa registrada.</td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">{expense.description}</td>
                        <td className="px-6 py-4 text-sm">{expense.category}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-red-600">
                          R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm">{expense.date}</td>
                        <td className="px-6 py-4 text-sm">{expense.paymentMethod === 'cash' ? 'Dinheiro' : expense.paymentMethod === 'credit_card' ? 'Cartão' : 'PIX'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTransfers = () => {
    const renderTransfersList = () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Lista de Transferências</h3>
        </div>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">De</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Para</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Itens</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Nenhuma transferência registrada.</td>
                  </tr>
                ) : (
                  transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">{transfer.number}</td>
                      <td className="px-6 py-4 text-sm">{transfer.fromStoreName}</td>
                      <td className="px-6 py-4 text-sm">{transfer.toStoreName}</td>
                      <td className="px-6 py-4 text-sm">{transfer.date}</td>
                      <td className="px-6 py-4 text-sm">{transfer.items.length}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          transfer.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                          transfer.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {transfer.status === 'pending' ? 'Pendente' :
                           transfer.status === 'in_transit' ? 'Em Trânsito' :
                           transfer.status === 'completed' ? 'Concluída' :
                           'Cancelada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button className="text-blue-600 hover:text-blue-800"><Eye className="w-4 h-4 inline" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setTransfersSubTab('list')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                transfersSubTab === 'list' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Lista de Transferências
            </button>
            <button
              onClick={() => {
                setTransfersSubTab('add');
                setShowTransferModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                transfersSubTab === 'add' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Adic. Transferência
            </button>
            <button
              onClick={() => {
                setTransfersSubTab('import');
                setShowImportTransferModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                transfersSubTab === 'import' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Adic. Transfer. por CSV
            </button>
          </div>
        </div>

        {transfersSubTab === 'list' && renderTransfersList()}
      </div>
    );
  };

  const handleAddUser = () => {
    if (!userFormData.name || !userFormData.email) {
      alert('Preencha nome e email.');
      return;
    }

    const newUser = {
      id: `user_${Date.now()}`,
      name: userFormData.name,
      email: userFormData.email,
      phone: userFormData.phone,
      role: userFormData.role,
      status: userFormData.status,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    if (editingUser) {
      setSystemUsers(prev => prev.map(u => u.id === editingUser.id ? newUser : u));
      alert('Usuário atualizado com sucesso!');
    } else {
      setSystemUsers(prev => [newUser, ...prev]);
      alert('Usuário adicionado com sucesso!');
    }
    
    storageManager.set('pdv_users', editingUser ? systemUsers.map(u => u.id === editingUser.id ? newUser : u) : [newUser, ...systemUsers]);
    setShowUserModal(false);
    setEditingUser(null);
    setUserFormData({ name: '', email: '', phone: '', role: 'cashier', status: 'active' });
  };

  const handleAddSeller = () => {
    if (!sellerFormData.name || !sellerFormData.email || !sellerFormData.cpf) {
      alert('Preencha nome, email e CPF.');
      return;
    }

    const newSeller = {
      id: `seller_${Date.now()}`,
      name: sellerFormData.name,
      email: sellerFormData.email,
      phone: sellerFormData.phone,
      cpf: sellerFormData.cpf.replace(/\D/g, ''),
      commission: sellerFormData.commission,
      status: sellerFormData.status,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    if (editingSeller) {
      setSellers(prev => prev.map(s => s.id === editingSeller.id ? newSeller : s));
      alert('Vendedor atualizado com sucesso!');
    } else {
      setSellers(prev => [newSeller, ...prev]);
      alert('Vendedor adicionado com sucesso!');
    }
    
    storageManager.set('pdv_sellers', editingSeller ? sellers.map(s => s.id === editingSeller.id ? newSeller : s) : [newSeller, ...sellers]);
    setShowSellerModal(false);
    setEditingSeller(null);
    setSellerFormData({ name: '', email: '', phone: '', cpf: '', commission: 0, status: 'active' });
  };

  const handleAddBaby = () => {
    if (!babyFormData.name || !babyFormData.birthDate || !babyFormData.parentName || !babyFormData.parentPhone) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    const newBaby = {
      id: `baby_${Date.now()}`,
      name: babyFormData.name,
      birthDate: babyFormData.birthDate,
      gender: babyFormData.gender,
      parentName: babyFormData.parentName,
      parentPhone: babyFormData.parentPhone.replace(/\D/g, ''),
      parentEmail: babyFormData.parentEmail,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };

    setBabies(prev => [newBaby, ...prev]);
    storageManager.set('pdv_babies', [newBaby, ...babies]);
    setShowBabyModal(false);
    setBabyFormData({ name: '', birthDate: '', gender: 'male', parentName: '', parentPhone: '', parentEmail: '' });
    alert('Bebê adicionado com sucesso!');
  };

  const renderUsers = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setUsersSubTab('users')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                usersSubTab === 'users' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Lista de Usuários
            </button>
            <button
              onClick={() => {
                setUsersSubTab('addUser');
                setEditingUser(null);
                setUserFormData({ name: '', email: '', phone: '', role: 'cashier', status: 'active' });
                setShowUserModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                usersSubTab === 'addUser' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Usuário
            </button>
            <button
              onClick={() => setUsersSubTab('sellers')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                usersSubTab === 'sellers' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Lista de Vendedores
            </button>
            <button
              onClick={() => {
                setUsersSubTab('addSeller');
                setEditingSeller(null);
                setSellerFormData({ name: '', email: '', phone: '', cpf: '', commission: 0, status: 'active' });
                setShowSellerModal(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                usersSubTab === 'addSeller' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Vendedor
            </button>
            <button
              onClick={() => setUsersSubTab('customers')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                usersSubTab === 'customers' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Lista de Clientes
            </button>
            <button
              onClick={() => {
                setUsersSubTab('addCustomer');
                setEditingCustomer(null);
                setCustomerFormData({ name: '', email: '', phone: '', cpf: '', points: 0 });
                setShowCustomerModalForm(true);
              }}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                usersSubTab === 'addCustomer' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Cliente
            </button>
            <button
              onClick={() => setUsersSubTab('babies')}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                usersSubTab === 'babies' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className="w-4 h-4 inline mr-2" />
              Lista de Bebês
            </button>
          </div>
        </div>

        {usersSubTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Lista de Usuários</h3>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserFormData({ name: '', email: '', phone: '', role: 'cashier', status: 'active' });
                  setShowUserModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Usuário</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {systemUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum usuário registrado.</td>
                    </tr>
                  ) : (
                    systemUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                        <td className="px-6 py-4 text-sm">{user.email}</td>
                        <td className="px-6 py-4 text-sm">{user.phone || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">
                          {user.role === 'admin' ? 'Administrador' :
                           user.role === 'manager' ? 'Gerente' :
                           user.role === 'cashier' ? 'Caixa' :
                           'Vendedor'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setUserFormData({
                                name: user.name,
                                email: user.email,
                                phone: user.phone,
                                role: user.role,
                                status: user.status
                              });
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir este usuário?')) {
                                setSystemUsers(prev => prev.filter(u => u.id !== user.id));
                                storageManager.set('pdv_users', systemUsers.filter(u => u.id !== user.id));
                                alert('Usuário excluído com sucesso!');
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {usersSubTab === 'sellers' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Lista de Vendedores</h3>
              <button
                onClick={() => {
                  setEditingSeller(null);
                  setSellerFormData({ name: '', email: '', phone: '', cpf: '', commission: 0, status: 'active' });
                  setShowSellerModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Vendedor</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comissão</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sellers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum vendedor registrado.</td>
                    </tr>
                  ) : (
                    sellers.map((seller) => (
                      <tr key={seller.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{seller.name}</td>
                        <td className="px-6 py-4 text-sm">{seller.email}</td>
                        <td className="px-6 py-4 text-sm">{formatCPF(seller.cpf)}</td>
                        <td className="px-6 py-4 text-sm">{seller.commission}%</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            seller.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {seller.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => {
                              setEditingSeller(seller);
                              setSellerFormData({
                                name: seller.name,
                                email: seller.email,
                                phone: seller.phone,
                                cpf: seller.cpf,
                                commission: seller.commission,
                                status: seller.status
                              });
                              setShowSellerModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir este vendedor?')) {
                                setSellers(prev => prev.filter(s => s.id !== seller.id));
                                storageManager.set('pdv_sellers', sellers.filter(s => s.id !== seller.id));
                                alert('Vendedor excluído com sucesso!');
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {usersSubTab === 'customers' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Lista de Clientes</h3>
              <button
                onClick={() => {
                  setEditingCustomer(null);
                  setCustomerFormData({ name: '', email: '', phone: '', cpf: '', points: 0 });
                  setShowCustomerModalForm(true);
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cliente</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pontos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum cliente registrado.</td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{customer.name}</td>
                        <td className="px-6 py-4 text-sm">{customer.email || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">{customer.phone || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">{customer.cpf ? formatCPF(customer.cpf) : 'N/A'}</td>
                        <td className="px-6 py-4 text-sm">{customer.points || 0}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {usersSubTab === 'babies' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Lista de Bebês</h3>
              <button
                onClick={() => {
                  setBabyFormData({ name: '', birthDate: '', gender: 'male', parentName: '', parentPhone: '', parentEmail: '' });
                  setShowBabyModal(true);
                }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Bebê</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data de Nascimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gênero</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {babies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum bebê registrado.</td>
                    </tr>
                  ) : (
                    babies.map((baby) => (
                      <tr key={baby.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium">{baby.name}</td>
                        <td className="px-6 py-4 text-sm">{new Date(baby.birthDate).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-sm">{baby.gender === 'male' ? 'Masculino' : 'Feminino'}</td>
                        <td className="px-6 py-4 text-sm">{baby.parentName}</td>
                        <td className="px-6 py-4 text-sm">{formatPhone(baby.parentPhone)}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => {
                              setBabyFormData({
                                name: baby.name,
                                birthDate: baby.birthDate,
                                gender: baby.gender,
                                parentName: baby.parentName,
                                parentPhone: baby.parentPhone,
                                parentEmail: baby.parentEmail || ''
                              });
                              setShowBabyModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 mr-3"
                          >
                            <Edit className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Tem certeza que deseja excluir este registro?')) {
                                setBabies(prev => prev.filter(b => b.id !== baby.id));
                                storageManager.set('pdv_babies', babies.filter(b => b.id !== baby.id));
                                alert('Registro excluído com sucesso!');
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Calcular métricas do dashboard dinamicamente
  const dashboardMetrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    // Vendas de hoje
    const todaySales = sales.filter((sale: any) => {
      if (!sale.date && !sale.createdAt) return false;
      const saleDate = sale.date ? new Date(sale.date.split('/').reverse().join('-')) : new Date(sale.createdAt);
      return saleDate >= today && saleDate <= todayEnd;
    });
    const todayTotal = todaySales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0);
    
    // Vendas do mês
    const monthSales = sales.filter((sale: any) => {
      if (!sale.date && !sale.createdAt) return false;
      const saleDate = sale.date ? new Date(sale.date.split('/').reverse().join('-')) : new Date(sale.createdAt);
      return saleDate >= thisMonth;
    });
    
    // Produtos vendidos no mês
    const productsSoldThisMonth = monthSales.reduce((sum: number, sale: any) => {
      if (sale.items && Array.isArray(sale.items)) {
        return sum + sale.items.reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
      }
      return sum + (sale.items || 0);
    }, 0);
    
    // Ticket médio
    const averageTicket = sales.length > 0 
      ? sales.reduce((sum: number, sale: any) => sum + (sale.total || 0), 0) / sales.length 
      : 0;
    
    // Clientes únicos
    const uniqueCustomers = new Set(sales.map((sale: any) => sale.customer_id || sale.customer).filter(Boolean));
    
    return {
      todayTotal,
      productsSoldThisMonth,
      averageTicket,
      activeCustomers: uniqueCustomers.size
    };
  }, [sales]);

  const renderReports = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Relatórios e Analytics</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleExportSales}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
          <button 
            onClick={handlePrintSales}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center space-x-2 text-sm"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-blue-100 text-xs sm:text-sm">Vendas Hoje</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
                R$ {dashboardMetrics.todayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-blue-200 text-xs sm:text-sm">Total do dia</p>
            </div>
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-blue-200 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-green-100 text-xs sm:text-sm">Produtos Vendidos</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{dashboardMetrics.productsSoldThisMonth}</p>
              <p className="text-green-200 text-xs sm:text-sm">Este mês</p>
            </div>
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-green-200 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-purple-100 text-xs sm:text-sm">Ticket Médio</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
                R$ {dashboardMetrics.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-purple-200 text-xs sm:text-sm">Média geral</p>
            </div>
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-200 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-orange-100 text-xs sm:text-sm">Clientes Ativos</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{dashboardMetrics.activeCustomers}</p>
              <p className="text-orange-200 text-xs sm:text-sm">Total cadastrado</p>
            </div>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-200 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Produtos Mais Vendidos</h3>
          <div className="space-y-3">
            {(() => {
              // Calcular produtos mais vendidos
              const productSales: Record<string, { name: string; category: string; quantity: number; revenue: number }> = {};
              sales.forEach((sale: any) => {
                if (sale.items && Array.isArray(sale.items)) {
                  sale.items.forEach((item: any) => {
                    const productId = item.product_id || item.productId;
                    const productName = item.product_name || item.productName || 'Produto';
                    const category = item.category || 'Sem categoria';
                    if (!productSales[productId]) {
                      productSales[productId] = { name: productName, category, quantity: 0, revenue: 0 };
                    }
                    productSales[productId].quantity += item.quantity || 0;
                    productSales[productId].revenue += item.total_price || item.totalPrice || 0;
                  });
                }
              });
              const topProducts = Object.values(productSales)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);
              
              if (topProducts.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Nenhuma venda registrada ainda</p>
                  </div>
                );
              }
              
              return topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{product.quantity} vendas</p>
                    <p className="text-sm text-gray-600">R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Vendas por Categoria</h3>
          <div className="space-y-3">
            {(() => {
              // Calcular vendas por categoria
              const categorySales: Record<string, number> = {};
              let totalSales = 0;
              sales.forEach((sale: any) => {
                if (sale.items && Array.isArray(sale.items)) {
                  sale.items.forEach((item: any) => {
                    const category = item.category || 'Sem categoria';
                    const revenue = item.total_price || item.totalPrice || 0;
                    if (!categorySales[category]) {
                      categorySales[category] = 0;
                    }
                    categorySales[category] += revenue;
                    totalSales += revenue;
                  });
                }
              });
              
              const categories = Object.entries(categorySales)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
              
              if (categories.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Nenhuma venda por categoria</p>
                  </div>
                );
              }
              
              const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
              
              return categories.map(([category, revenue], index) => {
                const percentage = totalSales > 0 ? (revenue / totalSales) * 100 : 0;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-gray-600">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className={`${colors[index % colors.length]} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações Gerais</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Loja</label>
              <input type="text" defaultValue="Minha Loja" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
              <input type="text" defaultValue="12.345.678/0001-90" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
              <textarea defaultValue="Rua das Flores, 123 - Centro" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" rows={3}></textarea>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações de Venda</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imposto Padrão (%)</label>
              <input type="number" defaultValue="18" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desconto Máximo (%)</label>
              <input type="number" defaultValue="20" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
            </div>
            <div className="flex items-center">
              <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
              <label className="ml-2 text-sm text-gray-700">Permitir vendas sem estoque</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const handleStockUpdate = (productId: string, newStock: number) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, stock: newStock } : p
    ));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'pos':
        return renderPOS();
      case 'cash':
        return renderCashManagement();
      case 'products':
        return renderProducts();
      case 'customers':
        return renderCustomers();
      case 'inventory':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div></div>}>
            <InventoryManagement 
              products={products.map(p => ({
                id: p.id,
                name: p.name,
                stock: p.stock,
                min_stock: 5, // Configurável no futuro
                price: p.price,
                category: p.category
              }))}
              onStockUpdate={handleStockUpdate}
            />
          </Suspense>
        );
      case 'stores':
        return renderStores();
      case 'suppliers':
        return renderSuppliers();
      case 'commissions':
        return renderCommissions();
      case 'sales':
        return renderSales();
      case 'quotations':
        return renderQuotations();
      case 'purchases':
        return renderPurchases();
      case 'transfers':
        return renderTransfers();
      case 'users':
        return renderUsers();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        return renderPOS();
    }
  };

  // Seções auxiliares ausentes: evitar erros em runtime
  const renderStores = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Lojas</h2>
            <p className="text-gray-600">Cadastre e gerencie suas lojas</p>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>exportToCSV('lojas', stores)} className="px-3 py-2 bg-blue-100 text-blue-700 rounded">Exportar CSV</button>
          </div>
        </div>

        {/* Formulário de cadastro/edição */}
        <StoreForm 
          editing={editingStore || undefined}
          onAdd={(s)=>setStores(prev=>[{...s,id:`st_${Date.now()}`},...prev])}
          onUpdate={(id, s)=>setStores(prev=>prev.map(x=>x.id===id?{...x,...s}:x))}
          onCancelEdit={()=>setEditingStore(null)}
        />

        {/* Lista */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Nome</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">CNPJ</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Telefone</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {stores.map(s=> (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-2 text-gray-700">{s.cnpj||'-'}</td>
                  <td className="px-4 py-2 text-gray-700">{s.phone||'-'}</td>
                  <td className="px-4 py-2 text-gray-700">{s.email||'-'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${s.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>{s.status==='active'?'Ativa':'Inativa'}</span>
                  </td>
                  <td className="px-4 py-2 flex gap-3">
                    <button onClick={()=>setEditingStore(s)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={()=>setStores(prev=>prev.filter(x=>x.id!==s.id))} className="text-red-600 hover:underline">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <p className="text-gray-600">Cadastre fornecedores e contatos</p>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>exportToCSV('fornecedores', suppliers)} className="px-3 py-2 bg-blue-100 text-blue-700 rounded">Exportar CSV</button>
          </div>
        </div>

        <SupplierForm 
          editing={editingSupplier || undefined}
          onAdd={(sp)=>setSuppliers(prev=>[{...sp,id:`sp_${Date.now()}`},...prev])}
          onUpdate={(id, sp)=>setSuppliers(prev=>prev.map(x=>x.id===id?{...x,...sp}:x))}
          onCancelEdit={()=>setEditingSupplier(null)}
        />

        <div className="overflow-x-auto mt-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Nome</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">CNPJ</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Contato</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Telefone</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Email</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {suppliers.map(sp=> (
                <tr key={sp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{sp.name}</td>
                  <td className="px-4 py-2 text-gray-700">{sp.cnpj||'-'}</td>
                  <td className="px-4 py-2 text-gray-700">{sp.contact||'-'}</td>
                  <td className="px-4 py-2 text-gray-700">{sp.phone||'-'}</td>
                  <td className="px-4 py-2 text-gray-700">{sp.email||'-'}</td>
                  <td className="px-4 py-2"><span className={`px-2 py-1 rounded-full text-xs ${sp.status==='active'?'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>{sp.status==='active'?'Ativo':'Inativo'}</span></td>
                  <td className="px-4 py-2 flex gap-3">
                    <button onClick={()=>setEditingSupplier(sp)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={()=>setSuppliers(prev=>prev.filter(x=>x.id!==sp.id))} className="text-red-600 hover:underline">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCommissions = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Comissões</h2>
            <p className="text-gray-600">Registre comissões por vendedor</p>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>exportToCSV('comissoes', commissions)} className="px-3 py-2 bg-blue-100 text-blue-700 rounded">Exportar CSV</button>
          </div>
        </div>

        <CommissionForm 
          editing={editingCommission || undefined}
          onAdd={(c)=>setCommissions(prev=>[{...c,id:`cm_${Date.now()}`},...prev])}
          onUpdate={(id, c)=>setCommissions(prev=>prev.map(x=>x.id===id?{...x,...c}:x))}
          onCancelEdit={()=>setEditingCommission(null)}
        />

        <div className="overflow-x-auto mt-6">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Vendedor</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">% Comissão</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Vendas</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Comissão</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Data</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {commissions.map(c=> (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{c.sellerName}</td>
                  <td className="px-4 py-2 text-gray-700">{c.percentage}%</td>
                  <td className="px-4 py-2 text-gray-700">{c.salesAmount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                  <td className="px-4 py-2 text-gray-700">{c.commissionAmount.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</td>
                  <td className="px-4 py-2 text-gray-700">{new Date(c.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-2 flex gap-3">
                    <button onClick={()=>setEditingCommission(c)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={()=>setCommissions(prev=>prev.filter(x=>x.id!==c.id))} className="text-red-600 hover:underline">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Componentes internos simples de formulário
  // helpers de máscara simples
  const maskCNPJ = (v: string) => v
    .replace(/\D/g,'')
    .replace(/(\d{2})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1/$2')
    .replace(/(\d{4})(\d{1,2})$/,'$1-$2');
  const maskPhone = (v: string) => v
    .replace(/\D/g,'')
    .replace(/(\d{2})(\d)/,'($1) $2')
    .replace(/(\d{5})(\d{4})$/,'$1-$2');

  function StoreForm({ onAdd, onUpdate, editing, onCancelEdit }: { onAdd: (s: Omit<StoreRecord,'id'>) => void; onUpdate: (id: string, s: Omit<StoreRecord,'id'>) => void; editing?: StoreRecord; onCancelEdit: ()=>void; }) {
    const [form, setForm] = useState<Omit<StoreRecord,'id'>>({ name:'', address:'', phone:'', email:'', cnpj:'', status:'active' });
    useEffect(()=>{
      if (editing) setForm({ name: editing.name, address: editing.address, phone: editing.phone, email: editing.email, cnpj: editing.cnpj, status: editing.status });
    }, [editing]);
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="px-3 py-2 border rounded" placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <input className="px-3 py-2 border rounded" placeholder="CNPJ" value={form.cnpj||''} onChange={e=>setForm({...form,cnpj:maskCNPJ(e.target.value)})}/>
          <input className="px-3 py-2 border rounded" placeholder="Telefone" value={form.phone||''} onChange={e=>setForm({...form,phone:maskPhone(e.target.value)})}/>
          <input className="px-3 py-2 border rounded" placeholder="Email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/>
          <select className="px-3 py-2 border rounded" value={form.status} onChange={e=>setForm({...form,status:e.target.value as any})}>
            <option value="active">Ativa</option>
            <option value="inactive">Inativa</option>
          </select>
        </div>
        <div className="mt-3">
          <input className="w-full px-3 py-2 border rounded" placeholder="Endereço" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/>
        </div>
        <div className="mt-3 flex justify-end">
          {editing ? (
            <div className="flex gap-2">
              <button onClick={()=>{ if(!form.name.trim()||!editing) return; onUpdate(editing.id, form); onCancelEdit(); setForm({ name:'', address:'', phone:'', email:'', cnpj:'', status:'active' }); }} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              <button onClick={()=>{ onCancelEdit(); setForm({ name:'', address:'', phone:'', email:'', cnpj:'', status:'active' }); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Cancelar</button>
            </div>
          ) : (
            <button onClick={()=>{ if(!form.name.trim()) return; onAdd(form); setForm({ name:'', address:'', phone:'', email:'', cnpj:'', status:'active' }); }} className="px-4 py-2 bg-green-600 text-white rounded">Adicionar Loja</button>
          )}
        </div>
      </div>
    );
  }

  function SupplierForm({ onAdd, onUpdate, editing, onCancelEdit }: { onAdd: (s: Omit<SupplierRecord,'id'>) => void; onUpdate: (id: string, s: Omit<SupplierRecord,'id'>) => void; editing?: SupplierRecord; onCancelEdit: ()=>void; }) {
    const [form, setForm] = useState<Omit<SupplierRecord,'id'>>({ name:'', cnpj:'', contact:'', phone:'', email:'', status:'active' });
    useEffect(()=>{
      if (editing) setForm({ name: editing.name, cnpj: editing.cnpj, contact: editing.contact, phone: editing.phone, email: editing.email, status: editing.status });
    }, [editing]);
    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input className="px-3 py-2 border rounded" placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <input className="px-3 py-2 border rounded" placeholder="CNPJ" value={form.cnpj||''} onChange={e=>setForm({...form,cnpj:maskCNPJ(e.target.value)})}/>
          <input className="px-3 py-2 border rounded" placeholder="Contato" value={form.contact||''} onChange={e=>setForm({...form,contact:e.target.value})}/>
          <input className="px-3 py-2 border rounded" placeholder="Telefone" value={form.phone||''} onChange={e=>setForm({...form,phone:maskPhone(e.target.value)})}/>
          <input className="px-3 py-2 border rounded" placeholder="Email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/>
          <select className="px-3 py-2 border rounded" value={form.status} onChange={e=>setForm({...form,status:e.target.value as any})}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
        <div className="mt-3 flex justify-end">
          {editing ? (
            <div className="flex gap-2">
              <button onClick={()=>{ if(!form.name.trim()||!editing) return; onUpdate(editing.id, form); onCancelEdit(); setForm({ name:'', cnpj:'', contact:'', phone:'', email:'', status:'active' }); }} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              <button onClick={()=>{ onCancelEdit(); setForm({ name:'', cnpj:'', contact:'', phone:'', email:'', status:'active' }); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Cancelar</button>
            </div>
          ) : (
            <button onClick={()=>{ if(!form.name.trim()) return; onAdd(form); setForm({ name:'', cnpj:'', contact:'', phone:'', email:'', status:'active' }); }} className="px-4 py-2 bg-green-600 text-white rounded">Adicionar Fornecedor</button>
          )}
        </div>
      </div>
    );
  }

  function CommissionForm({ onAdd, onUpdate, editing, onCancelEdit }: { onAdd: (c: Omit<CommissionRecord,'id'|'commissionAmount'> & { commissionAmount?: number }) => void; onUpdate: (id: string, c: Partial<CommissionRecord>) => void; editing?: CommissionRecord; onCancelEdit: ()=>void; }) {
    const [sellerName, setSellerName] = useState('');
    const [percentage, setPercentage] = useState(5);
    const [salesAmount, setSalesAmount] = useState(0);
    const [date, setDate] = useState<string>(new Date().toISOString());
    useEffect(()=>{
      if (editing) {
        setSellerName(editing.sellerName);
        setPercentage(editing.percentage);
        setSalesAmount(editing.salesAmount);
        setDate(editing.date);
      }
    }, [editing]);

    const handleAdd = () => {
      if (!sellerName.trim()) return;
      const commissionAmount = (salesAmount * (percentage/100));
      onAdd({ sellerName, percentage, salesAmount, date, commissionAmount });
      setSellerName(''); setPercentage(5); setSalesAmount(0); setDate(new Date().toISOString());
    };

    return (
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input className="px-3 py-2 border rounded" placeholder="Vendedor" value={sellerName} onChange={e=>setSellerName(e.target.value)}/>
          <input type="number" className="px-3 py-2 border rounded" placeholder="%" value={percentage} onChange={e=>setPercentage(Number(e.target.value)||0)}/>
          <input type="number" className="px-3 py-2 border rounded" placeholder="Valor de vendas" value={salesAmount} onChange={e=>setSalesAmount(Number(e.target.value)||0)}/>
          <input type="date" className="px-3 py-2 border rounded" value={date.slice(0,10)} onChange={e=>setDate(new Date(e.target.value).toISOString())}/>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={()=>{ if(!editing) return; const commissionAmount = (salesAmount * (percentage/100)); onUpdate(editing.id, { sellerName, percentage, salesAmount, date, commissionAmount }); onCancelEdit(); setSellerName(''); setPercentage(5); setSalesAmount(0); setDate(new Date().toISOString()); }} className="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
              <button onClick={()=>{ onCancelEdit(); setSellerName(''); setPercentage(5); setSalesAmount(0); setDate(new Date().toISOString()); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Cancelar</button>
            </div>
          ) : (
            <button onClick={handleAdd} className="px-4 py-2 bg-green-600 text-white rounded">Adicionar</button>
          )}
        </div>
      </div>
    );
  }

  const toggleMaximize = useCallback(() => {
    const pdvContainer = document.getElementById('pdv-container');
    if (!pdvContainer) return;

    if (!isMaximized) {
      // Maximizar - usar Fullscreen API
      if (pdvContainer.requestFullscreen) {
        pdvContainer.requestFullscreen().catch(err => {
          console.error('Erro ao entrar em fullscreen:', err);
          // Fallback: usar classes CSS
          setIsMaximized(true);
        });
        // O listener fullscreenchange vai atualizar o estado automaticamente
      } else {
        // Fallback para navegadores que não suportam fullscreen
        setIsMaximized(true);
      }
    } else {
      // Restaurar
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.error('Erro ao sair do fullscreen:', err);
          setIsMaximized(false);
        });
        // O listener fullscreenchange vai atualizar o estado automaticamente
      } else {
        setIsMaximized(false);
      }
    }
  }, [isMaximized]);

  // Listener para mudanças no fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsMaximized(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center transition-all duration-300 ${
      isMaximized ? 'p-0' : 'p-4'
    }`}>
      <div 
        id="pdv-container"
        className={`bg-white shadow-2xl flex flex-col transition-all duration-300 ${
          isMaximized 
            ? 'w-full h-full rounded-none' 
            : 'w-full max-w-7xl h-[90vh] rounded-2xl'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Sistema PDV</h1>
              <p className="text-gray-600">Ponto de Venda Profissional</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMaximize}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={isMaximized ? "Restaurar" : "Maximizar"}
            >
              {isMaximized ? (
                <Minimize2 className="w-6 h-6" />
              ) : (
                <Maximize2 className="w-6 h-6" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-1 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === item.id
                      ? getColorClasses(item.color)
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Modals */}
        {showCustomerModal && (
          <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800">Selecionar Cliente</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPF/CNPJ</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatCpfCnpj(customerCpfCnpj)}
                        onChange={(e) => {
                          const unformatted = e.target.value.replace(/\D/g, '');
                          setCustomerCpfCnpj(unformatted);
                        }}
                        placeholder="Digite o CPF ou CNPJ"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        maxLength={18} // CNPJ formatado tem 18 caracteres
                      />
                      {loadingCNPJ && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        </div>
                      )}
                    </div>
                    {empresaData && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-800 mb-1">
                              {empresaData.nomeFantasia || empresaData.razaoSocial}
                            </p>
                            {empresaData.razaoSocial && empresaData.razaoSocial !== empresaData.nomeFantasia && (
                              <p className="text-xs text-green-700 mb-1">Razão Social: {empresaData.razaoSocial}</p>
                            )}
                            <p className="text-xs text-green-700">
                              {empresaData.logradouro && empresaData.numero && (
                                <span>{empresaData.logradouro}, {empresaData.numero}</span>
                              )}
                              {empresaData.complemento && <span> - {empresaData.complemento}</span>}
                              {empresaData.bairro && <span> - {empresaData.bairro}</span>}
                              {empresaData.municipio && empresaData.uf && (
                                <span> - {empresaData.municipio}/{empresaData.uf}</span>
                              )}
                              {empresaData.cep && <span> - CEP: {empresaData.cep}</span>}
                            </p>
                            {empresaData.telefone && (
                              <p className="text-xs text-green-700 mt-1">Tel: {empresaData.telefone}</p>
                            )}
                            {empresaData.email && (
                              <p className="text-xs text-green-700">Email: {empresaData.email}</p>
                            )}
                            {empresaData.situacao && (
                              <p className="text-xs mt-1">
                                <span className={`px-2 py-0.5 rounded-full ${
                                  empresaData.situacao === 'ATIVA' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {empresaData.situacao}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowCustomerModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        // Remover formatação antes de salvar (apenas números)
                        const cleanCpfCnpj = customerCpfCnpj.replace(/\D/g, '');
                        
                        // Se houver dados da empresa, usar eles
                        if (empresaData) {
                          setCurrentCustomer({
                            id: `cnpj_${cleanCpfCnpj}`,
                            name: empresaData.nomeFantasia || empresaData.razaoSocial,
                            email: empresaData.email || '',
                            phone: empresaData.telefone || '',
                            cpf: cleanCpfCnpj
                          });
                        } else {
                          // Caso contrário, usar dados básicos
                          setCurrentCustomer({
                            id: cleanCpfCnpj.length === 14 ? `cnpj_${cleanCpfCnpj}` : `cpf_${cleanCpfCnpj}`,
                            name: 'Cliente Encontrado',
                            cpf: cleanCpfCnpj
                          });
                        }
                        setShowCustomerModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loadingCNPJ}
                    >
                      {loadingCNPJ ? 'Buscando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800">Forma de Pagamento</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      <option value="cash">Dinheiro</option>
                      <option value="credit_card">Cartão de Crédito</option>
                      <option value="debit_card">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                    </select>
                  </div>
                  
                  {selectedPaymentMethod === 'cash' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Valor Recebido</label>
                      <input
                        type="number"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(Number(e.target.value))}
                        placeholder="0,00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      {cashReceived > 0 && (
                        <p className="mt-2 text-sm text-gray-600">
                          Troco: R$ {calculateChange().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setShowPaymentModal(false);
                        finalizeSale();
                      }}
                      className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showReceiptModal && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-scale-in">
              <div className="p-5 border-b">
                <h3 className="text-lg font-bold text-gray-800">Venda Finalizada!</h3>
              </div>
              <div className="p-5">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center animate-pulse-glow">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Venda processada com sucesso!</p>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setFiscalDocumentType('cpf');
                        setShowFiscalReceiptModal(true);
                        setShowReceiptModal(false);
                      }}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all transform hover:scale-105 text-xs font-medium shadow-md"
                    >
                      Cupom Fiscal (CPF)
                    </button>
                    <button
                      onClick={() => {
                        setFiscalDocumentType('cnpj');
                        setShowFiscalReceiptModal(true);
                        setShowReceiptModal(false);
                      }}
                      className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all transform hover:scale-105 text-xs font-medium shadow-md"
                    >
                      Cupom Fiscal (CNPJ)
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowNFEModal(true);
                      setShowReceiptModal(false);
                    }}
                    className="w-full px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all transform hover:scale-105 text-xs font-medium shadow-md"
                  >
                    Emitir NFE
                  </button>
                  <div className="flex space-x-2 pt-2 border-t">
                    <button
                      onClick={() => setShowReceiptModal(false)}
                      className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => {
                        handlePrintReceipt();
                        setShowReceiptModal(false);
                      }}
                      className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-xs"
                    >
                      Imprimir Cupom
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modais de Documentos Fiscais */}
        {showFiscalReceiptModal && (
          <div className="fixed inset-0 z-70">
            <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>}>
              <FiscalReceiptModal onClose={() => {
                setShowFiscalReceiptModal(false);
                setFiscalDocumentType(null);
              }} />
            </Suspense>
          </div>
        )}

        {showNFEModal && (
          <div className="fixed inset-0 z-70">
            <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div></div>}>
              <NFEModal onClose={() => setShowNFEModal(false)} />
            </Suspense>
          </div>
        )}

        {/* Modal Produto */}
        {showProductModal && (
          <div 
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowProductModal(false);
                setEditingProduct(null);
                setProductImagePreview(null);
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all animate-scale-in relative z-[101]" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-800">
                    {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowProductModal(false);
                      setEditingProduct(null);
                      setProductImagePreview(null);
                      setProductFormData({
                        name: '',
                        price: '',
                        stock: '',
                        category: '',
                        barcode: '',
                        description: ''
                      });
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const imageInput = formData.get('image') as File | null;
                  
                  // Converter preço de string formatada para número
                  const priceValue = unformatCurrency(productFormData.price);
                  
                  // Se uma nova imagem foi selecionada, usar o preview
                  if (productImagePreview) {
                    handleSaveProduct({
                      name: productFormData.name,
                      price: priceValue,
                      stock: Number(productFormData.stock) || 0,
                      category: productFormData.category,
                      barcode: productFormData.barcode,
                      description: productFormData.description,
                      image: productImagePreview
                    });
                  } else if (imageInput && imageInput instanceof File) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const imageUrl = reader.result as string;
                      handleSaveProduct({
                        name: productFormData.name,
                        price: priceValue,
                        stock: Number(productFormData.stock) || 0,
                        category: productFormData.category,
                        barcode: productFormData.barcode,
                        description: productFormData.description,
                        image: imageUrl
                      });
                      setProductImagePreview(null);
                    };
                    reader.readAsDataURL(imageInput);
                    return;
                  } else {
                    // Se não há nova imagem, manter a imagem existente ou vazio
                    handleSaveProduct({
                      name: productFormData.name,
                      price: priceValue,
                      stock: Number(productFormData.stock) || 0,
                      category: productFormData.category,
                      barcode: productFormData.barcode,
                      description: productFormData.description,
                      image: editingProduct?.image || ''
                    });
                  }
                  // Limpar formulário após salvar
                  setProductFormData({
                    name: '',
                    price: '',
                    stock: '',
                    category: '',
                    barcode: '',
                    description: ''
                  });
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Nome do Produto</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={productFormData.name}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Nome do produto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
                    <input
                      type="text"
                      name="price"
                      required
                      value={formatCurrencyInput(productFormData.price)}
                      onChange={(e) => {
                        const unformatted = e.target.value.replace(/\D/g, '');
                        setProductFormData(prev => ({ ...prev, price: unformatted }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="R$ 0,00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estoque</label>
                    <input
                      type="number"
                      name="stock"
                      required
                      min="0"
                      value={productFormData.stock}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                    <input
                      type="text"
                      name="category"
                      required
                      value={productFormData.category}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Categoria"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Código de Barras</label>
                    <input
                      type="text"
                      name="barcode"
                      value={productFormData.barcode}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, barcode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Código de barras"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                    <textarea
                      name="description"
                      rows={3}
                      value={productFormData.description}
                      onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Descrição do produto"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Foto do Produto</label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const imageUrl = reader.result as string;
                              setProductImagePreview(imageUrl);
                              // Armazenar temporariamente a imagem para preview
                              if (editingProduct) {
                                setEditingProduct({ ...editingProduct, image: imageUrl });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      />
                      {(productImagePreview || editingProduct?.image) && (
                        <div className="mt-2">
                          <img 
                            src={productImagePreview || editingProduct?.image || ''} 
                            alt="Preview" 
                            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-3 pt-4 sticky bottom-0 bg-white pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProductModal(false);
                        setEditingProduct(null);
                        setProductImagePreview(null);
                        setProductFormData({
                          name: '',
                          price: '',
                          stock: '',
                          category: '',
                          barcode: '',
                          description: ''
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      {editingProduct ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Cliente */}
        {showCustomerModalForm && (
          <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
              </div>
              <div className="p-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveCustomer({
                    name: customerFormData.name,
                    email: customerFormData.email,
                    phone: customerFormData.phone,
                    cpf: customerFormData.cpf,
                    points: customerFormData.points
                  });
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={customerFormData.name}
                      onChange={(e) => setCustomerFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do cliente"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={customerFormData.email}
                      onChange={(e) => setCustomerFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formatPhone(customerFormData.phone)}
                      onChange={(e) => {
                        const unformatted = unformatPhone(e.target.value);
                        setCustomerFormData(prev => ({ ...prev, phone: unformatted }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CPF/CNPJ</label>
                    <input
                      type="text"
                      name="cpf"
                      value={formatCpfCnpj(customerFormData.cpf)}
                      onChange={(e) => {
                        const unformatted = e.target.value.replace(/\D/g, '');
                        setCustomerFormData(prev => ({ ...prev, cpf: unformatted }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pontos Iniciais</label>
                    <input
                      type="number"
                      name="points"
                      min="0"
                      value={customerFormData.points}
                      onChange={(e) => setCustomerFormData(prev => ({ ...prev, points: Number(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex space-x-3 pt-4 sticky bottom-0 bg-white pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomerModalForm(false);
                        setEditingCustomer(null);
                        setCustomerFormData({ name: '', email: '', phone: '', cpf: '', points: 0 });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      {editingCustomer ? 'Atualizar' : 'Criar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Abertura de Caixa */}
        {showOpenCashModal && (
          <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800">Abrir Caixa</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Inicial do Caixa *
                    </label>
                    <input
                      type="text"
                      value={initialCashAmount > 0 ? formatCurrencyInput((initialCashAmount * 100).toString()) : ''}
                      onChange={(e) => {
                        const unformatted = e.target.value.replace(/\D/g, '');
                        const value = unformatted === '' ? 0 : parseFloat(unformatted) / 100;
                        setInitialCashAmount(value);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-semibold"
                      placeholder="R$ 0,00"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Informe o valor em dinheiro que está no caixa no momento da abertura
                    </p>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowOpenCashModal(false);
                        if (!cashRegisterOpen) {
                          setActiveTab('products');
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCashRegister}
                      disabled={initialCashAmount <= 0}
                      className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Abrir Caixa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de Fechamento de Caixa */}
        {showCloseCashModal && (
          <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-gray-800">Fechar Caixa</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Inicial:</span>
                      <span className="font-semibold">
                        R$ {cashRegisterData.initialAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total de Vendas:</span>
                      <span className="font-semibold">
                        R$ {cashRegisterData.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-700 font-medium">Valor Esperado:</span>
                      <span className="font-bold text-lg">
                        R$ {(cashRegisterData.initialAmount + cashRegisterData.totalSales).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vendas Realizadas:</span>
                      <span className="font-semibold">{cashRegisterData.salesCount}</span>
                    </div>
                    {cashRegisterData.openedAt && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Aberto em:</span>
                        <span>{cashRegisterData.openedAt.toLocaleString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Encontrado no Caixa *
                    </label>
                    <input
                      type="text"
                      value={cashRegisterData.totalReceived > 0 ? formatCurrencyInput((cashRegisterData.totalReceived * 100).toString()) : ''}
                      onChange={(e) => {
                        const unformatted = e.target.value.replace(/\D/g, '');
                        const value = unformatted === '' ? 0 : parseFloat(unformatted) / 100;
                        setCashRegisterData(prev => ({ ...prev, totalReceived: value }));
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-semibold"
                      placeholder="R$ 0,00"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Informe o valor total encontrado no caixa (incluindo o valor inicial)
                    </p>
                  </div>
                  
                  {cashRegisterData.totalReceived > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">Diferença:</span>
                        <span className={`font-bold text-lg ${
                          (cashRegisterData.initialAmount + cashRegisterData.totalSales - cashRegisterData.totalReceived) >= 0
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          R$ {(cashRegisterData.initialAmount + cashRegisterData.totalSales - cashRegisterData.totalReceived).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCloseCashModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseCashRegister}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Fechar Caixa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Importar Produtos */}
        {showImportModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Importar Produtos</h3>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Selecione um arquivo CSV ou JSON para importar</p>
                  <input
                    type="file"
                    accept=".csv,.json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const content = event.target?.result as string;
                          let importedProducts: Product[] = [];

                          if (file.name.endsWith('.json')) {
                            importedProducts = JSON.parse(content);
                          } else if (file.name.endsWith('.csv')) {
                            const lines = content.split('\n');
                            const headers = lines[0].split(',').map(h => h.trim());
                            importedProducts = lines.slice(1)
                              .filter(line => line.trim())
                              .map(line => {
                                const values = line.split(',').map(v => v.trim());
                                return {
                                  id: `p${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                  name: values[headers.indexOf('name')] || values[0] || '',
                                  price: parseFloat(values[headers.indexOf('price')] || values[1] || '0'),
                                  stock: parseInt(values[headers.indexOf('stock')] || values[2] || '0'),
                                  category: values[headers.indexOf('category')] || values[3] || '',
                                  barcode: values[headers.indexOf('barcode')] || values[4] || '',
                                  description: values[headers.indexOf('description')] || values[5] || ''
                                };
                              });
                          }

                          if (importedProducts.length > 0) {
                            handleImportProducts(importedProducts);
                          } else {
                            alert('Nenhum produto encontrado no arquivo.');
                          }
                        } catch (error) {
                          console.error('Erro ao importar:', error);
                          alert('Erro ao processar arquivo. Verifique o formato.');
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden"
                    id="import-file-input"
                  />
                  <label
                    htmlFor="import-file-input"
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer inline-block"
                  >
                    Selecionar Arquivo
                  </label>
                  <p className="text-sm text-gray-500 mt-4">
                    Formato CSV esperado: name,price,stock,category,barcode,description
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Código/Etiquetas */}
        {showLabelModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Gerar Etiquetas/Códigos</h3>
                  <button
                    onClick={() => {
                      setShowLabelModal(false);
                      setSelectedProductForLabel(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {selectedProductForLabel ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium mb-2">{selectedProductForLabel.name}</p>
                      <p className="text-sm text-gray-600">Código: {selectedProductForLabel.barcode || 'N/A'}</p>
                    </div>
                    <div className="border-2 border-gray-200 p-8 rounded-lg text-center">
                      {selectedProductForLabel.barcode ? (
                        <div className="space-y-4">
                          <QrCode className="w-32 h-32 mx-auto text-gray-800" />
                          <p className="font-mono text-lg">{selectedProductForLabel.barcode}</p>
                          <button
                            onClick={() => {
                              const printWindow = window.open('', '_blank');
                              if (printWindow) {
                                printWindow.document.write(`
                                  <html>
                                    <head><title>Etiqueta - ${selectedProductForLabel.name}</title></head>
                                    <body style="font-family: Arial; padding: 20px; text-align: center;">
                                      <h2>${selectedProductForLabel.name}</h2>
                                      <div style="margin: 20px 0;">
                                        <svg id="barcode"></svg>
                                      </div>
                                      <p style="font-family: monospace; font-size: 18px;">${selectedProductForLabel.barcode}</p>
                                      <p>R$ ${selectedProductForLabel.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </body>
                                  </html>
                                `);
                                printWindow.document.close();
                                setTimeout(() => printWindow.print(), 250);
                              }
                            }}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                          >
                            <Printer className="w-4 h-4 inline mr-2" />
                            Imprimir Etiqueta
                          </button>
                        </div>
                      ) : (
                        <p className="text-gray-500">Produto sem código de barras. Adicione um código primeiro.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-emerald-500 transition-colors"
                        onClick={() => setSelectedProductForLabel(product)}
                      >
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-600">Código: {product.barcode || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Ajuste de Estoque */}
        {showAdjustmentModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Adicionar Ajuste</h3>
                  <button
                    onClick={() => {
                      setShowAdjustmentModal(false);
                      setSelectedProductForAdjustment(null);
                      setAdjustmentData({ type: 'add', quantity: 0, reason: '' });
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {selectedProductForAdjustment ? (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{selectedProductForAdjustment.name}</p>
                      <p className="text-sm text-gray-600">Estoque atual: {selectedProductForAdjustment.stock}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Ajuste</label>
                      <select
                        value={adjustmentData.type}
                        onChange={(e) => setAdjustmentData(prev => ({ ...prev, type: e.target.value as 'add' | 'subtract' | 'set' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="add">Adicionar</option>
                        <option value="subtract">Subtrair</option>
                        <option value="set">Definir Quantidade</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantidade</label>
                      <input
                        type="number"
                        min="0"
                        value={adjustmentData.quantity}
                        onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Motivo (opcional)</label>
                      <textarea
                        value={adjustmentData.reason}
                        onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        rows={3}
                        placeholder="Ex: Ajuste de inventário, devolução, etc."
                      />
                    </div>
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdjustmentModal(false);
                          setSelectedProductForAdjustment(null);
                          setAdjustmentData({ type: 'add', quantity: 0, reason: '' });
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleStockAdjustment}
                        className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Aplicar Ajuste
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors"
                        onClick={() => setSelectedProductForAdjustment(product)}
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-600">Estoque: {product.stock}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Contagem de Estoque */}
        {showCountModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Contagem de Estoque</h3>
                  <button
                    onClick={() => {
                      setShowCountModal(false);
                      setStockCounts([]);
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <Info className="w-4 h-4 inline mr-2" />
                    Informe a quantidade física encontrada para cada produto. O sistema atualizará o estoque automaticamente.
                  </p>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stockCounts.map((count, index) => (
                    <div key={count.productId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{count.productName}</p>
                        <p className="text-sm text-gray-600">Estoque atual: {count.currentStock}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min="0"
                          value={count.countedStock}
                          onChange={(e) => {
                            const newCounts = [...stockCounts];
                            newCounts[index].countedStock = parseInt(e.target.value) || 0;
                            setStockCounts(newCounts);
                          }}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center"
                          placeholder="0"
                        />
                        {count.countedStock !== count.currentStock && (
                          <span className={`text-sm font-semibold ${
                            count.countedStock > count.currentStock ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {count.countedStock > count.currentStock ? '+' : ''}
                            {count.countedStock - count.currentStock}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCountModal(false);
                      setStockCounts([]);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleStockCount}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Finalizar Contagem
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Adicionar Venda */}
        {showAddSaleModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Adicionar Venda</h3>
                  <button
                    onClick={() => setShowAddSaleModal(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">Selecione um cliente</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Produtos</label>
                  <div className="border border-gray-300 rounded-lg p-4 min-h-[200px]">
                    <p className="text-gray-500 text-sm">Selecione produtos para adicionar à venda</p>
                    <div className="mt-4 space-y-2">
                      {products.slice(0, 5).map(product => (
                        <div key={product.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                          <span className="text-sm">{product.name}</span>
                          <button className="text-emerald-600 hover:text-emerald-700">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="cash">Dinheiro</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddSaleModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddSale({
                        customer: 'Cliente Manual',
                        items: [],
                        total: 0,
                        paymentMethod: 'cash'
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Adicionar Venda
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Importar Vendas */}
        {showImportSalesModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Adicionar Vendas por CSV</h3>
                  <button
                    onClick={() => setShowImportSalesModal(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Selecione um arquivo CSV para importar vendas</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const content = event.target?.result as string;
                          const lines = content.split('\n');
                          const headers = lines[0].split(',').map(h => h.trim());
                          const importedSales = lines.slice(1)
                            .filter(line => line.trim())
                            .map(line => {
                              const values = line.split(',').map(v => v.trim());
                              return {
                                id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                date: values[headers.indexOf('date')] || values[0] || new Date().toLocaleDateString('pt-BR'),
                                customer: values[headers.indexOf('customer')] || values[1] || 'Cliente',
                                items: parseInt(values[headers.indexOf('items')] || values[2] || '0'),
                                total: parseFloat(values[headers.indexOf('total')] || values[3] || '0'),
                                status: values[headers.indexOf('status')] || values[4] || 'Concluída',
                                paymentMethod: values[headers.indexOf('paymentMethod')] || values[5] || 'cash'
                              };
                            });

                          if (importedSales.length > 0) {
                            handleImportSales(importedSales);
                          } else {
                            alert('Nenhuma venda encontrada no arquivo.');
                          }
                        } catch (error) {
                          console.error('Erro ao importar:', error);
                          alert('Erro ao processar arquivo. Verifique o formato.');
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden"
                    id="import-sales-file-input"
                  />
                  <label
                    htmlFor="import-sales-file-input"
                    className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer inline-block"
                  >
                    Selecionar Arquivo CSV
                  </label>
                  <p className="text-sm text-gray-500 mt-4">
                    Formato CSV esperado: date,customer,items,total,status,paymentMethod
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Entregas */}
        {showDeliveryModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Nova Entrega</h3>
                  <button
                    onClick={() => setShowDeliveryModal(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venda</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">Selecione uma venda</option>
                    {sales.map(s => (
                      <option key={s.id} value={s.id}>{s.customer} - R$ {typeof s.total === 'number' ? s.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : s.total}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows={3}
                    placeholder="Endereço completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data de Entrega</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDeliveryModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newDelivery = {
                        id: `delivery_${Date.now()}`,
                        saleId: '',
                        customerName: 'Cliente',
                        address: '',
                        phone: '',
                        status: 'pending' as const
                      };
                      setDeliveries(prev => [newDelivery, ...prev]);
                      setShowDeliveryModal(false);
                      alert('Entrega cadastrada com sucesso!');
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Cadastrar Entrega
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Cupons de Desconto */}
        {showCouponModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Novo Cupom de Desconto</h3>
                  <button
                    onClick={() => setShowCouponModal(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Código do Cupom</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                    placeholder="EX: DESCONTO10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Desconto</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="percentage">Percentual (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor do Desconto</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compra Mínima (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Desconto Máximo (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Válido de</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Válido até</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Limite de Uso (opcional)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Ex: 100"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newCoupon = {
                        id: `coupon_${Date.now()}`,
                        code: 'CUPOM' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                        type: 'percentage' as const,
                        value: 10,
                        validFrom: new Date().toISOString(),
                        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        usedCount: 0,
                        active: true
                      };
                      setCoupons(prev => [newCoupon, ...prev]);
                      setShowCouponModal(false);
                      alert('Cupom criado com sucesso!');
                    }}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Criar Cupom
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Adicionar Cotação */}
        {showQuotationModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Adicionar Cotação</h3>
                  <button
                    onClick={() => {
                      setShowQuotationModal(false);
                      setQuotationFormData({
                        supplierId: '',
                        validUntil: '',
                        items: [],
                        discount: 0,
                        notes: ''
                      });
                    }}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedor *</label>
                    <select
                      value={quotationFormData.supplierId}
                      onChange={(e) => setQuotationFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Selecione um fornecedor</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Válido até</label>
                    <input
                      type="date"
                      value={quotationFormData.validUntil}
                      onChange={(e) => setQuotationFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Produtos</label>
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="space-y-3">
                      {quotationFormData.items.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newItems = [...quotationFormData.items];
                                  newItems[index].quantity = parseInt(e.target.value) || 1;
                                  newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
                                  setQuotationFormData(prev => ({ ...prev, items: newItems }));
                                }}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Qtd"
                              />
                              <span className="text-sm text-gray-600">x</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const newItems = [...quotationFormData.items];
                                  newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                                  newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
                                  setQuotationFormData(prev => ({ ...prev, items: newItems }));
                                }}
                                className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Preço"
                              />
                              <span className="text-sm font-semibold text-emerald-600">
                                = R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newItems = quotationFormData.items.filter((_, i) => i !== index);
                              setQuotationFormData(prev => ({ ...prev, items: newItems }));
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <select
                        onChange={(e) => {
                          const productId = e.target.value;
                          if (productId) {
                            const product = products.find(p => p.id === productId);
                            if (product) {
                              setQuotationFormData(prev => ({
                                ...prev,
                                items: [...prev.items, {
                                  productId: product.id,
                                  productName: product.name,
                                  quantity: 1,
                                  unitPrice: product.price,
                                  total: product.price
                                }]
                              }));
                            }
                            e.target.value = '';
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        <option value="">Adicionar produto...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Desconto (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quotationFormData.discount}
                      onChange={(e) => setQuotationFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="flex items-end">
                    <div className="w-full bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">Subtotal: R$ {quotationFormData.items.reduce((sum, item) => sum + item.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-sm text-gray-600">Desconto: R$ {quotationFormData.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">
                        Total: R$ {(quotationFormData.items.reduce((sum, item) => sum + item.total, 0) - quotationFormData.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                  <textarea
                    value={quotationFormData.notes}
                    onChange={(e) => setQuotationFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    rows={3}
                    placeholder="Observações sobre a cotação..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuotationModal(false);
                      setQuotationFormData({
                        supplierId: '',
                        validUntil: '',
                        items: [],
                        discount: 0,
                        notes: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddQuotation}
                    className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Adicionar Cotação
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Adicionar Compra */}
        {showPurchaseModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Adicionar Compra</h3>
                  <button onClick={() => setShowPurchaseModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fornecedor *</label>
                  <select
                    value={purchaseFormData.supplierId}
                    onChange={(e) => setPurchaseFormData(prev => ({ ...prev, supplierId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecione um fornecedor</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Produtos</label>
                  <div className="border border-gray-300 rounded-lg p-4">
                    {purchaseFormData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <input type="number" min="1" value={item.quantity} onChange={(e) => {
                              const newItems = [...purchaseFormData.items];
                              newItems[index].quantity = parseInt(e.target.value) || 1;
                              newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
                              setPurchaseFormData(prev => ({ ...prev, items: newItems }));
                            }} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                            <span className="text-sm">x</span>
                            <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => {
                              const newItems = [...purchaseFormData.items];
                              newItems[index].unitPrice = parseFloat(e.target.value) || 0;
                              newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
                              setPurchaseFormData(prev => ({ ...prev, items: newItems }));
                            }} className="w-32 px-2 py-1 border border-gray-300 rounded text-sm" />
                            <span className="text-sm font-semibold text-emerald-600">
                              = R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                        <button onClick={() => {
                          setPurchaseFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
                        }} className="text-red-600"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <select onChange={(e) => {
                      const productId = e.target.value;
                      if (productId) {
                        const product = products.find(p => p.id === productId);
                        if (product) {
                          setPurchaseFormData(prev => ({
                            ...prev,
                            items: [...prev.items, { productId: product.id, productName: product.name, quantity: 1, unitPrice: product.price, total: product.price }]
                          }));
                        }
                        e.target.value = '';
                      }
                    }} className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2">
                      <option value="">Adicionar produto...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Desconto (R$)</label>
                    <input type="number" min="0" step="0.01" value={purchaseFormData.discount} onChange={(e) => setPurchaseFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                    <select value={purchaseFormData.paymentMethod} onChange={(e) => setPurchaseFormData(prev => ({ ...prev, paymentMethod: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="cash">Dinheiro</option>
                      <option value="credit_card">Cartão de Crédito</option>
                      <option value="debit_card">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                    </select>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Subtotal: R$ {purchaseFormData.items.reduce((sum, item) => sum + item.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm text-gray-600">Desconto: R$ {purchaseFormData.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">
                    Total: R$ {(purchaseFormData.items.reduce((sum, item) => sum + item.total, 0) - purchaseFormData.discount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setShowPurchaseModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleAddPurchase} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Adicionar Compra</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Importar Compras */}
        {showImportPurchaseModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Adicionar Compras por CSV</h3>
                  <button onClick={() => setShowImportPurchaseModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Selecione um arquivo CSV para importar compras</p>
                  <input type="file" accept=".csv" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = event.target?.result as string;
                        const lines = content.split('\n');
                        const headers = lines[0].split(',').map(h => h.trim());
                        const importedPurchases = lines.slice(1).filter(line => line.trim()).map(line => {
                          const values = line.split(',').map(v => v.trim());
                          return {
                            id: `purch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            number: `COMP-${Date.now().toString().slice(-6)}`,
                            supplierId: values[headers.indexOf('supplierId')] || '',
                            supplierName: values[headers.indexOf('supplierName')] || values[0] || 'Fornecedor',
                            date: values[headers.indexOf('date')] || values[1] || new Date().toLocaleDateString('pt-BR'),
                            items: [],
                            subtotal: parseFloat(values[headers.indexOf('subtotal')] || values[2] || '0'),
                            discount: parseFloat(values[headers.indexOf('discount')] || values[3] || '0'),
                            total: parseFloat(values[headers.indexOf('total')] || values[4] || '0'),
                            paymentMethod: values[headers.indexOf('paymentMethod')] || values[5] || 'cash'
                          };
                        });
                        if (importedPurchases.length > 0) {
                          setPurchases(prev => [...prev, ...importedPurchases]);
                          storageManager.set('pdv_purchases', [...purchases, ...importedPurchases]);
                          setShowImportPurchaseModal(false);
                          alert(`${importedPurchases.length} compra(s) importada(s) com sucesso!`);
                        }
                      } catch (error) {
                        alert('Erro ao processar arquivo.');
                      }
                    };
                    reader.readAsText(file);
                  }} className="hidden" id="import-purchase-file" />
                  <label htmlFor="import-purchase-file" className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 cursor-pointer inline-block">Selecionar Arquivo CSV</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Adicionar Despesa */}
        {showExpenseModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Adicionar Despesa</h3>
                  <button onClick={() => setShowExpenseModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                  <input type="text" value={expenseFormData.description} onChange={(e) => setExpenseFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex: Aluguel, Conta de luz..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoria *</label>
                  <input type="text" value={expenseFormData.category} onChange={(e) => setExpenseFormData(prev => ({ ...prev, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Ex: Operacional, Administrativo..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor *</label>
                  <input type="number" min="0" step="0.01" value={expenseFormData.amount} onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="0,00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pagamento</label>
                  <select value={expenseFormData.paymentMethod} onChange={(e) => setExpenseFormData(prev => ({ ...prev, paymentMethod: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="cash">Dinheiro</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="pix">PIX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                  <textarea value={expenseFormData.notes} onChange={(e) => setExpenseFormData(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setShowExpenseModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleAddExpense} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Adicionar Despesa</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Adicionar Transferência */}
        {showTransferModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Adicionar Transferência</h3>
                  <button onClick={() => setShowTransferModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loja de Origem *</label>
                    <select value={transferFormData.fromStoreId} onChange={(e) => setTransferFormData(prev => ({ ...prev, fromStoreId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="">Selecione a loja</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loja de Destino *</label>
                    <select value={transferFormData.toStoreId} onChange={(e) => setTransferFormData(prev => ({ ...prev, toStoreId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                      <option value="">Selecione a loja</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Produtos</label>
                  <div className="border border-gray-300 rounded-lg p-4">
                    {transferFormData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.productName}</p>
                          <input type="number" min="1" value={item.quantity} onChange={(e) => {
                            const newItems = [...transferFormData.items];
                            newItems[index].quantity = parseInt(e.target.value) || 1;
                            setTransferFormData(prev => ({ ...prev, items: newItems }));
                          }} className="w-32 px-2 py-1 border border-gray-300 rounded text-sm mt-1" placeholder="Quantidade" />
                        </div>
                        <button onClick={() => {
                          setTransferFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
                        }} className="text-red-600"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <select onChange={(e) => {
                      const productId = e.target.value;
                      if (productId) {
                        const product = products.find(p => p.id === productId);
                        if (product) {
                          setTransferFormData(prev => ({
                            ...prev,
                            items: [...prev.items, { productId: product.id, productName: product.name, quantity: 1 }]
                          }));
                        }
                        e.target.value = '';
                      }
                    }} className="w-full px-3 py-2 border border-gray-300 rounded-lg mt-2">
                      <option value="">Adicionar produto...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                  <textarea value={transferFormData.notes} onChange={(e) => setTransferFormData(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setShowTransferModal(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleAddTransfer} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Adicionar Transferência</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Importar Transferências */}
        {showImportTransferModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Adicionar Transferências por CSV</h3>
                  <button onClick={() => setShowImportTransferModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Selecione um arquivo CSV para importar transferências</p>
                  <input type="file" accept=".csv" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      try {
                        const content = event.target?.result as string;
                        const lines = content.split('\n');
                        const headers = lines[0].split(',').map(h => h.trim());
                        const importedTransfers = lines.slice(1).filter(line => line.trim()).map(line => {
                          const values = line.split(',').map(v => v.trim());
                          return {
                            id: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            number: `TRANS-${Date.now().toString().slice(-6)}`,
                            fromStoreId: values[headers.indexOf('fromStoreId')] || '',
                            fromStoreName: values[headers.indexOf('fromStoreName')] || values[0] || 'Loja Origem',
                            toStoreId: values[headers.indexOf('toStoreId')] || '',
                            toStoreName: values[headers.indexOf('toStoreName')] || values[1] || 'Loja Destino',
                            date: values[headers.indexOf('date')] || values[2] || new Date().toLocaleDateString('pt-BR'),
                            items: [],
                            status: 'pending' as const
                          };
                        });
                        if (importedTransfers.length > 0) {
                          setTransfers(prev => [...prev, ...importedTransfers]);
                          storageManager.set('pdv_transfers', [...transfers, ...importedTransfers]);
                          setShowImportTransferModal(false);
                          alert(`${importedTransfers.length} transferência(s) importada(s) com sucesso!`);
                        }
                      } catch (error) {
                        alert('Erro ao processar arquivo.');
                      }
                    };
                    reader.readAsText(file);
                  }} className="hidden" id="import-transfer-file" />
                  <label htmlFor="import-transfer-file" className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 cursor-pointer inline-block">Selecionar Arquivo CSV</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Usuário */}
        {showUserModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                  <button onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setUserFormData({ name: '', email: '', phone: '', role: 'cashier', status: 'active' });
                  }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <input type="text" value={userFormData.name} onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Nome completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" value={userFormData.email} onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input type="tel" value={formatPhone(userFormData.phone)} onChange={(e) => {
                    const unformatted = unformatPhone(e.target.value);
                    setUserFormData(prev => ({ ...prev, phone: unformatted }));
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="(11) 99999-9999" maxLength={15} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Função *</label>
                  <select value={userFormData.role} onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value as any }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="admin">Administrador</option>
                    <option value="manager">Gerente</option>
                    <option value="cashier">Caixa</option>
                    <option value="seller">Vendedor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select value={userFormData.status} onChange={(e) => setUserFormData(prev => ({ ...prev, status: e.target.value as any }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => {
                    setShowUserModal(false);
                    setEditingUser(null);
                    setUserFormData({ name: '', email: '', phone: '', role: 'cashier', status: 'active' });
                  }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleAddUser} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">{editingUser ? 'Atualizar' : 'Adicionar'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Vendedor */}
        {showSellerModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">{editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}</h3>
                  <button onClick={() => {
                    setShowSellerModal(false);
                    setEditingSeller(null);
                    setSellerFormData({ name: '', email: '', phone: '', cpf: '', commission: 0, status: 'active' });
                  }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                  <input type="text" value={sellerFormData.name} onChange={(e) => setSellerFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Nome completo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input type="email" value={sellerFormData.email} onChange={(e) => setSellerFormData(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input type="tel" value={formatPhone(sellerFormData.phone)} onChange={(e) => {
                    const unformatted = unformatPhone(e.target.value);
                    setSellerFormData(prev => ({ ...prev, phone: unformatted }));
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="(11) 99999-9999" maxLength={15} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPF *</label>
                  <input type="text" value={formatCPF(sellerFormData.cpf)} onChange={(e) => {
                    const unformatted = e.target.value.replace(/\D/g, '');
                    setSellerFormData(prev => ({ ...prev, cpf: unformatted }));
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="000.000.000-00" maxLength={14} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comissão (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={sellerFormData.commission} onChange={(e) => setSellerFormData(prev => ({ ...prev, commission: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select value={sellerFormData.status} onChange={(e) => setSellerFormData(prev => ({ ...prev, status: e.target.value as any }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => {
                    setShowSellerModal(false);
                    setEditingSeller(null);
                    setSellerFormData({ name: '', email: '', phone: '', cpf: '', commission: 0, status: 'active' });
                  }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleAddSeller} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">{editingSeller ? 'Atualizar' : 'Adicionar'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bebê */}
        {showBabyModal && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">Novo Bebê</h3>
                  <button onClick={() => {
                    setShowBabyModal(false);
                    setBabyFormData({ name: '', birthDate: '', gender: 'male', parentName: '', parentPhone: '', parentEmail: '' });
                  }} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Bebê *</label>
                  <input type="text" value={babyFormData.name} onChange={(e) => setBabyFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Nome completo" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Nascimento *</label>
                    <input type="date" value={babyFormData.birthDate} onChange={(e) => setBabyFormData(prev => ({ ...prev, birthDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gênero *</label>
                    <select value={babyFormData.gender} onChange={(e) => setBabyFormData(prev => ({ ...prev, gender: e.target.value as any }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Responsável *</label>
                  <input type="text" value={babyFormData.parentName} onChange={(e) => setBabyFormData(prev => ({ ...prev, parentName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Nome do responsável" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone do Responsável *</label>
                  <input type="tel" value={formatPhone(babyFormData.parentPhone)} onChange={(e) => {
                    const unformatted = unformatPhone(e.target.value);
                    setBabyFormData(prev => ({ ...prev, parentPhone: unformatted }));
                  }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="(11) 99999-9999" maxLength={15} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email do Responsável</label>
                  <input type="email" value={babyFormData.parentEmail} onChange={(e) => setBabyFormData(prev => ({ ...prev, parentEmail: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="email@exemplo.com" />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => {
                    setShowBabyModal(false);
                    setBabyFormData({ name: '', birthDate: '', gender: 'male', parentName: '', parentPhone: '', parentEmail: '' });
                  }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleAddBaby} className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">Adicionar Bebê</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PDVSystemNew;
