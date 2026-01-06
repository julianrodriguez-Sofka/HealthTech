/**
 * In-Memory Audit Repository - Infrastructure Layer
 * 
 * Implementación en memoria del repositorio de auditoría.
 */

import { Result } from '@shared/Result';
import type { IAuditRepository, AuditLogData, AuditSearchCriteria } from '@domain/repositories';

export class InMemoryAuditRepository implements IAuditRepository {
  private logs: Map<string, AuditLogData> = new Map();
  private userIndex: Map<string, string[]> = new Map();
  private patientIndex: Map<string, string[]> = new Map();
  private actionIndex: Map<string, string[]> = new Map();

  async save(auditLog: AuditLogData): Promise<Result<AuditLogData, Error>> {
    this.logs.set(auditLog.id, { ...auditLog });
    
    // HUMAN REVIEW: Indexar por usuario
    const userLogs = this.userIndex.get(auditLog.userId) || [];
    userLogs.push(auditLog.id);
    this.userIndex.set(auditLog.userId, userLogs);
    
    // HUMAN REVIEW: Indexar por paciente si existe
    if (auditLog.patientId) {
      const patientLogs = this.patientIndex.get(auditLog.patientId) || [];
      patientLogs.push(auditLog.id);
      this.patientIndex.set(auditLog.patientId, patientLogs);
    }
    
    // HUMAN REVIEW: Indexar por acción
    const actionLogs = this.actionIndex.get(auditLog.action) || [];
    actionLogs.push(auditLog.id);
    this.actionIndex.set(auditLog.action, actionLogs);

    return Result.ok({ ...auditLog });
  }

  async findByUserId(userId: string): Promise<Result<AuditLogData[], Error>> {
    const logIds = this.userIndex.get(userId) || [];
    const logs = logIds.map(id => this.logs.get(id)!).filter(l => l !== undefined);
    return Result.ok(logs.map(l => ({ ...l })));
  }

  async findByPatientId(patientId: string): Promise<Result<AuditLogData[], Error>> {
    const logIds = this.patientIndex.get(patientId) || [];
    const logs = logIds.map(id => this.logs.get(id)!).filter(l => l !== undefined);
    return Result.ok(logs.map(l => ({ ...l })));
  }

  async findByAction(action: string): Promise<Result<AuditLogData[], Error>> {
    const logIds = this.actionIndex.get(action) || [];
    const logs = logIds.map(id => this.logs.get(id)!).filter(l => l !== undefined);
    return Result.ok(logs.map(l => ({ ...l })));
  }

  async search(criteria: AuditSearchCriteria): Promise<Result<AuditLogData[], Error>> {
    let results = Array.from(this.logs.values());

    if (criteria.userId) {
      results = results.filter(log => log.userId === criteria.userId);
    }

    if (criteria.patientId) {
      results = results.filter(log => log.patientId === criteria.patientId);
    }

    if (criteria.action) {
      results = results.filter(log => log.action === criteria.action);
    }

    if (criteria.startDate) {
      results = results.filter(log => log.timestamp >= criteria.startDate!);
    }

    if (criteria.endDate) {
      results = results.filter(log => log.timestamp <= criteria.endDate!);
    }

    const start = criteria.offset || 0;
    const end = criteria.limit ? start + criteria.limit : results.length;
    const paginated = results.slice(start, end);

    return Result.ok(paginated.map(l => ({ ...l })));
  }

  clear(): void {
    this.logs.clear();
    this.userIndex.clear();
    this.patientIndex.clear();
    this.actionIndex.clear();
  }
}
