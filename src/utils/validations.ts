// Utilitários de validação avançados

/**
 * Valida CPF
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // Todos os dígitos iguais
  
  let sum = 0;
  let remainder;
  
  // Validação do primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
}

/**
 * Valida CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false; // Todos os dígitos iguais
  
  let length = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, length);
  const digits = cleanCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  // Validação do primeiro dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Validação do segundo dígito verificador
  length = length + 1;
  numbers = cleanCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Valida chave PIX
 */
export function validatePixKey(chave: string): { valid: boolean; type?: string; error?: string } {
  if (!chave || chave.trim().length === 0) {
    return { valid: false, error: 'Chave PIX não pode estar vazia' };
  }
  
  const cleanChave = chave.trim();
  
  // CPF (11 dígitos)
  if (/^\d{11}$/.test(cleanChave)) {
    if (validateCPF(cleanChave)) {
      return { valid: true, type: 'cpf' };
    }
    return { valid: false, error: 'CPF inválido' };
  }
  
  // CNPJ (14 dígitos)
  if (/^\d{14}$/.test(cleanChave)) {
    if (validateCNPJ(cleanChave)) {
      return { valid: true, type: 'cnpj' };
    }
    return { valid: false, error: 'CNPJ inválido' };
  }
  
  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(cleanChave)) {
    return { valid: true, type: 'email' };
  }
  
  // Telefone (formato: +5511999999999 ou 11999999999)
  const phoneRegex = /^\+?55\d{2}\d{8,9}$/;
  if (phoneRegex.test(cleanChave.replace(/\D/g, ''))) {
    return { valid: true, type: 'telefone' };
  }
  
  // Chave aleatória (UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(cleanChave)) {
    return { valid: true, type: 'aleatoria' };
  }
  
  return { valid: false, error: 'Formato de chave PIX inválido' };
}

/**
 * Formata CPF
 */
export function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return cnpj;
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata telefone
 */
export function formatPhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Valida se um valor é alto (requer dupla confirmação)
 */
export function isHighValue(value: number, threshold: number = 10000): boolean {
  return value >= threshold;
}

/**
 * Validação de email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validação de CEP
 */
export function validateCEP(cep: string): boolean {
  const clean = cep.replace(/\D/g, '');
  return clean.length === 8;
}

/**
 * Formata CEP
 */
export function formatCEP(cep: string): string {
  const clean = cep.replace(/\D/g, '');
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep;
}
