/**
 * Nurse Entity - Domain Model
 * 
 * Extiende User con información específica de enfermeros.
 * Mantiene área de trabajo y turnos.
 */

import { User, UserProps, UserRole, UserStatus } from './User';

export enum NurseArea {
  TRIAGE = 'triage',
  EMERGENCY = 'emergency',
  ICU = 'icu',
  GENERAL_WARD = 'general_ward',
  PEDIATRICS = 'pediatrics',
  SURGERY = 'surgery',
  OTHER = 'other',
}

export interface NurseProps extends UserProps {
  area: NurseArea;
  shift: 'morning' | 'afternoon' | 'night';
  licenseNumber: string;
}

/**
 * Nurse Entity
 * 
 * SOLID Principles:
 * - LSP: Puede sustituir a User
 * - SRP: Solo maneja lógica de enfermeros
 */
export class Nurse extends User {
  private constructor(
    userProps: UserProps,
    private readonly nurseProps: Omit<NurseProps, keyof UserProps>
  ) {
    super(userProps);
    this.validateNurse();
  }

  /**
   * Factory method para crear enfermero
   */
  static createNurse(params: Omit<NurseProps, 'id' | 'createdAt' | 'updatedAt' | 'role'>): Nurse {
    const id = `nurse-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const now = new Date();

    const userProps: UserProps = {
      id,
      email: params.email,
      name: params.name,
      role: UserRole.NURSE,
      status: UserStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    };

    const nurseProps = {
      area: params.area,
      shift: params.shift,
      licenseNumber: params.licenseNumber,
    };

    return new Nurse(userProps, nurseProps);
  }

  /**
   * Reconstruct from persistence
   */
  static fromPersistence(props: NurseProps): Nurse {
    const { id, email, name, role, status, createdAt, updatedAt, ...nurseSpecific } = props;
    
    const userProps: UserProps = {
      id,
      email,
      name,
      role,
      status,
      createdAt,
      updatedAt,
    };

    return new Nurse(userProps, nurseSpecific);
  }

  /**
   * Domain validation specific to nurses
   */
  private validateNurse(): void {
    if (!this.nurseProps.area || !Object.values(NurseArea).includes(this.nurseProps.area)) {
      throw new Error(`Invalid area: ${this.nurseProps.area}`);
    }

    if (!this.nurseProps.licenseNumber || this.nurseProps.licenseNumber.trim().length < 5) {
      throw new Error('License number must be at least 5 characters');
    }

    const validShifts = ['morning', 'afternoon', 'night'];
    if (!validShifts.includes(this.nurseProps.shift)) {
      throw new Error(`Invalid shift: ${this.nurseProps.shift}`);
    }
  }

  // Nurse-specific getters
  get area(): NurseArea {
    return this.nurseProps.area;
  }

  get shift(): string {
    return this.nurseProps.shift;
  }

  get licenseNumber(): string {
    return this.nurseProps.licenseNumber;
  }

  /**
   * Business methods
   */
  
  /**
   * Update nurse area
   */
  updateArea(area: NurseArea): void {
    if (!Object.values(NurseArea).includes(area)) {
      throw new Error(`Invalid area: ${area}`);
    }
    this.nurseProps.area = area;
    (this.props as any).updatedAt = new Date();
  }

  /**
   * Update shift
   */
  updateShift(shift: 'morning' | 'afternoon' | 'night'): void {
    this.nurseProps.shift = shift;
    (this.props as any).updatedAt = new Date();
  }

  /**
   * Check if nurse is in triage area
   */
  isInTriage(): boolean {
    return this.nurseProps.area === NurseArea.TRIAGE;
  }

  /**
   * Serialization
   */
  toJSON(): NurseProps {
    return {
      ...this.props,
      ...this.nurseProps,
    };
  }
}
