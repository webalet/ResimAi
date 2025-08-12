# Çift Dil Desteği (Türkçe/İngilizce) TODO Listesi

## 🚨 ÖNEMLİ TEST KURALI
**TÜM TESTLER MUTLAKA SSH SUNUCUSUNDA YAPILACAK!**
- SSH Sunucu: `ssh root@64.226.75.76`
- Test Süreci: Kod değişikliği → GitHub push → Sunucuda git pull → Test
- Lokal testler yapılmayacak, sadece sunucuda test edilecek

## 1. Fiyat Sistemi Güncellemesi

### 1.1 Temel Fiyat Yapısı (Sadece Görüntüleme Değişikliği) ✅ TAMAMLANDI
- [x] Mevcut TL fiyat yapısını koru (değiştirme!)
- [x] Sadece dil değiştiğinde para birimi gösterimini değiştir:
  - **Türkçe**: 10 kredi = 100 TL (mevcut fiyatlar korunacak)
  - **İngilizce**: 10 kredi = 3 USD
- [x] Diğer paketlerin USD karşılıklarını hesapla:
  - 1 kredi = 0 TL / 0 USD (Ücretsiz)
  - 10 kredi = 100 TL / 3 USD
  - 25 kredi = 250 TL / 7.5 USD
  - 60 kredi = 600 TL / 18 USD
  - 150 kredi = 1500 TL / 45 USD

### 1.2 Para Birimi Sistemi (Sadece Frontend Gösterim) ✅ TAMAMLANDI
- [x] TL fiyatları değiştirme (mevcut fiyatlar korunacak)
- [x] İngilizce dil seçildiğinde USD fiyatları göster
- [x] Para birimi değişim API'si YAPMA (sadece frontend gösterim)
- [x] Fiyat gösterim componentlerini güncelle (sadece görsel)
- [x] ExchangeRate sistemini kaldır ve doğrudan TL/USD fiyatlarını kullan
- [x] Pricing.tsx dosyasındaki yanlış fiyat hesaplamalarını düzelt

### 1.3 Backend Değişiklikleri (YAPILMAYACAK)
- [ ] ~~`api/routes/subscriptions.ts` dosyasını güncelle~~ (YAPMA)
- [ ] ~~Veritabanı fiyat tablolarını güncelle~~ (YAPMA)
- [ ] ~~Ödeme sistemlerini (Stripe/PayPal) yeni fiyatlarla senkronize et~~ (YAPMA)
- [ ] **Sadece frontend'de dil değiştiğinde fiyat gösterimini değiştir**

## 2. i18n (Internationalization) Sistemi

### 2.1 i18n Kütüphanesi Kurulumu ✅ TAMAMLANDI
- [x] `react-i18next` kütüphanesini yükle
- [x] i18n konfigürasyonunu oluştur
- [x] Dil dosyalarının yapısını belirle

### 2.2 Dil Dosyaları Oluşturma ✅ TAMAMLANDI
- [x] `src/locales/tr.json` - Türkçe çeviriler
- [x] `src/locales/en.json` - İngilizce çeviriler
- [x] Tüm UI metinlerini çeviri anahtarlarına dönüştür

### 2.3 Dil Değiştirme Sistemi ⚠️ KISMEN TAMAMLANDI
- [x] Dil seçici component oluştur
- [x] Dil tercihini localStorage'da sakla
- [ ] URL'de dil parametresi desteği ekle (/tr, /en) - ÖNEMLİ!
- [x] Varsayılan dil algılama (browser language)

## 3. Frontend Çeviri İmplementasyonu

### 3.1 Ana Sayfalar ✅ ÇOĞU TAMAMLANDI
- [x] Home.tsx - Ana sayfa çevirileri
- [x] Login.tsx - Giriş sayfası
- [x] Register.tsx - Kayıt sayfası
- [ ] Dashboard.tsx - Kullanıcı paneli
- [ ] Profile.tsx - Profil sayfası
- [x] Pricing.tsx - Fiyatlandırma sayfası
- [ ] Categories.tsx - Kategoriler sayfası
- [ ] Gallery.tsx - Galeri sayfası

### 3.2 Componentler
- [ ] Layout.tsx - Genel layout çevirileri
- [ ] Navigation menüleri
- [ ] Form etiketleri ve validasyon mesajları
- [ ] Button metinleri
- [ ] Modal ve popup metinleri
- [ ] Loading ve error mesajları

### 3.3 Admin Paneli (Türkçe Kalacak)
- [ ] Admin paneli sayfalarını çeviri sisteminden hariç tut
- [ ] AdminSettings.tsx - Türkçe kalsın
- [ ] AdminAnalytics.tsx - Türkçe kalsın
- [ ] AdminJobs.tsx - Türkçe kalsın

## 4. Backend API Güncellemeleri

### 4.1 Çok Dilli İçerik Desteği
- [ ] Kategori isimlerini çift dil destekle güncelle
- [ ] Hata mesajlarını dil bazlı döndür
- [ ] Email şablonlarını çift dil yap
- [ ] API response'larında dil parametresi desteği

### 4.2 Veritabanı Güncellemeleri
- [ ] Categories tablosuna `name_en` kolonu ekle
- [ ] Mevcut kategori isimlerini İngilizce çevir
- [ ] Migration dosyaları oluştur

## 5. Test ve Deployment Süreci

### 5.1 Geliştirme Süreci
- [ ] **1. Adım**: Kod değişikliklerini yap
- [ ] **2. Adım**: GitHub'a commit ve push yap
- [ ] **3. Adım**: SSH ile sunucuya bağlan: `ssh root@64.226.75.76`
- [ ] **4. Adım**: Sunucuda `git pull` çek
- [ ] **5. Adım**: `npm run build` ile build al
- [ ] **6. Adım**: PM2 ile restart yap
- [ ] **7. Adım**: Canlı sitede test et

### 5.2 Test Senaryoları
- [ ] Dil değiştirme fonksiyonunu test et
- [ ] Tüm sayfalarda çevirileri kontrol et
- [ ] Fiyat gösterimlerini test et (TL/USD)
- [ ] Para birimi değişimini test et
- [ ] Admin panelinin Türkçe kaldığını doğrula
- [ ] Mobil responsive çevirileri test et

### 5.3 SSH Sunucu Test Komutları
```bash
# Sunucuya bağlan
ssh root@64.226.75.76

# Proje dizinine git
cd /path/to/project

# GitHub'dan güncellemeleri çek
git pull origin main

# Bağımlılıkları güncelle
npm install

# Build al
npm run build

# PM2 ile restart
pm2 restart all

# Logları kontrol et
pm2 logs
```

## 6. SEO ve URL Yapısı

### 6.1 Çok Dilli URL Yapısı
- [ ] `/tr/` - Türkçe sayfalar
- [ ] `/en/` - İngilizce sayfalar
- [ ] Varsayılan dil yönlendirmesi
- [ ] Sitemap güncellemeleri

### 6.2 Meta Tags ve SEO
- [ ] Her dil için ayrı meta descriptions
- [ ] hreflang etiketleri ekle
- [ ] Open Graph etiketlerini çift dil yap

## 7. Kullanıcı Deneyimi İyileştirmeleri

### 7.1 Dil Geçiş Animasyonları
- [ ] Smooth dil değiştirme animasyonu
- [ ] Loading state'leri ekle
- [ ] Dil değişiminde sayfa yenilenmesini önle

### 7.2 Kültürel Uyarlamalar
- [ ] Tarih formatları (TR: dd.mm.yyyy, EN: mm/dd/yyyy)
- [ ] Sayı formatları (TR: 1.000,50, EN: 1,000.50)
- [ ] Para birimi sembolleri (₺, $)

## 8. Kalite Kontrol

### 8.1 Çeviri Kalitesi
- [ ] Tüm çevirileri gözden geçir
- [ ] Teknik terimler için tutarlılık sağla
- [ ] UI/UX açısından metin uzunluklarını kontrol et

### 8.2 Fonksiyonel Testler
- [ ] Tüm formların çift dilde çalıştığını doğrula
- [ ] Ödeme süreçlerini test et
- [ ] Email bildirimlerini test et
- [ ] Hata durumlarını test et

## 9. Dokümantasyon

### 9.1 Geliştirici Dokümantasyonu
- [ ] i18n kullanım kılavuzu
- [ ] Yeni çeviri ekleme prosedürü
- [ ] Dil dosyası yapısı dokümantasyonu

### 9.2 Kullanıcı Dokümantasyonu
- [ ] Dil değiştirme rehberi
- [ ] FAQ güncellemeleri
- [ ] Yardım sayfaları çevirileri

---

## ⚠️ HATIRLATMA
**Bu todo listesindeki her madde için testler MUTLAKA SSH sunucusunda yapılacak!**
- Lokal test yapma
- Her değişiklikten sonra GitHub'a push yap
- Sunucuda git pull çek ve test et
- SSH: `ssh root@64.226.75.76`