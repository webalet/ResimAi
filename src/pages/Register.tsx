import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSubmitTimeRef = useRef<number>(0);
  const { t } = useTranslation();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error(t('auth.errors.enterName'));
      return false;
    }
    
    if (!formData.email) {
      toast.error(t('auth.errors.enterEmail'));
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error(t('auth.errors.validEmail'));
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error(t('auth.errors.passwordLength'));
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.errors.passwordMismatch'));
      return false;
    }
    
    if (!acceptTerms) {
      toast.error(t('auth.errors.acceptTerms'));
      return false;
    }
    
    return true;
  };

  // Rate limiting: minimum 2 seconds between requests
  const RATE_LIMIT_MS = 2000;
  const MAX_RETRY_ATTEMPTS = 3;
  
  const handleSubmitWithRetry = useCallback(async (name: string, email: string, password: string, attempt: number = 0): Promise<void> => {
    try {
      await register(name, email, password);
      setRateLimitError(false);
      setRetryCount(0);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.response?.status === 429) {
        setRateLimitError(true);
        
        if (attempt < MAX_RETRY_ATTEMPTS) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : backoffDelay;
          
          setRetryCount(attempt + 1);
          toast.error(t('auth.errors.rateLimitRetry', { seconds: Math.ceil(waitTime / 1000) }), {
            duration: waitTime
          });
          
          setTimeout(() => {
            handleSubmitWithRetry(name, email, password, attempt + 1);
          }, waitTime);
        } else {
          toast.error(t('auth.errors.tooManyAttempts'));
          setRetryCount(0);
        }
      } else {
        setRateLimitError(false);
        setRetryCount(0);
        // Other errors are handled in AuthContext
      }
    }
  }, [register, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Rate limiting check
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;
    
    if (timeSinceLastSubmit < RATE_LIMIT_MS) {
      const remainingTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastSubmit) / 1000);
      toast.error(t('auth.errors.waitSeconds', { seconds: remainingTime }));
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
        await handleSubmitWithRetry(formData.name, formData.email, formData.password);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
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
          <Link to="/" className="inline-block">
            <motion.div 
              className="mx-auto h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4 cursor-pointer"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <UserPlus className="h-6 w-6 text-white" />
            </motion.div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.register.title')}</h2>
          <p className="text-gray-600">{t('auth.register.subtitle')}</p>
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.fields.fullName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ease-in-out"
                  placeholder={t('auth.placeholders.fullName')}
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(147, 51, 234, 0.15)" }}
                  whileFocus={{ scale: 1.02, boxShadow: "0 4px 20px rgba(147, 51, 234, 0.25)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
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
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ease-in-out"
                  placeholder={t('auth.placeholders.passwordLength')}
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.fields.confirmPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <motion.input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ease-in-out"
                  placeholder={t('auth.placeholders.confirmPassword')}
                  whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(147, 51, 234, 0.15)" }}
                  whileFocus={{ scale: 1.02, boxShadow: "0 4px 20px rgba(147, 51, 234, 0.25)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="accept-terms"
                name="accept-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="accept-terms" className="ml-2 block text-sm text-gray-700">
                <Link to="/terms" className="text-purple-600 hover:text-purple-500">
                  {t('auth.terms')}
                </Link>{' '}
                {t('common.and')}{' '}
                <Link to="/privacy" className="text-purple-600 hover:text-purple-500">
                  {t('auth.privacy')}
                </Link>{' '}
                {t('auth.acceptText')}
              </label>
            </div>

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
                  {rateLimitError && retryCount > 0 ? t('auth.retryingShort') : t('auth.creatingAccount')}
                </div>
              ) : (
                t('auth.register.button')
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
                {t('auth.hasAccount')}{' '}
                <Link
                  to="/login"
                  className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                >
                  {t('auth.login.link')}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;