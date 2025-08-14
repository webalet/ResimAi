import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onClose?: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  action
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(id), 300);
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colorClasses = {
    success: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: 'text-emerald-600',
      title: 'text-emerald-900',
      message: 'text-emerald-700',
      progress: 'bg-emerald-600'
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      message: 'text-red-700',
      progress: 'bg-red-600'
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      icon: 'text-amber-600',
      title: 'text-amber-900',
      message: 'text-amber-700',
      progress: 'bg-amber-600'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      message: 'text-blue-700',
      progress: 'bg-blue-600'
    }
  };

  const Icon = icons[type];
  const colors = colorClasses[type];

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative max-w-sm w-full rounded-lg border shadow-lg backdrop-blur-sm',
        colors.bg
      )}
    >
      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg overflow-hidden">
          <motion.div
            className={cn('h-full', colors.progress)}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start">
          {/* Icon */}
          <div className="flex-shrink-0">
            <Icon className={cn('w-5 h-5', colors.icon)} />
          </div>

          {/* Content */}
          <div className="ml-3 flex-1">
            {title && (
              <p className={cn('text-sm font-semibold', colors.title)}>
                {title}
              </p>
            )}
            <p className={cn('text-sm', colors.message, title && 'mt-1')}>
              {message}
            </p>

            {/* Action Button */}
            {action && (
              <div className="mt-3">
                <button
                  onClick={action.onClick}
                  className={cn(
                    'text-sm font-medium underline hover:no-underline transition-all duration-200',
                    colors.title
                  )}
                >
                  {action.label}
                </button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={cn(
                'inline-flex rounded-md p-1.5 transition-colors duration-200 hover:bg-black/5',
                colors.icon
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Toast Container Component
export const ToastContainer: React.FC<{
  toasts: ToastProps[];
  position?: ToastProps['position'];
  onRemove: (id: string) => void;
}> = ({ toasts, position = 'top-right', onRemove }) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div className={cn('fixed z-50 pointer-events-none', positionClasses[position])}>
      <div className="flex flex-col space-y-2 pointer-events-auto">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              {...toast}
              onClose={onRemove}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Toast Hook
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message: string, options?: Partial<ToastProps>) => {
    addToast({ ...options, message, type: 'success' });
  };

  const error = (message: string, options?: Partial<ToastProps>) => {
    addToast({ ...options, message, type: 'error' });
  };

  const warning = (message: string, options?: Partial<ToastProps>) => {
    addToast({ ...options, message, type: 'warning' });
  };

  const info = (message: string, options?: Partial<ToastProps>) => {
    addToast({ ...options, message, type: 'info' });
  };

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};

export default Toast;