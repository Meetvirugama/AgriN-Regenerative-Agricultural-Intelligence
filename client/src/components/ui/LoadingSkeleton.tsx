import React from 'react';
import { Card } from './Card';
import { Loader2 } from 'lucide-react';

export const LoadingSkeleton: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <Card className="flex flex-col items-center justify-center p-8 animate-pulse text-text-muted text-sm font-bold uppercase tracking-widest gap-4">
    <Loader2 className="w-8 h-8 animate-spin" />
    {message}
  </Card>
);
