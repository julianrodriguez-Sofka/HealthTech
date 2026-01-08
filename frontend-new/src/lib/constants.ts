import { TriageLevel } from '@/types';

export const PRIORITY_LABELS: Record<TriageLevel, string> = {
  [TriageLevel.CRITICAL]: 'Crítico',
  [TriageLevel.HIGH]: 'Alto',
  [TriageLevel.MODERATE]: 'Moderado',
  [TriageLevel.LOW]: 'Bajo',
  [TriageLevel.NON_URGENT]: 'No urgente'
};

export const PRIORITY_COLORS: Record<TriageLevel, {
  bg: string;
  text: string;
  badge: 'danger' | 'warning' | 'info' | 'success' | 'neutral';
}> = {
  [TriageLevel.CRITICAL]: {
    bg: 'bg-red-100 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    badge: 'danger'
  },
  [TriageLevel.HIGH]: {
    bg: 'bg-orange-100 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-400',
    badge: 'warning'
  },
  [TriageLevel.MODERATE]: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    badge: 'warning'
  },
  [TriageLevel.LOW]: {
    bg: 'bg-blue-100 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    badge: 'info'
  },
  [TriageLevel.NON_URGENT]: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-400',
    badge: 'neutral'
  }
};

export const ESI_CRITERIA = {
  [TriageLevel.CRITICAL]: {
    title: 'Nivel 1 - Resucitación',
    description: 'Amenaza vital inmediata que requiere intervención inmediata',
    examples: [
      'Paro cardiorrespiratorio',
      'Trauma severo con shock',
      'Inconsciencia súbita',
      'Convulsiones activas'
    ]
  },
  [TriageLevel.HIGH]: {
    title: 'Nivel 2 - Emergencia',
    description: 'Alto riesgo o dolor severo, atención en 10-15 minutos',
    examples: [
      'Dolor torácico agudo',
      'Dificultad respiratoria severa',
      'Trauma craneal con alteración de conciencia',
      'Hemorragia significativa'
    ]
  },
  [TriageLevel.MODERATE]: {
    title: 'Nivel 3 - Urgencia',
    description: 'Requiere múltiples recursos, estable pero necesita atención',
    examples: [
      'Dolor abdominal agudo',
      'Fracturas simples',
      'Infecciones moderadas',
      'Deshidratación moderada'
    ]
  },
  [TriageLevel.LOW]: {
    title: 'Nivel 4 - Menos Urgente',
    description: 'Requiere un recurso, condición no urgente',
    examples: [
      'Heridas menores',
      'Síntomas gripales',
      'Dolor leve',
      'Consultas de seguimiento'
    ]
  },
  [TriageLevel.NON_URGENT]: {
    title: 'Nivel 5 - No Urgente',
    description: 'Puede ser derivado a atención primaria',
    examples: [
      'Certificados médicos',
      'Consultas administrativas',
      'Síntomas crónicos estables',
      'Renovación de recetas'
    ]
  }
};

export function getPriorityColor(priority: TriageLevel): string {
  return PRIORITY_COLORS[priority].bg;
}

export function getPriorityTextColor(priority: TriageLevel): string {
  return PRIORITY_COLORS[priority].text;
}

export function getPriorityBadgeVariant(priority: TriageLevel) {
  return PRIORITY_COLORS[priority].badge;
}
