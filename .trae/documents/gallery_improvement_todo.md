# Galeri Sayfası İyileştirme TODO Listesi

## Öncelikli Görevler

### 1. Proxy Sistemini Kaldır
- **Durum**: Beklemede
- **Öncelik**: Yüksek
- **Açıklama**: Mevcut proxy sistemi çalışmıyor, resimler direkt orijinal URL'lerden gösterilecek
- **Teknik Detaylar**:
  - `Gallery.tsx` dosyasındaki `getProxiedImageUrl` fonksiyonunu kaldır
  - Resim URL'lerini direkt kullan
  - `api/routes/images.ts` dosyasındaki proxy endpoint'ini kaldır

### 2. Grid Düzenini Değiştir (3x3 → 5x5)
- **Durum**: Beklemede
- **Öncelik**: Orta
- **Açıklama**: Galeri sayfasında 3x3 grid yerine 5x5 grid kullanılacak
- **Teknik Detaylar**:
  - `Gallery.tsx` dosyasındaki CSS grid sınıflarını güncelle
  - `grid-cols-3` → `grid-cols-5` olarak değiştir
  - Responsive tasarım için mobil görünümü ayarla

### 3. İşleniyor Durumu Timeout Ekle
- **Durum**: Beklemede
- **Öncelik**: Yüksek
- **Açıklama**: İşleniyor durumundaki joblar 5 dakika sonra otomatik olarak başarısız duruma geçecek
- **Teknik Detaylar**:
  - `Gallery.tsx` dosyasına timeout logic ekle
  - Job oluşturma zamanını kontrol et
  - 5 dakika (300 saniye) geçmişse durumu 'failed' olarak güncelle
  - Backend'de de benzer kontrol mekanizması ekle

### 4. Galeri Görünümünü İyileştir
- **Durum**: Beklemede
- **Öncelik**: Orta
- **Açıklama**: Genel görünüm ve kullanıcı deneyimini iyileştir
- **Teknik Detaylar**:
  - Resim kartlarının tasarımını gözden geçir
  - Hover efektleri ekle
  - Loading state'lerini iyileştir
  - Boş durumlar için daha iyi placeholder'lar

### 5. Resim Yükleme Sorununu Çöz
- **Durum**: Beklemede
- **Öncelik**: Kritik
- **Açıklama**: Galeri sayfasında resimler görünmüyor, bu sorunu çöz
- **Teknik Detaylar**:
  - API response yapısını kontrol et
  - Image URL'lerinin doğru geldiğini doğrula
  - CORS ayarlarını kontrol et
  - Network tab'da hataları incele

## Deployment Görevleri

### 6. GitHub'a Commit Et
- **Durum**: Beklemede
- **Öncelik**: Düşük
- **Açıklama**: Tüm değişiklikleri GitHub'a commit et
- **Teknik Detaylar**:
  ```bash
  git add .
  git commit -m "feat: improve gallery layout and remove proxy system"
  git push origin main
  ```

### 7. Sunucu Deployment Talimatları
- **Durum**: Beklemede
- **Öncelik**: Düşük
- **Açıklama**: Sunucuda yapılması gereken işlemler
- **Teknik Detaylar**:
  ```bash
  # Sunucuda çalıştırılacak komutlar:
  cd /var/www/html/ResimAi
  git pull origin main
  npm install
  npm run build
  pm2 restart ecosystem.config.cjs
  ```

## Notlar
- Proxy sistemi kaldırıldıktan sonra CORS ayarlarının doğru çalıştığından emin ol
- Grid değişikliği sonrası mobil uyumluluğu test et
- Timeout mekanizması hem frontend hem backend'de implement edilmeli
- Tüm değişiklikler test edildikten sonra production'a deploy et

## Test Checklist
- [ ] Resimler doğru şekilde yükleniyor mu?
- [ ] 5x5 grid düzeni çalışıyor mu?
- [ ] İşleniyor durumu 5 dakika sonra başarısız oluyor mu?
- [ ] Mobil görünüm düzgün çalışıyor mu?
- [ ] Proxy kaldırıldıktan sonra resimler görünüyor mu?
- [ ] Performance etkilendi mi?