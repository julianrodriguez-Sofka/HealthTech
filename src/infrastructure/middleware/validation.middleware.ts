/**
 * Middleware de Validación con Zod - Infrastructure Layer
 *
 * Valida los signos vitales (US-002) según rangos clínicos aceptados.
 *
 * HUMAN REVIEW: Los rangos clínicos deben ser validados por personal médico.
 * Estos valores son aproximaciones generales para adultos y pueden requerir
 * ajustes según la población objetivo (pediátrica, geriátrica, etc.).
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '../../shared/Logger';

const logger = Logger.getInstance();

/**
 * Esquema de validación para signos vitales (US-002)
 *
 * Rangos clínicos de referencia:
 * - Temperatura: 35-42°C (hipotermia < 35, fiebre > 38, hipertermia > 40)
 * - Frecuencia Cardíaca: 40-200 lpm (bradicardia < 60, taquicardia > 100)
 * - Presión Arterial: 70-250 mmHg sistólica, 40-150 mmHg diastólica
 * - Frecuencia Respiratoria: 8-40 rpm (bradipnea < 12, taquipnea > 20)
 * - Saturación de Oxígeno: 70-100% (hipoxemia < 90%)
 *
 * HUMAN REVIEW: Validar estos rangos con protocolo médico institucional.
 */
export const vitalSignsSchema = z.object({
  temperature: z
    .number()
    .min(35, { message: 'Temperature too low (hypothermia risk < 35°C)' })
    .max(42, { message: 'Temperature too high (hyperthermia risk > 42°C)' }),

  heartRate: z
    .number()
    .int({ message: 'Heart rate must be an integer' })
    .min(40, { message: 'Heart rate too low (< 40 bpm)' })
    .max(200, { message: 'Heart rate too high (> 200 bpm)' }),

  bloodPressure: z
    .string()
    .regex(/^\d{2,3}\/\d{2,3}$/, {
      message: 'Blood pressure must be in format "systolic/diastolic" (e.g., 120/80)',
    })
    .refine(
      (bp) => {
        const parts = bp.split('/');
        const systolic = parseInt(parts[0] || '0', 10);
        const diastolic = parseInt(parts[1] || '0', 10);
        return systolic >= 70 && systolic <= 250 && diastolic >= 40 && diastolic <= 150;
      },
      {
        message:
          'Blood pressure out of valid range (systolic: 70-250 mmHg, diastolic: 40-150 mmHg)',
      }
    ),

  respiratoryRate: z
    .number()
    .int({ message: 'Respiratory rate must be an integer' })
    .min(8, { message: 'Respiratory rate too low (< 8 rpm)' })
    .max(40, { message: 'Respiratory rate too high (> 40 rpm)' }),

  oxygenSaturation: z
    .number()
    .min(70, { message: 'Oxygen saturation too low (< 70%)' })
    .max(100, { message: 'Oxygen saturation cannot exceed 100%' }),
});

/**
 * Tipo inferido del esquema de validación
 */
export type VitalSignsInput = z.infer<typeof vitalSignsSchema>;

/**
 * Middleware para validar signos vitales con Zod (US-002)
 *
 * HUMAN REVIEW: Este middleware valida datos de entrada críticos para salud.
 * Asegurar que los errores de validación sean informativos para el frontend
 * sin exponer detalles internos del sistema.
 *
 * @param req - Request de Express
 * @param res - Response de Express
 * @param next - NextFunction de Express
 */
export function validateVitalSigns(req: Request, res: Response, next: NextFunction): void {
  try {
    // HUMAN REVIEW: Validar tanto body como params según diseño de API
    const result = vitalSignsSchema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
        code: 'VALIDATION_ERROR',
      }));

      logger.warn('Vital signs validation failed', {
        errors,
        requestBody: req.body,
      });

      res.status(400).json({
        error: 'CLINICAL_VALIDATION_ERROR',
        message: 'Invalid vital signs data',
        details: errors,
      });
      return;
    }

    // Adjuntar datos validados al request para uso posterior
    req.body = result.data;

    logger.info('Vital signs validated successfully', {
      data: result.data,
    });

    next();
  } catch (error) {
    // HUMAN REVIEW: Capturar errores inesperados en validación
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Unexpected error in validation middleware', err);
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred during validation',
    });
  }
}

/**
 * Middleware genérico de validación para cualquier esquema Zod
 *
 * HUMAN REVIEW: Útil para reutilizar en otras validaciones (pacientes, usuarios, etc.)
 *
 * @param schema - Esquema Zod a validar
 * @returns Middleware de Express
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
          code: 'VALIDATION_ERROR',
        }));

        logger.warn('Schema validation failed', {
          schema: schema.description || 'unknown',
          errors,
          requestBody: req.body,
        });

        res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
        });
        return;
      }

      req.body = result.data;
      next();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Unexpected error in generic validation middleware', err);
      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
}
