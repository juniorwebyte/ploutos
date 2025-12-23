// Função para cálculos precisos com moeda (evita problemas de ponto flutuante)
export const preciseCurrency = {
  // Converte valor para centavos (inteiro)
  toCents: (value: number): number => {
    return Math.round(value * 100);
  },
  
  // Converte centavos para reais
  fromCents: (cents: number): number => {
    return cents / 100;
  },
  
  // Soma valores com precisão
  add: (...values: number[]): number => {
    const totalCents = values.reduce((sum, val) => sum + preciseCurrency.toCents(val || 0), 0);
    return preciseCurrency.fromCents(totalCents);
  },
  
  // Subtrai valores com precisão
  subtract: (a: number, b: number): number => {
    const aCents = preciseCurrency.toCents(a || 0);
    const bCents = preciseCurrency.toCents(b || 0);
    return preciseCurrency.fromCents(aCents - bCents);
  },
  
  // Multiplica valores com precisão
  multiply: (a: number, b: number): number => {
    const aCents = preciseCurrency.toCents(a || 0);
    const bCents = preciseCurrency.toCents(b || 0);
    return preciseCurrency.fromCents(Math.round((aCents * bCents) / 100));
  },
  
  // Compara valores com precisão (retorna true se são iguais)
  equals: (a: number, b: number): boolean => {
    return preciseCurrency.toCents(a || 0) === preciseCurrency.toCents(b || 0);
  },
  
  // Arredonda para 2 casas decimais
  round: (value: number): number => {
    return Math.round(value * 100) / 100;
  }
};

export const formatCurrency = (value: number | string | undefined | null): string => {
  // Converter para número e validar
  const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
  
  // Verificar se é um número válido
  if (isNaN(numValue) || !isFinite(numValue)) {
    return 'R$ 0,00';
  }
  
  // Arredondar para evitar problemas de precisão
  const roundedValue = preciseCurrency.round(numValue);
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(roundedValue);
};

export const parseCurrency = (value: string): number => {
  // Remove tudo exceto números, vírgulas e pontos
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  
  // Substitui vírgula por ponto para parseFloat
  const normalizedValue = cleanValue.replace(',', '.');
  
  return parseFloat(normalizedValue) || 0;
};

export const maskCurrency = (value: string): string => {
  // Se o valor estiver vazio, retorna vazio
  if (!value || value.trim() === '') return '';
  
  // Remove caracteres não numéricos exceto vírgula e ponto
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  
  // Se não há números, retorna vazio
  if (!cleanValue) return '';
  
  // Converte para número
  const numericValue = parseFloat(cleanValue.replace(',', '.'));
  
  // Se não é um número válido, retorna o valor original
  if (isNaN(numericValue)) return value;
  
  // Formata como moeda brasileira
  return formatCurrency(numericValue);
};

// Nova função para entrada de moeda em tempo real
export const formatCurrencyInput = (value: string): string => {
  // Remove tudo exceto números
  const numbers = value.replace(/\D/g, '');
  
  if (numbers === '') return '';
  
  // Converte para centavos
  const cents = parseInt(numbers);
  
  // Converte para reais
  const reais = cents / 100;
  
  // Formata como moeda
  return formatCurrency(reais);
};