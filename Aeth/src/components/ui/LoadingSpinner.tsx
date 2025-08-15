import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const variantClasses = {
  default: 'border-gray-300 border-t-gray-600',
  primary: 'border-primary/30 border-t-primary',
  white: 'border-white/30 border-t-white'
};

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  className = '',
  text
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} ${variantClasses[variant]} border-2 rounded-full animate-spin`}
        role="status"
        aria-label="Cargando"
      />
      {text && (
        <p className="text-sm text-text-secondary animate-pulse">{text}</p>
      )}
    </div>
  );
}
