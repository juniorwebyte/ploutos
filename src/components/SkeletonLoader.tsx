import React from 'react';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  lines?: number;
}

export default function SkeletonLoader({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular',
  lines = 1,
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} mb-2`}
            style={{
              width: index === lines - 1 ? '80%' : width,
              height,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonLoader key={i} height="2rem" width="100%" variant="rounded" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonLoader key={colIndex} height="3rem" width="100%" variant="rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-lg p-6">
          <SkeletonLoader height="1.5rem" width="60%" variant="rounded" className="mb-4" />
          <SkeletonLoader height="2.5rem" width="100%" variant="rounded" className="mb-2" />
          <SkeletonLoader height="1rem" width="80%" variant="rounded" />
        </div>
      ))}
    </div>
  );
}
