// Utilitários de validação para o sistema de fluxo de caixa

export interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: any;
}

/**
 * Valida se os valores das justificativas batem com o valor total de saída
 */
export const validateSaidaValues = (
  saida: number,
  valorCompra: number,
  valorSaidaDinheiro: number
): ValidationResult => {
  if (saida <= 0) {
    return {
      isValid: true,
      message: 'Valor de saída não definido'
    };
  }

  const totalJustificativas = valorCompra + valorSaidaDinheiro;
  const isValid = totalJustificativas === saida;
  const difference = Math.abs(totalJustificativas - saida);

  return {
    isValid,
    message: isValid ? 'Valores conferem' : 'Valores não conferem',
    details: {
      totalJustificativas,
      saida,
      difference
    }
  };
};

/**
 * Valida se os valores dos clientes PIX Conta batem com o valor total
 */
export const validatePixContaValues = (
  pixConta: number,
  clientes: { nome: string; valor: number }[]
): ValidationResult => {
  // Se não há valor no PIX Conta, não precisa validar
  if (pixConta <= 0) {
    return {
      isValid: true,
      message: 'PIX Conta não definido'
    };
  }

  // Se há valor no PIX Conta mas não há clientes, é inválido
  if (pixConta > 0 && clientes.length === 0) {
    return {
      isValid: false,
      message: 'PIX Conta definido mas sem clientes registrados'
    };
  }

  const totalClientes = clientes.reduce((sum, cliente) => sum + cliente.valor, 0);
  // Usar Math.round para evitar problemas de precisão com números decimais
  const totalClientesRounded = Math.round(totalClientes * 100) / 100;
  const pixContaRounded = Math.round(pixConta * 100) / 100;
  
  const isValid = totalClientesRounded === pixContaRounded;
  const difference = Math.abs(totalClientesRounded - pixContaRounded);

  return {
    isValid,
    message: isValid ? 'Valores PIX Conta conferem' : 'Valores PIX Conta não conferem',
    details: {
      totalClientes: totalClientesRounded,
      pixConta: pixContaRounded,
      difference
    }
  };
};

/**
 * Valida se todos os campos obrigatórios estão preenchidos
 */
export const validateRequiredFields = (
  entries: any,
  exits: any
): ValidationResult => {
  const requiredFields = {
    entries: ['dinheiro', 'fundoCaixa'],
    exits: []
  };

  const missingFields = [];

  // Verificar campos obrigatórios de entradas
  for (const field of requiredFields.entries) {
    if (!entries[field] && entries[field] !== 0) {
      missingFields.push(`Entrada: ${field}`);
    }
  }

  // Verificar campos obrigatórios de saídas
  for (const field of requiredFields.exits) {
    if (!exits[field] && exits[field] !== 0) {
      missingFields.push(`Saída: ${field}`);
    }
  }

  const isValid = missingFields.length === 0;

  return {
    isValid,
    message: isValid ? 'Todos os campos obrigatórios estão preenchidos' : 'Campos obrigatórios não preenchidos',
    details: {
      missingFields
    }
  };
};

/**
 * Valida se o sistema pode ser salvo
 */
export const validateSystemForSave = (
  entries: any,
  exits: any
): ValidationResult => {
  const validations = [
    validateRequiredFields(entries, exits),
    validateSaidaValues(exits.saida, exits.valorCompra, exits.valorSaidaDinheiro),
    validatePixContaValues(entries.pixConta, entries.pixContaClientes || [])
  ];

  const failedValidations = validations.filter(v => !v.isValid);
  const isValid = failedValidations.length === 0;

  return {
    isValid,
    message: isValid ? 'Sistema válido para salvamento' : 'Sistema não pode ser salvo',
    details: {
      failedValidations,
      totalValidations: validations.length,
      passedValidations: validations.filter(v => v.isValid).length
    }
  };
};

/**
 * Formata mensagem de erro para exibição
 */
export const formatValidationMessage = (validation: ValidationResult): string => {
  if (validation.isValid) {
    return `✅ ${validation.message}`;
  }

  let message = `❌ ${validation.message}`;
  
  if (validation.details) {
    if (validation.details.difference) {
      message += ` (Diferença: R$ ${validation.details.difference.toFixed(2)})`;
    }
    if (validation.details.missingFields && validation.details.missingFields.length > 0) {
      message += ` - Campos faltando: ${validation.details.missingFields.join(', ')}`;
    }
  }

  return message;
};
