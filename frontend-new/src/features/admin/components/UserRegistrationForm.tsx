import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Users, Briefcase, Phone, Check } from 'lucide-react';
import { Button, Input, Select, Card } from '@/components/ui';
import { userSchema, UserFormData } from '../schemas/user.schema';
import { UserRole } from '@/types';

interface UserRegistrationFormProps {
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, name: 'Información Básica', icon: User },
  { id: 2, name: 'Credenciales', icon: Lock },
  { id: 3, name: 'Rol y Departamento', icon: Briefcase }
];

const ROLE_OPTIONS = [
  { value: '', label: 'Seleccione un rol...' },
  { value: UserRole.NURSE, label: 'Enfermero/a' },
  { value: UserRole.DOCTOR, label: 'Médico/a' },
  { value: UserRole.ADMIN, label: 'Administrador/a' }
];

export const UserRegistrationForm: React.FC<UserRegistrationFormProps> = ({ onSubmit, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    trigger,
    watch
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    mode: 'onChange'
  });

  // HUMAN REVIEW: Asegurar tipo UserRole para selectedRole
  const selectedRole = watch('role') as UserRole | undefined;

  const handleNext = async () => {
    let fieldsToValidate: (keyof UserFormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ['name', 'phone'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['email', 'password'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const onFormSubmit = async (data: UserFormData) => {
    try {
      setSubmitError(null);
      await onSubmit(data);
    } catch (error) {
      setSubmitError('Error al registrar usuario. Intente nuevamente.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              <motion.div
                initial={false}
                animate={{
                  scale: currentStep === step.id ? 1.1 : 1,
                  backgroundColor:
                    currentStep > step.id
                      ? '#10b981'
                      : currentStep === step.id
                      ? '#3b82f6'
                      : '#e5e7eb'
                }}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${currentStep > step.id ? 'text-white' : currentStep === step.id ? 'text-white' : 'text-gray-400'}
                `}
              >
                {currentStep > step.id ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </motion.div>
              <span
                className={`mt-2 text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900 dark:text-white' : 'text-gray-500'
                }`}
              >
                {step.name}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div className="flex-1 h-1 mx-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={false}
                  animate={{
                    width: currentStep > step.id ? '100%' : '0%'
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-emerald-500"
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[320px]">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card padding="md" className="bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Ingrese los datos personales del nuevo usuario
              </p>
            </Card>

            <Input
              label="Nombre Completo *"
              placeholder="Ej: Dr. Juan Pérez"
              leftIcon={<User className="w-5 h-5" />}
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Teléfono"
              placeholder="1234567890"
              leftIcon={<Phone className="w-5 h-5" />}
              error={errors.phone?.message}
              {...register('phone')}
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card padding="md" className="bg-amber-50 dark:bg-amber-900/20">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Configure las credenciales de acceso al sistema
              </p>
            </Card>

            <Input
              label="Correo Electrónico *"
              type="email"
              placeholder="usuario@healthtech.com"
              leftIcon={<Mail className="w-5 h-5" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Contraseña *"
              type="password"
              placeholder="Mínimo 6 caracteres"
              leftIcon={<Lock className="w-5 h-5" />}
              error={errors.password?.message}
              {...register('password')}
            />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <Card padding="md" className="bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-sm text-emerald-800 dark:text-emerald-200">
                Asigne el rol y departamento correspondiente
              </p>
            </Card>

            <Select
              label="Rol *"
              error={errors.role?.message}
              options={ROLE_OPTIONS}
              {...register('role')}
            />

            {selectedRole === UserRole.NURSE && selectedRole !== undefined && (
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

            {selectedRole === UserRole.DOCTOR && selectedRole !== undefined && (
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
          </motion.div>
        )}
      </div>

      {/* Error Message */}
      {submitError && (
        <Card padding="md" className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button type="button" variant="ghost" onClick={handlePrevious}>
              Anterior
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>

        {currentStep < STEPS.length ? (
          <Button type="button" variant="primary" onClick={handleNext}>
            Siguiente
          </Button>
        ) : (
          <Button type="submit" variant="success" isLoading={isSubmitting}>
            Registrar Usuario
          </Button>
        )}
      </div>
    </form>
  );
};
