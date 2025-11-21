import { useState, useCallback } from 'react';
import { NotificationType } from '../components/Notification';

interface NotificationState {
  type: NotificationType;
  message: string;
  isVisible: boolean;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    type: 'info',
    message: '',
    isVisible: false
  });

  const showNotification = useCallback((type: NotificationType, message: string, duration: number = 4000) => {
    setNotification({
      type,
      message,
      isVisible: true
    });

    // Auto-hide após o tempo especificado
    setTimeout(() => {
      hideNotification();
    }, duration);
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    showNotification('success', message, duration);
  }, [showNotification]);

  const showError = useCallback((message: string, duration?: number) => {
    showNotification('error', message, duration);
  }, [showNotification]);

  const showWarning = useCallback((message: string, duration?: number) => {
    showNotification('warning', message, duration);
  }, [showNotification]);

  const showInfo = useCallback((message: string, duration?: number) => {
    showNotification('info', message, duration);
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};
