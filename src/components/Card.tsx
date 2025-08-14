import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../utils/cn';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  clickable?: boolean;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  hover = true,
  clickable = false,
  children,
  className,
  ...props
}) => {
  const baseClasses = 'rounded-xl transition-all duration-300 ease-out';

  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white shadow-lg border border-gray-100',
    outlined: 'bg-white border-2 border-gray-300',
    glass: 'bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const hoverAnimation = hover ? {
    y: -4,
    scale: 1.02,
    boxShadow: variant === 'glass' 
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  } : {};

  const tapAnimation = clickable ? {
    scale: 0.98,
    y: 0
  } : {};

  return (
    <motion.div
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        clickable && 'cursor-pointer',
        className
      )}
      whileHover={hoverAnimation}
      whileTap={tapAnimation}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Card Header Component
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('mb-4', className)}>
    {children}
  </div>
);

// Card Title Component
export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}> = ({ children, className, as: Component = 'h3' }) => (
  <Component className={cn('text-lg font-semibold text-gray-900', className)}>
    {children}
  </Component>
);

// Card Content Component
export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('text-gray-600', className)}>
    {children}
  </div>
);

// Card Footer Component
export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-200', className)}>
    {children}
  </div>
);

// Feature Card Component
export const FeatureCard: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  onClick?: () => void;
}> = ({ icon, title, description, className, onClick }) => (
  <Card 
    variant="elevated" 
    padding="lg" 
    clickable={!!onClick}
    onClick={onClick}
    className={className}
  >
    {icon && (
      <motion.div 
        className="mb-4 text-indigo-600"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.div>
    )}
    <CardTitle className="mb-2">{title}</CardTitle>
    <CardContent>{description}</CardContent>
  </Card>
);

// Testimonial Card Component
export const TestimonialCard: React.FC<{
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
  rating?: number;
  className?: string;
}> = ({ quote, author, role, avatar, rating, className }) => (
  <Card variant="glass" padding="lg" className={className}>
    {rating && (
      <div className="flex mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <span className={cn(
              'text-lg',
              i < rating ? 'text-yellow-400' : 'text-gray-300'
            )}>
              ★
            </span>
          </motion.div>
        ))}
      </div>
    )}
    <CardContent className="mb-4 text-gray-700 italic">
      "{quote}"
    </CardContent>
    <div className="flex items-center">
      {avatar && (
        <motion.img
          src={avatar}
          alt={author}
          className="w-10 h-10 rounded-full mr-3"
          whileHover={{ scale: 1.1 }}
        />
      )}
      <div>
        <div className="font-semibold text-gray-900">{author}</div>
        {role && <div className="text-sm text-gray-600">{role}</div>}
      </div>
    </div>
  </Card>
);

export default Card;