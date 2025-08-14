import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { useLazyImage, useReducedMotion } from '../hooks/usePerformance';
import SkeletonLoader from './SkeletonLoader';

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallback?: React.ReactNode;
  showSkeleton?: boolean;
  webpSrc?: string;
  sizes?: string;
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

// WebP support detection
const supportsWebP = (() => {
  if (typeof window === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
})();

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className,
  width,
  height,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  fallback,
  showSkeleton = true,
  webpSrc,
  sizes = '100vw',
  decoding = 'async',
  fetchPriority = 'auto'
}) => {
  const { ref, src: imageSrc, isLoaded, isError } = useLazyImage(src, placeholder);
  const prefersReducedMotion = useReducedMotion();
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Determine the best image source
  const finalImageSrc = supportsWebP && webpSrc ? webpSrc : imageSrc;

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    onError?.();
  };

  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 1.05 },
        animate: { opacity: imageLoaded ? 1 : 0, scale: 1 },
        transition: { duration: 0.3, ease: 'easeOut' as const }
      };

  if (isError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      style={{ width, height }}
    >
      {/* Skeleton Loader */}
      {showSkeleton && !imageLoaded && (
        <div className="absolute inset-0">
          <SkeletonLoader
            variant="image"
            className="w-full h-full"
          />
        </div>
      )}

      {/* Actual Image */}
      {imageSrc && (
        <motion.img
          src={finalImageSrc}
          alt={alt}
          sizes={sizes}
          loading={loading}
          decoding={decoding}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            `object-${objectFit}`,
            !imageLoaded && 'opacity-0'
          )}
          {...animationProps}
        />
      )}

      {/* Error State */}
      {isError && !fallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Resim yüklenemedi</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Progressive Image Component with multiple sources
export const ProgressiveImage: React.FC<{
  src: string;
  lowQualitySrc?: string;
  alt: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}> = ({ src, lowQualitySrc, alt, className, width, height }) => {
  const [currentSrc, setCurrentSrc] = useState(lowQualitySrc || '');
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setCurrentSrc(src);
      setIsHighQualityLoaded(true);
    };
    img.src = src;
  }, [src]);

  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.3 }
      };

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ width, height }}>
      {/* Low quality image */}
      {lowQualitySrc && !isHighQualityLoaded && (
        <motion.img
          src={lowQualitySrc}
          alt={alt}
          className="w-full h-full object-cover filter blur-sm scale-105"
          {...animationProps}
        />
      )}

      {/* High quality image */}
      {currentSrc && (
        <motion.img
          src={currentSrc}
          alt={alt}
          className={cn(
            'absolute inset-0 w-full h-full object-cover',
            isHighQualityLoaded ? 'opacity-100' : 'opacity-0'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHighQualityLoaded ? 1 : 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
        />
      )}
    </div>
  );
};

// Image Gallery with lazy loading
export const ImageGallery: React.FC<{
  images: Array<{ src: string; alt: string; thumbnail?: string }>;
  className?: string;
  columns?: number;
  gap?: number;
}> = ({ images, className, columns = 3, gap = 4 }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'grid gap-4',
        `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`,
        `gap-${gap}`,
        className
      )}
    >
      {images.map((image, index) => (
        <motion.div
          key={index}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className="aspect-square"
        >
          <LazyImage
            src={image.src}
            alt={image.alt}
            placeholder={image.thumbnail}
            className="w-full h-full rounded-lg"
            objectFit="cover"
          />
        </motion.div>
      ))}
    </div>
  );
};

export default LazyImage;