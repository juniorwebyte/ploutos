import React, { useState, useEffect } from 'react';
import { Cancelamento } from '../types';
import { formatCurrency, formatCurrencyInput } from '../utils/currency';
import { useCashFlow } from '../hooks/useCashFlow';
import { AuditLogger, validateCancelamento, verifyDataIntegrity } from '../utils/audit';
import CancelamentosCupomFiscal from './CancelamentosCupomFiscal';
import CancelamentosPrint from './CancelamentosPrint';

interface CancelamentosProps {
  onBack: () => void;
  isDemo?: boolean;
}

const MOTIVOS_CANCELAMENTO = [
  'Produto defeituoso',
  'Cliente desistiu',
  'Erro no pedido',
  'Problema no pagamento',
  'Produto indisponível',
  'Outro'
];

export default function Cancelamentos({ onBack, isDemo = false }: CancelamentosProps) {
  const { cancelamentos, setCancelamentos } = useCashFlow();
  const [novoCancelamento, setNovoCancelamento] = useState<Partial<Cancelamento>>({
    numeroPedido: '',
    horaCancelamento: '',
    vendedor: '',
    numeroNovoPedido: '',
    motivo: '',
    descricaoMotivo: '',
    valor: 0,
    assinaturaGerente: '',
    data: new Date().toISOString().split('T')[0]
  });
  const [valorFormatado, setValorFormatado] = useState<string>('');
  const [mostrarCampos, setMostrarCampos] = useState(false);
  const [erro, setErro] = useState<string>('');
  const [auditLogger] = useState(() => AuditLogger.getInstance());

  // Salvar cancelamentos usando o hook
  const salvarCancelamentos = (novosCancelamentos: Cancelamento[]) => {
    setCancelamentos(novosCancelamentos);
  };

  // Verificar integridade dos dados ao carregar
  useEffect(() => {
    const integrityCheck = verifyDataIntegrity(cancelamentos);
    if (!integrityCheck.isValid) {
      console.warn('Problemas de integridade encontrados:', integrityCheck.issues);
    }
  }, [cancelamentos]);

  const handleNumeroPedidoChange = (valor: string) => {
    setNovoCancelamento(prev => ({ ...prev, numeroPedido: valor }));
    setMostrarCampos(valor.length > 0);
    setErro('');
  };

  const handleInputChange = (campo: keyof Cancelamento, valor: string | number) => {
    setNovoCancelamento(prev => ({ ...prev, [campo]: valor }));
    setErro('');
  };

  const handleValorChange = (valor: string) => {
    // Remove tudo exceto números
    const numbers = valor.replace(/\D/g, '');
    
    if (numbers === '') {
      setValorFormatado('');
      setNovoCancelamento(prev => ({ ...prev, valor: 0 }));
      return;
    }
    
    // Converte para centavos e depois para reais
    const cents = parseInt(numbers);
    const reais = cents / 100;
    
    // Formata o valor para exibição
    const formatted = formatCurrencyInput(numbers);
    setValorFormatado(formatted);
    setNovoCancelamento(prev => ({ ...prev, valor: reais }));
  };

  const validarCancelamento = (): boolean => {
    const validation = validateCancelamento(novoCancelamento);
    if (!validation.isValid) {
      setErro(validation.errors[0]); // Mostrar apenas o primeiro erro
      return false;
    }
    return true;
  };

  const adicionarCancelamento = () => {
    if (!validarCancelamento()) return;

    const cancelamento: Cancelamento = {
      id: Date.now().toString(),
      numeroPedido: novoCancelamento.numeroPedido!,
      horaCancelamento: novoCancelamento.horaCancelamento!,
      vendedor: novoCancelamento.vendedor!,
      numeroNovoPedido: novoCancelamento.numeroNovoPedido!,
      motivo: novoCancelamento.motivo!,
      descricaoMotivo: novoCancelamento.descricaoMotivo || '',
      valor: novoCancelamento.valor!,
      assinaturaGerente: novoCancelamento.assinaturaGerente!,
      data: novoCancelamento.data!
    };

    const novosCancelamentos = [...cancelamentos, cancelamento];
    salvarCancelamentos(novosCancelamentos);

    // Log de auditoria
    auditLogger.log(
      'CREATE',
      'CANCELAMENTO',
      cancelamento.id,
      `Cancelamento criado: Pedido ${cancelamento.numeroPedido}, Valor ${formatCurrency(cancelamento.valor)}, Motivo: ${cancelamento.motivo}`,
      'Sistema'
    );

    // Limpar formulário
    setNovoCancelamento({
      numeroPedido: '',
      horaCancelamento: '',
      vendedor: '',
      numeroNovoPedido: '',
      motivo: '',
      descricaoMotivo: '',
      valor: 0,
      assinaturaGerente: '',
      data: new Date().toISOString().split('T')[0]
    });
    setValorFormatado('');
    setMostrarCampos(false);
    setErro('');
  };

  const removerCancelamento = (id: string) => {
    const cancelamentoRemovido = cancelamentos.find(c => c.id === id);
    const novosCancelamentos = cancelamentos.filter(c => c.id !== id);
    salvarCancelamentos(novosCancelamentos);

    // Log de auditoria
    if (cancelamentoRemovido) {
      auditLogger.log(
        'DELETE',
        'CANCELAMENTO',
        id,
        `Cancelamento removido: Pedido ${cancelamentoRemovido.numeroPedido}, Valor ${formatCurrency(cancelamentoRemovido.valor)}`,
        'Sistema'
      );
    }
  };

  const obterHoraAtual = () => {
    const agora = new Date();
    return agora.toTimeString().slice(0, 5);
  };

  const imprimirCancelamentoIndividual = (cancelamento: Cancelamento) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Cupom Fiscal - Cancelamento Individual</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
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
    body, .container, .header, .section, .cancelamento-item, .row, .footer, h1, span, div {
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
    .cancelamento-item {
      border: 2px solid black;
      padding: 5px;
      margin: 5px 0;
      border-radius: 3px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 2px 0;
      font-size: 11px;
    }
    .descricao {
      margin: 5px 0;
      padding: 5px;
      border-top: 1px solid black;
      border-bottom: 1px solid black;
      font-size: 10px;
      word-wrap: break-word;
    }
    .assinatura {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 2px solid black;
      text-align: center;
    }
    .assinatura-linha {
      border-top: 1px solid black;
      margin-top: 40px;
      padding-top: 5px;
      text-align: center;
      font-size: 10px;
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
    <h1>CUPOM FISCAL DE CANCELAMENTO</h1>
    <div>Data: ${new Date().toLocaleDateString('pt-BR')}</div>
    <div>Hora: ${new Date().toLocaleTimeString('pt-BR')}</div>
  </div>

  <div class="cancelamento-item">
    <div class="row"><span>Pedido Cancelado:</span><span>${cancelamento.numeroPedido}</span></div>
    <div class="row"><span>Hora:</span><span>${cancelamento.horaCancelamento}</span></div>
    <div class="row"><span>Vendedor:</span><span>${cancelamento.vendedor}</span></div>
    <div class="row"><span>Novo Pedido:</span><span>${cancelamento.numeroNovoPedido || 'N/A'}</span></div>
    <div class="row"><span>Motivo:</span><span>${cancelamento.motivo}</span></div>
    ${cancelamento.descricaoMotivo ? `<div class="descricao"><strong>Descrição:</strong><br>${cancelamento.descricaoMotivo}</div>` : ''}
    <div class="row"><span>Gerente:</span><span>${cancelamento.assinaturaGerente}</span></div>
    <div class="row" style="border-top: 1px solid black; padding-top: 3px; margin-top: 3px; font-weight: bold; color: red;">
      <span>VALOR:</span><span>${formatCurrency(cancelamento.valor)}</span>
    </div>
  </div>

  <div class="assinatura">
    <div class="assinatura-linha">
      <div>Assinatura da Gerente</div>
    </div>
  </div>

  <div class="footer">
    <div>================================</div>
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

  const totalCancelamentos = cancelamentos.reduce((total, c) => total + c.valor, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Controle de Cancelamentos</h1>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Voltar
            </button>
          </div>
          
          {isDemo && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <strong>Modo Demo:</strong> Esta é uma demonstração da funcionalidade de cancelamentos.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Novo Cancelamento */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Novo Cancelamento</h2>
            
            {erro && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {erro}
              </div>
            )}

            <div className="space-y-4">
              {/* Número do Pedido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Pedido a ser Cancelado *
                </label>
                <input
                  type="text"
                  value={novoCancelamento.numeroPedido || ''}
                  onChange={(e) => handleNumeroPedidoChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o número do pedido"
                />
              </div>

              {/* Campos que aparecem após inserir o número do pedido */}
              {mostrarCampos && (
                <>
                  {/* Hora do Cancelamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora do Cancelamento *
                    </label>
                    <input
                      type="time"
                      value={novoCancelamento.horaCancelamento || obterHoraAtual()}
                      onChange={(e) => handleInputChange('horaCancelamento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Vendedor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendedor *
                    </label>
                    <input
                      type="text"
                      value={novoCancelamento.vendedor || ''}
                      onChange={(e) => handleInputChange('vendedor', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome ou código do vendedor"
                    />
                  </div>

                  {/* Número do Novo Pedido */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número do Novo Pedido que Substituiu *
                    </label>
                    <input
                      type="text"
                      value={novoCancelamento.numeroNovoPedido || ''}
                      onChange={(e) => handleInputChange('numeroNovoPedido', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Número do pedido substituto"
                    />
                  </div>

                  {/* Motivo do Cancelamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo do Cancelamento *
                    </label>
                    <select
                      value={novoCancelamento.motivo || ''}
                      onChange={(e) => handleInputChange('motivo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecione o motivo</option>
                      {MOTIVOS_CANCELAMENTO.map(motivo => (
                        <option key={motivo} value={motivo}>{motivo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Descrição do Motivo */}
                  {novoCancelamento.motivo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição do Motivo do Cancelamento
                      </label>
                      <textarea
                        value={novoCancelamento.descricaoMotivo || ''}
                        onChange={(e) => handleInputChange('descricaoMotivo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                        placeholder="Descreva detalhadamente o motivo do cancelamento..."
                      />
                    </div>
                  )}

                  {/* Valor do Cancelamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor do Cancelamento *
                    </label>
                    <input
                      type="text"
                      value={valorFormatado}
                      onChange={(e) => handleValorChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="R$ 0,00"
                    />
                  </div>

                  {/* Assinatura da Gerente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assinatura da Gerente *
                    </label>
                    <input
                      type="text"
                      value={novoCancelamento.assinaturaGerente || ''}
                      onChange={(e) => handleInputChange('assinaturaGerente', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome da gerente"
                    />
                  </div>

                  {/* Botão Adicionar */}
                  <button
                    onClick={adicionarCancelamento}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    + Adicionar Cancelamento
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Lista de Cancelamentos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Cancelamentos do Dia</h2>
              <div className="text-sm text-gray-600">
                Total: {formatCurrency(totalCancelamentos)}
              </div>
            </div>

            {cancelamentos.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Nenhum cancelamento registrado hoje
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cancelamentos.map((cancelamento) => (
                  <div key={cancelamento.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          Pedido: {cancelamento.numeroPedido}
                        </div>
                        <div className="text-sm text-gray-600">
                          Hora: {cancelamento.horaCancelamento} | Vendedor: {cancelamento.vendedor}
                        </div>
                        <div className="text-sm text-gray-600">
                          Novo Pedido: {cancelamento.numeroNovoPedido}
                        </div>
                        <div className="text-sm text-gray-600">
                          Motivo: {cancelamento.motivo}
                        </div>
                        {cancelamento.descricaoMotivo && (
                          <div className="text-xs text-gray-500 italic mt-1">
                            📄 {cancelamento.descricaoMotivo}
                          </div>
                        )}
                        <div className="text-sm text-gray-600">
                          Gerente: {cancelamento.assinaturaGerente}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">
                          {formatCurrency(cancelamento.valor)}
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                          <button
                            onClick={() => imprimirCancelamentoIndividual(cancelamento)}
                            className="text-blue-500 hover:text-blue-700 text-sm bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                          >
                            🖨️ Imprimir
                          </button>
                          <button
                            onClick={() => removerCancelamento(cancelamento.id)}
                            className="text-red-500 hover:text-red-700 text-sm bg-red-50 px-2 py-1 rounded hover:bg-red-100 transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões de Impressão */}
        {cancelamentos.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="text-center">
              <CancelamentosCupomFiscal cancelamentos={cancelamentos} />
            </div>
            <div className="text-center">
              <CancelamentosPrint cancelamentos={cancelamentos} />
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
