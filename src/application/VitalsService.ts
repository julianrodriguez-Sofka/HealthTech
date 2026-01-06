/**
 * Vitals Service
 *
 * Servicio de aplicación para gestionar el registro de signos vitales.
 * Este servicio orquesta la captura y validación de datos vitales de pacientes,
 * aplicando reglas de negocio estrictas para garantizar la calidad de los datos.
 *
 * HUMAN REVIEW: Este servicio debe ser refactorizado para:
 * 1. Inyectar IVitalsRepository para persistencia
 * 2. Inyectar IPatientRepository para validar existencia del paciente
 * 3. Notificar observers cuando se detecten valores críticos
 * 4. Usar Result<T> pattern en lugar de excepciones
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
  private static readonly PHYSIOLOGICAL_LIMITS: PhysiologicalLimits = {
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

  /**
   * Registra signos vitales de un paciente
   *
   * @param vitals - Datos de signos vitales a registrar
   * @returns Signos vitales registrados con metadata
   * @throws Error si las validaciones fallan
   *
   * HUMAN REVIEW: Este método debería:
   * 1. Validar que el paciente existe antes de registrar signos vitales
   * 2. Notificar a observers si los valores son críticos
   * 3. Persistir en base de datos a través de IVitalsRepository
   * 4. Retornar Result<RecordedVitals> en lugar de lanzar excepciones
   */
  public static recordVitals(vitals: IVitals): RecordedVitals {
    // HUMAN REVIEW: Validar que el patientId esté presente
    if (!vitals.patientId || !vitals.patientId.trim()) {
      throw new Error('Patient ID is required');
    }

    // HUMAN REVIEW: Validar que todos los campos vitales estén presentes
    this.validateRequiredFields(vitals);

    // HUMAN REVIEW: Aplicar validaciones de negocio
    this.validateVitalsRanges(vitals);

    // HUMAN REVIEW: Determinar si los valores son anormales o críticos
    const isAbnormal = this.checkIfAbnormal(vitals);
    const isCritical = this.checkIfCritical(vitals);

    // HUMAN REVIEW: En producción, esto debería:
    // 1. Crear una entidad VitalSigns del dominio
    // 2. Llamar a vitalsRepository.save(vitalSigns)
    // 3. Si es crítico, notificar observers para alerta inmediata
    const recordedVitals: RecordedVitals = {
      id: this.generateTemporaryId(),
      patientId: vitals.patientId,
      heartRate: vitals.heartRate,
      temperature: vitals.temperature,
      oxygenSaturation: vitals.oxygenSaturation,
      systolicBP: vitals.systolicBP,
      recordedAt: new Date(),
      isAbnormal,
      isCritical
    };

    // HUMAN REVIEW: Si isCritical es true, aquí debería enviarse
    // a la cola de RabbitMQ para notificación inmediata a médicos
    // if (isCritical) {
    //   await this.triageQueue.sendTriageNotification({
    //     patientId: vitals.patientId,
    //     priorityLevel: 1,
    //     vitalSigns: vitals,
    //     timestamp: Date.now(),
    //     reason: 'Critical vital signs detected'
    //   });
    // }

    return recordedVitals;
  }

  /**
   * Valida que todos los campos requeridos estén presentes
   *
   * HUMAN REVIEW: Separado en método privado para mantener SRP
   * y facilitar testing unitario de validaciones específicas
   */
  private static validateRequiredFields(vitals: IVitals): void {
    if (vitals.heartRate === undefined || vitals.heartRate === null) {
      throw new Error('Heart rate is required');
    }

    if (vitals.temperature === undefined || vitals.temperature === null) {
      throw new Error('Temperature is required');
    }

    if (vitals.oxygenSaturation === undefined || vitals.oxygenSaturation === null) {
      throw new Error('Oxygen saturation is required');
    }

    if (vitals.systolicBP === undefined || vitals.systolicBP === null) {
      throw new Error('Systolic blood pressure is required');
    }
  }

  /**
   * Valida que los signos vitales estén dentro de rangos fisiológicos válidos
   *
   * HUMAN REVIEW: Método privado que centraliza la lógica de validación
   * de rangos para mantener el principio de Single Responsibility.
   * Separar validaciones permite:
   * 1. Testear cada validación independientemente
   * 2. Modificar rangos sin afectar el método principal
   * 3. Extender con nuevas validaciones sin romper código existente (OCP)
   */
  private static validateVitalsRanges(vitals: IVitals): void {
    // HUMAN REVIEW: Validación 1 - Ningún valor puede ser negativo
    if (vitals.heartRate < 0) {
      throw new Error('Los signos vitales no pueden ser negativos');
    }

    if (vitals.temperature < 0) {
      throw new Error('Los signos vitales no pueden ser negativos');
    }

    if (vitals.oxygenSaturation < 0) {
      throw new Error('Los signos vitales no pueden ser negativos');
    }

    if (vitals.systolicBP < 0) {
      throw new Error('Los signos vitales no pueden ser negativos');
    }

    // HUMAN REVIEW: Validación 2 - Rangos fisiológicos extremos
    if (vitals.heartRate > this.PHYSIOLOGICAL_LIMITS.heartRate.max) {
      throw new Error('Rango fisiológico inválido');
    }

    if (vitals.temperature > this.PHYSIOLOGICAL_LIMITS.temperature.max) {
      throw new Error('Rango fisiológico inválido');
    }

    // HUMAN REVIEW: Validación crítica - Saturación de oxígeno no puede exceder 100%
    if (vitals.oxygenSaturation > this.PHYSIOLOGICAL_LIMITS.oxygenSaturation.max) {
      throw new Error('Rango fisiológico inválido');
    }

    if (vitals.systolicBP > this.PHYSIOLOGICAL_LIMITS.systolicBP.max) {
      throw new Error('Rango fisiológico inválido');
    }
  }

  /**
   * Determina si los signos vitales están fuera de rangos normales
   *
   * HUMAN REVIEW: Rangos normales basados en estándares médicos para adultos.
   * En una implementación completa, estos rangos deberían ajustarse por:
   * - Edad del paciente (neonatos, niños, adultos, ancianos)
   * - Condiciones médicas preexistentes
   * - Contexto (reposo, ejercicio, embarazo, etc.)
   */
  private static checkIfAbnormal(vitals: IVitals): boolean {
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
   * Valores críticos que requieren evaluación inmediata:
   * - FC < 40 o > 130 bpm
   * - Temperatura < 35°C o > 40°C
   * - SpO2 < 90%
   * - PAS < 70 mmHg o > 180 mmHg
   */
  private static checkIfCritical(vitals: IVitals): boolean {
    const isHeartRateCritical = vitals.heartRate < 40 || vitals.heartRate > 130;
    const isTemperatureCritical = vitals.temperature < 35 || vitals.temperature > 40;
    const isOxygenCritical = vitals.oxygenSaturation < 90;
    const isBPCritical = vitals.systolicBP < 70 || vitals.systolicBP > 180;

    return isHeartRateCritical || isTemperatureCritical || isOxygenCritical || isBPCritical;
  }

  /**
   * Genera un ID temporal para el registro de signos vitales
   *
   * HUMAN REVIEW: En producción, el ID debería ser generado por la base de datos
   * o un servicio de generación de IDs distribuido
   */
  private static generateTemporaryId(): string {
    return `VITALS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
