import React from 'react';
import { X, Minus, Plus } from 'lucide-react';

interface SaleItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface CartItemProps {
  item: SaleItem;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

// Componente memoizado para itens do carrinho
const CartItem = React.memo<CartItemProps>(({ item, onRemove, onUpdateQuantity }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-800 text-sm">{item.product_name}</h4>
        <button
          onClick={() => onRemove(item.product_id)}
          className="text-red-500 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <span className="font-bold text-emerald-600">
          R$ {item.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada
  return (
    prevProps.item.product_id === nextProps.item.product_id &&
    prevProps.item.quantity === nextProps.item.quantity &&
    prevProps.item.total_price === nextProps.item.total_price &&
    prevProps.item.product_name === nextProps.item.product_name
  );
});

CartItem.displayName = 'CartItem';

export default CartItem;

