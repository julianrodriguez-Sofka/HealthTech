import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, User, Activity, AlertTriangle } from 'lucide-react';
import { Button, Input, Select, Textarea, Card, Alert } from '@/components/ui';
import { VitalSignsInput } from './VitalSignsInput';
import { PrioritySelector } from './PrioritySelector';
import { patientSchema, PatientFormData } from '../schemas/patient.schema';

interface PatientRegistrationFormProps {
  onSubmit: (data: PatientFormData) => Promise<void>;
  onCancel: () => void;
}

const STEPS = [
  { id: 1, title: 'Información Personal', icon: User },
  { id: 2, title: 'Síntomas y Signos Vitales', icon: Activity },
  { id: 3, title: 'Asignación de Prioridad', icon: AlertTriangle }
];

export const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    mode: 'onChange'
  });

  const handleNext = async () => {
    let fieldsToValidate: any[] = [];
    
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'age', 'gender', 'identificationNumber'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['symptoms', 'vitalSigns'];
    }
    
    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onFormSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError('');
      await onSubmit(data);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error al registrar paciente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card padding="lg" className="max-w-4xl mx-auto">
      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor: isActive || isCompleted ? '#3b82f6' : '#e5e7eb',
                      scale: isActive ? 1.1 : 1
                    }}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center
                      ${isActive || isCompleted ? 'text-white' : 'text-gray-400'}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </motion.div>
                  <p className={`
                    mt-2 text-sm font-medium text-center
                    ${isActive ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}
                  `}>
                    {step.title}
                  </p>
                </div>
                
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1 mx-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={false}
                      animate={{
                        width: isCompleted ? '100%' : '0%'
                      }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-blue-600"
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {submitError && (
        <Alert variant="error" className="mb-6" onClose={() => setSubmitError('')}>
          {submitError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <AnimatePresence mode="wait">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo"
                  placeholder="Juan Pérez"
                  error={errors.name?.message}
                  {...register('name')}
                  required
                />
                
                <Input
                  label="Edad"
                  type="number"
                  placeholder="30"
                  error={errors.age?.message}
                  {...register('age', { valueAsNumber: true })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Género"
                  error={errors.gender?.message}
                  {...register('gender')}
                  options={[
                    { value: '', label: 'Seleccione...' },
                    { value: 'M', label: 'Masculino' },
                    { value: 'F', label: 'Femenino' },
                    { value: 'OTHER', label: 'Otro' }
                  ]}
                  required
                />
                
                <Input
                  label="Número de Identificación"
                  placeholder="DNI, Pasaporte, etc."
                  error={errors.identificationNumber?.message}
                  {...register('identificationNumber')}
                  required
                />
              </div>

              <Input
                label="Dirección"
                placeholder="Calle, Ciudad, País"
                error={errors.address?.message}
                {...register('address')}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Teléfono"
                  placeholder="+34 123 456 789"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
                
                <Input
                  label="Contacto de Emergencia"
                  placeholder="Nombre del contacto"
                  error={errors.emergencyContact?.message}
                  {...register('emergencyContact')}
                />
              </div>

              <Input
                label="Teléfono de Emergencia"
                placeholder="+34 987 654 321"
                error={errors.emergencyPhone?.message}
                {...register('emergencyPhone')}
              />
            </motion.div>
          )}

          {/* Step 2: Symptoms and Vital Signs */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Textarea
                label="Síntomas y Motivo de Consulta"
                placeholder="Describa los síntomas principales del paciente..."
                rows={4}
                error={errors.symptoms?.message}
                {...register('symptoms')}
                required
              />

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Signos Vitales
                </h3>
                <VitalSignsInput
                  register={register}
                  errors={errors}
                  watch={watch}
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Priority Selection */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <PrioritySelector
                setValue={setValue}
                watch={watch}
                error={errors.priority?.message}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                leftIcon={<ArrowLeft className="w-5 h-5" />}
              >
                Anterior
              </Button>
            )}
          </div>

          <div>
            {currentStep < STEPS.length ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                type="submit"
                variant="success"
                isLoading={isSubmitting}
                rightIcon={<Check className="w-5 h-5" />}
              >
                Registrar Paciente
              </Button>
            )}
          </div>
        </div>
      </form>
    </Card>
  );
};
