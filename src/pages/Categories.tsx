import React, { useState, useEffect } from 'react';
import { ArrowRight, Upload as UploadIcon, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '../../shared/types';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageComparison from '../components/ImageComparison';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://64.226.75.76';

interface UploadState {
  selectedCategory: Category | null;
  selectedStyle: string;
  uploadMethod: 'file' | 'url';
  file: File | null;
  imageUrl: string;
  preview: string | null;
  isUploading: boolean;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadState, setUploadState] = useState<UploadState>({
    selectedCategory: null,
    selectedStyle: '',
    uploadMethod: 'file',
    file: null,
    imageUrl: '',
    preview: null,
    isUploading: false
  });
  const { i18n, t } = useTranslation();
  const { user } = useAuth();

  // Helper functions
  const getCategoryDisplayName = (category: Category) => {
    return i18n.language === 'en' ? (category.display_name_en || category.display_name_tr) : category.display_name_tr;
  };

  const getCategoryDescription = (category: Category) => {
    return i18n.language === 'en' ? (category.description_en || category.description) : category.description;
  };

  const getStyleName = (category: Category, styleIndex: number) => {
    if (!category.styles || !category.styles[styleIndex]) return '';
    if (i18n.language === 'en' && category.styles_en && category.styles_en[styleIndex]) {
      return category.styles_en[styleIndex];
    }
    return category.styles[styleIndex];
  };

  // Load categories from API
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (!response.ok) throw new Error('Failed to load categories');
      
      const data = await response.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Kategoriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Dosya boyutu 50MB\'dan küçük olmalıdır');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadState(prev => ({
        ...prev,
        file,
        preview: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle image upload and processing
  const handleUpload = async () => {
    if (!uploadState.selectedCategory || !uploadState.selectedStyle) {
      toast.error('Lütfen kategori ve stil seçin');
      return;
    }

    if (uploadState.uploadMethod === 'file' && !uploadState.file) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    if (uploadState.uploadMethod === 'url' && !uploadState.imageUrl) {
      toast.error('Lütfen resim URL\'si girin');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Lütfen giriş yapın');
      return;
    }

    setUploadState(prev => ({ ...prev, isUploading: true }));

    try {
      const formData = new FormData();
      
      if (uploadState.uploadMethod === 'file' && uploadState.file) {
        formData.append('image', uploadState.file);
      } else if (uploadState.uploadMethod === 'url' && uploadState.imageUrl) {
        formData.append('imageUrl', uploadState.imageUrl);
      }
      
      formData.append('style', uploadState.selectedStyle);
      formData.append('category', uploadState.selectedCategory.name);
      


      const response = await fetch(`${API_BASE_URL}/api/images/upload-and-process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload başarısız');
      }

      const result = await response.json();
      toast.success('Fotoğraf başarıyla işlendi!');
      
      // Reset form
      setUploadState({
        selectedCategory: null,
        selectedStyle: '',
        uploadMethod: 'file',
        file: null,
        imageUrl: '',
        preview: null,
        isUploading: false
      });
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setUploadState(prev => ({ ...prev, isUploading: false }));
    }
  };

  // Reset selection
  const resetSelection = () => {
    setUploadState({
      selectedCategory: null,
      selectedStyle: '',
      uploadMethod: 'file',
      file: null,
      imageUrl: '',
      preview: null,
      isUploading: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text="Kategoriler yükleniyor..." />
      </div>
    );
  }

  // Upload interface when category is selected
  if (uploadState.selectedCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={resetSelection}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20 shadow-sm"
            >
              <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
              {t('categories.backToCategories')}
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {getCategoryDisplayName(uploadState.selectedCategory)}
              </h1>
              <p className="text-sm text-gray-600">{getCategoryDescription(uploadState.selectedCategory)}</p>
            </div>
            <div className="w-32"></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Left Column - Upload Controls */}
            <div className="xl:col-span-1 space-y-4">
              {/* Style Selection */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-2"></div>
                  {t('categories.styleSelection')}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {(uploadState.selectedCategory.styles || []).map((style, styleIndex) => (
                    <button
                      key={style}
                      onClick={() => setUploadState(prev => ({ ...prev, selectedStyle: style }))}
                      className={`p-3 rounded-lg border-2 transition-all duration-300 text-left ${
                        uploadState.selectedStyle === style
                          ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 shadow-md'
                          : 'border-gray-200 hover:border-purple-300 bg-white/50 hover:bg-white/80'
                      }`}
                    >
                      <div className="font-medium text-sm">{getStyleName(uploadState.selectedCategory, styleIndex)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Method */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-2"></div>
                  {t('categories.uploadMethod')}
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    onClick={() => setUploadState(prev => ({ ...prev, uploadMethod: 'file' }))}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                      uploadState.uploadMethod === 'file'
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 bg-white/50 hover:bg-white/80'
                    }`}
                  >
                    <UploadIcon className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-semibold">{t('categories.uploadFile')}</div>
                  </button>
                  <button
                    onClick={() => setUploadState(prev => ({ ...prev, uploadMethod: 'url' }))}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                      uploadState.uploadMethod === 'url'
                        ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 bg-white/50 hover:bg-white/80'
                    }`}
                  >
                    <ImageIcon className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-xs font-semibold">{t('categories.enterUrl')}</div>
                  </button>
                </div>

                {/* File Upload */}
                {uploadState.uploadMethod === 'file' && (
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center bg-gradient-to-br from-purple-50/50 to-blue-50/50 hover:from-purple-50 hover:to-blue-50 transition-all duration-300">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UploadIcon className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {t('categories.dragDropText')}
                    </p>
                    <p className="text-xs text-gray-600 mb-3">
                      {t('categories.supportedFormats')}
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-blue-500 file:text-white hover:file:from-purple-600 hover:file:to-blue-600 file:shadow-md file:transition-all file:duration-300"
                    />
                  </div>
                )}

                {/* URL Input */}
                {uploadState.uploadMethod === 'url' && (
                  <div className="space-y-3">
                    <input
                      type="url"
                      placeholder={t('categories.urlPlaceholder')}
                      value={uploadState.imageUrl}
                      onChange={(e) => setUploadState(prev => ({ 
                        ...prev, 
                        imageUrl: e.target.value,
                        preview: e.target.value 
                      }))}
                      className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={uploadState.isUploading || !uploadState.selectedStyle || 
                         (uploadState.uploadMethod === 'file' && !uploadState.file) ||
                         (uploadState.uploadMethod === 'url' && !uploadState.imageUrl)}
                className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 text-white py-4 px-6 rounded-xl font-bold text-sm hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 disabled:transform-none"
              >
                {uploadState.isUploading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    {t('categories.processing')}
                  </>
                ) : (
                  <>
                    <UploadIcon className="h-4 w-4 mr-2" />
                    {t('categories.processPhoto')}
                  </>
                )}
              </button>
            </div>

            {/* Right Column - Preview */}
            <div className="xl:col-span-2">
              {/* User Preview */}
              <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-2"></div>
                  {t('categories.preview')}
                </h3>
                {uploadState.preview ? (
                  <div className="relative group">
                    <img
                      src={uploadState.preview}
                      alt="Preview"
                      className="w-full h-100 object-contain rounded-lg shadow-md"
                    />
                    <button
                      onClick={() => setUploadState(prev => ({ 
                        ...prev, 
                        preview: null, 
                        file: null, 
                        imageUrl: '' 
                      }))}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ) : (
                  <div className="h-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium text-lg">{t('categories.previewText')}</p>
                      <p className="text-gray-400 text-sm mt-2">{t('categories.previewText')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Category selection view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t('categories.title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('categories.subtitle')}
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const handleCategorySelect = () => setUploadState(prev => ({
            ...prev,
            selectedCategory: category,
            selectedStyle: (category.styles && category.styles[0]) || ''
          }));
          
          return (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 overflow-hidden group"
          >
            <div className="aspect-[3/2] relative overflow-hidden min-h-[200px]">
              {category.before_image_url && category.after_image_url ? (
                <div className="w-full h-full min-h-[200px]">
                  {(() => {
                    // Debug image URLs before passing to ImageComparison
                    const beforeImageUrl = category.before_image_url.startsWith('http') 
                      ? category.before_image_url 
                      : `${API_BASE_URL}${category.before_image_url}`;
                    const afterImageUrl = category.after_image_url.startsWith('http') 
                      ? category.after_image_url 
                      : `${API_BASE_URL}${category.after_image_url}`;
                    

                    
                    return (
                      <ImageComparison
                        beforeImage={beforeImageUrl}
                        afterImage={afterImageUrl}
                        beforeLabel="Öncesi"
                        afterLabel="Sonrası"
                        style={{ height: '100%', minHeight: '200px' }}
                      />
                    );
                  })()}
                </div>
              ) : (
                <img
                  src={(() => {
                    const imageUrl = category.before_image_url || category.image_url;
                    const fullImageUrl = imageUrl && imageUrl.startsWith('http') 
                      ? imageUrl 
                      : `${API_BASE_URL}${imageUrl}`;

                    return fullImageUrl;
                  })()}
                  alt={getCategoryDisplayName(category)}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"

                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div 
                className="absolute bottom-2 left-3 right-3 cursor-pointer z-40"
                onClick={handleCategorySelect}
              >
                <h3 className="text-lg font-bold text-white mb-1" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
                  {getCategoryDisplayName(category)}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {(category.styles || []).slice(0, 2).map((style, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded text-xs text-white"
                    >
                      {getStyleName(category, index)}
                    </span>
                  ))}
                  {(category.styles || []).length > 2 && (
                    <span className="px-2 py-0.5 bg-white/25 backdrop-blur-sm rounded text-xs text-white">
                      +{(category.styles || []).length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 cursor-pointer" onClick={handleCategorySelect}>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{getCategoryDescription(category)}</p>
              
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 mb-1">{t('categories.availableStyles')}:</p>
                <div className="flex flex-wrap gap-1">
                  {(category.styles || []).slice(0, 3).map((style, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {getStyleName(category, index)}
                    </span>
                  ))}
                  {(category.styles || []).length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                      +{(category.styles || []).length - 3} {t('common.more')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-3 rounded-md font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center group text-sm">
                {t('categories.selectCategory')}
                <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;