// tests/integration/TriageFlow.spec.ts
import { ProcessTriageUseCase } from '../../src/application/use-cases/ProcessTriageUseCase';
import { NotificationService } from '../../src/application/NotificationService';
import { AuditService } from '../../src/application/AuditService';
import { MessagingService } from '../../src/infrastructure/messaging/MessagingService';
import { Database } from '../../src/infrastructure/database/Database';

// Mock de infraestructura para evitar dependencias externas
jest.mock('../../src/infrastructure/messaging/MessagingService');
jest.mock('../../src/infrastructure/database/Database');

describe('Flujo Completo de Triaje Crítico (E2E Integration)', () => {
    beforeEach(() => {
        // HUMAN REVIEW: Limpiar mocks antes de cada test
        jest.clearAllMocks();
    });

    it('debe registrar un paciente, calcular prioridad 1 y disparar notificación y auditoría', async () => {
        // HUMAN REVIEW: Mock de MessagingService para no requerir RabbitMQ
        jest.spyOn(MessagingService, 'publishToQueue').mockResolvedValue(undefined);

        // HUMAN REVIEW: Mock de Database para no requerir PostgreSQL
        jest.spyOn(Database, 'saveLog').mockResolvedValue({
            id: 'AUDIT-123',
            userId: 'SYSTEM',
            action: 'TRIAGE_CALCULATION',
            patientId: 'PATIENT-123',
            details: 'Test audit',
            timestamp: new Date(),
            savedAt: new Date()
        });

        // HUMAN REVIEW: Spies para verificar que se llamen los servicios
        const notificationSpy = jest.spyOn(NotificationService, 'notifyHighPriority');
        const auditSpy = jest.spyOn(AuditService, 'logAction');

        // HUMAN REVIEW: Ejecutar el Use Case completo con datos críticos
        const result = await ProcessTriageUseCase.execute({
            patient: {
                nombre: "Emergencia",
                apellido: "Grave",
                fechaNacimiento: new Date(1990, 1, 1),
                genero: "F"
            },
            vitals: {
                heartRate: 140,        // Crítico (>120)
                temperature: 39,       // Normal
                oxygenSaturation: 85,  // Crítico (<90)
                systolicBP: 110
            },
            userId: "SYSTEM",
            reason: "Signos vitales críticos"
        });

        // HUMAN REVIEW: Verificar resultado exitoso
        expect(result.success).toBe(true);
        expect(result.priority).toBe(1);  // Debe asignar prioridad 1
        expect(result.notificationSent).toBe(true);  // Debe enviar notificación

        // HUMAN REVIEW: Verificar que se llamó a NotificationService
        expect(notificationSpy).toHaveBeenCalledTimes(1);
        expect(notificationSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                patientId: expect.any(String),
                priority: 1,
                reason: expect.stringContaining('Taquicardia Severa')
            })
        );

        // HUMAN REVIEW: Verificar que se llamó a AuditService
        expect(auditSpy).toHaveBeenCalledTimes(1);
        expect(auditSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'SYSTEM',
                action: 'TRIAGE_CALCULATION',
                patientId: expect.any(String),
                details: expect.stringContaining('Prioridad: 1')
            })
        );

        // HUMAN REVIEW: Verificar datos del paciente
        expect(result.patient.firstName).toBe('Emergencia');
        expect(result.patient.lastName).toBe('Grave');

        // HUMAN REVIEW: Verificar signos vitales registrados
        expect(result.vitals.heartRate).toBe(140);
        expect(result.vitals.oxygenSaturation).toBe(85);
        expect(result.vitals.isCritical).toBe(true);
    });

    it('debe manejar un caso de prioridad 5 sin enviar notificación', async () => {
        // HUMAN REVIEW: Mock de infraestructura
        jest.spyOn(MessagingService, 'publishToQueue').mockResolvedValue(undefined);
        jest.spyOn(Database, 'saveLog').mockResolvedValue({
            id: 'AUDIT-456',
            userId: 'SYSTEM',
            action: 'TRIAGE_CALCULATION',
            patientId: 'PATIENT-456',
            details: 'Test audit',
            timestamp: new Date(),
            savedAt: new Date()
        });

        const notificationSpy = jest.spyOn(NotificationService, 'notifyHighPriority');
        const auditSpy = jest.spyOn(AuditService, 'logAction');

        // HUMAN REVIEW: Ejecutar con signos vitales normales
        const result = await ProcessTriageUseCase.execute({
            patient: {
                nombre: "Consulta",
                apellido: "Rutinaria",
                fechaNacimiento: new Date(1995, 5, 15),
                genero: "M"
            },
            vitals: {
                heartRate: 80,         // Normal
                temperature: 37,       // Normal
                oxygenSaturation: 98,  // Normal
                systolicBP: 120
            },
            userId: "SYSTEM"
        });

        // HUMAN REVIEW: Verificar resultado
        expect(result.success).toBe(true);
        expect(result.priority).toBe(5);  // Prioridad más baja
        expect(result.notificationSent).toBe(false);  // NO debe notificar

        // HUMAN REVIEW: NotificationService NO debe ser llamado
        expect(notificationSpy).not.toHaveBeenCalled();

        // HUMAN REVIEW: AuditService SÍ debe ser llamado
        expect(auditSpy).toHaveBeenCalledTimes(1);
    });
});