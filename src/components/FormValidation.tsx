import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ValidationRule {
  validator: (value: any) => boolean;
  message: string;
}

interface FormValidationProps {
  value: any;
  rules: ValidationRule[];
  touched?: boolean;
  showError?: boolean;
  className?: string;
}

export const FormValidation: React.FC<FormValidationProps> = ({
  value,
  rules,
  touched = false,
  showError = true,
  className = '',
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState<boolean>(true);

  useEffect(() => {
    if (touched || value) {
      const validationErrors: string[] = [];
      
      rules.forEach((rule) => {
        if (!rule.validator(value)) {
          validationErrors.push(rule.message);
        }
      });

      setErrors(validationErrors);
      setIsValid(validationErrors.length === 0);
    }
  }, [value, rules, touched]);

  if (!touched && !value) return null;
  if (!showError) return null;

  return (
    <div className={`mt-1 ${className}`}>
      {errors.length > 0 ? (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errors[0]}</span>
        </div>
      ) : isValid && value ? (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Válido</span>
        </div>
      ) : null}
    </div>
  );
};

// Validações comuns
export const validators = {
  required: (message = 'Este campo é obrigatório'): ValidationRule => ({
    validator: (value: any) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    },
    message,
  }),

  email: (message = 'Email inválido'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true; // Se vazio, não valida (use required separadamente)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      return value.length >= min;
    },
    message: message || `Deve ter pelo menos ${min} caracteres`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      return value.length <= max;
    },
    message: message || `Deve ter no máximo ${max} caracteres`,
  }),

  phone: (message = 'Telefone inválido'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      const phoneRegex = /^[\d\s\(\)\-\+]+$/;
      const digitsOnly = value.replace(/\D/g, '');
      return phoneRegex.test(value) && digitsOnly.length >= 10 && digitsOnly.length <= 11;
    },
    message,
  }),

  cpf: (message = 'CPF inválido'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      const cpfRegex = /^\d{11}$/;
      const digitsOnly = value.replace(/\D/g, '');
      return cpfRegex.test(digitsOnly);
    },
    message,
  }),

  cnpj: (message = 'CNPJ inválido'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      const cnpjRegex = /^\d{14}$/;
      const digitsOnly = value.replace(/\D/g, '');
      return cnpjRegex.test(digitsOnly);
    },
    message,
  }),

  numeric: (message = 'Deve ser um número'): ValidationRule => ({
    validator: (value: any) => {
      if (!value) return true;
      return !isNaN(Number(value));
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validator: (value: any) => {
      if (!value) return true;
      return Number(value) >= min;
    },
    message: message || `Deve ser maior ou igual a ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validator: (value: any) => {
      if (!value) return true;
      return Number(value) <= max;
    },
    message: message || `Deve ser menor ou igual a ${max}`,
  }),

  match: (pattern: RegExp, message: string): ValidationRule => ({
    validator: (value: string) => {
      if (!value) return true;
      return pattern.test(value);
    },
    message,
  }),
};

export default FormValidation;


