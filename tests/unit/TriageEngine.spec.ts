// tests/unit/TriageEngine.spec.ts
import { TriageEngine, TriageVitals, TriagePriority } from '../../src/domain/TriageEngine';

// ===== PRIORIDAD 1 - CRÍTICO (RESUCITACIÓN) =====
describe('US-003: Motor de Triaje - Prioridad 1 (Crítico)', () => {

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

    it('debe asignar Prioridad 1 con bradycardia severa (HR < 40 bpm)', () => {
        // HUMAN REVIEW: Bradycardia severa también es crítica
        const vitals = {
            heartRate: 35,
            temperature: 37,
            oxygenSaturation: 98
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(1);
    });

    it('debe asignar Prioridad 1 con hipotermia severa (T < 35°C)', () => {
        // HUMAN REVIEW: Hipotermia severa es crítica
        const vitals = {
            heartRate: 80,
            temperature: 34.5,
            oxygenSaturation: 98
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(1);
    });

    it('debe asignar Prioridad 1 con hipoxemia crítica (SpO2 < 85%)', () => {
        // HUMAN REVIEW: SpO2 muy baja = crítico
        const vitals = {
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: 82
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(1);
    });
});

// ===== PRIORIDAD 5 - NO URGENTE =====
describe('US-003: Motor de Triaje - Prioridad 5 (No Urgente)', () => {

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

    it('debe asignar Prioridad 5 con vitales óptimos', () => {
        const vitals = {
            heartRate: 70,
            temperature: 36.5,
            oxygenSaturation: 99
        };
        const result = TriageEngine.calculatePriority(vitals);
        expect(result).toBe(5);
    });
});

// ===== VALIDACIÓN DE ERRORES =====
describe('US-003: Motor de Triaje - Validación de Errores', () => {

    it('debe lanzar error si vitals es null', () => {
        // HUMAN REVIEW: Validación crítica - no puede calcular sin datos
        expect(() => {
            TriageEngine.calculatePriority(null as any);
        }).toThrow('Vital signs are required for triage calculation');
    });

    it('debe lanzar error si vitals es undefined', () => {
        expect(() => {
            TriageEngine.calculatePriority(undefined as any);
        }).toThrow('Vital signs are required for triage calculation');
    });

    it('debe lanzar error si falta heartRate', () => {
        const vitals = {
            temperature: 37,
            oxygenSaturation: 98
        } as any;
        
        expect(() => {
            TriageEngine.calculatePriority(vitals);
        }).toThrow('All vital sign fields are required');
    });

    it('debe lanzar error si falta temperature', () => {
        const vitals = {
            heartRate: 80,
            oxygenSaturation: 98
        } as any;
        
        expect(() => {
            TriageEngine.calculatePriority(vitals);
        }).toThrow('All vital sign fields are required');
    });

    it('debe lanzar error si falta oxygenSaturation', () => {
        const vitals = {
            heartRate: 80,
            temperature: 37
        } as any;
        
        expect(() => {
            TriageEngine.calculatePriority(vitals);
        }).toThrow('All vital sign fields are required');
    });

    it('debe lanzar error si heartRate es null', () => {
        const vitals = {
            heartRate: null,
            temperature: 37,
            oxygenSaturation: 98
        } as any;
        
        expect(() => {
            TriageEngine.calculatePriority(vitals);
        }).toThrow('All vital sign fields are required');
    });

    it('debe lanzar error si temperature es undefined', () => {
        const vitals = {
            heartRate: 80,
            temperature: undefined,
            oxygenSaturation: 98
        } as any;
        
        expect(() => {
            TriageEngine.calculatePriority(vitals);
        }).toThrow('All vital sign fields are required');
    });
});

// ===== MÉTODO getTriggeredRules =====
describe('US-003: Motor de Triaje - getTriggeredRules (Trazabilidad)', () => {

    it('debe retornar array vacío si no se activa ninguna regla crítica', () => {
        // HUMAN REVIEW: Vitales normales = sin reglas críticas
        const vitals: TriageVitals = {
            heartRate: 75,
            temperature: 37,
            oxygenSaturation: 98
        };

        const triggered = TriageEngine.getTriggeredRules(vitals);
        expect(triggered).toHaveLength(0);
    });

    it('debe retornar 1 regla si solo se activa taquicardia severa', () => {
        const vitals: TriageVitals = {
            heartRate: 130,
            temperature: 37,
            oxygenSaturation: 98
        };

        const triggered = TriageEngine.getTriggeredRules(vitals);
        expect(triggered).toHaveLength(1);
        expect(triggered[0].name).toBe('Taquicardia Severa');
        expect(triggered[0].priority).toBe(1);
        expect(triggered[0].justification).toContain('120 bpm');
    });

    it('debe retornar 1 regla si solo se activa hipertermia extrema', () => {
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: 41,
            oxygenSaturation: 98
        };

        const triggered = TriageEngine.getTriggeredRules(vitals);
        expect(triggered).toHaveLength(1);
        expect(triggered[0].name).toBe('Hipertermia Extrema');
        expect(triggered[0].priority).toBe(1);
        expect(triggered[0].justification).toContain('40°C');
    });

    it('debe retornar 1 regla si solo se activa hipoxemia severa', () => {
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: 85
        };

        const triggered = TriageEngine.getTriggeredRules(vitals);
        expect(triggered).toHaveLength(1);
        expect(triggered[0].name).toBe('Hipoxemia Severa');
        expect(triggered[0].priority).toBe(1);
        expect(triggered[0].justification).toContain('90%');
    });

    it('debe retornar 3 reglas si se activan todas las condiciones críticas', () => {
        // HUMAN REVIEW: Caso extremo - múltiples criterios críticos
        const vitals: TriageVitals = {
            heartRate: 150,
            temperature: 42,
            oxygenSaturation: 80
        };

        const triggered = TriageEngine.getTriggeredRules(vitals);
        expect(triggered).toHaveLength(3);
        
        const ruleNames = triggered.map(r => r.name);
        expect(ruleNames).toContain('Taquicardia Severa');
        expect(ruleNames).toContain('Hipertermia Extrema');
        expect(ruleNames).toContain('Hipoxemia Severa');
    });

    it('debe retornar 2 reglas si se activan taquicardia + hipoxemia', () => {
        const vitals: TriageVitals = {
            heartRate: 135,
            temperature: 37,
            oxygenSaturation: 88
        };

        const triggered = TriageEngine.getTriggeredRules(vitals);
        expect(triggered).toHaveLength(2);
        
        const ruleNames = triggered.map(r => r.name);
        expect(ruleNames).toContain('Taquicardia Severa');
        expect(ruleNames).toContain('Hipoxemia Severa');
    });

    it('cada regla activada debe tener estructura completa', () => {
        // HUMAN REVIEW: Validar metadata completa para auditoría
        const vitals: TriageVitals = {
            heartRate: 140,
            temperature: 37,
            oxygenSaturation: 98
        };

        const triggered = TriageEngine.getTriggeredRules(vitals);
        expect(triggered).toHaveLength(1);

        const rule = triggered[0];
        expect(rule.name).toBeDefined();
        expect(rule.priority).toBeDefined();
        expect(rule.predicate).toBeDefined();
        expect(rule.justification).toBeDefined();
        expect(typeof rule.name).toBe('string');
        expect(typeof rule.priority).toBe('number');
        expect(typeof rule.predicate).toBe('function');
        expect(typeof rule.justification).toBe('string');
    });
});

// ===== MÉTODO isValidForTriage =====
describe('US-003: Motor de Triaje - isValidForTriage (Validación)', () => {

    it('debe retornar true si los signos vitales son válidos', () => {
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: 98
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(true);
    });

    it('debe retornar false si vitals es null', () => {
        const isValid = TriageEngine.isValidForTriage(null as any);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si vitals es undefined', () => {
        const isValid = TriageEngine.isValidForTriage(undefined as any);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si falta heartRate', () => {
        const vitals = {
            temperature: 37,
            oxygenSaturation: 98
        } as any;

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si falta temperature', () => {
        const vitals = {
            heartRate: 80,
            oxygenSaturation: 98
        } as any;

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si falta oxygenSaturation', () => {
        const vitals = {
            heartRate: 80,
            temperature: 37
        } as any;

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si heartRate es negativo', () => {
        const vitals: TriageVitals = {
            heartRate: -10,
            temperature: 37,
            oxygenSaturation: 98
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si heartRate es mayor a 300', () => {
        // HUMAN REVIEW: Límite fisiológico máximo
        const vitals: TriageVitals = {
            heartRate: 350,
            temperature: 37,
            oxygenSaturation: 98
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si temperature es negativa', () => {
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: -5,
            oxygenSaturation: 98
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si temperature es mayor a 45°C', () => {
        // HUMAN REVIEW: Límite incompatible con vida
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: 50,
            oxygenSaturation: 98
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si oxygenSaturation es negativa', () => {
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: -5
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si oxygenSaturation es mayor a 100%', () => {
        // HUMAN REVIEW: SpO2 no puede exceder 100%
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: 105
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });

    it('debe retornar true con valores en los límites válidos (heartRate = 0)', () => {
        // HUMAN REVIEW: Edge case - límite inferior
        const vitals: TriageVitals = {
            heartRate: 0,
            temperature: 37,
            oxygenSaturation: 98
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(true);
    });

    it('debe retornar true con valores en los límites válidos (heartRate = 300)', () => {
        // HUMAN REVIEW: Edge case - límite superior
        const vitals: TriageVitals = {
            heartRate: 300,
            temperature: 37,
            oxygenSaturation: 98
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(true);
    });

    it('debe retornar true con valores en los límites válidos (temperature = 0)', () => {
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: 0,
            oxygenSaturation: 98
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(true);
    });

    it('debe retornar true con valores en los límites válidos (temperature = 45)', () => {
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: 45,
            oxygenSaturation: 98
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(true);
    });

    it('debe retornar true con valores en los límites válidos (SpO2 = 0)', () => {
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: 0
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(true);
    });

    it('debe retornar true con valores en los límites válidos (SpO2 = 100)', () => {
        const vitals: TriageVitals = {
            heartRate: 80,
            temperature: 37,
            oxygenSaturation: 100
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(true);
    });

    it('debe retornar false si heartRate es null', () => {
        const vitals = {
            heartRate: null,
            temperature: 37,
            oxygenSaturation: 98
        } as any;

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });

    it('debe retornar false si múltiples campos son inválidos', () => {
        // HUMAN REVIEW: Validación simultánea de múltiples errores
        const vitals: TriageVitals = {
            heartRate: -50,
            temperature: 60,
            oxygenSaturation: 150
        };

        const isValid = TriageEngine.isValidForTriage(vitals);
        expect(isValid).toBe(false);
    });
});