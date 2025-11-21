export const formatCurrency = (value: number | string | undefined | null): string => {
  // Converter para número e validar
  const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
  
  // Verificar se é um número válido
  if (isNaN(numValue) || !isFinite(numValue)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
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