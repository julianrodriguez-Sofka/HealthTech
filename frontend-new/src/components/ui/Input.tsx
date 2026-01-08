import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-3 text-lg'
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  inputSize = 'md',
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const hasError = !!error;
  const hasSuccess = success && !hasError;

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            w-full rounded-xl
            border-2 transition-all duration-200
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon || hasError || hasSuccess ? 'pr-10' : ''}
            ${sizeStyles[inputSize]}
            ${hasError 
              ? 'border-red-500 focus:border-red-600 focus:ring-4 focus:ring-red-500/10' 
              : hasSuccess
              ? 'border-emerald-500 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10'
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
            }
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            placeholder:text-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
            focus:outline-none
            ${className}
          `}
          {...props}
        />
        
        {(rightIcon || hasError || hasSuccess) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {hasError ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : hasSuccess ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-1.5 text-sm ${error ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}
        >
          {error || helperText}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
