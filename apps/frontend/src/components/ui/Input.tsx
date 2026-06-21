import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, id, ...props }, ref) => {
    const inputId = id || label?.replace(/\s+/g, '-').toLowerCase();

    return (
      <div className="form-group">
        {label && <label htmlFor={inputId} className="form-label">{label}</label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`form-input ${icon ? '!pl-10' : ''} ${error ? '!border-danger focus:!shadow-[0_0_0_2px_rgba(239,68,68,0.2)]' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
