import React from 'react';
import { Cancelamento } from '../types';
import { formatCurrency } from '../utils/currency';

interface CancelamentosPrintProps {
  cancelamentos: Cancelamento[];
}

export default function CancelamentosPrint({ cancelamentos }: CancelamentosPrintProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const totalCancelamentos = cancelamentos.reduce((total, c) => total + c.valor, 0);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Relatório de Cancelamentos</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    /* Compatibilidade com impressoras A4 */
    @media print and (min-width: 210mm) {
      @page {
        size: A4;
        margin: 10mm;
      }
      .container {
        max-width: 180mm;
      }
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      background: white;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 5mm 0;
    }
    .container {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 0 5mm;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid black;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    .logo {
      max-width: 60mm;
      height: auto;
      margin: 0 auto 5px;
    }
    h1 {
      font-size: 14px;
      font-weight: bold;
      margin: 5px 0;
    }
    .section {
      margin-bottom: 10px;
    }
    .cancelamento-item {
      border: 2px solid black;
      padding: 5px;
      margin: 5px 0;
      border-radius: 3px;
    }
    .cancelamento-header {
      font-weight: bold;
      text-align: center;
      border-bottom: 1px solid black;
      padding-bottom: 3px;
      margin-bottom: 3px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      font-size: 11px;
    }
    .total {
      border-top: 2px solid black;
      border-bottom: 2px solid black;
      padding: 5px 0;
      margin: 10px 0;
      text-align: center;
      background: #f0f0f0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      border-top: 2px solid black;
      padding-top: 5px;
      margin-top: 10px;
      font-size: 10px;
    }
    @media print {
      html, body {
        width: 80mm;
        margin: 0 auto;
        padding: 0;
        display: block;
      }
      body {
        padding: 5mm 0;
      }
      .container {
        width: 70mm;
        margin: 0 auto;
      }
      /* Compatibilidade com impressoras A4 */
      @media (min-width: 210mm) {
        html, body {
          width: 100%;
        }
        .container {
          width: 180mm;
          max-width: 180mm;
        }
      }
    }
  </style>
</head>
<body>
  <div class="container">
  <div class="header">
    <img src="/logo_header.png" alt="Logo" class="logo" onerror="this.style.display='none'">
    <h1>RELATÓRIO DE CANCELAMENTOS</h1>
    <div>Sistema de Movimento de Caixa</div>
    <div>Data: ${new Date().toLocaleDateString('pt-BR')}</div>
    <div>Hora: ${new Date().toLocaleTimeString('pt-BR')}</div>
  </div>

  ${cancelamentos.length === 0 ? `
    <div class="section" style="text-align: center; padding: 20px;">
      <div style="font-weight: bold;">Nenhum cancelamento registrado hoje</div>
    </div>
  ` : `
    <div class="section">
      ${cancelamentos.map((cancelamento, index) => `
        <div class="cancelamento-item">
          <div class="cancelamento-header">CANCELAMENTO #${index + 1}</div>
          <div class="row"><span>Pedido:</span><span>${cancelamento.numeroPedido}</span></div>
          <div class="row"><span>Hora:</span><span>${cancelamento.horaCancelamento}</span></div>
          <div class="row"><span>Vendedor:</span><span>${cancelamento.vendedor}</span></div>
          <div class="row"><span>Novo Pedido:</span><span>${cancelamento.numeroNovoPedido || 'N/A'}</span></div>
          <div class="row"><span>Motivo:</span><span>${cancelamento.motivo}</span></div>
          ${cancelamento.descricaoMotivo ? `<div class="row" style="border-top: 1px solid black; padding-top: 3px; margin-top: 3px;"><span>Descrição:</span></div><div style="padding: 3px; font-size: 10px; word-wrap: break-word; border-bottom: 1px solid black; margin-bottom: 3px;">${cancelamento.descricaoMotivo}</div>` : ''}
          <div class="row"><span>Gerente:</span><span>${cancelamento.assinaturaGerente}</span></div>
          <div class="row" style="border-top: 1px solid black; padding-top: 3px; margin-top: 3px; font-weight: bold; color: red;">
            <span>VALOR:</span><span>${formatCurrency(cancelamento.valor)}</span>
          </div>
          <div style="margin-top: 20px; padding-top: 10px; border-top: 2px solid black; text-align: center;">
            <div style="border-top: 1px solid black; margin-top: 40px; padding-top: 5px; text-align: center; font-size: 10px;">
              <div>Assinatura da Gerente</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="total">
      <div>TOTAL CANCELAMENTOS: ${formatCurrency(totalCancelamentos)}</div>
    </div>
  `}

  <div class="footer">
    <div>================================</div>
    <div>Webyte | Tecnologia Laravel</div>
    <div>Gerado: ${new Date().toLocaleString('pt-BR')}</div>
    <div>================================</div>
  </div>
  </div>
</body>
</html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  return (
    <button
      onClick={handlePrint}
      className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      🖨️ Imprimir Relatório de Cancelamentos
    </button>
  );
}
