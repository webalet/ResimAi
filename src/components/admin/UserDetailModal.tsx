import React, { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, CreditCard, Shield, FileImage, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface Job {
  id: string;
  category_type: string;
  style: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  original_image_url: string;
  error_message?: string;
  created_at: string;
  processed_images: { image_url: string }[];
}

interface CreditUsage {
  id: string;
  credits_used: number;
  operation_type: string;
  created_at: string;
}

interface UserDetailModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  isOpen,
  onClose
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [creditUsage, setCreditUsage] = useState<CreditUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'credits'>('overview');

  useEffect(() => {
    if (isOpen && user) {
      fetchUserDetails();
    }
  }, [isOpen, user]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('Admin token bulunamadı');
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Kullanıcı detayları alınamadı');
      }

      const data = await response.json();
      setJobs(data.data.jobs || []);
      setCreditUsage(data.data.creditUsage || []);
    } catch (error) {
      console.error('Fetch user details error:', error);
    } finally {
      setLoading(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Kullanıcı Detayları
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* User Info Header */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{user.name}</h4>
                    <div className="flex items-center mt-1 text-gray-600">
                      <Mail className="h-4 w-4 mr-1" />
                      {user.email}
                    </div>
                    <div className="flex items-center mt-1 text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      Kayıt: {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-2 mb-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-semibold text-green-600">
                      {user.credits} kredi
                    </span>
                  </div>
                  {user.is_admin && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Activity className="h-4 w-4 inline mr-2" />
                  Genel Bakış
                </button>
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'jobs'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileImage className="h-4 w-4 inline mr-2" />
                  İşlemler ({jobs.length})
                </button>
                <button
                  onClick={() => setActiveTab('credits')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'credits'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="h-4 w-4 inline mr-2" />
                  Kredi Geçmişi ({creditUsage.length})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
                        <div className="text-sm text-blue-800">Toplam İşlem</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {jobs.filter(job => job.status === 'completed').length}
                        </div>
                        <div className="text-sm text-green-800">Başarılı İşlem</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {jobs.filter(job => job.status === 'failed').length}
                        </div>
                        <div className="text-sm text-red-800">Başarısız İşlem</div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'jobs' && (
                    <div className="space-y-4">
                      {jobs.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileImage className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Henüz işlem bulunmuyor</p>
                        </div>
                      ) : (
                        jobs.map((job) => (
                          <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="font-medium text-gray-900">
                                    {getCategoryDisplayName(job.category_type)}
                                  </span>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-gray-600">{job.style}</span>
                                  {getStatusBadge(job.status)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {formatDistanceToNow(new Date(job.created_at), {
                                    addSuffix: true,
                                    locale: tr
                                  })}
                                </div>
                                {job.error_message && (
                                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                    {job.error_message}
                                  </div>
                                )}
                              </div>
                              {job.processed_images && job.processed_images.length > 0 && (
                                <div className="ml-4">
                                  <img
                                    src={job.processed_images[0].image_url}
                                    alt="Processed"
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'credits' && (
                    <div className="space-y-3">
                      {creditUsage.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Henüz kredi kullanımı bulunmuyor</p>
                        </div>
                      ) : (
                        creditUsage.map((usage) => (
                          <div key={usage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">{usage.operation_type}</div>
                              <div className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(usage.created_at), {
                                  addSuffix: true,
                                  locale: tr
                                })}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-red-600">-{usage.credits_used} kredi</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
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

export default UserDetailModal;