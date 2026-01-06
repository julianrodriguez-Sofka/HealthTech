// tests/unit/TriageEngine.spec.ts
import { TriageEngine } from '../../src/domain/TriageEngine';

describe('US-003: Motor de Triaje - Cálculo de Prioridad 1', () => {

    it('debe asignar Prioridad 1 si la Frecuencia Cardíaca es > 120 bpm (Criterio Clínico)', () => {
        const vitals = {
            heartRate: 125,
            temperature: 37,
            oxygenSaturation: 98
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(1);
    });

    it('debe asignar Prioridad 1 si la Temperatura es > 40°C (Criterio Clínico)', () => {
        const vitals = {
            heartRate: 80,
            temperature: 40.5,
            oxygenSaturation: 98
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(1);
    });

    it('debe asignar Prioridad 1 si la Saturación de Oxígeno es < 90% (Criterio Clínico)', () => {
        const vitals = {
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: 88
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(1);
    });

    it('debe asignar Prioridad 5 si todos los signos vitales son normales', () => {
        // HUMAN REVIEW: Valores normales - no críticos
        const vitals = {
            heartRate: 75,
            temperature: 36.8,
            oxygenSaturation: 98
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(5);
    });

    it('debe asignar Prioridad 1 con valores en el límite exacto (heartRate = 121)', () => {
        // HUMAN REVIEW: Edge case - justo por encima del umbral
        const vitals = {
            heartRate: 121,
            temperature: 37,
            oxygenSaturation: 98
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(1);
    });

    it('debe asignar Prioridad 5 con valores en el límite justo debajo (heartRate = 120)', () => {
        // HUMAN REVIEW: Edge case - justo en el umbral (no debe ser crítico)
        const vitals = {
            heartRate: 120,
            temperature: 37,
            oxygenSaturation: 98
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(5);
    });

    it('debe asignar Prioridad 1 con temperatura = 40.1°C', () => {
        // HUMAN REVIEW: Edge case - justo por encima del umbral
        const vitals = {
            heartRate: 80,
            temperature: 40.1,
            oxygenSaturation: 98
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(1);
    });

    it('debe asignar Prioridad 5 con temperatura = 40°C (límite exacto)', () => {
        // HUMAN REVIEW: Edge case - en el umbral
        const vitals = {
            heartRate: 80,
            temperature: 40,
            oxygenSaturation: 98
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(5);
    });

    it('debe asignar Prioridad 1 con saturación = 89%', () => {
        // HUMAN REVIEW: Edge case - justo por debajo del umbral
        const vitals = {
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: 89
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(1);
    });

    it('debe asignar Prioridad 5 con saturación = 90% (límite exacto)', () => {
        // HUMAN REVIEW: Edge case - en el umbral
        const vitals = {
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: 90
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(5);
    });

    it('debe asignar Prioridad 1 si múltiples signos vitales son críticos', () => {
        // HUMAN REVIEW: Múltiples criterios críticos simultáneos
        const vitals = {
            heartRate: 150,
            temperature: 41,
            oxygenSaturation: 85
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(1);
    });
});