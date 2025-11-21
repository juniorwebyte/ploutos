import React from 'react';
import CashFlow from './CashFlow';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-bold text-gray-900">Demonstração do Sistema</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-sm">Fechar</button>
        </div>
        <div className="max-h-[80vh] overflow-auto">
          <CashFlow />
        </div>
      </div>
    </div>
  );
}


