import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Clock, CheckCircle, XCircle, RefreshCw, Filter, Grid, List, Trash2 } from 'lucide-react';
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Helper function to check if job should timeout (5 minutes)
  const isJobTimedOut = (createdAt: string) => {
    const jobTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return currentTime - jobTime > fiveMinutes;
  };

  // Process jobs to handle timeouts
  const processJobsWithTimeout = (jobs: JobWithImages[]) => {
    return jobs.map(job => {
      if (job.status === 'processing' && isJobTimedOut(job.created_at)) {
        return { ...job, status: 'failed' as const, error_message: 'İşlem zaman aşımına uğradı (5 dakika)' };
      }
      return job;
    });
  };

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
      
      // Map API response to frontend format and handle timeouts
      const mappedJobs = (response.data.jobs || []).map((job: any) => ({
        ...job,
        category: job.categories // Map categories to category
      }));
      
      const processedJobs = processJobsWithTimeout(mappedJobs);
      setJobs(processedJobs);
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

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Bu işi ve tüm işlenmiş görselleri silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/images/jobs/${jobId}`);
      
      if (response.data.success) {
        toast.success('İş başarıyla silindi');
        // Remove the job from local state
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        // Close modal if the deleted job was selected
        if (selectedJob?.id === jobId) {
          setSelectedJob(null);
          setSelectedImageIndex(0);
        }
      } else {
        toast.error(response.data.error || 'Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Silme sırasında hata oluştu');
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
            <RefreshCw className={cn("h-5 w-5", jobsApi.loading && "animate-spin")} />
          </button>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              title="Grid görünümü"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list'
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              title="Liste görünümü"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Tümü', count: jobs.length },
          { key: 'completed', label: 'Tamamlanan', count: jobs.filter(j => j.status === 'completed').length },
          { key: 'processing', label: 'İşleniyor', count: jobs.filter(j => j.status === 'processing').length },
          { key: 'failed', label: 'Başarısız', count: jobs.filter(j => j.status === 'failed').length },
          { key: 'pending', label: 'Bekleyen', count: jobs.filter(j => j.status === 'pending').length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key as FilterStatus)}
            className={cn(
              'inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              filterStatus === key
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
            )}
          >
            {label}
            <span className="ml-2 px-2 py-0.5 bg-white/50 rounded-full text-xs">
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Jobs Grid/List */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Filter className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterStatus === 'all' ? 'Henüz işiniz yok' : `${filterStatus} durumunda iş bulunamadı`}
          </h3>
          <p className="text-gray-600 mb-4">
            {filterStatus === 'all' 
              ? 'İlk fotoğrafınızı işlemek için yeni bir iş oluşturun.'
              : 'Farklı bir filtre seçerek diğer işlerinizi görüntüleyebilirsiniz.'
            }
          </p>
          {filterStatus === 'all' && (
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Yeni İş Oluştur
            </Link>
          )}
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
            : 'space-y-4'
        )}>
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className={cn(
                'bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-200',
                viewMode === 'grid'
                  ? 'hover:shadow-lg hover:border-purple-200'
                  : 'hover:shadow-md hover:border-purple-200 p-4'
              )}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="aspect-square relative overflow-hidden rounded-t-xl group">
                    <img
                      src={job.processed_images.length > 0 ? job.processed_images[0].thumbnail_url || job.processed_images[0].image_url : job.original_image_url}
                      alt={`${job.category?.display_name_tr} - ${job.style}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onContextMenu={(e) => e.preventDefault()}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/ornek.jpg'; // Fallback image
                      }}
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
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {job.category?.display_name_tr}
                      </h3>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">
                      {job.style}
                    </p>
                    
                    <p className="text-xs text-gray-500 mb-3">
                      {new Date(job.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    
                    <div className="text-xs text-gray-600 mb-3 space-y-1">
                      <p><span className="font-medium">Kategori:</span> {job.category?.display_name_tr}</p>
                      <p><span className="font-medium">Stil:</span> {job.style}</p>
                      <p><span className="font-medium">Tarih:</span> {new Date(job.created_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      {job.processed_images.length > 0 && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setSelectedImageIndex(0);
                            }}
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
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
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
                      onContextMenu={(e) => e.preventDefault()}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/ornek.jpg'; // Fallback image
                      }}
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
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">Kategori:</span> {job.category?.display_name_tr}</p>
                      <p><span className="font-medium">Stil:</span> {job.style}</p>
                    </div>
                    
                    {job.status === 'failed' && job.error_message && (
                      <p className="text-sm text-red-600">
                        {job.error_message}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 flex-shrink-0">
                    {job.processed_images.length > 0 && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setSelectedImageIndex(0);
                          }}
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
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Modal - Full Screen */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
          setSelectedJob(null);
          setSelectedImageIndex(0);
        }}>
          <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => {
                setSelectedJob(null);
                setSelectedImageIndex(0);
              }}
              className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-red-500/80 text-white rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
            >
              <XCircle className="h-6 w-6" />
            </button>
            
            {/* Main Image Display */}
            <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
              <img
                src={selectedJob.processed_images[selectedImageIndex]?.image_url}
                alt={`Processed image ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                onContextMenu={(e) => e.preventDefault()}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/ornek.jpg'; // Fallback image
                }}
              />
              
              {/* Download Button Overlay */}
              <button
                onClick={() => handleDownload(
                  selectedJob.processed_images[selectedImageIndex]?.image_url,
                  `${selectedJob.category?.name}_${selectedJob.style}_${selectedJob.id}_${selectedImageIndex + 1}.jpg`
                )}
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 font-medium backdrop-blur-sm"
              >
                <Download className="h-5 w-5 mr-2" />
                İndir
              </button>
              
              {/* Image Counter */}
              {selectedJob.processed_images.length > 1 && (
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-white text-sm font-medium">
                    {selectedImageIndex + 1} / {selectedJob.processed_images.length}
                  </span>
                </div>
              )}
              
              {/* Navigation Arrows for Multiple Images */}
              {selectedJob.processed_images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : selectedJob.processed_images.length - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-purple-500/80 text-white rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(selectedImageIndex < selectedJob.processed_images.length - 1 ? selectedImageIndex + 1 : 0)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-purple-500/80 text-white rounded-full transition-all duration-200 hover:scale-110 backdrop-blur-sm"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;