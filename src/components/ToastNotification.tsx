import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { AlertType } from '../services/cashFlowAlertsService';

interface ToastNotificationProps {
  type: AlertType;
  title: string;
  message: string;
  duration?: number;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  index?: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
  index = 0
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
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
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-800',
          icon: 'text-emerald-600',
          button: 'hover:bg-emerald-100',
          action: 'text-emerald-700 hover:text-emerald-900'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          button: 'hover:bg-red-100',
          action: 'text-red-700 hover:text-red-900'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          button: 'hover:bg-yellow-100',
          action: 'text-yellow-700 hover:text-yellow-900'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          button: 'hover:bg-blue-100',
          action: 'text-blue-700 hover:text-blue-900'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: 'text-gray-600',
          button: 'hover:bg-gray-100',
          action: 'text-gray-700 hover:text-gray-900'
        };
    }
  };

  const colors = getColorClasses();

  if (!isVisible) return null;

  return (
    <div
      className={`fixed right-4 z-[100] max-w-md w-full transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      style={{ top: `${1 + index * 5.5}rem` }}
    >
      <div
        className={`${colors.bg} ${colors.border} border rounded-xl shadow-lg p-4 flex items-start gap-3`}
      >
        <div className={`${colors.icon} flex-shrink-0 mt-0.5`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`${colors.text} font-semibold text-sm mb-1`}>
            {title}
          </h4>
          <p className={`${colors.text} text-sm opacity-90 mb-2`}>
            {message}
          </p>
          {action && (
            <button
              onClick={action.onClick}
              className={`${colors.action} text-xs font-medium underline transition-colors`}
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleClose}
          className={`${colors.button} p-1 rounded transition-colors flex-shrink-0`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;

