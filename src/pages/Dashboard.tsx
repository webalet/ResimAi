import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  Image, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  TrendingUp,
  Users,
  Zap,
  Star,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiClient } from '../services/apiClient';
import { ImageJob, ProcessedImage } from '../../shared/types';
import { useApiWithRetry } from '../hooks/useApiWithRetry';

interface DashboardJob extends ImageJob {
  category_type: string;
  processed_images?: ProcessedImage[];
}

interface Stats {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  remainingCredits: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentJobs, setRecentJobs] = useState<DashboardJob[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    remainingCredits: 0
  });

  // Use API with retry hook for jobs
  const jobsApi = useApiWithRetry<any>({
    cacheKey: 'dashboard-jobs',
    cacheDuration: 2 * 60 * 1000, // 2 minutes
    rateLimitDelay: 1500, // 1.5 seconds between requests
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  });

  // Use API with retry hook for credits
  const creditsApi = useApiWithRetry<any>({
    cacheKey: 'dashboard-credits',
    cacheDuration: 1 * 60 * 1000, // 1 minute
    rateLimitDelay: 1000,
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  });

  const loading = jobsApi.loading || creditsApi.loading;
  const error = jobsApi.error || creditsApi.error;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      // Fetch jobs and credits with retry logic
      const [jobsData, creditsData] = await Promise.all([
        jobsApi.request(() => apiClient.get('/images/jobs?limit=1000')), // Get all jobs for accurate stats
        creditsApi.request(() => apiClient.get('/subscriptions/credits'))
      ]);

      if (jobsData?.success && jobsData.data) {
        const jobs = jobsData.data.jobs || [];
        setRecentJobs(jobs.slice(0, 3)); // Show only 3 recent jobs

        // Calculate stats from real data
        const totalJobs = jobs.length;
        const completedJobs = jobs.filter((job: DashboardJob) => job.status === 'completed').length;
        const pendingJobs = jobs.filter((job: DashboardJob) => job.status === 'pending' || job.status === 'processing').length;
        
        let remainingCredits = 0;
        if (creditsData?.success && creditsData.data) {
          remainingCredits = creditsData.data.remaining_credits || 0;
        }

        setStats({
          totalJobs,
          completedJobs,
          pendingJobs,
          remainingCredits
        });
      }
    } catch (error) {
      console.error('Dashboard data loading failed:', error);
    }
  }, [jobsApi.request, creditsApi.request]);

  const handleRetry = useCallback(async () => {
    // Clear cache and retry
    jobsApi.clearCache();
    creditsApi.clearCache();
    await loadDashboardData();
  }, [jobsApi.clearCache, creditsApi.clearCache, loadDashboardData]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'processing':
        return 'İşleniyor';
      case 'failed':
        return 'Başarısız';
      default:
        return 'Bekliyor';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Dashboard yükleniyor..." />
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Veri Yüklenemedi</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tekrar Dene
            </button>
            <p className="text-sm text-gray-500">
              Sorun devam ederse, lütfen bir süre bekleyip tekrar deneyin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Hoş geldin, {user?.name}!</h1>
        <p className="text-purple-100 mb-4">
          AI destekli fotoğraf işleme platformuna hoş geldin. Hemen yeni bir proje başlat!
        </p>
        <Link
          to="/categories"
          className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Yeni Proje Başlat
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Toplam İş</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bekleyen</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingJobs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Kalan Kredi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.remainingCredits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/categories"
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Upload className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Fotoğraf Yükle</h3>
          </div>
          <p className="text-gray-600">Yeni bir fotoğraf yükleyip AI ile işle</p>
        </Link>

        <Link
          to="/gallery"
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Image className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Galeri</h3>
          </div>
          <p className="text-gray-600">İşlenmiş fotoğraflarını görüntüle</p>
        </Link>

        <Link
          to="/subscription"
          className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center mb-4">
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="ml-3 text-lg font-semibold text-gray-900">Premium</h3>
          </div>
          <p className="text-gray-600">Premium özelliklerini keşfet</p>
        </Link>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Son İşler</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRetry}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Verileri yenile"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <Link
                to="/gallery"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Tümünü Gör
              </Link>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {recentJobs.length > 0 ? (
            recentJobs.map((job) => (
              <div key={job.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {job.processed_images && job.processed_images.length > 0 ? (
                      <img
                        src={job.processed_images[0].thumbnail_url || job.processed_images[0].image_url}
                        alt="Processed"
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : job.original_image_url ? (
                      <img
                        src={job.original_image_url}
                        alt="Original"
                        className="h-12 w-12 rounded-lg object-cover opacity-60"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Image className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {job.category_type} - {job.style}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(job.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(job.status)}
                    <span className="text-sm text-gray-600">
                      {getStatusText(job.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-8 text-center">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Henüz işlenmiş fotoğraf yok</p>
              <Link
                to="/categories"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-2 inline-block"
              >
                İlk fotoğrafını yükle
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;