import React, { useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Lütfen adınızı girin');
      return false;
    }
    
    if (!formData.email) {
      toast.error('Lütfen e-posta adresinizi girin');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Lütfen geçerli bir e-posta adresi girin');
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return false;
    }
    
    if (!acceptTerms) {
      toast.error('Lütfen kullanım şartlarını kabul edin');
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
          toast.error(`Çok fazla istek gönderildi. ${Math.ceil(waitTime / 1000)} saniye sonra tekrar denenecek...`, {
            duration: waitTime
          });
          
          setTimeout(() => {
            handleSubmitWithRetry(name, email, password, attempt + 1);
          }, waitTime);
        } else {
          toast.error('Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.');
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
      toast.error(`Lütfen ${remainingTime} saniye bekleyip tekrar deneyin.`);
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
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4 hover:scale-105 transition-transform cursor-pointer">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Kayıt Ol</h2>
          <p className="text-gray-600">Yeni hesap oluşturun</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Adınızı ve soyadınızı girin"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="En az 6 karakter"
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
                Şifre Tekrar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  placeholder="Şifrenizi tekrar girin"
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
                  Kullanım şartlarını
                </Link>{' '}
                ve{' '}
                <Link to="/privacy" className="text-purple-600 hover:text-purple-500">
                  gizlilik politikasını
                </Link>{' '}
                kabul ediyorum
              </label>
            </div>

            {rateLimitError && retryCount > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-2"></div>
                  <p className="text-sm text-yellow-800">
                    Yeniden deneniyor... ({retryCount}/{MAX_RETRY_ATTEMPTS})
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {rateLimitError && retryCount > 0 ? 'Yeniden deneniyor...' : 'Hesap oluşturuluyor...'}
                </div>
              ) : (
                'Hesap Oluştur'
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">veya</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Zaten hesabınız var mı?{' '}
                <Link
                  to="/login"
                  className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                >
                  Giriş yapın
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;