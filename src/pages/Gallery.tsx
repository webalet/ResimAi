import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Clock, CheckCircle, XCircle, RefreshCw, Filter, Grid, List } from 'lucide-react';
import { JobWithImages, Category } from '../../shared/types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';
import { cn } from '../utils/cn';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { apiClient } from '../services/apiClient';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

const Gallery: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobWithImages[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedJob, setSelectedJob] = useState<JobWithImages | null>(null);

  // API hook for jobs
  const jobsApi = useApiWithRetry({
    cacheKey: 'gallery-jobs',
    cacheDuration: 2 * 60 * 1000, // 2 minutes
    retryConfig: {
      maxRetries: 3
    }
  });

  const loadJobs = useCallback(async () => {
    try {
      const response = await jobsApi.request(() => 
        apiClient.get('/images/jobs?limit=50')
      );
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Jobs loading failed:', error);
      toast.error('İşler yüklenirken hata oluştu');
    }
  }, [jobsApi.request]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleRetry = useCallback(() => {
    jobsApi.clearCache();
    loadJobs();
  }, [jobsApi.clearCache, loadJobs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (filterStatus === 'all') return true;
    return job.status === filterStatus;
  });

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Fotoğraf indirildi');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('İndirme sırasında hata oluştu');
    }
  };

  if (jobsApi.loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="İşler yükleniyor..." />
      </div>
    );
  }

  if (jobsApi.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">İşler yüklenemedi</h3>
          <p className="text-gray-600 mb-4">{jobsApi.error}</p>
          <button
            onClick={handleRetry}
            disabled={jobsApi.loading}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {jobsApi.loading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Galeri</h1>
          <p className="text-gray-600">İşlenmiş fotoğraflarınızı görüntüleyin ve indirin</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Refresh Button */}
          <button
            onClick={handleRetry}
            disabled={jobsApi.loading}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Yenile"
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              jobsApi.loading && "animate-spin"
            )} />
          </button>
          
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Tümü</option>
              <option value="completed">Tamamlandı</option>
              <option value="processing">İşleniyor</option>
              <option value="pending">Bekliyor</option>
              <option value="failed">Başarısız</option>
            </select>
          </div>
          
          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-l-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-r-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Jobs */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Eye className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterStatus === 'all' ? 'Henüz işlenmiş fotoğraf yok' : `${getStatusText(filterStatus)} durumunda iş yok`}
          </h3>
          <p className="text-gray-600 mb-4">
            Fotoğraf işlemeye başlamak için bir kategori seçin.
          </p>
          <Link
            to="/categories"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Fotoğraf Yükle
          </Link>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        )}>
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={cn(
                'bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow',
                viewMode === 'list' && 'flex items-center space-x-4 p-4'
              )}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="aspect-square relative overflow-hidden rounded-t-xl">
                    <img
                      src={job.processed_images.length > 0 ? job.processed_images[0].thumbnail_url || job.processed_images[0].image_url : job.original_image_url}
                      alt={`${job.category?.display_name_tr} - ${job.style}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(job.status)
                      )}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1">{getStatusText(job.status)}</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {job.category?.display_name_tr}
                      </h3>
                      <span className="text-sm text-gray-500">{job.style}</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {new Date(job.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    
                    {job.status === 'completed' && job.processed_images.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {job.processed_images.length} sonuç
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(
                              job.processed_images[0].image_url,
                              `${job.category?.name}_${job.style}_${job.id}.jpg`
                            )}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="İndir"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {job.status === 'failed' && job.error_message && (
                      <p className="text-sm text-red-600 mt-2">
                        {job.error_message}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 flex-shrink-0">
                    <img
                      src={job.processed_images.length > 0 ? job.processed_images[0].thumbnail_url || job.processed_images[0].image_url : job.original_image_url}
                      alt={`${job.category?.display_name_tr} - ${job.style}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {job.category?.display_name_tr} - {job.style}
                      </h3>
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2',
                        getStatusColor(job.status)
                      )}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1">{getStatusText(job.status)}</span>
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(job.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    
                    {job.status === 'completed' && job.processed_images.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {job.processed_images.length} sonuç
                      </p>
                    )}
                    
                    {job.status === 'failed' && job.error_message && (
                      <p className="text-sm text-red-600">
                        {job.error_message}
                      </p>
                    )}
                  </div>
                  
                  {job.status === 'completed' && job.processed_images.length > 0 && (
                    <div className="flex space-x-2 flex-shrink-0">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Görüntüle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(
                          job.processed_images[0].image_url,
                          `${job.category?.name}_${job.style}_${job.id}.jpg`
                        )}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="İndir"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedJob.category?.display_name_tr} - {selectedJob.style}
                </h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedJob.processed_images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.image_url}
                      alt={`Sonuç ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => handleDownload(
                          image.image_url,
                          `${selectedJob.category?.name}_${selectedJob.style}_${selectedJob.id}_${index + 1}.jpg`
                        )}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all"
                        title="İndir"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;