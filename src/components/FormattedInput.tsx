import React from 'react';
import { FormatterType, applyFormat, removeFormat } from '../utils/formatters';

interface FormattedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  type: FormatterType;
  value: string;
  onChange: (value: string) => void;
  unformattedValue?: string; // Valor sem formatação para armazenar
}

/**
 * Componente de input com formatação automática
 * Formata automaticamente durante a digitação
 */
export const FormattedInput: React.FC<FormattedInputProps> = ({
  type,
  value,
  onChange,
  unformattedValue,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = applyFormat(inputValue, type);
    const unformatted = removeFormat(formatted, type);
    onChange(unformatted);
  };

  const displayValue = unformattedValue !== undefined 
    ? applyFormat(unformattedValue, type)
    : applyFormat(value, type);

  return (
    <input
      {...props}
      value={displayValue}
      onChange={handleChange}
    />
  );
};

export default FormattedInput;

