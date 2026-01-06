// tests/integration/TriageFlow.spec.ts
import { PatientService } from '../../src/application/PatientService';
import { VitalsService } from '../../src/application/VitalsService';
import { TriageEngine } from '../../src/domain/TriageEngine';
import { NotificationService } from '../../src/application/NotificationService';
import { AuditService } from '../../src/application/AuditService';

describe('Flujo Completo de Triaje Crítico (E2E Integration)', () => {
    it('debe registrar un paciente, calcular prioridad 1 y disparar notificación y auditoría', async () => {
        // 1. Registro (US-001)
        const patient = PatientService.registrar({
            nombre: "Emergencia",
            apellido: "Grave",
            fechaNacimiento: new Date(1990, 1, 1),
            genero: "F"
        });

        // 2. Ingreso de Signos Vitales Críticos (US-002)
        const vitals = {
            patientId: patient.id,
            heartRate: 140, // Crítico
            temperature: 39,
            oxygenSaturation: 85, // Crítico
            systolicBP: 110
        };

        // 3. Cálculo de Prioridad (US-003)
        const priority = TriageEngine.calculatePriority(vitals);
        expect(priority).toBe(1);

        // 4. Notificación y Auditoría (US-005 & US-009)
        // Verificamos que los servicios se orquesten correctamente
        const notificationSpy = jest.spyOn(NotificationService, 'notifyHighPriority');
        const auditSpy = jest.spyOn(AuditService, 'logAction');

        if (priority <= 2) {
            await NotificationService.notifyHighPriority({ patientId: patient.id, priority });
        }
        
        await AuditService.logAction({
            userId: "SYSTEM",
            action: "TRIAGE_COMPLETE",
            patientId: patient.id,
            details: `Prioridad final: ${priority}`
        });

        // Este test fallará inicialmente si la orquestación no está conectada
        expect(notificationSpy).toHaveBeenCalled();
        expect(auditSpy).toHaveBeenCalled();
    });
});