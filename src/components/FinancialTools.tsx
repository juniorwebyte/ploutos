import React, { useState, useMemo, useCallback } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calendar,
  Download,
  BarChart3,
  PieChart,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface FinancialToolsProps {
  onClose?: () => void;
}

const FinancialTools: React.FC<FinancialToolsProps> = ({ onClose }) => {
  // Verificar se o componente está sendo renderizado
  React.useEffect(() => {
    // Componente carregado
  }, []);
  // Calculadora de Juros
  const [principal, setPrincipal] = useState<string>('1000');
  const [interestRate, setInterestRate] = useState<string>('5');
  const [period, setPeriod] = useState<string>('12');
  const [interestType, setInterestType] = useState<'simple' | 'compound'>('compound');

  // Simulador de Investimento
  const [investmentAmount, setInvestmentAmount] = useState<string>('10000');
  const [investmentRate, setInvestmentRate] = useState<string>('12');
  const [investmentPeriod, setInvestmentPeriod] = useState<string>('12');
  const [monthlyContribution, setMonthlyContribution] = useState<string>('0');

  // Análise de Rentabilidade
  const [revenue, setRevenue] = useState<string>('50000');
  const [costs, setCosts] = useState<string>('30000');
  const [taxes, setTaxes] = useState<string>('5000');

  // Comparador de Taxas
  const [comparisonAmount, setComparisonAmount] = useState<string>('10000');
  const [rate1, setRate1] = useState<string>('2.5');
  const [rate2, setRate2] = useState<string>('3.0');
  const [comparisonPeriod, setComparisonPeriod] = useState<string>('12');

  // Projeções
  const [currentRevenue, setCurrentRevenue] = useState<string>('50000');
  const [growthRate, setGrowthRate] = useState<string>('10');
  const [projectionMonths, setProjectionMonths] = useState<string>('12');

  // Cálculos
  const interestCalculations = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = parseFloat(interestRate) || 0;
    const t = parseFloat(period) || 0;

    if (p <= 0 || r <= 0 || t <= 0) {
      return { simple: 0, compound: 0, totalSimple: p, totalCompound: p, difference: 0 };
    }

    // Juros Simples: J = P * r * t / 100
    const simpleInterest = (p * r * t) / 100;
    const totalSimple = p + simpleInterest;

    // Juros Compostos: A = P * (1 + r/100)^t
    const compoundTotal = p * Math.pow(1 + r / 100, t);
    const compoundInterest = compoundTotal - p;
    const totalCompound = compoundTotal;

    return {
      simple: simpleInterest,
      compound: compoundInterest,
      totalSimple,
      totalCompound,
      difference: compoundInterest - simpleInterest
    };
  }, [principal, interestRate, period]);

  const investmentCalculation = useMemo(() => {
    const p = parseFloat(investmentAmount) || 0;
    const r = parseFloat(investmentRate) || 0;
    const t = parseFloat(investmentPeriod) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;

    if (p <= 0 || r <= 0 || t <= 0) {
      return { finalValue: p, totalInvested: p, totalReturn: 0, roi: 0 };
    }

    // Valor futuro com contribuições mensais
    const monthlyRate = r / 100 / 12;
    let finalValue = p * Math.pow(1 + monthlyRate, t);
    
    if (monthly > 0 && monthlyRate > 0) {
      // Fórmula de anuidade: FV = PMT * (((1 + r)^n - 1) / r)
      const annuityValue = monthly * ((Math.pow(1 + monthlyRate, t) - 1) / monthlyRate);
      finalValue += annuityValue;
    } else if (monthly > 0) {
      // Se taxa for zero, apenas soma as contribuições
      finalValue += monthly * t;
    }

    const totalInvested = p + (monthly * t);
    const totalReturn = finalValue - totalInvested;
    const roi = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return { finalValue, totalInvested, totalReturn, roi };
  }, [investmentAmount, investmentRate, investmentPeriod, monthlyContribution]);

  const profitabilityAnalysis = useMemo(() => {
    const rev = parseFloat(revenue) || 0;
    const cost = parseFloat(costs) || 0;
    const tax = parseFloat(taxes) || 0;

    const grossProfit = rev - cost;
    const netProfit = grossProfit - tax;
    const grossMargin = rev > 0 ? (grossProfit / rev) * 100 : 0;
    const netMargin = rev > 0 ? (netProfit / rev) * 100 : 0;
    const costRatio = rev > 0 ? (cost / rev) * 100 : 0;
    const taxRatio = rev > 0 ? (tax / rev) * 100 : 0;

    return { grossProfit, netProfit, grossMargin, netMargin, costRatio, taxRatio };
  }, [revenue, costs, taxes]);

  const comparisonResults = useMemo(() => {
    const amount = parseFloat(comparisonAmount) || 0;
    const r1 = parseFloat(rate1) || 0;
    const r2 = parseFloat(rate2) || 0;
    const t = parseFloat(comparisonPeriod) || 0;

    if (amount <= 0 || t <= 0) {
      return { value1: amount, value2: amount, difference: 0, savings: 0 };
    }

    const value1 = r1 > 0 ? amount * Math.pow(1 + r1 / 100, t) : amount;
    const value2 = r2 > 0 ? amount * Math.pow(1 + r2 / 100, t) : amount;
    const difference = Math.abs(value2 - value1);
    const savings = value2 > value1 ? value2 - value1 : value1 - value2;

    return { value1, value2, difference, savings, betterRate: r2 > r1 ? 2 : 1 };
  }, [comparisonAmount, rate1, rate2, comparisonPeriod]);

  const projections = useMemo(() => {
    const current = parseFloat(currentRevenue) || 0;
    const growth = parseFloat(growthRate) || 0;
    const months = parseInt(projectionMonths) || 0;

    if (current <= 0 || months <= 0) {
      return [];
    }

    const monthlyGrowth = growth / 100;
    const data = [];

    for (let i = 0; i <= months; i++) {
      const projected = current * Math.pow(1 + monthlyGrowth, i);
      data.push({
        month: i,
        revenue: projected,
        growth: i > 0 ? ((projected - current) / current) * 100 : 0
      });
    }

    return data;
  }, [currentRevenue, growthRate, projectionMonths]);

  const handleResetAll = useCallback(() => {
    // Zerar todos os campos
    setPrincipal('0');
    setInterestRate('0');
    setPeriod('0');
    setInterestType('compound');
    setInvestmentAmount('0');
    setInvestmentRate('0');
    setInvestmentPeriod('0');
    setMonthlyContribution('0');
    setRevenue('0');
    setCosts('0');
    setTaxes('0');
    setComparisonAmount('0');
    setRate1('0');
    setRate2('0');
    setComparisonPeriod('0');
    setCurrentRevenue('0');
    setGrowthRate('0');
    setProjectionMonths('0');
  }, []);

  const exportReport = () => {
    const report = {
      data: new Date().toLocaleString('pt-BR'),
      calculadoraJuros: {
        principal: parseFloat(principal) || 0,
        taxa: parseFloat(interestRate) || 0,
        periodo: parseFloat(period) || 0,
        jurosSimples: interestCalculations.simple,
        jurosCompostos: interestCalculations.compound,
        totalSimples: interestCalculations.totalSimple,
        totalCompostos: interestCalculations.totalCompound
      },
      simuladorInvestimento: {
        valorInicial: parseFloat(investmentAmount) || 0,
        taxa: parseFloat(investmentRate) || 0,
        periodo: parseFloat(investmentPeriod) || 0,
        contribuicaoMensal: parseFloat(monthlyContribution) || 0,
        valorFinal: investmentCalculation.finalValue,
        totalInvestido: investmentCalculation.totalInvested,
        retornoTotal: investmentCalculation.totalReturn,
        roi: investmentCalculation.roi
      },
      analiseRentabilidade: {
        receita: parseFloat(revenue) || 0,
        custos: parseFloat(costs) || 0,
        impostos: parseFloat(taxes) || 0,
        lucroBruto: profitabilityAnalysis.grossProfit,
        lucroLiquido: profitabilityAnalysis.netProfit,
        margemBruta: profitabilityAnalysis.grossMargin,
        margemLiquida: profitabilityAnalysis.netMargin
      },
      projecoes: projections
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Calculator className="w-8 h-8" />
              Ferramentas Financeiras
            </h2>
            <p className="text-indigo-100">Calculadoras e análises financeiras avançadas</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Juros Compostos</p>
              <p className="text-2xl font-bold">{formatCurrency(interestCalculations.compound)}</p>
              <p className="text-green-200 text-xs mt-1">Em {period} meses</p>
            </div>
            <Percent className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Valor do Investimento</p>
              <p className="text-2xl font-bold">{formatCurrency(investmentCalculation.finalValue)}</p>
              <p className="text-blue-200 text-xs mt-1">ROI: {investmentCalculation.roi.toFixed(2)}%</p>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Lucro Líquido</p>
              <p className="text-2xl font-bold">{formatCurrency(profitabilityAnalysis.netProfit)}</p>
              <p className="text-purple-200 text-xs mt-1">Margem: {profitabilityAnalysis.netMargin.toFixed(2)}%</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Calculadora de Juros */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-indigo-600" />
          Calculadora de Juros
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Principal (R$)
              </label>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Juros (% ao mês)
              </label>
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período (meses)
              </label>
              <input
                type="number"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="12"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Juros
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setInterestType('simple')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    interestType === 'simple'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Simples
                </button>
                <button
                  onClick={() => setInterestType('compound')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    interestType === 'compound'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Compostos
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Resultados</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600">Juros Simples:</span>
                <span className="font-bold text-green-600">{formatCurrency(interestCalculations.simple)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600">Juros Compostos:</span>
                <span className="font-bold text-blue-600">{formatCurrency(interestCalculations.compound)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-indigo-200">
                <span className="text-gray-700 font-medium">Total ({interestType === 'simple' ? 'Simples' : 'Compostos'}):</span>
                <span className="font-bold text-indigo-600 text-lg">
                  {formatCurrency(interestType === 'simple' ? interestCalculations.totalSimple : interestCalculations.totalCompound)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="text-gray-700">Diferença:</span>
                <span className="font-bold text-purple-600">{formatCurrency(interestCalculations.difference)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulador de Investimento */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-600" />
          Simulador de Investimento
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Inicial (R$)
              </label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                placeholder="10000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa de Retorno (% ao ano)
              </label>
              <input
                type="number"
                step="0.01"
                value={investmentRate}
                onChange={(e) => setInvestmentRate(e.target.value)}
                placeholder="12"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período (meses)
              </label>
              <input
                type="number"
                value={investmentPeriod}
                onChange={(e) => setInvestmentPeriod(e.target.value)}
                placeholder="12"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contribuição Mensal (R$) <span className="text-gray-400 text-xs">(opcional)</span>
              </label>
              <input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Projeção do Investimento</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600">Total Investido:</span>
                <span className="font-bold text-gray-800">{formatCurrency(investmentCalculation.totalInvested)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600">Retorno Total:</span>
                <span className="font-bold text-green-600">{formatCurrency(investmentCalculation.totalReturn)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-blue-200">
                <span className="text-gray-700 font-medium">Valor Final:</span>
                <span className="font-bold text-blue-600 text-lg">{formatCurrency(investmentCalculation.finalValue)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-gray-700">ROI:</span>
                <span className="font-bold text-green-600 text-lg">{investmentCalculation.roi.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Análise de Rentabilidade */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-600" />
          Análise de Rentabilidade
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receita Total (R$)
              </label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="50000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custos Totais (R$)
              </label>
              <input
                type="number"
                value={costs}
                onChange={(e) => setCosts(e.target.value)}
                placeholder="30000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impostos e Taxas (R$)
              </label>
              <input
                type="number"
                value={taxes}
                onChange={(e) => setTaxes(e.target.value)}
                placeholder="5000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Análise de Resultados</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600">Lucro Bruto:</span>
                <span className={`font-bold ${profitabilityAnalysis.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profitabilityAnalysis.grossProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-gray-600">Margem Bruta:</span>
                <span className="font-bold text-green-600">{profitabilityAnalysis.grossMargin.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg border-2 border-purple-200">
                <span className="text-gray-700 font-medium">Lucro Líquido:</span>
                <span className={`font-bold text-lg ${profitabilityAnalysis.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(profitabilityAnalysis.netProfit)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-gray-700">Margem Líquida:</span>
                <span className="font-bold text-green-600 text-lg">{profitabilityAnalysis.netMargin.toFixed(2)}%</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="p-2 bg-white rounded text-xs text-center">
                  <p className="text-gray-500">Custos</p>
                  <p className="font-bold text-orange-600">{profitabilityAnalysis.costRatio.toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-white rounded text-xs text-center">
                  <p className="text-gray-500">Impostos</p>
                  <p className="font-bold text-red-600">{profitabilityAnalysis.taxRatio.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparador de Taxas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <PieChart className="w-6 h-6 text-orange-600" />
          Comparador de Taxas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Inicial (R$)
              </label>
              <input
                type="number"
                value={comparisonAmount}
                onChange={(e) => setComparisonAmount(e.target.value)}
                placeholder="10000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxa 1 (% ao mês)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rate1}
                  onChange={(e) => setRate1(e.target.value)}
                  placeholder="2.5"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxa 2 (% ao mês)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={rate2}
                  onChange={(e) => setRate2(e.target.value)}
                  placeholder="3.0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período (meses)
              </label>
              <input
                type="number"
                value={comparisonPeriod}
                onChange={(e) => setComparisonPeriod(e.target.value)}
                placeholder="12"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Comparação</h4>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg border-2 border-blue-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Taxa {rate1}%:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(comparisonResults.value1)}</span>
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border-2 border-green-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Taxa {rate2}%:</span>
                  <span className="font-bold text-green-600">{formatCurrency(comparisonResults.value2)}</span>
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Diferença:</span>
                  <span className="font-bold text-orange-600 text-lg">{formatCurrency(comparisonResults.difference)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Taxa {comparisonResults.betterRate} é {comparisonResults.betterRate === 1 ? 'menor' : 'maior'} e resulta em{' '}
                  {comparisonResults.betterRate === 1 ? 'menos' : 'mais'} valor
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projeções Financeiras */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-teal-600" />
          Projeções Financeiras
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Receita Atual (R$)
            </label>
            <input
              type="number"
              value={currentRevenue}
              onChange={(e) => setCurrentRevenue(e.target.value)}
              placeholder="50000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxa de Crescimento (% ao mês)
            </label>
            <input
              type="number"
              step="0.1"
              value={growthRate}
              onChange={(e) => setGrowthRate(e.target.value)}
              placeholder="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período (meses)
            </label>
            <input
              type="number"
              value={projectionMonths}
              onChange={(e) => setProjectionMonths(e.target.value)}
              placeholder="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {projections.length > 0 && (
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-800 mb-4">Projeção de Receita</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {projections.map((proj, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {proj.month === 0 ? 'Mês Atual' : `Mês ${proj.month}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-gray-800">{formatCurrency(proj.revenue)}</span>
                    {proj.growth > 0 && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +{proj.growth.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Download className="w-5 h-5" />
          Exportar Relatório
        </button>
        <button
          onClick={handleResetAll}
          type="button"
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Limpar Tudo
        </button>
      </div>
    </div>
  );
};

export default FinancialTools;

