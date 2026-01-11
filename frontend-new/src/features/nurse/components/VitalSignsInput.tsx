import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Activity, Heart, Thermometer, Wind, Droplets } from 'lucide-react';
import { Input } from '@/components/ui';
import { VitalSignsFormData } from '../schemas/patient.schema';
import { motion } from 'framer-motion';

interface VitalSignsInputProps {
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  watch: (name: string) => any;
}

interface VitalSignRange {
  min: number;
  max: number;
  unit: string;
  label: string;
  icon: React.ReactNode;
  normalRange: { min: number; max: number };
}

const VITAL_SIGNS: Record<string, VitalSignRange> = {
  heartRate: {
    min: 40,
    max: 200,
    unit: 'bpm',
    label: 'Frecuencia Cardíaca',
    icon: <Heart className="w-5 h-5" />,
    normalRange: { min: 60, max: 100 }
  },
  temperature: {
    min: 35,
    max: 42,
    unit: '°C',
    label: 'Temperatura',
    icon: <Thermometer className="w-5 h-5" />,
    normalRange: { min: 36.5, max: 37.5 }
  },
  respiratoryRate: {
    min: 8,
    max: 40,
    unit: 'rpm',
    label: 'Frecuencia Respiratoria',
    icon: <Wind className="w-5 h-5" />,
    normalRange: { min: 12, max: 20 }
  },
  oxygenSaturation: {
    min: 70,
    max: 100,
    unit: '%',
    label: 'Saturación de Oxígeno',
    icon: <Droplets className="w-5 h-5" />,
    normalRange: { min: 95, max: 100 }
  }
};

const getVitalStatus = (value: number, normalRange: { min: number; max: number }) => {
  if (!value) return 'neutral';
  if (value < normalRange.min || value > normalRange.max) return 'warning';
  return 'success';
};

export const VitalSignsInput: React.FC<VitalSignsInputProps> = ({ register, errors, watch }) => {
  const watchedValues = {
    heartRate: watch('vitalSigns.heartRate'),
    temperature: watch('vitalSigns.temperature'),
    respiratoryRate: watch('vitalSigns.respiratoryRate'),
    oxygenSaturation: watch('vitalSigns.oxygenSaturation')
  };

  return (
    <div className="space-y-6">
      {/* Blood Pressure */}
      <div>
        <Input
          label="Presión Arterial"
          placeholder="120/80"
          leftIcon={<Activity className="w-5 h-5" />}
          error={(errors.vitalSigns as any)?.bloodPressure?.message as string | undefined}
          helperText="Formato: Sistólica/Diastólica (ej: 120/80)"
          {...register('vitalSigns.bloodPressure')}
        />
      </div>

      {/* Numeric Vital Signs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(VITAL_SIGNS).map(([key, config]) => {
          const value = watchedValues[key as keyof typeof watchedValues];
          const status = getVitalStatus(value, config.normalRange);
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative">
                <Input
                  label={config.label}
                  type="number"
                  step="0.1"
                  placeholder={`${config.normalRange.min}-${config.normalRange.max}`}
                  leftIcon={config.icon}
                  error={((errors.vitalSigns as any)?.[key] as any)?.message as string | undefined}
                  success={status === 'success'}
                  {...register(`vitalSigns.${key}`, { valueAsNumber: true })}
                />
                
                {/* Normal Range Indicator */}
                {value && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">
                        Rango normal: {config.normalRange.min}-{config.normalRange.max} {config.unit}
                      </span>
                      <span
                        className={`font-semibold ${
                          status === 'success'
                            ? 'text-emerald-600'
                            : status === 'warning'
                            ? 'text-amber-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {value} {config.unit}
                      </span>
                    </div>
                    
                    {/* Visual Bar */}
                    <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(
                            ((value - config.min) / (config.max - config.min)) * 100,
                            100
                          )}%`
                        }}
                        transition={{ duration: 0.5 }}
                        className={`h-full ${
                          status === 'success'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            : status === 'warning'
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                            : 'bg-gradient-to-r from-gray-400 to-gray-500'
                        }`}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
