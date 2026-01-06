// tests/unit/RegisterPatient.spec.ts
import { PatientService } from '../../src/application/PatientService';

describe('US-001: Registro de Paciente (Fase Roja)', () => {
    
    it('debe lanzar un error si la fecha de nacimiento es posterior a la fecha actual', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Mañana

        const patientData = {
            firstName: "Juan",
            lastName: "Pérez",
            birthDate: futureDate,
            gender: "M"
        };

        // La expectativa es que el servicio lance un error específico
        expect(() => PatientService.register(patientData)).toThrow("Invalid birth date");
    });
});