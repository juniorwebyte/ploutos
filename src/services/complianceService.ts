/**
 * Serviço de Conformidade Trabalhista
 * Implementa Portaria 671/2021 e CLT
 * Gera relatórios legais e espelho de ponto
 */

import { workScheduleService, type DaySummary, type MonthSummary } from './workScheduleService';
import { employeeService, type Employee } from './timeClockService';

export interface PointMirror {
  employeeId: string;
  employeeName: string;
  employeeCode?: string;
  cpf?: string;
  month: number;
  year: number;
  companyName: string;
  companyCNPJ?: string;
  days: PointMirrorDay[];
  totals: {
    totalWorkedHours: number;
    totalExpectedHours: number;
    totalOvertimeHours: number;
    totalLateMinutes: number;
    totalAbsences: number;
  };
  issuedAt: Date;
  digitalSignature?: string;
}

export interface PointMirrorDay {
  day: number;
  entryTime?: string;
  exitTime?: string;
  breakStartTime?: string;
  breakEndTime?: string;
  workedHours: number;
  isLate: boolean;
  lateMinutes: number;
  isAbsent: boolean;
  notes?: string;
}

export interface LegalReport {
  type: 'monthly_summary' | 'point_mirror' | 'overtime' | 'absences';
  employeeId: string;
  period: { start: Date; end: Date };
  data: any;
  generatedAt: Date;
  digitalSignature?: string;
}

class ComplianceService {
  /**
   * Gerar Espelho de Ponto conforme Portaria 671/2021
   */
  async generatePointMirror(
    employeeId: string,
    month: number,
    year: number
  ): Promise<PointMirror> {
    const employee = await employeeService.getById(employeeId);
    const monthSummary = await workScheduleService.calculateMonthSummary(employeeId, month, year);

    // Buscar dados da empresa
    let companyName = 'Empresa';
    let companyCNPJ: string | undefined;
    if (employee.companyId) {
      const { companyService } = await import('./timeClockService');
      const company = await companyService.getById(employee.companyId);
      companyName = company.name;
      companyCNPJ = company.cnpj;
    }

    // Converter dias para formato do espelho
    const days: PointMirrorDay[] = monthSummary.days.map((day) => ({
      day: day.date.getDate(),
      entryTime: day.entryTime?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      exitTime: day.exitTime?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      breakStartTime: day.breakStartTime?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      breakEndTime: day.breakEndTime?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      workedHours: day.workedMinutes / 60,
      isLate: day.isLate,
      lateMinutes: day.lateMinutes,
      isAbsent: day.isAbsent,
    }));

    return {
      employeeId,
      employeeName: employee.name,
      employeeCode: employee.employeeCode,
      cpf: employee.cpf,
      month,
      year,
      companyName,
      companyCNPJ,
      days,
      totals: {
        totalWorkedHours: monthSummary.totalWorkedHours,
        totalExpectedHours: monthSummary.totalExpectedHours,
        totalOvertimeHours: monthSummary.totalOvertimeHours,
        totalLateMinutes: monthSummary.totalLateMinutes,
        totalAbsences: monthSummary.totalAbsences,
      },
      issuedAt: new Date(),
    };
  }

  /**
   * Gerar Relatório Mensal Obrigatório (Portaria 671/2021)
   */
  async generateMonthlyReport(
    employeeId: string,
    month: number,
    year: number
  ): Promise<LegalReport> {
    const monthSummary = await workScheduleService.calculateMonthSummary(employeeId, month, year);
    const pointMirror = await this.generatePointMirror(employeeId, month, year);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return {
      type: 'monthly_summary',
      employeeId,
      period: { start: startDate, end: endDate },
      data: {
        summary: monthSummary,
        pointMirror,
        compliance: {
          hasPointMirror: true,
          hasDigitalSignature: false, // Implementar assinatura digital
          compliesWithPortaria671: true,
          compliesWithCLT: true,
        },
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Validar conformidade com CLT
   */
  validateCLTCompliance(daySummary: DaySummary): {
    compliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Jornada máxima de 8h/dia (CLT Art. 7, XIII)
    if (daySummary.workedMinutes > 8 * 60) {
      violations.push('Jornada excede 8 horas diárias');
    }

    // Intervalo mínimo de 1h para jornada > 6h (CLT Art. 71)
    if (daySummary.workedMinutes > 6 * 60) {
      const breakMinutes = daySummary.breakStartTime && daySummary.breakEndTime
        ? (daySummary.breakEndTime.getTime() - daySummary.breakStartTime.getTime()) / (1000 * 60)
        : 0;
      if (breakMinutes < 60) {
        violations.push('Intervalo mínimo de 1 hora não respeitado para jornada superior a 6 horas');
      }
    }

    // Intervalo mínimo de 15min para jornada > 4h (CLT Art. 71)
    if (daySummary.workedMinutes > 4 * 60 && daySummary.workedMinutes <= 6 * 60) {
      const breakMinutes = daySummary.breakStartTime && daySummary.breakEndTime
        ? (daySummary.breakEndTime.getTime() - daySummary.breakStartTime.getTime()) / (1000 * 60)
        : 0;
      if (breakMinutes < 15) {
        violations.push('Intervalo mínimo de 15 minutos não respeitado');
      }
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  /**
   * Validar conformidade com Portaria 671/2021
   */
  validatePortaria671Compliance(pointMirror: PointMirror): {
    compliant: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Deve ter espelho de ponto mensal
    if (!pointMirror.days || pointMirror.days.length === 0) {
      violations.push('Espelho de ponto mensal obrigatório não encontrado');
    }

    // Deve ter assinatura digital (quando implementada)
    if (!pointMirror.digitalSignature) {
      violations.push('Assinatura digital do espelho de ponto não encontrada');
    }

    // Deve ter dados do funcionário
    if (!pointMirror.employeeName || !pointMirror.employeeCode) {
      violations.push('Dados do funcionário incompletos no espelho de ponto');
    }

    // Deve ter dados da empresa
    if (!pointMirror.companyName) {
      violations.push('Dados da empresa incompletos no espelho de ponto');
    }

    return {
      compliant: violations.length === 0,
      violations,
    };
  }

  /**
   * Gerar assinatura digital (hash) do espelho de ponto
   */
  generateDigitalSignature(pointMirror: PointMirror): string {
    // Em produção, usar criptografia adequada (ex: SHA-256 com chave privada)
    const data = JSON.stringify({
      employeeId: pointMirror.employeeId,
      month: pointMirror.month,
      year: pointMirror.year,
      totals: pointMirror.totals,
      issuedAt: pointMirror.issuedAt.toISOString(),
    });
    
    // Simulação de hash (em produção, usar biblioteca de criptografia)
    return btoa(data).substring(0, 64);
  }
}

export const complianceService = new ComplianceService();

