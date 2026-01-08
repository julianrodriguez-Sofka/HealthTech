/**
 * Register Patient Use Case - Application Layer
 *
 * Caso de uso para registrar un nuevo paciente en el sistema de triage.
 * REQUISITO HU.md US-001: "Registrar nuevo paciente con síntomas y asignar prioridad"
 *
 * HUMAN REVIEW: Este es el use case principal que orquesta:
 * 1. Validación de datos del paciente y signos vitales
 * 2. Cálculo automático de prioridad usando TriageEngine
 * 3. Persistencia del paciente y signos vitales
 * 4. Notificación a médicos usando el patrón Observer
 *
 * SOLID Principles:
 * - SRP: Solo responsable de orquestar el registro de pacientes
 * - OCP: Extensible mediante dependency injection
 * - DIP: Depende de interfaces (IPatientRepository, IVitalsRepository), no implementaciones
 */

import { IPatientRepository, PatientData } from '@domain/repositories/IPatientRepository';
import { IVitalsRepository, VitalsData } from '@domain/repositories/IVitalsRepository';
import { TriageEngine } from '@domain/TriageEngine';
import { IObservable } from '@domain/observers/IObserver';
import { TriageEvent, createPatientRegisteredEvent } from '@domain/observers/TriageEvents';
import { Patient, PatientPriority, PatientStatus, VitalSigns } from '@domain/entities/Patient';
import { Result } from '@shared/Result';
import { Logger } from '@shared/Logger';

/**
 * DTO de entrada para el use case
 */
export interface RegisterPatientInput {
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  documentId?: string;
  symptoms: string[];
  vitals: {
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
    bloodPressure: string;
    respiratoryRate: number;
    consciousnessLevel?: string;
    painLevel?: number;
  };
  registeredBy: string; // nurseId
  manualPriority?: number; // Prioridad asignada manualmente por enfermero (1-5)
}

/**
 * DTO de salida del use case
 */
export interface RegisterPatientOutput {
  id: string;
  firstName: string;
  lastName: string;
  priority: PatientPriority;
  registeredAt: Date;
}

/**
 * Use Case: Registrar paciente
 *
 * HUMAN REVIEW: Este use case implementa el flujo completo descrito en HU.md:
 * "Un Enfermero ingresa la información del paciente, incluyendo sus síntomas vitales.
 * El sistema asigna un nivel de prioridad al paciente (1-5) basándose en la gravedad.
 * Una vez registrado, el sistema envía una alerta a todos los Médicos disponibles."
 */
export class RegisterPatientUseCase {
  private logger: Logger;

  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly vitalsRepository: IVitalsRepository,
    private readonly eventBus: IObservable<TriageEvent>
  ) {
    this.logger = Logger.getInstance();
  }

  /**
   * Ejecuta el caso de uso de registro de paciente
   *
   * @param input - Datos del paciente a registrar
   * @returns Result con los datos del paciente registrado o error
   *
   * HUMAN REVIEW: Este método debe completarse en <5 segundos según requisitos
   * de experiencia de usuario. Optimizar queries de base de datos en producción.
   */
  async execute(input: RegisterPatientInput): Promise<Result<RegisterPatientOutput, Error>> {
    try {
      // STEP 1: Validar datos de entrada
      const validationError = this.validateInput(input);
      if (validationError) {
        return Result.fail(validationError);
      }

      // STEP 2: Determinar prioridad
      // HUMAN REVIEW: REQUISITO HU.md US-003 - El enfermero puede asignar prioridad manualmente
      // Si se proporciona manualPriority, usarlo; de lo contrario calcular automáticamente
      let priority: PatientPriority;
      
      if (input.manualPriority !== undefined && input.manualPriority >= 1 && input.manualPriority <= 5) {
        // Prioridad asignada manualmente por enfermero
        priority = input.manualPriority as PatientPriority;
        this.logger.info('Manual priority assigned by nurse', {
          priority,
          manualPriority: input.manualPriority
        });
      } else {
        // Calcular prioridad automáticamente usando TriageEngine
        priority = TriageEngine.calculatePriority({
          heartRate: input.vitals.heartRate,
          temperature: input.vitals.temperature,
          oxygenSaturation: input.vitals.oxygenSaturation,
        });
        
        this.logger.info('Triage priority calculated automatically', {
          priority,
          heartRate: input.vitals.heartRate,
          temperature: input.vitals.temperature,
          oxygenSaturation: input.vitals.oxygenSaturation,
        });
      }

      // STEP 3: Crear registro de paciente
      const patientId = this.generatePatientId();
      const birthDate = this.calculateBirthDate(input.age);

      const patientData: PatientData = {
        id: patientId,
        firstName: input.firstName,
        lastName: input.lastName,
        birthDate,
        gender: this.mapGender(input.gender),
        documentId: input.documentId,
        registeredAt: new Date(),
      };

      // STEP 4: Guardar paciente (legacy PatientData para compatibilidad)
      const savePatientResult = await this.patientRepository.save(patientData);
      if (savePatientResult.isFailure) {
        this.logger.error(`Failed to save patient: ${savePatientResult.error?.message || 'Unknown error'}`);
        return Result.fail(savePatientResult.error);
      }

      // STEP 4.5: Crear y guardar entidad Patient completa (HUMAN REVIEW: Necesario para que listPatients funcione correctamente)
      const now = new Date();
      const patientEntity = Patient.fromPersistence({
        id: patientId, // Usar el mismo ID que PatientData
        name: `${input.firstName} ${input.lastName}`,
        age: input.age,
        gender: input.gender,
        symptoms: input.symptoms,
        vitals: {
          heartRate: input.vitals.heartRate,
          bloodPressure: input.vitals.bloodPressure,
          temperature: input.vitals.temperature,
          oxygenSaturation: input.vitals.oxygenSaturation,
          respiratoryRate: input.vitals.respiratoryRate,
          consciousnessLevel: input.vitals.consciousnessLevel,
          painLevel: input.vitals.painLevel
        },
        priority: priority,
        manualPriority: input.manualPriority ? (input.manualPriority as PatientPriority) : undefined,
        status: PatientStatus.WAITING,
        comments: [],
        arrivalTime: now,
        createdAt: now,
        updatedAt: now
      });
      
      // Guardar entidad Patient completa
      await this.patientRepository.saveEntity(patientEntity);

      // STEP 5: Guardar signos vitales
      const vitalsId = this.generateVitalsId();
      const vitalsData: VitalsData = {
        id: vitalsId,
        patientId,
        heartRate: input.vitals.heartRate,
        temperature: input.vitals.temperature,
        oxygenSaturation: input.vitals.oxygenSaturation,
        systolicBP: this.extractSystolicBP(input.vitals.bloodPressure),
        isAbnormal: this.isVitalsAbnormal(input.vitals),
        isCritical: priority <= PatientPriority.P2,
        recordedAt: new Date(),
      };

      const saveVitalsResult = await this.vitalsRepository.save(vitalsData);
      if (saveVitalsResult.isFailure) {
        this.logger.error(`Failed to save vitals: ${saveVitalsResult.error?.message || 'Unknown error'}`);
        // HUMAN REVIEW: En producción, considerar rollback del paciente si fallan los vitales
      }

      // STEP 6: Notificar a médicos usando patrón Observer
      // REQUISITO OBLIGATORIO HU.md: "el sistema envía una alerta de 'Nuevo paciente'"
      try {
        const event = createPatientRegisteredEvent(
          patientId,
          `${input.firstName} ${input.lastName}`,
          priority,
          input.symptoms,
          input.registeredBy
        );

        await this.eventBus.notify(event);
        this.logger.info('Doctors notified about new patient', { patientId, priority });
      } catch (notificationError) {
        // HUMAN REVIEW: NO fallar el registro si falla la notificación
        // Registrar el error pero continuar
        this.logger.error(`Failed to notify doctors (non-blocking): ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`);
      }

      // STEP 7: Retornar resultado exitoso
      const output: RegisterPatientOutput = {
        id: patientId,
        firstName: input.firstName,
        lastName: input.lastName,
        priority,
        registeredAt: patientData.registeredAt,
      };

      this.logger.info('Patient registered successfully', {
        patientId,
        priority,
        registeredBy: input.registeredBy,
      });

      return Result.ok(output);

    } catch (error) {
      // HUMAN REVIEW: Catch-all para errores inesperados
      this.logger.error(`Unexpected error in RegisterPatientUseCase: ${error instanceof Error ? error.message : String(error)}`);
      return Result.fail(new Error(`Failed to register patient: ${error}`));
    }
  }

  /**
   * Valida los datos de entrada del paciente
   * HUMAN REVIEW: Agregar más validaciones según requisitos de negocio
   */
  private validateInput(input: RegisterPatientInput): Error | null {
    // Validar nombre
    if (!input.firstName || input.firstName.trim() === '') {
      return new Error('firstName is required and cannot be empty');
    }

    if (!input.lastName || input.lastName.trim() === '') {
      return new Error('lastName is required and cannot be empty');
    }

    // Validar edad
    if (input.age < 0 || input.age > 150) {
      return new Error('age must be between 0 and 150');
    }

    // Validar síntomas
    if (!input.symptoms || input.symptoms.length === 0) {
      return new Error('symptoms are required - at least one symptom must be provided');
    }

    // Validar signos vitales
    const vitalsError = this.validateVitals(input.vitals);
    if (vitalsError) {
      return vitalsError;
    }

    return null;
  }

  /**
   * Valida los signos vitales
   * HUMAN REVIEW: Rangos basados en adultos promedio. Ajustar para pediatría/geriatría.
   */
  private validateVitals(vitals: RegisterPatientInput['vitals']): Error | null {
    // Frecuencia cardíaca (40-200 bpm - rango amplio para incluir atletas y emergencias)
    if (vitals.heartRate < 30 || vitals.heartRate > 250) {
      return new Error('heartRate must be between 30 and 250 bpm');
    }

    // Temperatura corporal (30-45°C - rango amplio para incluir hipotermia/fiebre severa)
    if (vitals.temperature < 30 || vitals.temperature > 45) {
      return new Error('temperature must be between 30 and 45°C');
    }

    // Saturación de oxígeno (50-100% - rango amplio para incluir casos críticos)
    if (vitals.oxygenSaturation < 50 || vitals.oxygenSaturation > 100) {
      return new Error('oxygenSaturation must be between 50 and 100%');
    }

    // Frecuencia respiratoria (5-60 rpm - rango amplio)
    if (vitals.respiratoryRate < 5 || vitals.respiratoryRate > 60) {
      return new Error('respiratoryRate must be between 5 and 60 breaths per minute');
    }

    return null;
  }

  /**
   * Determina si los signos vitales están anormales
   */
  private isVitalsAbnormal(vitals: RegisterPatientInput['vitals']): boolean {
    return (
      vitals.heartRate < 60 || vitals.heartRate > 100 ||
      vitals.temperature < 36 || vitals.temperature > 37.5 ||
      vitals.oxygenSaturation < 95 ||
      vitals.respiratoryRate < 12 || vitals.respiratoryRate > 20
    );
  }

  /**
   * Calcula fecha de nacimiento aproximada desde edad
   */
  private calculateBirthDate(age: number): Date {
    const today = new Date();
    const birthYear = today.getFullYear() - age;
    return new Date(birthYear, 0, 1); // Primer día del año
  }

  /**
   * Mapea género a formato de una letra
   */
  private mapGender(gender: 'male' | 'female' | 'other'): string {
    switch (gender) {
      case 'male':
        return 'M';
      case 'female':
        return 'F';
      default:
        return 'O';
    }
  }

  /**
   * Extrae presión sistólica de formato "120/80"
   */
  private extractSystolicBP(bloodPressure: string): number {
    const parts = bloodPressure.split('/');
    return parseInt(parts[0] || '120', 10) || 120;
  }

  /**
   * Genera ID único para paciente
   * HUMAN REVIEW: En producción, usar UUID v4 o estrategia de BD
   */
  private generatePatientId(): string {
    return `patient-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Genera ID único para registro de signos vitales
   */
  private generateVitalsId(): string {
    return `vitals-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
