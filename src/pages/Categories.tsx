import React, { useState, useEffect } from 'react';
import { ArrowRight, Upload as UploadIcon, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '../../shared/types';
import LoadingSpinner from '../components/LoadingSpinner';
import ImageComparison from '../components/ImageComparison';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76';

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
  
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

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
      
      // Debug log
      console.log('Sending category:', uploadState.selectedCategory.name);
      console.log('Selected category object:', uploadState.selectedCategory);

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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={resetSelection}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
            Kategorilere Dön
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {getCategoryDisplayName(uploadState.selectedCategory)}
            </h1>
            <p className="text-gray-600">{getCategoryDescription(uploadState.selectedCategory)}</p>
          </div>
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload */}
          <div className="space-y-6">
            {/* Style Selection */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stil Seçimi</h3>
              <div className="grid grid-cols-2 gap-3">
                {(uploadState.selectedCategory.styles || []).map((style, styleIndex) => (
                  <button
                    key={style}
                    onClick={() => setUploadState(prev => ({ ...prev, selectedStyle: style }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      uploadState.selectedStyle === style
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {getStyleName(uploadState.selectedCategory, styleIndex)}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Method */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yükleme Yöntemi</h3>
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setUploadState(prev => ({ ...prev, uploadMethod: 'file' }))}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    uploadState.uploadMethod === 'file'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <UploadIcon className="h-5 w-5 mx-auto mb-1" />
                  Dosya Yükle
                </button>
                <button
                  onClick={() => setUploadState(prev => ({ ...prev, uploadMethod: 'url' }))}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    uploadState.uploadMethod === 'url'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ImageIcon className="h-5 w-5 mx-auto mb-1" />
                  URL Gir
                </button>
              </div>

              {/* File Upload */}
              {uploadState.uploadMethod === 'file' && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Dosyayı sürükleyin veya seçin
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    JPG, PNG, GIF (Max 50MB)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
              )}

              {/* URL Input */}
              {uploadState.uploadMethod === 'url' && (
                <div className="space-y-4">
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={uploadState.imageUrl}
                    onChange={(e) => setUploadState(prev => ({ 
                      ...prev, 
                      imageUrl: e.target.value,
                      preview: e.target.value 
                    }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {uploadState.isUploading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  İşleniyor...
                </>
              ) : (
                'Fotoğrafı İşle'
              )}
            </button>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Önizleme</h3>
              {uploadState.preview ? (
                <div className="relative">
                  <img
                    src={uploadState.preview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setUploadState(prev => ({ 
                      ...prev, 
                      preview: null, 
                      file: null, 
                      imageUrl: '' 
                    }))}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Resim önizlemesi burada görünecek</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Category selection view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-sm font-medium mb-4">
              <ImageIcon className="w-4 h-4 mr-2" />
              AI Destekli Fotoğraf İşleme
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent mb-6">
              Kategori Seçin
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Fotoğrafınızı işlemek için bir kategori seçin ve AI'ın gücünü keşfedin
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 lg:gap-10">
        {categories.map((category) => {
          const handleCategorySelect = () => setUploadState(prev => ({
            ...prev,
            selectedCategory: category,
            selectedStyle: (category.styles && category.styles[0]) || ''
          }));
          
          return (
          <div
            key={category.id}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 overflow-hidden group cursor-pointer"
            onClick={handleCategorySelect}
          >
            <div className="aspect-[4/3] relative overflow-hidden">
              {category.before_image_url && category.after_image_url ? (
                <div className="w-full h-full">
                  <ImageComparison
                    beforeImage={category.before_image_url}
                    afterImage={category.after_image_url}
                    beforeLabel="Öncesi"
                    afterLabel="Sonrası"
                  />
                </div>
              ) : (
                <img
                  src={category.before_image_url || category.image_url}
                  alt={getCategoryDisplayName(category)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
                  {getCategoryDisplayName(category)}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(category.styles || []).slice(0, 2).map((style, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white/30 backdrop-blur-md rounded-full text-sm text-white font-medium border border-white/20"
                    >
                      {getStyleName(category, index)}
                    </span>
                  ))}
                  {(category.styles || []).length > 2 && (
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500/80 to-blue-500/80 backdrop-blur-md rounded-full text-sm text-white font-medium border border-white/20">
                      +{(category.styles || []).length - 2} daha
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <p className="text-gray-700 text-base mb-4 line-clamp-2 leading-relaxed">{getCategoryDescription(category)}</p>
              
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-800 mb-3">Mevcut Stiller:</p>
                <div className="flex flex-wrap gap-2">
                  {(category.styles || []).slice(0, 3).map((style, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-full text-sm font-medium border border-gray-300 hover:from-purple-100 hover:to-blue-100 hover:text-purple-700 transition-all"
                    >
                      {getStyleName(category, index)}
                    </span>
                  ))}
                  {(category.styles || []).length > 3 && (
                    <span className="px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
                      +{(category.styles || []).length - 3} daha
                    </span>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center group text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <span className="mr-2">Kategoriyi Seç</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
          );
        })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;