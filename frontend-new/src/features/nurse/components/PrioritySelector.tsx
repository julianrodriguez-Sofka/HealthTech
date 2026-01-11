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

      <div className="space-y-4 relative">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {priorityLevels.map((priority) => {
            const isSelected = selectedPriority === priority;
            
            return (
              <motion.button
                key={priority}
                type="button"
                onClick={() => handleSelect(priority)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all duration-200 relative
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
            );
          })}
        </div>

        {/* Criteria Tooltip - Posicionado fuera del grid pero dentro del contenedor */}
        <AnimatePresence>
          {showCriteria !== null && (() => {
            const priority = showCriteria;
            const priorityIndex = priorityLevels.indexOf(priority);
            const totalCards = priorityLevels.length;
            // Calcular la posición de la flecha basada en el índice de la tarjeta en el grid
            const arrowPosition = ((priorityIndex + 0.5) / totalCards) * 100;
            
            return (
              <motion.div
                key={priority}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="relative z-50 mt-4 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full">
                  {/* Flecha decorativa mejorada - apunta hacia la tarjeta seleccionada */}
                  <div 
                    className={`absolute -top-3 w-6 h-6 ${
                      priority === 1 ? 'bg-red-500' :
                      priority === 2 ? 'bg-orange-500' :
                      priority === 3 ? 'bg-yellow-500' :
                      priority === 4 ? 'bg-green-500' :
                      'bg-blue-500'
                    } border-l-2 border-t-2 border-white dark:border-gray-800 transition-all duration-300`}
                    style={{
                      left: `${arrowPosition}%`,
                      transform: 'translateX(-50%) rotate(45deg)'
                    }}
                  ></div>
                  
                  {/* Contenedor principal con diseño médico profesional y ancho amplio */}
                  <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
                    {/* Header con gradiente según prioridad - diseño médico */}
                    <div className={`px-6 py-5 ${
                      priority === 1 ? 'bg-gradient-to-br from-red-600 via-red-500 to-red-600' :
                      priority === 2 ? 'bg-gradient-to-br from-orange-600 via-orange-500 to-orange-600' :
                      priority === 3 ? 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-600' :
                      priority === 4 ? 'bg-gradient-to-br from-green-600 via-green-500 to-green-600' :
                      'bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600'
                    }`}>
                      <div className="flex items-start gap-4">
                        {/* Icono de número grande */}
                        <div className="flex-shrink-0 w-16 h-16 bg-white/25 rounded-xl flex items-center justify-center backdrop-blur-md border-2 border-white/30 shadow-lg">
                          <span className="text-4xl font-black text-white drop-shadow-lg">{priority}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getPriorityBadgeVariant(priority)} size="lg" className="bg-white/20 text-white border-white/30">
                              ESI Nivel {priority}
                            </Badge>
                          </div>
                          <h4 className="text-xl md:text-2xl font-bold text-white leading-tight drop-shadow-md">
                            {ESI_CRITERIA[priority].title}
                          </h4>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenido con diseño limpio y profesional - padding mejorado */}
                    <div className="p-6 md:p-8 bg-white dark:bg-gray-800">
                      {/* Descripción */}
                      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-1.5 h-8 rounded-full ${
                            priority === 1 ? 'bg-red-500' :
                            priority === 2 ? 'bg-orange-500' :
                            priority === 3 ? 'bg-yellow-500' :
                            priority === 4 ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}></div>
                          <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                            Descripción Clínica
                          </p>
                        </div>
                        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed pl-5">
                          {ESI_CRITERIA[priority].description}
                        </p>
                      </div>
                      
                      {/* Ejemplos clínicos */}
                      <div>
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-1.5 h-8 rounded-full ${
                            priority === 1 ? 'bg-red-500' :
                            priority === 2 ? 'bg-orange-500' :
                            priority === 3 ? 'bg-yellow-500' :
                            priority === 4 ? 'bg-green-500' :
                            'bg-blue-500'
                          }`}></div>
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Ejemplos Clínicos
                          </p>
                        </div>
                        <ul className="space-y-3 pl-5">
                          {ESI_CRITERIA[priority].examples.map((example, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-4 group"
                            >
                              <span className={`mt-1 flex-shrink-0 w-7 h-7 rounded-lg ${
                                priority === 1 ? 'bg-red-100 dark:bg-red-900/30' :
                                priority === 2 ? 'bg-orange-100 dark:bg-orange-900/30' :
                                priority === 3 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                                priority === 4 ? 'bg-green-100 dark:bg-green-900/30' :
                                'bg-blue-100 dark:bg-blue-900/30'
                              } flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm`}>
                                <span className={`text-sm font-bold ${
                                  priority === 1 ? 'text-red-700 dark:text-red-400' :
                                  priority === 2 ? 'text-orange-700 dark:text-orange-400' :
                                  priority === 3 ? 'text-yellow-700 dark:text-yellow-400' :
                                  priority === 4 ? 'text-green-700 dark:text-green-400' :
                                  'text-blue-700 dark:text-blue-400'
                                }`}>{index + 1}</span>
                              </span>
                              <span className="text-base text-gray-700 dark:text-gray-300 leading-relaxed flex-1 pt-0.5">
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
            );
          })()}
        </AnimatePresence>
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
