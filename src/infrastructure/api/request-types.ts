/**
 * Request Body Type Definitions for API Routes
 * Used to avoid 'any' types on req.body access
 */

import { VitalSigns, PatientPriority, PatientStatus } from '../../domain/entities/Patient';
import { CommentType } from '../../domain/entities/PatientComment';
import { UserRole, UserStatus } from '../../domain/entities/User';

export interface RegisterPatientBody {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms: string[];
  vitals: VitalSigns;
  priority?: PatientPriority; // Prioridad enviada desde frontend
  manualPriority?: PatientPriority; // Prioridad manual asignada por enfermero
  assignedNurseId?: string;
  registeredBy?: string;
}

export interface UpdatePatientBody {
  vitals?: VitalSigns;
  manualPriority?: PatientPriority;
  status?: PatientStatus;
  process?: string; // PatientProcess as string
  processDetails?: string;
}

export interface AssignDoctorBody {
  doctorId: string;
  comment?: string; // HUMAN REVIEW: Comentario opcional al tomar caso
}

export interface UpdateProcessBody {
  process: string; // PatientProcess as string
  processDetails?: string; // Detalles adicionales (ej: días de hospitalización, clínica de remisión)
}

export interface AddCommentBody {
  content: string;
  authorId: string; // HUMAN REVIEW: Agregar authorId que es requerido por el backend
  type?: CommentType; // HUMAN REVIEW: Hacer opcional con valor por defecto
}

export interface CreateUserBody {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  specialty?: string;
  licenseNumber?: string;
  maxPatientLoad?: number;
  area?: string;
  shift?: string;
}

export interface UpdateUserBody {
  role?: UserRole;
  status?: UserStatus;
}

export interface UpdateUserProfileBody {
  name?: string;
  email?: string;
  password?: string;
}
