import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { Alert, AlertType } from '../services/cashFlowAlertsService';

interface AlertBadgeProps {
  alert: Alert;
  onDismiss?: (id: string) => void;
  onRead?: (id: string) => void;
  compact?: boolean;
}

const AlertBadge: React.FC<AlertBadgeProps> = ({
  alert,
  onDismiss,
  onRead,
  compact = false
}) => {
  const getIcon = () => {
    switch (alert.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getColorClasses = () => {
    switch (alert.type) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          icon: 'text-emerald-600',
          button: 'hover:bg-emerald-100'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          button: 'hover:bg-red-100'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          button: 'hover:bg-yellow-100'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          button: 'hover:bg-blue-100'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          button: 'hover:bg-gray-100'
        };
    }
  };

  const colors = getColorClasses();

  if (compact) {
    return (
      <div
        className={`${colors.bg} ${colors.border} border rounded-lg p-2 flex items-start gap-1.5 ${!alert.read ? 'ring-1 ring-offset-0.5 ring-opacity-50' : ''}`}
        style={!alert.read ? { ringColor: colors.icon } : {}}
        onClick={() => onRead && !alert.read && onRead(alert.id)}
      >
        <div className={`${colors.icon} flex-shrink-0 mt-0.5`}>
          {React.cloneElement(getIcon() as React.ReactElement, { className: 'w-3 h-3' })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5 mb-0.5">
            <h4 className={`${colors.text} font-semibold text-xs`}>
              {alert.title}
            </h4>
            {!alert.read && (
              <span className="flex-shrink-0 w-1 h-1 bg-current rounded-full opacity-75"></span>
            )}
          </div>
          <p className={`${colors.text} text-xs opacity-90 mb-0.5`}>
            {alert.message}
          </p>
          <div className="flex items-center justify-between">
            <span className={`${colors.text} text-xs opacity-75`}>
              {new Date(alert.timestamp).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {alert.actionLabel && (
              <button
                className={`${colors.text} text-xs font-medium underline hover:opacity-80 transition-opacity`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (alert.actionUrl) {
                    const element = document.querySelector(alert.actionUrl);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
              >
                {alert.actionLabel}
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(alert.id);
            }}
            className={`${colors.button} p-0.5 rounded transition-colors flex-shrink-0`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-xl p-4 shadow-sm ${!alert.read ? 'ring-2 ring-offset-2 ring-opacity-50' : ''}`}
      style={!alert.read ? { ringColor: colors.icon } : {}}
      onClick={() => onRead && !alert.read && onRead(alert.id)}
    >
      <div className="flex items-start gap-3">
        <div className={`${colors.icon} flex-shrink-0 mt-0.5`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`${colors.text} font-semibold text-sm`}>
              {alert.title}
            </h4>
            {!alert.read && (
              <span className="flex-shrink-0 w-2 h-2 bg-current rounded-full opacity-75"></span>
            )}
          </div>
          <p className={`${colors.text} text-sm opacity-90 mb-2`}>
            {alert.message}
          </p>
          <div className="flex items-center justify-between">
            <span className={`${colors.text} text-xs opacity-75`}>
              {new Date(alert.timestamp).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            {alert.actionLabel && (
              <button
                className={`${colors.text} text-xs font-medium underline hover:opacity-80 transition-opacity`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (alert.actionUrl) {
                    const element = document.querySelector(alert.actionUrl);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
              >
                {alert.actionLabel}
              </button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(alert.id);
            }}
            className={`${colors.button} p-1 rounded transition-colors flex-shrink-0`}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertBadge;

