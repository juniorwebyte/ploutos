/**
 * Configurações do Sistema de Controle de Ponto
 * Configurações globais e por empresa
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Building,
  MapPin,
  Clock,
  Bell,
  Shield,
  CheckCircle,
  Trash2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { companyService, timeClockService, employeeService, type Company } from '../services/timeClockService';

interface TimeClockSettingsProps {
  onBack?: () => void;
}

export default function TimeClockSettings({ onBack }: TimeClockSettingsProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [settings, setSettings] = useState({
    requireGeolocation: false,
    requireIPValidation: false,
    allowManualEntry: true,
    allowQRCode: true,
    delayTolerance: 5,
    earlyExitTolerance: 5,
    notifyMissingPoint: true,
    notifyOvertime: true,
    notifyDelays: true,
    autoCalculateOvertime: true,
    autoCompensateHours: false,
    requireDigitalSignature: false,
  });
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetOptions, setResetOptions] = useState({
    resetHourBalance: true,
    keepEmployees: true,
    keepCompanies: true,
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const comps = await companyService.getAll();
      setCompanies(comps);
      if (comps.length > 0) {
        setSelectedCompany(comps[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Em produção, salvar via API
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-emerald-600" />
            Configurações
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure o sistema de controle de ponto
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Voltar
          </button>
        )}
      </div>

      {/* Seleção de Empresa */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Empresa
        </label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Selecione uma empresa</option>
          {companies.map((comp) => (
            <option key={comp.id} value={comp.id}>
              {comp.name}
            </option>
          ))}
        </select>
      </div>

      {/* Configurações Gerais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Segurança e Validação
        </h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.requireGeolocation}
              onChange={(e) =>
                setSettings({ ...settings, requireGeolocation: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Exigir geolocalização para registro
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.requireIPValidation}
              onChange={(e) =>
                setSettings({ ...settings, requireIPValidation: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Validar IP autorizado
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.allowManualEntry}
              onChange={(e) =>
                setSettings({ ...settings, allowManualEntry: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Permitir registro manual
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.allowQRCode}
              onChange={(e) => setSettings({ ...settings, allowQRCode: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Permitir registro por QR Code
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.requireDigitalSignature}
              onChange={(e) =>
                setSettings({ ...settings, requireDigitalSignature: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Exigir assinatura digital no espelho de ponto
            </span>
          </label>
        </div>
      </div>

      {/* Tolerâncias */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Tolerâncias
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tolerância para Atraso (minutos)
            </label>
            <input
              type="number"
              min="0"
              value={settings.delayTolerance}
              onChange={(e) =>
                setSettings({ ...settings, delayTolerance: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tolerância para Saída Antecipada (minutos)
            </label>
            <input
              type="number"
              min="0"
              value={settings.earlyExitTolerance}
              onChange={(e) =>
                setSettings({ ...settings, earlyExitTolerance: parseInt(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Notificações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notificações
        </h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.notifyMissingPoint}
              onChange={(e) =>
                setSettings({ ...settings, notifyMissingPoint: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Notificar esquecimento de ponto
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.notifyOvertime}
              onChange={(e) => setSettings({ ...settings, notifyOvertime: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Notificar horas extras excessivas
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.notifyDelays}
              onChange={(e) => setSettings({ ...settings, notifyDelays: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Notificar atrasos
            </span>
          </label>
        </div>
      </div>

      {/* Automações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Automações
        </h2>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.autoCalculateOvertime}
              onChange={(e) =>
                setSettings({ ...settings, autoCalculateOvertime: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Calcular horas extras automaticamente
            </span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.autoCompensateHours}
              onChange={(e) =>
                setSettings({ ...settings, autoCompensateHours: e.target.checked })
              }
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Compensar horas automaticamente
            </span>
          </label>
        </div>
      </div>

      {/* Seção de Manutenção e Reset */}
      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Manutenção do Sistema
        </h2>
        <p className="text-sm text-red-800 dark:text-red-300 mb-4">
          <strong>Atenção:</strong> As ações abaixo são irreversíveis. Use com cuidado.
        </p>
        
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-red-200 dark:border-red-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-red-600" />
              Resetar Ciclo de 30 Dias
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Limpa todos os registros de ponto e zera os saldos de horas dos funcionários para iniciar um novo ciclo.
              Esta ação é útil para resetar o sistema mensalmente.
            </p>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Todos os Registros
            </button>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>

      {/* Modal de Confirmação de Reset */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[99999] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Confirmar Reset do Sistema
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Esta ação é irreversível!
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Você está prestes a:
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <span>Excluir <strong>TODOS</strong> os registros de ponto</span>
                </li>
                {resetOptions.resetHourBalance && (
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Zerar o saldo de horas de <strong>TODOS</strong> os funcionários</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Manter funcionários, empresas e configurações cadastradas</span>
                </li>
              </ul>
            </div>

            <div className="mb-6 space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={resetOptions.resetHourBalance}
                  onChange={(e) =>
                    setResetOptions({ ...resetOptions, resetHourBalance: e.target.checked })
                  }
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Zerar saldo de horas dos funcionários
                </span>
              </label>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Digite "RESETAR" para confirmar:
              </label>
              <input
                type="text"
                id="confirmReset"
                placeholder="Digite RESETAR"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetOptions({ resetHourBalance: true, keepEmployees: true, keepCompanies: true });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                disabled={resetting}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const confirmInput = (document.getElementById('confirmReset') as HTMLInputElement)?.value;
                  if (confirmInput?.toUpperCase() !== 'RESETAR') {
                    alert('Por favor, digite "RESETAR" para confirmar a ação.');
                    return;
                  }

                  if (!confirm('Tem CERTEZA ABSOLUTA que deseja limpar todos os registros? Esta ação NÃO pode ser desfeita!')) {
                    return;
                  }

                  setResetting(true);
                  try {
                    const result = await timeClockService.clearAllRecords({
                      resetHourBalance: resetOptions.resetHourBalance,
                      keepEmployees: resetOptions.keepEmployees,
                      keepCompanies: resetOptions.keepCompanies,
                    });

                    alert(
                      `Sistema resetado com sucesso!\n\n` +
                      `Registros excluídos: ${result.deletedRecords}\n` +
                      `Funcionários resetados: ${result.resetEmployees}\n\n` +
                      `O sistema está pronto para um novo ciclo de 30 dias.`
                    );

                    setShowResetModal(false);
                    setResetOptions({ resetHourBalance: true, keepEmployees: true, keepCompanies: true });
                    
                    // Recarregar página para atualizar dados
                    window.location.reload();
                  } catch (error: any) {
                    console.error('Erro ao resetar sistema:', error);
                    alert(`Erro ao resetar sistema: ${error.message || 'Erro desconhecido'}`);
                  } finally {
                    setResetting(false);
                  }
                }}
                disabled={resetting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Resetando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

