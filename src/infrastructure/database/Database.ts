/**
 * Database Service - Infrastructure Layer
 *
 * Servicio de infraestructura que abstrae las operaciones de base de datos.
 * Actualmente usa PostgreSQL, pero puede cambiarse a MySQL, MongoDB, etc.
 * sin afectar la capa de aplicación.
 *
 * HUMAN REVIEW: Este servicio debe ser refactorizado para:
 * 1. Usar una librería ORM (TypeORM, Prisma, Sequelize)
 * 2. Implementar connection pooling para eficiencia
 * 3. Manejar transacciones para operaciones complejas
 * 4. Implementar retry logic para fallos transitorios
 */

/**
 * Datos de log de auditoría
 *
 * HUMAN REVIEW: Esta interfaz define el contrato de datos de auditoría.
 * En producción, debería evolucionar a una entidad del dominio
 * o un Value Object con validaciones integradas.
 */
export interface AuditLogData {
  userId: string;
  action: string;
  patientId?: string;
  details?: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Log de auditoría guardado con ID generado
 */
export interface SavedAuditLog extends AuditLogData {
  id: string;
  timestamp: Date;
  savedAt: Date;
}

/**
 * Interfaz para servicios de persistencia de auditoría
 *
 * HUMAN REVIEW: Esta interfaz pertenece a la capa de aplicación según DIP.
 * En refactorización futura, mover a @application/interfaces/IAuditRepository.ts
 */
export interface IAuditRepository {
  saveLog(data: AuditLogData): Promise<SavedAuditLog>;
  findByUserId(userId: string): Promise<SavedAuditLog[]>;
  findByPatientId(patientId: string): Promise<SavedAuditLog[]>;
  findByAction(action: string): Promise<SavedAuditLog[]>;
}

/**
 * Database Service
 *
 * Implementación concreta del servicio de persistencia usando PostgreSQL.
 * Actúa como un Repository adaptado a la infraestructura específica.
 *
 * HUMAN REVIEW: La IA sugirió guardar los logs de forma síncrona. He refactorizado
 * para que la auditoría sea asíncrona y no bloquee el flujo principal del triaje,
 * asegurando que el rendimiento del sistema no se vea afectado por el registro
 * de trazabilidad.
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo maneja persistencia de datos
 * - Open/Closed: Extensible a otras bases de datos sin modificar código
 * - Dependency Inversion: Implementa IAuditRepository (abstracción)
 */
export class Database implements IAuditRepository {
  private static instance: Database | null = null;

  /**
   * Obtiene la instancia singleton del servicio
   *
   * HUMAN REVIEW: Patrón Singleton para reutilizar la conexión a la base de datos.
   * En producción con ORM, el ORM maneja el pooling automáticamente.
   */
  private static getInstance(): Database {
    if (!this.instance) {
      this.instance = new Database();
    }
    return this.instance;
  }

  /**
   * Constructor privado para patrón Singleton
   *
   * HUMAN REVIEW: En producción, aquí se inicializaría la conexión:
   * this.pool = new Pool({
   *   host: process.env.DB_HOST,
   *   port: parseInt(process.env.DB_PORT || '5432'),
   *   database: process.env.DB_NAME,
   *   user: process.env.DB_USER,
   *   password: process.env.DB_PASSWORD,
   *   max: 20,  // Máximo de conexiones en el pool
   *   idleTimeoutMillis: 30000,
   *   connectionTimeoutMillis: 2000
   * });
   */
  private constructor() {
    // HUMAN REVIEW: Inicialización de conexión a PostgreSQL
    // En producción, conectar aquí o usar lazy connection
  }

  /**
   * Guarda un log de auditoría en la base de datos
   *
   * HUMAN REVIEW: Implementación asíncrona que simula inserción en PostgreSQL.
   * Este método NO bloquea el flujo principal gracias a Promise.
   *
   * Query SQL real que se ejecutaría en producción:
   * ```sql
   * INSERT INTO audit_logs (
   *   id, user_id, action, patient_id, details, timestamp, created_at, metadata
   * ) VALUES (
   *   $1, $2, $3, $4, $5, $6, $7, $8
   * ) RETURNING *;
   * ```
   *
   * @param data - Datos del log de auditoría
   * @returns Log guardado con ID y timestamps generados
   * @throws Error si la inserción falla
   */
  public async saveLog(data: AuditLogData): Promise<SavedAuditLog> {
    // HUMAN REVIEW: Validación de campos requeridos
    if (!data.userId || !data.userId.trim()) {
      throw new Error('User ID is required for audit log');
    }

    if (!data.action || !data.action.trim()) {
      throw new Error('Action is required for audit log');
    }

    try {
      // HUMAN REVIEW: Generar ID único para el log
      const logId = this.generateLogId();
      const now = new Date();

      // HUMAN REVIEW: Construir objeto de log completo
      const savedLog: SavedAuditLog = {
        id: logId,
        userId: data.userId,
        action: data.action,
        patientId: data.patientId,
        details: data.details,
        timestamp: data.timestamp || now,
        savedAt: now,
        metadata: data.metadata
      };

      // HUMAN REVIEW: Simular delay de escritura a base de datos
      // En producción, esto sería una operación real de I/O
      await this.simulateDatabaseWrite();

      // HUMAN REVIEW: Log para desarrollo (remover en producción o usar logger)
      console.log('[Database] Audit log saved to PostgreSQL:');
      console.log(`  ID: ${savedLog.id}`);
      console.log(`  User: ${savedLog.userId}`);
      console.log(`  Action: ${savedLog.action}`);
      console.log(`  Patient: ${savedLog.patientId || 'N/A'}`);
      console.log(`  Timestamp: ${savedLog.timestamp.toISOString()}`);
      console.log(`  Details: ${savedLog.details || 'N/A'}`);

      // HUMAN REVIEW: En producción con PostgreSQL real:
      // const result = await this.pool.query(
      //   `INSERT INTO audit_logs (id, user_id, action, patient_id, details, timestamp, created_at, metadata)
      //    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      //   [logId, data.userId, data.action, data.patientId, data.details,
      //    data.timestamp || now, now, JSON.stringify(data.metadata)]
      // );
      // return this.mapRowToAuditLog(result.rows[0]);

      return savedLog;
    } catch (error) {
      // HUMAN REVIEW: En producción, implementar:
      // - Dead letter queue para logs fallidos
      // - Reintentos con exponential backoff
      // - Alertas al equipo de infraestructura
      // - Fallback a logging en archivo
      console.error('[Database] Error saving audit log:', error);
      throw new Error(`Failed to save audit log: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Busca logs de auditoría por ID de usuario
   *
   * HUMAN REVIEW: Método para consultas de auditoría.
   * En producción, agregar paginación y filtros de fecha.
   *
   * @param userId - ID del usuario a buscar
   * @returns Array de logs del usuario
   */
  public async findByUserId(userId: string): Promise<SavedAuditLog[]> {
    // HUMAN REVIEW: En producción:
    // const result = await this.pool.query(
    //   'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 100',
    //   [userId]
    // );
    // return result.rows.map(row => this.mapRowToAuditLog(row));

    console.log(`[Database] Query: SELECT * FROM audit_logs WHERE user_id = '${userId}'`);
    return [];
  }

  /**
   * Busca logs de auditoría por ID de paciente
   *
   * @param patientId - ID del paciente a buscar
   * @returns Array de logs relacionados al paciente
   */
  public async findByPatientId(patientId: string): Promise<SavedAuditLog[]> {
    console.log(`[Database] Query: SELECT * FROM audit_logs WHERE patient_id = '${patientId}'`);
    return [];
  }

  /**
   * Busca logs de auditoría por tipo de acción
   *
   * @param action - Tipo de acción (ej. 'TRIAGE_CALCULATION')
   * @returns Array de logs de la acción especificada
   */
  public async findByAction(action: string): Promise<SavedAuditLog[]> {
    console.log(`[Database] Query: SELECT * FROM audit_logs WHERE action = '${action}'`);
    return [];
  }

  /**
   * Genera un ID único para el log de auditoría
   *
   * HUMAN REVIEW: En producción, usar UUID v4 o dejar que PostgreSQL
   * genere el ID con una secuencia o columna SERIAL.
   */
  private generateLogId(): string {
    return `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Simula delay de escritura a base de datos
   *
   * HUMAN REVIEW: Método temporal para simular operación asíncrona de I/O.
   * Eliminar cuando se integre con PostgreSQL real.
   */
  private async simulateDatabaseWrite(): Promise<void> {
    // HUMAN REVIEW: Simular 10-50ms de latencia de escritura a DB
    const latency = Math.random() * 40 + 10;
    await new Promise((resolve) => setTimeout(resolve, latency));
  }

  /**
   * Método estático facade para compatibilidad con tests
   *
   * HUMAN REVIEW: Este método estático mantiene compatibilidad con el test actual.
   * En refactorización futura, preferir inyección de dependencias:
   *
   * class AuditService {
   *   constructor(private auditRepository: IAuditRepository) {}
   * }
   */
  public static async saveLog(data: AuditLogData): Promise<SavedAuditLog> {
    const instance = Database.getInstance();
    return await instance.saveLog(data);
  }

  /**
   * Métodos estáticos para consultas
   */
  public static async findByUserId(userId: string): Promise<SavedAuditLog[]> {
    const instance = Database.getInstance();
    return await instance.findByUserId(userId);
  }

  public static async findByPatientId(patientId: string): Promise<SavedAuditLog[]> {
    const instance = Database.getInstance();
    return await instance.findByPatientId(patientId);
  }

  public static async findByAction(action: string): Promise<SavedAuditLog[]> {
    const instance = Database.getInstance();
    return await instance.findByAction(action);
  }

  /**
   * Cierra la conexión a la base de datos
   *
   * HUMAN REVIEW: Llamar en shutdown graceful para cerrar pool de conexiones.
   */
  public async close(): Promise<void> {
    console.log('[Database] Closing connection pool...');
    // HUMAN REVIEW: En producción:
    // await this.pool.end();
    Database.instance = null;
  }

  /**
   * Método estático para cerrar la conexión
   */
  public static async shutdown(): Promise<void> {
    if (Database.instance) {
      await Database.instance.close();
    }
  }
}
