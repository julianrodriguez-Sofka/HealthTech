/**
 * Types for Triage Feature
 * 
 * Definiciones de tipos específicas para el módulo de triaje.
 */

export interface VitalSigns {
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  respiratoryRate: number;
  oxygenSaturation: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms: string[];
  vitals: VitalSigns;
  priority?: number;
  arrivalTime: string;
  status: 'waiting' | 'in-progress' | 'completed';
}

export interface PriorityInfo {
  level: number;
  label: string;
  color: string;
  description: string;
  maxWaitTime: number;
}

export const PRIORITY_LEVELS: Record<number, PriorityInfo> = {
  1: {
    level: 1,
    label: 'Crítico',
    color: 'critical',
    description: 'Requiere atención inmediata',
    maxWaitTime: 0,
  },
  2: {
    level: 2,
    label: 'Emergencia',
    color: 'warning',
    description: 'Atención urgente requerida',
    maxWaitTime: 10,
  },
  3: {
    level: 3,
    label: 'Urgente',
    color: 'info',
    description: 'Atención pronta necesaria',
    maxWaitTime: 30,
  },
  4: {
    level: 4,
    label: 'Menos Urgente',
    color: 'success',
    description: 'Puede esperar sin riesgo',
    maxWaitTime: 60,
  },
  5: {
    level: 5,
    label: 'No Urgente',
    color: 'neutral',
    description: 'Atención programable',
    maxWaitTime: 120,
  },
};
