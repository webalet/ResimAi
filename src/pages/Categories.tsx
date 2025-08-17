import React, { useState, useEffect } from 'react';
import { ArrowRight, Upload as UploadIcon, Image as ImageIcon, X } from 'lucide-react';
import { Category } from '../../shared/types';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Kategori Seçin
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Fotoğrafınızı işlemek için bir kategori seçin
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer"
            onClick={() => setUploadState(prev => ({
              ...prev,
              selectedCategory: category,
              selectedStyle: (category.styles && category.styles[0]) || ''
            }))}
          >
            <div className="aspect-square relative overflow-hidden">
              <img
                src={category.image_url}
                alt={getCategoryDisplayName(category)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white mb-1">
                  {getCategoryDisplayName(category)}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {(category.styles || []).slice(0, 3).map((style, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white"
                    >
                      {getStyleName(category, index)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">{getCategoryDescription(category)}</p>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Mevcut Stiller:</p>
                <div className="flex flex-wrap gap-2">
                  {(category.styles || []).map((style, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {getStyleName(category, index)}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center group">
                Kategoriyi Seç
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;