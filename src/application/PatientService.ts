/**
 * Patient Service - Application Layer
 *
 * Servicio de aplicación para gestionar el registro de pacientes.
 * Este servicio orquesta las operaciones relacionadas con pacientes
 * y aplica reglas de validación de negocio.
 *
 * HUMAN REVIEW: Refactorizado para usar inyección de dependencias y Result Pattern.
 * Ahora cumple con SOLID: DIP (depende de interfaces), SRP (solo validación de negocio).
 */

import { Result } from '@shared/Result';
import type { IPatientRepository, PatientData } from '@domain/repositories';
import type { IIdGenerator } from './interfaces';
import {
  PatientValidationError,
  InvalidAgeError,
  DuplicatePatientError
} from '@domain/errors';

/**
 * Datos requeridos para registrar un paciente
 */
export interface PatientRegistrationData {
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: string;
  documentId?: string;
}

/**
 * Resultado del registro de un paciente
 */
export interface RegisteredPatient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: string;
  documentId?: string;
  registeredAt: Date;
}

/**
 * Patient Service
 *
 * Implementa la lógica de negocio para el registro y gestión de pacientes.
 * Sigue el principio de Single Responsibility: solo maneja validación de negocio
 * y orquestación, delegando persistencia a repositories.
 *
 * HUMAN REVIEW: Ahora usa inyección de dependencias y Result Pattern
 * para ser 100% testeable y seguir Clean Architecture.
 */
export class PatientService {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly idGenerator: IIdGenerator
  ) {}

  /**
   * Registra un nuevo paciente en el sistema
   *
   * @param data - Datos del paciente a registrar
   * @returns Result con el paciente registrado o error de validación
   *
   * HUMAN REVIEW: Ahora retorna Result<T> en lugar de lanzar excepciones,
   * permitiendo mejor composición y manejo de errores.
   */
  public async register(
    data: PatientRegistrationData
  ): Promise<Result<RegisteredPatient, PatientValidationError | InvalidAgeError | DuplicatePatientError>> {
    // HUMAN REVIEW: Validar campos requeridos
    const validationResult = this.validateRegistrationData(data);
    if (validationResult.isFailure) {
      return Result.fail(validationResult.error);
    }

    // HUMAN REVIEW: Validar edad del paciente
    const ageValidationResult = this.validateAge(data.birthDate);
    if (ageValidationResult.isFailure) {
      return Result.fail(ageValidationResult.error);
    }

    // HUMAN REVIEW: Generar ID único
    const id = this.idGenerator.generate();
    const registeredAt = new Date();

    // HUMAN REVIEW: Crear objeto de paciente
    const patient: PatientData = {
      id,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      birthDate: data.birthDate,
      gender: data.gender.trim(),
      documentId: data.documentId?.trim(),
      registeredAt
    };

    // HUMAN REVIEW: Persistir en repositorio
    const saveResult = await this.patientRepository.save(patient);
    if (saveResult.isFailure) {
      return Result.fail(saveResult.error);
    }

    // HUMAN REVIEW: Mapear a DTO de respuesta
    const registeredPatient: RegisteredPatient = {
      id: saveResult.value.id,
      firstName: saveResult.value.firstName,
      lastName: saveResult.value.lastName,
      birthDate: saveResult.value.birthDate,
      gender: saveResult.value.gender,
      documentId: saveResult.value.documentId,
      registeredAt: saveResult.value.registeredAt
    };

    return Result.ok(registeredPatient);
  }

  /**
   * Valida los datos de registro del paciente
   *
   * HUMAN REVIEW: Separado en método privado para mantener SRP
   */
  private validateRegistrationData(
    data: PatientRegistrationData
  ): Result<void, PatientValidationError> {
    if (!data.firstName || !data.firstName.trim()) {
      return Result.fail(
        new PatientValidationError('firstName', 'FIRST_NAME_REQUIRED', 'First name is required')
      );
    }

    if (!data.lastName || !data.lastName.trim()) {
      return Result.fail(
        new PatientValidationError('lastName', 'LAST_NAME_REQUIRED', 'Last name is required')
      );
    }

    if (!data.birthDate) {
      return Result.fail(
        new PatientValidationError('birthDate', 'BIRTH_DATE_REQUIRED', 'Birth date is required')
      );
    }

    if (!data.gender || !data.gender.trim()) {
      return Result.fail(
        new PatientValidationError('gender', 'GENDER_REQUIRED', 'Gender is required')
      );
    }

    // HUMAN REVIEW: Validar que birthDate sea un objeto Date válido
    if (!(data.birthDate instanceof Date) || isNaN(data.birthDate.getTime())) {
      return Result.fail(
        new PatientValidationError(
          'birthDate',
          'INVALID_BIRTH_DATE_FORMAT',
          'Invalid birth date format'
        )
      );
    }

    return Result.ok(undefined);
  }

  /**
   * Valida la edad del paciente
   *
   * HUMAN REVIEW: Validación de reglas de negocio para fecha de nacimiento
   */
  private validateAge(birthDate: Date): Result<void, InvalidAgeError> {
    // HUMAN REVIEW: Validación de negocio - fecha de nacimiento no puede ser futura
    const currentDate = new Date();
    if (birthDate > currentDate) {
      return Result.fail(
        new InvalidAgeError(birthDate, 'Birth date cannot be in the future')
      );
    }

    // HUMAN REVIEW: Validar edad máxima razonable (150 años)
    const minDate = new Date();
    minDate.setFullYear(currentDate.getFullYear() - 150);
    if (birthDate < minDate) {
      return Result.fail(
        new InvalidAgeError(
          birthDate,
          'Birth date indicates age over 150 years, which is not biologically possible'
        )
      );
    }

    return Result.ok(undefined);
  }
}
