import React, { useState } from 'react';
import { Calculator, DollarSign } from 'lucide-react';

interface ChangeCalculatorProps {
  total: number;
  onClose: () => void;
}

const ChangeCalculator: React.FC<ChangeCalculatorProps> = ({ total, onClose }) => {
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [change, setChange] = useState<number>(0);

  const calculateChange = () => {
    const received = parseFloat(receivedAmount) || 0;
    const calculatedChange = received - total;
    setChange(calculatedChange >= 0 ? calculatedChange : 0);
  };

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setReceivedAmount('');
      setChange(0);
    } else if (key === '00') {
      setReceivedAmount(prev => prev + '00');
    } else {
      setReceivedAmount(prev => prev + key);
    }
    calculateChange();
  };

  const handleBackspace = () => {
    setReceivedAmount(prev => prev.slice(0, -1));
    calculateChange();
  };

  const handleEnter = () => {
    calculateChange();
  };

  React.useEffect(() => {
    calculateChange();
  }, [receivedAmount, total]);

  return (
    <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Calculadora de Troco</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Total da Venda:</span>
                <span className="font-semibold text-lg">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Valor Recebido:</span>
                <span className="font-semibold text-lg">R$ {receivedAmount || '0,00'}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Troco:</span>
                <span className={`text-xl ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {change.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Valor Recebido</span>
              </div>
              <input
                type="text"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                placeholder="Digite o valor recebido..."
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-mono"
              />
            </div>
          </div>

          {/* Teclado Virtual */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', '00'].map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="px-4 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium text-lg"
              >
                {key}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleKeyPress('C')}
              className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              Limpar
            </button>
            <button
              onClick={handleBackspace}
              className="px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium"
            >
              ⌫
            </button>
            <button
              onClick={handleEnter}
              className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              OK
            </button>
          </div>

          {change > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">Troco Calculado:</span>
              </div>
              <p className="text-2xl font-bold text-green-600 mt-2">
                R$ {change.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangeCalculator;
