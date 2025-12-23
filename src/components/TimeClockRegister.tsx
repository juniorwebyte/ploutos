/**
 * Registro de Ponto
 * Interface para funcionários registrarem ponto (manual, QR Code, geolocalização)
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  Smartphone,
  Building,
  Briefcase,
  Calendar,
  TrendingUp,
  TrendingDown,
  User,
  Timer,
  Info,
} from 'lucide-react';
import {
  timeClockService,
  employeeService,
  qrCodeService,
  companyService,
  branchService,
  departmentService,
  workScheduleService,
  type Employee,
  type TimeClock,
  type Company,
  type Branch,
  type Department,
  type WorkSchedule,
} from '../services/timeClockService';
import { useAuth } from '../contexts/AuthContext';
import EmployeeAuthentication from './EmployeeAuthentication';
import { useSubscription } from '../hooks/useSubscription';
import SubscriptionBlock from './SubscriptionBlock';

interface TimeClockRegisterProps {
  onBack?: () => void;
}

export default function TimeClockRegister({ onBack }: TimeClockRegisterProps) {
  const { user } = useAuth();
  const [authenticatedEmployee, setAuthenticatedEmployee] = useState<Employee | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(true); // SEMPRE mostrar autenticação primeiro
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  const [loading, setLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [lastRecord, setLastRecord] = useState<TimeClock | null>(null);
  const [todayRecords, setTodayRecords] = useState<TimeClock[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [authenticationMethod, setAuthenticationMethod] = useState<string>('');
  const [currentCompanyId, setCurrentCompanyId] = useState<string | undefined>();
  const [showSubscriptionBlock, setShowSubscriptionBlock] = useState(false);

  // Verificar acesso ao módulo
  const { hasAccess, isLoading, isDemoMode, isSuperAdmin } = useSubscription('timeclock', currentCompanyId);

  // Carregar companyId
  useEffect(() => {
    const loadCompanyId = async () => {
      try {
        const employees = await employeeService.getAll().catch(() => []);
        if (employees.length > 0 && employees[0].companyId) {
          setCurrentCompanyId(employees[0].companyId);
        } else {
          // Tentar buscar empresas
          const companies = await companyService.getAll().catch(() => []);
          if (companies.length > 0) {
            setCurrentCompanyId(companies[0].id);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar companyId:', error);
      }
    };
    loadCompanyId();
  }, []);

  useEffect(() => {
    getCurrentLocation();
    
    // Atualizar relógio a cada segundo
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);

  // Carregar dados do funcionário após autenticação
  useEffect(() => {
    if (authenticatedEmployee) {
      loadEmployeeData(authenticatedEmployee);
    }
  }, [authenticatedEmployee]);

  const handleAuthenticated = async (emp: Employee, token: string, authMethod: string) => {
    setAuthenticatedEmployee(emp);
    setSessionToken(token);
    setAuthenticationMethod(authMethod);
    setShowAuth(false);
    await loadEmployeeData(emp);
  };

  // Verificar se precisa reautenticar (sessão expirada)
  const checkSession = async () => {
    if (sessionToken && authenticatedEmployee) {
      const { employeeAuthService } = await import('../services/employeeAuthService');
      const valid = await employeeAuthService.validateSession(sessionToken);
      if (!valid) {
        setShowAuth(true);
        setAuthenticatedEmployee(null);
        setSessionToken(null);
      }
    }
  };

  const loadEmployeeData = async (emp: Employee) => {
    try {
      setLoading(true);
      setEmployee(emp);
      
      // Carregar dados relacionados
      if (emp.companyId) {
        try {
          const comp = await companyService.getById(emp.companyId);
          setCompany(comp);
        } catch (error) {
          console.error('Erro ao carregar empresa:', error);
        }
      }
      
      if (emp.branchId) {
        try {
          const br = await branchService.getById(emp.branchId);
          setBranch(br);
        } catch (error) {
          console.error('Erro ao carregar filial:', error);
        }
      }
      
      if (emp.departmentId) {
        try {
          const dept = await departmentService.getById(emp.departmentId);
          setDepartment(dept);
        } catch (error) {
          console.error('Erro ao carregar departamento:', error);
        }
      }
      
      if (emp.workScheduleId) {
        try {
          const schedule = await workScheduleService.getById(emp.workScheduleId);
          setWorkSchedule(schedule);
        } catch (error) {
          console.error('Erro ao carregar jornada:', error);
        }
      }
      
      await loadLastRecord(emp.id);
    } catch (error) {
      console.error('Erro ao carregar dados do funcionário:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLastRecord = async (employeeId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const records = await timeClockService.getAll({
        employeeId,
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
      });

      setTodayRecords(records);
      if (records.length > 0) {
        setLastRecord(records[records.length - 1]);
      }
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        setLocationError('Erro ao obter localização: ' + error.message);
      }
    );
  };

  const getNextType = (): TimeClock['type'] => {
    if (!lastRecord) return 'entry';
    if (lastRecord.type === 'entry') return 'break_start';
    if (lastRecord.type === 'break_start') return 'break_end';
    if (lastRecord.type === 'break_end') return 'exit';
    if (lastRecord.type === 'exit') return 'entry'; // Novo dia
    return 'entry';
  };

  // Calcular horas trabalhadas hoje
  const calculateTodayHours = (): { worked: number; expected: number; remaining: number; balance: number } => {
    if (todayRecords.length === 0) {
      return { worked: 0, expected: employee?.workHours || 8, remaining: employee?.workHours || 8, balance: 0 };
    }

    const entryRecords = todayRecords.filter(r => r.type === 'entry');
    const exitRecords = todayRecords.filter(r => r.type === 'exit');
    const breakStartRecords = todayRecords.filter(r => r.type === 'break_start');
    const breakEndRecords = todayRecords.filter(r => r.type === 'break_end');

    let totalMinutes = 0;

    // Calcular tempo entre entrada e saída
    if (entryRecords.length > 0 && exitRecords.length > 0) {
      const entryTime = new Date(entryRecords[0].timestamp).getTime();
      const exitTime = new Date(exitRecords[exitRecords.length - 1].timestamp).getTime();
      totalMinutes = (exitTime - entryTime) / (1000 * 60);
    } else if (entryRecords.length > 0) {
      // Se só tem entrada, calcular até agora
      const entryTime = new Date(entryRecords[0].timestamp).getTime();
      const now = Date.now();
      totalMinutes = (now - entryTime) / (1000 * 60);
    }

    // Subtrair intervalos
    breakStartRecords.forEach((breakStart, index) => {
      const breakEnd = breakEndRecords[index];
      if (breakEnd) {
        const breakStartTime = new Date(breakStart.timestamp).getTime();
        const breakEndTime = new Date(breakEnd.timestamp).getTime();
        const breakMinutes = (breakEndTime - breakStartTime) / (1000 * 60);
        totalMinutes -= breakMinutes;
      }
    });

    const workedHours = totalMinutes / 60;
    const expectedHours = employee?.workHours || 8;
    const remainingHours = Math.max(0, expectedHours - workedHours);
    const balance = workedHours - expectedHours;

    return { worked: workedHours, expected: expectedHours, remaining: remainingHours, balance };
  };

  const todayStats = calculateTodayHours();

  const handleRegister = async (method: 'manual' | 'geolocation' | 'qrcode') => {
    // Super Admin tem acesso total, sem bloqueios de assinatura
    if (!isSuperAdmin) {
      // VALIDAÇÃO DE ASSINATURA: Bloquear em modo demo ou sem assinatura (apenas para clientes)
      if (isDemoMode) {
        alert('Esta é uma demonstração. Para registrar pontos reais, é necessário uma assinatura ativa.');
        setShowSubscriptionBlock(true);
        return;
      }

      if (!hasAccess && !isLoading) {
        setShowSubscriptionBlock(true);
        return;
      }
    }

    // VALIDAÇÃO OBRIGATÓRIA: Verificar se funcionário está autenticado
    if (!authenticatedEmployee || !sessionToken) {
      alert('Você precisa se autenticar antes de registrar ponto');
      setShowAuth(true);
      return;
    }

    if (!employee) {
      alert('Funcionário não encontrado');
      return;
    }

    // Validar funcionário ativo
    if (!employee.isActive || employee.status !== 'active') {
      alert('Funcionário inativo. Entre em contato com o RH.');
      return;
    }

    // Validar permissão
    if (!employee.canRegisterPoint) {
      alert('Você não tem permissão para registrar ponto. Entre em contato com o RH.');
      return;
    }

    setRegistering(true);

    try {
      const type = getNextType();
      
      // Obter IP e User Agent
      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;
      
      // Preparar dados COMPLETOS do ponto
      const data: any = {
        employeeId: employee.id,
        employeeName: employee.name, // Snapshot obrigatório
        employeeCode: employee.employeeCode, // Snapshot obrigatório
        companyId: employee.companyId, // Obrigatório
        branchId: employee.branchId,
        type,
        method: method === 'qrcode' ? 'qrcode' : method === 'geolocation' ? 'geolocation' : 'manual',
        authenticationMethod: authenticationMethod, // Método de autenticação usado
        deviceType: 'web',
        deviceId: sessionToken, // Usar token de sessão como deviceId
        userAgent: userAgent,
        ipAddress: ipAddress,
        latitude: location?.lat,
        longitude: location?.lng,
        status: 'valid', // Status inicial: válido
      };

      if (method === 'qrcode' && qrCode) {
        // Validar QR Code primeiro
        const validation = await qrCodeService.validate(qrCode, 'token');
        if (!validation.valid) {
          alert('QR Code inválido ou expirado');
          setRegistering(false);
          return;
        }
        data.qrCodeId = validation.qrCode?.id;
      }

      // Registrar ponto com todos os dados obrigatórios
      const record = await timeClockService.register(data);
      setLastRecord(record);
      
      // Recarregar funcionário para atualizar saldo de horas
      await loadEmployeeData(employee);
      
      // Mostrar confirmação clara
      alert(
        `✅ Ponto registrado com sucesso!\n\n` +
        `Funcionário: ${employee.name}\n` +
        `Matrícula: ${employee.employeeCode || 'N/A'}\n` +
        `Tipo: ${getTypeLabel(type)}\n` +
        `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n` +
        `Método: ${getMethodLabel(method)}\n` +
        `Autenticação: ${authenticationMethod}`
      );
      
      // Recarregar último registro
      await loadLastRecord(employee.id);
    } catch (error: any) {
      console.error('Erro ao registrar ponto:', error);
      alert(error.response?.data?.error || 'Erro ao registrar ponto');
    } finally {
      setRegistering(false);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const handleGenerateQRCode = async () => {
    if (!employee) {
      alert('Funcionário não encontrado');
      return;
    }

    try {
      console.log('🔍 Gerando QR Code para funcionário:', employee.id);
      const qr = await qrCodeService.generate({
        employeeId: employee.id,
        expiresInMinutes: 5,
      });
      console.log('✅ QR Code gerado:', qr);
      if (qr && qr.code) {
        setQrCode(qr.code);
        setShowQRCode(true);
      } else {
        throw new Error('QR Code não foi gerado corretamente');
      }
    } catch (error: any) {
      console.error('❌ Erro ao gerar QR Code:', error);
      alert(`Erro ao gerar QR Code: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const getTypeLabel = (type: TimeClock['type']) => {
    const labels: Record<TimeClock['type'], string> = {
      entry: 'Entrada',
      exit: 'Saída',
      break_start: 'Início Intervalo',
      break_end: 'Fim Intervalo',
      overtime_start: 'Início Hora Extra',
      overtime_end: 'Fim Hora Extra',
    };
    return labels[type] || type;
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      manual: 'Manual',
      geolocation: 'Geolocalização',
      qrcode: 'QR Code',
      ip: 'IP',
      biometric: 'Biometria',
    };
    return labels[method] || method;
  };

  // Mostrar bloqueio de assinatura se necessário
  if (showSubscriptionBlock) {
    return (
      <SubscriptionBlock
        module="timeclock"
        companyId={currentCompanyId}
        onSubscribe={() => {
          // Tentar abrir PaymentModal via evento customizado
          const event = new CustomEvent('ploutos:open-payment', { 
            detail: { module: 'timeclock' } 
          });
          window.dispatchEvent(event);
          setShowSubscriptionBlock(false);
        }}
        onClose={() => setShowSubscriptionBlock(false)}
        showCloseButton={true}
      />
    );
  }

  // Em modo demo, mostrar aviso mas permitir visualização (apenas para clientes, não Super Admin)
  if (isDemoMode && !authenticatedEmployee && !isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-yellow-900 dark:text-yellow-200 mb-2">
            🔒 Modo Demonstração
          </h2>
          <p className="text-yellow-800 dark:text-yellow-300 mb-4">
            Esta é uma demonstração visual do sistema. Você pode navegar pelas telas e ver como funciona,
            mas não pode registrar pontos reais ou fazer alterações.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Continuar Demonstração
          </button>
        </div>
      </div>
    );
  }

  // SEMPRE mostrar autenticação primeiro se não estiver autenticado
  if (showAuth || !authenticatedEmployee || !sessionToken) {
    return (
      <>
        <EmployeeAuthentication
          onAuthenticated={(emp, token, authMethod) => {
            setAuthenticationMethod(authMethod);
            handleAuthenticated(emp, token, authMethod);
          }}
          onCancel={onBack}
        />
      </>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Funcionário não encontrado. Entre em contato com o administrador.
          </p>
        </div>
      </div>
    );
  }

  const nextType = getNextType();

  return (
    <div className="p-6 space-y-6" style={{ position: 'relative', zIndex: 50, minHeight: '100vh' }}>
      {/* Cabeçalho com Relógio em Tempo Real */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-emerald-600" />
            Registro de Ponto Eletrônico
          </h1>
          <div className="mt-2 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400 font-medium">{employee.name}</span>
              {employee.employeeCode && (
                <span className="text-gray-500 text-sm">({employee.employeeCode})</span>
              )}
            </div>
            {company && (
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">{company.name}</span>
              </div>
            )}
            {branch && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">{branch.name}</span>
              </div>
            )}
            {department && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">{department.name}</span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {currentTime.toLocaleTimeString('pt-BR')}
          </div>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Voltar
            </button>
          )}
        </div>
      </div>

      {/* Cards de Informações do Funcionário */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg shadow p-4 border-2 border-emerald-300 dark:border-emerald-700">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Matrícula/ID</h3>
          </div>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {employee.employeeCode || employee.id.substring(0, 8).toUpperCase()}
          </p>
          {employee.employeeCode && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ID: {employee.id.substring(0, 8).toUpperCase()}...
            </p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Empresa</h3>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {company?.name || 'Não informado'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filial</h3>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {branch?.name || 'Não informado'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Departamento</h3>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {department?.name || 'Não informado'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Jornada</h3>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {workSchedule?.name || `${employee.workHours || 8}h/dia`}
          </p>
        </div>
      </div>

      {/* Estatísticas do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Horas Trabalhadas</h3>
            <Timer className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {todayStats.worked.toFixed(2)}h
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            de {todayStats.expected}h esperadas
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Horas Restantes</h3>
            <TrendingDown className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {todayStats.remaining.toFixed(2)}h
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            para completar a jornada
          </p>
        </div>
        <div className={`bg-gradient-to-br rounded-lg shadow p-6 ${
          todayStats.balance >= 0 
            ? 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20' 
            : 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Saldo do Dia</h3>
            {todayStats.balance >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <p className={`text-3xl font-bold ${
            todayStats.balance >= 0 
              ? 'text-emerald-600 dark:text-emerald-400' 
              : 'text-amber-600 dark:text-amber-400'
          }`}>
            {todayStats.balance >= 0 ? '+' : ''}{todayStats.balance.toFixed(2)}h
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {todayStats.balance >= 0 ? 'Crédito' : 'Débito'} de horas
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Total</h3>
            <Info className="w-5 h-5 text-purple-600" />
          </div>
          <p className={`text-3xl font-bold ${
            (employee.hourBalance || 0) >= 0 
              ? 'text-purple-600 dark:text-purple-400' 
              : 'text-red-600 dark:text-red-400'
          }`}>
            {(employee.hourBalance || 0) >= 0 ? '+' : ''}{(employee.hourBalance || 0).toFixed(2)}h
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            acumulado no banco de horas
          </p>
        </div>
      </div>

      {/* Histórico do Dia */}
      {todayRecords.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Registros de Hoje
          </h2>
          <div className="space-y-3">
            {todayRecords
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((record, index) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      record.type === 'entry' ? 'bg-green-100 text-green-600 dark:bg-green-900/20' :
                      record.type === 'exit' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' :
                      record.type === 'break_start' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                    }`}>
                      {record.type === 'entry' ? <CheckCircle className="w-6 h-6" /> :
                       record.type === 'exit' ? <XCircle className="w-6 h-6" /> :
                       <Clock className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {getTypeLabel(record.type)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(record.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Método</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getMethodLabel(record.method)}
                      </p>
                    </div>
                    {record.isValid ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Último Registro - Card Destaque */}
      {lastRecord && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg shadow-lg p-6 border-2 border-emerald-200 dark:border-emerald-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            Último Registro
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tipo de Marcação</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {getTypeLabel(lastRecord.type)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Horário</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {new Date(lastRecord.timestamp).toLocaleTimeString('pt-BR')}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(lastRecord.timestamp).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Método</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {getMethodLabel(lastRecord.method)}
              </p>
            </div>
            <div className="flex items-center justify-center">
              {lastRecord.isValid ? (
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">Válido</p>
                </div>
              ) : (
                <div className="text-center">
                  <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">Inválido</p>
                </div>
              )}
            </div>
          </div>
          {lastRecord.validationMessage && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {lastRecord.validationMessage}
              </p>
            </div>
          )}
          {lastRecord.latitude && lastRecord.longitude && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                📍 Localização: {lastRecord.latitude.toFixed(6)}, {lastRecord.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Próxima Ação */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Próxima Marcação
          </h2>
          <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">
            {getTypeLabel(nextType)}
          </p>

          {/* Métodos de Registro */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {/* Manual */}
            <button
              onClick={() => handleRegister('manual')}
              disabled={registering}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all flex flex-col items-center gap-3 disabled:opacity-50"
            >
              <Clock className="w-12 h-12 text-emerald-600" />
              <span className="font-semibold text-gray-900 dark:text-white">Registro Manual</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Clique para registrar
              </span>
            </button>

            {/* Geolocalização */}
            <button
              onClick={() => {
                getCurrentLocation();
                handleRegister('geolocation');
              }}
              disabled={registering || !location}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all flex flex-col items-center gap-3 disabled:opacity-50"
            >
              <MapPin className="w-12 h-12 text-blue-600" />
              <span className="font-semibold text-gray-900 dark:text-white">
                Por Localização
              </span>
              {location ? (
                <span className="text-sm text-green-600 dark:text-green-400">
                  Localização obtida
                </span>
              ) : (
                <span className="text-sm text-red-600 dark:text-red-400">
                  {locationError || 'Obtendo localização...'}
                </span>
              )}
            </button>

            {/* QR Code */}
            <button
              onClick={handleGenerateQRCode}
              disabled={registering}
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all flex flex-col items-center gap-3 disabled:opacity-50"
            >
              <QrCode className="w-12 h-12 text-purple-600" />
              <span className="font-semibold text-gray-900 dark:text-white">QR Code</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Gerar código
              </span>
            </button>
          </div>

          {registering && (
            <div className="mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Registrando ponto...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal QR Code */}
      {showQRCode && qrCode && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4 modal-overlay"
          data-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowQRCode(false);
              setQrCode(null);
            }
          }}
          style={{ pointerEvents: 'auto', position: 'fixed' }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto', position: 'relative', zIndex: 100000 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">QR Code</h3>
              <button
                onClick={() => {
                  setShowQRCode(false);
                  setQrCode(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <p className="font-mono text-sm break-all">{qrCode}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Use este código para registrar ponto. Válido por 5 minutos.
              </p>
              <button
                onClick={() => handleRegister('qrcode')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Registrar com este código
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Informações da Jornada */}
      {workSchedule && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-600" />
            Informações da Jornada de Trabalho
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Nome da Jornada</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {workSchedule.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Horas Diárias</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {workSchedule.workHours}h/dia
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {workSchedule.type === 'fixed' ? 'Fixa' :
                 workSchedule.type === 'flexible' ? 'Flexível' :
                 workSchedule.type === '12x36' ? '12x36' :
                 workSchedule.type}
              </p>
            </div>
            {workSchedule.startTime && workSchedule.endTime && (
              <>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Horário de Entrada</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {workSchedule.startTime}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Horário de Saída</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {workSchedule.endTime}
                  </p>
                </div>
                {workSchedule.breakStart && workSchedule.breakEnd && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Intervalo</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {workSchedule.breakStart} - {workSchedule.breakEnd}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

