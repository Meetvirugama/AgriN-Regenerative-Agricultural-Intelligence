import React from 'react';
import { cn } from '../../lib/cn';
import { StatusLevel } from '../../types/status';

interface StatusBadgeProps {
  status: StatusLevel;
  children: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className }) => {
  const styles: Record<StatusLevel, string> = {
    healthy: 'bg-success/20 text-success border-success/30',
    neutral: 'bg-neutral/20 text-text-muted border-neutral/30',
    info: 'bg-info/20 text-info border-info/30',
    attention: 'bg-warning/20 text-warning border-warning/30',
    urgent: 'bg-danger/20 text-danger border-danger/30',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border',
      styles[status],
      className
    )}>
      {children}
    </span>
  );
};
