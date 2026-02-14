import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  actionLabel,
  className 
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center p-12', className)}>
      {Icon && <Icon className="w-16 h-16 text-muted-foreground opacity-50 mb-4" />}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </div>
  );
}