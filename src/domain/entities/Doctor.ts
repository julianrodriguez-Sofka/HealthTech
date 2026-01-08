/**
 * Doctor Entity - Domain Model
 *
 * Extiende User con información específica de médicos.
 * Mantiene especialización y disponibilidad.
 *
 * HUMAN REVIEW: Considerar agregar turnos, horarios, máximo de pacientes
 */

import { User, UserProps, UserRole, UserStatus } from './User';

export enum MedicalSpecialty {
  GENERAL_MEDICINE = 'general_medicine',
  EMERGENCY_MEDICINE = 'emergency_medicine',
  CARDIOLOGY = 'cardiology',
  NEUROLOGY = 'neurology',
  PEDIATRICS = 'pediatrics',
  SURGERY = 'surgery',
  INTERNAL_MEDICINE = 'internal_medicine',
  TRAUMATOLOGY = 'traumatology',
  INTENSIVE_CARE = 'intensive_care',
  OTHER = 'other',
}

export interface DoctorProps extends UserProps {
  specialty: MedicalSpecialty;
  licenseNumber: string;
  isAvailable: boolean;
  currentPatientLoad: number;
  maxPatientLoad: number;
}

/**
 * Doctor Entity
 *
 * SOLID Principles:
 * - LSP: Puede sustituir a User sin romper funcionalidad
 * - ISP: No depende de métodos que no usa
 */
export class Doctor extends User {
  private constructor(
    userProps: UserProps,
    private readonly doctorProps: Omit<DoctorProps, keyof UserProps>
  ) {
    super(userProps);
    this.validateDoctor();
  }

  /**
   * Factory method para crear doctor
   */
  static createDoctor(params: Omit<DoctorProps, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'currentPatientLoad'>): Doctor {
    const id = `doctor-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date();

    const userProps: UserProps = {
      id,
      email: params.email,
      name: params.name,
      role: UserRole.DOCTOR,
      status: params.status ?? UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    const doctorProps = {
      specialty: params.specialty,
      licenseNumber: params.licenseNumber,
      isAvailable: params.isAvailable ?? true,
      currentPatientLoad: 0,
      maxPatientLoad: params.maxPatientLoad !== undefined ? params.maxPatientLoad : 10,
    };

    return new Doctor(userProps, doctorProps);
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: DoctorProps): Doctor {
    const { id, email, name, role, status, createdAt, updatedAt, ...doctorSpecific } = props;

    const userProps: UserProps = {
      id,
      email,
      name,
      role,
      status,
      createdAt,
      updatedAt,
    };

    return new Doctor(userProps, doctorSpecific);
  }

  /**
   * Domain validation specific to doctors
   */
  private validateDoctor(): void {
    if (!this.doctorProps.specialty || !Object.values(MedicalSpecialty).includes(this.doctorProps.specialty)) {
      throw new Error(`Invalid specialty: ${this.doctorProps.specialty}`);
    }

    if (!this.doctorProps.licenseNumber || this.doctorProps.licenseNumber.trim().length < 5) {
      throw new Error('License number must be at least 5 characters');
    }

    if (this.doctorProps.maxPatientLoad < 1 || this.doctorProps.maxPatientLoad > 50) {
      throw new Error('Max patient load must be between 1 and 50');
    }

    if (this.doctorProps.currentPatientLoad < 0) {
      throw new Error('Current patient load cannot be negative');
    }
  }

  // Doctor-specific getters
  get specialty(): MedicalSpecialty {
    return this.doctorProps.specialty;
  }

  get licenseNumber(): string {
    return this.doctorProps.licenseNumber;
  }

  get isAvailable(): boolean {
    return this.doctorProps.isAvailable;
  }

  get currentPatientLoad(): number {
    return this.doctorProps.currentPatientLoad;
  }

  get maxPatientLoad(): number {
    return this.doctorProps.maxPatientLoad;
  }

  /**
   * Business methods
   */

  /**
   * Check if doctor can take more patients
   */
  canTakePatient(): boolean {
    return this.doctorProps.isAvailable &&
           this.props.status === UserStatus.ACTIVE &&
           this.doctorProps.currentPatientLoad < this.doctorProps.maxPatientLoad;
  }

  /**
   * Assign a patient to this doctor
   * HUMAN REVIEW: Consider emitting domain event for notification
   */
  assignPatient(): void {
    if (!this.canTakePatient()) {
      throw new Error('Doctor cannot take more patients');
    }
    this.doctorProps.currentPatientLoad += 1;
    this.props.updatedAt = new Date();
  }

  /**
   * Remove patient from doctor's load
   */
  releasePatient(): void {
    if (this.doctorProps.currentPatientLoad === 0) {
      throw new Error('Doctor has no patients to release');
    }
    this.doctorProps.currentPatientLoad -= 1;
    this.props.updatedAt = new Date();
  }

  /**
   * Toggle availability
   */
  toggleAvailability(): void {
    this.doctorProps.isAvailable = !this.doctorProps.isAvailable;
    this.props.updatedAt = new Date();
  }

  /**
   * Update specialty
   */
  updateSpecialty(specialty: MedicalSpecialty): void {
    if (!Object.values(MedicalSpecialty).includes(specialty)) {
      throw new Error(`Invalid specialty: ${specialty}`);
    }
    this.doctorProps.specialty = specialty;
    this.props.updatedAt = new Date();
  }

  /**
   * Serialization
   */
  toJSON(): DoctorProps {
    return {
      ...this.props,
      ...this.doctorProps,
    };
  }
}
