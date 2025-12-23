/**
 * Serviço de Gestão de Jornada de Trabalho
 * Calcula jornada, banco de horas, horas extras, faltas e atrasos
 * Conforme regras configuráveis por empresa
 */

import { 
  timeClockService, 
  employeeService, 
  type Employee, 
  type TimeClock, 
  type WorkSchedule 
} from './timeClockService';

export interface WorkScheduleRules {
  workScheduleId: string;
  toleranceMinutes: number; // Tolerância para atraso
  roundMinutes: number; // Arredondamento (ex: 15 minutos)
  allowOvertime: boolean;
  maxOvertimeHours: number;
  requireBreak: boolean;
  minBreakMinutes: number;
  maxBreakMinutes: number;
  calculateNightShift: boolean; // 22h-5h
  nightShiftBonus: number; // Percentual de adicional noturno
}

export interface DaySummary {
  date: Date;
  employeeId: string;
  entryTime?: Date;
  exitTime?: Date;
  breakStartTime?: Date;
  breakEndTime?: Date;
  workedMinutes: number;
  expectedMinutes: number;
  balanceMinutes: number;
  overtimeMinutes: number;
  isLate: boolean;
  lateMinutes: number;
  isAbsent: boolean;
  isValid: boolean;
  records: TimeClock[];
}

export interface MonthSummary {
  employeeId: string;
  month: number;
  year: number;
  totalWorkedHours: number;
  totalExpectedHours: number;
  totalBalanceHours: number;
  totalOvertimeHours: number;
  totalLateMinutes: number;
  totalAbsences: number;
  days: DaySummary[];
}

class WorkScheduleService {
  /**
   * Calcular resumo do dia para um funcionário
   */
  async calculateDaySummary(
    employeeId: string,
    date: Date,
    workSchedule?: WorkSchedule
  ): Promise<DaySummary> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Buscar registros do dia
    const records = await timeClockService.getAll({
      employeeId,
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
    });

    // Buscar funcionário e jornada se não fornecida
    const employee = await employeeService.getById(employeeId);
    if (!workSchedule && employee.workScheduleId) {
      const { workScheduleService } = await import('./timeClockService');
      workSchedule = await workScheduleService.getById(employee.workScheduleId);
    }

    const entryRecord = records.find(r => r.type === 'entry');
    const exitRecord = records.find(r => r.type === 'exit');
    const breakStartRecord = records.find(r => r.type === 'break_start');
    const breakEndRecord = records.find(r => r.type === 'break_end');

    const entryTime = entryRecord ? new Date(entryRecord.timestamp) : undefined;
    const exitTime = exitRecord ? new Date(exitRecord.timestamp) : undefined;
    const breakStartTime = breakStartRecord ? new Date(breakStartRecord.timestamp) : undefined;
    const breakEndTime = breakEndRecord ? new Date(breakEndRecord.timestamp) : undefined;

    // Calcular horas trabalhadas
    let workedMinutes = 0;
    if (entryTime) {
      const endTime = exitTime || new Date();
      workedMinutes = (endTime.getTime() - entryTime.getTime()) / (1000 * 60);
      
      // Subtrair intervalo
      if (breakStartTime && breakEndTime) {
        const breakMinutes = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60);
        workedMinutes -= breakMinutes;
      } else if (breakStartTime && !breakEndTime) {
        const breakMinutes = (new Date().getTime() - breakStartTime.getTime()) / (1000 * 60);
        workedMinutes -= breakMinutes;
      }
    }

    // Horas esperadas
    const expectedHours = workSchedule?.workHours || employee.workHours || 8;
    const expectedMinutes = expectedHours * 60;

    // Verificar atraso
    let isLate = false;
    let lateMinutes = 0;
    if (entryTime && workSchedule?.startTime) {
      const [hours, minutes] = workSchedule.startTime.split(':').map(Number);
      const expectedEntry = new Date(date);
      expectedEntry.setHours(hours, minutes, 0, 0);
      
      const tolerance = (workSchedule.tolerance || 5) * 60000; // Converter para ms
      if (entryTime.getTime() > expectedEntry.getTime() + tolerance) {
        isLate = true;
        lateMinutes = Math.round((entryTime.getTime() - expectedEntry.getTime()) / (1000 * 60));
      }
    }

    // Calcular saldo
    const balanceMinutes = workedMinutes - expectedMinutes;
    const overtimeMinutes = balanceMinutes > 0 ? balanceMinutes : 0;

    // Verificar ausência
    const isAbsent = !entryTime && !exitTime;

    // Validar dia
    const isValid = !isAbsent && (!isLate || lateMinutes <= (workSchedule?.tolerance || 5));

    return {
      date,
      employeeId,
      entryTime,
      exitTime,
      breakStartTime,
      breakEndTime,
      workedMinutes,
      expectedMinutes,
      balanceMinutes,
      overtimeMinutes,
      isLate,
      lateMinutes,
      isAbsent,
      isValid,
      records,
    };
  }

  /**
   * Calcular resumo mensal
   */
  async calculateMonthSummary(
    employeeId: string,
    month: number,
    year: number
  ): Promise<MonthSummary> {
    const days: DaySummary[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    // Buscar jornada do funcionário
    const employee = await employeeService.getById(employeeId);
    let workSchedule: WorkSchedule | undefined;
    if (employee.workScheduleId) {
      const { workScheduleService } = await import('./timeClockService');
      workSchedule = await workScheduleService.getById(employee.workScheduleId);
    }

    // Calcular cada dia do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const summary = await this.calculateDaySummary(employeeId, date, workSchedule);
      days.push(summary);
    }

    // Calcular totais
    const totalWorkedMinutes = days.reduce((sum, d) => sum + d.workedMinutes, 0);
    const totalExpectedMinutes = days.reduce((sum, d) => sum + d.expectedMinutes, 0);
    const totalBalanceMinutes = days.reduce((sum, d) => sum + d.balanceMinutes, 0);
    const totalOvertimeMinutes = days.reduce((sum, d) => sum + d.overtimeMinutes, 0);
    const totalLateMinutes = days.reduce((sum, d) => sum + d.lateMinutes, 0);
    const totalAbsences = days.filter(d => d.isAbsent).length;

    return {
      employeeId,
      month,
      year,
      totalWorkedHours: totalWorkedMinutes / 60,
      totalExpectedHours: totalExpectedMinutes / 60,
      totalBalanceHours: totalBalanceMinutes / 60,
      totalOvertimeHours: totalOvertimeMinutes / 60,
      totalLateMinutes,
      totalAbsences,
      days,
    };
  }

  /**
   * Aplicar regras de arredondamento
   */
  roundTime(minutes: number, roundTo: number = 15): number {
    return Math.round(minutes / roundTo) * roundTo;
  }

  /**
   * Calcular adicional noturno (22h-5h)
   */
  calculateNightShiftBonus(
    startTime: Date,
    endTime: Date,
    bonusPercent: number = 20
  ): { nightMinutes: number; bonusAmount: number } {
    let nightMinutes = 0;
    const start = startTime.getTime();
    const end = endTime.getTime();

    // Criar intervalos de 1 hora
    for (let time = start; time < end; time += 3600000) {
      const hour = new Date(time).getHours();
      if (hour >= 22 || hour < 5) {
        nightMinutes += 60;
      }
    }

    const bonusAmount = (nightMinutes / 60) * (bonusPercent / 100);
    return { nightMinutes, bonusAmount };
  }

  /**
   * Validar intervalo obrigatório
   */
  validateBreak(
    workedMinutes: number,
    breakMinutes: number,
    minBreakMinutes: number = 60
  ): { valid: boolean; error?: string } {
    if (workedMinutes > 6 * 60 && breakMinutes < minBreakMinutes) {
      return {
        valid: false,
        error: `Intervalo mínimo de ${minBreakMinutes} minutos obrigatório para jornada superior a 6 horas`,
      };
    }
    return { valid: true };
  }
}

export const workScheduleService = new WorkScheduleService();

