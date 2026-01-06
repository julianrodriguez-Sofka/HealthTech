/**
 * Tipos extendidos para Doctor Dashboard
 */

export type PatientStatus =
  | 'En Atención'
  | 'Estabilizado'
  | 'Observación'
  | 'Esperando'
  | 'Dado de Alta';

export type PatientTag =
  | 'Prioridad de Traslado'
  | 'Pendiente de Laboratorio'
  | 'Requiere Especialista'
  | 'Multidisciplinario'
  | 'Seguimiento'
  | 'Alta Próxima';

export interface ExtendedPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  priority: number;
  status: PatientStatus;
  assignedDoctor?: string;
  tags: PatientTag[];
  vitals: {
    temperature: number;
    heartRate: number;
    bloodPressure: string;
    respiratoryRate: number;
    oxygenSaturation: number;
  };
  vitalHistory?: VitalReading[];
  symptoms: string[];
  notes: MedicalNote[];
  arrivalTime: string;
  lastUpdate: string;
  collaborators: string[];
}

export interface VitalReading {
  timestamp: string;
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  oxygenSaturation: number;
}

export interface MedicalNote {
  id: string;
  doctorName: string;
  timestamp: string;
  content: string;
  type: 'admission' | 'progress' | 'consultation' | 'discharge';
}

export type FilterType = 'all' | 'my-patients' | 'unassigned' | 'critical';
