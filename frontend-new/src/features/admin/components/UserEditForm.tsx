import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Mail } from 'lucide-react';
import { Button, Input, Select, Card } from '@/components/ui';
import { UserRole } from '@/types';
import type { User as UserType } from '@/types';

const editUserSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100, 'Máximo 100 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  specialization: z.string().optional().or(z.literal(''))
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface UserEditFormProps {
  user: UserType;
  onSubmit: (data: EditUserFormData) => Promise<void>;
  onCancel: () => void;
}

export const UserEditForm: React.FC<UserEditFormProps> = ({ user, onSubmit, onCancel }) => {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      password: '',
      department: user.department || user.area || '',
      specialization: user.specialization || user.specialty || ''
    }
  });

  const isDoctor = (user.role as string).toLowerCase() === 'doctor';
  const isNurse = (user.role as string).toLowerCase() === 'nurse';

  const onFormSubmit = async (data: EditUserFormData) => {
    try {
      setSubmitError(null);
      await onSubmit(data);
    } catch (error) {
      setSubmitError('Error al actualizar usuario. Intente nuevamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card padding="md" className="bg-blue-50 dark:bg-blue-900/20">
        <div className="space-y-1">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Editando usuario: <strong>{user.name}</strong>
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300">
            Rol: <strong>{user.role === 'doctor' ? 'Doctor/a' : user.role === 'nurse' ? 'Enfermero/a' : 'Administrador/a'}</strong> 
            <span className="ml-2 text-blue-500">(El rol no puede modificarse)</span>
          </p>
        </div>
      </Card>

      <Input
        label="Nombre Completo *"
        placeholder="Ej: Dr. Juan Pérez"
        leftIcon={<User className="w-5 h-5" />}
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Correo Electrónico *"
        type="email"
        placeholder="usuario@healthtech.com"
        leftIcon={<Mail className="w-5 h-5" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Nueva Contraseña (opcional)"
        type="password"
        placeholder="Dejar vacío para mantener la actual"
        leftIcon={<Lock className="w-5 h-5" />}
        error={errors.password?.message}
        helperText="Solo ingresa una contraseña si deseas cambiarla"
        {...register('password')}
      />

      {isNurse && (
        <Select
          label="Departamento"
          error={errors.department?.message}
          options={[
            { value: '', label: 'Seleccione un departamento...' },
            { value: 'Triage', label: 'Triage' },
            { value: 'Urgencias', label: 'Urgencias/Emergencias' },
            { value: 'UCI', label: 'UCI (Cuidados Intensivos)' },
            { value: 'Pediatría', label: 'Pediatría' },
            { value: 'Cirugía', label: 'Cirugía' },
            { value: 'Sala General', label: 'Sala General' }
          ]}
          {...register('department')}
        />
      )}

      {isDoctor && (
        <Select
          label="Especialización"
          error={errors.specialization?.message}
          options={[
            { value: '', label: 'Seleccione una especialización...' },
            { value: 'Medicina General', label: 'Medicina General' },
            { value: 'Medicina de Emergencia', label: 'Medicina de Emergencia' },
            { value: 'Cardiología', label: 'Cardiología' },
            { value: 'Neurología', label: 'Neurología' },
            { value: 'Pediatría', label: 'Pediatría' },
            { value: 'Cirugía', label: 'Cirugía' },
            { value: 'Medicina Interna', label: 'Medicina Interna' },
            { value: 'Traumatología', label: 'Traumatología' },
            { value: 'Cuidados Intensivos', label: 'Cuidados Intensivos' }
          ]}
          {...register('specialization')}
        />
      )}

      {submitError && (
        <Card padding="md" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </Card>
      )}

      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
};
