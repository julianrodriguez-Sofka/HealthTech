/**
 * Empty State Component
 * 
 * Componente para mostrar cuando no hay datos disponibles.
 * Mejora la UX con ilustraciones y mensajes motivadores.
 */

import { FileQuestion, Heart, Users } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  variant?: 'no-patients' | 'no-results' | 'error';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  variant = 'no-patients',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const configs = {
    'no-patients': {
      icon: Users,
      defaultTitle: '¡Todo bajo control!',
      defaultDescription:
        'No hay pacientes esperando atención en este momento. El equipo está listo para recibir nuevos ingresos.',
      iconColor: 'text-success-500',
      iconBg: 'bg-success-50',
    },
    'no-results': {
      icon: FileQuestion,
      defaultTitle: 'No se encontraron resultados',
      defaultDescription:
        'Intenta ajustar los filtros o criterios de búsqueda para encontrar lo que necesitas.',
      iconColor: 'text-primary-500',
      iconBg: 'bg-primary-50',
    },
    error: {
      icon: Heart,
      defaultTitle: 'Algo salió mal',
      defaultDescription:
        'No pudimos cargar la información. Por favor, intenta de nuevo en unos momentos.',
      iconColor: 'text-critical-500',
      iconBg: 'bg-critical-50',
    },
  };

  const config = configs[variant];
  const Icon = config.icon;

  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div
        className={`w-20 h-20 rounded-full ${config.iconBg} flex items-center justify-center mb-4`}
      >
        <Icon className={`w-10 h-10 ${config.iconColor}`} aria-hidden="true" />
      </div>

      <h3 className="text-xl font-semibold text-slate-900 mb-2">
        {title || config.defaultTitle}
      </h3>

      <p className="text-slate-600 max-w-md mb-6">
        {description || config.defaultDescription}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
