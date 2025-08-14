import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from './LazyImage';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    src: string;
    alt: string;
    title?: string;
    description?: string;
  }>;
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onPrevious,
  onNext
}) => {
  const currentImage = images[currentIndex];

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious();
          break;
        case 'ArrowRight':
          onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, onPrevious, onNext]);

  if (!currentImage) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevious();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-white hover:text-gray-300 transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative max-w-7xl max-h-[90vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <LazyImage
              src={currentImage.src}
              alt={currentImage.alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            
            {/* Image Info */}
            {(currentImage.title || currentImage.description) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                {currentImage.title && (
                  <h3 className="text-white text-xl font-semibold mb-2">
                    {currentImage.title}
                  </h3>
                )}
                {currentImage.description && (
                  <p className="text-gray-300 text-sm">
                    {currentImage.description}
                  </p>
                )}
              </div>
            )}
          </motion.div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;