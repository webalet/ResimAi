import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Clock, CheckCircle, XCircle, RefreshCw, Filter, Grid, List, Trash2, X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { JobWithImages, Category } from '../../shared/types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageComparison from '../components/ImageComparison';
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-xl"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="h-8 w-8 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('gallery.loading')}</h3>
            <p className="text-gray-600">Galerinizdeki muhteşem çalışmalar yükleniyor...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (jobsApi.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-xl max-w-md mx-auto"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t('gallery.loadFailed')}</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">{jobsApi.error}</p>
            <button
              onClick={handleRetry}
              disabled={jobsApi.loading}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
            >
              {jobsApi.loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('gallery.retry')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 py-4">
      <div className="w-full px-2 sm:px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            {t('gallery.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('gallery.subtitle')}</p>
        </motion.div>

        {/* Controls */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          {/* Filter */}
          <div className="flex items-center space-x-3 bg-white/70 backdrop-blur-sm rounded-2xl px-4 py-3 border border-white/20 shadow-lg">
            <Filter className="h-5 w-5 text-purple-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
            >
              <option value="all">{t('gallery.filter.all')}</option>
              <option value="completed">{t('gallery.filter.completed')}</option>
              <option value="processing">{t('gallery.filter.processing')}</option>
              <option value="failed">{t('gallery.filter.failed')}</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm rounded-2xl p-2 border border-white/20 shadow-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-3 rounded-xl transition-all duration-200',
                viewMode === 'grid'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              )}
            >
              <Grid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-3 rounded-xl transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
              )}
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </motion.div>

        {/* Jobs Grid/List */}
        {filteredJobs.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-16"
          >
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-white/20 shadow-xl max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Eye className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('gallery.empty.title')}</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">{t('gallery.empty.description')}</p>
              <Link
                to="/"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {t('gallery.empty.createNew')}
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6'
                : 'space-y-6'
            )}
          >
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'group bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300',
                  viewMode === 'list' && 'flex items-center p-6'
                )}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Image Section with ImageComparison */}
                    <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      {job.processed_images && job.processed_images.length > 0 && job.original_image_url ? (
                        <ImageComparison
                          beforeImage={job.original_image_url}
                          afterImage={job.processed_images[0].image_url}
                          beforeLabel="Öncesi"
                          afterLabel="Sonrası"
                          className="relative overflow-hidden rounded-xl shadow-lg cursor-col-resize select-none w-full h-full"
                        />
                      ) : job.processed_images && job.processed_images.length > 0 ? (
                        <img
                          src={job.processed_images[0].image_url}
                          alt={`Generated image ${job.id}`}
                          className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                          <div className="text-center">
                            <Eye className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                            <p className="text-sm text-purple-600 font-medium">İşleniyor...</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={cn(
                          'inline-flex items-center px-3 py-2 rounded-full text-xs font-semibold backdrop-blur-sm border border-white/20 shadow-lg',
                          job.status === 'completed' && 'bg-green-500/90 text-white',
                          job.status === 'processing' && 'bg-blue-500/90 text-white',
                          job.status === 'failed' && 'bg-red-500/90 text-white',
                          job.status === 'pending' && 'bg-yellow-500/90 text-white'
                        )}>
                          {getStatusIcon(job.status)}
                          <span className="ml-2">{getStatusText(job.status)}</span>
                        </span>
                      </div>


                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-600">
                            {new Date(job.created_at).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      {job.category && (
                        <div className="mb-4">
                          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm font-medium">
                            {job.category.display_name_tr || job.category.name}
                          </span>
                        </div>
                      )}
                      
                      {job.processed_images && job.processed_images.length > 0 && (
                        <div className="flex items-center justify-between">

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setSelectedImageIndex(0);
                              }}
                              className="p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-all duration-200 transform hover:scale-110"
                              title={t('gallery.view')}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownload(job.processed_images[0].image_url, `image-${job.id}-1.jpg`)}
                              className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all duration-200 transform hover:scale-110"
                              title={t('gallery.download')}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteJob(job.id)}
                              className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all duration-200 transform hover:scale-110"
                              title={t('gallery.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden mr-6 relative">
                      {job.processed_images && job.processed_images.length > 0 ? (
                        <img
                          src={job.processed_images[0].image_url}
                          alt={`Generated image ${job.id}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                          <Eye className="h-8 w-8 text-purple-400" />
                        </div>
                      )}
                      
                      {/* Mini Status Badge */}
                      <div className="absolute -top-1 -right-1">
                        <div className={cn(
                          'w-4 h-4 rounded-full border-2 border-white',
                          job.status === 'completed' && 'bg-green-500',
                          job.status === 'processing' && 'bg-blue-500',
                          job.status === 'failed' && 'bg-red-500',
                          job.status === 'pending' && 'bg-yellow-500'
                        )}></div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(job.status)}
                          <span className="text-base font-semibold text-gray-900">
                            {getStatusText(job.status)}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-500">
                          {new Date(job.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      
                      {job.category && (
                        <div className="mb-2">
                          <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-lg text-xs font-medium">
                            {job.category.display_name_tr || job.category.name}
                          </span>
                        </div>
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
                            className="p-2 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-all duration-200 transform hover:scale-110"
                            title={t('gallery.view')}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(job.processed_images[0].image_url, `image-${job.id}-1.jpg`)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-all duration-200 transform hover:scale-110"
                            title={t('gallery.download')}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all duration-200 transform hover:scale-110"
                        title={t('gallery.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Full Screen Image Modal */}
        <AnimatePresence>
          {selectedJob && selectedJob.processed_images && selectedJob.processed_images.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col z-50"
              onClick={() => setSelectedJob(null)}
            >
              {/* Compact Top Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                  <h3 className="text-sm font-medium text-white">
                    {selectedJob.category?.display_name_tr || 'AI İşlemi'}
                  </h3>
                  <span className="text-xs text-gray-300 bg-white/10 px-2 py-1 rounded-full">
                    {selectedImageIndex + 1} / {selectedJob.processed_images.length}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-200"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* Full Size Image Container */}
              <div 
                className="flex-1 flex items-center justify-center min-h-0"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
                onClick={(e) => e.stopPropagation()}
              >
                {selectedJob.original_image_url ? (
                  <div style={{ width: '550px', height: '900px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageComparison
                      beforeImage={selectedJob.original_image_url}
                      afterImage={selectedJob.processed_images[selectedImageIndex].image_url}
                      beforeLabel="Öncesi"
                      afterLabel="Sonrası"
                      className="relative overflow-hidden rounded-xl shadow-lg cursor-col-resize select-none"
                      style={{ width: '550px', height: '900px' }}
                    />
                  </div>
                ) : (
                  <img
                    src={selectedJob.processed_images[selectedImageIndex].image_url}
                    alt={`Generated image ${selectedImageIndex + 1}`}
                    style={{ width: '550px', height: '900px', objectFit: 'contain' }}
                  />
                )}
              </div>

              {/* Compact Bottom Controls */}
              <div className="flex items-center justify-between px-4 py-2 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  {selectedJob.processed_images.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                        }}
                        disabled={selectedImageIndex === 0}
                        className="flex items-center space-x-1 px-2 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                      >
                        <ChevronLeft className="h-3 w-3" />
                        <span>Önceki</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex(Math.min(selectedJob.processed_images.length - 1, selectedImageIndex + 1));
                        }}
                        disabled={selectedImageIndex === selectedJob.processed_images.length - 1}
                        className="flex items-center space-x-1 px-2 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                      >
                        <span>Sonraki</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-300 bg-white/10 px-2 py-1 rounded-lg">
                    {new Date(selectedJob.created_at).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(
                        selectedJob.processed_images[selectedImageIndex].image_url,
                        `image-${selectedJob.id}-${selectedImageIndex + 1}.jpg`
                      );
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm font-medium"
                  >
                    <Download className="h-3 w-3" />
                    <span>İndir</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Gallery;