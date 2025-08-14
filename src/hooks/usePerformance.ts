import { useState, useEffect, useCallback } from 'react';

// Performance monitoring hook
export const usePerformance = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    isSlowDevice: false
  });

  useEffect(() => {
    // Detect slow devices
    const detectSlowDevice = () => {
      const connection = (navigator as any).connection;
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const memory = (performance as any).memory;
      
      let isSlowDevice = false;
      
      // Check connection speed
      if (connection && connection.effectiveType) {
        isSlowDevice = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
      }
      
      // Check hardware concurrency (CPU cores)
      if (hardwareConcurrency < 4) {
        isSlowDevice = true;
      }
      
      // Check available memory
      if (memory && memory.jsHeapSizeLimit < 1000000000) { // Less than 1GB
        isSlowDevice = true;
      }
      
      return isSlowDevice;
    };

    // Measure FPS
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };

    // Measure memory usage
    const measureMemory = () => {
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const memoryUsage = Math.round(
          (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        );
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    // Measure load time
    const measureLoadTime = () => {
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    };

    // Initialize measurements
    setMetrics(prev => ({ ...prev, isSlowDevice: detectSlowDevice() }));
    measureFPS();
    measureMemory();
    measureLoadTime();

    // Update memory usage periodically
    const memoryInterval = setInterval(measureMemory, 5000);

    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  return metrics;
};

// Reduced motion preference hook
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Intersection Observer hook for performance
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [ref, setRef] = useState<Element | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return [setRef, isIntersecting] as const;
};

// Image lazy loading hook
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [ref, isIntersecting] = useIntersectionObserver();

  useEffect(() => {
    if (isIntersecting && src) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      
      img.onerror = () => {
        setIsError(true);
      };
      
      img.src = src;
    }
  }, [isIntersecting, src]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    isError
  };
};

// Debounce hook for performance
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttle hook for performance
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const [isThrottled, setIsThrottled] = useState(false);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (!isThrottled) {
        callback(...args);
        setIsThrottled(true);
        setTimeout(() => setIsThrottled(false), delay);
      }
    },
    [callback, delay, isThrottled]
  ) as T;

  return throttledCallback;
};

// Viewport size hook
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  });

  useEffect(() => {
    const handleResize = useThrottle(() => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth < 768,
        isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
        isDesktop: window.innerWidth >= 1024
      });
    }, 100);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
};

// Battery status hook for performance optimization
export const useBattery = () => {
  const [battery, setBattery] = useState({
    charging: true,
    level: 1,
    chargingTime: 0,
    dischargingTime: Infinity
  });

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBattery({
            charging: battery.charging,
            level: battery.level,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          });
        };

        updateBattery();
        battery.addEventListener('chargingchange', updateBattery);
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingtimechange', updateBattery);
        battery.addEventListener('dischargingtimechange', updateBattery);

        return () => {
          battery.removeEventListener('chargingchange', updateBattery);
          battery.removeEventListener('levelchange', updateBattery);
          battery.removeEventListener('chargingtimechange', updateBattery);
          battery.removeEventListener('dischargingtimechange', updateBattery);
        };
      });
    }
  }, []);

  return battery;
};