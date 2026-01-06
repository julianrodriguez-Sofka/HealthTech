// tests/unit/NotificationService.spec.ts
import { NotificationService } from '../../src/application/NotificationService';
import type { IMessagingService, IIdGenerator } from '@application/interfaces';
import { Result } from '@shared/Result';

/**
 * HUMAN REVIEW: Tests refactorizados para usar DI (constructor injection)
 * NotificationService ahora es una instancia con dependencias inyectadas
 */
describe('US-005: Notificación de Alta Prioridad (Fase Roja)', () => {
    let notificationService: NotificationService;
    let mockMessagingService: jest.Mocked<IMessagingService>;
    let mockIdGenerator: jest.Mocked<IIdGenerator>;

    beforeEach(() => {
        // HUMAN REVIEW: Setup de mocks para cada test
        mockMessagingService = {
            isConnected: jest.fn().mockReturnValue(true),
            publishToQueue: jest.fn().mockResolvedValue(Result.ok(undefined)),
            close: jest.fn()
        } as jest.Mocked<IMessagingService>;

        mockIdGenerator = {
            generate: jest.fn().mockReturnValue('notification-uuid-123')
        } as jest.Mocked<IIdGenerator>;

        notificationService = new NotificationService(
            mockMessagingService,
            mockIdGenerator
        );
    });

    it('debe publicar un mensaje en RabbitMQ cuando la prioridad es 1 o 2', async () => {
        // Arrange
        const triageEvent = {
            patientId: "uuid-123",
            priority: 1,
            reason: "Frecuencia Cardíaca Crítica"
        };

        // Act
        const result = await notificationService.notifyHighPriority(triageEvent);

        // Assert
        // HUMAN REVIEW: Verificar que el servicio de mensajería fue llamado
        expect(result.isSuccess).toBe(true);
        expect(mockMessagingService.publishToQueue).toHaveBeenCalledWith(
            'triage_high_priority',
            expect.stringContaining('"patientId":"uuid-123"')
        );
        expect(mockMessagingService.publishToQueue).toHaveBeenCalledTimes(1);
    });

    it('NO debe publicar mensaje si la prioridad es 3, 4 o 5', async () => {
        // Arrange
        const triageEvent = {
            patientId: "uuid-456",
            priority: 3,
            reason: "Urgente pero no crítico"
        };

        // Act
        const result = await notificationService.notifyHighPriority(triageEvent);

        // Assert
        // HUMAN REVIEW: Prioridad 3 no requiere notificación inmediata
        expect(result.isSuccess).toBe(true);
        expect(mockMessagingService.publishToQueue).not.toHaveBeenCalled();
    });

    it('debe retornar error si falta el patientId', async () => {
        // Arrange
        const triageEvent = {
            patientId: "",
            priority: 1,
            reason: "Test"
        };

        // Act
        const result = await notificationService.notifyHighPriority(triageEvent);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('Patient ID is required');
    });

    it('debe retornar error si la prioridad es inválida', async () => {
        // Arrange
        const triageEvent = {
            patientId: "uuid-123",
            priority: 6, // Inválida (debe ser 1-5)
            reason: "Test"
        };

        // Act
        const result = await notificationService.notifyHighPriority(triageEvent);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('Invalid priority level');
    });

    it('debe retornar error si el servicio de mensajería no está disponible', async () => {
        // Arrange
        const triageEvent = {
            patientId: "uuid-123",
            priority: 1,
            reason: "Test"
        };

        // Mock: Servicio de mensajería no disponible
        mockMessagingService.isConnected.mockReturnValue(false);

        // Act
        const result = await notificationService.notifyHighPriority(triageEvent);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('RabbitMQ is not available');
    });
});