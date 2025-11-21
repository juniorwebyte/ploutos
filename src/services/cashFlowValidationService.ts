export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'duplicate' | 'inconsistency' | 'high_value' | 'missing' | 'invalid';
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: 'high_value' | 'unusual' | 'incomplete';
  field: string;
  message: string;
  suggestedAction?: string;
}

class CashFlowValidationService {
  private readonly HIGH_VALUE_THRESHOLD = 10000; // R$ 10.000,00
  private readonly DUPLICATE_THRESHOLD = 0.01; // 1 centavo de diferença

  // Validar valores duplicados
  validateDuplicates(
    entries: any,
    exits: any,
    cancelamentos: any[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const valueMap = new Map<number, Array<{ source: string; value: number }>>();

    // Verificar entradas
    Object.entries(entries).forEach(([key, value]) => {
      if (typeof value === 'number' && value > 0) {
        const rounded = Math.round(value * 100) / 100;
        if (!valueMap.has(rounded)) {
          valueMap.set(rounded, []);
        }
        valueMap.get(rounded)!.push({ source: `Entrada: ${key}`, value });
      } else if (Array.isArray(value)) {
        value.forEach((item: any, index: number) => {
          if (item.valor && typeof item.valor === 'number' && item.valor > 0) {
            const rounded = Math.round(item.valor * 100) / 100;
            if (!valueMap.has(rounded)) {
              valueMap.set(rounded, []);
            }
            valueMap.get(rounded)!.push({
              source: `Entrada: ${key}[${index}]`,
              value: item.valor
            });
          }
        });
      }
    });

    // Verificar saídas
    Object.entries(exits).forEach(([key, value]) => {
      if (typeof value === 'number' && value > 0) {
        const rounded = Math.round(value * 100) / 100;
        if (!valueMap.has(rounded)) {
          valueMap.set(rounded, []);
        }
        valueMap.get(rounded)!.push({ source: `Saída: ${key}`, value });
      } else if (Array.isArray(value)) {
        value.forEach((item: any, index: number) => {
          if (item.valor && typeof item.valor === 'number' && item.valor > 0) {
            const rounded = Math.round(item.valor * 100) / 100;
            if (!valueMap.has(rounded)) {
              valueMap.set(rounded, []);
            }
            valueMap.get(rounded)!.push({
              source: `Saída: ${key}[${index}]`,
              value: item.valor
            });
          }
        });
      }
    });

    // Verificar cancelamentos
    cancelamentos.forEach((cancelamento, index) => {
      if (cancelamento.valor && typeof cancelamento.valor === 'number' && cancelamento.valor > 0) {
        const rounded = Math.round(cancelamento.valor * 100) / 100;
        if (!valueMap.has(rounded)) {
          valueMap.set(rounded, []);
        }
        valueMap.get(rounded)!.push({
          source: `Cancelamento[${index}]`,
          value: cancelamento.valor
        });
      }
    });

    // Identificar duplicatas
    valueMap.forEach((sources, value) => {
      if (sources.length > 1) {
        errors.push({
          type: 'duplicate',
          field: sources.map(s => s.source).join(', '),
          message: `Valor duplicado encontrado: ${this.formatCurrency(value)} em ${sources.length} locais`,
          severity: 'warning'
        });
      }
    });

    return errors;
  }

  // Detectar inconsistências
  detectInconsistencies(
    entries: any,
    exits: any,
    total: number,
    totalEntradas: number,
    totalSaidas: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Calcular totais manualmente
    const calculatedEntradas = Object.values(entries).reduce((sum: number, val: any) => {
      if (typeof val === 'number') return sum + val;
      if (Array.isArray(val)) {
        return sum + val.reduce((s: number, v: any) => s + (Number(v.valor) || 0), 0);
      }
      return sum;
    }, 0);

    const calculatedSaidas = Object.values(exits).reduce((sum: number, val: any) => {
      if (typeof val === 'number') return sum + val;
      if (Array.isArray(val)) {
        return sum + val.reduce((s: number, v: any) => s + (Number(v.valor) || 0), 0);
      }
      return sum;
    }, 0);

    const calculatedTotal = calculatedEntradas - calculatedSaidas;

    // Verificar inconsistências nos totais
    const entradasDiff = Math.abs(calculatedEntradas - totalEntradas);
    if (entradasDiff > this.DUPLICATE_THRESHOLD) {
      errors.push({
        type: 'inconsistency',
        field: 'totalEntradas',
        message: `Inconsistência detectada: Total de entradas calculado (${this.formatCurrency(calculatedEntradas)}) não corresponde ao total informado (${this.formatCurrency(totalEntradas)})`,
        severity: 'error'
      });
    }

    const saidasDiff = Math.abs(calculatedSaidas - totalSaidas);
    if (saidasDiff > this.DUPLICATE_THRESHOLD) {
      errors.push({
        type: 'inconsistency',
        field: 'totalSaidas',
        message: `Inconsistência detectada: Total de saídas calculado (${this.formatCurrency(calculatedSaidas)}) não corresponde ao total informado (${this.formatCurrency(totalSaidas)})`,
        severity: 'error'
      });
    }

    const totalDiff = Math.abs(calculatedTotal - total);
    if (totalDiff > this.DUPLICATE_THRESHOLD) {
      errors.push({
        type: 'inconsistency',
        field: 'total',
        message: `Inconsistência detectada: Saldo calculado (${this.formatCurrency(calculatedTotal)}) não corresponde ao saldo informado (${this.formatCurrency(total)})`,
        severity: 'error'
      });
    }

    // Verificar valores negativos onde não deveriam ser
    Object.entries(entries).forEach(([key, value]) => {
      if (typeof value === 'number' && value < 0) {
        errors.push({
          type: 'inconsistency',
          field: `entries.${key}`,
          message: `Valor negativo encontrado em entrada: ${key} = ${this.formatCurrency(value)}`,
          severity: 'error'
        });
      }
    });

    return errors;
  }

  // Validar valores altos
  validateHighValues(
    entries: any,
    exits: any,
    cancelamentos: any[]
  ): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Verificar entradas
    Object.entries(entries).forEach(([key, value]) => {
      if (typeof value === 'number' && value >= this.HIGH_VALUE_THRESHOLD) {
        warnings.push({
          type: 'high_value',
          field: `entries.${key}`,
          message: `Valor alto detectado em entrada: ${key} = ${this.formatCurrency(value)}`,
          suggestedAction: 'Confirme se o valor está correto antes de salvar'
        });
      } else if (Array.isArray(value)) {
        value.forEach((item: any, index: number) => {
          if (item.valor && typeof item.valor === 'number' && item.valor >= this.HIGH_VALUE_THRESHOLD) {
            warnings.push({
              type: 'high_value',
              field: `entries.${key}[${index}]`,
              message: `Valor alto detectado: ${this.formatCurrency(item.valor)}`,
              suggestedAction: 'Confirme se o valor está correto antes de salvar'
            });
          }
        });
      }
    });

    // Verificar saídas
    Object.entries(exits).forEach(([key, value]) => {
      if (typeof value === 'number' && value >= this.HIGH_VALUE_THRESHOLD) {
        warnings.push({
          type: 'high_value',
          field: `exits.${key}`,
          message: `Valor alto detectado em saída: ${key} = ${this.formatCurrency(value)}`,
          suggestedAction: 'Confirme se o valor está correto antes de salvar'
        });
      } else if (Array.isArray(value)) {
        value.forEach((item: any, index: number) => {
          if (item.valor && typeof item.valor === 'number' && item.valor >= this.HIGH_VALUE_THRESHOLD) {
            warnings.push({
              type: 'high_value',
              field: `exits.${key}[${index}]`,
              message: `Valor alto detectado: ${this.formatCurrency(item.valor)}`,
              suggestedAction: 'Confirme se o valor está correto antes de salvar'
            });
          }
        });
      }
    });

    // Verificar cancelamentos
    cancelamentos.forEach((cancelamento, index) => {
      if (cancelamento.valor && typeof cancelamento.valor === 'number' && cancelamento.valor >= this.HIGH_VALUE_THRESHOLD) {
        warnings.push({
          type: 'high_value',
          field: `cancelamentos[${index}]`,
          message: `Valor alto detectado em cancelamento: ${this.formatCurrency(cancelamento.valor)}`,
          suggestedAction: 'Confirme se o valor está correto antes de salvar'
        });
      }
    });

    return warnings;
  }

  // Validar tudo
  validateAll(
    entries: any,
    exits: any,
    cancelamentos: any[],
    total: number,
    totalEntradas: number,
    totalSaidas: number
  ): ValidationResult {
    const duplicateErrors = this.validateDuplicates(entries, exits, cancelamentos);
    const inconsistencyErrors = this.detectInconsistencies(
      entries,
      exits,
      total,
      totalEntradas,
      totalSaidas
    );
    const highValueWarnings = this.validateHighValues(entries, exits, cancelamentos);

    const errors = [...duplicateErrors, ...inconsistencyErrors];
    const hasErrors = errors.some(e => e.severity === 'error');

    return {
      isValid: !hasErrors,
      errors,
      warnings: highValueWarnings
    };
  }

  // Formatar moeda
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}

export const cashFlowValidationService = new CashFlowValidationService();

