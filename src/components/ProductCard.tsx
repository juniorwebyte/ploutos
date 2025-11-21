import React from 'react';
import { Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

// Componente memoizado para evitar re-renders desnecessários
const ProductCard = React.memo<ProductCardProps>(({ product, onAddToCart }) => {
  return (
    <div
      key={product.id}
      onClick={() => onAddToCart(product)}
      className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200 hover:border-emerald-300 hover:shadow-md"
    >
      <div className="text-center">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-16 h-16 object-cover rounded-lg mx-auto mb-3 border border-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-16 h-16 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg mx-auto mb-3 flex items-center justify-center ${product.image ? 'hidden' : ''}`}>
          <Package className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-medium text-gray-800 text-sm mb-1">{product.name}</h3>
        <p className="text-emerald-600 font-bold text-lg">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        <p className="text-xs text-gray-500 mt-1">Estoque: {product.stock}</p>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada para evitar re-renders desnecessários
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.product.stock === nextProps.product.stock &&
    prevProps.product.name === nextProps.product.name &&
    prevProps.product.image === nextProps.product.image
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

