/**
 * Process Triage Use Case - Application Layer
 *
 * Caso de uso que orquesta el flujo completo de triaje de un paciente.
 * Implementa el patrón Use Case de Clean Architecture para coordinar
 * múltiples servicios y entidades del dominio en un flujo cohesivo.
 *
 * HUMAN REVIEW: La IA propuso acoplar todos los servicios en el controlador Express.
 * Refactoricé usando el patrón 'Use Case' (Arquitectura Limpia) para asegurar que
 * la lógica de orquestación sea independiente del framework web y fácilmente testeable.
 *
 * Beneficios del patrón Use Case:
 * 1. Independencia del Framework: No depende de Express, Fastify, etc.
 * 2. Testeable: Fácil de probar sin servidor HTTP
 * 3. Reutilizable: Puede ser llamado desde HTTP, CLI, cron jobs, etc.
 * 4. Single Responsibility: Solo coordina el flujo de triaje
 * 5. Trazabilidad: Todo el flujo en un solo lugar
 */

import { PatientService, type RegisteredPatient } from '../PatientService';
import { VitalsService, type IVitals, type RecordedVitals } from '../VitalsService';
import { TriageEngine, type TriageVitals, type TriagePriority } from '@domain/TriageEngine';
import { NotificationService, type TriageEvent } from '../NotificationService';
import { AuditService, AuditAction } from '../AuditService';

/**
 * Datos de entrada para el caso de uso de triaje
 *
 * HUMAN REVIEW: Este DTO combina información del paciente y sus signos vitales
 * en una sola estructura para simplificar la entrada al use case.
 */
export interface TriageInputData {
  // Datos del paciente
  patient: {
    nombre: string;
    apellido: string;
    fechaNacimiento: Date;
    genero: string;
    documentoIdentidad?: string;
  };
  // Signos vitales
  vitals: {
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
    systolicBP: number;
  };
  // Metadata adicional
  userId?: string;           // ID del usuario que ingresa el triaje
  reason?: string;           // Motivo de consulta
  observations?: string;     // Observaciones adicionales
}

/**
 * Resultado del proceso de triaje
 *
 * HUMAN REVIEW: Este DTO encapsula todo el resultado del flujo de triaje
 * para facilitar la respuesta al cliente y auditoría posterior.
 */
export interface TriageResult {
  success: boolean;
  patient: RegisteredPatient;
  vitals: RecordedVitals;
  priority: TriagePriority;
  notificationSent: boolean;
  auditLogId?: string;
  timestamp: number;
  error?: string;
}

/**
 * Process Triage Use Case
 *
 * Implementa el flujo completo de triaje de un paciente desde su ingreso
 * hasta la asignación de prioridad y notificación.
 *
 * Flujo de ejecución:
 * 1. Registrar paciente (PatientService)
 * 2. Validar y registrar signos vitales (VitalsService)
 * 3. Calcular prioridad de triaje (TriageEngine)
 * 4. Notificar si es alta prioridad (1-2) (NotificationService)
 * 5. Registrar auditoría completa (AuditService)
 *
 * HUMAN REVIEW: Este Use Case actúa como un Facade/Orchestrator.
 * En sistemas más complejos, considerar:
 * - Transacciones distribuidas (Saga pattern)
 * - Event Sourcing para trazabilidad completa
 * - CQRS para separar lecturas de escrituras
 * - Compensación automática en caso de fallos
 */
export class ProcessTriageUseCase {
  /**
   * Ejecuta el flujo completo de triaje
   *
   * HUMAN REVIEW: Este método implementa el patrón Template Method:
   * define el esqueleto del algoritmo (flujo de triaje) y delega
   * los pasos específicos a servicios especializados.
   *
   * El método es transaction-like: si un paso falla, los pasos anteriores
   * ya se ejecutaron (sin rollback por ahora). En producción, implementar
   * compensación o usar transacciones distribuidas.
   *
   * @param data - Datos del paciente y signos vitales
   * @returns Resultado completo del proceso de triaje
   */
  public static async execute(data: TriageInputData): Promise<TriageResult> {
    const startTime = Date.now();
    const userId = data.userId || 'SYSTEM';

    try {
      // HUMAN REVIEW: Validación de entrada
      this.validateInput(data);

      // HUMAN REVIEW: Paso 1 - Registrar paciente (US-001)
      console.log('[ProcessTriageUseCase] Step 1: Registering patient...');
      const patient = PatientService.register({
        firstName: data.patient.nombre,
        lastName: data.patient.apellido,
        birthDate: data.patient.fechaNacimiento,
        gender: data.patient.genero
      });

      console.log(`[ProcessTriageUseCase] Patient registered with ID: ${patient.id}`);

      // HUMAN REVIEW: Paso 2 - Validar y registrar signos vitales (US-002)
      console.log('[ProcessTriageUseCase] Step 2: Recording vital signs...');
      const vitalsData: IVitals = {
        patientId: patient.id,
        heartRate: data.vitals.heartRate,
        temperature: data.vitals.temperature,
        oxygenSaturation: data.vitals.oxygenSaturation,
        systolicBP: data.vitals.systolicBP
      };

      const vitals = VitalsService.recordVitals(vitalsData);
      console.log(`[ProcessTriageUseCase] Vitals recorded - Critical: ${vitals.isCritical}, Abnormal: ${vitals.isAbnormal}`);

      // HUMAN REVIEW: Paso 3 - Calcular prioridad de triaje (US-003)
      console.log('[ProcessTriageUseCase] Step 3: Calculating triage priority...');
      const triageVitals: TriageVitals = {
        heartRate: data.vitals.heartRate,
        temperature: data.vitals.temperature,
        oxygenSaturation: data.vitals.oxygenSaturation
      };

      const priority = TriageEngine.calculatePriority(triageVitals);
      console.log(`[ProcessTriageUseCase] Priority calculated: ${priority}`);

      // HUMAN REVIEW: Obtener las reglas que se activaron (para auditoría)
      const triggeredRules = TriageEngine.getTriggeredRules(triageVitals);
      const ruleNames = triggeredRules.map(rule => rule.name).join(', ');

      // HUMAN REVIEW: Paso 4 - Notificar si es alta prioridad (US-005)
      let notificationSent = false;
      if (priority <= 2) {
        console.log('[ProcessTriageUseCase] Step 4: Sending high priority notification...');

        const triageEvent: TriageEvent = {
          patientId: patient.id,
          priority,
          reason: ruleNames || data.reason || 'Signos vitales críticos detectados',
          timestamp: Date.now(),
          vitalSigns: {
            heartRate: data.vitals.heartRate,
            temperature: data.vitals.temperature,
            oxygenSaturation: data.vitals.oxygenSaturation,
            systolicBP: data.vitals.systolicBP
          }
        };

        await NotificationService.notifyHighPriority(triageEvent);
        notificationSent = true;
        console.log('[ProcessTriageUseCase] High priority notification sent');
      } else {
        console.log(`[ProcessTriageUseCase] Priority ${priority} does not require immediate notification`);
      }

      // HUMAN REVIEW: Paso 5 - Registrar auditoría completa (US-009)
      console.log('[ProcessTriageUseCase] Step 5: Logging audit trail...');
      const auditResult = await AuditService.logAction({
        userId,
        action: AuditAction.TRIAGE_CALCULATION,
        patientId: patient.id,
        details: `Triaje completo - Paciente: ${patient.firstName} ${patient.lastName}, Prioridad: ${priority}, Reglas activadas: ${ruleNames || 'Ninguna'}`,
        metadata: {
          priority,
          vitals: vitalsData,
          notificationSent,
          isCritical: vitals.isCritical,
          isAbnormal: vitals.isAbnormal,
          triggeredRules: ruleNames,
          reason: data.reason,
          observations: data.observations,
          processingTimeMs: Date.now() - startTime
        }
      });

      console.log(`[ProcessTriageUseCase] Audit logged with ID: ${auditResult.logId || 'N/A'}`);

      // HUMAN REVIEW: Paso 6 - Construir y retornar resultado exitoso
      const result: TriageResult = {
        success: true,
        patient,
        vitals,
        priority,
        notificationSent,
        auditLogId: auditResult.logId,
        timestamp: Date.now()
      };

      console.log(`[ProcessTriageUseCase] Triage process completed successfully in ${Date.now() - startTime}ms`);
      return result;

    } catch (error) {
      // HUMAN REVIEW: Manejo centralizado de errores
      console.error('[ProcessTriageUseCase] Triage process failed:', error);

      // HUMAN REVIEW: Intentar registrar el fallo en auditoría
      // Usar void para no bloquear el flujo de error
      void AuditService.logAction({
        userId,
        action: 'TRIAGE_FAILED' as AuditAction,
        details: `Fallo en proceso de triaje: ${error instanceof Error ? error.message : String(error)}`,
        metadata: {
          inputData: data,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          processingTimeMs: Date.now() - startTime
        }
      }).catch(auditError => {
        console.error('[ProcessTriageUseCase] Failed to log error to audit:', auditError);
      });

      // HUMAN REVIEW: Retornar resultado con error
      return {
        success: false,
        patient: {} as RegisteredPatient,
        vitals: {} as RecordedVitals,
        priority: 5 as TriagePriority, // Default to lowest priority
        notificationSent: false,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Valida los datos de entrada del use case
   *
   * HUMAN REVIEW: Separar validación en método privado para mantener SRP
   * y facilitar testing de casos de error.
   *
   * @param data - Datos a validar
   * @throws Error si los datos son inválidos
   */
  private static validateInput(data: TriageInputData): void {
    // HUMAN REVIEW: Validar estructura de datos
    if (!data) {
      throw new Error('Triage input data is required');
    }

    if (!data.patient) {
      throw new Error('Patient data is required');
    }

    if (!data.vitals) {
      throw new Error('Vital signs data are required');
    }

    // HUMAN REVIEW: Validar campos del paciente
    if (!data.patient.nombre || !data.patient.nombre.trim()) {
      throw new Error('Patient name is required');
    }

    if (!data.patient.apellido || !data.patient.apellido.trim()) {
      throw new Error('Patient last name is required');
    }

    if (!data.patient.fechaNacimiento) {
      throw new Error('Patient birth date is required');
    }

    if (!data.patient.genero || !data.patient.genero.trim()) {
      throw new Error('Patient gender is required');
    }

    // HUMAN REVIEW: Validar campos de signos vitales
    if (data.vitals.heartRate === undefined || data.vitals.heartRate === null) {
      throw new Error('Heart rate is required');
    }

    if (data.vitals.temperature === undefined || data.vitals.temperature === null) {
      throw new Error('Temperature is required');
    }

    if (data.vitals.oxygenSaturation === undefined || data.vitals.oxygenSaturation === null) {
      throw new Error('Oxygen saturation is required');
    }

    if (data.vitals.systolicBP === undefined || data.vitals.systolicBP === null) {
      throw new Error('Systolic blood pressure is required');
    }
  }

  /**
   * Simula el proceso de triaje (útil para demos y pruebas)
   *
   * HUMAN REVIEW: Método auxiliar para generar datos de triaje aleatorios.
   * Útil para testing de carga y demos.
   *
   * @param priority - Prioridad deseada (opcional)
   * @returns Datos de entrada simulados
   */
  public static generateSampleData(priority?: TriagePriority): TriageInputData {
    // HUMAN REVIEW: Generar signos vitales basados en la prioridad deseada
    let heartRate = 80;
    let temperature = 37;
    let oxygenSaturation = 98;

    if (priority === 1) {
      // Generar valores críticos
      heartRate = 130 + Math.floor(Math.random() * 20);
      temperature = 40 + Math.random() * 2;
      oxygenSaturation = 85 - Math.floor(Math.random() * 10);
    } else if (priority === 5) {
      // Generar valores normales
      heartRate = 70 + Math.floor(Math.random() * 20);
      temperature = 36.5 + Math.random();
      oxygenSaturation = 97 + Math.floor(Math.random() * 3);
    }

    return {
      patient: {
        nombre: 'Juan',
        apellido: 'Pérez',
        fechaNacimiento: new Date(1990, 0, 1),
        genero: 'M',
        documentoIdentidad: `DOC-${Date.now()}`
      },
      vitals: {
        heartRate,
        temperature,
        oxygenSaturation,
        systolicBP: 120
      },
      userId: 'DEMO_USER',
      reason: 'Prueba de sistema',
      observations: 'Datos generados automáticamente'
    };
  }

  /**
   * Obtiene estadísticas del use case
   *
   * HUMAN REVIEW: Para monitoreo y observabilidad
   */
  public static getStatistics(): {
    description: string;
    steps: string[];
    dependencies: string[];
    } {
    return {
      description: 'Flujo completo de triaje desde registro hasta notificación',
      steps: [
        '1. Registrar paciente',
        '2. Validar y registrar signos vitales',
        '3. Calcular prioridad de triaje',
        '4. Notificar si es alta prioridad (1-2)',
        '5. Registrar auditoría completa'
      ],
      dependencies: [
        'PatientService',
        'VitalsService',
        'TriageEngine',
        'NotificationService',
        'AuditService'
      ]
    };
  }
}
