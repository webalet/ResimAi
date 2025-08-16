import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Upload as UploadIcon, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';
import { Category } from '../../shared/types';
import LoadingSpinner from '../components/LoadingSpinner';
import ProcessedImageResult from '../components/ProcessedImageResult';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

interface UploadState {
  selectedCategory: Category | null;
  selectedStyle: string;
  uploadMethod: 'file' | 'url';
  file: File | null;
  imageUrl: string;
  preview: string | null;
  isUploading: boolean;
  isDragOver: boolean;
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
    isUploading: false,
    isDragOver: false
  });
  const [showResult, setShowResult] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  // Helper function to get category display name based on current language
  const getCategoryDisplayName = (category: Category) => {
    return i18n.language === 'en' ? (category.display_name_en || category.display_name_tr) : category.display_name_tr;
  };

  const selectCategory = (category: Category) => {
    console.log('🔍 [CATEGORY SELECT] Category selected:', {
      category: category,
      categoryType: category.type,
      categoryName: category.name,
      categoryId: category.id,
      fullCategoryObject: JSON.stringify(category, null, 2)
    });
    
    setUploadState(prev => ({
      ...prev,
      selectedCategory: category,
      selectedStyle: (category.styles && category.styles[0]) || ''
    }));
  };

  // Helper function to get category description based on current language
  const getCategoryDescription = (category: Category) => {
    return i18n.language === 'en' ? (category.description_en || category.description) : category.description;
  };

  // Helper function to get style name based on current language
  const getStyleName = (category: Category, styleIndex: number) => {
    if (!category.styles || !category.styles[styleIndex]) {
      return '';
    }
    if (i18n.language === 'en' && category.styles_en && category.styles_en[styleIndex]) {
      return category.styles_en[styleIndex];
    }
    return category.styles[styleIndex];
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('🔄 Loading categories from API...');
      const response = await fetch('/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API Response:', data);
      console.log('📊 Categories data:', data.data);
      
      // DEBUG: Log each category's type field
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((cat: any, index: number) => {
          console.log(`🔍 [CATEGORY ${index}] Debug info:`, {
            id: cat.id,
            name: cat.name,
            type: cat.type,
            typeExists: 'type' in cat,
            typeValue: cat.type,
            typeType: typeof cat.type,
            fullObject: JSON.stringify(cat, null, 2)
          });
        });
      }
      
      setCategories(data.data || []);
      setLoading(false);
      
      console.log('✅ Categories loaded successfully:', data.data?.length || 0, 'categories');
    } catch (error) {
      console.error('❌ Categories loading failed:', error);
      toast.error(t('categories.loadError'));
      setLoading(false);
    }
  };



  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('categories.invalidFileType'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('categories.fileSizeError'));
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setUploadState(prev => ({ ...prev, isDragOver: false }));
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setUploadState(prev => ({
      ...prev,
      imageUrl: url,
      preview: url
    }));
  };

  const handleUpload = async () => {
    if (!uploadState.selectedStyle) {
      toast.error(t('categories.selectStyle'));
      return;
    }

    if (uploadState.uploadMethod === 'file' && !uploadState.file) {
      toast.error(t('categories.selectFile'));
      return;
    }

    if (uploadState.uploadMethod === 'url' && !uploadState.imageUrl) {
      toast.error(t('categories.enterImageUrl'));
      return;
    }

    setUploadState(prev => ({ ...prev, isUploading: true }));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error(t('categories.pleaseLogin'));
        return;
      }

      // Use the combined upload-and-process endpoint
      const formData = new FormData();
      
      if (uploadState.uploadMethod === 'file' && uploadState.file) {
        formData.append('image', uploadState.file);
      } else if (uploadState.uploadMethod === 'url' && uploadState.imageUrl) {
        formData.append('imageUrl', uploadState.imageUrl);
      }
      
      formData.append('style', uploadState.selectedStyle);
      
      // Debug: Check selectedCategory structure
      console.log('🔍 [DEBUG] Selected Category:', uploadState.selectedCategory);
      console.log('🔍 [DEBUG] Category type:', uploadState.selectedCategory?.type);
      console.log('🔍 [DEBUG] Category name:', uploadState.selectedCategory?.name);
      
      // Use type if available, otherwise use name as fallback
      const categoryValue = uploadState.selectedCategory?.type || uploadState.selectedCategory?.name || '';
      formData.append('category', categoryValue);
      
      console.log('🚀 [UPLOAD-AND-PROCESS] Sending request to:', '/api/images/upload-and-process');
      console.log('🚀 [UPLOAD-AND-PROCESS] FormData contents:', {
        fileName: uploadState.file?.name,
        fileSize: uploadState.file?.size,
        fileType: uploadState.file?.type,
        imageUrl: uploadState.imageUrl,
        style: uploadState.selectedStyle,
        category: categoryValue
      });
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76';
      const response = await fetch(`${API_BASE_URL}/api/images/upload-and-process`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('📥 [UPLOAD-AND-PROCESS] Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url
      });
      
      if (!response.ok) {
        let errorMessage = 'Upload ve işleme başarısız';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      let result;
      try {
        const responseText = await response.text();
        console.log('📄 [UPLOAD-AND-PROCESS] Raw response text:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        
        if (!responseText.trim()) {
          throw new Error('Sunucu boş yanıt döndürdü');
        }
        
        result = JSON.parse(responseText);
        console.log('✅ [UPLOAD-AND-PROCESS] Parsed response data:', result);
      } catch (parseError) {
        console.error('❌ [UPLOAD-AND-PROCESS] JSON parse error:', parseError);
        throw new Error('Sunucu geçersiz yanıt döndürdü (JSON parse hatası)');
      }
      toast.success('Fotoğraf başarıyla işlendi!');
      
      // Set job ID and show result modal
      setCurrentJobId(result.data?.id || null);
      setShowResult(true);
      
      // Reset form
      setUploadState({
        selectedCategory: null,
        selectedStyle: '',
        uploadMethod: 'file',
        file: null,
        imageUrl: '',
        preview: null,
        isUploading: false,
        isDragOver: false
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setUploadState(prev => ({ ...prev, isUploading: false }));
    }
  };

  const resetSelection = () => {
    setUploadState({
      selectedCategory: null,
      selectedStyle: '',
      uploadMethod: 'file',
      file: null,
      imageUrl: '',
      preview: null,
      isUploading: false,
      isDragOver: false
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" text={t('categories.loading')} />
      </div>
    );
  }

  // If category is selected, show upload interface
  if (uploadState.selectedCategory) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center justify-between">
          <button
            onClick={resetSelection}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="h-4 w-4 rotate-180 mr-2" />
            {t('categories.backToCategories')}
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('categories.styleSelection')}</h3>
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

            {/* Upload Method Selection */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('categories.uploadMethod')}</h3>
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
                  {t('categories.uploadFile')}
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
                  {t('categories.enterUrl')}
                </button>
              </div>

              {/* File Upload */}
              {uploadState.uploadMethod === 'file' && (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    uploadState.isDragOver
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setUploadState(prev => ({ ...prev, isDragOver: true }));
                  }}
                  onDragLeave={() => setUploadState(prev => ({ ...prev, isDragOver: false }))}
                >
                  <UploadIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {t('categories.dragDropText')}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('categories.supportedFormats')}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {t('categories.selectFile')}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                  />
                </div>
              )}

              {/* URL Input */}
              {uploadState.uploadMethod === 'url' && (
                <div className="space-y-4">
                  <input
                    type="url"
                    placeholder={t('categories.urlPlaceholder')}
                    value={uploadState.imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500">
                    {t('categories.validUrlRequired')}
                  </p>
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
                  {t('categories.processing')}
                </>
              ) : (
                t('categories.processPhoto')
              )}
            </button>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('categories.preview')}</h3>
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
                    <p className="text-gray-500">{t('categories.previewText')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Selected Options Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('categories.yourSelections')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('categories.category')}</span>
                  <span className="font-medium">{getCategoryDisplayName(uploadState.selectedCategory)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('categories.style')}</span>
                  <span className="font-medium">
                    {uploadState.selectedStyle ? 
                      getStyleName(uploadState.selectedCategory, (uploadState.selectedCategory.styles || []).indexOf(uploadState.selectedStyle)) 
                      : t('categories.notSelected')
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{t('categories.method')}</span>
                  <span className="font-medium">
                    {uploadState.uploadMethod === 'file' ? t('categories.fileUpload') : 'URL'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default category selection view
  return (
    <>
      {/* ProcessedImageResult Modal */}
      {showResult && currentJobId && (
        <ProcessedImageResult
          jobId={currentJobId}
          onClose={() => {
            setShowResult(false);
            setCurrentJobId(null);
          }}
        />
      )}
      
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
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200 overflow-hidden group"
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
                <p className="text-sm font-medium text-gray-700 mb-2">{t('categories.availableStyles')}:</p>
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
              
              <button
                onClick={() => selectCategory(category)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center group"
              >
                {t('categories.selectCategory')}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border">
        <div className="flex items-start space-x-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('categories.aiProcessing')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('categories.aiDescription')}
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {t('categories.highResolution')}</li>
              <li>• {t('categories.fastProcessing')}</li>
              <li>• {t('categories.multipleStyles')}</li>
              <li>• {t('categories.qualityGuarantee')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Categories;