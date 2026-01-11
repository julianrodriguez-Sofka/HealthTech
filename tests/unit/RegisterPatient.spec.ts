// tests/unit/RegisterPatient.spec.ts
import { PatientService } from '../../src/application/PatientService';
import type { IPatientRepository } from '@domain/repositories';
import type { IIdGenerator } from '@application/interfaces';
import { Result } from '@shared/Result';
import { InvalidAgeError } from '@domain/errors';

/**
 * HUMAN REVIEW: Tests refactorizados para usar DI (constructor injection)
 * PatientService ahora es una instancia con dependencias inyectadas
 */
describe('US-001: Registro de Paciente (Fase Roja)', () => {
    let patientService: PatientService;
    let mockPatientRepository: jest.Mocked<IPatientRepository>;
    let mockIdGenerator: jest.Mocked<IIdGenerator>;

    beforeEach(() => {
        // HUMAN REVIEW: Setup de mocks para cada test
        mockPatientRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByDocumentId: jest.fn(),
            findAll: jest.fn()
        } as jest.Mocked<IPatientRepository>;

        mockIdGenerator = {
            generate: jest.fn().mockReturnValue('patient-uuid-123')
        } as jest.Mocked<IIdGenerator>;

        patientService = new PatientService(
            mockPatientRepository,
            mockIdGenerator
        );
    });
    
    it('debe retornar error si la fecha de nacimiento es posterior a la fecha actual', async () => {
        // Arrange
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Mañana

        const patientData = {
            firstName: "Juan",
            lastName: "Pérez",
            birthDate: futureDate,
            gender: "M"
        };

        // Act
        const result = await patientService.register(patientData);

        // Assert
        // HUMAN REVIEW: Ahora usamos Result Pattern, no excepciones
        expect(result.isFailure).toBe(true);
        expect(result.error).toBeInstanceOf(InvalidAgeError);
        expect(result.error?.message).toContain('Birth date cannot be in the future');
    });

    it('debe registrar un paciente exitosamente con datos válidos', async () => {
        // Arrange
        const patientData = {
            firstName: "Juan",
            lastName: "Pérez",
            birthDate: new Date('1990-05-15'),
            gender: "M",
            documentId: "123456789"
        };

        // Mock: Guardado exitoso
        mockPatientRepository.save.mockResolvedValue(
            Result.ok({ 
                id: 'patient-uuid-123', 
                ...patientData, 
                registeredAt: new Date() 
            })
        );

        // Act
        const result = await patientService.register(patientData);

        // Assert
        expect(result.isSuccess).toBe(true);
        expect(result.value?.id).toBe('patient-uuid-123');
        expect(result.value?.firstName).toBe('Juan');
        expect(mockPatientRepository.save).toHaveBeenCalled();
    });

    it('debe retornar error si falta el nombre', async () => {
        // Arrange
        const patientData = {
            firstName: "",
            lastName: "Pérez",
            birthDate: new Date('1990-05-15'),
            gender: "M"
        };

        // Act
        const result = await patientService.register(patientData);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('First name is required');
    });

    it('debe retornar error si la fecha de nacimiento indica más de 150 años', async () => {
        // Arrange
        const veryOldDate = new Date();
        veryOldDate.setFullYear(veryOldDate.getFullYear() - 151);

        const patientData = {
            firstName: "Juan",
            lastName: "Pérez",
            birthDate: veryOldDate,
            gender: "M"
        };

        // Act
        const result = await patientService.register(patientData);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error).toBeInstanceOf(InvalidAgeError);
        expect(result.error?.message).toContain('150 years');
    });
});