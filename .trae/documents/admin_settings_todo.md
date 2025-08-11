# Admin Settings Sayfası TODO Listesi

## 📋 Genel Bakış
Admin Settings sayfasında prompt yönetimi, API konfigürasyonu ve canlı değişiklik uygulaması için gerekli geliştirmeler.

## 🎯 Ana Hedefler

### 1. Prompt Senkronizasyonu ve Yönetimi
**Öncelik: Yüksek**

#### 1.1 Mevcut Durum Analizi
- [ ] AdminSettings.tsx'deki mevcut prompt yapısını analiz et
- [ ] Categories.tsx'deki resim oluşturma prompt yapısını incele
- [ ] API'de kullanılan prompt formatını kontrol et
- [ ] Prompt veri akışını haritalandır

#### 1.2 Prompt Senkronizasyonu
- [ ] Settings sayfasındaki promptlar ile resim oluşturma promptlarını eşleştir
- [ ] Kategori ve stil bazında prompt mapping sistemi oluştur
- [ ] Prompt değişikliklerinin tüm sisteme yansıması için merkezi prompt yönetimi
- [ ] Prompt versiyonlama sistemi (değişiklik geçmişi)

#### 1.3 Prompt Düzenleme Arayüzü
- [ ] Her kategori için prompt düzenleme modalı
- [ ] Stil bazında prompt özelleştirme
- [ ] Prompt önizleme özelliği
- [ ] Prompt validasyonu (minimum/maksimum karakter)
- [ ] Bulk prompt düzenleme özelliği

### 2. Boş Prompt Doldurma
**Öncelik: Orta**

#### 2.1 Kategori Bazında Prompt Örnekleri
- [ ] **Corporate Promptları:**
  - Professional: "professional corporate headshot, business attire, clean background, high quality, studio lighting, confident expression"
  - Business Casual: "business casual portrait, approachable professional look, modern office setting, natural lighting"
  - Executive: "executive portrait, confident pose, formal business suit, premium quality, leadership presence"
  - Formal Meeting: "formal meeting ready portrait, professional appearance, business environment, trustworthy demeanor"

- [ ] **Creative Promptları:**
  - Artistic: "artistic portrait, creative lighting, unique composition, expressive style, artistic flair, creative background"
  - Bohemian: "bohemian style portrait, free-spirited, natural lighting, artistic flair, unconventional beauty"
  - Vintage: "vintage style portrait, classic aesthetic, retro elements, timeless appeal, nostalgic atmosphere"
  - Modern Art: "modern artistic portrait, contemporary style, bold composition, avant-garde elements"

- [ ] **Avatar Promptları:**
  - Cartoon: "cartoon style avatar, friendly expression, vibrant colors, stylized features, animated character"
  - Realistic: "realistic avatar, detailed features, natural appearance, high quality, photorealistic"
  - Anime: "anime style avatar, expressive eyes, stylized features, vibrant colors, manga aesthetic"
  - Fantasy: "fantasy avatar, magical elements, creative design, imaginative style, mystical atmosphere"

- [ ] **Outfit Promptları:**
  - Casual: "casual outfit portrait, relaxed style, comfortable clothing, natural pose, everyday wear"
  - Formal: "formal outfit portrait, elegant attire, sophisticated style, polished look, dressy occasion"
  - Sporty: "sporty outfit portrait, athletic wear, active lifestyle, energetic pose, fitness oriented"
  - Trendy: "trendy outfit portrait, fashionable clothing, modern style, stylish appearance, fashion forward"

- [ ] **Background Promptları:**
  - Office: "professional office background, modern workspace, clean environment, corporate setting"
  - Studio: "studio background, professional lighting, neutral backdrop, photography studio"
  - Nature: "natural background, outdoor setting, scenic environment, landscape backdrop"
  - Abstract: "abstract background, artistic elements, creative composition, geometric patterns"

- [ ] **Skincare Promptları:**
  - Natural: "natural skincare portrait, healthy glow, fresh appearance, clean beauty, radiant skin"
  - Glowing: "glowing skin portrait, radiant complexion, healthy appearance, luminous skin"
  - Professional: "professional skincare portrait, polished look, refined appearance, flawless complexion"
  - Fresh: "fresh skincare portrait, youthful glow, vibrant appearance, dewy skin"

### 3. API Konfigürasyonu Entegrasyonu
**Öncelik: Yüksek**

#### 3.1 Gerçek API Verilerinin Entegrasyonu
- [ ] Supabase konfigürasyonunu gerçek verilerle bağla
- [ ] N8N webhook URL'lerini dinamik hale getir
- [ ] JWT secret yönetimini güvenli hale getir
- [ ] Server konfigürasyonunu environment variables ile bağla

#### 3.2 API Endpoint'leri
- [ ] `GET /api/admin/settings` - Mevcut ayarları getir
- [ ] `PUT /api/admin/settings/prompts` - Prompt ayarlarını güncelle
- [ ] `PUT /api/admin/settings/api-config` - API konfigürasyonunu güncelle
- [ ] `POST /api/admin/settings/test-connection` - API bağlantılarını test et

#### 3.3 Güvenlik ve Validasyon
- [ ] API key'lerin şifrelenmesi
- [ ] Konfigürasyon değişikliklerinin loglanması
- [ ] Admin yetkisi kontrolü
- [ ] Input validasyonu ve sanitizasyonu

### 4. Canlı Değişiklik Uygulaması
**Öncelik: Yüksek**

#### 4.1 Real-time Güncelleme
- [ ] Prompt değişikliklerinin anında uygulanması
- [ ] Cache invalidation sistemi
- [ ] WebSocket veya Server-Sent Events ile canlı güncelleme
- [ ] Değişiklik bildirim sistemi

#### 4.2 Rollback Mekanizması
- [ ] Değişiklik öncesi backup alma
- [ ] Hatalı değişiklikleri geri alma
- [ ] Değişiklik geçmişi görüntüleme
- [ ] Batch işlem desteği

### 5. Kullanıcı Arayüzü İyileştirmeleri
**Öncelik: Orta**

#### 5.1 UX İyileştirmeleri
- [ ] Drag & drop ile prompt sıralama
- [ ] Prompt kategorilerini collapse/expand
- [ ] Arama ve filtreleme özelliği
- [ ] Bulk işlemler için checkbox seçimi
- [ ] Progress indicator'lar

#### 5.2 Görsel İyileştirmeler
- [ ] Prompt düzenleme için syntax highlighting
- [ ] Karakter sayacı ve limit göstergesi
- [ ] Değişiklik durumu göstergeleri
- [ ] Loading states ve error handling
- [ ] Success/error toast mesajları

### 6. Test ve Doğrulama
**Öncelik: Orta**

#### 6.1 Fonksiyonel Testler
- [ ] Prompt CRUD işlemlerini test et
- [ ] API konfigürasyon değişikliklerini test et
- [ ] Senkronizasyon mekanizmasını test et
- [ ] Error handling senaryolarını test et

#### 6.2 Entegrasyon Testleri
- [ ] Settings'den Categories'e prompt aktarımını test et
- [ ] API değişikliklerinin sistem geneline etkisini test et
- [ ] Rollback mekanizmasını test et
- [ ] Performance testleri

## 🚀 Uygulama Sırası

### Faz 1: Temel Altyapı (1-2 gün)
1. Mevcut kod analizi ve mapping
2. API endpoint'lerinin oluşturulması
3. Temel prompt yönetim sistemi

### Faz 2: Prompt Yönetimi (2-3 gün)
1. Prompt düzenleme arayüzü
2. Boş promptları doldurma
3. Senkronizasyon mekanizması

### Faz 3: API Entegrasyonu (1-2 gün)
1. Gerçek API verilerinin bağlanması
2. Güvenlik ve validasyon
3. Test ve doğrulama

### Faz 4: Canlı Güncelleme (1-2 gün)
1. Real-time güncelleme sistemi
2. Rollback mekanizması
3. Final testler

## 📝 Notlar
- Tüm değişiklikler admin yetkisi ile sınırlandırılmalı
- Prompt değişiklikleri log'lanmalı
- Backup ve recovery mekanizması olmalı
- Performance optimizasyonu göz önünde bulundurulmalı
- Kullanıcı dostu error mesajları sağlanmalı
- **UZAK SUNUCU SORUNU**: `/api/admin/admin-settings` endpoint'i uzak sunucuda (64.226.75.76:3001) 404 hatası veriyor
  - Curl testi endpoint'in production sunucuda mevcut olmadığını doğruluyor
  - Backend'in uzak sunucuda güncellenmesi ve yeniden deploy edilmesi gerekiyor
  - Test sırasında dikkate alınmalı - sorun server tarafında, local development'ta değil

## 🔧 Teknik Detaylar
- React state management için Context API veya Zustand
- API calls için axios veya fetch
- Form validation için react-hook-form
- Real-time updates için WebSocket veya SSE
- Error handling için try-catch blokları
- Loading states için React Suspense veya custom hooks