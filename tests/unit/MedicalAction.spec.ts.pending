// tests/unit/MedicalAction.spec.ts
import { MedicalService } from '../../src/application/MedicalService';
import { Database } from '../../src/infrastructure/database/Database';

jest.mock('../../src/infrastructure/database/Database');

describe('US-008: Aceptación de Caso por Médico (Fase Roja)', () => {

    it('debe asignar el médico al paciente y cambiar el estado a "EN_ATENCION"', async () => {
        const assignmentData = {
            triageId: "triage-456",
            medicId: "medic-789"
        };

        const updateSpy = jest.spyOn(Database, 'updateTriageStatus').mockResolvedValue({
            triageId: "triage-456",
            status: "EN_ATENCION",
            medicId: "medic-789",
            updatedAt: new Date()
        });

        await MedicalService.acceptPatient(assignmentData);

        // Fallará porque MedicalService no existe
        expect(updateSpy).toHaveBeenCalledWith(
            "triage-456", 
            "EN_ATENCION", 
            "medic-789"
        );
    });
});