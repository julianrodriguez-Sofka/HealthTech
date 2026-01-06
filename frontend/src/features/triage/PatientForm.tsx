/**
 * Patient Form Component
 * 
 * Formulario de registro de pacientes con validación en tiempo real
 * usando react-hook-form.
 */

import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { User, Heart, Activity, Thermometer, Wind, Droplets, ArrowLeft } from 'lucide-react';
import { useTriage } from './useTriage';
import { CreatePatientRequest } from '@api/triageApi';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Input } from '@components/Input';

interface PatientFormData {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms: string;
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  respiratoryRate: number;
  oxygenSaturation: number;
}

export default function PatientForm() {
  const navigate = useNavigate();
  const { createPatient } = useTriage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PatientFormData>({
    defaultValues: {
      gender: 'male',
      temperature: 36.5,
      heartRate: 80,
      bloodPressure: '120/80',
      respiratoryRate: 16,
      oxygenSaturation: 98,
    },
  });

  const onSubmit = async (data: PatientFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Transformar síntomas de string a array
      const symptoms = data.symptoms
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const patientData: CreatePatientRequest = {
        name: data.name,
        age: data.age,
        gender: data.gender,
        symptoms,
        vitals: {
          temperature: data.temperature,
          heartRate: data.heartRate,
          bloodPressure: data.bloodPressure,
          respiratoryRate: data.respiratoryRate,
          oxygenSaturation: data.oxygenSaturation,
        },
      };

      const result = await createPatient(patientData);

      if (result) {
        // Éxito - limpiar formulario y navegar
        reset();
        navigate('/');
      }
    } catch (error) {
      console.error('[PatientForm] Submit error:', error);
      setSubmitError('Error al registrar el paciente. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="mb-4"
        >
          Volver al Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-slate-900">Registro de Paciente</h1>
        <p className="text-slate-600 mt-1">
          Completa la información del paciente para realizar el triaje automático
        </p>
      </div>

      {/* Error Alert */}
      {submitError && (
        <Card variant="bordered" padding="md" className="border-critical-300 bg-critical-50 mb-6">
          <p className="text-critical-900">{submitError}</p>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Information */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Información del Paciente</h2>
              <p className="text-sm text-slate-600">Datos personales básicos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre Completo"
              placeholder="Ej: Juan Pérez García"
              required
              error={errors.name?.message}
              {...register('name', {
                required: 'El nombre es requerido',
                minLength: {
                  value: 3,
                  message: 'El nombre debe tener al menos 3 caracteres',
                },
              })}
            />

            <Input
              label="Edad"
              type="number"
              placeholder="Ej: 45"
              required
              error={errors.age?.message}
              {...register('age', {
                required: 'La edad es requerida',
                min: { value: 0, message: 'La edad debe ser mayor a 0' },
                max: { value: 120, message: 'La edad debe ser menor a 120' },
                valueAsNumber: true,
              })}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Género <span className="text-critical-500">*</span>
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'male', label: 'Masculino' },
                  { value: 'female', label: 'Femenino' },
                  { value: 'other', label: 'Otro' },
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={option.value}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-600"
                      {...register('gender', { required: true })}
                    />
                    <span className="text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Input
                label="Síntomas"
                placeholder="Ej: Dolor de cabeza, fiebre, tos"
                helperText="Separa los síntomas con comas"
                required
                error={errors.symptoms?.message}
                {...register('symptoms', {
                  required: 'Los síntomas son requeridos',
                  minLength: {
                    value: 3,
                    message: 'Describe al menos un síntoma',
                  },
                })}
              />
            </div>
          </div>
        </Card>

        {/* Vital Signs */}
        <Card variant="elevated" padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-success-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Signos Vitales</h2>
              <p className="text-sm text-slate-600">Mediciones clínicas actuales</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Temperatura (°C)"
              type="number"
              step="0.1"
              placeholder="36.5"
              required
              leftIcon={<Thermometer className="w-5 h-5" />}
              helperText="Rango normal: 36-37°C"
              error={errors.temperature?.message}
              {...register('temperature', {
                required: 'La temperatura es requerida',
                min: { value: 35, message: 'Temperatura muy baja (< 35°C)' },
                max: { value: 42, message: 'Temperatura muy alta (> 42°C)' },
                valueAsNumber: true,
              })}
            />

            <Input
              label="Frecuencia Cardíaca (bpm)"
              type="number"
              placeholder="80"
              required
              leftIcon={<Heart className="w-5 h-5" />}
              helperText="Rango normal: 60-100 bpm"
              error={errors.heartRate?.message}
              {...register('heartRate', {
                required: 'La frecuencia cardíaca es requerida',
                min: { value: 40, message: 'Frecuencia muy baja (< 40 bpm)' },
                max: { value: 200, message: 'Frecuencia muy alta (> 200 bpm)' },
                valueAsNumber: true,
              })}
            />

            <Input
              label="Presión Arterial"
              placeholder="120/80"
              required
              leftIcon={<Activity className="w-5 h-5" />}
              helperText="Formato: sistólica/diastólica"
              error={errors.bloodPressure?.message}
              {...register('bloodPressure', {
                required: 'La presión arterial es requerida',
                pattern: {
                  value: /^\d{2,3}\/\d{2,3}$/,
                  message: 'Formato inválido (usa: 120/80)',
                },
              })}
            />

            <Input
              label="Frecuencia Respiratoria (rpm)"
              type="number"
              placeholder="16"
              required
              leftIcon={<Wind className="w-5 h-5" />}
              helperText="Rango normal: 12-20 rpm"
              error={errors.respiratoryRate?.message}
              {...register('respiratoryRate', {
                required: 'La frecuencia respiratoria es requerida',
                min: { value: 8, message: 'Frecuencia muy baja (< 8 rpm)' },
                max: { value: 40, message: 'Frecuencia muy alta (> 40 rpm)' },
                valueAsNumber: true,
              })}
            />

            <Input
              label="Saturación de Oxígeno (%)"
              type="number"
              placeholder="98"
              required
              leftIcon={<Droplets className="w-5 h-5" />}
              helperText="Rango normal: 95-100%"
              error={errors.oxygenSaturation?.message}
              {...register('oxygenSaturation', {
                required: 'La saturación de oxígeno es requerida',
                min: { value: 70, message: 'Saturación muy baja (< 70%)' },
                max: { value: 100, message: 'Saturación no puede exceder 100%' },
                valueAsNumber: true,
              })}
            />
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => navigate('/')}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registrando...' : 'Registrar Paciente'}
          </Button>
        </div>
      </form>
    </div>
  );
}
