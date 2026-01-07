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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {priorityLevels.map((priority) => {
          const isSelected = selectedPriority === priority;
          const criteria = ESI_CRITERIA[priority];
          
          return (
            <motion.div
              key={priority}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                type="button"
                onClick={() => handleSelect(priority)}
                onMouseEnter={() => setShowCriteria(priority)}
                onMouseLeave={() => setShowCriteria(null)}
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
                    variant={getPriorityBadgeVariant(priority)}
                    size="sm"
                  >
                    {PRIORITY_LABELS[priority]}
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
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Criteria Information */}
      <AnimatePresence mode="wait">
        {showCriteria && (
          <motion.div
            key={showCriteria}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityBadgeVariant(showCriteria)} size="lg">
                    Nivel {showCriteria}
                  </Badge>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    {ESI_CRITERIA[showCriteria].title}
                  </h4>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300">
                  {ESI_CRITERIA[showCriteria].description}
                </p>
                
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    Ejemplos:
                  </p>
                  <ul className="space-y-1">
                    {ESI_CRITERIA[showCriteria].examples.map((example, index) => (
                      <li
                        key={index}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                      >
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedPriority && !showCriteria && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Prioridad seleccionada: <span className="font-semibold">{PRIORITY_LABELS[selectedPriority]}</span>
            <br />
            <span className="text-xs">Pase el cursor sobre cualquier nivel para ver los criterios ESI</span>
          </p>
        </motion.div>
      )}
    </div>
  );
};
