import { InputHTMLAttributes, forwardRef } from 'react';
import clsx from 'classnames';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-md bg-surface border border-white/10 px-3 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40',
        className
      )}
      {...props}
    />
  );
});

export default Input;


