import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { cn } from '../utils/cn';

interface ScrollToTopProps {
  threshold?: number;
  smooth?: boolean;
  className?: string;
  showProgress?: boolean;
}

const ScrollToTop: React.FC<ScrollToTopProps> = ({
  threshold = 300,
  smooth = true,
  className,
  showProgress = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrolled = window.pageYOffset;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrolled / maxScroll) * 100;
      
      setScrollProgress(progress);
      setIsVisible(scrolled > threshold);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [threshold]);

  const scrollToTop = () => {
    if (smooth) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo(0, 0);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          className={cn(
            'fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg',
            'bg-gradient-to-r from-indigo-600 to-purple-600 text-white',
            'hover:from-indigo-700 hover:to-purple-700',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
            'transition-all duration-300',
            className
          )}
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 100 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {showProgress ? (
            <div className="relative">
              <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="opacity-30"
                />
                <motion.circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: scrollProgress / 100 }}
                  transition={{ duration: 0.1 }}
                  style={{
                    strokeDasharray: '62.83',
                    strokeDashoffset: 62.83 - (62.83 * scrollProgress) / 100
                  }}
                />
              </svg>
              <ChevronUp className="absolute inset-0 w-4 h-4 m-auto" />
            </div>
          ) : (
            <ChevronUp className="w-6 h-6" />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// Smooth scroll utility hook
export const useSmoothScroll = () => {
  const scrollToElement = (elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return { scrollToElement, scrollToTop };
};

// Section Navigation Component
export const SectionNavigation: React.FC<{
  sections: Array<{ id: string; label: string }>;
  className?: string;
}> = ({ sections, className }) => {
  const [activeSection, setActiveSection] = useState('');
  const { scrollToElement } = useSmoothScroll();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5, rootMargin: '-20% 0px -20% 0px' }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav className={cn('flex space-x-1 p-1 bg-gray-100 rounded-lg', className)}>
      {sections.map(({ id, label }) => (
        <motion.button
          key={id}
          className={cn(
            'px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
            activeSection === id
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          )}
          onClick={() => scrollToElement(id, 80)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {label}
        </motion.button>
      ))}
    </nav>
  );
};

export default ScrollToTop;