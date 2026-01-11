/**
 * Patient Entity - Domain Model
 *
 * Representa un paciente en el sistema de triaje.
 * Mantiene información vital, síntomas, prioridad y asignación.
 *
 * HUMAN REVIEW: Validar rangos de signos vitales según estándares médicos
 */

import { randomUUID } from 'crypto';
import { PatientComment } from './PatientComment';

export enum PatientPriority {
  P1 = 1, // Critical - Resuscitation (Rojo)
  P2 = 2, // Emergency (Naranja)
  P3 = 3, // Urgent (Amarillo)
  P4 = 4, // Semi-urgent (Verde)
  P5 = 5, // Non-urgent (Azul)
}

export enum PatientStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  UNDER_TREATMENT = 'under_treatment',
  STABILIZED = 'stabilized',
  DISCHARGED = 'discharged',
  TRANSFERRED = 'transferred',
}

/**
 * Patient Disposition/Process - Proceso asignado al paciente
 * HUMAN REVIEW: Representa la decisión médica sobre el destino del paciente
 */
export enum PatientProcess {
  NONE = 'none', // Sin proceso asignado aún
  DISCHARGE = 'discharge', // Dar de alta
  HOSPITALIZATION = 'hospitalization', // Hospitalización general
  HOSPITALIZATION_DAYS = 'hospitalization_days', // Hospitalización por X días
  ICU = 'icu', // Hospitalización UCI
  REFERRAL = 'referral', // Remitir a otra clínica
}

export interface VitalSigns {
  heartRate: number; // bpm
  bloodPressure: string; // systolic/diastolic
  temperature: number; // Celsius
  oxygenSaturation: number; // percentage
  respiratoryRate: number; // breaths per minute
  consciousnessLevel?: string;
  painLevel?: number; // 0-10 scale
}

export interface PatientProps {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms: string[];
  vitals: VitalSigns;
  priority: PatientPriority;
  manualPriority?: PatientPriority; // Override automático
  status: PatientStatus;
  process?: PatientProcess; // Proceso/disposición asignada al paciente (HUMAN REVIEW: Nueva funcionalidad)
  processDetails?: string; // Detalles adicionales del proceso (ej: días de hospitalización, clínica de remisión)
  assignedDoctorId?: string;
  assignedDoctorName?: string;
  assignedNurseId?: string;
  comments: PatientComment[];
  arrivalTime: Date;
  treatmentStartTime?: Date;
  dischargeTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Patient Entity
 *
 * SOLID Principles:
 * - SRP: Gestiona solo datos y reglas del paciente
 * - OCP: Extensible mediante agregación de comentarios
 */
export class Patient {
  private constructor(private readonly props: PatientProps) {
    this.validate();
  }

  /**
   * Factory method para crear paciente
   */
  static create(params: Omit<PatientProps, 'id' | 'status' | 'comments' | 'createdAt' | 'updatedAt'>): Patient {
    // SECURITY: Using crypto.randomUUID() instead of Math.random()
    const id = `patient-${Date.now()}-${randomUUID().substring(0, 8)}`;
    const now = new Date();

    return new Patient({
      ...params,
      id,
      status: PatientStatus.WAITING,
      comments: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: PatientProps): Patient {
    return new Patient(props);
  }

  /**
   * Domain validation
   */
  private validate(): void {
    if (!this.props.id || this.props.id.trim() === '') {
      throw new Error('Patient ID is required');
    }

    if (!this.props.name || this.props.name.trim().length < 2) {
      throw new Error('Patient name must be at least 2 characters');
    }

    if (this.props.age < 0 || this.props.age > 150) {
      throw new Error('Patient age must be between 0 and 150');
    }

    if (!['male', 'female', 'other'].includes(this.props.gender)) {
      throw new Error(`Invalid gender: ${this.props.gender}`);
    }

    if (!Array.isArray(this.props.symptoms) || this.props.symptoms.length === 0) {
      throw new Error('At least one symptom is required');
    }

    this.validateVitalSigns();
  }

  /**
   * Validate vital signs ranges
   */
  private validateVitalSigns(): void {
    const { vitals } = this.props;

    if (vitals.heartRate < 30 || vitals.heartRate > 250) {
      throw new Error('Heart rate must be between 30 and 250 bpm');
    }

    if (vitals.temperature < 32 || vitals.temperature > 45) {
      throw new Error('Temperature must be between 32 and 45 Celsius');
    }

    if (vitals.oxygenSaturation < 50 || vitals.oxygenSaturation > 100) {
      throw new Error('Oxygen saturation must be between 50 and 100%');
    }

    if (vitals.respiratoryRate < 5 || vitals.respiratoryRate > 60) {
      throw new Error('Respiratory rate must be between 5 and 60 breaths/min');
    }
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get age(): number {
    return this.props.age;
  }

  get gender(): string {
    return this.props.gender;
  }

  get symptoms(): string[] {
    return [...this.props.symptoms];
  }

  get vitals(): VitalSigns {
    return { ...this.props.vitals };
  }

  get priority(): PatientPriority {
    // Manual priority overrides automatic
    return this.props.manualPriority ?? this.props.priority;
  }

  get automaticPriority(): PatientPriority {
    return this.props.priority;
  }

  get manualPriority(): PatientPriority | undefined {
    return this.props.manualPriority;
  }

  get status(): PatientStatus {
    return this.props.status;
  }

  get assignedDoctorId(): string | undefined {
    return this.props.assignedDoctorId;
  }

  get assignedDoctorName(): string | undefined {
    return this.props.assignedDoctorName;
  }

  get comments(): PatientComment[] {
    return [...this.props.comments];
  }

  get arrivalTime(): Date {
    return this.props.arrivalTime;
  }

  get treatmentStartTime(): Date | undefined {
    return this.props.treatmentStartTime;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get process(): PatientProcess | undefined {
    return this.props.process;
  }

  get processDetails(): string | undefined {
    return this.props.processDetails;
  }

  /**
   * Business methods
   */

  /**
   * Check if patient is critical (P1 or P2)
   */
  isCritical(): boolean {
    return this.priority === PatientPriority.P1 || this.priority === PatientPriority.P2;
  }

  /**
   * Check if patient is assigned to a doctor
   */
  isAssigned(): boolean {
    return !!this.props.assignedDoctorId;
  }

  /**
   * Assign doctor to patient
   * HUMAN REVIEW: Consider emitting domain event for notifications
   */
  assignDoctor(doctorId: string, doctorName: string): void {
    if (this.props.assignedDoctorId) {
      throw new Error('Patient is already assigned to a doctor');
    }

    this.props.assignedDoctorId = doctorId;
    this.props.assignedDoctorName = doctorName;
    this.props.status = PatientStatus.IN_PROGRESS;
    this.props.treatmentStartTime = new Date();
    this.props.updatedAt = new Date();
  }

  /**
   * Reassign patient to different doctor
   */
  reassignDoctor(doctorId: string, doctorName: string): void {
    this.props.assignedDoctorId = doctorId;
    this.props.assignedDoctorName = doctorName;
    this.props.updatedAt = new Date();
  }

  /**
   * Update patient status
   */
  updateStatus(newStatus: PatientStatus): void {
    if (!Object.values(PatientStatus).includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    this.props.status = newStatus;
    this.props.updatedAt = new Date();

    // Set discharge time when discharged
    if (newStatus === PatientStatus.DISCHARGED && !this.props.dischargeTime) {
      this.props.dischargeTime = new Date();
    }

    // HUMAN REVIEW: Consider emitting StatusChangedEvent for audit
    return;
  }

  /**
   * Set manual priority (override automatic calculation)
   */
  setManualPriority(priority: PatientPriority): void {
    if (!Object.values(PatientPriority).includes(priority)) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    this.props.manualPriority = priority;
    this.props.updatedAt = new Date();
  }

  /**
   * Clear manual priority (use automatic)
   */
  clearManualPriority(): void {
    this.props.manualPriority = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Add comment to patient
   */
  addComment(comment: PatientComment): void {
    if (comment.patientId !== this.props.id) {
      throw new Error('Comment patient ID does not match');
    }

    this.props.comments.push(comment);
    this.props.updatedAt = new Date();
  }

  /**
   * Get waiting time in minutes
   */
  getWaitingTime(): number {
    const now = new Date();
    const diffMs = now.getTime() - this.props.arrivalTime.getTime();
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * Update vital signs
   */
  updateVitals(newVitals: Partial<VitalSigns>): void {
    this.props.vitals = {
      ...this.props.vitals,
      ...newVitals,
    };
    this.validateVitalSigns();
    this.props.updatedAt = new Date();
  }

  /**
   * Set patient process/disposition
   * HUMAN REVIEW: Nueva funcionalidad para asignar proceso al paciente
   * Permite: dar de alta, hospitalizar, remitir, UCI, etc.
   */
  setProcess(process: PatientProcess, details?: string): void {
    if (!Object.values(PatientProcess).includes(process)) {
      throw new Error(`Invalid process: ${process}`);
    }

    this.props.process = process;
    this.props.processDetails = details;
    this.props.updatedAt = new Date();

    // Auto-update status based on process
    if (process === PatientProcess.DISCHARGE) {
      this.props.status = PatientStatus.DISCHARGED;
      if (!this.props.dischargeTime) {
        this.props.dischargeTime = new Date();
      }
    } else if (process === PatientProcess.ICU || process === PatientProcess.HOSPITALIZATION || process === PatientProcess.HOSPITALIZATION_DAYS) {
      this.props.status = PatientStatus.UNDER_TREATMENT;
    } else if (process === PatientProcess.REFERRAL) {
      this.props.status = PatientStatus.TRANSFERRED;
    }
  }

  /**
   * Clear patient process
   * HUMAN REVIEW: Limpiar proceso del paciente (volver a 'none')
   */
  clearProcess(): void {
    this.props.process = PatientProcess.NONE;
    this.props.processDetails = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Serialization
   */
  toJSON(): PatientProps {
    return {
      ...this.props,
    };
  }
}

