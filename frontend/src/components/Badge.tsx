/**
 * Badge Component - Atomic Component
 * 
 * Etiqueta visual para mostrar prioridades, estados, etc.
 */

import { HTMLAttributes } from 'react';
import clsx from 'clsx';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'critical' | 'warning' | 'success' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center font-medium rounded-full';

  const variants = {
    critical: 'bg-critical-100 text-critical-700 border border-critical-300',
    warning: 'bg-warning-100 text-warning-700 border border-warning-300',
    success: 'bg-success-100 text-success-700 border border-success-300',
    info: 'bg-primary-100 text-primary-700 border border-primary-300',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-300',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        pulse && 'animate-pulse-slow',
        className
      )}
      {...props}
    >
      {pulse && variant === 'critical' && (
        <span className="relative flex h-2 w-2 mr-1.5">
          <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-critical-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-critical-500" />
        </span>
      )}
      {children}
    </span>
  );
}
