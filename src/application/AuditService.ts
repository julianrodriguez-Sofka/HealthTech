/**
 * Audit Service - Application Layer
 *
 * Servicio de aplicación que orquesta el registro de auditoría de acciones del sistema.
 * Actúa como un caso de uso que coordina la lógica de negocio con la infraestructura.
 *
 * HUMAN REVIEW: Este servicio es crítico para cumplimiento regulatorio (HIPAA, GDPR).
 * Todos los eventos relacionados con datos de pacientes deben ser auditados:
 * - Acceso a información médica
 * - Modificaciones de registros
 * - Cálculos de triaje
 * - Asignaciones de prioridad
 * - Notificaciones enviadas
 */

import { Database, type AuditLogData, type SavedAuditLog } from '@infrastructure/database/Database';

/**
 * Datos de acción a auditar
 *
 * HUMAN REVIEW: Este tipo representa la entrada al servicio de auditoría.
 * Es similar a AuditLogData pero sin timestamp (se añade automáticamente).
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
 *
 * HUMAN REVIEW: La IA sugirió guardar los logs de forma síncrona. He refactorizado
 * para que la auditoría sea asíncrona y no bloquee el flujo principal del triaje,
 * asegurando que el rendimiento del sistema no se vea afectado por el registro
 * de trazabilidad.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo orquesta el registro de auditoría
 * - Dependency Inversion: Depende de Database (abstracción), no de implementación SQL
 * - Open/Closed: Extensible a nuevos tipos de acciones sin modificar código existente
 */
export class AuditService {
  /**
   * Registra una acción del sistema en el log de auditoría
   *
   * HUMAN REVIEW: Este método es asíncrono pero puede ser "disparado y olvidado" (fire-and-forget)
   * desde el código llamador para evitar bloquear operaciones críticas.
   *
   * Ejemplo de uso en código de triaje:
   * ```typescript
   * const priority = TriageEngine.calculatePriority(vitals);
   *
   * // No esperar por el log de auditoría (fire-and-forget)
   * void AuditService.logAction({
   *   userId: currentUser.id,
   *   action: AuditAction.TRIAGE_CALCULATION,
   *   patientId: patient.id,
   *   details: `Priority ${priority} assigned`
   * });
   *
   * return priority; // Flujo principal no bloqueado
   * ```
   *
   * Para casos donde el log ES crítico (ej. transacciones financieras),
   * usar await y manejar el error:
   * ```typescript
   * try {
   *   await AuditService.logAction(...);
   * } catch (error) {
   *   // Manejar fallo crítico
   * }
   * ```
   *
   * @param data - Datos de la acción a auditar
   * @returns Resultado del registro con ID y timestamp
   * @throws Error si el registro falla (solo si se espera con await)
   */
  public static async logAction(data: AuditActionData): Promise<AuditResult> {
    // HUMAN REVIEW: Validación de campos requeridos
    if (!data) {
      throw new Error('Audit action data is required');
    }

    if (!data.userId || !data.userId.trim()) {
      throw new Error('User ID is required for audit logging');
    }

    if (!data.action || !data.action.trim()) {
      throw new Error('Action is required for audit logging');
    }

    try {
      // HUMAN REVIEW: Enriquecer datos con timestamp automático
      // Este es el valor agregado del servicio: no obligar al código llamador
      // a recordar añadir el timestamp en cada llamada
      const auditData: AuditLogData = {
        ...data,
        timestamp: new Date() // Timestamp añadido automáticamente
      };

      // HUMAN REVIEW: Llamar a la capa de infraestructura (Database)
      // El servicio NO conoce detalles de SQL, solo delega la persistencia
      const savedLog = await Database.saveLog(auditData);

      console.log(`[AuditService] Action logged successfully: ${data.action} by user ${data.userId}`);

      // HUMAN REVIEW: Retornar resultado exitoso con metadata
      return {
        success: true,
        logId: savedLog.id,
        timestamp: savedLog.timestamp
      };
    } catch (error) {
      // HUMAN REVIEW: En producción, implementar estrategias de resiliencia:
      // 1. Retry con exponential backoff (3 intentos)
      // 2. Dead letter queue para logs fallidos
      // 3. Fallback a logging en archivo local
      // 4. Alertas al equipo de infraestructura
      // 5. NO propagar el error si es fire-and-forget (solo logear)

      console.error(`[AuditService] Failed to log action ${data.action} for user ${data.userId}:`, error);

      // HUMAN REVIEW: Retornar resultado fallido en lugar de lanzar excepción
      // para permitir que el flujo principal continúe
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      // HUMAN REVIEW: Alternativa si el audit ES crítico:
      // throw new Error(`Failed to log audit action: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Registra una acción de forma asíncrona sin bloquear el flujo principal
   *
   * HUMAN REVIEW: Método wrapper para "fire-and-forget" explícito.
   * Útil cuando el logging no debe bloquear operaciones críticas.
   *
   * @param data - Datos de la acción a auditar
   */
  public static logActionAsync(data: AuditActionData): void {
    // HUMAN REVIEW: El operador 'void' previene warnings de floating promises
    void this.logAction(data).catch((error) => {
      console.error('[AuditService] Async audit logging failed:', error);
      // HUMAN REVIEW: Aquí podríamos añadir fallback a archivo local
      // o enviar a sistema de monitoreo externo
    });
  }

  /**
   * Registra múltiples acciones en lote
   *
   * HUMAN REVIEW: Optimización para operaciones masivas.
   * En producción, usar batch insert en PostgreSQL para mejor rendimiento.
   *
   * @param actions - Array de acciones a auditar
   * @returns Array de resultados
   */
  public static async logBatch(actions: AuditActionData[]): Promise<AuditResult[]> {
    // HUMAN REVIEW: Validar que el array no esté vacío
    if (!actions || actions.length === 0) {
      throw new Error('At least one action is required for batch logging');
    }

    // HUMAN REVIEW: Limitar tamaño del lote para evitar sobrecarga
    if (actions.length > 1000) {
      throw new Error('Batch size exceeds maximum limit of 1000 actions');
    }

    // HUMAN REVIEW: Procesar en paralelo con Promise.all
    // Para mejor control de errores, usar Promise.allSettled
    const results = await Promise.allSettled(
      actions.map((action) => this.logAction(action))
    );

    // HUMAN REVIEW: Mapear resultados de Promise.allSettled a AuditResult
    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        };
      }
    });
  }

  /**
   * Consulta logs de auditoría por usuario
   *
   * HUMAN REVIEW: Método auxiliar para auditorías y compliance.
   * Útil para investigaciones de seguridad y análisis forense.
   *
   * @param userId - ID del usuario a consultar
   * @returns Array de logs del usuario
   */
  public static async getLogsByUser(userId: string): Promise<SavedAuditLog[]> {
    // HUMAN REVIEW: Validar parámetro
    if (!userId || !userId.trim()) {
      throw new Error('User ID is required');
    }

    return await Database.findByUserId(userId);
  }

  /**
   * Consulta logs de auditoría por paciente
   *
   * HUMAN REVIEW: Esencial para compliance con regulaciones médicas (HIPAA).
   * Permite rastrear quién accedió a datos de un paciente y cuándo.
   *
   * @param patientId - ID del paciente a consultar
   * @returns Array de logs relacionados al paciente
   */
  public static async getLogsByPatient(patientId: string): Promise<SavedAuditLog[]> {
    if (!patientId || !patientId.trim()) {
      throw new Error('Patient ID is required');
    }

    return await Database.findByPatientId(patientId);
  }

  /**
   * Consulta logs de auditoría por tipo de acción
   *
   * @param action - Tipo de acción (usar AuditAction enum)
   * @returns Array de logs de la acción especificada
   */
  public static async getLogsByAction(action: string): Promise<SavedAuditLog[]> {
    if (!action || !action.trim()) {
      throw new Error('Action is required');
    }

    return await Database.findByAction(action);
  }

  /**
   * Verifica si una acción está en la lista de acciones auditables
   *
   * HUMAN REVIEW: Método auxiliar para validación
   */
  public static isValidAction(action: string): boolean {
    return Object.values(AuditAction).includes(action as AuditAction);
  }

  /**
   * Obtiene estadísticas del servicio de auditoría
   *
   * HUMAN REVIEW: Para monitoreo y observabilidad
   */
  public static getStatistics(): {
    totalActions: number;
    availableActions: string[];
    } {
    return {
      totalActions: Object.keys(AuditAction).length,
      availableActions: Object.values(AuditAction)
    };
  }
}
