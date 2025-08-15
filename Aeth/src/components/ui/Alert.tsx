import { PropsWithChildren } from 'react';
import clsx from 'classnames';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends PropsWithChildren {
  title?: string;
  variant?: AlertVariant;
  className?: string;
}

const variants: Record<AlertVariant, string> = {
  info: 'bg-white/5 border-white/10 text-text-primary',
  success: 'bg-emerald-900/30 border-emerald-700/40 text-emerald-200',
  warning: 'bg-amber-900/30 border-amber-700/40 text-amber-200',
  error: 'bg-rose-900/30 border-rose-700/40 text-rose-200',
};

export default function Alert({ title, children, variant = 'info', className }: AlertProps) {
  return (
    <div className={clsx('rounded-md border p-2 sm:p-3', variants[variant], className)} role="status" aria-live="polite">
      {title && <div className="font-semibold mb-1 text-sm sm:text-base">{title}</div>}
      <div className="text-xs sm:text-sm">{children}</div>
    </div>
  );
}


