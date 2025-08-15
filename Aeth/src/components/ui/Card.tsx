import { PropsWithChildren } from 'react';
import clsx from 'classnames';

interface CardProps extends PropsWithChildren {
  className?: string;
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={clsx('card-surface rounded-xl p-3 sm:p-4', className)}>
      {children}
    </div>
  );
}


