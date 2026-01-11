import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'success' | 'info' | 'warning';
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    iconBgColor: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600',
    buttonVariant: 'danger' as const
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconBgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600',
    buttonVariant: 'success' as const
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600',
    buttonVariant: 'primary' as const
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    iconBgColor: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600',
    buttonVariant: 'secondary' as const
  }
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'info',
  isLoading = false
}) => {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className={`
                relative w-full max-w-md bg-white dark:bg-gray-800 
                rounded-2xl shadow-2xl overflow-hidden
              `}
            >
              {/* Header with icon */}
              <div className={`${config.bgColor} p-6 pb-4`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${config.iconBgColor} rounded-xl flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${config.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 pt-4 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {cancelText}
                </Button>
                <Button
                  variant={config.buttonVariant}
                  onClick={onConfirm}
                  isLoading={isLoading}
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
