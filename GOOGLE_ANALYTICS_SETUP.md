# 🚀 Google Analytics 4 Kurulum Rehberi

Bu rehber, Stylica.org projesine Google Analytics 4 (GA4) entegrasyonunu tamamlamak için gerekli adımları içerir.

## ✅ Tamamlanan Adımlar

- ✅ Google Analytics hesabı oluşturuldu
- ✅ Property eklendi ve web sitesi seçildi  
- ✅ Measurement ID alındı
- ✅ Analytics utility dosyası oluşturuldu (`src/utils/analytics.ts`)
- ✅ index.html'e GA4 script'leri eklendi
- ✅ App.tsx'e analytics entegrasyonu yapıldı
- ✅ Environment variable konfigürasyonu hazırlandı

## 🔧 Yapmanız Gereken Son Adımlar

### 1. Measurement ID'nizi Ekleyin

**Adım 1:** `.env` dosyası oluşturun (eğer yoksa)
```bash
cp .env.example .env
```

**Adım 2:** `.env` dosyasında `VITE_GA_MEASUREMENT_ID` değerini güncelleyin:
```env
# Google Analytics Configuration
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Buraya kendi Measurement ID'nizi yazın
```

**Adım 3:** `index.html` dosyasında da aynı ID'yi güncelleyin:
```html
<!-- Bu satırı bulun ve güncelleyin -->
const measurementId = 'G-XXXXXXXXXX'; // Kendi Measurement ID'nizi yazın
```

### 2. Projeyi Yeniden Başlatın

```bash
npm run dev
```

## 📊 Analytics Özellikleri

### Otomatik Tracking
- ✅ **Sayfa Görüntülemeleri**: Her route değişiminde otomatik
- ✅ **Kullanıcı Etkileşimleri**: Button click, form submit, link click
- ✅ **Hata Tracking**: JavaScript hataları
- ✅ **Performance Tracking**: Sayfa yükleme süreleri

### Manuel Tracking Örnekleri

```javascript
import { analytics } from './utils/analytics';

// Button click tracking
analytics.buttonClick('header-login-button');

// Form submit tracking
analytics.formSubmit('contact-form');

// Custom event tracking
analytics.trackEvent('image_processed', 'ai_processing', 'avatar_style');

// E-commerce tracking
analytics.addToCart('product_123', 29.99);
analytics.purchase('order_456', 59.98, 'TRY');

// User actions
analytics.login('email');
analytics.signup('google');
```

## 🔍 Veri Görüntüleme

### Google Analytics Dashboard
1. [analytics.google.com](https://analytics.google.com) → Hesabınıza girin
2. Property'nizi seçin
3. **Raporlar** → **Gerçek Zamanlı** → Canlı verileri görün
4. **Raporlar** → **Yaşam Döngüsü** → Detaylı analizler

### Admin Panelinde Görüntüleme
Şu anda admin panelinde **mock data** gösteriliyor. Gerçek GA verilerini göstermek için:

1. **Backend'de Google Analytics Reporting API** kurulumu yapın
2. **Service Account** oluşturun ve JSON key dosyası indirin
3. `AdminAnalytics.tsx` dosyasındaki yorumlarda detaylı kod örneği var

## 🚨 Önemli Notlar

### Güvenlik
- ❌ **Service Account key'lerini** asla frontend'e koymayın
- ✅ **Measurement ID** frontend'de güvenli (public bilgi)
- ✅ **API key'leri** sadece backend'de kullanın

### GDPR Uyumluluğu
```javascript
// Kullanıcı izni için
if (userConsent) {
  initializeGA();
}

// Çerez banner'ı ekleyin
// Analytics'i sadece izin verildikten sonra başlatın
```

### Production Deployment
```bash
# Build sırasında environment variable'lar otomatik eklenir
npm run build

# Vercel/Netlify'da environment variable'ları ayarlayın:
# VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 📈 Beklenen Sonuçlar

### 24 Saat İçinde
- ✅ Gerçek zamanlı ziyaretçi verileri
- ✅ Sayfa görüntüleme istatistikleri
- ✅ Kullanıcı etkileşim verileri

### 1 Hafta İçinde
- ✅ Detaylı demografik veriler
- ✅ Trafik kaynağı analizi
- ✅ Kullanıcı davranış raporları
- ✅ Dönüşüm oranları

## 🆘 Sorun Giderme

### Analytics Çalışmıyor?
1. **Console'u kontrol edin**: `F12` → Console → Hata mesajları
2. **Network tab'ını kontrol edin**: GA istekleri gidiyor mu?
3. **Measurement ID doğru mu**: `G-` ile başlıyor mu?
4. **Environment variable yüklendi mi**: `console.log(import.meta.env.VITE_GA_MEASUREMENT_ID)`

### Veriler Görünmüyor?
- **24 saat bekleyin**: GA4 verileri işlemek zaman alır
- **Gerçek zamanlı raporları kontrol edin**: Anlık veriler için
- **Ad blocker kapalı mı**: Analytics'i engelliyor olabilir

## 📞 Destek

Sorularınız için:
- 📧 **Email**: [destek@stylica.org](mailto:destek@stylica.org)
- 📚 **Dokümantasyon**: [Google Analytics Help](https://support.google.com/analytics)
- 🔧 **Geliştirici Rehberi**: [GA4 Developer Guide](https://developers.google.com/analytics/devguides/collection/ga4)

---

**🎉 Tebrikler!** Google Analytics 4 entegrasyonunuz hazır. Sadece Measurement ID'nizi ekleyin ve kullanmaya başlayın!