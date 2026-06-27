import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    let baseClass = 'btn';
    
    // Variant
    if (variant === 'primary') baseClass += ' btn-primary';
    else if (variant === 'secondary') baseClass += ' btn-secondary';
    else if (variant === 'danger') baseClass += ' btn-danger';
    else if (variant === 'outline') baseClass += ' border border-slate-300 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300';
    else if (variant === 'ghost') baseClass += ' hover:bg-slate-100 dark:hover:bg-white/5 bg-transparent text-slate-700 dark:text-slate-300';
    
    // Size
    if (size === 'sm') baseClass += ' text-xs py-1.5 px-3';
    else if (size === 'lg') baseClass += ' text-base py-3 px-6';
    else if (size === 'icon') baseClass += ' p-2';

    return (
      <button
        ref={ref}
        className={`${baseClass} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />}
        {!isLoading && leftIcon}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
