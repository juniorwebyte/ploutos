import React from 'react';
import { FiscalReceipt } from '../services/pdvService';

interface FiscalReceiptPrintProps {
  receipt: FiscalReceipt;
  companyName?: string;
  companyAddress?: string;
  companyCNPJ?: string;
}

export default function FiscalReceiptPrint({
  receipt,
  companyName = 'Empresa',
  companyAddress = 'Endereço não configurado',
  companyCNPJ = '00.000.000/0000-00'
}: FiscalReceiptPrintProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="receipt-root bg-white p-6 font-mono text-xs mx-auto" style={{ width: '80mm', maxWidth: '100%' }}>
      {/* Cabeçalho */}
      <div className="text-center border-b-2 border-black pb-3 mb-3">
        <div className="font-bold text-sm mb-1">{companyName}</div>
        <div className="text-[10px]">{companyAddress}</div>
        <div className="text-[10px]">CNPJ: {companyCNPJ}</div>
      </div>

      {/* Título */}
      <div className="text-center font-bold text-sm mb-3 border-b border-gray-400 pb-2">
        CUPOM FISCAL ELETRÔNICO
      </div>

      {/* Informações do Cupom */}
      <div className="space-y-1 mb-3 text-[10px] border-b border-gray-400 pb-2">
        <div className="flex justify-between">
          <span>Número:</span>
          <span className="font-bold">{receipt.receipt_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Série:</span>
          <span className="font-bold">{receipt.series}</span>
        </div>
        <div className="flex justify-between">
          <span>Data/Hora:</span>
          <span>{formatDate(receipt.issue_date)}</span>
        </div>
        <div className="flex justify-between">
          <span>Venda:</span>
          <span>#{receipt.sale_id}</span>
        </div>
      </div>

      {/* Itens (se disponível) */}
      {receipt.items && receipt.items.length > 0 && (
        <div className="mb-3 border-b border-gray-400 pb-2">
          <div className="font-bold mb-2 text-[11px]">ITENS</div>
          <div className="space-y-1">
            {receipt.items.map((item, index) => (
              <div key={index} className="text-[10px]">
                <div className="flex justify-between">
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex justify-between ml-2">
                  <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                  <span className="font-bold">{formatCurrency(item.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Valores */}
      <div className="space-y-1 mb-3 text-[11px] border-b-2 border-black pb-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(receipt.total_amount - receipt.tax_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span>Impostos:</span>
          <span>{formatCurrency(receipt.tax_amount)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm mt-2">
          <span>TOTAL:</span>
          <span>{formatCurrency(receipt.total_amount)}</span>
        </div>
      </div>

      {/* Forma de Pagamento */}
      {receipt.payment_method && (
        <div className="mb-3 text-[10px] border-b border-gray-400 pb-2">
          <div className="font-bold mb-1">FORMA DE PAGAMENTO</div>
          <div className="flex justify-between">
            <span>{receipt.payment_method}</span>
            <span>{formatCurrency(receipt.total_amount)}</span>
          </div>
        </div>
      )}

      {/* Observações */}
      {receipt.notes && (
        <div className="mb-3 text-[10px] border-b border-gray-400 pb-2">
          <div className="font-bold mb-1">OBSERVAÇÕES</div>
          <div>{receipt.notes}</div>
        </div>
      )}

      {/* Rodapé */}
      <div className="text-center text-[9px] space-y-1 border-t-2 border-black pt-2">
        <div className="font-bold">OBRIGADO PELA PREFERÊNCIA!</div>
        <div>Consulte a autenticidade em:</div>
        <div className="font-mono">www.seusite.com.br/cupom/{receipt.id}</div>
        <div className="mt-2">Emitido via PloutosLedger</div>
      </div>

      {/* Status */}
      <div className="text-center mt-4 pt-2 border-t border-gray-300">
        <div className={`text-[10px] font-bold ${
          receipt.status === 'issued' ? 'text-green-600' : 'text-red-600'
        }`}>
          {receipt.status === 'issued' ? '✓ CUPOM VÁLIDO' : '✗ CUPOM CANCELADO'}
        </div>
      </div>
    </div>
  );
}
