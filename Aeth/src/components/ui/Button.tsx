// @ts-nocheck
import React, { type ButtonHTMLAttributes } from 'react';
import classNames from 'classnames';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'surface';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, children, variant = 'primary', isLoading = false, disabled, ...props },
  ref
) {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition text-sm';
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    surface: 'btn-surface',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={classNames(base, variants[variant], className, (disabled || isLoading) && 'opacity-70 cursor-not-allowed')}
      {...props}
    >
      {isLoading && (
        <span className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden />
      )}
      {children}
    </button>
  );
});

export default Button;


