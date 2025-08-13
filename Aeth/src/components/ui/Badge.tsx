import { HTMLAttributes } from 'react';
import clsx from 'classnames';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-text-primary border border-white/10',
  success: 'bg-emerald-600/20 text-emerald-200 border border-emerald-400/30',
  warning: 'bg-amber-600/20 text-amber-200 border border-amber-400/30',
  danger: 'bg-rose-600/20 text-rose-200 border border-rose-400/30',
};

export default function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}


