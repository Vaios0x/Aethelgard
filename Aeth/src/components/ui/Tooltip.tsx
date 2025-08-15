import { PropsWithChildren, useId, useState } from 'react';
import clsx from 'classnames';

interface TooltipProps extends PropsWithChildren {
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function Tooltip({ content, side = 'top', className, children }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className={clsx('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span aria-describedby={id}>{children}</span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={clsx(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-black/80 px-1.5 sm:px-2 py-1 text-xs text-white shadow max-w-[200px] sm:max-w-none',
            side === 'top' && 'left-1/2 -translate-x-1/2 -top-2 translate-y-[-100%]',
            side === 'bottom' && 'left-1/2 -translate-x-1/2 -bottom-2 translate-y-[100%]',
            side === 'left' && 'top-1/2 -translate-y-1/2 -left-2 -translate-x-[100%]',
            side === 'right' && 'top-1/2 -translate-y-1/2 -right-2 translate-x-[100%]'
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}


