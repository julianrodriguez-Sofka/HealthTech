import { z } from 'zod';
import { TriageLevel } from '@/types';

// Vital Signs Schema
export const vitalSignsSchema = z.object({
  bloodPressure: z.string()
    .min(1, 'Presión arterial es requerida')
    .regex(/^\d{2,3}\/\d{2,3}$/, 'Formato inválido (ej: 120/80)'),
  heartRate: z.number()
    .min(40, 'Frecuencia cardíaca debe ser mayor a 40')
    .max(200, 'Frecuencia cardíaca debe ser menor a 200'),
  temperature: z.number()
    .min(35, 'Temperatura debe ser mayor a 35°C')
    .max(42, 'Temperatura debe ser menor a 42°C'),
  respiratoryRate: z.number()
    .min(8, 'Frecuencia respiratoria debe ser mayor a 8')
    .max(40, 'Frecuencia respiratoria debe ser menor a 40'),
  oxygenSaturation: z.number()
    .min(70, 'Saturación de oxígeno debe ser mayor a 70%')
    .max(100, 'Saturación de oxígeno debe ser menor o igual a 100%')
});

// Patient Registration Schema
export const patientSchema = z.object({
  // Step 1: Personal Information
  name: z.string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .max(100, 'Nombre debe tener máximo 100 caracteres'),
  age: z.number()
    .min(0, 'Edad debe ser mayor a 0')
    .max(120, 'Edad debe ser menor a 120'),
  gender: z.enum(['M', 'F', 'OTHER'], {
    required_error: 'Género es requerido'
  }),
  identificationNumber: z.string()
    .min(5, 'Número de identificación debe tener al menos 5 caracteres')
    .max(20, 'Número de identificación debe tener máximo 20 caracteres'),
  address: z.string().optional(),
  phone: z.string()
    .regex(/^[\d\s\-\+\(\)]*$/, 'Teléfono inválido')
    .optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string()
    .regex(/^[\d\s\-\+\(\)]*$/, 'Teléfono inválido')
    .optional(),
  
  // Step 2: Symptoms and Vital Signs
  symptoms: z.string()
    .min(10, 'Descripción de síntomas debe tener al menos 10 caracteres')
    .max(500, 'Descripción de síntomas debe tener máximo 500 caracteres'),
  vitalSigns: vitalSignsSchema,
  
  // Step 3: Priority
  priority: z.nativeEnum(TriageLevel, {
    required_error: 'Prioridad es requerida'
  })
});

export type PatientFormData = z.infer<typeof patientSchema>;
export type VitalSignsFormData = z.infer<typeof vitalSignsSchema>;
