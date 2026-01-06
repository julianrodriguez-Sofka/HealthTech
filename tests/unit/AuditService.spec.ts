// tests/unit/AuditService.spec.ts
import { AuditService } from '../../src/application/AuditService';
import type { IAuditRepository } from '@domain/repositories';
import type { IIdGenerator } from '@application/interfaces';
import { Result } from '@shared/Result';

/**
 * HUMAN REVIEW: Tests refactorizados para usar DI (constructor injection)
 * AuditService ahora es una instancia con dependencias inyectadas
 */
describe('US-009: Registro de Auditoría - Trazabilidad SQL (Fase Roja)', () => {
    let auditService: AuditService;
    let mockAuditRepository: jest.Mocked<IAuditRepository>;
    let mockIdGenerator: jest.Mocked<IIdGenerator>;

    beforeEach(() => {
        // HUMAN REVIEW: Setup de mocks para cada test
        mockAuditRepository = {
            save: jest.fn().mockResolvedValue(Result.ok({ id: 'audit-123' })),
            findById: jest.fn(),
            findByUserId: jest.fn(),
            findByAction: jest.fn(),
            findByPatientId: jest.fn(),
            search: jest.fn(),
            findAll: jest.fn()
        } as jest.Mocked<IAuditRepository>;

        mockIdGenerator = {
            generate: jest.fn().mockReturnValue('audit-uuid-123')
        } as jest.Mocked<IIdGenerator>;

        auditService = new AuditService(
            mockAuditRepository,
            mockIdGenerator
        );
    });

    it('debe guardar un log de auditoría cuando se asigna una prioridad', async () => {
        // Arrange
        const auditData = {
            userId: "admin-001",
            action: "TRIAGE_CALCULATION",
            patientId: "patient-999",
            details: "Prioridad asignada: 1"
        };

        // Act
        const result = await auditService.logAction(auditData);

        // Assert
        // HUMAN REVIEW: Verificar que el repositorio fue llamado con los datos correctos
        expect(result.isSuccess).toBe(true);
        expect(result.value?.success).toBe(true);
        expect(mockAuditRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "TRIAGE_CALCULATION",
                userId: "admin-001",
                patientId: "patient-999",
                timestamp: expect.any(Date)
            })
        );
        expect(mockAuditRepository.save).toHaveBeenCalledTimes(1);
    });

    it('debe retornar error si falta el userId', async () => {
        // Arrange
        const auditData = {
            userId: "",
            action: "TRIAGE_CALCULATION",
            patientId: "patient-999"
        };

        // Act
        const result = await auditService.logAction(auditData);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('User ID is required');
    });

    it('debe retornar error si falta la action', async () => {
        // Arrange
        const auditData = {
            userId: "admin-001",
            action: "",
            patientId: "patient-999"
        };

        // Act
        const result = await auditService.logAction(auditData);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('Action is required');
    });

    it('debe registrar auditoría exitosamente incluso sin patientId', async () => {
        // Arrange
        const auditData = {
            userId: "admin-001",
            action: "USER_LOGIN"
            // No patientId (acciones de sistema no siempre están vinculadas a un paciente)
        };

        // Act
        const result = await auditService.logAction(auditData);

        // Assert
        expect(result.isSuccess).toBe(true);
        expect(result.value?.success).toBe(true);
        expect(mockAuditRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                action: "USER_LOGIN",
                userId: "admin-001"
            })
        );
    });
});