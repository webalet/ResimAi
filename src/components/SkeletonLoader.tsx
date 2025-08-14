import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'card' | 'avatar' | 'image' | 'button';
  lines?: number;
  width?: string;
  height?: string;
  rounded?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = 'text',
  lines = 1,
  width,
  height,
  rounded = false
}) => {
  const shimmerAnimation = {
    backgroundPosition: ['-200px 0', '200px 0'],
  };

  const shimmerTransition = {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear' as const
  };

  const baseClasses = cn(
    'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200px_100%]',
    rounded && 'rounded-lg',
    className
  );

  const renderSkeleton = () => {
    switch (variant) {
      case 'avatar':
        return (
          <motion.div
            className={cn(
              baseClasses,
              'w-12 h-12 rounded-full',
              width && `w-[${width}]`,
              height && `h-[${height}]`
            )}
            animate={shimmerAnimation}
            transition={shimmerTransition}
          />
        );

      case 'card':
        return (
          <div className={cn('space-y-3', className)}>
            <motion.div
              className={cn(baseClasses, 'h-48 w-full rounded-lg')}
              animate={shimmerAnimation}
              transition={shimmerTransition}
            />
            <div className="space-y-2">
              <motion.div
                className={cn(baseClasses, 'h-4 w-3/4 rounded')}
                animate={shimmerAnimation}
                transition={{ ...shimmerTransition, delay: 0.1 }}
              />
              <motion.div
                className={cn(baseClasses, 'h-4 w-1/2 rounded')}
                animate={shimmerAnimation}
                transition={{ ...shimmerTransition, delay: 0.2 }}
              />
            </div>
          </div>
        );

      case 'image':
        return (
          <motion.div
            className={cn(
              baseClasses,
              'w-full h-64 rounded-lg',
              width && `w-[${width}]`,
              height && `h-[${height}]`
            )}
            animate={shimmerAnimation}
            transition={shimmerTransition}
          />
        );

      case 'button':
        return (
          <motion.div
            className={cn(
              baseClasses,
              'h-10 w-24 rounded-md',
              width && `w-[${width}]`,
              height && `h-[${height}]`
            )}
            animate={shimmerAnimation}
            transition={shimmerTransition}
          />
        );

      default: // text
        return (
          <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, index) => (
              <motion.div
                key={index}
                className={cn(
                  baseClasses,
                  'h-4 rounded',
                  index === lines - 1 ? 'w-3/4' : 'w-full',
                  width && `w-[${width}]`,
                  height && `h-[${height}]`
                )}
                animate={shimmerAnimation}
                transition={{ ...shimmerTransition, delay: index * 0.1 }}
              />
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
};

// Compound components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <SkeletonLoader variant="card" className={className} />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className }) => (
  <SkeletonLoader variant="text" lines={lines} className={className} />
);

export const SkeletonAvatar: React.FC<{ size?: string; className?: string }> = ({ size = '12', className }) => (
  <SkeletonLoader variant="avatar" width={size} height={size} className={className} />
);

export const SkeletonImage: React.FC<{ width?: string; height?: string; className?: string }> = ({ width, height, className }) => (
  <SkeletonLoader variant="image" width={width} height={height} className={className} />
);

export const SkeletonButton: React.FC<{ width?: string; className?: string }> = ({ width, className }) => (
  <SkeletonLoader variant="button" width={width} className={className} />
);

export default SkeletonLoader;