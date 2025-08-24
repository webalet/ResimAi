import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errors, setErrors] = useState<{email?: string; password?: string; general?: string}>({});
  const [showBannedModal, setShowBannedModal] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang } = useParams();
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSubmitTimeRef = useRef<number>(0);
  const { t } = useTranslation();
  
  const currentLang = lang || 'tr';
  const from = location.state?.from?.pathname || `/${currentLang}/dashboard`;

  // Scroll to top when component mounts and check for banned status
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Check if user was banned (from URL param or localStorage)
    const urlParams = new URLSearchParams(location.search);
    const isBannedFromUrl = urlParams.get('banned') === 'true';
    const isBannedFromStorage = localStorage.getItem('userBanned') === 'true';
    
    if (isBannedFromUrl || isBannedFromStorage) {
      setShowBannedModal(true);
      // Clear the banned flag from localStorage and URL
      localStorage.removeItem('userBanned');
      // Clean URL without banned parameter
      if (isBannedFromUrl) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [location.search]);

  // Rate limiting: minimum 2 seconds between requests
  const RATE_LIMIT_MS = 2000;
  const MAX_RETRY_ATTEMPTS = 3;
  
  const handleSubmitWithRetry = useCallback(async (email: string, password: string, attempt: number = 0): Promise<void> => {
    try {
      // Clear previous errors
      setErrors({});
      setRateLimitError(false);
      
      await login(email, password);
      setRetryCount(0);
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error.response?.status === 429) {
        setRateLimitError(true);
        
        if (attempt < MAX_RETRY_ATTEMPTS) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          const retryAfter = error.retryAfter || error.response?.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : backoffDelay;
          
          setRetryCount(attempt + 1);
          toast.error(t('auth.errors.rateLimitRetry', { seconds: Math.ceil(waitTime / 1000) }), {
            duration: waitTime
          });
          
          setTimeout(() => {
            handleSubmitWithRetry(email, password, attempt + 1);
          }, waitTime);
        } else {
          toast.error(t('auth.errors.tooManyAttempts'));
          setRetryCount(0);
          setRateLimitError(false);
        }
      } else {
        setRateLimitError(false);
        setRetryCount(0);
        
        // Show user-friendly error message from AuthContext
        const errorMessage = error.userMessage || error.message || t('auth.errors.loginFailed');
        toast.error(errorMessage);
        
        // Set form-level error for display
        setErrors({ general: errorMessage });
      }
    }
  }, [login, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    if (!email || !password) {
      const errorMessage = t('auth.errors.fillAllFields');
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
      return;
    }

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;
    
    if (timeSinceLastSubmit < RATE_LIMIT_MS) {
      const remainingTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastSubmit) / 1000);
      const errorMessage = t('auth.errors.waitSeconds', { seconds: remainingTime });
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
      return;
    }

    // Prevent multiple simultaneous submissions
    if (isLoading) {
      return;
    }

    // Clear any existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    setIsLoading(true);
    lastSubmitTimeRef.current = now;
    
    // Debounce: wait 300ms before actual submission
    submitTimeoutRef.current = setTimeout(async () => {
      try {
        await handleSubmitWithRetry(email, password);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const closeBannedModal = () => {
    setShowBannedModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Banned User Modal */}
      <AnimatePresence>
        {showBannedModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeBannedModal}
            />
            
            {/* Modal */}
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              {/* Close Button */}
              <button
                onClick={closeBannedModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
              
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  className="p-4 bg-red-100 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </motion.div>
              </div>
              
              {/* Content */}
              <div className="text-center">
                <motion.h3
                  className="text-xl font-bold text-gray-900 mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {t('auth.errors.accountBanned')}
                </motion.h3>
                
                <motion.p
                  className="text-gray-600 mb-6 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {t('auth.errors.contactSupport')}
                </motion.p>
                
                <motion.button
                  onClick={closeBannedModal}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('common.understood')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div 
        className="max-w-md w-full space-y-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div 
            className="mx-auto h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <LogIn className="h-6 w-6 text-white" />
          </motion.div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.login.title')}</h2>
          <p className="text-gray-600">{t('auth.login.subtitle')}</p>
        </motion.div>

        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.fields.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear errors when user starts typing
                    if (errors.email || errors.general) {
                      setErrors(prev => ({ ...prev, email: '', general: '' }));
                    }
                  }}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ease-in-out"
                  placeholder={t('auth.placeholders.email')}
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(147, 51, 234, 0.15)" }}
                  whileFocus={{ scale: 1.02, boxShadow: "0 4px 20px rgba(147, 51, 234, 0.25)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.fields.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear errors when user starts typing
                    if (errors.password || errors.general) {
                      setErrors(prev => ({ ...prev, password: '', general: '' }));
                    }
                  }}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ease-in-out"
                  placeholder={t('auth.placeholders.password')}
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(147, 51, 234, 0.15)" }}
                  whileFocus={{ scale: 1.02, boxShadow: "0 4px 20px rgba(147, 51, 234, 0.25)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  {t('auth.rememberMe')}
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to={`/${currentLang}/forgot-password`}
                  className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            {/* General error message */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            )}

            {/* Rate limit retry indicator */}
            {rateLimitError && retryCount > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                  <p className="text-sm text-yellow-800">
                    {t('auth.retrying', { current: retryCount, max: MAX_RETRY_ATTEMPTS })}
                  </p>
                </div>
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              whileHover={!isLoading ? { 
                scale: 1.02, 
                boxShadow: "0 10px 25px rgba(147, 51, 234, 0.4)",
                background: "linear-gradient(to right, #7c3aed, #2563eb)"
              } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {rateLimitError && retryCount > 0 ? t('auth.retryingShort') : t('auth.loggingIn')}
                </div>
              ) : (
                t('auth.login.button')
              )}
            </motion.button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('common.or')}</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t('auth.noAccount')}{' '}
                <Link
                  to={`/${currentLang}/register`}
                  className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                >
                  {t('auth.register.link')}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;