import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Filter,
  Download,
  Calendar,
  RefreshCw,
  Search,
  Edit,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import inventoryService, { InventoryMovement, StockAlert } from '../services/inventoryService';

interface InventoryManagementProps {
  products: Array<{
    id: string;
    name: string;
    stock: number;
    min_stock?: number;
    price?: number;
    category?: string;
  }>;
  onStockUpdate?: (productId: string, newStock: number) => void;
}

export default function InventoryManagement({ products, onStockUpdate }: InventoryManagementProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'movements' | 'alerts' | 'reports'>('overview');
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementData, setMovementData] = useState({
    productId: '',
    type: 'entry' as InventoryMovement['type'],
    quantity: 0,
    reason: '',
    batchNumber: '',
    expiryDate: ''
  });
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    loadData();
    checkAllAlerts();
  }, [products]);

  const loadData = () => {
    setMovements(inventoryService.getAllMovements());
    setAlerts(inventoryService.getAllAlerts());
    setReport(inventoryService.generateReport(products));
  };

  const checkAllAlerts = () => {
    products.forEach(product => {
      if (product.min_stock !== undefined) {
        inventoryService.checkStockAlerts(
          product.id,
          product.stock,
          product.min_stock
        );
      }
    });
    setAlerts(inventoryService.getAllAlerts());
  };

  const handleCreateMovement = () => {
    if (!movementData.productId || !movementData.quantity || movementData.quantity <= 0 || !movementData.reason) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    const product = products.find(p => p.id === movementData.productId);
    if (!product) {
      alert('Produto não encontrado');
      return;
    }

    try {
      let newMovement: InventoryMovement;

      switch (movementData.type) {
        case 'entry':
          newMovement = inventoryService.registerEntry(
            movementData.productId,
            movementData.quantity,
            movementData.reason,
            {
              previousStock: product.stock,
              batchNumber: movementData.batchNumber || undefined,
              expiryDate: movementData.expiryDate || undefined
            }
          );
          break;
        case 'exit':
          if (movementData.quantity > product.stock) {
            alert('Quantidade insuficiente em estoque');
            return;
          }
          newMovement = inventoryService.registerExit(
            movementData.productId,
            movementData.quantity,
            movementData.reason,
            {
              previousStock: product.stock
            }
          );
          break;
        case 'adjustment':
          newMovement = inventoryService.adjustStock(
            movementData.productId,
            movementData.quantity,
            movementData.reason,
            {
              previousStock: product.stock
            }
          );
          break;
        default:
          alert('Tipo de movimentação inválido');
          return;
      }

      // Atualizar estoque do produto
      if (onStockUpdate) {
        onStockUpdate(movementData.productId, newMovement.new_stock);
      }

      // Recarregar dados
      loadData();

      // Limpar formulário
      setMovementData({
        productId: '',
        type: 'entry',
        quantity: 0,
        reason: '',
        batchNumber: '',
        expiryDate: ''
      });
      setShowMovementModal(false);

      alert('Movimentação registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      alert('Erro ao registrar movimentação');
    }
  };

  const filteredMovements = movements.filter(m => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    
    const movementDate = new Date(m.created_at);
    const startDate = new Date(filterDate.start);
    const endDate = new Date(filterDate.end);
    endDate.setHours(23, 59, 59, 999);
    
    return movementDate >= startDate && movementDate <= endDate;
  });

  const getMovementTypeLabel = (type: InventoryMovement['type']) => {
    const labels = {
      entry: 'Entrada',
      exit: 'Saída',
      adjustment: 'Ajuste',
      transfer: 'Transferência',
      loss: 'Perda/Avaria'
    };
    return labels[type];
  };

  const getMovementTypeColor = (type: InventoryMovement['type']) => {
    const colors = {
      entry: 'bg-green-100 text-green-800',
      exit: 'bg-red-100 text-red-800',
      adjustment: 'bg-blue-100 text-blue-800',
      transfer: 'bg-purple-100 text-purple-800',
      loss: 'bg-orange-100 text-orange-800'
    };
    return colors[type];
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-8 h-8" />
            <span className="text-3xl font-bold">{products.length}</span>
          </div>
          <p className="text-blue-100">Total de Produtos</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8" />
            <span className="text-3xl font-bold">{alerts.filter(a => a.status === 'critical').length}</span>
          </div>
          <p className="text-orange-100">Estoque Crítico</p>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-8 h-8" />
            <span className="text-3xl font-bold">{alerts.filter(a => a.status === 'low').length}</span>
          </div>
          <p className="text-yellow-100">Estoque Baixo</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8" />
            <span className="text-3xl font-bold">{report?.movements_today || 0}</span>
          </div>
          <p className="text-green-100">Movimentações Hoje</p>
        </div>
      </div>

      {/* Alertas Críticos */}
      {alerts.filter(a => a.status === 'critical').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-bold text-red-800">Estoque Crítico</h3>
          </div>
          <div className="space-y-2">
            {alerts.filter(a => a.status === 'critical').slice(0, 5).map(alert => {
              const product = products.find(p => p.id === alert.product_id);
              return (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">{product?.name || alert.product_name}</p>
                    <p className="text-sm text-gray-600">
                      Estoque: {alert.current_stock} | Mínimo: {alert.min_stock}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    Crítico
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Produtos com Estoque Baixo */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Produtos com Estoque Baixo</h3>
          <button
            onClick={() => setActiveTab('alerts')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver todos <ArrowRight className="w-4 h-4 inline ml-1" />
          </button>
        </div>
        <div className="space-y-2">
          {alerts.filter(a => a.status === 'low' || a.status === 'critical').slice(0, 10).map(alert => {
            const product = products.find(p => p.id === alert.product_id);
            return (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product?.name || alert.product_name}</p>
                  <p className="text-sm text-gray-600">
                    {alert.current_stock} unidades (mínimo: {alert.min_stock})
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.status === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {alert.status === 'critical' ? 'Crítico' : 'Baixo'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderMovements = () => (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="entry">Entrada</option>
              <option value="exit">Saída</option>
              <option value="adjustment">Ajuste</option>
              <option value="transfer">Transferência</option>
              <option value="loss">Perda/Avaria</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
            <input
              type="date"
              value={filterDate.start}
              onChange={(e) => setFilterDate(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
            <input
              type="date"
              value={filterDate.end}
              onChange={(e) => setFilterDate(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => loadData()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Movimentações */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque Anterior</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Novo Estoque</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma movimentação encontrada
                  </td>
                </tr>
              ) : (
                filteredMovements.map(movement => {
                  const product = products.find(p => p.id === movement.product_id);
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(movement.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product?.name || 'Produto não encontrado'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMovementTypeColor(movement.type)}`}>
                          {getMovementTypeLabel(movement.type)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        movement.type === 'entry' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.previous_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {movement.new_stock}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {movement.reason}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alertas Críticos */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-bold text-red-800">Estoque Crítico ({alerts.filter(a => a.status === 'critical').length})</h3>
          </div>
          <div className="space-y-2">
            {alerts.filter(a => a.status === 'critical').length === 0 ? (
              <p className="text-gray-600">Nenhum produto com estoque crítico</p>
            ) : (
              alerts.filter(a => a.status === 'critical').map(alert => {
                const product = products.find(p => p.id === alert.product_id);
                return (
                  <div key={alert.id} className="bg-white p-4 rounded-lg">
                    <p className="font-semibold text-gray-900">{product?.name || alert.product_name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-600">
                        Estoque: <span className="font-bold text-red-600">{alert.current_stock}</span> | 
                        Mínimo: <span className="font-bold">{alert.min_stock}</span>
                      </p>
                      <button
                        onClick={() => {
                          inventoryService.clearAlert(alert.product_id);
                          loadData();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Limpar alerta
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Alertas de Estoque Baixo */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-bold text-yellow-800">Estoque Baixo ({alerts.filter(a => a.status === 'low').length})</h3>
          </div>
          <div className="space-y-2">
            {alerts.filter(a => a.status === 'low').length === 0 ? (
              <p className="text-gray-600">Nenhum produto com estoque baixo</p>
            ) : (
              alerts.filter(a => a.status === 'low').map(alert => {
                const product = products.find(p => p.id === alert.product_id);
                return (
                  <div key={alert.id} className="bg-white p-4 rounded-lg">
                    <p className="font-semibold text-gray-900">{product?.name || alert.product_name}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-gray-600">
                        Estoque: <span className="font-bold text-yellow-600">{alert.current_stock}</span> | 
                        Mínimo: <span className="font-bold">{alert.min_stock}</span>
                      </p>
                      <button
                        onClick={() => {
                          inventoryService.clearAlert(alert.product_id);
                          loadData();
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Limpar alerta
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Total de Produtos</h4>
              <p className="text-3xl font-bold text-gray-900">{report.total_products}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Valor Total em Estoque</h4>
              <p className="text-3xl font-bold text-green-600">
                R$ {report.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h4 className="text-sm font-medium text-gray-600 mb-2">Movimentações Este Mês</h4>
              <p className="text-3xl font-bold text-blue-600">{report.movements_this_month}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Últimas Movimentações</h3>
            <div className="space-y-2">
              {report.top_movements.slice(0, 10).map(movement => {
                const product = products.find(p => p.id === movement.product_id);
                return (
                  <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product?.name || 'Produto não encontrado'}</p>
                      <p className="text-sm text-gray-600">{movement.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${movement.type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.type === 'entry' ? '+' : '-'}{movement.quantity}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(movement.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Controle de Estoque Avançado</h2>
          <p className="text-gray-600">Gerencie movimentações, alertas e relatórios de estoque</p>
        </div>
        <button
          onClick={() => setShowMovementModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Movimentação
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Visão Geral' },
            { id: 'movements', label: 'Movimentações' },
            { id: 'alerts', label: 'Alertas' },
            { id: 'reports', label: 'Relatórios' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'movements' && renderMovements()}
      {activeTab === 'alerts' && renderAlerts()}
      {activeTab === 'reports' && renderReports()}

      {/* Modal de Nova Movimentação */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">Nova Movimentação de Estoque</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produto *</label>
                <select
                  value={movementData.productId}
                  onChange={(e) => setMovementData(prev => ({ ...prev, productId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione um produto</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (Estoque: {product.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Movimentação *</label>
                <select
                  value={movementData.type}
                  onChange={(e) => setMovementData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="entry">Entrada</option>
                  <option value="exit">Saída</option>
                  <option value="adjustment">Ajuste</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {movementData.type === 'adjustment' ? 'Novo Estoque' : 'Quantidade'} *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={movementData.quantity || ''}
                  onChange={(e) => setMovementData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo *</label>
                <textarea
                  value={movementData.reason}
                  onChange={(e) => setMovementData(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ex: Compra de fornecedor, Venda, Ajuste de inventário..."
                  required
                />
              </div>

              {movementData.type === 'entry' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lote (opcional)</label>
                    <input
                      type="text"
                      value={movementData.batchNumber}
                      onChange={(e) => setMovementData(prev => ({ ...prev, batchNumber: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Número do lote"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data de Validade (opcional)</label>
                    <input
                      type="date"
                      value={movementData.expiryDate}
                      onChange={(e) => setMovementData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowMovementModal(false);
                    setMovementData({
                      productId: '',
                      type: 'entry',
                      quantity: 0,
                      reason: '',
                      batchNumber: '',
                      expiryDate: ''
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateMovement}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Registrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

