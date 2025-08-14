import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars';
  color?: 'primary' | 'secondary' | 'accent';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text,
  variant = 'spinner',
  color = 'primary'
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    primary: 'border-t-indigo-600',
    secondary: 'border-t-purple-600',
    accent: 'border-t-cyan-600'
  };

  const dotSizes = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  'rounded-full bg-indigo-600',
                  dotSizes[size]
                )}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <motion.div
            className={cn(
              'rounded-full bg-indigo-600',
              sizeClasses[size]
            )}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1,
              repeat: Infinity
            }}
          />
        );
      
      case 'bars':
        return (
          <div className="flex space-x-1 items-end">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-indigo-600 rounded-full"
                style={{ height: size === 'sm' ? '12px' : size === 'md' ? '20px' : size === 'lg' ? '28px' : '36px' }}
                animate={{
                  scaleY: [1, 0.3, 1]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        );
      
      default:
        return (
          <motion.div 
            className={cn(
              'rounded-full border-2 border-gray-200',
              colorClasses[color],
              sizeClasses[size]
            )}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        );
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {renderSpinner()}
      {text && (
        <motion.p 
          className="mt-3 text-sm text-gray-600 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;