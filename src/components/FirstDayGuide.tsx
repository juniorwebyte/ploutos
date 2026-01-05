// Componente de guia para primeiro dia de uso
import React, { useState, useEffect } from 'react';
import { X, BookOpen, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';

interface FirstDayGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const STORAGE_KEY = 'ploutos_first_day_completed';

export default function FirstDayGuide({ isOpen, onClose, onComplete }: FirstDayGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Verificar se já foi completado
    const completed = localStorage.getItem(STORAGE_KEY);
    if (completed === 'true') {
      onComplete();
    }
  }, [onComplete]);

  const steps = [
    {
      title: 'Bem-vindo ao PloutosLedger!',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Este guia rápido vai te ajudar a fazer seu primeiro fechamento de caixa.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Passos básicos:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Preencha os valores de entrada (dinheiro, cartão, PIX, etc.)</li>
              <li>Preencha os valores de saída (descontos, retiradas, etc.)</li>
              <li>Revise o resumo e confirme o fechamento</li>
              <li>Salve o registro para histórico</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      title: 'Entradas de Caixa',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>Entradas</strong> são todos os valores que entraram no caixa durante o dia.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-2">💡 Dicas:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-emerald-800">
              <li><strong>Dinheiro:</strong> Valor físico recebido</li>
              <li><strong>Cartão:</strong> Vendas no débito/crédito</li>
              <li><strong>PIX:</strong> Transferências recebidas</li>
              <li>Você pode adicionar múltiplos clientes para PIX, Cartão Link e Boletos</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Saídas de Caixa',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            <strong>Saídas</strong> são valores que saíram do caixa (retiradas, descontos, etc.).
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2">💡 Dicas:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
              <li><strong>Descontos:</strong> Descontos concedidos</li>
              <li><strong>Saída:</strong> Retiradas de dinheiro do caixa</li>
              <li><strong>Devoluções:</strong> Valores devolvidos a clientes</li>
              <li>Vales de funcionários podem ser incluídos ou não no movimento</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: 'Fechamento de Caixa',
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Após preencher entradas e saídas, você pode fechar o caixa.
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">✅ Checklist de Fechamento:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-purple-800">
              <li>Verifique se todos os valores estão corretos</li>
              <li>Confira o saldo final no resumo</li>
              <li>Adicione observações se necessário</li>
              <li>Clique em "Fechar Caixa" para salvar</li>
              <li>O sistema salvará automaticamente no histórico</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onComplete();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Guia Rápido de Fechamento</h2>
                <p className="text-emerald-100 text-sm mt-1">
                  Passo {currentStep + 1} de {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-emerald-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 h-2">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              {steps[currentStep].title}
            </h3>
            {steps[currentStep].content}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <span>Não mostrar novamente</span>
            </label>
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Anterior
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 font-medium flex items-center gap-2"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    Próximo
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Finalizar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

