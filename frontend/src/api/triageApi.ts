/**
 * Triage API Service
 * 
 * Servicio para interactuar con los endpoints de triaje del backend.
 * Implementa todas las operaciones CRUD de pacientes y triaje.
 */

import apiClient, { ApiError } from './client';

/**
 * Tipos de datos para el API de triaje
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

export interface TriageResult {
  patientId: string;
  priority: number;
  justification: string;
  estimatedWaitTime: number;
  criticalFactors: string[];
}

export interface CreatePatientRequest {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms: string[];
  vitals: VitalSigns;
}

/**
 * API Service para Triaje
 */
export const triageApi = {
  /**
   * Obtiene todos los pacientes en espera
   */
  async getPatients(): Promise<Patient[]> {
    try {
      const response = await apiClient.get<Patient[]>('/patients');
      return response.data;
    } catch (error) {
      console.error('[TriageAPI] Error fetching patients:', error);
      throw error;
    }
  },

  /**
   * Obtiene un paciente específico por ID
   */
  async getPatientById(id: string): Promise<Patient> {
    try {
      const response = await apiClient.get<Patient>(`/patients/${id}`);
      return response.data;
    } catch (error) {
      console.error('[TriageAPI] Error fetching patient:', error);
      throw error;
    }
  },

  /**
   * Registra un nuevo paciente y realiza triaje automático
   */
  async createPatient(data: CreatePatientRequest): Promise<Patient> {
    try {
      // HUMAN REVIEW: El backend debe validar con Zod middleware
      const response = await apiClient.post<Patient>('/patients', data);
      return response.data;
    } catch (error) {
      console.error('[TriageAPI] Error creating patient:', error);
      throw error;
    }
  },

  /**
   * Registra signos vitales (US-002)
   */
  async registerVitals(patientId: string, vitals: VitalSigns): Promise<void> {
    try {
      await apiClient.post('/vitals', {
        patientId,
        ...vitals,
      });
    } catch (error) {
      console.error('[TriageAPI] Error registering vitals:', error);
      throw error;
    }
  },

  /**
   * Procesa triaje para un paciente
   */
  async processTriage(patientId: string): Promise<TriageResult> {
    try {
      const response = await apiClient.post<TriageResult>('/triage/process', {
        patientId,
      });
      return response.data;
    } catch (error) {
      console.error('[TriageAPI] Error processing triage:', error);
      throw error;
    }
  },

  /**
   * Actualiza el estado de un paciente
   */
  async updatePatientStatus(
    patientId: string,
    status: Patient['status']
  ): Promise<Patient> {
    try {
      const response = await apiClient.patch<Patient>(`/patients/${patientId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error('[TriageAPI] Error updating patient status:', error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas del dashboard
   */
  async getStatistics(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/triage/statistics');
      return response.data;
    } catch (error) {
      console.error('[TriageAPI] Error fetching statistics:', error);
      // Retornar estadísticas vacías si falla
      return {
        totalPatients: 0,
        criticalPatients: 0,
        averageWaitTime: 0,
        patientsPerPriority: [0, 0, 0, 0, 0],
      };
    }
  },
};

export interface DashboardStats {
  totalPatients: number;
  criticalPatients: number;
  averageWaitTime: number;
  patientsPerPriority: number[];
}

export type { ApiError };
