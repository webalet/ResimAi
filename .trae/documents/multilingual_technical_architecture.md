# Çift Dil Desteği Teknik Mimari Dokümantasyonu

## 1. Genel Mimari Yaklaşım

### 1.1 i18n Stratejisi
- **Frontend**: React-i18next kullanarak client-side çeviri
- **Backend**: API response'larında dil parametresi desteği
- **Database**: Çok dilli içerik için ayrı kolonlar
- **URL Yapısı**: `/tr/` ve `/en/` prefix'leri

### 1.2 Dil Algılama Hiyerarşisi
1. URL parametresi (`/tr/` veya `/en/`)
2. localStorage'daki kullanıcı tercihi
3. Browser'ın varsayılan dili
4. Fallback: Türkçe

## 2. Frontend Mimari

### 2.1 i18n Konfigürasyonu
```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import tr from './locales/tr.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en }
    },
    lng: 'tr', // varsayılan dil
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
```

### 2.2 Dil Dosyası Yapısı
```json
// src/i18n/locales/tr.json
{
  "common": {
    "loading": "Yükleniyor...",
    "error": "Bir hata oluştu",
    "save": "Kaydet",
    "cancel": "İptal",
    "delete": "Sil",
    "edit": "Düzenle"
  },
  "navigation": {
    "home": "Ana Sayfa",
    "gallery": "Galeri",
    "pricing": "Fiyatlandırma",
    "profile": "Profil",
    "logout": "Çıkış"
  },
  "pricing": {
    "credits": "kredi",
    "currency": "₺",
    "packages": {
      "basic": {
        "name": "Temel Paket",
        "credits": 10,
        "price": 45,
        "description": "Başlangıç için ideal"
      }
    }
  }
}
```

### 2.3 Dil Değiştirici Component
```typescript
// src/components/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    
    // URL'yi güncelle
    const currentPath = location.pathname;
    const newPath = currentPath.replace(/^\/(tr|en)/, `/${lng}`);
    navigate(newPath);
  };

  return (
    <div className="language-switcher">
      <button 
        onClick={() => changeLanguage('tr')}
        className={i18n.language === 'tr' ? 'active' : ''}
      >
        TR
      </button>
      <button 
        onClick={() => changeLanguage('en')}
        className={i18n.language === 'en' ? 'active' : ''}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
```

## 3. Fiyatlandırma Sistemi Mimarisi

### 3.1 Para Birimi Yönetimi
```typescript
// src/utils/currency.ts
export interface PricePackage {
  id: string;
  credits: number;
  price_usd: number;
  price_try: number;
}

export const PRICE_PACKAGES: PricePackage[] = [
  { id: 'basic', credits: 10, price_usd: 3, price_try: 100 },
  { id: 'standard', credits: 25, price_usd: 7.5, price_try: 250 },
  { id: 'premium', credits: 50, price_usd: 15, price_try: 500 },
  { id: 'pro', credits: 100, price_usd: 30, price_try: 1000 },
  { id: 'business', credits: 250, price_usd: 75, price_try: 2500 },
  { id: 'enterprise', credits: 500, price_usd: 150, price_try: 5000 }
];

export const getCurrencySymbol = (language: string): string => {
  return language === 'tr' ? '₺' : '$';
};

export const getPrice = (packageItem: PricePackage, language: string): number => {
  return language === 'tr' ? packageItem.price_try : packageItem.price_usd;
};
```

### 3.2 Fiyat Gösterim Component
```typescript
// src/components/PriceDisplay.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrencySymbol, getPrice, PricePackage } from '../utils/currency';

interface PriceDisplayProps {
  package: PricePackage;
}

const PriceDisplay: React.FC<PriceDisplayProps> = ({ package: pkg }) => {
  const { i18n, t } = useTranslation();
  
  const price = getPrice(pkg, i18n.language);
  const currency = getCurrencySymbol(i18n.language);
  
  return (
    <div className="price-display">
      <span className="credits">{pkg.credits} {t('pricing.credits')}</span>
      <span className="price">{price}{currency}</span>
    </div>
  );
};

export default PriceDisplay;
```

## 4. Backend API Güncellemeleri

### 4.1 Dil Parametresi Middleware
```typescript
// api/middleware/language.ts
import { Request, Response, NextFunction } from 'express';

export interface LocalizedRequest extends Request {
  language: 'tr' | 'en';
}

export const languageMiddleware = (
  req: LocalizedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const lang = req.headers['accept-language'] || 
               req.query.lang || 
               req.body.lang || 
               'tr';
  
  req.language = lang === 'en' ? 'en' : 'tr';
  next();
};
```

### 4.2 Çok Dilli Kategori API
```typescript
// api/routes/categories.ts
import { Router } from 'express';
import { languageMiddleware, LocalizedRequest } from '../middleware/language';

const router = Router();

router.get('/categories', languageMiddleware, async (req: LocalizedRequest, res) => {
  try {
    const { language } = req;
    
    const categories = await supabase
      .from('categories')
      .select(`
        id,
        ${language === 'en' ? 'name_en as name' : 'name_tr as name'},
        image_url,
        created_at
      `);
    
    res.json({ success: true, data: categories.data });
  } catch (error) {
    const errorMessage = req.language === 'en' 
      ? 'Failed to fetch categories'
      : 'Kategoriler yüklenemedi';
    
    res.status(500).json({ success: false, error: errorMessage });
  }
});

export default router;
```

## 5. Veritabanı Şeması Güncellemeleri

### 5.1 Categories Tablosu Migration
```sql
-- supabase/migrations/add_multilingual_categories.sql
ALTER TABLE categories 
ADD COLUMN name_en VARCHAR(255),
ADD COLUMN description_en TEXT;

-- Mevcut Türkçe isimleri name_tr kolonuna taşı
ALTER TABLE categories 
RENAME COLUMN name TO name_tr;

ALTER TABLE categories 
RENAME COLUMN description TO description_tr;

-- İngilizce çevirileri ekle
UPDATE categories SET name_en = 'Portrait' WHERE name_tr = 'Portre';
UPDATE categories SET name_en = 'Landscape' WHERE name_tr = 'Manzara';
UPDATE categories SET name_en = 'Abstract' WHERE name_tr = 'Soyut';
-- ... diğer kategoriler
```

### 5.2 Pricing Tablosu
```sql
-- supabase/migrations/add_pricing_currencies.sql
CREATE TABLE pricing_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_key VARCHAR(50) UNIQUE NOT NULL,
  credits INTEGER NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  price_try DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Yeni fiyat paketlerini ekle (SADECE GÖRÜNTÜLEME İÇİN - BACKEND DEĞİŞTİRME)
INSERT INTO pricing_packages (package_key, credits, price_usd, price_try) VALUES
('basic', 10, 3.00, 100.00),
('standard', 25, 7.50, 250.00),
('premium', 50, 15.00, 500.00),
('pro', 100, 30.00, 1000.00),
('business', 250, 75.00, 2500.00),
('enterprise', 500, 150.00, 5000.00);
```

## 6. Routing Mimarisi

### 6.1 Çok Dilli Route Yapısı
```typescript
// src/router/LanguageRouter.tsx
import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LanguageRouter: React.FC = () => {
  const { i18n } = useTranslation();
  
  return (
    <Routes>
      {/* Varsayılan dil yönlendirmesi */}
      <Route path="/" element={<Navigate to="/tr" replace />} />
      
      {/* Dil bazlı rotalar */}
      <Route path="/:lang/*" element={<LanguageRoutes />} />
    </Routes>
  );
};

const LanguageRoutes: React.FC = () => {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  
  // Dil değişikliğini uygula
  React.useEffect(() => {
    if (lang && (lang === 'tr' || lang === 'en')) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/profile" element={<Profile />} />
      {/* Admin rotaları dil prefix'i olmadan */}
      <Route path="/admin/*" element={<AdminRoutes />} />
    </Routes>
  );
};
```

## 7. SEO ve Meta Tag Yönetimi

### 7.1 Çok Dilli Meta Tags
```typescript
// src/components/SEOHead.tsx
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOHeadProps {
  titleKey: string;
  descriptionKey: string;
  path: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({ titleKey, descriptionKey, path }) => {
  const { t, i18n } = useTranslation();
  
  const title = t(titleKey);
  const description = t(descriptionKey);
  const currentLang = i18n.language;
  const alternateLang = currentLang === 'tr' ? 'en' : 'tr';
  
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      
      {/* hreflang etiketleri */}
      <link rel="alternate" hrefLang="tr" href={`https://resim.ai/tr${path}`} />
      <link rel="alternate" hrefLang="en" href={`https://resim.ai/en${path}`} />
      <link rel="alternate" hrefLang="x-default" href={`https://resim.ai/tr${path}`} />
    </Helmet>
  );
};

export default SEOHead;
```

## 8. Test Stratejisi

### 8.1 SSH Sunucu Test Süreci
```bash
#!/bin/bash
# scripts/deploy-and-test.sh

echo "🚀 Çift dil desteği deployment ve test süreci başlıyor..."

# 1. GitHub'a push
echo "📤 GitHub'a push yapılıyor..."
git add .
git commit -m "feat: çift dil desteği implementasyonu"
git push origin main

# 2. SSH ile sunucuya bağlan ve güncelle
echo "🔗 SSH sunucusuna bağlanılıyor..."
ssh root@64.226.75.76 << 'EOF'
  cd /path/to/resim-ai
  
  echo "📥 Git pull çekiliyor..."
  git pull origin main
  
  echo "📦 Bağımlılıklar güncelleniyor..."
  npm install
  
  echo "🏗️ Build alınıyor..."
  npm run build
  
  echo "🔄 PM2 restart yapılıyor..."
  pm2 restart all
  
  echo "📊 PM2 status kontrol ediliyor..."
  pm2 status
  
  echo "📝 Son loglar kontrol ediliyor..."
  pm2 logs --lines 20
EOF

echo "✅ Deployment tamamlandı! Test için: https://resim.ai"
echo "🔍 Test edilecek özellikler:"
echo "  - Dil değiştirme (TR/EN)"
echo "  - Fiyat gösterimleri (TL/USD)"
echo "  - Tüm sayfa çevirileri"
echo "  - Admin paneli (sadece TR)"
```

### 8.2 Otomatik Test Senaryoları
```typescript
// tests/multilingual.test.ts
import { test, expect } from '@playwright/test';

test.describe('Çift Dil Desteği Testleri', () => {
  test('Dil değiştirme çalışıyor', async ({ page }) => {
    await page.goto('https://resim.ai/tr');
    
    // Türkçe içerik kontrolü
    await expect(page.locator('text=Ana Sayfa')).toBeVisible();
    
    // İngilizce'ye geç
    await page.click('[data-testid="lang-switcher-en"]');
    await page.waitForURL('**/en/**');
    
    // İngilizce içerik kontrolü
    await expect(page.locator('text=Home')).toBeVisible();
  });
  
  test('Fiyat gösterimleri doğru', async ({ page }) => {
    // Türkçe fiyatlar
    await page.goto('https://resim.ai/tr/pricing');
    await expect(page.locator('text=45₺')).toBeVisible();
    
    // İngilizce fiyatlar
    await page.goto('https://resim.ai/en/pricing');
    await expect(page.locator('text=$3')).toBeVisible();
  });
  
  test('Admin paneli Türkçe kalıyor', async ({ page }) => {
    await page.goto('https://resim.ai/admin/login');
    
    // Admin paneli her zaman Türkçe
    await expect(page.locator('text=Yönetici Girişi')).toBeVisible();
  });
});
```

## 9. Performans Optimizasyonları

### 9.1 Lazy Loading Çevirileri
```typescript
// src/i18n/lazyLoader.ts
import { lazy } from 'react';

const loadTranslations = async (language: string) => {
  const translations = await import(`./locales/${language}.json`);
  return translations.default;
};

export const LazyLanguageLoader: React.FC = () => {
  const [translations, setTranslations] = useState(null);
  const { i18n } = useTranslation();
  
  useEffect(() => {
    loadTranslations(i18n.language).then(setTranslations);
  }, [i18n.language]);
  
  if (!translations) {
    return <div>Loading translations...</div>;
  }
  
  return <App />;
};
```

### 9.2 CDN ve Caching
```typescript
// vite.config.ts - Build optimizasyonları
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'i18n-tr': ['./src/i18n/locales/tr.json'],
          'i18n-en': ['./src/i18n/locales/en.json']
        }
      }
    }
  }
});
```

---

## 🚨 DEPLOYMENT HATIRLATMASI

**Her değişiklik için SSH sunucusunda test zorunludur:**
1. Kod değişikliği yap
2. GitHub'a push et
3. `ssh root@64.226.75.76` ile bağlan
4. `git pull && npm run build && pm2 restart all`
5. Canlı sitede test et

**Test edilmesi gerekenler:**
- ✅ Dil değiştirme fonksiyonu
- ✅ Tüm sayfa çevirileri
- ✅ Fiyat gösterimleri (TL/USD)
- ✅ Admin paneli Türkçe kalması
- ✅ SEO ve URL yapısı
- ✅ Mobil uyumluluk