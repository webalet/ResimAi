import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Sparkles, Upload as UploadIcon, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';
import { Category } from '../../shared/types';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'sonner';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Mock data for now - will be replaced with API call
      setTimeout(() => {
        setCategories([
          {
            id: '1',
            name: 'Corporate',
            display_name_tr: 'Kurumsal Fotoğraf',
            type: 'Corporate',
            description: 'Profesyonel iş dünyası için kurumsal fotoğraflar',
            image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20corporate%20headshot%20business%20attire%20office%20background&image_size=square',
            styles: ['Klasik', 'Modern', 'Resmi'],
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            name: 'Creative',
            display_name_tr: 'Yaratıcı Portre',
            type: 'Creative',
            description: 'Sanatsal ve yaratıcı portre fotoğrafları',
            image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20artistic%20portrait%20colorful%20unique%20style&image_size=square',
            styles: ['Sanatsal', 'Renkli', 'Minimalist'],
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '3',
            name: 'Avatar',
            display_name_tr: 'Avatar Oluşturucu',
            type: 'Avatar',
            description: 'Dijital avatar ve karakter fotoğrafları',
            image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20avatar%20character%20portrait%20stylized&image_size=square',
            styles: ['Çizgi Film', 'Realistik', 'Fantastik'],
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '4',
            name: 'Outfit',
            display_name_tr: 'Elbise Değişimi',
            type: 'Outfit',
            description: 'AI ile kıyafet değiştirme ve stil önerileri',
            image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20outfit%20change%20clothing%20style%20transformation&image_size=square',
            styles: ['Casual', 'Formal', 'Spor'],
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '5',
            name: 'Background',
            display_name_tr: 'Arkaplan Değiştirme',
            type: 'Background',
            description: 'Profesyonel arka plan değiştirme hizmeti',
            image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20background%20office%20studio%20setting&image_size=square',
            styles: ['Ofis', 'Doğa', 'Stüdyo'],
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '6',
            name: 'Skincare',
            display_name_tr: 'Cilt Düzeltme',
            type: 'Skincare',
            description: 'AI destekli cilt düzeltme ve güzelleştirme',
            image_url: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=skin%20retouching%20beauty%20enhancement%20smooth%20complexion&image_size=square',
            styles: ['Doğal', 'Pürüzsüz', 'Parlak'],
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Categories loading failed:', error);
      toast.error('Kategoriler yüklenirken hata oluştu');
      setLoading(false);
    }
  };

  const selectCategory = (category: Category) => {
    setUploadState(prev => ({
      ...prev,
      selectedCategory: category,
      selectedStyle: category.styles[0] || ''
    }));
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Dosya boyutu 10MB\'dan küçük olmalıdır');
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
    if (!uploadState.selectedCategory || !uploadState.selectedStyle) {
      toast.error('Lütfen kategori ve stil seçin');
      return;
    }

    if (uploadState.uploadMethod === 'file' && !uploadState.file) {
      toast.error('Lütfen bir dosya seçin');
      return;
    }

    if (uploadState.uploadMethod === 'url' && !uploadState.imageUrl) {
      toast.error('Lütfen bir resim URL\'si girin');
      return;
    }

    setUploadState(prev => ({ ...prev, isUploading: true }));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Lütfen giriş yapın');
        return;
      }

      let imageUrl = uploadState.imageUrl;
      
      // If file upload, first upload the file
      if (uploadState.uploadMethod === 'file' && uploadState.file) {
        const formData = new FormData();
        formData.append('image', uploadState.file);
        
        const uploadResponse = await fetch('/api/images/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Dosya yükleme başarısız');
        }
        
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      // Process the image
      const processResponse = await fetch('/api/images/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imageUrl,
          category: uploadState.selectedCategory.name,
          style: uploadState.selectedStyle,
          userId: user?.id
        })
      });

      if (!processResponse.ok) {
        const errorData = await processResponse.json();
        throw new Error(errorData.error || 'İşleme başarısız');
      }

      const result = await processResponse.json();
      toast.success('Fotoğraf başarıyla işlendi!');
      
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
        <LoadingSpinner size="lg" text="Kategoriler yükleniyor..." />
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
            Kategorilere Dön
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {uploadState.selectedCategory.display_name_tr}
            </h1>
            <p className="text-gray-600">{uploadState.selectedCategory.description}</p>
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
                {uploadState.selectedCategory.styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setUploadState(prev => ({ ...prev, selectedStyle: style }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      uploadState.selectedStyle === style
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Method Selection */}
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
                    Dosyayı buraya sürükleyin veya seçin
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    PNG, JPG, JPEG formatları desteklenir (Max 10MB)
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Dosya Seç
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
                    placeholder="Resim URL'sini buraya yapıştırın..."
                    value={uploadState.imageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500">
                    Geçerli bir resim URL'si girin (https://example.com/image.jpg)
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
                  Fotoğraf İşleniyor...
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

            {/* Selected Options Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seçimleriniz</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Kategori:</span>
                  <span className="font-medium">{uploadState.selectedCategory.display_name_tr}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Stil:</span>
                  <span className="font-medium">{uploadState.selectedStyle || 'Seçilmedi'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Yöntem:</span>
                  <span className="font-medium">
                    {uploadState.uploadMethod === 'file' ? 'Dosya Yükleme' : 'URL'}
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Fotoğraf Kategorisi Seçin
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          AI destekli fotoğraf işleme için uygun kategoriyi seçin. Her kategori farklı stil seçenekleri sunar.
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
                alt={category.display_name_tr}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white mb-1">
                  {category.display_name_tr}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {category.styles.slice(0, 3).map((style, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-xs text-white"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-600 mb-4">{category.description}</p>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Mevcut Stiller:</p>
                <div className="flex flex-wrap gap-2">
                  {category.styles.map((style, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => selectCategory(category)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center group"
              >
                Bu Kategoriyi Seç
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
              AI Destekli İşleme
            </h3>
            <p className="text-gray-600 mb-4">
              Her kategori için özel olarak eğitilmiş AI modelleri kullanıyoruz. 
              Fotoğrafınız seçtiğiniz kategoriye uygun şekilde profesyonel kalitede işlenir.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Yüksek çözünürlük çıktı</li>
              <li>• Hızlı işleme süresi (2-5 dakika)</li>
              <li>• Çoklu stil seçenekleri</li>
              <li>• Profesyonel kalite garantisi</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;