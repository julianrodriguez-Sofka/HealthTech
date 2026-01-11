// Type definitions for the HealthTech application
// HUMAN REVIEW: Types must match backend entities exactly

// HUMAN REVIEW: Convertir UserRole a enum para poder usarlo como valor en tiempo de ejecución
export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  NURSE = 'nurse'
}

// HUMAN REVIEW: Convertir TriageLevel a enum para poder usarlo como valor y como tipo
export enum TriageLevel {
  CRITICAL = 1,
  HIGH = 2,
  MODERATE = 3,
  LOW = 4,
  NON_URGENT = 5
}

// HUMAN REVIEW: Mantener alias de tipo para compatibilidad
export type TriageLevelValue = 1 | 2 | 3 | 4 | 5;

export enum TriagePriority {
  CRITICAL = 1,
  EMERGENCY = 2,
  URGENT = 3,
  SEMI_URGENT = 4,
  NON_URGENT = 5
}

export enum PatientStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_TREATMENT = 'UNDER_TREATMENT',
  STABILIZED = 'STABILIZED',
  DISCHARGED = 'DISCHARGED',
  TRANSFERRED = 'TRANSFERRED',
  COMPLETED = 'COMPLETED'
}

export interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  respiratoryRate: number;
  oxygenSaturation: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'OTHER';
  identificationNumber: string;
  address?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  symptoms: string;
  vitalSigns: VitalSigns;
  priority: TriageLevelValue; // HUMAN REVIEW: Prioridad como valor numérico 1-5, no como enum
  status: PatientStatus;
  process?: 'none' | 'discharge' | 'hospitalization' | 'hospitalization_days' | 'icu' | 'referral'; // HUMAN REVIEW: Proceso/disposición del paciente
  processDetails?: string; // Detalles adicionales del proceso (ej: días de hospitalización, clínica de remisión)
  doctorId?: string;
  doctorName?: string;
  nurseId?: string;
  nurseName?: string;
  arrivalTime: string;
  assignedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientComment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  content: string;
  createdAt: string;
}

// API Request/Response Types
export interface CreatePatientRequest {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'OTHER';
  identificationNumber: string;
  address?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  symptoms: string;
  vitalSigns: VitalSigns;
  priority: TriageLevelValue; // HUMAN REVIEW: Prioridad como valor numérico 1-5
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  specialization?: string;
}

export interface AddCommentRequest {
  patientId: string;
  doctorId: string;
  content: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  specialization?: string;
  specialty?: string; // HUMAN REVIEW: Agregar specialty (alias de specialization)
  area?: string; // HUMAN REVIEW: Agregar área para enfermeras
  phone?: string; // HUMAN REVIEW: Agregar teléfono para usuarios
  avatar?: string; // HUMAN REVIEW: Agregar avatar (opcional)
}

export interface TriageEvent {
  type: 'patient_registered' | 'patient_updated' | 'priority_changed';
  patientId: string;
  patientName: string;
  priority: TriageLevelValue;
  timestamp: string;
  symptoms?: string[];
  patient?: Patient; // HUMAN REVIEW: Agregar patient completo para compatibilidad
}

// HUMAN REVIEW: Agregar tipos faltantes para autenticación
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
