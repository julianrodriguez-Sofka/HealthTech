import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantConfig: Record<ToastVariant, {
  bg: string;
  icon: React.ReactNode;
  iconColor: string;
}> = {
  success: {
    bg: 'bg-emerald-600',
    icon: <CheckCircle2 className="w-5 h-5" />,
    iconColor: 'text-white'
  },
  error: {
    bg: 'bg-red-600',
    icon: <AlertCircle className="w-5 h-5" />,
    iconColor: 'text-white'
  },
  info: {
    bg: 'bg-blue-600',
    icon: <Info className="w-5 h-5" />,
    iconColor: 'text-white'
  },
  warning: {
    bg: 'bg-amber-600',
    icon: <AlertTriangle className="w-5 h-5" />,
    iconColor: 'text-white'
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info', duration: number = 3000) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, variant, duration };
    
    setToasts((prev) => [...prev, toast]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
        <AnimatePresence>
          {toasts.map((toast) => {
            const config = variantConfig[toast.variant];
            
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.8 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className={`
                  ${config.bg} text-white
                  rounded-xl shadow-2xl p-4
                  flex items-center gap-3
                  min-w-[300px]
                `}
              >
                <div className={config.iconColor}>
                  {config.icon}
                </div>
                <p className="flex-1 font-medium text-sm">
                  {toast.message}
                </p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="w-5 h-5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const Toast = ToastProvider;
