import React from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevation?: 'none' | 'raised';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  padding = 'md',
  elevation = 'none',
  ...props 
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div 
      className={cn(
        'border border-neutral rounded-xl',
        elevation === 'none' ? 'bg-surface' : 'bg-surface-raised shadow-md',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
