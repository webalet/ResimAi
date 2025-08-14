import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../utils/cn';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white focus:ring-indigo-500',
    ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-lg hover:shadow-xl'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const hoverAnimation = {
    scale: disabled || loading ? 1 : 1.02,
    y: disabled || loading ? 0 : -1
  };

  const tapAnimation = {
    scale: disabled || loading ? 1 : 0.98,
    y: disabled || loading ? 0 : 0
  };

  return (
    <motion.button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {loading && (
        <LoadingSpinner 
          size="sm" 
          variant="spinner" 
          color="primary"
          className="mr-2" 
        />
      )}
      {!loading && leftIcon && (
        <span className="mr-2">{leftIcon}</span>
      )}
      <span className={loading ? 'opacity-70' : ''}>
        {children}
      </span>
      {!loading && rightIcon && (
        <span className="ml-2">{rightIcon}</span>
      )}
    </motion.button>
  );
};

// Ripple effect button variant
export const RippleButton: React.FC<ButtonProps & { rippleColor?: string }> = ({
  rippleColor = 'rgba(255, 255, 255, 0.6)',
  children,
  className,
  ...props
}) => {
  const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; id: number }>>([]);

  const addRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const newRipple = { x, y, id: Date.now() };
    
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  return (
    <Button
      className={cn('relative overflow-hidden', className)}
      onMouseDown={addRipple}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            backgroundColor: rippleColor,
            width: 20,
            height: 20
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </Button>
  );
};

export default Button;