import React from 'react';
import { CashFlowData } from '../types';
import { formatCurrency } from '../utils/currency';

interface PrintReportProps {
  data: CashFlowData;
  incluirObservacoes?: boolean;
}

export default function PrintReport({ data, incluirObservacoes = false }: PrintReportProps) {
  const handlePrint = (reduced: boolean = false) => {
    printCashFlow(data, reduced, incluirObservacoes);
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => handlePrint(false)}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 transition-all duration-200 font-medium flex items-center justify-center gap-3 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
      >
        <span className="text-lg">🖨️</span>
        <span className="hidden sm:inline">Imprimir Completo</span>
      </button>
      
      <button
        onClick={() => handlePrint(true)}
        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 active:from-green-800 active:to-green-900 transition-all duration-200 font-medium flex items-center justify-center gap-3 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
      >
        <span className="text-lg">📄</span>
        <span className="hidden sm:inline">Imprimir Reduzido</span>
      </button>
    </div>
  );
}

// Função utilitária exportada para impressão a partir de outros componentes
export function printCashFlow(data: CashFlowData, reduced: boolean = false, incluirObservacoes: boolean = false) {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir');
    return;
  }

  const totalDevolucoes = Array.isArray(data.exits.devolucoes)
    ? data.exits.devolucoes
        .filter(devolucao => devolucao.incluidoNoMovimento)
        .reduce((sum, devolucao) => sum + (Number(devolucao.valor) || 0), 0)
    : 0;

  const totalValesFuncionarios = Array.isArray(data.exits.valesFuncionarios)
    ? data.exits.valesFuncionarios.reduce((sum: number, item: { nome: string; valor: number }) => sum + (Number(item.valor) || 0), 0)
    : 0;
  const valesImpactoEntrada = data.exits.valesIncluidosNoMovimento ? totalValesFuncionarios : 0;

  const totalCheques = Array.isArray(data.entries.cheques)
    ? data.entries.cheques.reduce((sum, cheque) => sum + (Number(cheque.valor) || 0), 0)
    : 0;

  // Calcular total de envios de correios incluídos no movimento (entradas)
  const totalEnviosCorreiosEntrada = Array.isArray(data.exits.enviosCorreios)
    ? data.exits.enviosCorreios
        .filter(envio => envio.incluidoNoMovimento)
        .reduce((sum, envio) => sum + (Number(envio.valor) || 0), 0)
    : 0;

  // Calcular total de taxas
  const totalTaxas = Array.isArray(data.entries.taxas)
    ? data.entries.taxas.reduce((sum, taxa) => sum + (Number(taxa.valor) || 0), 0)
    : 0;

  // Calcular totais de lançamentos
  const totalOutrosLancamentos = Array.isArray(data.entries.outrosLancamentos) && data.entries.outrosLancamentos.length > 0
    ? data.entries.outrosLancamentos.reduce((sum, l) => sum + (Number(l.valor) || 0), 0)
    : (data.entries.outros || 0);
  
  const totalBrindesLancamentos = Array.isArray(data.entries.brindesLancamentos) && data.entries.brindesLancamentos.length > 0
    ? data.entries.brindesLancamentos.reduce((sum, l) => sum + (Number(l.valor) || 0), 0)
    : (data.entries.brindes || 0);

  const totalEntradas = 
    data.entries.dinheiro + 
    data.entries.fundoCaixa + 
    data.entries.cartao + 
    data.entries.cartaoLink + 
    data.entries.boletos +
    data.entries.pixMaquininha + 
    data.entries.pixConta +
    totalOutrosLancamentos +
    totalBrindesLancamentos +
    (data.entries.crediario || 0) +
    (data.entries.cartaoPresente || 0) +
    (data.entries.cashBack || 0) +
    totalDevolucoes +
    valesImpactoEntrada +
    totalCheques +
    totalEnviosCorreiosEntrada +
    totalTaxas;

  const totalPuxadores = (Array.isArray(data.exits.puxadores) 
    ? data.exits.puxadores.reduce((sum, p) => sum + (Number(p.valor) || 0), 0) 
    : 0) + (Number(data.exits.puxadorValor) || 0);

  const totalSaidas = 
    data.exits.descontos + 
    data.exits.saida + 
    data.exits.creditoDevolucao + 
    (Array.isArray(data.exits.valesFuncionarios) ? data.exits.valesFuncionarios.reduce((s, v) => s + (Number(v.valor) || 0), 0) : 0) +
    totalPuxadores;

  const htmlContent = reduced
    ? generateReducedHTML(data, totalEntradas, totalSaidas, incluirObservacoes)
    : generateFullHTML(data, totalEntradas, totalSaidas, totalDevolucoes, valesImpactoEntrada, totalCheques, totalEnviosCorreiosEntrada, totalTaxas, incluirObservacoes);

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
}

function generateFullHTML(data: CashFlowData, totalEntradas: number, totalSaidas: number, totalDevolucoes: number, valesImpactoEntrada: number, totalCheques: number, totalEnviosCorreiosEntrada: number, totalTaxas: number, incluirObservacoes: boolean = false): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cupom Fiscal - Movimento de Caixa</title>
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
    /* Negrito em todo o cupom reduzido */
    body, .container, .header, .row, .total, .footer, h1, span, div {
      font-weight: bold;
    }
    /* Negrito em todo o cupom */
    body, .container, .header, .section, .row, .row-desc, .total, .footer, h1, span, div {
      font-weight: bold;
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
    .section-title {
      background: #f0f0f0;
      font-weight: bold;
      padding: 3px;
      text-align: center;
      border-top: 2px solid black;
      border-bottom: 2px solid black;
      margin-bottom: 5px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      font-size: 11px;
    }
    .row-desc {
      display: flex;
      justify-content: space-between;
      margin: 1px 0 2px 8px;
      font-size: 10px;
      color: #555;
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
    }
  </style>
</head>
<body>
  <div class="container">
  <div class="header">
    <img src="/logo_header.png" alt="Logo" class="logo" onerror="this.style.display='none'">
    <h1>MOVIMENTO DE CAIXA</h1>
    <div>Data: ${new Date(data.date).toLocaleDateString('pt-BR')}</div>
    <div>Hora: ${new Date().toLocaleTimeString('pt-BR')}</div>
  </div>

  <div class="section">
    <div class="section-title">ENTRADAS</div>
    ${data.entries.dinheiro > 0 ? `<div class="row"><span>Dinheiro:</span><span>${formatCurrency(data.entries.dinheiro)}</span></div>` : ''}
    ${data.entries.fundoCaixa > 0 ? `<div class="row"><span>Fundo Caixa:</span><span>${formatCurrency(data.entries.fundoCaixa)}</span></div>` : ''}
    ${data.entries.cartao > 0 ? `<div class="row"><span>Cartão:</span><span>${formatCurrency(data.entries.cartao)}</span></div>` : ''}
    ${data.entries.cartaoLink > 0 ? `<div class="row"><span>Cartão Link:</span><span>${formatCurrency(data.entries.cartaoLink)}</span></div>` : ''}
    ${Array.isArray(data.entries.cartaoLinkClientes) && data.entries.cartaoLinkClientes.length > 0
      ? `<div>
          ${data.entries.cartaoLinkClientes.map(c => `<div class="row-desc"><span>${c.nome}:</span><span>${formatCurrency(c.valor)} (${c.parcelas}x)</span></div>`).join('')}
        </div>`
      : (data.entries.cartaoLink > 0 && (data.entries.clienteCartaoLink || data.entries.parcelasCartaoLink)
          ? `<div class="row-desc"><span>Cliente:</span><span>${data.entries.clienteCartaoLink || '—'} (${data.entries.parcelasCartaoLink || 1}x)</span></div>`
          : '')}
    ${data.entries.boletos > 0 ? `<div class="row"><span>Boletos:</span><span>${formatCurrency(data.entries.boletos)}</span></div>` : ''}
    ${Array.isArray(data.entries.boletosClientes) && data.entries.boletosClientes.length > 0
      ? `<div>
          ${data.entries.boletosClientes.map(c => `<div class="row-desc"><span>${c.nome}:</span><span>${formatCurrency(c.valor)} (${c.parcelas}x)</span></div>`).join('')}
        </div>`
      : (data.entries.boletos > 0 && (data.entries.clienteBoletos || data.entries.parcelasBoletos)
          ? `<div class="row-desc"><span>Cliente:</span><span>${data.entries.clienteBoletos || '—'} (${data.entries.parcelasBoletos || 1}x)</span></div>`
          : '')}
    ${data.entries.pixMaquininha > 0 ? `<div class="row"><span>PIX Maquininha:</span><span>${formatCurrency(data.entries.pixMaquininha)}</span></div>` : ''}
    ${data.entries.pixConta > 0 ? `<div class="row"><span>PIX Conta:</span><span>${formatCurrency(data.entries.pixConta)}</span></div>` : ''}
    ${Array.isArray(data.entries.pixContaClientes) && data.entries.pixContaClientes.length > 0
      ? `<div>
          ${data.entries.pixContaClientes.map(c => `<div class="row-desc"><span>${c.nome}:</span><span>${formatCurrency(c.valor)}</span></div>`).join('')}
        </div>`
      : ''}
    ${(() => {
      const totalOutros = Array.isArray(data.entries.outrosLancamentos) && data.entries.outrosLancamentos.length > 0
        ? data.entries.outrosLancamentos.reduce((sum, l) => sum + (Number(l.valor) || 0), 0)
        : (data.entries.outros || 0);
      if (totalOutros > 0) {
        let html = `<div class="row"><span>Outros:</span><span>${formatCurrency(totalOutros)}</span></div>`;
        if (Array.isArray(data.entries.outrosLancamentos) && data.entries.outrosLancamentos.length > 0) {
          html += `<div>${data.entries.outrosLancamentos.map(l => `<div class="row-desc"><span>${l.descricao}:</span><span>${formatCurrency(l.valor)}</span></div>`).join('')}</div>`;
        } else if (data.entries.outrosDescricao) {
          html += `<div class="row-desc"><span>Descrição:</span><span>${data.entries.outrosDescricao}</span></div>`;
        }
        return html;
      }
      return '';
    })()}
    ${(() => {
      const totalBrindes = Array.isArray(data.entries.brindesLancamentos) && data.entries.brindesLancamentos.length > 0
        ? data.entries.brindesLancamentos.reduce((sum, l) => sum + (Number(l.valor) || 0), 0)
        : (data.entries.brindes || 0);
      if (totalBrindes > 0) {
        let html = `<div class="row"><span>Brindes:</span><span>${formatCurrency(totalBrindes)}</span></div>`;
        if (Array.isArray(data.entries.brindesLancamentos) && data.entries.brindesLancamentos.length > 0) {
          html += `<div>${data.entries.brindesLancamentos.map(l => `<div class="row-desc"><span>${l.descricao}:</span><span>${formatCurrency(l.valor)}</span></div>`).join('')}</div>`;
        } else if (data.entries.brindesDescricao) {
          html += `<div class="row-desc"><span>Descrição:</span><span>${data.entries.brindesDescricao}</span></div>`;
        }
        return html;
      }
      return '';
    })()}
    ${data.entries.crediario && data.entries.crediario > 0 ? `<div class="row"><span>Crediário:</span><span>${formatCurrency(data.entries.crediario)}</span></div>` : ''}
    ${Array.isArray(data.entries.crediarioClientes) && data.entries.crediarioClientes.length > 0
      ? `<div>
          ${data.entries.crediarioClientes.map(c => `<div class="row-desc"><span>${c.nome}:</span><span>${formatCurrency(c.valor)} (${c.parcelas}x)</span></div>`).join('')}
        </div>`
      : ''}
    ${data.entries.cartaoPresente && data.entries.cartaoPresente > 0 ? `<div class="row"><span>Cartão Presente:</span><span>${formatCurrency(data.entries.cartaoPresente)}</span></div>` : ''}
    ${Array.isArray(data.entries.cartaoPresenteClientes) && data.entries.cartaoPresenteClientes.length > 0
      ? `<div>
          ${data.entries.cartaoPresenteClientes.map(c => `<div class="row-desc"><span>${c.nome}:</span><span>${formatCurrency(c.valor)} (${c.parcelas}x)</span></div>`).join('')}
        </div>`
      : ''}
    ${data.entries.cashBack && data.entries.cashBack > 0 ? `<div class="row"><span>Cash Back:</span><span>${formatCurrency(data.entries.cashBack)}</span></div>` : ''}
    ${Array.isArray(data.entries.cashBackClientes) && data.entries.cashBackClientes.length > 0
      ? `<div>
          ${data.entries.cashBackClientes.map(c => `<div class="row-desc"><span>${c.nome} (CPF: ${c.cpf}):</span><span>${formatCurrency(c.valor)}</span></div>`).join('')}
        </div>`
      : ''}
    ${totalCheques > 0 ? `<div class="row"><span>Cheques:</span><span>${formatCurrency(totalCheques)}</span></div>` : ''}
    ${Array.isArray(data.entries.cheques) && data.entries.cheques.length > 0
      ? `<div>
          ${data.entries.cheques.map(cheque => {
            const vencimento = cheque.dataVencimento ? ` (Venc: ${new Date(cheque.dataVencimento).toLocaleDateString('pt-BR')})` : '';
            return `<div class="row-desc"><span>${cheque.banco || ''} • Ag: ${cheque.agencia || ''} • Ch: ${cheque.numeroCheque || ''} • ${cheque.nomeCliente || ''}</span><span>${formatCurrency(cheque.valor || 0)}${vencimento}</span></div>`;
          }).join('')}
        </div>`
      : ''}
    ${totalDevolucoes > 0 ? `<div class="row"><span>Devoluções:</span><span>${formatCurrency(totalDevolucoes)}</span></div>` : ''}
    ${valesImpactoEntrada > 0 ? `<div class="row"><span>Vales:</span><span>${formatCurrency(valesImpactoEntrada)}</span></div>` : ''}
    ${totalEnviosCorreiosEntrada > 0 ? `<div class="row"><span>Correios/Frete:</span><span>${formatCurrency(totalEnviosCorreiosEntrada)}</span></div>` : ''}
    ${Array.isArray(data.exits.enviosCorreios) && data.exits.enviosCorreios.filter(e => e.incluidoNoMovimento).length > 0
      ? `<div>
          ${data.exits.enviosCorreios.filter(e => e.incluidoNoMovimento).map(envio => `<div class="row-desc"><span>${envio.tipo} • ${envio.estado} • ${envio.cliente}</span><span>${formatCurrency(envio.valor)}</span></div>`).join('')}
        </div>`
      : ''}
    ${totalTaxas > 0 ? `<div class="row"><span>Taxas:</span><span>${formatCurrency(totalTaxas)}</span></div>` : ''}
    ${Array.isArray(data.entries.taxas) && data.entries.taxas.length > 0
      ? `<div>
          ${data.entries.taxas.map(taxa => `<div class="row-desc"><span>${taxa.nome}</span><span>${formatCurrency(taxa.valor)}</span></div>`).join('')}
        </div>`
      : ''}
    <div class="total">
      <div>TOTAL ENTRADAS: ${formatCurrency(totalEntradas)}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">SAÍDAS</div>
    ${data.exits.descontos > 0 ? `<div class="row"><span>Descontos:</span><span>${formatCurrency(data.exits.descontos)}</span></div>` : ''}
    ${data.exits.saida > 0 ? `<div class="row"><span>Saída (Retirada):</span><span>${formatCurrency(data.exits.saida)}</span></div>` : ''}
    ${data.exits.saida > 0 && data.exits.justificativaCompra ? `<div class="row-desc"><span>Compra:</span><span>${data.exits.justificativaCompra} - ${formatCurrency(data.exits.valorCompra)}</span></div>` : ''}
    ${data.exits.saida > 0 && data.exits.justificativaSaidaDinheiro ? `<div class="row-desc"><span>Saída:</span><span>${data.exits.justificativaSaidaDinheiro} - ${formatCurrency(data.exits.valorSaidaDinheiro)}</span></div>` : ''}
    ${Array.isArray(data.exits.saidasRetiradas) && data.exits.saidasRetiradas.length > 0 ? data.exits.saidasRetiradas.map(sr => `<div class="row-desc"><span>${sr.descricao}:</span><span>${formatCurrency(sr.valor)}</span></div>`).join('') : ''}
    ${data.exits.creditoDevolucao > 0 ? `<div class="row"><span>Crédito/Devolução:</span><span>${formatCurrency(data.exits.creditoDevolucao)}</span></div>` : ''}
    ${Array.isArray(data.exits.devolucoes) && data.exits.devolucoes.length > 0
      ? `<div class="row"><span>Crédito/Devolução (múltiplas):</span><span>${formatCurrency(data.exits.devolucoes.reduce((sum, d) => sum + (Number(d.valor) || 0), 0))}</span></div>
         <div>
           ${data.exits.devolucoes.map(dev => `<div class="row-desc"><span>Cliente: ${dev.nome || '—'} | CPF/CNPJ: ${dev.cpf}</span><span>${formatCurrency(dev.valor)}${dev.incluidoNoMovimento ? ' (Incluído)' : ''}</span></div>`).join('')}
         </div>`
      : ''}
    ${Array.isArray(data.exits.enviosCorreios) && data.exits.enviosCorreios.length > 0
      ? `<div class="row"><span>Correios/Frete (Registro):</span><span>${formatCurrency(data.exits.enviosCorreios.reduce((sum, e) => sum + (Number(e.valor) || 0), 0))}</span></div>
         <div>
           ${data.exits.enviosCorreios.map(envio => `<div class="row-desc"><span>${envio.tipo} • ${envio.estado} • ${envio.cliente}</span><span>${formatCurrency(envio.valor)}${envio.incluidoNoMovimento ? ' (Incluído)' : ''}</span></div>`).join('')}
         </div>`
      : ''}
    ${Array.isArray(data.exits.valesFuncionarios) && data.exits.valesFuncionarios.length > 0
      ? `<div class="row"><span>Vales Funcionário (Registro):</span><span>${formatCurrency(data.exits.valesFuncionarios.reduce((s, v) => s + (Number(v.valor) || 0), 0))}</span></div>
         <div>
           ${data.exits.valesFuncionarios.map(v => `<div class="row-desc"><span>${v.nome}</span><span>${formatCurrency(Number(v.valor) || 0)}</span></div>`).join('')}
         </div>`
      : ''}
    ${data.exits.puxadorValor > 0 ? `<div class="row"><span>Comissão Puxador:</span><span>${formatCurrency(data.exits.puxadorValor)}</span></div>` : ''}
    ${data.exits.puxadorValor > 0 && data.exits.puxadorNome ? `<div class="row-desc"><span>Puxador:</span><span>${data.exits.puxadorNome} (${data.exits.puxadorPorcentagem}%)</span></div>` : ''}
    ${Array.isArray(data.exits.puxadorClientes) && data.exits.puxadorClientes.length > 0
      ? `<div>
          <div class="row-desc"><span>Clientes do Puxador:</span><span></span></div>
          ${data.exits.puxadorClientes.map(cliente => `<div class="row-desc"><span>${cliente.nome}:</span><span>${formatCurrency(cliente.valor)}</span></div>`).join('')}
        </div>`
      : ''}
    ${Array.isArray(data.exits.puxadores) && data.exits.puxadores.length > 0
      ? data.exits.puxadores.map((puxador, index) => {
          const clientesHtml = Array.isArray(puxador.clientes) && puxador.clientes.length > 0
            ? `<div>
                <div class="row-desc"><span>Clientes do Puxador:</span><span></span></div>
                ${puxador.clientes.map(cliente => `<div class="row-desc"><span>${cliente.nome || ''}:</span><span>${formatCurrency(cliente.valor || 0)}</span></div>`).join('')}
              </div>`
            : '';
          return `
          <div class="row"><span>Comissão Puxador ${index + 1}:</span><span>${formatCurrency(puxador.valor || 0)}</span></div>
          <div class="row-desc"><span>Puxador:</span><span>${puxador.nome || ''} (${puxador.porcentagem || 0}%)</span></div>
          ${clientesHtml}
        `;
        }).join('')
      : ''}
    <div class="total">
      <div>TOTAL SAÍDAS: ${formatCurrency(totalSaidas)}</div>
    </div>
  </div>

  <div class="total" style="font-size: 16px;">
    <div>TOTAL EM CAIXA: ${formatCurrency(data.total)}</div>
  </div>

  ${incluirObservacoes && (data.observacoes || data.notas) ? `
  <div class="section">
    <div class="section-title">OBSERVAÇÕES / NOTAS</div>
    <div style="padding: 5px; font-size: 11px; white-space: pre-wrap; word-wrap: break-word; border: 1px solid #ccc; background: #f9f9f9; margin-top: 5px;">
      ${(data.observacoes || data.notas || '').replace(/\n/g, '<br>')}
    </div>
  </div>
  ` : ''}

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
}

function generateReducedHTML(data: CashFlowData, totalEntradas: number, totalSaidas: number, incluirObservacoes: boolean = false): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cupom Fiscal - Movimento de Caixa</title>
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
      font-size: 11px;
      padding: 3mm 0;
    }
    .container {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 0 3mm;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid black;
      padding-bottom: 3px;
      margin-bottom: 8px;
    }
    .logo {
      max-width: 50mm;
      height: auto;
      margin: 0 auto 3px;
    }
    h1 {
      font-size: 12px;
      font-weight: bold;
      margin: 3px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
      padding: 2px 0;
      border-bottom: 1px solid #ccc;
    }
    .total {
      border-top: 2px solid black;
      padding: 5px 0;
      margin: 8px 0;
      text-align: center;
      background: #f0f0f0;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      border-top: 2px solid black;
      padding-top: 3px;
      margin-top: 8px;
      font-size: 9px;
    }
    @media print {
      html, body {
        width: 80mm;
        margin: 0 auto;
        padding: 0;
        display: block;
      }
      body {
        padding: 3mm 0;
      }
      .container {
        width: 74mm;
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
    <h1>MOVIMENTO CAIXA</h1>
    <div>${new Date(data.date).toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
  </div>

  <div class="row">
    <span>ENTRADAS:</span>
    <span>${formatCurrency(totalEntradas)}</span>
  </div>
  <div class="row">
    <span>SAÍDAS:</span>
    <span>${formatCurrency(totalSaidas)}</span>
  </div>

  <div class="total">
    <div>TOTAL CAIXA: ${formatCurrency(data.total)}</div>
  </div>

  ${incluirObservacoes && (data.observacoes || data.notas) ? `
  <div style="margin: 8px 0; padding: 5px; border-top: 1px solid #ccc; border-bottom: 1px solid #ccc;">
    <div style="font-weight: bold; font-size: 10px; margin-bottom: 3px;">OBSERVAÇÕES:</div>
    <div style="font-size: 9px; white-space: pre-wrap; word-wrap: break-word;">
      ${(data.observacoes || data.notas || '').replace(/\n/g, '<br>')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <div>MASTER BOYS - GENIALI</div>
    <div>SILVA TELES, 22 - PARI - BRÁS - SP</div>
    <div>${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}</div>
    <div>Webyte | Tecnologia Laravel</div>
  </div>
  </div>
</body>
</html>
  `;
}
