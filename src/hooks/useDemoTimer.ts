import { useState, useEffect, useCallback } from 'react';

interface DemoTimeInfo {
  timeRemaining: number;
  isExpired: boolean;
  percentage: number;
  minutes: number;
  seconds: number;
}

const DEMO_DURATION = 5 * 60 * 1000; // 5 minutos em milissegundos

export function useDemoTimer() {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(DEMO_DURATION);
  const [isExpired, setIsExpired] = useState(false);

  // Iniciar o timer da demo
  const startDemo = useCallback(() => {
    const now = Date.now();
    setStartTime(now);
    setIsExpired(false);
    setTimeRemaining(DEMO_DURATION);
  }, []);

  // Resetar o timer
  const resetDemo = useCallback(() => {
    setStartTime(null);
    setIsExpired(false);
    setTimeRemaining(DEMO_DURATION);
  }, []);

  // Atualizar o tempo restante
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, DEMO_DURATION - elapsed);
      
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setIsExpired(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Calcular informações do tempo
  const timeInfo: DemoTimeInfo = {
    timeRemaining,
    isExpired,
    percentage: ((DEMO_DURATION - timeRemaining) / DEMO_DURATION) * 100,
    minutes: Math.floor(timeRemaining / 60000),
    seconds: Math.floor((timeRemaining % 60000) / 1000)
  };

  return {
    startDemo,
    resetDemo,
    timeInfo,
    isDemoActive: startTime !== null
  };
}
