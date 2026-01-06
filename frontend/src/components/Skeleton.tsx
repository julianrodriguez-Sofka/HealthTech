/**
 * Skeleton Loader Component
 * 
 * Componente para mostrar estado de carga con animación.
 * Mejora la percepción de velocidad y UX.
 */

import clsx from 'clsx';

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: SkeletonProps) {
  const baseStyles = 'skeleton';

  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={clsx(baseStyles, variants[variant], className)}
      style={style}
      aria-busy="true"
      aria-live="polite"
      aria-label="Cargando..."
    />
  );
}

/**
 * Skeleton para tabla de pacientes
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Cargando pacientes...">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-lg">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" />
            <Skeleton width="60%" />
          </div>
          <Skeleton width={80} height={32} className="rounded-full" />
        </div>
      ))}
    </div>
  );
}
