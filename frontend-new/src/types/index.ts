// User and Authentication Types
export enum UserRole {
  NURSE = 'NURSE',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  specialization?: string;
  specialty?: string; // Backend devuelve 'specialty' para doctores
  area?: string; // Backend devuelve 'area' para enfermeras
  phone?: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  role: UserRole;
  password?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Patient Types
export enum TriageLevel {
  CRITICAL = 1,
  HIGH = 2,
  MODERATE = 3,
  LOW = 4,
  NON_URGENT = 5
}

export enum PatientStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
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
  priority: TriageLevel;
  status: PatientStatus;
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
  priority: TriageLevel;
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
  content: string;
  doctorId: string;
}

export interface AssignDoctorRequest {
  patientId: string;
  doctorId: string;
}

// WebSocket Event Types
export interface TriageEvent {
  type: 'critical-patient' | 'patient-updated' | 'patient-discharged';
  patient: Patient;
  timestamp: string;
}

// Statistics Types
export interface DashboardStats {
  totalPatients: number;
  criticalPatients: number;
  averageWaitTime: number;
  patientsToday: number;
}

export interface PriorityDistribution {
  priority: TriageLevel;
  count: number;
  percentage: number;
}
