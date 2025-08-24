// Google Analytics 4 (GA4) Utility Functions
// Bu dosya Google Analytics entegrasyonu için gerekli fonksiyonları içerir

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// GA4 Measurement ID - Environment variable'dan alınır
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

/**
 * Google Analytics'i initialize eder
 * Sayfa yüklendiğinde bir kez çağrılmalıdır
 */
export const initializeGA = (): void => {
  try {
    if (!GA_MEASUREMENT_ID) {
      console.warn('GA Measurement ID bulunamadı. VITE_GA_MEASUREMENT_ID environment variable\'ını ayarlayın.');
      return;
    }

    if (typeof window.gtag === 'undefined') {
      console.warn('Google Analytics script yüklenmemiş. index.html\'de gtag script\'ini kontrol edin.');
      return;
    }

    // GA4 konfigürasyonu
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true
    });

    console.log('Google Analytics başarıyla initialize edildi:', GA_MEASUREMENT_ID);
  } catch (error) {
    console.error('Google Analytics initialize hatası:', error);
  }
};

/**
 * Sayfa görüntüleme olayını track eder
 * Route değişimlerinde çağrılmalıdır
 */
export const trackPageView = (page_title?: string, page_location?: string): void => {
  try {
    if (!GA_MEASUREMENT_ID || typeof window.gtag === 'undefined') {
      return;
    }

    window.gtag('event', 'page_view', {
      page_title: page_title || document.title,
      page_location: page_location || window.location.href
    });

    console.log('Page view tracked:', page_title || document.title);
  } catch (error) {
    console.error('Page view tracking hatası:', error);
  }
};

/**
 * Custom event'leri track eder
 * Kullanıcı etkileşimlerini izlemek için kullanılır
 */
export const trackEvent = (action: string, category: string, label?: string, value?: number): void => {
  try {
    if (!GA_MEASUREMENT_ID || typeof window.gtag === 'undefined') {
      return;
    }

    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });

    console.log('Event tracked:', { action, category, label, value });
  } catch (error) {
    console.error('Event tracking hatası:', error);
  }
};

/**
 * Kullanıcı özelliklerini ayarlar
 * Demografik bilgiler için kullanılır
 */
export const setUserProperties = (properties: Record<string, any>): void => {
  try {
    if (!GA_MEASUREMENT_ID || typeof window.gtag === 'undefined') {
      return;
    }

    window.gtag('config', GA_MEASUREMENT_ID, {
      custom_map: properties
    });

    console.log('User properties set:', properties);
  } catch (error) {
    console.error('User properties hatası:', error);
  }
};

/**
 * E-commerce olaylarını track eder
 * Satın alma, sepete ekleme gibi olaylar için
 */
export const trackPurchase = (transactionId: string, value: number, currency: string = 'TRY', items?: any[]): void => {
  try {
    if (!GA_MEASUREMENT_ID || typeof window.gtag === 'undefined') {
      return;
    }

    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items
    });

    console.log('Purchase tracked:', { transactionId, value, currency });
  } catch (error) {
    console.error('Purchase tracking hatası:', error);
  }
};

/**
 * Hata olaylarını track eder
 * Uygulama hatalarını izlemek için
 */
export const trackError = (error: Error, errorInfo?: string): void => {
  try {
    if (!GA_MEASUREMENT_ID || typeof window.gtag === 'undefined') {
      return;
    }

    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false,
      error_info: errorInfo
    });

    console.log('Error tracked:', error.message);
  } catch (trackingError) {
    console.error('Error tracking hatası:', trackingError);
  }
};

/**
 * Timing olaylarını track eder
 * Performans metrikleri için
 */
export const trackTiming = (name: string, value: number, category?: string, label?: string): void => {
  try {
    if (!GA_MEASUREMENT_ID || typeof window.gtag === 'undefined') {
      return;
    }

    window.gtag('event', 'timing_complete', {
      name: name,
      value: value,
      event_category: category,
      event_label: label
    });

    console.log('Timing tracked:', { name, value, category, label });
  } catch (error) {
    console.error('Timing tracking hatası:', error);
  }
};

// Yaygın kullanılan event'ler için kısayollar
export const analytics = {
  // Sayfa olayları
  pageView: trackPageView,
  
  // Kullanıcı etkileşimleri
  buttonClick: (buttonName: string) => trackEvent('click', 'button', buttonName),
  formSubmit: (formName: string) => trackEvent('submit', 'form', formName),
  linkClick: (linkUrl: string) => trackEvent('click', 'link', linkUrl),
  
  // İçerik etkileşimleri
  imageView: (imageName: string) => trackEvent('view', 'image', imageName),
  videoPlay: (videoName: string) => trackEvent('play', 'video', videoName),
  downloadFile: (fileName: string) => trackEvent('download', 'file', fileName),
  
  // E-commerce
  addToCart: (productId: string, value: number) => trackEvent('add_to_cart', 'ecommerce', productId, value),
  removeFromCart: (productId: string) => trackEvent('remove_from_cart', 'ecommerce', productId),
  purchase: trackPurchase,
  
  // Kullanıcı hesabı
  login: (method: string) => trackEvent('login', 'user', method),
  signup: (method: string) => trackEvent('sign_up', 'user', method),
  logout: () => trackEvent('logout', 'user'),
  
  // Hata ve performans
  error: trackError,
  timing: trackTiming
};

export default analytics;