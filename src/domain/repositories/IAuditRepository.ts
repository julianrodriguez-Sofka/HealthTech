/**
 * Audit Repository Interface - Domain Layer
 * 
 * Define el contrato para persistencia de logs de auditoría.
 * 
 * HUMAN REVIEW: La auditoría es crítica para cumplimiento normativo
 * y trazabilidad de decisiones médicas. Debe ser append-only y inmutable.
 */

import { Result } from '@shared/Result';

/**
 * Datos de log de auditoría para persistencia
 */
export interface AuditLogData {
  id: string;
  userId: string;
  action: string;
  patientId?: string;
  details?: string;  // Opcional
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Criterios de búsqueda para auditoría
 */
export interface AuditSearchCriteria {
  userId?: string;
  patientId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Contrato del repositorio de auditoría
 */
export interface IAuditRepository {
  /**
   * Guarda un log de auditoría
   * 
   * HUMAN REVIEW: Este método NO debe fallar. Si la persistencia falla,
   * debe tener un mecanismo de fallback (ej. escribir a archivo local).
   * 
   * @param auditLog - Datos del log a guardar
   * @returns Result con el log guardado
   */
  save(auditLog: AuditLogData): Promise<Result<AuditLogData, Error>>;

  /**
   * Busca logs por usuario
   * 
   * @param userId - ID del usuario
   * @returns Result con array de logs
   */
  findByUserId(userId: string): Promise<Result<AuditLogData[], Error>>;

  /**
   * Busca logs por paciente
   * 
   * @param patientId - ID del paciente
   * @returns Result con array de logs
   */
  findByPatientId(patientId: string): Promise<Result<AuditLogData[], Error>>;

  /**
   * Busca logs por tipo de acción
   * 
   * @param action - Tipo de acción
   * @returns Result con array de logs
   */
  findByAction(action: string): Promise<Result<AuditLogData[], Error>>;

  /**
   * Búsqueda avanzada con múltiples criterios
   * 
   * @param criteria - Criterios de búsqueda
   * @returns Result con array de logs
   */
  search(criteria: AuditSearchCriteria): Promise<Result<AuditLogData[], Error>>;
}
