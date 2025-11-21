import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  Calendar,
  DollarSign,
  Eye,
  X,
  Save,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import paymentGatewayService from '../services/paymentGatewayService';
import { formatPhone, formatCEP, unformatPhone, unformatCEP } from '../utils/formatters';

interface CustomerManagerProps {
  onClose: () => void;
}

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  total_charges: number;
  total_amount: number;
  last_payment?: string;
  payment_methods: string[];
}

function CustomerManager({ onClose }: CustomerManagerProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'BR',
    metadata: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await paymentGatewayService.getCustomers({ limit: 100 });
      setCustomers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      // Dados simulados para demo
      const mockCustomers: Customer[] = [
        {
          id: 'cus_1234567890',
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '(11) 99999-9999',
          address: {
            line1: 'Rua das Flores, 123',
            line2: 'Apto 45',
            city: 'São Paulo',
            state: 'SP',
            postal_code: '01234-567',
            country: 'BR'
          },
          created_at: '2025-01-10T10:00:00Z',
          updated_at: '2025-01-15T14:30:00Z',
          total_charges: 23,
          total_amount: 45678.90,
          last_payment: '2025-01-15T14:30:00Z',
          payment_methods: ['pix', 'credit_card']
        },
        {
          id: 'cus_0987654321',
          name: 'Maria Santos',
          email: 'maria@email.com',
          phone: '(21) 88888-8888',
          address: {
            line1: 'Av. Paulista, 1000',
            city: 'Rio de Janeiro',
            state: 'RJ',
            postal_code: '20000-000',
            country: 'BR'
          },
          created_at: '2025-01-12T15:30:00Z',
          updated_at: '2025-01-14T09:15:00Z',
          total_charges: 18,
          total_amount: 34567.89,
          last_payment: '2025-01-14T09:15:00Z',
          payment_methods: ['pix', 'bitcoin']
        },
        {
          id: 'cus_1122334455',
          name: 'Pedro Costa',
          email: 'pedro@email.com',
          phone: '(31) 77777-7777',
          address: {
            line1: 'Rua da Liberdade, 456',
            city: 'Belo Horizonte',
            state: 'MG',
            postal_code: '30000-000',
            country: 'BR'
          },
          created_at: '2025-01-08T08:45:00Z',
          updated_at: '2025-01-13T16:20:00Z',
          total_charges: 15,
          total_amount: 23456.78,
          last_payment: '2025-01-13T16:20:00Z',
          payment_methods: ['credit_card', 'debit_card']
        }
      ];
      setCustomers(mockCustomers);
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    if (!formData.name || !formData.email) {
      alert('Preencha nome e e-mail obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address_line1 ? {
          line1: formData.address_line1,
          line2: formData.address_line2 || undefined,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country
        } : undefined,
        metadata: formData.metadata ? JSON.parse(formData.metadata) : undefined
      };

      const newCustomer = await paymentGatewayService.createCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      alert('Erro ao criar cliente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (customerId: string) => {
    setLoading(true);
    try {
      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address_line1 ? {
          line1: formData.address_line1,
          line2: formData.address_line2 || undefined,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
          country: formData.country
        } : undefined,
        metadata: formData.metadata ? JSON.parse(formData.metadata) : undefined
      };

      const updatedCustomer = await paymentGatewayService.getCustomer(customerId);
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...customerData } : c));
      setEditingCustomer(null);
      resetForm();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;

    setLoading(true);
    try {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'BR',
      metadata: ''
    });
  };

  const fillFormWithCustomer = (customer: Customer) => {
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address_line1: customer.address?.line1 || '',
      address_line2: customer.address?.line2 || '',
      city: customer.address?.city || '',
      state: customer.address?.state || '',
      postal_code: customer.address?.postal_code || '',
      country: customer.address?.country || 'BR',
      metadata: customer.metadata ? JSON.stringify(customer.metadata, null, 2) : ''
    });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  const exportCustomers = () => {
    const csvContent = [
      ['Nome', 'E-mail', 'Telefone', 'Cidade', 'Estado', 'Total de Cobranças', 'Valor Total', 'Último Pagamento'],
      ...filteredCustomers.map(customer => [
        customer.name,
        customer.email,
        customer.phone || '',
        customer.address?.city || '',
        customer.address?.state || '',
        customer.total_charges.toString(),
        customer.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        customer.last_payment ? new Date(customer.last_payment).toLocaleDateString('pt-BR') : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clientes.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b rounded-t-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Gerenciar Clientes</h2>
              <p className="text-sm text-gray-600">Gerencie sua base de clientes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Header com ações */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent w-64"
                />
              </div>
              <button
                onClick={loadCustomers}
                disabled={loading}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={exportCustomers}
                className="px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Cliente</span>
              </button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total de Clientes</p>
                  <p className="text-2xl font-bold">{customers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Volume Total</p>
                  <p className="text-2xl font-bold">R$ {customers.reduce((sum, c) => sum + c.total_amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Transações</p>
                  <p className="text-2xl font-bold">{customers.reduce((sum, c) => sum + c.total_charges, 0)}</p>
                </div>
                <CreditCard className="w-8 h-8 text-purple-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Ticket Médio</p>
                  <p className="text-2xl font-bold">R$ {customers.length > 0 ? (customers.reduce((sum, c) => sum + c.total_amount, 0) / customers.reduce((sum, c) => sum + c.total_charges, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</p>
                </div>
                <Calendar className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Localização</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transações</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Pagamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">ID: {customer.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email}</div>
                        {customer.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.address ? (
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {customer.address.city}, {customer.address.state}
                            </div>
                            <div className="text-sm text-gray-500">{customer.address.postal_code}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Não informado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.total_charges}</div>
                        <div className="text-sm text-gray-500">
                          {customer.payment_methods.map(method => (
                            <span key={method} className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs mr-1">
                              {method}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          R$ {customer.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {customer.last_payment ? (
                          <div className="text-sm text-gray-900">
                            {new Date(customer.last_payment).toLocaleDateString('pt-BR')}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Nunca</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              fillFormWithCustomer(customer);
                              setEditingCustomer(customer);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formulário de Criação/Edição */}
          {(showCreateForm || editingCustomer) && (
            <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                  </h3>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Nome completo"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={formatPhone(formData.phone)}
                      onChange={(e) => {
                        const unformatted = unformatPhone(e.target.value);
                        setFormData(prev => ({ ...prev, phone: unformatted }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                      <input
                        type="text"
                        value={formData.address_line1}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Rua, número"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                      <input
                        type="text"
                        value={formData.address_line2}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Apto, bloco"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Cidade"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="SP"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                      <input
                        type="text"
                        value={formatCEP(formData.postal_code)}
                        onChange={(e) => {
                          const unformatted = unformatCEP(e.target.value);
                          setFormData(prev => ({ ...prev, postal_code: unformatted }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="01234-567"
                        maxLength={9}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Metadata (JSON)</label>
                    <textarea
                      value={formData.metadata}
                      onChange={(e) => setFormData(prev => ({ ...prev, metadata: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder='{"segmento": "premium", "origem": "site"}'
                    />
                  </div>
                </div>
                
                <div className="p-6 border-t flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingCustomer(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => editingCustomer ? updateCustomer(editingCustomer.id) : createCustomer()}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>{editingCustomer ? 'Atualizando...' : 'Criando...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{editingCustomer ? 'Atualizar' : 'Criar'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerManager;
