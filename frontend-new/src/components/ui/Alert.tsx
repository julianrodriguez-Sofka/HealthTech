import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const variantConfig: Record<AlertVariant, {
  bg: string;
  border: string;
  icon: React.ReactNode;
  iconColor: string;
}> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: <Info className="w-5 h-5" />,
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: <CheckCircle2 className="w-5 h-5" />,
    iconColor: 'text-emerald-600 dark:text-emerald-400'
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: <AlertTriangle className="w-5 h-5" />,
    iconColor: 'text-amber-600 dark:text-amber-400'
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: <AlertCircle className="w-5 h-5" />,
    iconColor: 'text-red-600 dark:text-red-400'
  }
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = ''
}) => {
  const config = variantConfig[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        ${config.bg} ${config.border}
        border-l-4 rounded-lg p-4
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${config.iconColor}`}>
          {config.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold mb-1 ${config.iconColor}`}>
              {title}
            </h4>
          )}
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {children}
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${config.iconColor} hover:opacity-70 transition-opacity`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};
