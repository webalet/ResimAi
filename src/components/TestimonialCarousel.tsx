import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
  company?: string;
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
}

const TestimonialCarousel: React.FC<TestimonialCarouselProps> = ({
  testimonials,
  autoPlay = true,
  autoPlayInterval = 5000,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && testimonials.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, autoPlayInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, testimonials.length, autoPlayInterval]);

  // Touch handlers for swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextTestimonial();
    } else if (isRightSwipe) {
      previousTestimonial();
    }
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const previousTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  const pauseAutoPlay = () => {
    setIsPlaying(false);
  };

  const resumeAutoPlay = () => {
    setIsPlaying(autoPlay);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <motion.div
        key={i}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
      >
        <Star
          className={`w-5 h-5 ${
            i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      </motion.div>
    ));
  };

  const generateAvatar = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    const colors = [
      'bg-gradient-to-br from-purple-500 to-pink-500',
      'bg-gradient-to-br from-blue-500 to-cyan-500',
      'bg-gradient-to-br from-green-500 to-teal-500',
      'bg-gradient-to-br from-orange-500 to-red-500',
      'bg-gradient-to-br from-indigo-500 to-purple-500'
    ];
    const colorIndex = name.length % colors.length;
    
    return (
      <div className={`w-16 h-16 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
        {initials}
      </div>
    );
  };

  if (testimonials.length === 0) return null;

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main Testimonial Display */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden"
          >
            {/* Background Quote Icon */}
            <div className="absolute top-4 right-4 opacity-10">
              <Quote className="w-16 h-16 text-primary-600" />
            </div>
            
            {/* Rating Stars */}
            <div className="flex items-center space-x-1 mb-6">
              {renderStars(currentTestimonial.rating)}
            </div>
            
            {/* Testimonial Content */}
            <motion.blockquote 
              className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              "{currentTestimonial.content}"
            </motion.blockquote>
            
            {/* Author Info */}
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {currentTestimonial.avatar ? (
                  <img
                    src={currentTestimonial.avatar}
                    alt={currentTestimonial.name}
                    className="w-16 h-16 rounded-full object-cover shadow-lg"
                  />
                ) : (
                  generateAvatar(currentTestimonial.name)
                )}
              </div>
              
              {/* Author Details */}
              <div>
                <h4 className="text-xl font-semibold text-gray-900">
                  {currentTestimonial.name}
                </h4>
                <p className="text-gray-600">
                  {currentTestimonial.role}
                  {currentTestimonial.company && (
                    <span className="text-primary-600"> at {currentTestimonial.company}</span>
                  )}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      {testimonials.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <button
            onClick={previousTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-primary-600 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-primary-600 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-10"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-primary-600 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Progress Bar */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-600 to-secondary-600"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: autoPlayInterval / 1000, ease: 'linear' }}
                key={currentIndex}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TestimonialCarousel;