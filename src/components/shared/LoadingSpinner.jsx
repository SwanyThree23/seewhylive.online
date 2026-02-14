import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoadingSpinner({ className, size = 'default' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
    </div>
  );
}