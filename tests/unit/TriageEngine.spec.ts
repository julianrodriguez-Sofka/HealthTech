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
});