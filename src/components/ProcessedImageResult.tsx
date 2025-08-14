import React, { useState, useEffect } from 'react';
import { Download, Eye, X, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { toast } from 'sonner';

interface ProcessedImage {
  id: string;
  image_url: string;
  width?: number;
  height?: number;
  prompt?: string;
  created_at: string;
}

interface ImageJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  category_type: string;
  style: string;
  original_image_url: string;
  created_at: string;
  processed_images: ProcessedImage[];
  error_message?: string;
}

interface ProcessedImageResultProps {
  jobId: string;
  onClose: () => void;
}

const ProcessedImageResult: React.FC<ProcessedImageResultProps> = ({ jobId, onClose }) => {
  const [job, setJob] = useState<ImageJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    loadJob();
    
    // Start polling if job is not completed
    const interval = setInterval(() => {
      if (job?.status === 'pending' || job?.status === 'processing') {
        setPolling(true);
        loadJob();
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [jobId, job?.status]);

  const loadJob = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Lütfen giriş yapın');
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76:5173';
      const response = await fetch(`${API_BASE_URL}/api/images/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('İş bilgileri alınamadı');
      }

      const result = await response.json();
      setJob(result.data);
      
      // Stop polling if job is completed or failed
      if (result.data.status === 'completed' || result.data.status === 'failed') {
        setPolling(false);
      }
    } catch (error) {
      console.error('Job loading failed:', error);
      toast.error('İş bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setPolling(false);
    }
  };

  const downloadImage = async (imageUrl: string, filename?: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `processed-image-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      toast.success('Görsel indirildi!');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('İndirme başarısız');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <LoadingSpinner size="sm" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'processing':
        return 'İşleniyor';
      case 'completed':
        return 'Tamamlandı';
      case 'failed':
        return 'Başarısız';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">İş bilgileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">İş Bulunamadı</h3>
            <p className="text-gray-600 mb-4">Belirtilen iş bulunamadı veya erişim izniniz yok.</p>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">İşleme Sonucu</h2>
            <div className="flex items-center mt-2 space-x-2">
              {getStatusIcon(job.status)}
              <span className="text-sm text-gray-600">
                {getStatusText(job.status)}
                {polling && ' (Güncelleniyor...)'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Job Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Kategori:</span>
                <p className="font-medium">{job.category_type}</p>
              </div>
              <div>
                <span className="text-gray-500">Stil:</span>
                <p className="font-medium">{job.style}</p>
              </div>
              <div>
                <span className="text-gray-500">Oluşturulma:</span>
                <p className="font-medium">
                  {new Date(job.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Durum:</span>
                <p className="font-medium">{getStatusText(job.status)}</p>
              </div>
            </div>
            {job.error_message && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{job.error_message}</p>
              </div>
            )}
          </div>

          {/* Original Image */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Orijinal Görsel</h3>
            <div className="bg-gray-100 rounded-lg p-4">
              <img
                src={job.original_image_url}
                alt="Orijinal görsel"
                className="max-w-full h-auto rounded-lg mx-auto"
                style={{ maxHeight: '300px' }}
              />
            </div>
          </div>

          {/* Processed Images */}
          {job.status === 'completed' && job.processed_images && job.processed_images.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">İşlenmiş Görseller</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.processed_images.map((image) => (
                  <div key={image.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="relative group">
                      <img
                        src={image.image_url}
                        alt="İşlenmiş görsel"
                        className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage(image)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => setSelectedImage(image)}
                          className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-all"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {image.width && image.height && (
                          <span>{image.width} × {image.height}</span>
                        )}
                      </div>
                      <button
                        onClick={() => downloadImage(image.image_url, `processed-${image.id}.jpg`)}
                        className="flex items-center space-x-1 bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Download className="h-4 w-4" />
                        <span>İndir</span>
                      </button>
                    </div>
                    
                    {image.prompt && (
                      <div className="mt-2 p-2 bg-white rounded text-xs text-gray-600">
                        <strong>Prompt:</strong> {image.prompt}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : job.status === 'processing' || job.status === 'pending' ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">
                {job.status === 'processing' ? 'Görseliniz işleniyor...' : 'İşleme sırası bekleniyor...'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Bu işlem 2-5 dakika sürebilir. Sayfa otomatik olarak güncellenecektir.
              </p>
            </div>
          ) : job.status === 'failed' ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">İşleme Başarısız</h3>
              <p className="text-gray-600">
                {job.error_message || 'Görsel işlenirken bir hata oluştu.'}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">İşleme Beklemede</h3>
              <p className="text-gray-600">Görseliniz işleme sırasında bekliyor.</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={selectedImage.image_url}
              alt="İşlenmiş görsel - büyük görünüm"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessedImageResult;