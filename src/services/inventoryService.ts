// Serviço de Controle de Estoque Avançado - PloutosLedger

export interface InventoryMovement {
  id: string;
  product_id: string;
  type: 'entry' | 'exit' | 'adjustment' | 'transfer' | 'loss';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  user_id?: string;
  store_id?: string;
  reference?: string; // NF, pedido, etc.
  created_at: string;
  batch_number?: string;
  expiry_date?: string;
}

export interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  status: 'critical' | 'low' | 'ok';
  last_alert_date?: string;
}

export interface InventoryReport {
  total_products: number;
  total_value: number;
  products_low_stock: number;
  products_critical_stock: number;
  movements_today: number;
  movements_this_month: number;
  top_movements: InventoryMovement[];
}

class InventoryService {
  private storageKey: string = 'ploutos_inventory_movements';
  private alertsKey: string = 'ploutos_stock_alerts';

  // Criar movimentação de estoque
  createMovement(movementData: Omit<InventoryMovement, 'id' | 'created_at'>): InventoryMovement {
    const movement: InventoryMovement = {
      ...movementData,
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };

    const movements = this.getAllMovements();
    movements.push(movement);
    localStorage.setItem(this.storageKey, JSON.stringify(movements));

    // Verificar alertas após movimentação
    this.checkStockAlerts(movement.product_id);

    return movement;
  }

  // Obter todas as movimentações
  getAllMovements(): InventoryMovement[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Obter movimentações de um produto
  getProductMovements(productId: string): InventoryMovement[] {
    return this.getAllMovements()
      .filter(m => m.product_id === productId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Obter movimentações por tipo
  getMovementsByType(type: InventoryMovement['type']): InventoryMovement[] {
    return this.getAllMovements()
      .filter(m => m.type === type)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Obter movimentações por período
  getMovementsByPeriod(startDate: Date, endDate: Date): InventoryMovement[] {
    return this.getAllMovements().filter(m => {
      const date = new Date(m.created_at);
      return date >= startDate && date <= endDate;
    });
  }

  // Registrar entrada de estoque
  registerEntry(
    productId: string,
    quantity: number,
    reason: string,
    options?: {
      previousStock?: number;
      batchNumber?: string;
      expiryDate?: string;
      reference?: string;
      userId?: string;
      storeId?: string;
    }
  ): InventoryMovement {
    const previousStock = options?.previousStock ?? 0;
    const newStock = previousStock + quantity;

    return this.createMovement({
      product_id: productId,
      type: 'entry',
      quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
      batch_number: options?.batchNumber,
      expiry_date: options?.expiryDate,
      reference: options?.reference,
      user_id: options?.userId,
      store_id: options?.storeId
    });
  }

  // Registrar saída de estoque
  registerExit(
    productId: string,
    quantity: number,
    reason: string,
    options?: {
      previousStock?: number;
      reference?: string;
      userId?: string;
      storeId?: string;
    }
  ): InventoryMovement {
    const previousStock = options?.previousStock ?? 0;
    const newStock = Math.max(0, previousStock - quantity);

    return this.createMovement({
      product_id: productId,
      type: 'exit',
      quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
      reference: options?.reference,
      user_id: options?.userId,
      store_id: options?.storeId
    });
  }

  // Ajustar estoque
  adjustStock(
    productId: string,
    newStock: number,
    reason: string,
    options?: {
      previousStock?: number;
      userId?: string;
      storeId?: string;
    }
  ): InventoryMovement {
    const previousStock = options?.previousStock ?? 0;
    const difference = newStock - previousStock;

    return this.createMovement({
      product_id: productId,
      type: 'adjustment',
      quantity: Math.abs(difference),
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
      user_id: options?.userId,
      store_id: options?.storeId
    });
  }

  // Registrar transferência entre lojas
  registerTransfer(
    productId: string,
    quantity: number,
    fromStoreId: string,
    toStoreId: string,
    reason: string,
    options?: {
      previousStockFrom?: number;
      previousStockTo?: number;
      userId?: string;
    }
  ): InventoryMovement[] {
    const movements: InventoryMovement[] = [];

    // Saída da loja origem
    if (options?.previousStockFrom !== undefined) {
      movements.push(this.createMovement({
        product_id: productId,
        type: 'transfer',
        quantity,
        previous_stock: options.previousStockFrom,
        new_stock: options.previousStockFrom - quantity,
        reason: `Transferência para loja ${toStoreId}: ${reason}`,
        user_id: options?.userId,
        store_id: fromStoreId
      }));
    }

    // Entrada na loja destino
    if (options?.previousStockTo !== undefined) {
      movements.push(this.createMovement({
        product_id: productId,
        type: 'transfer',
        quantity,
        previous_stock: options.previousStockTo,
        new_stock: options.previousStockTo + quantity,
        reason: `Transferência da loja ${fromStoreId}: ${reason}`,
        user_id: options?.userId,
        store_id: toStoreId
      }));
    }

    return movements;
  }

  // Registrar perda/avaria
  registerLoss(
    productId: string,
    quantity: number,
    reason: string,
    options?: {
      previousStock?: number;
      userId?: string;
      storeId?: string;
    }
  ): InventoryMovement {
    const previousStock = options?.previousStock ?? 0;
    const newStock = Math.max(0, previousStock - quantity);

    return this.createMovement({
      product_id: productId,
      type: 'loss',
      quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
      user_id: options?.userId,
      store_id: options?.storeId
    });
  }

  // Verificar alertas de estoque
  checkStockAlerts(productId: string, currentStock: number, minStock: number, maxStock?: number): StockAlert | null {
    let status: StockAlert['status'] = 'ok';
    
    if (currentStock <= 0) {
      status = 'critical';
    } else if (currentStock <= minStock) {
      status = currentStock <= (minStock * 0.5) ? 'critical' : 'low';
    }

    if (status !== 'ok') {
      const alert: StockAlert = {
        id: `alert_${productId}_${Date.now()}`,
        product_id: productId,
        product_name: '', // Será preenchido pelo componente
        current_stock: currentStock,
        min_stock: minStock,
        max_stock: maxStock || minStock * 3,
        status,
        last_alert_date: new Date().toISOString()
      };

      this.saveAlert(alert);
      return alert;
    }

    return null;
  }

  // Salvar alerta
  private saveAlert(alert: StockAlert) {
    const alerts = this.getAllAlerts();
    const existingIndex = alerts.findIndex(a => a.product_id === alert.product_id);
    
    if (existingIndex >= 0) {
      alerts[existingIndex] = alert;
    } else {
      alerts.push(alert);
    }
    
    localStorage.setItem(this.alertsKey, JSON.stringify(alerts));
  }

  // Obter todos os alertas
  getAllAlerts(): StockAlert[] {
    try {
      const stored = localStorage.getItem(this.alertsKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Obter alertas críticos
  getCriticalAlerts(): StockAlert[] {
    return this.getAllAlerts().filter(a => a.status === 'critical');
  }

  // Obter alertas de estoque baixo
  getLowStockAlerts(): StockAlert[] {
    return this.getAllAlerts().filter(a => a.status === 'low' || a.status === 'critical');
  }

  // Limpar alerta
  clearAlert(productId: string) {
    const alerts = this.getAllAlerts();
    const filtered = alerts.filter(a => a.product_id !== productId);
    localStorage.setItem(this.alertsKey, JSON.stringify(filtered));
  }

  // Gerar relatório de estoque
  generateReport(products: Array<{ id: string; name: string; stock: number; min_stock?: number; price?: number }>): InventoryReport {
    const movements = this.getAllMovements();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const movementsToday = movements.filter(m => {
      const date = new Date(m.created_at);
      date.setHours(0, 0, 0, 0);
      return date.getTime() === today.getTime();
    });

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const movementsThisMonth = movements.filter(m => {
      const date = new Date(m.created_at);
      return date >= thisMonth;
    });

    const lowStockProducts = products.filter(p => {
      const minStock = p.min_stock || 0;
      return p.stock <= minStock;
    });

    const criticalStockProducts = products.filter(p => {
      const minStock = p.min_stock || 0;
      return p.stock <= (minStock * 0.5);
    });

    const totalValue = products.reduce((sum, p) => {
      const price = p.price || 0;
      return sum + (p.stock * price);
    }, 0);

    const topMovements = movements
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return {
      total_products: products.length,
      total_value: totalValue,
      products_low_stock: lowStockProducts.length,
      products_critical_stock: criticalStockProducts.length,
      movements_today: movementsToday.length,
      movements_this_month: movementsThisMonth.length,
      top_movements: topMovements
    };
  }

  // Obter histórico completo de um produto
  getProductHistory(productId: string, limit?: number): InventoryMovement[] {
    const movements = this.getProductMovements(productId);
    return limit ? movements.slice(0, limit) : movements;
  }
}

export default new InventoryService();

