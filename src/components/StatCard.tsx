import React, { memo } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  color: string;
  index: number;
}

const StatCard = memo<StatCardProps>(({ icon: Icon, value, label, color, index }) => {
  const colorClasses = {
    blue: 'from-blue-500 via-purple-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-indigo-500',
    orange: 'from-orange-500 to-red-500',
  };

  return (
    <div 
      className={`text-center group transition-all duration-500 hover:scale-105 animate-bounce-in`} 
      style={{animationDelay: `${index * 200}ms`}}
    >
      <div className={`w-16 h-16 bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue} rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 relative overflow-hidden animate-pulse-glow`}>
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-shimmer"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-full animate-rotate-slow"></div>
        <span className="text-white relative z-10 animate-float">
          <Icon className="w-6 h-6" />
        </span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-300 animate-slide-up">{value}</div>
      <div className="text-sm text-gray-600 font-medium group-hover:text-gray-800 transition-colors duration-300">{label}</div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
