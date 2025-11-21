import { useState, useCallback } from 'react';
import { 
  FormatterType, 
  applyFormat, 
  removeFormat,
  formatPhone,
  formatCPF,
  formatCNPJ,
  formatCPFCNPJ,
  formatCEP,
  formatCurrencyInput,
  formatNumber,
  formatPercentage,
  formatCreditCard,
  formatDate,
  unformatPhone,
  unformatCPF,
  unformatCNPJ,
  unformatCEP,
  unformatCurrency,
  unformatPercentage,
  unformatCreditCard,
  unformatDate
} from '../utils/formatters';

interface UseFormattedInputOptions {
  type: FormatterType;
  initialValue?: string;
  onChange?: (unformattedValue: string) => void;
}

interface UseFormattedInputReturn {
  value: string;
  formattedValue: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setValue: (value: string) => void;
  getUnformattedValue: () => string;
}

/**
 * Hook para gerenciar campos de entrada com formatação automática
 * 
 * @example
 * const { value, formattedValue, onChange } = useFormattedInput({
 *   type: 'phone',
 *   initialValue: '',
 *   onChange: (unformatted) => console.log(unformatted)
 * });
 * 
 * <input value={formattedValue} onChange={onChange} />
 */
export const useFormattedInput = ({
  type,
  initialValue = '',
  onChange: externalOnChange
}: UseFormattedInputOptions): UseFormattedInputReturn => {
  const [value, setValue] = useState<string>(initialValue);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = applyFormat(inputValue, type);
    setValue(formatted);
    
    // Chama callback externo com valor sem formatação
    if (externalOnChange) {
      const unformatted = removeFormat(formatted, type);
      externalOnChange(unformatted);
    }
  }, [type, externalOnChange]);

  const setValueDirect = useCallback((newValue: string) => {
    const formatted = applyFormat(newValue, type);
    setValue(formatted);
  }, [type]);

  const getUnformattedValue = useCallback(() => {
    return removeFormat(value, type);
  }, [value, type]);

  return {
    value,
    formattedValue: value,
    onChange: handleChange,
    setValue: setValueDirect,
    getUnformattedValue
  };
};

/**
 * Hook simplificado para formatação de telefone
 */
export const usePhoneInput = (initialValue: string = '', onChange?: (value: string) => void) => {
  return useFormattedInput({ type: 'phone', initialValue, onChange });
};

/**
 * Hook simplificado para formatação de CPF
 */
export const useCPFInput = (initialValue: string = '', onChange?: (value: string) => void) => {
  return useFormattedInput({ type: 'cpf', initialValue, onChange });
};

/**
 * Hook simplificado para formatação de CNPJ
 */
export const useCNPJInput = (initialValue: string = '', onChange?: (value: string) => void) => {
  return useFormattedInput({ type: 'cnpj', initialValue, onChange });
};

/**
 * Hook simplificado para formatação de CPF/CNPJ automático
 */
export const useCPFCNPJInput = (initialValue: string = '', onChange?: (value: string) => void) => {
  return useFormattedInput({ type: 'cpfcnpj', initialValue, onChange });
};

/**
 * Hook simplificado para formatação de CEP
 */
export const useCEPInput = (initialValue: string = '', onChange?: (value: string) => void) => {
  return useFormattedInput({ type: 'cep', initialValue, onChange });
};

/**
 * Hook simplificado para formatação de moeda
 */
export const useCurrencyInput = (initialValue: string = '', onChange?: (value: string) => void) => {
  return useFormattedInput({ type: 'currency', initialValue, onChange });
};

