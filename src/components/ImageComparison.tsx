import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LazyImage from './LazyImage';

interface ImageComparisonProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

const ImageComparison: React.FC<ImageComparisonProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  className = '',
  style,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Debug image URLs
  console.log('🔍 [DEBUG] ImageComparison Props:', {
    beforeImage,
    afterImage,
    beforeLabel,
    afterLabel
  });

  const updateSliderPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateSliderPosition(e.clientX);

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateSliderPosition(e.clientX);
      };

      const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [updateSliderPosition]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateSliderPosition(e.touches[0].clientX);

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateSliderPosition(e.touches[0].clientX);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
    },
    [updateSliderPosition]
  );

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      updateSliderPosition(e.clientX);
    },
    [updateSliderPosition]
  );

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden rounded-xl shadow-lg cursor-col-resize select-none min-h-[300px] ${className}`}
      style={{ touchAction: 'none', ...style }}
      onClick={handleContainerClick}
    >
      {/* After Image (Background) */}
      <LazyImage
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full"
        objectFit="cover"
      />
      <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium pointer-events-none z-20">
        {afterLabel}
      </div>

      {/* Before Image (Clipped with clipPath) */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{ 
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
        }}
      >
        <LazyImage
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-full"
          objectFit="cover"
        />
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
          {beforeLabel}
        </div>
      </div>

      {/* Slider Line and Handle */}
      <div
        className="absolute top-0 bottom-0 z-30 flex items-center justify-center"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        {/* Slider Line */}
        <div
          className="w-1 bg-white shadow-lg cursor-col-resize h-full"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
        
        {/* Slider Handle */}
        <div 
          className="absolute w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-col-resize"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <ChevronLeft className="w-3 h-3 text-gray-600 -ml-0.5" />
          <ChevronRight className="w-3 h-3 text-gray-600 -mr-0.5" />
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium opacity-75 pointer-events-none z-20">
        Drag to compare
      </div>
    </div>
  );
};

export default ImageComparison;