import { Result } from '@shared/Result';
import type { IVitalsRepository, IPatientRepository } from '@domain/repositories';
import type { IIdGenerator } from '@application/interfaces';
import {
  VitalsValidationError,
  PhysiologicalLimitExceededError,
  MissingVitalsError,
  PatientNotFoundError
} from '@domain/errors';

/**
 * Vitals Service - Application Layer
 *
 * Servicio de aplicación para gestionar el registro de signos vitales.
 * Este servicio orquesta la captura y validación de datos vitales de pacientes,
 * aplicando reglas de negocio estrictas para garantizar la calidad de los datos.
 *
 * HUMAN REVIEW: Refactorizado siguiendo Clean Architecture:
 * 1. ✅ Inyección de dependencias vía constructor
 * 2. ✅ Usa Result Pattern para manejo de errores funcional
 * 3. ✅ Custom exceptions del dominio
 * 4. ✅ Métodos de instancia (no estáticos)
 */

/**
 * Interfaz que define los signos vitales básicos
 *
 * HUMAN REVIEW: Los rangos normales según estándares médicos:
 * - Frecuencia cardíaca: 60-100 bpm (adultos en reposo)
 * - Temperatura: 36.5-37.5°C (98.6°F promedio)
 * - Saturación de oxígeno: 95-100% (normal), <90% crítico
 * - Presión sistólica: 90-120 mmHg (normal), >180 crítico
 */
export interface IVitals {
  patientId: string;
  heartRate: number;        // Frecuencia cardíaca en bpm
  temperature: number;      // Temperatura en Celsius
  oxygenSaturation: number; // Saturación de oxígeno en %
  systolicBP: number;       // Presión arterial sistólica en mmHg
}

/**
 * Resultado del registro de signos vitales
 */
export interface RecordedVitals extends IVitals {
  id: string;
  recordedAt: Date;
  isAbnormal: boolean;      // Indica si algún valor está fuera de rango normal
  isCritical: boolean;      // Indica si algún valor requiere atención inmediata
}

/**
 * Rangos fisiológicos extremos para validación
 *
 * HUMAN REVIEW: Estos rangos representan límites biológicos extremos
 * más allá de los cuales los valores son físicamente imposibles o incompatibles con la vida.
 */
interface PhysiologicalLimits {
  heartRate: { min: number; max: number };
  temperature: { min: number; max: number };
  oxygenSaturation: { min: number; max: number };
  systolicBP: { min: number; max: number };
}

/**
 * Vitals Service
 *
 * Implementa la lógica de negocio para el registro y validación de signos vitales.
 * Sigue el principio de Single Responsibility: validación de datos fisiológicos.
 */
export class VitalsService {
  /**
   * Límites fisiológicos extremos basados en literatura médica
   *
   * HUMAN REVIEW: La IA omitió los límites superiores de seguridad biológica.
   * He refactorizado para incluir validaciones de rangos fisiológicos extremos
   * basándome en el protocolo médico del documento.
   */
  private readonly PHYSIOLOGICAL_LIMITS: PhysiologicalLimits = {
    heartRate: {
      min: 0,   // Mínimo absoluto
      max: 300  // Taquicardia extrema (límite teórico)
    },
    temperature: {
      min: 0,    // Hipotermia extrema
      max: 45    // Hipertermia incompatible con vida
    },
    oxygenSaturation: {
      min: 0,    // Mínimo absoluto
      max: 100   // Máximo fisiológico (100% de saturación)
    },
    systolicBP: {
      min: 0,    // Mínimo absoluto
      max: 300   // Crisis hipertensiva extrema
    }
  };

  constructor(
    private readonly vitalsRepository: IVitalsRepository,
    private readonly patientRepository: IPatientRepository,
    private readonly idGenerator: IIdGenerator
  ) {}

  /**
   * Registra signos vitales de un paciente
   *
   * HUMAN REVIEW: Refactorizado para usar Result Pattern y DI.
   * 1. ✅ Valida existencia del paciente antes de registrar
   * 2. ✅ Persiste en base de datos a través de IVitalsRepository
   * 3. ✅ Retorna Result<RecordedVitals, Error> sin lanzar excepciones
   * 4. ⏳ TODO: Notificar observers si los valores son críticos (Observer Pattern)
   */
  public async recordVitals(
    vitals: IVitals
  ): Promise<Result<RecordedVitals, VitalsValidationError | PatientNotFoundError | PhysiologicalLimitExceededError | MissingVitalsError>> {
    // HUMAN REVIEW: Validación 1 - Patient ID presente
    if (!vitals.patientId || !vitals.patientId.trim()) {
      return Result.fail(new MissingVitalsError('Patient ID is required'));
    }

    // HUMAN REVIEW: Validación 2 - Verificar que el paciente existe
    const patientResult = await this.patientRepository.findById(vitals.patientId);
    if (patientResult.isFailure) {
      // Convert generic Error to PatientNotFoundError
      return Result.fail(new PatientNotFoundError(vitals.patientId));
    }
    if (!patientResult.value) {
      return Result.fail(new PatientNotFoundError(vitals.patientId));
    }

    // HUMAN REVIEW: Validación 3 - Campos requeridos
    const requiredFieldsResult = this.validateRequiredFields(vitals);
    if (requiredFieldsResult.isFailure) {
      return Result.fail(requiredFieldsResult.error);
    }

    // HUMAN REVIEW: Validación 4 - Rangos fisiológicos
    const rangesResult = this.validateVitalsRanges(vitals);
    if (rangesResult.isFailure) {
      return Result.fail(rangesResult.error);
    }

    // HUMAN REVIEW: Determinar si los valores son anormales o críticos
    const isAbnormal = this.checkIfAbnormal(vitals);
    const isCritical = this.checkIfCritical(vitals);

    const vitalId = this.idGenerator.generate();
    const recordedAt = new Date();

    const recordedVitals: RecordedVitals = {
      id: vitalId,
      patientId: vitals.patientId,
      heartRate: vitals.heartRate,
      temperature: vitals.temperature,
      oxygenSaturation: vitals.oxygenSaturation,
      systolicBP: vitals.systolicBP,
      recordedAt,
      isAbnormal,
      isCritical
    };

    // HUMAN REVIEW: Persistir en base de datos
    const saveResult = await this.vitalsRepository.save({
      id: vitalId,
      patientId: vitals.patientId,
      heartRate: vitals.heartRate,
      temperature: vitals.temperature,
      oxygenSaturation: vitals.oxygenSaturation,
      systolicBP: vitals.systolicBP,
      isAbnormal,
      isCritical,
      recordedAt
    });

    if (saveResult.isFailure) {
      // HUMAN REVIEW: En caso de error de persistencia, retornar error genérico
      return Result.fail(new VitalsValidationError('save', 'PERSISTENCE_ERROR', 'Failed to save vitals to repository'));
    }

    // HUMAN REVIEW: TODO - Si isCritical es true, notificar observers
    // if (isCritical) {
    //   this.notifyObservers(new CriticalVitalsEvent(recordedVitals));
    // }

    return Result.ok(recordedVitals);
  }

  /**
   * Valida que todos los campos requeridos estén presentes
   *
   * HUMAN REVIEW: Separado en método privado para mantener SRP
   * y facilitar testing unitario de validaciones específicas
   */
  private validateRequiredFields(vitals: IVitals): Result<void, MissingVitalsError> {
    if (vitals.heartRate === undefined || vitals.heartRate === null) {
      return Result.fail(new MissingVitalsError('Heart rate is required'));
    }

    if (vitals.temperature === undefined || vitals.temperature === null) {
      return Result.fail(new MissingVitalsError('Temperature is required'));
    }

    if (vitals.oxygenSaturation === undefined || vitals.oxygenSaturation === null) {
      return Result.fail(new MissingVitalsError('Oxygen saturation is required'));
    }

    if (vitals.systolicBP === undefined || vitals.systolicBP === null) {
      return Result.fail(new MissingVitalsError('Systolic blood pressure is required'));
    }

    return Result.ok(undefined);
  }

  /**
   * Valida que los signos vitales estén dentro de rangos fisiológicos válidos
   *
   * HUMAN REVIEW: Método privado que centraliza la lógica de validación
   * de rangos para mantener el principio de Single Responsibility.
   */
  private validateVitalsRanges(vitals: IVitals): Result<void, VitalsValidationError | PhysiologicalLimitExceededError> {
    // HUMAN REVIEW: Validación 1 - Ningún valor puede ser negativo
    if (vitals.heartRate < 0 || vitals.temperature < 0 ||
        vitals.oxygenSaturation < 0 || vitals.systolicBP < 0) {
      return Result.fail(new VitalsValidationError('all', 'NEGATIVE_VALUES', 'Los signos vitales no pueden ser negativos'));
    }

    // HUMAN REVIEW: Validación 2 - Rangos fisiológicos extremos
    if (vitals.heartRate > this.PHYSIOLOGICAL_LIMITS.heartRate.max) {
      return Result.fail(new PhysiologicalLimitExceededError(
        'heartRate',
        vitals.heartRate,
        this.PHYSIOLOGICAL_LIMITS.heartRate.min,
        this.PHYSIOLOGICAL_LIMITS.heartRate.max
      ));
    }

    if (vitals.temperature > this.PHYSIOLOGICAL_LIMITS.temperature.max) {
      return Result.fail(new PhysiologicalLimitExceededError(
        'temperature',
        vitals.temperature,
        this.PHYSIOLOGICAL_LIMITS.temperature.min,
        this.PHYSIOLOGICAL_LIMITS.temperature.max
      ));
    }

    // HUMAN REVIEW: Validación crítica - Saturación de oxígeno no puede exceder 100%
    if (vitals.oxygenSaturation > this.PHYSIOLOGICAL_LIMITS.oxygenSaturation.max) {
      return Result.fail(new PhysiologicalLimitExceededError(
        'oxygenSaturation',
        vitals.oxygenSaturation,
        this.PHYSIOLOGICAL_LIMITS.oxygenSaturation.min,
        this.PHYSIOLOGICAL_LIMITS.oxygenSaturation.max
      ));
    }

    if (vitals.systolicBP > this.PHYSIOLOGICAL_LIMITS.systolicBP.max) {
      return Result.fail(new PhysiologicalLimitExceededError(
        'systolicBP',
        vitals.systolicBP,
        this.PHYSIOLOGICAL_LIMITS.systolicBP.min,
        this.PHYSIOLOGICAL_LIMITS.systolicBP.max
      ));
    }

    return Result.ok(undefined);
  }

  /**
   * Determina si los signos vitales están fuera de rangos normales
   *
   * HUMAN REVIEW: Rangos normales basados en estándares médicos para adultos.
   */
  private checkIfAbnormal(vitals: IVitals): boolean {
    const isHeartRateAbnormal = vitals.heartRate < 60 || vitals.heartRate > 100;
    const isTemperatureAbnormal = vitals.temperature < 36.5 || vitals.temperature > 37.5;
    const isOxygenAbnormal = vitals.oxygenSaturation < 95;
    const isBPAbnormal = vitals.systolicBP < 90 || vitals.systolicBP > 140;

    return isHeartRateAbnormal || isTemperatureAbnormal || isOxygenAbnormal || isBPAbnormal;
  }

  /**
   * Determina si los signos vitales requieren atención médica inmediata
   *
   * HUMAN REVIEW: Criterios de criticidad basados en guías de triaje médico.
   */
  private checkIfCritical(vitals: IVitals): boolean {
    const isHeartRateCritical = vitals.heartRate < 40 || vitals.heartRate > 130;
    const isTemperatureCritical = vitals.temperature < 35 || vitals.temperature > 40;
    const isOxygenCritical = vitals.oxygenSaturation < 90;
    const isBPCritical = vitals.systolicBP < 70 || vitals.systolicBP > 180;

    return isHeartRateCritical || isTemperatureCritical || isOxygenCritical || isBPCritical;
  }
}
