import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'striped' | 'animated';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  color = 'primary',
  showLabel = false,
  label,
  className,
  animated = true
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-indigo-600',
    secondary: 'bg-purple-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-600',
    danger: 'bg-red-600'
  };

  const gradientClasses = {
    primary: 'bg-gradient-to-r from-indigo-500 to-indigo-700',
    secondary: 'bg-gradient-to-r from-purple-500 to-purple-700',
    success: 'bg-gradient-to-r from-emerald-500 to-emerald-700',
    warning: 'bg-gradient-to-r from-amber-500 to-amber-700',
    danger: 'bg-gradient-to-r from-red-500 to-red-700'
  };

  const getProgressClasses = () => {
    let classes = 'h-full rounded-full transition-all duration-500 ease-out';
    
    if (variant === 'gradient') {
      classes += ` ${gradientClasses[color]}`;
    } else if (variant === 'striped') {
      classes += ` ${colorClasses[color]} bg-stripes`;
    } else if (variant === 'animated') {
      classes += ` ${gradientClasses[color]} animate-pulse`;
    } else {
      classes += ` ${colorClasses[color]}`;
    }
    
    return classes;
  };

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-medium text-gray-500">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className={cn(
        'w-full bg-gray-200 rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <motion.div
          className={getProgressClasses()}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: animated ? 0.8 : 0,
            ease: 'easeOut'
          }}
        />
      </div>
    </div>
  );
};

// Circular Progress Component
export const CircularProgress: React.FC<{
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  className?: string;
}> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = 'primary',
  showLabel = true,
  className
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    primary: 'stroke-indigo-600',
    secondary: 'stroke-purple-600',
    success: 'stroke-emerald-600',
    warning: 'stroke-amber-600',
    danger: 'stroke-red-600'
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={colorClasses[color]}
          initial={{
            strokeDasharray,
            strokeDashoffset: circumference
          }}
          animate={{
            strokeDashoffset
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut'
          }}
        />
      </svg>
      
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Step Progress Component
export const StepProgress: React.FC<{
  steps: Array<{ label: string; completed: boolean }>;
  currentStep: number;
  className?: string;
}> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            {/* Step Circle */}
            <motion.div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-all duration-300',
                index < currentStep
                  ? 'bg-indigo-600 text-white'
                  : index === currentStep
                  ? 'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-600'
                  : 'bg-gray-200 text-gray-500'
              )}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {index < currentStep ? '✓' : index + 1}
            </motion.div>
            
            {/* Step Label */}
            <span className={cn(
              'text-xs text-center font-medium',
              index <= currentStep ? 'text-gray-900' : 'text-gray-500'
            )}>
              {step.label}
            </span>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-200 -z-10">
                <motion.div
                  className="h-full bg-indigo-600"
                  initial={{ width: '0%' }}
                  animate={{ width: index < currentStep ? '100%' : '0%' }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;