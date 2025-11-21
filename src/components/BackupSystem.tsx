import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Settings,
  Shield,
  HardDrive,
  Cloud,
  Archive,
  FileText,
  Calendar,
  User,
  Server,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Award
} from 'lucide-react';

interface BackupSystemProps {
  onClose: () => void;
}

interface Backup {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  createdAt: Date;
  status: 'completed' | 'failed' | 'in_progress' | 'scheduled';
  location: 'local' | 'cloud' | 'external';
  description?: string;
  files?: number;
  tables?: number;
}

interface RestorePoint {
  id: string;
  name: string;
  timestamp: Date;
  size: number;
  description: string;
  status: 'available' | 'corrupted' | 'in_use';
}

function BackupSystem({ onClose }: BackupSystemProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restorePoints, setRestorePoints] = useState<RestorePoint[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [backupLocation, setBackupLocation] = useState('cloud');
  const [retentionDays, setRetentionDays] = useState(30);

  // Dados simulados
  const mockBackups: Backup[] = [
    {
      id: '1',
      name: 'Backup Completo - 15/10/2025',
      type: 'full',
      size: 2.5 * 1024 * 1024 * 1024, // 2.5GB
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      status: 'completed',
      location: 'cloud',
      description: 'Backup completo do sistema incluindo banco de dados e arquivos',
      files: 15420,
      tables: 25
    },
    {
      id: '2',
      name: 'Backup Incremental - 15/10/2025',
      type: 'incremental',
      size: 150 * 1024 * 1024, // 150MB
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 horas atrás
      status: 'completed',
      location: 'cloud',
      description: 'Backup incremental das alterações desde o último backup completo',
      files: 1250,
      tables: 8
    },
    {
      id: '3',
      name: 'Backup Diferencial - 14/10/2025',
      type: 'differential',
      size: 800 * 1024 * 1024, // 800MB
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
      status: 'completed',
      location: 'local',
      description: 'Backup diferencial das alterações desde o último backup completo',
      files: 5200,
      tables: 15
    },
    {
      id: '4',
      name: 'Backup Completo - 13/10/2025',
      type: 'full',
      size: 2.3 * 1024 * 1024 * 1024, // 2.3GB
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 dias atrás
      status: 'completed',
      location: 'cloud',
      description: 'Backup completo do sistema',
      files: 14800,
      tables: 25
    }
  ];

  const mockRestorePoints: RestorePoint[] = [
    {
      id: '1',
      name: 'Ponto de Restauração - 15/10/2025 14:30',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      size: 2.5 * 1024 * 1024 * 1024,
      description: 'Sistema funcionando perfeitamente',
      status: 'available'
    },
    {
      id: '2',
      name: 'Ponto de Restauração - 15/10/2025 08:15',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      size: 2.4 * 1024 * 1024 * 1024,
      description: 'Antes da atualização do sistema',
      status: 'available'
    },
    {
      id: '3',
      name: 'Ponto de Restauração - 14/10/2025 18:45',
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000),
      size: 2.3 * 1024 * 1024 * 1024,
      description: 'Sistema estável',
      status: 'available'
    }
  ];

  useEffect(() => {
    setBackups(mockBackups);
    setRestorePoints(mockRestorePoints);
  }, []);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    return 'Agora mesmo';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'scheduled':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'scheduled':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'cloud':
        return <Cloud className="w-4 h-4 text-blue-500" />;
      case 'local':
        return <HardDrive className="w-4 h-4 text-green-500" />;
      case 'external':
        return <Archive className="w-4 h-4 text-purple-500" />;
      default:
        return <HardDrive className="w-4 h-4 text-gray-500" />;
    }
  };

  const createBackup = async (type: 'full' | 'incremental' | 'differential') => {
    setIsBackingUp(true);
    
    // Simular processo de backup
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newBackup: Backup = {
      id: Date.now().toString(),
      name: `Backup ${type === 'full' ? 'Completo' : type === 'incremental' ? 'Incremental' : 'Diferencial'} - ${new Date().toLocaleDateString('pt-BR')}`,
      type,
      size: type === 'full' ? 2.5 * 1024 * 1024 * 1024 : type === 'incremental' ? 150 * 1024 * 1024 : 800 * 1024 * 1024,
      createdAt: new Date(),
      status: 'completed',
      location: backupLocation as 'local' | 'cloud' | 'external',
      description: `Backup ${type} criado com sucesso`,
      files: type === 'full' ? 15420 : type === 'incremental' ? 1250 : 5200,
      tables: type === 'full' ? 25 : type === 'incremental' ? 8 : 15
    };
    
    setBackups(prev => [newBackup, ...prev]);
    setIsBackingUp(false);
  };

  const restoreFromBackup = async (backup: Backup) => {
    setIsRestoring(true);
    setSelectedBackup(backup);
    
    // Simular processo de restauração
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    setIsRestoring(false);
    setSelectedBackup(null);
  };

  const deleteBackup = (backupId: string) => {
    setBackups(prev => prev.filter(b => b.id !== backupId));
  };

  const menuItems = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3, color: 'blue' },
    { id: 'backups', label: 'Backups', icon: Database, color: 'green' },
    { id: 'restore', label: 'Restauração', icon: RefreshCw, color: 'purple' },
    { id: 'settings', label: 'Configurações', icon: Settings, color: 'gray' }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600 text-white',
      green: 'bg-green-500 hover:bg-green-600 text-white',
      purple: 'bg-purple-500 hover:bg-purple-600 text-white',
      gray: 'bg-gray-500 hover:bg-gray-600 text-white'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total de Backups</p>
              <p className="text-3xl font-bold">{backups.length}</p>
              <p className="text-blue-200 text-sm">Último: {formatTimeAgo(backups[0]?.createdAt || new Date())}</p>
            </div>
            <Database className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Espaço Usado</p>
              <p className="text-3xl font-bold">
                {formatFileSize(backups.reduce((total, backup) => total + backup.size, 0))}
              </p>
              <p className="text-green-200 text-sm">Em backups</p>
            </div>
            <HardDrive className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Pontos de Restauração</p>
              <p className="text-3xl font-bold">{restorePoints.length}</p>
              <p className="text-purple-200 text-sm">Disponíveis</p>
            </div>
            <RefreshCw className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Status do Sistema</p>
              <p className="text-3xl font-bold">99.9%</p>
              <p className="text-orange-200 text-sm">Uptime</p>
            </div>
            <Shield className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => createBackup('full')}
            disabled={isBackingUp}
            className="flex items-center justify-center space-x-3 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="w-6 h-6" />
            <div className="text-left">
              <p className="font-medium">Backup Completo</p>
              <p className="text-sm opacity-75">Criar backup completo</p>
            </div>
          </button>

          <button
            onClick={() => createBackup('incremental')}
            disabled={isBackingUp}
            className="flex items-center justify-center space-x-3 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-6 h-6" />
            <div className="text-left">
              <p className="font-medium">Backup Incremental</p>
              <p className="text-sm opacity-75">Apenas alterações</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className="flex items-center justify-center space-x-3 p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <RefreshCw className="w-6 h-6" />
            <div className="text-left">
              <p className="font-medium">Restaurar Sistema</p>
              <p className="text-sm opacity-75">Escolher ponto de restauração</p>
            </div>
          </button>
        </div>
      </div>

      {/* Backups Recentes */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Backups Recentes</h3>
          <button
            onClick={() => setActiveTab('backups')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver todos
          </button>
        </div>
        <div className="space-y-3">
          {backups.slice(0, 3).map((backup) => (
            <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(backup.status)}
                <div>
                  <p className="font-medium text-gray-800">{backup.name}</p>
                  <p className="text-sm text-gray-600">{formatFileSize(backup.size)} • {formatTimeAgo(backup.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getLocationIcon(backup.location)}
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(backup.status)}`}>
                  {backup.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBackups = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gerenciar Backups</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => createBackup('full')}
            disabled={isBackingUp}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>Backup Completo</span>
          </button>
          <button
            onClick={() => createBackup('incremental')}
            disabled={isBackingUp}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Backup Incremental</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamanho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Local</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-gray-900">{backup.name}</p>
                      <p className="text-sm text-gray-500">{backup.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      backup.type === 'full' ? 'bg-blue-100 text-blue-800' :
                      backup.type === 'incremental' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {backup.type === 'full' ? 'Completo' : backup.type === 'incremental' ? 'Incremental' : 'Diferencial'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(backup.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimeAgo(backup.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(backup.status)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(backup.status)}`}>
                        {backup.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getLocationIcon(backup.location)}
                      <span className="text-sm text-gray-900 capitalize">{backup.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => restoreFromBackup(backup)}
                        disabled={isRestoring || backup.status !== 'completed'}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Restaurar
                      </button>
                      <button
                        onClick={() => deleteBackup(backup.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderRestore = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Restaurar Sistema</h2>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pontos de Restauração Disponíveis</h3>
        <div className="space-y-4">
          {restorePoints.map((point) => (
            <div key={point.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{point.name}</p>
                  <p className="text-sm text-gray-600">{point.description}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(point.size)} • {formatTimeAgo(point.timestamp)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  point.status === 'available' ? 'bg-green-100 text-green-800' :
                  point.status === 'corrupted' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {point.status === 'available' ? 'Disponível' : point.status === 'corrupted' ? 'Corrompido' : 'Em uso'}
                </span>
                <button
                  onClick={() => restoreFromBackup({ ...point, type: 'full', status: 'completed', location: 'local' } as Backup)}
                  disabled={isRestoring || point.status !== 'available'}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Restaurar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Configurações de Backup</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Configurações Gerais</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Backup Automático</label>
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
              <select
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hourly">A cada hora</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
                <option value="monthly">Mensalmente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Local de Armazenamento</label>
              <select
                value={backupLocation}
                onChange={(e) => setBackupLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="local">Local</option>
                <option value="cloud">Nuvem</option>
                <option value="external">Dispositivo Externo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Retenção (dias)</label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="365"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estatísticas</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total de Backups:</span>
              <span className="font-medium">{backups.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Espaço Total:</span>
              <span className="font-medium">{formatFileSize(backups.reduce((total, backup) => total + backup.size, 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Último Backup:</span>
              <span className="font-medium">{formatTimeAgo(backups[0]?.createdAt || new Date())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Backups Completos:</span>
              <span className="font-medium">{backups.filter(b => b.type === 'full').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Backups Incrementais:</span>
              <span className="font-medium">{backups.filter(b => b.type === 'incremental').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'backups':
        return renderBackups();
      case 'restore':
        return renderRestore();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Sistema de Backup</h1>
              <p className="text-gray-600">Gerenciamento de backups e restauração</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-1 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    activeTab === item.id
                      ? getColorClasses(item.color)
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Loading Overlay */}
        {(isBackingUp || isRestoring) && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="flex items-center justify-center mb-4">
                {isBackingUp ? (
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                ) : (
                  <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {isBackingUp ? 'Criando Backup...' : 'Restaurando Sistema...'}
              </h3>
              <p className="text-gray-600">
                {isBackingUp ? 'Por favor, aguarde enquanto o backup é criado.' : 'Por favor, aguarde enquanto o sistema é restaurado.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BackupSystem;
