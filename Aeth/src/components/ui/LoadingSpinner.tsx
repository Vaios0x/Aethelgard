import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const colors = {
  primary: 'border-primary',
  white: 'border-white',
  gray: 'border-gray-400'
};

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div 
      className={`
        ${sizes[size]} 
        ${colors[color]} 
        border-2 
        border-t-transparent 
        rounded-full 
        animate-spin 
        ${className}
      `}
      role="status"
      aria-label="Cargando"
    />
  );
}

// Spinner con texto
interface LoadingSpinnerWithTextProps extends LoadingSpinnerProps {
  text?: string;
  textClassName?: string;
}

export function LoadingSpinnerWithText({ 
  text = 'Cargando...',
  textClassName = 'text-text-secondary text-sm',
  ...props 
}: LoadingSpinnerWithTextProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <LoadingSpinner {...props} />
      {text && (
        <span className={textClassName}>{text}</span>
      )}
    </div>
  );
}

// Spinner inline
export function LoadingSpinnerInline({ 
  size = 'sm',
  className = '' 
}: Omit<LoadingSpinnerProps, 'size'> & { size?: 'xs' | 'sm' | 'md' }) {
  const inlineSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };

  return (
    <div 
      className={`
        ${inlineSizes[size]} 
        border-primary 
        border-2 
        border-t-transparent 
        rounded-full 
        animate-spin 
        inline-block 
        ${className}
      `}
      role="status"
      aria-label="Cargando"
    />
  );
}
