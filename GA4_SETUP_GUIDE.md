# Google Analytics 4 (GA4) Kurulum Rehberi

## 1. Google Analytics 4 Hesabı Oluşturma

1. [Google Analytics](https://analytics.google.com/) adresine gidin
2. "Ölçmeye başlayın" butonuna tıklayın
3. Hesap adını girin (örn: "ResimAI")
4. Mülk adını girin (örn: "ResimAI Website")
5. Sektör kategorisini seçin
6. İş hedeflerinizi seçin
7. Ülke ve para birimini seçin
8. Veri akışı oluşturun:
   - Platform: Web
   - Website URL: https://stylica.org
   - Akış adı: ResimAI Web

## 2. Measurement ID'yi Alma

1. GA4 panelinde sol menüden "Yönetici" seçin
2. "Veri Akışları" seçin
3. Web akışınıza tıklayın
4. **Measurement ID**'yi kopyalayın (G-XXXXXXXXXX formatında)

## 3. Service Account Oluşturma (Backend API için)

1. [Google Cloud Console](https://console.cloud.google.com/) gidin
2. Proje seçin veya yeni proje oluşturun
3. "APIs & Services" > "Credentials" gidin
4. "Create Credentials" > "Service Account" seçin
5. Service account adı girin (örn: "ga4-api-access")
6. Rol olarak "Viewer" seçin
7. "Create and Continue" tıklayın
8. "Keys" sekmesine gidin
9. "Add Key" > "Create new key" > "JSON" seçin
10. JSON dosyasını indirin

## 4. Google Analytics Data API'yi Etkinleştirme

1. Google Cloud Console'da "APIs & Services" > "Library" gidin
2. "Google Analytics Data API" aratın
3. API'yi etkinleştirin

## 5. Service Account'a GA4 Erişimi Verme

1. GA4 panelinde "Yönetici" > "Mülk Erişim Yönetimi" gidin
2. "+" butonuna tıklayın
3. Service account email adresini girin
4. Rol olarak "Görüntüleyici" seçin
5. "Ekle" butonuna tıklayın

## 6. Environment Değişkenlerini Ayarlama

`.env` dosyasını oluşturun ve şu değişkenleri ekleyin:

```env
# Google Analytics Configuration
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Analytics Data API Configuration (Backend)
GA4_PROPERTY_ID=123456789
GOOGLE_APPLICATION_CREDENTIALS=./api/config/google-service-account.json
```

## 7. Service Account JSON Dosyasını Yerleştirme

1. İndirdiğiniz JSON dosyasını `api/config/google-service-account.json` olarak kaydedin
2. Bu dosyayı `.gitignore`'a ekleyin (güvenlik için)

## 8. Property ID'yi Bulma

1. GA4 panelinde "Yönetici" gidin
2. "Mülk Ayarları" seçin
3. **Mülk ID**'sini kopyalayın (sadece rakamlar, örn: 123456789)

## 9. Test Etme

1. Backend sunucusunu başlatın: `npm run dev`
2. Admin paneline gidin
3. Analytics sayfasını açın
4. Gerçek GA4 verilerinin geldiğini kontrol edin

## Önemli Notlar

- GA4 verilerinin görünmesi 24-48 saat sürebilir
- Service Account JSON dosyasını asla public repository'ye yüklemeyin
- Property ID sadece rakamlardan oluşur (G- prefix'i olmadan)
- Measurement ID G- ile başlar ve frontend'de kullanılır
- Service Account backend API çağrıları için kullanılır

## Sorun Giderme

### "Permission denied" Hatası
- Service Account'un GA4 mülküne erişimi olduğunu kontrol edin
- Doğru Property ID kullandığınızdan emin olun

### "API not enabled" Hatası
- Google Analytics Data API'nin etkinleştirildiğini kontrol edin
- Doğru Google Cloud projesinde çalıştığınızdan emin olun

### Veri Gelmiyor
- GA4'e veri akışının başladığından emin olun
- En az 24 saat bekleyin
- Tarih aralığını kontrol edin

## Güvenlik

- Service Account JSON dosyasını güvenli tutun
- Minimum gerekli izinleri verin
- Düzenli olarak erişim loglarını kontrol edin
- Kullanılmayan Service Account'ları silin