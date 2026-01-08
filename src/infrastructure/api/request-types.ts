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
  assignedNurseId?: string;
}

export interface UpdatePatientBody {
  vitals?: VitalSigns;
  manualPriority?: PatientPriority;
  status?: PatientStatus;
}

export interface AddCommentBody {
  content: string;
  type: CommentType;
}

export interface CreateUserBody {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  specialty?: string;
  licenseNumber?: string;
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
