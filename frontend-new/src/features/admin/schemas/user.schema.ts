import { z } from 'zod';
import { UserRole } from '@/types';

export const userSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100, 'Máximo 100 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Rol inválido' }) }),
  department: z.string().min(2, 'El departamento debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  specialization: z.string().min(2, 'La especialización debe tener al menos 2 caracteres').max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10}$/, 'Teléfono debe tener 10 dígitos').optional().or(z.literal(''))
});

export type UserFormData = z.infer<typeof userSchema>;
