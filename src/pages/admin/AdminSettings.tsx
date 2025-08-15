import React, { useState, useRef, useEffect } from 'react';
import { Settings, Key, Database, Webhook, Code, Edit2, Save, X, Plus, Trash2, ChevronDown, ChevronUp, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '../../../shared/types';

type ValidationErrors = Record<string, string>;

const AdminSettings = () => {
  // Loading state
  const [loading, setLoading] = useState(true);
  // State for editable configuration
  const [systemConfig, setSystemConfig] = useState({
    supabase: {
      url: '',
      anonKey: '',
      serviceRoleKey: ''
    },
    n8n: {
      webhookUrl: '',
      apiKey: ''
    },
    jwt: {
      secret: '',
      expiresIn: ''
    },
    server: {
      port: '',
      url: ''
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
  const [categories, setCategories] = useState<Category[]>([
    {
      id: '1',
      name: 'Corporate',
      display_name_tr: 'Kurumsal Fotoğraf',
      display_name_en: 'Corporate Photography',
      type: 'Corporate',
      description: 'Profesyonel iş dünyası için kurumsal fotoğraflar. Yönetici pozisyonları, şirket profilleri ve resmi toplantılar için ideal.',
      description_en: 'Professional corporate photography for business world. Perfect for executive positions, company profiles and formal meetings.',
      styles: ['Professional', 'Business Casual', 'Executive', 'Formal Meeting', 'Leadership', 'Corporate Headshot'],
      styles_en: ['Professional', 'Business Casual', 'Executive', 'Formal Meeting', 'Leadership', 'Corporate Headshot'],
      image_url: '/images/ornek.jpg',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Creative',
      display_name_tr: 'Yaratıcı Portre',
      display_name_en: 'Creative Portrait',
      type: 'Creative',
      description: 'Sanatsal ve yaratıcı portre fotoğrafları. Özgün tarzınızı yansıtan, artistik ve etkileyici görüntüler.',
      description_en: 'Artistic and creative portrait photography. Unique images that reflect your personal style with artistic and impressive visuals.',
      styles: ['Artistic', 'Bohemian', 'Vintage', 'Modern Art', 'Abstract', 'Dramatic'],
      styles_en: ['Artistic', 'Bohemian', 'Vintage', 'Modern Art', 'Abstract', 'Dramatic'],
      image_url: '/images/ornek.jpg',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Avatar',
      display_name_tr: 'Avatar Oluşturucu',
      display_name_en: 'Avatar Creator',
      type: 'Avatar',
      description: 'Dijital avatar ve karakter fotoğrafları. Sosyal medya profilleri, oyun karakterleri ve dijital kimlik için.',
      description_en: 'Digital avatar and character photography. Perfect for social media profiles, gaming characters and digital identity.',
      styles: ['Cartoon', 'Realistic', 'Anime', 'Fantasy', 'Superhero', 'Gaming'],
      styles_en: ['Cartoon', 'Realistic', 'Anime', 'Fantasy', 'Superhero', 'Gaming'],
      image_url: '/images/ornek.jpg',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Outfit',
      display_name_tr: 'Elbise Değişimi',
      display_name_en: 'Outfit Change',
      type: 'Outfit',
      description: 'AI ile kıyafet değiştirme ve stil önerileri. Farklı kıyafet kombinasyonlarını deneyimleyin.',
      description_en: 'AI-powered outfit change and style suggestions. Experience different clothing combinations effortlessly.',
      styles: ['Casual', 'Formal', 'Sporty', 'Trendy', 'Business', 'Evening'],
      styles_en: ['Casual', 'Formal', 'Sporty', 'Trendy', 'Business', 'Evening'],
      image_url: '/images/ornek.jpg',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Background',
      display_name_tr: 'Arkaplan Değiştirme',
      display_name_en: 'Background Change',
      type: 'Background',
      description: 'Profesyonel arka plan değiştirme hizmeti. Fotoğraflarınızı istediğiniz ortamda gösterin.',
      description_en: 'Professional background change service. Showcase your photos in any environment you desire.',
      styles: ['Office', 'Studio', 'Nature', 'Abstract', 'Urban', 'Luxury'],
      styles_en: ['Office', 'Studio', 'Nature', 'Abstract', 'Urban', 'Luxury'],
      image_url: '/images/ornek.jpg',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '6',
      name: 'Skincare',
      display_name_tr: 'Cilt Düzeltme',
      display_name_en: 'Skin Enhancement',
      type: 'Skincare',
      description: 'AI destekli cilt düzeltme ve güzelleştirme. Doğal görünümlü, pürüzsüz ve parlak cilt.',
      description_en: 'AI-powered skin correction and enhancement. Natural-looking, smooth and radiant skin.',
      styles: ['Natural', 'Glowing', 'Professional', 'Fresh', 'Radiant', 'Flawless'],
      styles_en: ['Natural', 'Glowing', 'Professional', 'Fresh', 'Radiant', 'Flawless'],
      image_url: '/images/ornek.jpg',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

  // File input refs for image uploads
  const fileInputRefs = useRef({});

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
    loadCategoriesAndPrompts();
  }, []);

  // Load categories and prompts from admin-settings.json
  const loadCategoriesAndPrompts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Admin token bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76';
      console.log('Loading categories and prompts from:', `${API_BASE_URL}/api/admin/admin-settings`);
      
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('adminToken');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Loaded admin settings:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Veri yükleme başarısız');
      }
      
      const data = result.data;
      if (data.categories) {
        // Convert old format categories to new format if needed
        const formattedCategories = data.categories.map((cat: any, index: number) => ({
          id: cat.id || (index + 1).toString(),
          name: cat.name,
          display_name_tr: cat.display_name_tr || cat.name,
          display_name_en: cat.display_name_en || cat.name,
          type: cat.type || cat.name,
          description: cat.description || '',
          description_en: cat.description_en || cat.description || '',
          image_url: cat.image_url,
          styles: cat.styles,
          styles_en: cat.styles_en || cat.styles || [],
          is_active: cat.is_active !== undefined ? cat.is_active : true,
          created_at: cat.created_at || new Date().toISOString(),
          updated_at: cat.updated_at || new Date().toISOString()
        }));
        setCategories(formattedCategories);
      }
      if (data.aiPrompts) {
        setAiPrompts(data.aiPrompts);
      }
      if (data.supabase) {
         setSystemConfig(prev => ({
           ...prev,
           supabase: {
             url: data.supabase.url || '',
             anonKey: data.supabase.anonKey || '',
             serviceRoleKey: data.supabase.serviceRoleKey || ''
           }
         }));
      }
      if (data.n8n) {
        setSystemConfig(prev => ({
          ...prev,
          n8n: {
            webhookUrl: data.n8n.webhookUrl || '',
            apiKey: data.n8n.apiKey || ''
          }
        }));
      }
      if (data.jwt) {
        setSystemConfig(prev => ({
          ...prev,
          jwt: {
            secret: data.jwt.secretKey || '',
            expiresIn: data.jwt.tokenExpiry || '24h'
          }
        }));
      }
    } catch (error) {
      console.error('Error loading categories and prompts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Kategoriler ve prompt'lar yüklenirken hata oluştu: ${errorMessage}`);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Admin token bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76';
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('adminToken');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Debug: API'den gelen veriyi kontrol et
      console.log('API Response Data:', data);
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data || {}));
      
      // API direkt admin-settings.json içeriğini döndürüyor
      if (data) {
        // Update system config from data.data properties
        const systemConfig = {
          supabase: data.data.supabase || {},
          n8n: data.data.n8n || {},
          jwt: data.data.jwt || {},
          server: data.data.server || { port: '80', url: 'http://64.226.75.76' }
        };
        setSystemConfig(systemConfig);
        
        // Update categories
        if (data.data.categories) {
          // Convert old format categories to new format if needed
          const formattedCategories = data.data.categories.map((cat: any, index: number) => ({
            id: cat.id || (index + 1).toString(),
            name: cat.name,
            display_name_tr: cat.display_name_tr || cat.name,
            display_name_en: cat.display_name_en || cat.name,
            type: cat.type || cat.name,
            description: cat.description || '',
            image_url: cat.image_url,
            styles: cat.styles,
            is_active: cat.is_active !== undefined ? cat.is_active : true,
            created_at: cat.created_at || new Date().toISOString(),
            updated_at: cat.updated_at || new Date().toISOString()
          }));
          setCategories(formattedCategories);
        }
        
        // Update AI prompts
        if (data.data.aiPrompts) {
          setAiPrompts(data.data.aiPrompts);
        }
      }
    } catch (error) {
      console.error('Load settings error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Ayarlar yüklenirken hata oluştu: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // State for editable AI prompts - synchronized with API generatePrompt function
  const [aiPrompts, setAiPrompts] = useState({
    Corporate: {
      Klasik: 'Put the person in a traditional office environment with classic wooden furniture and formal atmosphere. Also, make sure they wear a classic business suit with traditional styling and conservative colors.',
      Modern: 'Put the person in a modern tech office environment with glass walls, contemporary furniture, and innovative workspace design. Also, make sure they wear a sleek contemporary business suit with modern cut and trendy styling.',
      Resmi: 'Put the person in a very formal corporate boardroom environment with mahogany furniture and executive atmosphere. Also, make sure they wear a strictly formal business suit with conservative styling, tie, and traditional corporate appearance.'
    },
    Creative: {
      Sanatsal: 'Transform the person with artistic effects: add colorful paint splashes on their face and hair, apply vibrant artistic makeup with bold colors, add creative face painting designs, and enhance with artistic lighting effects on the person. Keep the original background unchanged, focus only on making the person artistic and colorful.',
      Renkli: 'Transform the person into a vibrant, colorful portrait with rainbow-like color gradients on their clothing, add bright neon lighting effects around them, enhance their features with vivid makeup in electric blues, hot pinks, and golden yellows. Create a dynamic atmosphere with colorful light rays and energetic visual elements while maintaining the person as the focal point.',
      Minimalist: 'Create a clean, minimalist portrait with the person against a pure white or soft neutral background. Simplify their clothing to solid, muted colors like white, beige, or soft gray. Remove any distracting elements, use soft natural lighting, and focus on clean lines and elegant simplicity. The composition should be balanced and serene with plenty of negative space.'
    },
    Avatar: {
      'Çizgi Film': 'Transform the person into a vibrant cartoon-style avatar with exaggerated facial features, bright cartoon colors, simplified geometric shapes, large expressive eyes, and smooth animated textures. Apply a cel-shaded effect with bold outlines and maintain the playful, animated character aesthetic typical of modern animation studios.',
      Realistik: 'Create a high-quality realistic digital avatar that preserves all natural human features and proportions with enhanced detail. Improve skin texture, add subtle lighting effects, maintain authentic facial expressions, and ensure photorealistic quality while keeping the person\'s unique characteristics and identity intact.',
      Fantastik: 'Transform the person into an enchanting fantasy avatar with magical elements such as glowing eyes, ethereal lighting effects, mystical aura, fantasy-themed accessories like elven ears or magical symbols, and otherworldly atmospheric effects. Add fantasy colors and magical particle effects while maintaining recognizable human features.'
    },
    Outfit: {
      Casual: 'Transform the person\'s outfit to stylish casual wear: fitted dark jeans or chinos, a trendy t-shirt or casual button-down shirt, comfortable sneakers or casual shoes, and add accessories like a watch or casual jacket. Create a relaxed, everyday look that\'s both comfortable and fashionable.',
      Formal: 'Change the person\'s outfit to elegant formal attire: for men, a well-tailored dark suit with dress shirt, tie, and polished dress shoes; for women, an elegant cocktail dress or professional pantsuit with heels and refined accessories. Ensure the styling is sophisticated and appropriate for formal events.',
      Spor: 'Transform the person into athletic sportswear: moisture-wicking workout clothes, athletic shorts or leggings, performance t-shirt or tank top, quality running shoes, and sport-specific accessories like a fitness tracker or gym bag. Create an active, energetic appearance suitable for exercise or sports activities.'
    },
    Background: {
      Ofis: 'Replace the background with a sophisticated modern office environment featuring floor-to-ceiling windows with city views, sleek glass conference tables, contemporary furniture, soft ambient lighting, and professional workplace atmosphere. Add subtle details like modern art on walls and high-tech equipment.',
      Doğa: 'Transform the background into a breathtaking natural outdoor scene with lush green forests, golden sunlight filtering through trees, scenic mountain landscapes, or serene lakeside views. Include natural elements like flowing water, wildflowers, and soft natural lighting that creates a peaceful, organic atmosphere.',
      Stüdyo: 'Create a professional photography studio background with seamless gradient lighting, soft diffused illumination, clean minimalist backdrop in neutral tones (white, gray, or subtle colors), and professional studio lighting setup that enhances the subject without distractions.'
    },
    Skincare: {
      Doğal: 'Apply professional natural skin enhancement: subtly even out skin tone, reduce minor blemishes while preserving natural texture and pores, enhance the skin\'s inherent glow with soft lighting, and maintain authentic skin characteristics. Focus on healthy, realistic improvements that look naturally beautiful.',
      Pürüzsüz: 'Create flawless, magazine-quality skin with professional retouching: smooth out all imperfections, minimize pores, even skin tone completely, remove blemishes and fine lines, and apply subtle contouring for a polished, airbrushed finish while keeping facial features natural.',
      Parlak: 'Transform the skin with a luminous, radiant glow: enhance natural skin luminosity, add subtle highlighting to cheekbones and high points of the face, create a healthy dewy finish, boost overall skin radiance with warm golden undertones, and apply professional-grade skin brightening effects for a vibrant, youthful appearance.'
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

  // Load data on component mount
  useEffect(() => {
    loadCategoriesAndPrompts();
    loadSettings();
  }, []);

  const validateConfig = (section: string, config: any): ValidationErrors => {
    const errors = {} as ValidationErrors;
    
    if (section === 'supabase') {
      if (!config.url || !config.url.trim()) {
        errors.url = 'Supabase URL gereklidir';
      } else if (!config.url.startsWith('https://')) {
        errors.url = 'Geçerli bir HTTPS URL giriniz';
      } else if (!config.url.includes('.supabase.co')) {
        errors.url = 'Geçerli bir Supabase URL formatı: https://xxx.supabase.co';
      }
      
      if (!config.anonKey || !config.anonKey.trim()) {
        errors.anonKey = 'Anonymous Key gereklidir';
      } else if (config.anonKey.length < 50) {
        errors.anonKey = 'Geçerli bir Anonymous Key giriniz (en az 50 karakter)';
      } else if (!config.anonKey.startsWith('eyJ')) {
        errors.anonKey = 'Geçerli bir JWT token formatında olmalıdır';
      }
      
      if (!config.serviceRoleKey || !config.serviceRoleKey.trim()) {
        errors.serviceRoleKey = 'Service Role Key gereklidir';
      } else if (config.serviceRoleKey.length < 50) {
        errors.serviceRoleKey = 'Geçerli bir Service Role Key giriniz (en az 50 karakter)';
      } else if (!config.serviceRoleKey.startsWith('eyJ')) {
        errors.serviceRoleKey = 'Geçerli bir JWT token formatında olmalıdır';
      }
    }
    
    if (section === 'n8n') {
      if (!config.webhookUrl || !config.webhookUrl.trim()) {
        errors.webhookUrl = 'Webhook URL gereklidir';
      } else if (!config.webhookUrl.startsWith('http')) {
        errors.webhookUrl = 'Geçerli bir URL giriniz (http:// veya https://)';
      } else {
        try {
          new URL(config.webhookUrl);
        } catch {
          errors.webhookUrl = 'Geçerli bir URL formatı giriniz';
        }
      }
      
      if (config.apiKey && config.apiKey.trim() && config.apiKey.length < 10) {
        errors.apiKey = 'API Key en az 10 karakter olmalıdır';
      }
    }
    
    if (section === 'jwt') {
      if (!config.secret || !config.secret.trim()) {
        errors.secret = 'Secret Key gereklidir';
      } else if (config.secret.length < 32) {
        errors.secret = 'Secret Key güvenlik için en az 32 karakter olmalıdır';
      } else if (!/^[A-Za-z0-9+/=]+$/.test(config.secret)) {
        errors.secret = 'Secret Key sadece alfanumerik karakterler ve +/= içerebilir';
      }
      
      if (!config.expiresIn || !config.expiresIn.trim()) {
        errors.expiresIn = 'Token süresi gereklidir';
      } else if (!/^\d+[smhd]$/.test(config.expiresIn)) {
        errors.expiresIn = 'Geçerli format: 24h, 7d, 60m, 3600s';
      }
    }
    
    return errors;
  };

  const validateCategories = (categories: any[]): ValidationErrors => {
    const errors = {} as ValidationErrors;
    
    if (!categories || categories.length === 0) {
      errors.general = 'En az bir kategori gereklidir';
      return errors;
    }
    
    const categoryNames = new Set();
    
    categories.forEach((category, index) => {
      if (!category.name || !category.name.trim()) {
        errors[`category_${index}_name`] = 'Kategori adı gereklidir';
      } else if (category.name.trim().length < 2) {
        errors[`category_${index}_name`] = 'Kategori adı en az 2 karakter olmalıdır';
      } else if (category.name.trim().length > 50) {
        errors[`category_${index}_name`] = 'Kategori adı en fazla 50 karakter olabilir';
      } else if (categoryNames.has(category.name.trim().toLowerCase())) {
        errors[`category_${index}_name`] = 'Bu kategori adı zaten kullanılıyor';
      } else {
        categoryNames.add(category.name.trim().toLowerCase());
      }
      
      if (!category.styles || category.styles.length === 0) {
        errors[`category_${index}_styles`] = 'En az bir stil gereklidir';
      } else {
        const styleNames = new Set();
        category.styles.forEach((style, styleIndex) => {
          if (!style || !style.trim()) {
            errors[`category_${index}_style_${styleIndex}`] = 'Stil adı gereklidir';
          } else if (style.trim().length < 2) {
            errors[`category_${index}_style_${styleIndex}`] = 'Stil adı en az 2 karakter olmalıdır';
          } else if (style.trim().length > 30) {
            errors[`category_${index}_style_${styleIndex}`] = 'Stil adı en fazla 30 karakter olabilir';
          } else if (styleNames.has(style.trim().toLowerCase())) {
            errors[`category_${index}_style_${styleIndex}`] = 'Bu stil adı bu kategoride zaten kullanılıyor';
          } else {
            styleNames.add(style.trim().toLowerCase());
          }
        });
      }
      
      if (category.image_url && !category.image_url.startsWith('http') && !category.image_url.startsWith('/')) {
        errors[`category_${index}_image`] = 'Geçerli bir resim URL\'si giriniz';
      }
    });
    
    return errors;
  };

  const validatePrompts = (prompts: any): ValidationErrors => {
    const errors = {} as ValidationErrors;
    
    if (!prompts || Object.keys(prompts).length === 0) {
      errors.general = 'En az bir prompt kategorisi gereklidir';
      return errors;
    }
    
    Object.entries(prompts).forEach(([category, styles]) => {
      if (!styles || Object.keys(styles).length === 0) {
        errors[`${category}_general`] = `${category} kategorisi için en az bir stil prompt'u gereklidir`;
        return;
      }
      
      Object.entries(styles).forEach(([style, prompt]) => {
        if (!prompt || !prompt.trim()) {
          errors[`${category}_${style}`] = 'Prompt metni gereklidir';
        } else if (prompt.trim().length < 10) {
          errors[`${category}_${style}`] = 'Prompt en az 10 karakter olmalıdır';
        } else if (prompt.trim().length > 2000) {
          errors[`${category}_${style}`] = 'Prompt en fazla 2000 karakter olabilir';
        } else if (!prompt.includes('person') && !prompt.includes('subject') && !prompt.includes('image')) {
          errors[`${category}_${style}`] = 'Prompt, işlenecek kişi/nesne hakkında açıklama içermelidir';
        }
        
        // Check for potentially harmful content
        const harmfulWords = ['nude', 'naked', 'explicit', 'sexual', 'violence', 'blood', 'gore'];
        const lowerPrompt = prompt.toLowerCase();
        if (harmfulWords.some(word => lowerPrompt.includes(word))) {
          errors[`${category}_${style}`] = 'Prompt uygunsuz içerik barındırmamalıdır';
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

      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Admin token bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      // Get current settings first
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76';
      const currentResponse = await fetch(`${API_BASE_URL}/api/admin/admin-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let currentSettings = {};
      if (currentResponse.ok) {
        const result = await currentResponse.json();
        if (result.success) {
          currentSettings = result.data;
        } else {
          throw new Error(result.message || 'Mevcut ayarlar alınamadı');
        }
      } else {
        if (currentResponse.status === 401) {
          toast.error('Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('adminToken');
          return;
        }
        throw new Error(`Mevcut ayarlar alınamadı: HTTP ${currentResponse.status}`);
      }
      
      // Update with new system config
      const updatedSettings = {
        ...currentSettings,
        [section]: section === 'jwt' ? {
          secretKey: systemConfig.jwt.secret,
          tokenExpiry: systemConfig.jwt.expiresIn
        } : section === 'n8n' ? {
          webhookUrl: systemConfig.n8n.webhookUrl,
          apiKey: systemConfig.n8n.apiKey
        } : systemConfig[section]
      };
      
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedSettings)
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('adminToken');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Kaydetme işlemi başarısız');
      }

      toggleEditMode(section);
      showMessage('success', `${section} konfigürasyonu başarıyla kaydedildi!`);
    } catch (error) {
      console.error('Save config error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      showMessage('error', `Kaydetme sırasında bir hata oluştu: ${errorMessage}`);
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

      const token = localStorage.getItem('adminToken');
      if (!token) {
        showMessage('error', 'Admin token bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76';
      
      // 1. Save to admin-settings.json first
      // Get current settings first
      const currentResponse = await fetch(`${API_BASE_URL}/api/admin/admin-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let currentSettings = {};
      if (!currentResponse.ok) {
        if (currentResponse.status === 401) {
          showMessage('error', 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('adminToken');
          return;
        }
        throw new Error(`Mevcut ayarlar alınamadı: HTTP ${currentResponse.status}`);
      }
      
      const result = await currentResponse.json();
      if (!result.success) {
        throw new Error(result.message || 'Mevcut ayarlar alınamadı');
      }
      currentSettings = result.data;
      
      // Update with new categories and prompts
      const updatedSettings = {
        ...currentSettings,
        categories,
        aiPrompts
      };
      
      const response = await fetch(`${API_BASE_URL}/api/admin/admin-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedSettings)
      });

      if (!response.ok) {
        if (response.status === 401) {
          showMessage('error', 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('adminToken');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      if (!responseData.success) {
        throw new Error(responseData.message || 'Kaydetme işlemi başarısız');
      }
      
      // 2. Save each category to Supabase database
      for (const category of categories) {
        try {
          // Check if category exists by type
          const checkResponse = await fetch(`${API_BASE_URL}/api/categories/type/${encodeURIComponent(category.type || category.name)}`);
          
          if (checkResponse.ok) {
            // Category exists, get its ID and update it
            const existingCategory = await checkResponse.json();
            const categoryId = existingCategory.data.id;
            
            const updateResponse = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: category.name,
                display_name_tr: category.display_name_tr,
                display_name_en: category.display_name_en,
                type: category.type || category.name,
                description: category.description,
                description_en: category.description_en,
                image_url: category.image_url,
                styles: category.styles,
                styles_en: category.styles_en,
                is_active: category.is_active !== undefined ? category.is_active : true
              })
            });
            
            if (!updateResponse.ok) {
              console.warn(`Kategori güncelleme hatası (${category.name}):`, updateResponse.statusText);
            }
          } else {
            // Category doesn't exist, create it
            const createResponse = await fetch(`${API_BASE_URL}/api/categories`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                name: category.name,
                display_name_tr: category.display_name_tr,
                display_name_en: category.display_name_en,
                type: category.type || category.name,
                description: category.description,
                description_en: category.description_en,
                image_url: category.image_url,
                styles: category.styles,
                styles_en: category.styles_en,
                is_active: category.is_active !== undefined ? category.is_active : true
              })
            });
            
            if (!createResponse.ok) {
              const errorText = await createResponse.text();
              console.warn(`Kategori oluşturma hatası (${category.name}):`, errorText);
            } else {
              console.log(`Kategori başarıyla oluşturuldu: ${category.name}`);
            }
          }
        } catch (categoryError) {
          console.warn(`Kategori kaydetme hatası (${category.name}):`, categoryError);
        }
      }
      
      toggleEditMode('categories');
      showMessage('success', 'Kategoriler hem admin ayarlarına hem de veritabanına başarıyla kaydedildi!');
    } catch (error) {
      console.error('Save categories error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      showMessage('error', `Kaydetme sırasında bir hata oluştu: ${errorMessage}`);
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

      const token = localStorage.getItem('adminToken');
      if (!token) {
        showMessage('error', 'Admin token bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76';
      const response = await fetch(`${API_BASE_URL}/api/admin/settings/prompts`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompts: aiPrompts })
      });

      if (!response.ok) {
        if (response.status === 401) {
          showMessage('error', 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('adminToken');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Kaydetme işlemi başarısız');
      }
      
      setAiPrompts(data.data);
      toggleEditMode('prompts', categoryName);
      showMessage('success', `${categoryName} prompt'ları başarıyla kaydedildi!`);
    } catch (error) {
      console.error('Save prompts error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      showMessage('error', `Kaydetme sırasında bir hata oluştu: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name: 'Yeni Kategori',
      display_name_tr: 'Yeni Kategori',
      display_name_en: 'New Category',
      type: 'New',
      description: 'Yeni kategori açıklaması',
      description_en: 'New category description',
      styles: ['Yeni Stil'],
      styles_en: ['New Style'],
      image_url: '/images/ornek.jpg',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
      const token = localStorage.getItem('adminToken');
      if (!token) {
        toast.error('Admin token bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', 'category');

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://64.226.75.76';
      const response = await fetch(`${API_BASE_URL}/api/admin/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Yetkilendirme hatası. Lütfen tekrar giriş yapın.');
          localStorage.removeItem('adminToken');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Resim yükleme başarısız');
      }
      
      // Update category image URL
      setCategories(prev => prev.map((cat, i) => 
        i === categoryIndex ? { ...cat, image_url: data.url } : cat
      ));

      // Automatically save categories after image upload
      await saveCategories();
      
      toast.success('Resim yüklendi ve kategoriler kaydedildi!');
    } catch (error) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      toast.error(`Resim yüklenirken hata oluştu: ${errorMessage}`);
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

  const updateCategoryDisplayNameTr = (index, newDisplayName) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, display_name_tr: newDisplayName } : cat
    ));
  };

  const updateCategoryDisplayNameEn = (index, newDisplayName) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, display_name_en: newDisplayName } : cat
    ));
  };

  const updateCategoryDescription = (index, newDescription) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, description: newDescription } : cat
    ));
  };

  const updateCategoryDescriptionEn = (index, newDescription) => {
    setCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, description_en: newDescription } : cat
    ));
  };

  const addStyle = (categoryIndex) => {
    setCategories(prev => prev.map((cat, i) => 
      i === categoryIndex ? { 
        ...cat, 
        styles: [...cat.styles, 'Yeni Stil'],
        styles_en: [...(cat.styles_en || []), 'New Style']
      } : cat
    ));
  };

  const removeStyle = (categoryIndex, styleIndex) => {
    setCategories(prev => prev.map((cat, i) => 
      i === categoryIndex ? { 
        ...cat, 
        styles: cat.styles.filter((_, si) => si !== styleIndex),
        styles_en: (cat.styles_en || []).filter((_, si) => si !== styleIndex)
      } : cat
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

  const updateStyleEn = (categoryIndex, styleIndex, newStyle) => {
    setCategories(prev => prev.map((cat, i) => 
      i === categoryIndex ? {
        ...cat,
        styles_en: (cat.styles_en || []).map((style, si) => si === styleIndex ? newStyle : style)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ayarlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-8">


        {/* Success/Error Messages */}
        {message.text && (
          <div className={`p-4 rounded-lg border transition-all duration-300 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                {message.text}
              </div>
            </div>
          </div>
        )}
        
        {/* Validation Errors Summary */}
        {Object.keys(validationErrors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-sm font-medium text-red-800">Doğrulama Hataları</h3>
            </div>
            <div className="text-sm text-red-700">
              <p className="mb-2">Lütfen aşağıdaki hataları düzeltin:</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* API Configuration */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="border-b border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => toggleCategoryCollapse('API Konfigürasyonu')}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-all duration-200 flex-1 text-left"
              >
                <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                  <Key className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">API Konfigürasyonu</h2>
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
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <h3 className="font-semibold flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5 text-blue-600" />
                    Supabase Konfigürasyonu
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {editModes.supabase ? (
                      <>
                        <button
                          onClick={() => saveSystemConfig('supabase')}
                          disabled={saving}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all duration-200"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Kaydediliyor...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Kaydet
                            </>
                          )}
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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
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
                          className={`w-full p-3 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                            validationErrors.url ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                          placeholder="https://your-project.supabase.co"
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
                          className={`w-full p-3 border rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none ${
                            validationErrors.anonKey ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                          rows={3}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all duration-200"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Kaydediliyor...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Kaydet
                            </>
                          )}
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
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all duration-200"
                        >
                          {saving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Kaydediliyor...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Kaydet
                            </>
                          )}
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
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all duration-200"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Kaydediliyor...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Kategoriler & Prompt'ları Kaydet
                        </>
                      )}
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
                      <div className="flex-1 space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Kategori Adı (ID)</label>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => updateCategoryName(categoryIndex, e.target.value)}
                            className={`w-full font-bold text-lg text-gray-900 bg-white border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                              validationErrors[`category_${categoryIndex}_name`] ? 'border-red-500' : ''
                            }`}
                          />
                          {validationErrors[`category_${categoryIndex}_name`] && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors[`category_${categoryIndex}_name`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Türkçe Görünen Ad</label>
                          <input
                            type="text"
                            value={category.display_name_tr || ''}
                            onChange={(e) => updateCategoryDisplayNameTr(categoryIndex, e.target.value)}
                            className={`w-full text-sm text-gray-900 bg-white border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                              validationErrors[`category_${categoryIndex}_display_name_tr`] ? 'border-red-500' : ''
                            }`}
                            placeholder="Türkçe kategori adı"
                          />
                          {validationErrors[`category_${categoryIndex}_display_name_tr`] && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors[`category_${categoryIndex}_display_name_tr`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">İngilizce Görünen Ad</label>
                          <input
                            type="text"
                            value={category.display_name_en || ''}
                            onChange={(e) => updateCategoryDisplayNameEn(categoryIndex, e.target.value)}
                            className={`w-full text-sm text-gray-900 bg-white border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                              validationErrors[`category_${categoryIndex}_display_name_en`] ? 'border-red-500' : ''
                            }`}
                            placeholder="English category name"
                          />
                          {validationErrors[`category_${categoryIndex}_display_name_en`] && (
                            <p className="text-red-500 text-xs mt-1">{validationErrors[`category_${categoryIndex}_display_name_en`]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Türkçe Açıklama</label>
                          <textarea
                            value={category.description || ''}
                            onChange={(e) => updateCategoryDescription(categoryIndex, e.target.value)}
                            className="w-full text-sm text-gray-900 bg-white border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Türkçe kategori açıklaması"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">İngilizce Açıklama</label>
                          <textarea
                            value={category.description_en || ''}
                            onChange={(e) => updateCategoryDescriptionEn(categoryIndex, e.target.value)}
                            className="w-full text-sm text-gray-900 bg-white border rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="English category description"
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{category.display_name_tr || category.name}</h3>
                        <p className="text-sm text-gray-600">{category.display_name_en}</p>
                        <p className="text-xs text-gray-500 mt-1">{category.description}</p>
                      </div>
                    )}
                    {editModes.categories && (
                      <button
                        onClick={() => removeCategory(categoryIndex)}
                        className="text-red-600 hover:text-red-800 p-1 ml-2"
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
                            <div className="flex-1 space-y-2">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Türkçe Stil</label>
                                <input
                                  type="text"
                                  value={style}
                                  onChange={(e) => updateStyle(categoryIndex, styleIndex, e.target.value)}
                                  className={`w-full px-3 py-1 rounded text-sm font-medium bg-gray-50 border border-gray-300 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                                    validationErrors[`category_${categoryIndex}_style_${styleIndex}`] ? 'border-red-500' : ''
                                  }`}
                                  placeholder="Türkçe stil adı"
                                />
                                {validationErrors[`category_${categoryIndex}_style_${styleIndex}`] && (
                                  <p className="text-red-500 text-xs mt-1">{validationErrors[`category_${categoryIndex}_style_${styleIndex}`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">İngilizce Stil</label>
                                <input
                                  type="text"
                                  value={(category.styles_en && category.styles_en[styleIndex]) || ''}
                                  onChange={(e) => updateStyleEn(categoryIndex, styleIndex, e.target.value)}
                                  className="w-full px-3 py-1 rounded text-sm font-medium bg-gray-50 border border-gray-300 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="English style name"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex-1">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {style}
                              </span>
                              {category.styles_en && category.styles_en[styleIndex] && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 ml-2">
                                  {category.styles_en[styleIndex]}
                                </span>
                              )}
                            </div>
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
  );
};

export default AdminSettings;