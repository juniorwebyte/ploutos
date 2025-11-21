import React, { useState, useEffect } from 'react';
import { X, Download, Upload, RotateCcw, Trash2, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cashFlowBackupService, BackupData } from '../services/cashFlowBackupService';
import { formatCurrency } from '../utils/currency';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore?: () => void;
}

const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose, onRestore }) => {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [filter, setFilter] = useState<'all' | 'daily' | 'manual' | 'closing'>('all');
  const [selectedBackup, setSelectedBackup] = useState<BackupData | null>(null);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBackups();
    }
  }, [isOpen, filter]);

  const loadBackups = () => {
    const allBackups = filter === 'all'
      ? cashFlowBackupService.getAllBackups()
      : cashFlowBackupService.getBackupsByType(filter);
    
    setBackups(allBackups);
  };

  const handleRestore = (backup: BackupData) => {
    setSelectedBackup(backup);
    setShowConfirmRestore(true);
  };

  const confirmRestore = () => {
    if (!selectedBackup) return;

    const restored = cashFlowBackupService.restoreBackup(selectedBackup.id);
    if (restored) {
      setShowConfirmRestore(false);
      setSelectedBackup(null);
      loadBackups();
      if (onRestore) {
        onRestore();
      }
      alert('Backup restaurado com sucesso! Recarregue a página para ver as alterações.');
    } else {
      alert('Erro ao restaurar backup.');
    }
  };

  const handleDelete = (backupId: string) => {
    if (confirm('Tem certeza que deseja excluir este backup?')) {
      cashFlowBackupService.deleteBackup(backupId);
      loadBackups();
    }
  };

  const handleExport = (backup: BackupData) => {
    const json = cashFlowBackupService.exportBackup(backup.id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${backup.date}-${backup.id.substring(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: BackupData['type']) => {
    switch (type) {
      case 'daily': return 'Diário';
      case 'manual': return 'Manual';
      case 'closing': return 'Fechamento';
      default: return type;
    }
  };

  const getTypeColor = (type: BackupData['type']) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'manual': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closing': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-1 overflow-y-auto pt-16">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-gray-900">Backup e Restauração</h2>
            <p className="text-xs text-gray-600">Gerencie seus backups e restaure dados anteriores</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5">
          <span className="text-xs font-medium text-gray-700">Filtrar:</span>
          {(['all', 'daily', 'manual', 'closing'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                filter === type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {type === 'all' ? 'Todos' : getTypeLabel(type)}
            </button>
          ))}
        </div>

        {/* Lista de Backups */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {backups.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-xs mb-1">Nenhum backup encontrado</p>
              <p className="text-gray-500 text-xs">
                Os backups são criados automaticamente diariamente
              </p>
            </div>
          ) : (
            backups.map((backup) => (
              <div
                key={backup.id}
                className="bg-white rounded-lg border border-gray-200 p-2.5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getTypeColor(backup.type)}`}>
                        {getTypeLabel(backup.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(backup.timestamp)}
                      </span>
                      {backup.metadata?.version && (
                        <span className="text-xs text-gray-400">
                          v{backup.metadata.version}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Entradas:</span>
                        <span className="ml-1 font-semibold text-emerald-600">
                          {formatCurrency(backup.data.totalEntradas)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Saídas:</span>
                        <span className="ml-1 font-semibold text-red-600">
                          {formatCurrency(backup.data.totalSaidas)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Saldo:</span>
                        <span className={`ml-1 font-semibold ${backup.data.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(backup.data.total)}
                        </span>
                      </div>
                    </div>
                    {backup.metadata?.notes && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        {backup.metadata.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleRestore(backup)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      title="Restaurar"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleExport(backup)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Exportar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(backup.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Confirmação de Restauração */}
        {showConfirmRestore && selectedBackup && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="text-sm font-bold text-gray-900">Confirmar Restauração</h3>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Tem certeza que deseja restaurar este backup? O estado atual será salvo antes da restauração.
              </p>
              <div className="bg-gray-50 rounded-lg p-2 mb-4">
                <p className="text-xs text-gray-700">
                  <strong>Backup selecionado:</strong> {formatDate(selectedBackup.timestamp)}
                </p>
                <p className="text-xs text-gray-700">
                  <strong>Tipo:</strong> {getTypeLabel(selectedBackup.type)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmRestore}
                  className="flex-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs font-medium"
                >
                  Confirmar Restauração
                </button>
                <button
                  onClick={() => {
                    setShowConfirmRestore(false);
                    setSelectedBackup(null);
                  }}
                  className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupRestoreModal;

