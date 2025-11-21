import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCheck, Filter } from 'lucide-react';
import { cashFlowAlertsService, Alert, AlertCategory } from '../services/cashFlowAlertsService';
import AlertBadge from './AlertBadge';

interface AlertCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const AlertCenter: React.FC<AlertCenterProps> = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<AlertCategory | 'all'>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
      const unsubscribe = cashFlowAlertsService.subscribe((updatedAlerts) => {
        setAlerts(updatedAlerts);
      });
      return unsubscribe;
    }
  }, [isOpen, filter, showUnreadOnly]);

  const loadAlerts = () => {
    const allAlerts = cashFlowAlertsService.getAlerts(
      filter === 'all' ? undefined : filter,
      showUnreadOnly
    );
    setAlerts(allAlerts);
  };

  const handleDismiss = (id: string) => {
    cashFlowAlertsService.removeAlert(id);
  };

  const handleRead = (id: string) => {
    cashFlowAlertsService.markAsRead(id);
  };

  const handleMarkAllRead = () => {
    cashFlowAlertsService.markAllAsRead();
  };

  const unreadCount = cashFlowAlertsService.getUnreadCount();

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(alert => {
    if (filter !== 'all' && alert.category !== filter) return false;
    if (showUnreadOnly && alert.read) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-1 overflow-y-auto pt-16">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-3 py-1.5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900">Central de Alertas</h2>
              <p className="text-xs text-gray-600">
                {unreadCount > 0 ? `${unreadCount} não lido${unreadCount > 1 ? 's' : ''}` : 'Todos os alertas lidos'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Todos</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="px-3 py-1.5 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5">
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-gray-600" />
              <span className="text-xs font-medium text-gray-700">Filtrar:</span>
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as AlertCategory | 'all')}
              className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="meta">Meta</option>
              <option value="saldo">Saldo</option>
              <option value="movimentacao">Movimentação</option>
              <option value="fechamento">Fechamento</option>
              <option value="geral">Geral</option>
            </select>
            <label className="flex items-center gap-1 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-3 h-3"
              />
              Apenas não lidos
            </label>
          </div>
        </div>

        {/* Lista de Alertas */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-6">
              <Bell className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 text-xs mb-1">Nenhum alerta</p>
              <p className="text-gray-500 text-xs">
                {showUnreadOnly ? 'Todos os alertas foram lidos' : 'Não há alertas para exibir'}
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertBadge
                key={alert.id}
                alert={alert}
                onDismiss={handleDismiss}
                onRead={handleRead}
                compact={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertCenter;

