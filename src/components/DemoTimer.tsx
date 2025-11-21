import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface DemoTimerProps {
  timeInfo: {
    timeRemaining: number;
    isExpired: boolean;
    percentage: number;
    minutes: number;
    seconds: number;
  };
}

export default function DemoTimer({ timeInfo }: DemoTimerProps) {
  const { minutes, seconds, percentage, isExpired } = timeInfo;

  // Determinar cor baseada no tempo restante
  const getProgressColor = () => {
    if (isExpired) return 'from-red-500 to-red-600';
    if (percentage > 80) return 'from-green-500 to-green-600';
    if (percentage > 60) return 'from-yellow-500 to-yellow-600';
    if (percentage > 40) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getTextColor = () => {
    if (isExpired) return 'text-red-600';
    if (percentage > 80) return 'text-green-600';
    if (percentage > 60) return 'text-yellow-600';
    if (percentage > 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-blue-500">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${getTextColor()}`} />
          <span className="font-semibold text-gray-700">Tempo da Demo</span>
        </div>
        <div className="flex items-center gap-2">
          {isExpired && <AlertTriangle className="w-4 h-4 text-red-500" />}
          <span className={`font-bold text-lg ${getTextColor()}`}>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      
      {/* Barra de Progresso */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
        <div
          className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor()} transition-all duration-1000 ease-out`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      
      {/* Status Text */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">
          {isExpired ? 'Demo expirada' : `${Math.floor(percentage)}% concluído`}
        </span>
        <span className="text-gray-500">
          {isExpired ? 'Contate-nos para continuar' : 'Tempo restante'}
        </span>
      </div>
    </div>
  );
}
