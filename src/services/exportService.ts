// Serviço de exportação avançada (PDF, Excel, CSV)
import { CashFlowData } from '../types';
import { formatCurrency } from '../utils/currency';
import * as XLSX from 'xlsx';

class ExportService {
  private readonly HIGH_VALUE_THRESHOLD = 10000;

  /**
   * Exportar para PDF profissional
   */
  exportToPDF(data: CashFlowData, options?: {
    includeDetails?: boolean;
    includeCharts?: boolean;
    companyInfo?: any;
  }): void {
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para exportar o PDF');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');

    // Calcular totais
    const totalEntradas = this.calculateTotalEntradas(data);
    const totalSaidas = this.calculateTotalSaidas(data);
    const saldo = totalEntradas - totalSaidas;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Movimento de Caixa - ${dateStr}</title>
          <style>
            @media print {
              @page {
                margin: 1.5cm;
                size: A4;
              }
              body { margin: 0; }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 30px;
              color: #1f2937;
              background: #ffffff;
              line-height: 1.6;
            }
            .header {
              border-bottom: 4px solid #059669;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #059669;
              font-size: 28px;
              margin-bottom: 10px;
            }
            .header-info {
              display: flex;
              justify-content: space-between;
              color: #6b7280;
              font-size: 12px;
            }
            ${options?.companyInfo ? `
            .company-info {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 30px;
              border-left: 4px solid #059669;
            }
            .company-info h2 {
              color: #047857;
              font-size: 18px;
              margin-bottom: 15px;
            }
            .company-info p {
              margin: 5px 0;
              color: #374151;
            }
            ` : ''}
            .section {
              margin: 30px 0;
              page-break-inside: avoid;
            }
            .section-title {
              color: #047857;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 2px solid #d1fae5;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin: 20px 0;
            }
            .metric-card {
              background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
              border: 2px solid #d1fae5;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
            }
            .metric-label {
              font-size: 13px;
              color: #047857;
              margin-bottom: 8px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .metric-value {
              font-size: 28px;
              font-weight: bold;
              color: #065f46;
            }
            .metric-value.positive {
              color: #059669;
            }
            .metric-value.negative {
              color: #dc2626;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background: white;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            th {
              background: linear-gradient(135deg, #059669 0%, #047857 100%);
              color: white;
              padding: 14px;
              text-align: left;
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td {
              padding: 12px 14px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            tr:hover {
              background: #f3f4f6;
            }
            .total-row {
              background: #f0fdf4 !important;
              font-weight: bold;
              font-size: 16px;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 3px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 11px;
            }
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-around;
            }
            .signature-box {
              width: 250px;
              border-top: 2px solid #374151;
              padding-top: 10px;
              text-align: center;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Relatório de Movimento de Caixa</h1>
            <div class="header-info">
              <span><strong>Data:</strong> ${dateStr}</span>
              <span><strong>Hora:</strong> ${timeStr}</span>
            </div>
          </div>

          ${options?.companyInfo ? `
          <div class="company-info">
            <h2>Dados da Empresa</h2>
            <p><strong>Razão Social:</strong> ${options.companyInfo.razaoSocial || 'N/A'}</p>
            <p><strong>CNPJ:</strong> ${options.companyInfo.cnpj || 'N/A'}</p>
            <p><strong>Endereço:</strong> ${options.companyInfo.endereco?.logradouro || ''}, ${options.companyInfo.endereco?.numero || ''} - ${options.companyInfo.endereco?.cidade || ''}/${options.companyInfo.endereco?.estado || ''}</p>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Resumo Financeiro</div>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-label">Total de Entradas</div>
                <div class="metric-value positive">${formatCurrency(totalEntradas)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Total de Saídas</div>
                <div class="metric-value negative">${formatCurrency(totalSaidas)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">Saldo Final</div>
                <div class="metric-value ${saldo >= 0 ? 'positive' : 'negative'}">${formatCurrency(saldo)}</div>
              </div>
            </div>
          </div>

          ${options?.includeDetails ? this.generateDetailsHTML(data) : ''}

          <div class="footer">
            <p>Relatório gerado automaticamente pelo sistema PloutosLedger</p>
            <p>Este documento é confidencial e destinado apenas ao uso interno</p>
          </div>

          <div class="signature-section">
            <div class="signature-box">
              <p>Operador de Caixa</p>
            </div>
            <div class="signature-box">
              <p>Gerente/Responsável</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  /**
   * Exportar para Excel formatado
   */
  exportToExcel(data: CashFlowData, filename: string = 'movimento_caixa'): void {
    const workbook = XLSX.utils.book_new();

    // Planilha de Resumo
    const resumoData = [
      ['Relatório de Movimento de Caixa'],
      ['Data', new Date().toLocaleDateString('pt-BR')],
      [''],
      ['Resumo Financeiro'],
      ['Total de Entradas', this.calculateTotalEntradas(data)],
      ['Total de Saídas', this.calculateTotalSaidas(data)],
      ['Saldo Final', this.calculateTotalEntradas(data) - this.calculateTotalSaidas(data)],
      [''],
      ['Detalhamento de Entradas'],
      ['Método', 'Valor'],
      ['Dinheiro', data.entries.dinheiro],
      ['Cartão', data.entries.cartao],
      ['PIX Maquininha', data.entries.pixMaquininha],
      ['PIX Conta', data.entries.pixConta],
      ['Boletos', data.entries.boletos],
      ['Cheques', data.entries.cheque || 0],
      [''],
      ['Detalhamento de Saídas'],
      ['Tipo', 'Valor'],
      ['Descontos', data.exits.descontos],
      ['Saídas', data.exits.saida],
      ['Compras', data.exits.valorCompra || 0],
    ];

    const resumoSheet = XLSX.utils.aoa_to_sheet(resumoData);
    
    // Aplicar formatação
    resumoSheet['!cols'] = [
      { wch: 25 },
      { wch: 20 }
    ];

    XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');

    // Planilha de Detalhes (se necessário)
    if (data.entries.pixContaClientes && data.entries.pixContaClientes.length > 0) {
      const detalhesData = [
        ['PIX Conta - Clientes'],
        ['Cliente', 'Valor'],
        ...data.entries.pixContaClientes.map(c => [c.nome, c.valor])
      ];
      const detalhesSheet = XLSX.utils.aoa_to_sheet(detalhesData);
      XLSX.utils.book_append_sheet(workbook, detalhesSheet, 'PIX Conta');
    }

    // Salvar arquivo
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * Exportar para CSV
   */
  exportToCSV(data: CashFlowData, filename: string = 'movimento_caixa'): void {
    const csvRows = [
      ['Relatório de Movimento de Caixa'],
      ['Data', new Date().toLocaleDateString('pt-BR')],
      [''],
      ['Método de Pagamento', 'Valor'],
      ['Dinheiro', data.entries.dinheiro.toString()],
      ['Cartão', data.entries.cartao.toString()],
      ['PIX Maquininha', data.entries.pixMaquininha.toString()],
      ['PIX Conta', data.entries.pixConta.toString()],
      ['Boletos', data.entries.boletos.toString()],
      ['Cheques', (data.entries.cheque || 0).toString()],
      [''],
      ['Total Entradas', this.calculateTotalEntradas(data).toString()],
      ['Total Saídas', this.calculateTotalSaidas(data).toString()],
      ['Saldo Final', (this.calculateTotalEntradas(data) - this.calculateTotalSaidas(data)).toString()],
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  private calculateTotalEntradas(data: CashFlowData): number {
    const totalCheques = Array.isArray(data.entries.cheques)
      ? data.entries.cheques.reduce((sum, cheque) => sum + (Number(cheque.valor) || 0), 0)
      : 0;
    
    const totalTaxas = Array.isArray(data.entries.taxas)
      ? data.entries.taxas.reduce((sum, taxa) => sum + (Number(taxa.valor) || 0), 0)
      : 0;

    return (
      data.entries.dinheiro +
      data.entries.fundoCaixa +
      data.entries.cartao +
      data.entries.cartaoLink +
      data.entries.boletos +
      data.entries.pixMaquininha +
      data.entries.pixConta +
      totalCheques +
      totalTaxas
    );
  }

  private calculateTotalSaidas(data: CashFlowData): number {
    return (
      data.exits.descontos +
      data.exits.saida +
      (data.exits.valorCompra || 0) +
      (data.exits.valorSaidaDinheiro || 0)
    );
  }

  private generateDetailsHTML(data: CashFlowData): string {
    return `
      <div class="section">
        <div class="section-title">Detalhamento de Entradas</div>
        <table>
          <thead>
            <tr>
              <th>Método de Pagamento</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Dinheiro</td><td>${formatCurrency(data.entries.dinheiro)}</td></tr>
            <tr><td>Cartão</td><td>${formatCurrency(data.entries.cartao)}</td></tr>
            <tr><td>PIX Maquininha</td><td>${formatCurrency(data.entries.pixMaquininha)}</td></tr>
            <tr><td>PIX Conta</td><td>${formatCurrency(data.entries.pixConta)}</td></tr>
            <tr><td>Boletos</td><td>${formatCurrency(data.entries.boletos)}</td></tr>
            <tr class="total-row"><td><strong>Total</strong></td><td><strong>${formatCurrency(this.calculateTotalEntradas(data))}</strong></td></tr>
          </tbody>
        </table>
      </div>
    `;
  }
}

export const exportService = new ExportService();
