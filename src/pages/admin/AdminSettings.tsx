import React, { useState, useRef } from 'react';
import { Settings, Key, Database, Webhook, Code, Edit2, Save, X, Plus, Trash2, ChevronDown, ChevronUp, Upload, Image } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { toast } from 'sonner';

type ValidationErrors = Record<string, string>;

const AdminSettings = () => {
  // State for editable configuration
  const [systemConfig, setSystemConfig] = useState({
    supabase: {
      url: 'https://ixqjqvqvqvqvqvqv.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxdnF2cXZxdnF2cXYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczNDk2NzIwMCwiZXhwIjoyMDUwNTQzMjAwfQ.example_anon_key',
      serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxdnF2cXZxdnF2cXYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzM0OTY3MjAwLCJleHAiOjIwNTA1NDMyMDB9.example_service_role_key'
    },
    n8n: {
      webhookUrl: 'https://n8n.example.com/webhook/resim-ai',
      apiKey: 'n8n_api_key_example_12345'
    },
    jwt: {
      secret: 'your-super-secret-jwt-key-here-make-it-long-and-secure',
      expiresIn: '7d'
    },
    server: {
      port: '3001',
      url: 'http://localhost:3001'
    }
  });

  // Edit modes
  const [editModes, setEditModes] = useState({
    supabase: false,
    n8n: false,
    jwt: false,
    categories: false,
    prompts: {}
  });

  // State for collapsed categories - default to collapsed (true means collapsed)
  const [collapsedCategories, setCollapsedCategories] = useState({
    'API Konfigürasyonu': true,
    'Kategoriler ve Stiller': true
  });

  // Loading states
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // State for editable categories
  const [categories, setCategories] = useState([
    {
      name: 'Corporate',
      styles: ['Professional', 'Business Casual', 'Executive', 'Formal Meeting'],
      image_url: '/images/ornek.jpg'
    },
    {
      name: 'Creative', 
      styles: ['Artistic', 'Bohemian', 'Vintage', 'Modern Art'],
      image_url: '/images/ornek.jpg'
    },
    {
      name: 'Avatar',
      styles: ['Cartoon', 'Realistic', 'Anime', 'Fantasy'],
      image_url: '/images/ornek.jpg'
    },
    {
      name: 'Outfit',
      styles: ['Casual', 'Formal', 'Sporty', 'Trendy'],
      image_url: '/images/ornek.jpg'
    },
    {
      name: 'Background',
      styles: ['Office', 'Studio', 'Nature', 'Abstract'],
      image_url: '/images/ornek.jpg'
    },
    {
      name: 'Skincare',
      styles: ['Natural', 'Glowing', 'Professional', 'Fresh'],
      image_url: '/images/ornek.jpg'
    }
  ]);

  // File input refs for image uploads
  const fileInputRefs = useRef({});

  // State for editable AI prompts
  const [aiPrompts, setAiPrompts] = useState({
    Corporate: {
      Professional: 'professional corporate headshot, business attire, clean background, high quality, studio lighting',
      'Business Casual': 'business casual portrait, approachable professional look, modern office setting',
      Executive: 'executive portrait, confident pose, formal business suit, premium quality',
      'Formal Meeting': 'formal meeting ready portrait, professional appearance, business environment'
    },
    Creative: {
      Artistic: 'artistic portrait, creative lighting, unique composition, expressive style',
      Bohemian: 'bohemian style portrait, free-spirited, natural lighting, artistic flair',
      Vintage: 'vintage style portrait, classic aesthetic, retro elements, timeless appeal',
      'Modern Art': 'modern artistic portrait, contemporary style, bold composition'
    },
    Avatar: {
      Cartoon: 'cartoon style avatar, friendly expression, vibrant colors, stylized features',
      Realistic: 'realistic avatar, detailed features, natural appearance, high quality',
      Anime: 'anime style avatar, expressive eyes, stylized features, vibrant colors',
      Fantasy: 'fantasy avatar, magical elements, creative design, imaginative style'
    },
    Outfit: {
      Casual: 'casual outfit portrait, relaxed style, comfortable clothing, natural pose',
      Formal: 'formal outfit portrait, elegant attire, sophisticated style, polished look',
      Sporty: 'sporty outfit portrait, athletic wear, active lifestyle, energetic pose',
      Trendy: 'trendy outfit portrait, fashionable clothing, modern style, stylish appearance'
    },
    Background: {
      Office: 'professional office background, modern workspace, clean environment',
      Studio: 'studio background, professional lighting, neutral backdrop',
      Nature: 'natural background, outdoor setting, scenic environment',
      Abstract: 'abstract background, artistic elements, creative composition'
    },
    Skincare: {
      Natural: 'natural skincare portrait, healthy glow, fresh appearance, clean beauty',
      Glowing: 'glowing skin portrait, radiant complexion, healthy appearance',
      Professional: 'professional skincare portrait, polished look, refined appearance',
      Fresh: 'fresh skincare portrait, youthful glow, vibrant appearance'
    }
  });

  // Helper functions
  const toggleEditMode = (section, categoryName = null) => {
    if (categoryName) {
      setEditModes(prev => ({
        ...prev,
        prompts: {
          ...prev.prompts,
          [categoryName]: !prev.prompts[categoryName]
        }
      }));
    } else {
      setEditModes(prev => ({ ...prev, [section]: !prev[section] }));
    }
  };

  const toggleCategoryCollapse = (categoryName) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const validateConfig = (section: string, config: any): ValidationErrors => {
    const errors = {} as ValidationErrors;
    
    if (section === 'supabase') {
      if (!config.url || !config.url.trim()) {
        errors.url = 'Supabase URL gereklidir';
      } else if (!config.url.startsWith('https://')) {
        errors.url = 'Geçerli bir HTTPS URL giriniz';
      }
      
      if (!config.anonKey || !config.anonKey.trim()) {
        errors.anonKey = 'Anonymous Key gereklidir';
      } else if (config.anonKey.length < 50) {
        errors.anonKey = 'Geçerli bir Anonymous Key giriniz';
      }
    }
    
    if (section === 'n8n') {
      if (!config.webhookUrl || !config.webhookUrl.trim()) {
        errors.webhookUrl = 'Webhook URL gereklidir';
      } else if (!config.webhookUrl.startsWith('http')) {
        errors.webhookUrl = 'Geçerli bir URL giriniz';
      }
    }
    
    if (section === 'jwt') {
      if (!config.secret || !config.secret.trim()) {
        errors.secret = 'Secret Key gereklidir';
      } else if (config.secret.length < 32) {
        errors.secret = 'Secret Key en az 32 karakter olmalıdır';
      }
      
      if (!config.expiresIn || !config.expiresIn.trim()) {
        errors.expiresIn = 'Token süresi gereklidir';
      }
    }
    
    return errors;
  };

  const validateCategories = (categories: any[]): ValidationErrors => {
    const errors = {} as ValidationErrors;
    
    categories.forEach((category, index) => {
      if (!category.name || !category.name.trim()) {
        errors[`category_${index}_name`] = 'Kategori adı gereklidir';
      }
      
      if (!category.styles || category.styles.length === 0) {
        errors[`category_${index}_styles`] = 'En az bir stil gereklidir';
      } else {
        category.styles.forEach((style, styleIndex) => {
          if (!style || !style.trim()) {
            errors[`category_${index}_style_${styleIndex}`] = 'Stil adı gereklidir';
          }
        });
      }
    });
    
    return errors;
  };

  const validatePrompts = (prompts: any): ValidationErrors => {
    const errors = {} as ValidationErrors;
    
    Object.entries(prompts).forEach(([category, styles]) => {
      Object.entries(styles).forEach(([style, prompt]) => {
        if (!prompt || !prompt.trim()) {
          errors[`${category}_${style}`] = 'Prompt metni gereklidir';
        } else if (prompt.length < 10) {
          errors[`${category}_${style}`] = 'Prompt en az 10 karakter olmalıdır';
        }
      });
    });
    
    return errors;
  };

  const saveSystemConfig = async (section) => {
    setSaving(true);
    setValidationErrors({});
    
    try {
      // Validate configuration
      const errors = validateConfig(section, systemConfig[section]);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        showMessage('error', 'Lütfen hataları düzeltin ve tekrar deneyin.');
        return;
      }

      const response = await fetch('/api/admin/settings/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ section, config: systemConfig[section] })
      });

      const data = await response.json();
      
      if (data.success) {
        toggleEditMode(section);
        showMessage('success', `${section} konfigürasyonu başarıyla kaydedildi!`);
      } else {
        throw new Error(data.message || 'Kaydetme işlemi başarısız');
      }
    } catch (error) {
      console.error('Save config error:', error);
      showMessage('error', 'Kaydetme sırasında bir hata oluştu!');
    } finally {
      setSaving(false);
    }
  };

  const saveCategories = async () => {
    setSaving(true);
    setValidationErrors({});
    
    try {
      // Validate categories
      const errors = validateCategories(categories);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        showMessage('error', 'Lütfen hataları düzeltin ve tekrar deneyin.');
        return;
      }

      // Save both categories and prompts
      const [categoriesResponse, promptsResponse] = await Promise.all([
        fetch('/api/admin/settings/categories', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({ categories })
        }),
        fetch('/api/admin/settings/prompts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: JSON.stringify({ prompts: aiPrompts })
        })
      ]);

      const [categoriesData, promptsData] = await Promise.all([
        categoriesResponse.json(),
        promptsResponse.json()
      ]);
      
      if (categoriesData.success && promptsData.success) {
        setCategories(categoriesData.data);
        setAiPrompts(promptsData.data);
        toggleEditMode('categories');
        showMessage('success', 'Kategoriler ve prompt\'lar başarıyla kaydedildi!');
      } else {
        const errorMsg = categoriesData.message || promptsData.message || 'Kaydetme işlemi başarısız';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Save categories error:', error);
      showMessage('error', 'Kaydetme sırasında bir hata oluştu!');
    } finally {
      setSaving(false);
    }
  };

  const savePrompts = async (categoryName) => {
    setSaving(true);
    setValidationErrors({});
    
    try {
      // Validate prompts
      const errors = validatePrompts(aiPrompts);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        showMessage('error', 'Lütfen hataları düzeltin ve tekrar deneyin.');
        return;
      }

      const response = await fetch('/api/admin/settings/prompts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ prompts: aiPrompts })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiPrompts(data.data);
        toggleEditMode('prompts', categoryName);
        showMessage('success', `${categoryName} prompt'ları başarıyla kaydedildi!`);
      } else {
        throw new Error(data.message || 'Kaydetme işlemi başarısız');
      }
    } catch (error) {
      console.error('Save prompts error:', error);
      showMessage('error', 'Kaydetme sırasında bir hata oluştu!');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const newCategory = {
      name: 'Yeni Kategori',
      styles: ['Yeni Stil'],
      image_url: '/images/ornek.jpg'
    };
    setCategories(prev => [...prev, newCategory]);
  };

  // Image upload functions
  const handleImageUpload = async (categoryIndex, file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'category');

      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Resim yükleme başarısız');
      }

      const data = await response.json();
      
      // Update category image URL
      setCategories(prev => prev.map((cat, i) => 
        i === categoryIndex ? { ...cat, image_url: data.url } : cat
      ));

      toast.success('Resim başarıyla yüklendi');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Resim yüklenirken hata oluştu');
    }
  };

  const triggerImageUpload = (categoryIndex) => {
    const input = fileInputRefs.current[categoryIndex];
    if (input) {
      input.click();
    }
  };

  const removeCategory = (index) => {
    setCategories(prev => prev.filter((_, i) => i !== index));
  };

  const updateCategoryName = (index, newName) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, name: newName } : cat
    ));
  };

  const addStyle = (categoryIndex) => {
    setCategories(prev => prev.map((cat, i) => 
      i === categoryIndex ? { ...cat, styles: [...cat.styles, 'Yeni Stil'] } : cat
    ));
  };

  const removeStyle = (categoryIndex, styleIndex) => {
    setCategories(prev => prev.map((cat, i) => 
      i === categoryIndex ? { ...cat, styles: cat.styles.filter((_, si) => si !== styleIndex) } : cat
    ));
  };

  const updateStyle = (categoryIndex, styleIndex, newStyle) => {
    setCategories(prev => prev.map((cat, i) => 
      i === categoryIndex ? {
        ...cat,
        styles: cat.styles.map((style, si) => si === styleIndex ? newStyle : style)
      } : cat
    ));
  };

  const updatePrompt = (category, style, newPrompt) => {
    setAiPrompts(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [style]: newPrompt
      }
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sistem Ayarları</h1>
              <p className="text-gray-600 mt-1">Sistem konfigürasyonu ve ayarları</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {message.text && (
          <div className={`p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* API Configuration */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleCategoryCollapse('API Konfigürasyonu')}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors flex-1 text-left"
              >
                <div className="p-2 bg-green-100 rounded-lg">
                  <Key className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">API Konfigürasyonu</h2>
                {collapsedCategories['API Konfigürasyonu'] ? (
                  <ChevronDown className="h-5 w-5 text-gray-500 ml-auto" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-500 ml-auto" />
                )}
              </button>
            </div>
          </div>
          {!collapsedCategories['API Konfigürasyonu'] && (
            <div className="p-6">
              <div className="space-y-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5 text-blue-600" />
                    Supabase Konfigürasyonu
                  </h3>
                  <div className="flex gap-2">
                    {editModes.supabase ? (
                      <>
                        <button
                          onClick={() => saveSystemConfig('supabase')}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          <Save className="h-4 w-4" />
                          {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                          onClick={() => toggleEditMode('supabase')}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          <X className="h-4 w-4" />
                          İptal
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => toggleEditMode('supabase')}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        <Edit2 className="h-4 w-4" />
                        Düzenle
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Database URL:</label>
                    {editModes.supabase ? (
                      <div>
                        <input
                          type="text"
                          value={systemConfig.supabase.url}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            supabase: { ...prev.supabase, url: e.target.value }
                          }))}
                          className={`w-full p-3 border rounded-md font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            validationErrors.url ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors.url && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.url}</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border rounded-md">
                        <p className="text-gray-800 break-all font-mono text-sm">{systemConfig.supabase.url}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Anonymous Key:</label>
                    {editModes.supabase ? (
                      <div>
                        <textarea
                          value={systemConfig.supabase.anonKey}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            supabase: { ...prev.supabase, anonKey: e.target.value }
                          }))}
                          className={`w-full p-3 border rounded-md font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            validationErrors.anonKey ? 'border-red-500' : ''
                          }`}
                          rows={3}
                        />
                        {validationErrors.anonKey && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.anonKey}</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border rounded-md">
                        <p className="text-gray-800 font-mono text-xs break-all">{systemConfig.supabase.anonKey}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <Webhook className="h-5 w-5 text-purple-600" />
                    N8N Webhook Konfigürasyonu
                  </h3>
                  <div className="flex gap-2">
                    {editModes.n8n ? (
                      <>
                        <button
                          onClick={() => saveSystemConfig('n8n')}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          <Save className="h-4 w-4" />
                          {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                          onClick={() => toggleEditMode('n8n')}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          <X className="h-4 w-4" />
                          İptal
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => toggleEditMode('n8n')}
                        className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                      >
                        <Edit2 className="h-4 w-4" />
                        Düzenle
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Webhook URL:</label>
                  {editModes.n8n ? (
                    <div>
                      <input
                        type="text"
                        value={systemConfig.n8n.webhookUrl}
                        onChange={(e) => setSystemConfig(prev => ({
                          ...prev,
                          n8n: { ...prev.n8n, webhookUrl: e.target.value }
                        }))}
                        className={`w-full p-3 border rounded-md font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          validationErrors.webhookUrl ? 'border-red-500' : ''
                        }`}
                      />
                      {validationErrors.webhookUrl && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.webhookUrl}</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-white border rounded-md">
                      <p className="text-gray-800 break-all font-mono text-sm">{systemConfig.n8n.webhookUrl}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <Key className="h-5 w-5 text-orange-600" />
                    JWT Konfigürasyonu
                  </h3>
                  <div className="flex gap-2">
                    {editModes.jwt ? (
                      <>
                        <button
                          onClick={() => saveSystemConfig('jwt')}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                        >
                          <Save className="h-4 w-4" />
                          {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                        <button
                          onClick={() => toggleEditMode('jwt')}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          <X className="h-4 w-4" />
                          İptal
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => toggleEditMode('jwt')}
                        className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                      >
                        <Edit2 className="h-4 w-4" />
                        Düzenle
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Secret Key:</label>
                    {editModes.jwt ? (
                      <div>
                        <input
                          type="text"
                          value={systemConfig.jwt.secret}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            jwt: { ...prev.jwt, secret: e.target.value }
                          }))}
                          className={`w-full p-3 border rounded-md font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                            validationErrors.secret ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors.secret && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.secret}</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border rounded-md">
                        <p className="text-gray-800 font-mono text-sm">{systemConfig.jwt.secret}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Token Süresi:</label>
                    {editModes.jwt ? (
                      <div>
                        <input
                          type="text"
                          value={systemConfig.jwt.expiresIn}
                          onChange={(e) => setSystemConfig(prev => ({
                            ...prev,
                            jwt: { ...prev.jwt, expiresIn: e.target.value }
                          }))}
                          className={`w-full p-3 border rounded-md font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                            validationErrors.expiresIn ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors.expiresIn && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors.expiresIn}</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-white border rounded-md">
                        <p className="text-gray-800 font-mono text-sm">{systemConfig.jwt.expiresIn}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Categories and Styles */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleCategoryCollapse('Kategoriler ve Stiller')}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors flex-1 text-left"
              >
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Settings className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Kategoriler ve Stiller</h2>
                {collapsedCategories['Kategoriler ve Stiller'] ? (
                  <ChevronDown className="h-5 w-5 text-gray-500 ml-auto" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-500 ml-auto" />
                )}
              </button>
              <div className="flex gap-2">
                {editModes.categories ? (
                  <>
                    <button
                      onClick={addCategory}
                      className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Kategori Ekle
                    </button>
                    <button
                      onClick={saveCategories}
                      disabled={saving}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? 'Kaydediliyor...' : 'Kategoriler & Prompt\'ları Kaydet'}
                    </button>
                    <button
                      onClick={() => toggleEditMode('categories')}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                    >
                      <X className="h-4 w-4" />
                      İptal
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => toggleEditMode('categories')}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                    Düzenle
                  </button>
                )}
              </div>
            </div>
          </div>
          {!collapsedCategories['Kategoriler ve Stiller'] && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {categories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-gray-50 border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                  {/* Category Image */}
                  <div className="mb-4">
                    <div className="relative group">
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/ornek.jpg';
                        }}
                      />
                      {editModes.categories && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => triggerImageUpload(categoryIndex)}
                            className="bg-white text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-medium"
                          >
                            <Upload className="h-4 w-4" />
                            Resim Değiştir
                          </button>
                        </div>
                      )}
                      <input
                        ref={(el) => fileInputRefs.current[categoryIndex] = el}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(categoryIndex, e.target.files[0])}
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    {editModes.categories ? (
                      <div className="flex-1">
                        <input
                          type="text"
                          value={category.name}
                          onChange={(e) => updateCategoryName(categoryIndex, e.target.value)}
                          className={`font-bold text-lg text-gray-900 bg-white border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            validationErrors[`category_${categoryIndex}_name`] ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors[`category_${categoryIndex}_name`] && (
                          <p className="text-red-500 text-xs mt-1">{validationErrors[`category_${categoryIndex}_name`]}</p>
                        )}
                      </div>
                    ) : (
                      <h3 className="font-bold text-lg text-gray-900">{category.name}</h3>
                    )}
                    {editModes.categories && (
                      <button
                        onClick={() => removeCategory(categoryIndex)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {category.styles.map((style, styleIndex) => (
                      <div key={styleIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          {editModes.categories ? (
                            <div className="flex-1">
                              <input
                                type="text"
                                value={style}
                                onChange={(e) => updateStyle(categoryIndex, styleIndex, e.target.value)}
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 border border-gray-300 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                  validationErrors[`category_${categoryIndex}_style_${styleIndex}`] ? 'border-red-500' : ''
                                }`}
                              />
                              {validationErrors[`category_${categoryIndex}_style_${styleIndex}`] && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors[`category_${categoryIndex}_style_${styleIndex}`]}</p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {style}
                            </span>
                          )}
                          {editModes.categories && (
                            <button
                              onClick={() => removeStyle(categoryIndex, styleIndex)}
                              className="text-red-600 hover:text-red-800 p-1 ml-2"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="mt-2">
                          {editModes.categories ? (
                            <textarea
                              value={aiPrompts[category.name]?.[style] || ''}
                              onChange={(e) => updatePrompt(category.name, style, e.target.value)}
                              placeholder={`${style} için prompt girin...`}
                              className="w-full text-sm text-gray-700 font-mono leading-relaxed bg-gray-50 p-3 rounded border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              rows={3}
                            />
                          ) : (
                            <div className="text-sm text-gray-600 font-mono leading-relaxed bg-gray-50 p-3 rounded border">
                              {aiPrompts[category.name]?.[style] || 'Prompt henüz tanımlanmamış'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {editModes.categories && (
                      <button
                        onClick={() => addStyle(categoryIndex)}
                        className="inline-flex items-center px-3 py-2 bg-indigo-100 border border-indigo-300 text-indigo-700 hover:bg-indigo-200 transition-colors rounded-lg"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Stil Ekle
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;