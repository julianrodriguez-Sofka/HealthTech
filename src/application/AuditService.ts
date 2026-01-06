import { Result } from '@shared/Result';
import { logger } from '@shared/Logger';
import type { IAuditRepository, AuditLogData, AuditSearchCriteria } from '@domain/repositories';
import type { IIdGenerator } from '@application/interfaces';
import {
  InvalidNotificationDataError
} from '@domain/errors';

/**
 * Audit Service - Application Layer
 *
 * Servicio de aplicación que orquesta el registro de auditoría de acciones del sistema.
 * Actúa como un caso de uso que coordina la lógica de negocio con la infraestructura.
 *
 * HUMAN REVIEW: Refactorizado siguiendo Clean Architecture:
 * 1. ✅ Inyección de dependencias (IAuditRepository, IIdGenerator)
 * 2. ✅ Result Pattern para manejo de errores
 * 3. ✅ Métodos de instancia (no estáticos)
 * 4. ✅ Este servicio es crítico para cumplimiento regulatorio (HIPAA, GDPR)
 */

/**
 * Datos de acción a auditar
 *
 * HUMAN REVIEW: Este tipo representa la entrada al servicio de auditoría.
 * Es similar a AuditLogData pero sin ID y timestamp (se añaden automáticamente).
 */
export interface AuditActionData {
  userId: string;
  action: string;
  patientId?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Tipos de acciones auditables
 *
 * HUMAN REVIEW: Enum para estandarizar las acciones del sistema.
 * Garantiza consistencia en logs y facilita búsquedas/análisis.
 */
export enum AuditAction {
  // Acciones de triaje
  TRIAGE_CALCULATION = 'TRIAGE_CALCULATION',
  PRIORITY_ASSIGNED = 'PRIORITY_ASSIGNED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',

  // Acciones de pacientes
  PATIENT_REGISTERED = 'PATIENT_REGISTERED',
  PATIENT_UPDATED = 'PATIENT_UPDATED',
  PATIENT_VIEWED = 'PATIENT_VIEWED',

  // Acciones de signos vitales
  VITALS_RECORDED = 'VITALS_RECORDED',
  VITALS_VIEWED = 'VITALS_VIEWED',

  // Acciones de notificaciones
  HIGH_PRIORITY_NOTIFICATION_SENT = 'HIGH_PRIORITY_NOTIFICATION_SENT',
  ALERT_ACKNOWLEDGED = 'ALERT_ACKNOWLEDGED',

  // Acciones de autenticación
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  ACCESS_DENIED = 'ACCESS_DENIED'
}

/**
 * Resultado del registro de auditoría
 */
export interface AuditResult {
  success: boolean;
  logId?: string;
  timestamp?: Date;
  error?: string;
}

/**
 * Audit Service
 *
 * Servicio de aplicación que maneja el registro de auditoría de acciones del sistema.
 * Implementa la lógica de orquestación entre la capa de aplicación e infraestructura.
 */
export class AuditService {
  constructor(
    private readonly auditRepository: IAuditRepository,
    private readonly idGenerator: IIdGenerator
  ) {}

  /**
   * Registra una acción del sistema en el log de auditoría
   *
   * HUMAN REVIEW: Refactorizado para usar Result Pattern y DI.
   * Puede ser "disparado y olvidado" (fire-and-forget) desde el código llamador
   * para evitar bloquear operaciones críticas.
   *
   * Ejemplo de uso:
   * ```typescript
   * const priority = triageEngine.calculatePriority(vitals);
   *
   * // Fire-and-forget (no esperar por el log)
   * void auditService.logAction({
   *   userId: currentUser.id,
   *   action: AuditAction.TRIAGE_CALCULATION,
   *   patientId: patient.id,
   *   details: `Priority ${priority} assigned`
   * });
   *
   * return priority; // Flujo principal no bloqueado
   * ```
   */
  public async logAction(
    data: AuditActionData
  ): Promise<Result<AuditResult, InvalidNotificationDataError>> {
    // HUMAN REVIEW: Validación de campos requeridos
    const validationResult = this.validateActionData(data);
    if (validationResult.isFailure) {
      return Result.fail(validationResult.error);
    }

    // HUMAN REVIEW: Enriquecer datos con ID y timestamp
    const logId = this.idGenerator.generate();
    const timestamp = new Date();

    const auditData: AuditLogData = {
      id: logId,
      userId: data.userId,
      action: data.action,
      patientId: data.patientId,
      details: data.details,
      metadata: data.metadata,
      timestamp
    };

    // HUMAN REVIEW: Persistir en repositorio
    const saveResult = await this.auditRepository.save(auditData);

    if (saveResult.isFailure) {
      logger.error(`Failed to log action ${data.action}`, saveResult.error, { userId: data.userId, action: data.action });
      return Result.ok({
        success: false,
        error: saveResult.error.message
      });
    }

    logger.info(`Action logged successfully: ${data.action}`, { userId: data.userId, action: data.action });

    return Result.ok({
      success: true,
      logId,
      timestamp
    });
  }

  /**
   * Valida los datos de la acción de auditoría
   */
  private validateActionData(data: AuditActionData): Result<void, InvalidNotificationDataError> {
    if (!data) {
      return Result.fail(new InvalidNotificationDataError('Audit action data is required'));
    }

    if (!data.userId || !data.userId.trim()) {
      return Result.fail(new InvalidNotificationDataError('User ID is required for audit logging'));
    }

    if (!data.action || !data.action.trim()) {
      return Result.fail(new InvalidNotificationDataError('Action is required for audit logging'));
    }

    return Result.ok(undefined);
  }

  /**
   * Registra una acción de forma asíncrona sin bloquear el flujo principal
   *
   * HUMAN REVIEW: Método wrapper para "fire-and-forget" explícito.
   */
  public logActionAsync(data: AuditActionData): void {
    void this.logAction(data).then((result) => {
      if (result.isFailure || (result.value && !result.value.success)) {
        logger.error('Async audit logging failed', undefined, { userId: data.userId, action: data.action });
      }
    });
  }

  /**
   * Registra múltiples acciones en lote
   *
   * HUMAN REVIEW: Optimización para operaciones masivas.
   */
  public async logBatch(
    actions: AuditActionData[]
  ): Promise<Result<AuditResult[], InvalidNotificationDataError>> {
    // HUMAN REVIEW: Validar que el array no esté vacío
    if (!actions || actions.length === 0) {
      return Result.fail(new InvalidNotificationDataError('At least one action is required for batch logging'));
    }

    // HUMAN REVIEW: Limitar tamaño del lote
    if (actions.length > 1000) {
      return Result.fail(new InvalidNotificationDataError('Batch size exceeds maximum limit of 1000 actions'));
    }

    // HUMAN REVIEW: Procesar en paralelo con Promise.allSettled
    const results = await Promise.allSettled(
      actions.map((action) => this.logAction(action))
    );

    const auditResults = results.map((result) => {
      if (result.status === 'fulfilled' && result.value.isSuccess) {
        return result.value.value;
      } else {
        return {
          success: false,
          error: result.status === 'rejected'
            ? String(result.reason)
            : 'Unknown error'
        };
      }
    });

    return Result.ok(auditResults);
  }

  /**
   * Consulta logs de auditoría por usuario
   *
   * HUMAN REVIEW: Útil para investigaciones de seguridad y análisis forense.
   */
  public async getLogsByUser(userId: string): Promise<Result<AuditLogData[], Error>> {
    if (!userId || !userId.trim()) {
      return Result.fail(new InvalidNotificationDataError('User ID is required'));
    }

    return await this.auditRepository.findByUserId(userId);
  }

  /**
   * Consulta logs de auditoría por paciente
   *
   * HUMAN REVIEW: Esencial para compliance con regulaciones médicas (HIPAA).
   */
  public async getLogsByPatient(patientId: string): Promise<Result<AuditLogData[], Error>> {
    if (!patientId || !patientId.trim()) {
      return Result.fail(new InvalidNotificationDataError('Patient ID is required'));
    }

    return await this.auditRepository.findByPatientId(patientId);
  }

  /**
   * Consulta logs de auditoría por tipo de acción
   */
  public async getLogsByAction(action: string): Promise<Result<AuditLogData[], Error>> {
    if (!action || !action.trim()) {
      return Result.fail(new InvalidNotificationDataError('Action is required'));
    }

    return await this.auditRepository.findByAction(action);
  }

  /**
   * Busca logs de auditoría con criterios complejos
   */
  public async search(criteria: AuditSearchCriteria): Promise<Result<AuditLogData[], Error>> {
    return await this.auditRepository.search(criteria);
  }

  /**
   * Verifica si una acción está en la lista de acciones auditables
   */
  public isValidAction(action: string): boolean {
    return Object.values(AuditAction).includes(action as AuditAction);
  }

  /**
   * Obtiene estadísticas del servicio de auditoría
   */
  public getStatistics(): {
    totalActions: number;
    availableActions: string[];
    } {
    return {
      totalActions: Object.keys(AuditAction).length,
      availableActions: Object.values(AuditAction)
    };
  }
}
