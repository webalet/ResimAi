import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Eye, RotateCcw, Calendar, FileImage } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import AdminLayout from '../components/admin/AdminLayout';

interface Job {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  category_type: string;
  style: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  original_image_url: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  processed_images: { image_url: string }[];
}

interface JobsResponse {
  data: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const AdminJobs: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [retryingJobs, setRetryingJobs] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchJobs();
  }, [currentPage, searchTerm, statusFilter, categoryFilter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        const errorMsg = 'Admin token bulunamadı';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter })
      });

      const response = await fetch(`/api/admin/jobs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorMsg = `İşlemler alınamadı (${response.status})`;
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('Jobs API response:', result);
      
      if (result.success && result.data) {
        // API'den gelen yanıt yapısını kontrol et
        if (Array.isArray(result.data)) {
          // Eğer result.data doğrudan array ise
          setJobs(result.data);
          setTotalPages(result.pagination?.totalPages || 1);
        } else if (result.data.jobs && Array.isArray(result.data.jobs)) {
          // Eğer result.data.jobs array ise
          setJobs(result.data.jobs);
          setTotalPages(result.data.pagination?.totalPages || 1);
        } else {
          // Beklenmeyen format
          console.error('Unexpected data format:', result.data);
          setJobs([]);
          setTotalPages(1);
          setError('Veri formatı beklenenden farklı');
        }
      } else {
        setJobs([]);
        setTotalPages(1);
        const errorMsg = result.message || 'Veri formatı hatalı';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Fetch jobs error:', error);
      const errorMsg = error instanceof Error ? error.message : 'İşlemler yüklenirken hata oluştu';
      setError(errorMsg);
      toast.error(errorMsg);
      setJobs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      setRetryingJobs(prev => new Set(prev).add(jobId));
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Admin token bulunamadı');
        return;
      }

      const response = await fetch(`/api/admin/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('İşlem yeniden başlatılamadı');
      }

      toast.success('İşlem yeniden başlatıldı');
      fetchJobs();
    } catch (error) {
      console.error('Retry job error:', error);
      toast.error('İşlem yeniden başlatılırken hata oluştu');
    } finally {
      setRetryingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Tamamlandı' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Başarısız' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'İşleniyor' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Bekliyor' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getCategoryDisplayName = (categoryType: string) => {
    const categoryNames: Record<string, string> = {
      'Corporate': 'Kurumsal',
      'Creative': 'Yaratıcı',
      'Avatar': 'Avatar',
      'Outfit': 'Kıyafet',
      'Background': 'Arka Plan',
      'Skincare': 'Cilt Bakımı'
    };
    return categoryNames[categoryType] || categoryType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={fetchJobs}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arama
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Kullanıcı adı veya e-posta..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durum
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="completed">Tamamlandı</option>
                  <option value="failed">Başarısız</option>
                  <option value="processing">İşleniyor</option>
                  <option value="pending">Bekliyor</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tüm Kategoriler</option>
                  <option value="Corporate">Kurumsal</option>
                  <option value="Creative">Yaratıcı</option>
                  <option value="Avatar">Avatar</option>
                  <option value="Outfit">Kıyafet</option>
                  <option value="Background">Arka Plan</option>
                  <option value="Skincare">Cilt Bakımı</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrele
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Jobs Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mx-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Hata Oluştu</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={fetchJobs}
                        className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Tekrar Dene
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <FileImage className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">İşlem bulunamadı</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kullanıcı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stil
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {job.user_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {job.user_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCategoryDisplayName(job.category_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.style}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div>{formatDate(job.created_at)}</div>
                            <div className="text-xs">
                              {formatDistanceToNow(new Date(job.created_at), {
                                addSuffix: true,
                                locale: tr
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => setSelectedJob(job)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {job.status === 'failed' && (
                            <button
                              onClick={() => handleRetryJob(job.id)}
                              disabled={retryingJobs.has(job.id)}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              {retryingJobs.has(job.id) ? (
                                <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Sonraki
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Sayfa <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Önceki
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Sonraki
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </AdminLayout>
  );
};

// Job Detail Modal Component
interface JobDetailModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, isOpen, onClose }) => {
  if (!isOpen) return null;

  const getCategoryDisplayName = (categoryType: string) => {
    const categoryNames: Record<string, string> = {
      'Corporate': 'Kurumsal',
      'Creative': 'Yaratıcı',
      'Avatar': 'Avatar',
      'Outfit': 'Kıyafet',
      'Background': 'Arka Plan',
      'Skincare': 'Cilt Bakımı'
    };
    return categoryNames[categoryType] || categoryType;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Tamamlandı' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Başarısız' },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'İşleniyor' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Bekliyor' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                İşlem Detayları
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Kapat</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Job Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kullanıcı</label>
                  <div className="mt-1">
                    <div className="text-sm font-medium text-gray-900">{job.user_name}</div>
                    <div className="text-sm text-gray-500">{job.user_email}</div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Durum</label>
                  <div className="mt-1">
                    {getStatusBadge(job.status)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {getCategoryDisplayName(job.category_type)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stil</label>
                  <div className="mt-1 text-sm text-gray-900">{job.style}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Oluşturulma Tarihi</label>
                  <div className="mt-1 text-sm text-gray-900">{formatDate(job.created_at)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Güncellenme Tarihi</label>
                  <div className="mt-1 text-sm text-gray-900">{formatDate(job.updated_at)}</div>
                </div>
              </div>

              {/* Error Message */}
              {job.error_message && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hata Mesajı</label>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{job.error_message}</p>
                  </div>
                </div>
              )}

              {/* Original Image */}
              {job.original_image_url && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Orijinal Görsel</label>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <img
                      src={job.original_image_url}
                      alt="Original"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Processed Images */}
              {job.processed_images && job.processed_images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İşlenmiş Görseller ({job.processed_images.length})
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {job.processed_images.map((image, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <img
                          src={image.image_url}
                          alt={`Processed ${index + 1}`}
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminJobs;