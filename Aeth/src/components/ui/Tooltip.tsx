import { PropsWithChildren, useId, useState } from 'react';
import clsx from 'classnames';

interface TooltipProps extends PropsWithChildren {
  content: string | React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  variant?: 'default' | 'info' | 'warning' | 'success';
  delay?: number;
  maxWidth?: string;
}

export default function Tooltip({ 
  content, 
  side = 'top', 
  className, 
  children,
  variant = 'default',
  delay = 200,
  maxWidth = 'max-w-[200px] sm:max-w-none'
}: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const id = setTimeout(() => setOpen(true), delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setOpen(false);
  };

  const variantStyles = {
    default: 'bg-black/80 text-white',
    info: 'bg-blue-600/90 text-white',
    warning: 'bg-amber-600/90 text-white',
    success: 'bg-green-600/90 text-white'
  };

  return (
    <span 
      className={clsx('relative inline-flex', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      <span aria-describedby={id}>{children}</span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={clsx(
            'pointer-events-none absolute z-50 rounded-md px-2 py-1.5 text-xs shadow-lg border border-white/10',
            variantStyles[variant],
            maxWidth,
            side === 'top' && 'left-1/2 -translate-x-1/2 -top-2 translate-y-[-100%]',
            side === 'bottom' && 'left-1/2 -translate-x-1/2 -bottom-2 translate-y-[100%]',
            side === 'left' && 'top-1/2 -translate-y-1/2 -left-2 -translate-x-[100%]',
            side === 'right' && 'top-1/2 -translate-y-1/2 -right-2 translate-x-[100%]'
          )}
        >
          {content}
          {/* Arrow */}
          <div
            className={clsx(
              'absolute w-2 h-2 rotate-45 border border-white/10',
              variant === 'default' && 'bg-black/80',
              variant === 'info' && 'bg-blue-600/90',
              variant === 'warning' && 'bg-amber-600/90',
              variant === 'success' && 'bg-green-600/90',
              side === 'top' && 'top-full left-1/2 -translate-x-1/2 border-t-0 border-l-0',
              side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 border-b-0 border-r-0',
              side === 'left' && 'left-full top-1/2 -translate-y-1/2 border-l-0 border-t-0',
              side === 'right' && 'right-full top-1/2 -translate-y-1/2 border-r-0 border-b-0'
            )}
          />
        </span>
      )}
    </span>
  );
}


