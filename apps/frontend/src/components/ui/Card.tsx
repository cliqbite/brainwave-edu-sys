import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const Card = ({ children, className = '', noPadding = false, ...props }: CardProps) => {
  return (
    <div className={`glass-card ${noPadding ? '' : 'p-6'} ${className}`} {...props}>
      {children}
    </div>
  );
};
