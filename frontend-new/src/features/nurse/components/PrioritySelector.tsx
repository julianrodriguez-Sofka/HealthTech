import React, { useState } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { TriageLevel } from '@/types';
import { ESI_CRITERIA, PRIORITY_LABELS, getPriorityBadgeVariant } from '@/lib/constants';

interface PrioritySelectorProps {
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  error?: string;
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({ setValue, watch, error }) => {
  const selectedPriority = watch('priority');
  const [showCriteria, setShowCriteria] = useState<TriageLevel | null>(null);

  const handleSelect = (priority: TriageLevel) => {
    setValue('priority', priority, { shouldValidate: true });
    // Toggle el tooltip al hacer click
    setShowCriteria(showCriteria === priority ? null : priority);
  };

  const priorityLevels = [
    TriageLevel.CRITICAL,
    TriageLevel.HIGH,
    TriageLevel.MODERATE,
    TriageLevel.LOW,
    TriageLevel.NON_URGENT
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Seleccione el Nivel de Prioridad según ESI
          </h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Haga clic en un nivel para ver los criterios de evaluación del Emergency Severity Index (ESI)
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {priorityLevels.map((priority) => {
            const isSelected = selectedPriority === priority;
            const criteria = ESI_CRITERIA[priority as 1 | 2 | 3 | 4 | 5]; // HUMAN REVIEW: Cast a valor numérico
            const isHovered = showCriteria === priority;
            
            return (
              <div
                key={priority}
                className="relative"
              >
                <motion.button
                  type="button"
                  onClick={() => handleSelect(priority)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    w-full p-4 rounded-xl border-2 transition-all duration-200
                    ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-4 ring-blue-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                    }
                  `}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                      {priority}
                    </div>
                    <Badge
                      variant={getPriorityBadgeVariant(priority as 1 | 2 | 3 | 4 | 5)}
                      size="sm"
                    >
                      {PRIORITY_LABELS[priority as 1 | 2 | 3 | 4 | 5]}
                    </Badge>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>

                {/* Criteria Tooltip - Diseño profesional mejorado para sistema de triage médico */}
                <AnimatePresence>
                  {showCriteria === priority && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute z-50 top-full left-0 right-0 mt-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative max-w-full">
                        {/* Flecha decorativa mejorada */}
                        <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 ${
                          priority === 1 ? 'bg-red-500' :
                          priority === 2 ? 'bg-orange-500' :
                          priority === 3 ? 'bg-yellow-500' :
                          priority === 4 ? 'bg-green-500' :
                          'bg-blue-500'
                        } rotate-45 border-l-2 border-t-2 border-white dark:border-gray-800`}></div>
                        
                        {/* Contenedor principal con diseño médico profesional */}
                        <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
                          {/* Header con gradiente según prioridad - diseño médico */}
                          <div className={`px-5 py-4 ${
                            priority === 1 ? 'bg-gradient-to-br from-red-600 via-red-500 to-red-600' :
                            priority === 2 ? 'bg-gradient-to-br from-orange-600 via-orange-500 to-orange-600' :
                            priority === 3 ? 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-600' :
                            priority === 4 ? 'bg-gradient-to-br from-green-600 via-green-500 to-green-600' :
                            'bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600'
                          }`}>
                            <div className="flex items-start gap-4">
                              {/* Icono de número grande */}
                              <div className="flex-shrink-0 w-14 h-14 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-md border-2 border-white/30 shadow-lg">
                                <span className="text-3xl font-black text-white drop-shadow-lg">{priority}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant={getPriorityBadgeVariant(priority)} size="lg" className="bg-white/20 text-white border-white/30">
                                    ESI Nivel {priority}
                                  </Badge>
                                </div>
                                <h4 className="text-xl font-bold text-white leading-tight drop-shadow-md">
                                  {ESI_CRITERIA[priority].title}
                                </h4>
                              </div>
                            </div>
                          </div>
                          
                          {/* Contenido con diseño limpio y profesional */}
                          <div className="p-5 bg-white dark:bg-gray-800">
                            {/* Descripción */}
                            <div className="mb-5 pb-5 border-b border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`w-1 h-6 rounded-full ${
                                  priority === 1 ? 'bg-red-500' :
                                  priority === 2 ? 'bg-orange-500' :
                                  priority === 3 ? 'bg-yellow-500' :
                                  priority === 4 ? 'bg-green-500' :
                                  'bg-blue-500'
                                }`}></div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                  Descripción Clínica
                                </p>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-3">
                                {ESI_CRITERIA[priority].description}
                              </p>
                            </div>
                            
                            {/* Ejemplos clínicos */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`w-1 h-6 rounded-full ${
                                  priority === 1 ? 'bg-red-500' :
                                  priority === 2 ? 'bg-orange-500' :
                                  priority === 3 ? 'bg-yellow-500' :
                                  priority === 4 ? 'bg-green-500' :
                                  'bg-blue-500'
                                }`}></div>
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                  Ejemplos Clínicos
                                </p>
                              </div>
                              <ul className="space-y-2.5 pl-3">
                                {ESI_CRITERIA[priority].examples.map((example, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-3 group"
                                  >
                                    <span className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-md ${
                                      priority === 1 ? 'bg-red-100 dark:bg-red-900/30' :
                                      priority === 2 ? 'bg-orange-100 dark:bg-orange-900/30' :
                                      priority === 3 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                      priority === 4 ? 'bg-green-100 dark:bg-green-900/30' :
                                      'bg-blue-100 dark:bg-blue-900/30'
                                    } flex items-center justify-center transition-transform group-hover:scale-110`}>
                                      <span className={`text-xs font-bold ${
                                        priority === 1 ? 'text-red-700 dark:text-red-400' :
                                        priority === 2 ? 'text-orange-700 dark:text-orange-400' :
                                        priority === 3 ? 'text-yellow-700 dark:text-yellow-400' :
                                        priority === 4 ? 'text-green-700 dark:text-green-400' :
                                        'text-blue-700 dark:text-blue-400'
                                      }`}>{index + 1}</span>
                                    </span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                                      {example}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {selectedPriority && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-4"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Prioridad seleccionada: <span className="font-semibold">{PRIORITY_LABELS[selectedPriority as TriageLevel]}</span>
            <br />
            <span className="text-xs">Haga clic en cualquier nivel para ver los criterios ESI</span>
          </p>
        </motion.div>
      )}
    </div>
  );
};
