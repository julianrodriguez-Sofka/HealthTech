/**
 * Card Component - Atomic Component
 * 
 * Contenedor reutilizable con sombra y padding consistente.
 */

import { HTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    { children, variant = 'default', padding = 'md', className, ...props },
    ref
  ) => {
    const baseStyles = 'bg-white rounded-lg';

    const variants = {
      default: 'border border-slate-200',
      bordered: 'border-2 border-slate-300',
      elevated: 'shadow-md hover:shadow-lg transition-shadow duration-200',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={clsx(baseStyles, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
