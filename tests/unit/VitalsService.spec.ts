// tests/unit/VitalsService.spec.ts
import { VitalsService } from '../../src/application/VitalsService';
import type { IVitalsRepository, IPatientRepository } from '@domain/repositories';
import type { IIdGenerator } from '@application/interfaces';
import { Result } from '@shared/Result';
import { PhysiologicalLimitExceededError } from '@domain/errors';

/**
 * HUMAN REVIEW: Tests refactorizados para usar DI (constructor injection)
 * VitalsService ahora es una instancia con dependencias inyectadas
 */
describe('US-002: Ingreso de Signos Vitales - Blindaje y Validaciones', () => {
    let vitalsService: VitalsService;
    let mockVitalsRepository: jest.Mocked<IVitalsRepository>;
    let mockPatientRepository: jest.Mocked<IPatientRepository>;
    let mockIdGenerator: jest.Mocked<IIdGenerator>;

    beforeEach(() => {
        // HUMAN REVIEW: Setup de mocks para cada test
        mockVitalsRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByPatientId: jest.fn(),
            findAll: jest.fn()
        } as jest.Mocked<IVitalsRepository>;

        mockPatientRepository = {
            save: jest.fn(),
            findById: jest.fn(),
            findByDocumentId: jest.fn(),
            findAll: jest.fn()
        } as jest.Mocked<IPatientRepository>;

        mockIdGenerator = {
            generate: jest.fn().mockReturnValue('generated-uuid-123')
        } as jest.Mocked<IIdGenerator>;

        vitalsService = new VitalsService(
            mockVitalsRepository,
            mockPatientRepository,
            mockIdGenerator
        );
    });

    it('debe retornar error si la Saturación de Oxígeno es superior al 100%', async () => {
        // Arrange
        const vitalsData = {
            patientId: "uuid-123",
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: 105, // Valor imposible (fisiológicamente máximo es 100%)
            systolicBP: 120
        };

        // Mock: Paciente existe
        mockPatientRepository.findById.mockResolvedValue(
            Result.ok({ id: 'uuid-123', firstName: 'John', lastName: 'Doe', birthDate: new Date('1990-01-01'), gender: 'M', registeredAt: new Date() })
        );

        // Act
        const result = await vitalsService.recordVitals(vitalsData);

        // Assert
        // HUMAN REVIEW: Ahora usamos Result Pattern, no excepciones
        expect(result.isFailure).toBe(true);
        expect(result.error).toBeInstanceOf(PhysiologicalLimitExceededError);
        expect(result.error?.message).toContain('oxygenSaturation value 105 exceeds physiological limits');
    });

    it('debe retornar error si algún valor vital es negativo', async () => {
        // Arrange
        const vitalsData = {
            patientId: "uuid-123",
            heartRate: -60, // Valor imposible (negativo)
            temperature: 37,
            oxygenSaturation: 95,
            systolicBP: 120
        };

        // Mock: Paciente existe
        mockPatientRepository.findById.mockResolvedValue(
            Result.ok({ id: 'uuid-123', firstName: 'John', lastName: 'Doe', birthDate: new Date('1990-01-01'), gender: 'M', registeredAt: new Date() })
        );

        // Act
        const result = await vitalsService.recordVitals(vitalsData);

        // Assert
        // HUMAN REVIEW: Validación de valores negativos retorna VitalsValidationError
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('Los signos vitales no pueden ser negativos');
    });

    it('debe retornar error si el paciente no existe', async () => {
        // Arrange
        const vitalsData = {
            patientId: "non-existent-patient",
            heartRate: 75,
            temperature: 36.5,
            oxygenSaturation: 98,
            systolicBP: 120
        };

        // Mock: Paciente no encontrado
        mockPatientRepository.findById.mockResolvedValue(Result.ok(null));

        // Act
        const result = await vitalsService.recordVitals(vitalsData);

        // Assert
        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('not found');
    });

    it('debe registrar vitales exitosamente con valores normales', async () => {
        // Arrange
        const vitalsData = {
            patientId: "uuid-123",
            heartRate: 75,
            temperature: 36.8,
            oxygenSaturation: 98,
            systolicBP: 120
        };

        // Mock: Paciente existe y guardado exitoso
        mockPatientRepository.findById.mockResolvedValue(
            Result.ok({ id: 'uuid-123', firstName: 'John', lastName: 'Doe', birthDate: new Date('1990-01-01'), gender: 'M', registeredAt: new Date() })
        );
        mockVitalsRepository.save.mockResolvedValue(Result.ok({ id: 'vitals-123', ...vitalsData, isAbnormal: false, isCritical: false, recordedAt: new Date() }));

        // Act
        const result = await vitalsService.recordVitals(vitalsData);

        // Assert
        expect(result.isSuccess).toBe(true);
        expect(result.value?.id).toBe('generated-uuid-123');
        expect(result.value?.heartRate).toBe(75);
        expect(mockVitalsRepository.save).toHaveBeenCalled();
    });

    it('debe detectar valores críticos correctamente', async () => {
        // Arrange
        const vitalsData = {
            patientId: "uuid-123",
            heartRate: 125, // Crítico (>120)
            temperature: 36.8,
            oxygenSaturation: 88, // Crítico (<90)
            systolicBP: 120
        };

        // Mock: Paciente existe y guardado exitoso
        mockPatientRepository.findById.mockResolvedValue(
            Result.ok({ id: 'uuid-123', firstName: 'John', lastName: 'Doe', birthDate: new Date('1990-01-01'), gender: 'M', registeredAt: new Date() })
        );
        mockVitalsRepository.save.mockResolvedValue(Result.ok({ id: 'vitals-123', ...vitalsData, isAbnormal: true, isCritical: true, recordedAt: new Date() }));

        // Act
        const result = await vitalsService.recordVitals(vitalsData);

        // Assert
        expect(result.isSuccess).toBe(true);
        expect(result.value?.isCritical).toBe(true);
        expect(result.value?.isAbnormal).toBe(true);
    });
});