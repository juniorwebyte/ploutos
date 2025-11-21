import React from 'react';
import { Calculator, Delete } from 'lucide-react';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  onEnter: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onKeyPress,
  onClear,
  onBackspace,
  onEnter
}) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['0', '.', '00']
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Teclado Numérico</h3>
        <Calculator className="w-5 h-5 text-gray-600" />
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {keys.map((row, rowIndex) =>
          row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className="px-4 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium text-lg"
            >
              {key}
            </button>
          ))
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onClear}
          className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
        >
          C
        </button>
        <button
          onClick={onBackspace}
          className="px-4 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium flex items-center justify-center"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          onClick={onEnter}
          className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
