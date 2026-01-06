/**
 * Triage Engine - Domain Layer
 *
 * Motor de cálculo de prioridad de triaje basado en signos vitales.
 * Este componente pertenece al DOMINIO porque encapsula reglas de negocio puras
 * sin dependencias externas (NO frameworks, NO bases de datos, NO APIs).
 *
 * HUMAN REVIEW: Este motor debe ser validado por personal médico calificado.
 * Las reglas de triaje implementadas deben cumplir con protocolos hospitalarios
 * específicos y normativas sanitarias locales antes de su uso en producción.
 */

/**
 * Signos vitales mínimos requeridos para calcular prioridad de triaje
 *
 * HUMAN REVIEW: Este tipo representa el subconjunto de signos vitales
 * críticos para la decisión de triaje. En futuras iteraciones, considerar:
 * - Presión arterial (sistólica/diastólica)
 * - Frecuencia respiratoria
 * - Estado de consciencia (Escala de Glasgow)
 * - Dolor (Escala EVA)
 */
export interface TriageVitals {
  heartRate: number;        // Frecuencia cardíaca en bpm
  temperature: number;      // Temperatura corporal en Celsius
  oxygenSaturation: number; // Saturación de oxígeno en porcentaje
}

/**
 * Niveles de prioridad de triaje
 *
 * Sistema de 5 niveles basado en protocolos internacionales:
 * 1 - Crítico/Resucitación: Riesgo vital inmediato
 * 2 - Emergencia: Atención en < 10 minutos
 * 3 - Urgente: Atención en < 30 minutos
 * 4 - Menos urgente: Atención en < 60 minutos
 * 5 - No urgente: Atención en < 120 minutos
 *
 * HUMAN REVIEW: Verificar que estos niveles coincidan con el sistema
 * de triaje utilizado en la institución (Manchester, ESI, CTAS, etc.)
 */
export type TriagePriority = 1 | 2 | 3 | 4 | 5;

/**
 * Firma de función para reglas de triaje
 *
 * Un predicado que evalúa signos vitales y retorna true si la condición se cumple
 *
 * HUMAN REVIEW: Este patrón permite aplicar el principio Open/Closed:
 * - Open for extension: Nuevas reglas se agregan sin modificar código existente
 * - Closed for modification: El motor de evaluación no cambia al añadir reglas
 */
export type TriageRule = (vitals: TriageVitals) => boolean;

/**
 * Metadata de regla de triaje para trazabilidad
 *
 * HUMAN REVIEW: Permite auditoría y explicabilidad de decisiones de triaje.
 * En producción, cada decisión debe ser trazable para revisión médica y legal.
 */
export interface TriageRuleMetadata {
  name: string;           // Nombre descriptivo de la regla
  priority: TriagePriority; // Prioridad asignada si la regla se cumple
  predicate: TriageRule;  // Función de evaluación
  justification: string;  // Justificación clínica de la regla
}

/**
 * Triage Engine
 *
 * Motor de cálculo de prioridad basado en evaluación secuencial de reglas.
 * Implementa un sistema de reglas que sigue principios SOLID:
 *
 * - Single Responsibility: Cada regla evalúa UNA condición clínica
 * - Open/Closed: Nuevas prioridades se añaden sin modificar el motor
 * - Liskov Substitution: Todas las reglas cumplen el contrato TriageRule
 * - Interface Segregation: Predicados simples, no interfaces complejas
 * - Dependency Inversion: Dependemos de abstracciones (TriageRule), no implementaciones
 *
 * HUMAN REVIEW: La IA sugirió una estructura de control anidada. Refactoricé
 * usando un motor de reglas basado en predicados para cumplir con el principio
 * Open/Closed, permitiendo que el sistema escale a las prioridades 2-5 sin
 * modificar el flujo principal.
 */
export class TriageEngine {
  /**
   * Reglas críticas para Prioridad 1 (Riesgo vital inmediato)
   *
   * HUMAN REVIEW: Estas reglas deben ser validadas por el equipo médico.
   * Basadas en criterios clínicos de compromiso vital:
   *
   * 1. Taquicardia severa (FC > 120 bpm):
   *    - Shock, sepsis, arritmias malignas
   *    - Requiere evaluación cardiovascular inmediata
   *
   * 2. Hipertermia extrema (T > 40°C):
   *    - Golpe de calor, sepsis severa
   *    - Riesgo de daño multiorgánico
   *
   * 3. Hipoxemia severa (SpO2 < 90%):
   *    - Insuficiencia respiratoria aguda
   *    - Riesgo de daño cerebral por hipoxia
   */
  private static readonly CRITICAL_RULES: TriageRuleMetadata[] = [
    {
      name: 'Taquicardia Severa',
      priority: 1,
      predicate: (vitals: TriageVitals): boolean => {
        // HUMAN REVIEW: Umbral de 120 bpm basado en consenso médico
        // para adultos. Ajustar según población (pediátrica, geriátrica)
        return vitals.heartRate > 120;
      },
      justification: 'Frecuencia cardíaca superior a 120 bpm indica compromiso hemodinámico'
    },
    {
      name: 'Hipertermia Extrema',
      priority: 1,
      predicate: (vitals: TriageVitals): boolean => {
        // HUMAN REVIEW: Umbral de 40°C es límite crítico para función celular
        // Por encima de esta temperatura, riesgo de daño proteico irreversible
        return vitals.temperature > 40;
      },
      justification: 'Temperatura superior a 40°C indica riesgo de daño multiorgánico'
    },
    {
      name: 'Hipoxemia Severa',
      priority: 1,
      predicate: (vitals: TriageVitals): boolean => {
        // HUMAN REVIEW: SpO2 < 90% corresponde a PaO2 < 60 mmHg (insuficiencia respiratoria)
        // Requiere oxigenoterapia y evaluación inmediata de vía aérea
        return vitals.oxygenSaturation < 90;
      },
      justification: 'Saturación de oxígeno inferior a 90% indica hipoxemia severa'
    }
  ];

  /**
   * Calcula la prioridad de triaje basándose en signos vitales
   *
   * @param vitals - Signos vitales del paciente
   * @returns Nivel de prioridad (1-5)
   *
   * HUMAN REVIEW: Este método implementa un motor de reglas extensible:
   * 1. Itera sobre reglas ordenadas por prioridad (1 primero)
   * 2. Evalúa cada predicado secuencialmente
   * 3. Retorna la primera prioridad que cumple condición
   * 4. Si ninguna regla aplica, asigna prioridad más baja (5)
   *
   * Próximas iteraciones deben agregar:
   * - EMERGENCY_RULES (Prioridad 2)
   * - URGENT_RULES (Prioridad 3)
   * - LESS_URGENT_RULES (Prioridad 4)
   * Y mantener Prioridad 5 como fallback
   */
  public static calculatePriority(vitals: TriageVitals): TriagePriority {
    // HUMAN REVIEW: Validar que los signos vitales estén presentes
    // En producción, usar un Value Object con validaciones integradas
    if (!vitals) {
      throw new Error('Vital signs are required for triage calculation');
    }

    // HUMAN REVIEW: Validar que los campos requeridos no sean null/undefined
    if (
      vitals.heartRate === undefined ||
      vitals.heartRate === null ||
      vitals.temperature === undefined ||
      vitals.temperature === null ||
      vitals.oxygenSaturation === undefined ||
      vitals.oxygenSaturation === null
    ) {
      throw new Error('All vital sign fields are required (heartRate, temperature, oxygenSaturation)');
    }

    // HUMAN REVIEW: Evaluar reglas críticas (Prioridad 1)
    // El uso de .some() permite cortocircuito: se detiene en la primera regla que cumple
    const isCritical = this.CRITICAL_RULES.some((rule) => rule.predicate(vitals));

    if (isCritical) {
      // HUMAN REVIEW: En producción, registrar qué regla específica se activó
      // para trazabilidad y auditoría médica
      // const triggeredRule = this.CRITICAL_RULES.find(rule => rule.predicate(vitals));
      // logger.info(`Triage Priority 1 assigned: ${triggeredRule?.name}`);
      return 1;
    }

    // HUMAN REVIEW: Próximas iteraciones - evaluar prioridades 2-4
    // const isEmergency = this.EMERGENCY_RULES.some(rule => rule.predicate(vitals));
    // if (isEmergency) return 2;
    //
    // const isUrgent = this.URGENT_RULES.some(rule => rule.predicate(vitals));
    // if (isUrgent) return 3;
    //
    // const isLessUrgent = this.LESS_URGENT_RULES.some(rule => rule.predicate(vitals));
    // if (isLessUrgent) return 4;

    // HUMAN REVIEW: Prioridad 5 por defecto (No urgente)
    // Si ninguna regla crítica, urgente o emergente aplica,
    // el paciente puede esperar hasta 2 horas para atención
    return 5;
  }

  /**
   * Obtiene las reglas que se activaron para un conjunto de signos vitales
   *
   * HUMAN REVIEW: Método auxiliar para trazabilidad y explicabilidad.
   * Permite al personal médico entender POR QUÉ se asignó cierta prioridad.
   * Útil para:
   * - Auditorías médicas
   * - Capacitación de personal
   * - Análisis de casos complejos
   * - Cumplimiento regulatorio
   *
   * @param vitals - Signos vitales del paciente
   * @returns Array de reglas que se cumplieron
   */
  public static getTriggeredRules(vitals: TriageVitals): TriageRuleMetadata[] {
    // HUMAN REVIEW: Filtrar todas las reglas que cumplan la condición
    const triggeredCriticalRules = this.CRITICAL_RULES.filter((rule) =>
      rule.predicate(vitals)
    );

    // HUMAN REVIEW: En futuras iteraciones, combinar reglas de todos los niveles
    // return [
    //   ...triggeredCriticalRules,
    //   ...this.EMERGENCY_RULES.filter(rule => rule.predicate(vitals)),
    //   ...this.URGENT_RULES.filter(rule => rule.predicate(vitals)),
    //   ...this.LESS_URGENT_RULES.filter(rule => rule.predicate(vitals))
    // ];

    return triggeredCriticalRules;
  }

  /**
   * Valida si un conjunto de signos vitales es válido para triaje
   *
   * HUMAN REVIEW: Separar validación de cálculo para mantener SRP.
   * Este método puede evolucionar a un Value Object VitalSigns
   * en el dominio con validaciones integradas.
   *
   * @param vitals - Signos vitales a validar
   * @returns true si los signos vitales son válidos
   */
  public static isValidForTriage(vitals: TriageVitals): boolean {
    // HUMAN REVIEW: Validación básica de estructura
    if (!vitals) {
      return false;
    }

    // HUMAN REVIEW: Validar presencia de campos requeridos
    if (
      vitals.heartRate === undefined ||
      vitals.heartRate === null ||
      vitals.temperature === undefined ||
      vitals.temperature === null ||
      vitals.oxygenSaturation === undefined ||
      vitals.oxygenSaturation === null
    ) {
      return false;
    }

    // HUMAN REVIEW: Validar rangos fisiológicos básicos
    // Estos rangos deben coincidir con los de VitalsService
    if (vitals.heartRate < 0 || vitals.heartRate > 300) {
      return false;
    }

    if (vitals.temperature < 0 || vitals.temperature > 45) {
      return false;
    }

    if (vitals.oxygenSaturation < 0 || vitals.oxygenSaturation > 100) {
      return false;
    }

    return true;
  }
}
