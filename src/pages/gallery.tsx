import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Clock, CheckCircle, XCircle, RefreshCw, Filter, Grid, List, Trash2 } from 'lucide-react';
import { JobWithImages, Category } from '../../shared/types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '../utils/cn';
import { useApiWithRetry } from '../hooks/useApiWithRetry';
import { apiClient } from '../services/apiClient';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

const Gallery: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
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
        return { ...job, status: 'failed' as const, error_message: t('gallery.timeoutError') };
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
      toast.error(t('gallery.loadError'));
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
        return t('gallery.status.completed');
      case 'processing':
        return t('gallery.status.processing');
      case 'failed':
        return t('gallery.status.failed');
      default:
        return t('gallery.status.pending');
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
      toast.success(t('gallery.downloadSuccess'));
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(t('gallery.downloadError'));
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm(t('gallery.deleteConfirm'))) {
      return;
    }

    try {
      const response = await apiClient.delete(`/images/jobs/${jobId}`);
      
      if (response.data.success) {
        toast.success(t('gallery.deleteSuccess'));
        // Remove the job from local state
        setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
        // Close modal if the deleted job was selected
        if (selectedJob?.id === jobId) {
          setSelectedJob(null);
          setSelectedImageIndex(0);
        }
      } else {
        toast.error(response.data.error || t('gallery.deleteError'));
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(t('gallery.deleteError'));
    }
  };

  if (jobsApi.loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text={t('gallery.loading')} />
      </div>
    );
  }

  if (jobsApi.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 space-y-4">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('gallery.loadFailed')}</h3>
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
            {t('gallery.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('gallery.title')}</h1>
          <p className="text-gray-600">{t('gallery.subtitle')}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">{t('gallery.filter.all')}</option>
              <option value="completed">{t('gallery.filter.completed')}</option>
              <option value="processing">{t('gallery.filter.processing')}</option>
              <option value="failed">{t('gallery.filter.failed')}</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Jobs Grid/List */}
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Eye className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('gallery.empty.title')}</h3>
            <p className="text-gray-600 mb-4">{t('gallery.empty.description')}</p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t('gallery.empty.createNew')}
            </Link>
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          )}>
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className={cn(
                  'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow',
                  viewMode === 'list' && 'flex items-center p-4'
                )}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Image */}
                    <div className="aspect-square bg-gray-100 relative">
                      {job.processed_images && job.processed_images.length > 0 ? (
                        <img
                          src={job.processed_images[0].image_url}
                          alt={`Generated image ${job.id}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
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

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title={t('gallery.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {job.category && (
                        <p className="text-sm text-gray-600 mb-2">
                          {t('gallery.category')}: {job.category.display_name_tr || job.category.name}
                        </p>
                      )}
                      
                      {job.processed_images && job.processed_images.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">
                            {job.processed_images.length} {t('gallery.images')}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setSelectedImageIndex(0);
                              }}
                              className="text-purple-600 hover:text-purple-700 transition-colors"
                              title={t('gallery.view')}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(job.processed_images[0].image_url, `image-${job.id}-1.jpg`)}
                              className="text-purple-600 hover:text-purple-700 transition-colors"
                              title={t('gallery.download')}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-4">
                      {job.processed_images && job.processed_images.length > 0 ? (
                        <img
                          src={job.processed_images[0].image_url}
                          alt={`Generated image ${job.id}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job.status)}
                          <span className="text-sm font-medium text-gray-900">
                            {getStatusText(job.status)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {job.category && (
                        <p className="text-sm text-gray-600 mb-1">
                          {t('gallery.category')}: {job.category.display_name_tr || job.category.name}
                        </p>
                      )}
                      
                      {job.processed_images && job.processed_images.length > 0 && (
                        <p className="text-sm text-gray-500">
                          {job.processed_images.length} {t('gallery.images')}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {job.processed_images && job.processed_images.length > 0 && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setSelectedImageIndex(0);
                            }}
                            className="text-purple-600 hover:text-purple-700 transition-colors"
                            title={t('gallery.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(job.processed_images[0].image_url, `image-${job.id}-1.jpg`)}
                            className="text-purple-600 hover:text-purple-700 transition-colors"
                            title={t('gallery.download')}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title={t('gallery.delete')}
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

        {/* Image Modal */}
        {selectedJob && selectedJob.processed_images && selectedJob.processed_images.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium">
                  {t('gallery.imageModal.title')} ({selectedImageIndex + 1}/{selectedJob.processed_images.length})
                </h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-4">
                <img
                  src={selectedJob.processed_images[selectedImageIndex].image_url}
                  alt={`Generated image ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-96 mx-auto rounded-lg"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                <div className="flex space-x-2">
                  {selectedJob.processed_images.length > 1 && (
                    <>
                      <button
                        onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                        disabled={selectedImageIndex === 0}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('gallery.imageModal.previous')}
                      </button>
                      <button
                        onClick={() => setSelectedImageIndex(Math.min(selectedJob.processed_images.length - 1, selectedImageIndex + 1))}
                        disabled={selectedImageIndex === selectedJob.processed_images.length - 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('gallery.imageModal.next')}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => handleDownload(
                    selectedJob.processed_images[selectedImageIndex].image_url,
                    `image-${selectedJob.id}-${selectedImageIndex + 1}.jpg`
                  )}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('gallery.download')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;