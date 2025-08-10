# BetterPic tarzı n8n workflow — Prompt, Teknik Rehber ve Abonelik Sistemi

**Amaç:** Müşteri **sadece bir görsel yükler**, sistem BetterPic gibi arka plan temizleme, retouch, farklı stiller ve çıktı seçenekleriyle *yeni* görseller üretip geri döndürür. Bu süreç **kullanıcı kayıt ve abonelik sistemi** ile entegre çalışır; site ücretsiz değildir.

> Not: API anahtarlarını doğrudan yazmayın — n8n içinde `FAL_API_KEY` veya `{{ $env.FAL_API_KEY }}` gibi environment variable kullanın.

---

## 1) Genel Akış

1. **Kullanıcı Kaydı & Giriş**

   * E-posta + şifre veya Google/Apple OAuth ile kayıt.
   * E-posta doğrulama.

2. **Abonelik Sistemi**

   * Stripe, Paddle veya iyzico ile entegre ödeme sistemi.
   * Abonelik planları: aylık/yıllık, farklı kredi limitleri (örn. 50 görsel/ay, sınırsız vb.).
   * Kullanıcı kredisi tükendiğinde yeni yükleme yapılamaz.

3. **Görsel Yükleme & İşleme**

   * Webhook ile n8n'e görsel aktarımı.
   * Doğrulama (format, boyut, NSFW).
   * CDN/S3 yükleme.
   * AI API'ye gönderme (async).

4. **Sonuçların Sunumu**

   * İşleme tamamlandığında CDN’den indirme linki.
   * Kullanıcı panelinde geçmiş işlemler.

5. **Kredi Yönetimi**

   * Her başarılı görsel üretiminde kullanıcı kredisi düşer.
   * Abonelik yenilendiğinde krediler sıfırlanır.

---

## 2) Güvenlik & Limitler

* Dosya: 1–10 MB, JPEG/PNG/WebP
* NSFW tespiti
* Rate limit & retry
* Kullanıcı başına aylık/günlük işlem sınırı

---

## 3) Prompt Şablonları

(Kullanıcı seçimlerine göre LinkedIn headshot, background replacement, creative stylized vb. — önceki bölümdeki detaylı prompt’lar kullanılabilir.)

---

## 4) n8n Entegrasyon Noktaları

* **Auth API**: Kullanıcı token doğrulama (görsel yükleme öncesi).
* **Credits API**: Kalan kredi sorgulama & güncelleme.
* **Payment Webhook**: Stripe/iyzico abonelik yenileme veya iptal takibi.
* **Image Processing Workflow**: Webhook → Doğrulama → Upload → AI Submit → Poll → Get Result → Kredi düşürme → Sonuç URL.

---

## 5) UI/UX Notları

* Üyelik girişi olmadan görsel yükleme engellenmeli.
* Plan sayfası ve abonelik yükseltme/düşürme seçenekleri.
* Kredi sayacı ve kalan kullanım hakkı gösterimi.
* İşlem geçmişi ve indirme geçmişi.

---

## 6) Hata Senaryoları

* **Abonelik yok/bitmiş:** Kullanıcıya plan satın alma ekranı.
* **Kredi yok:** Kredi satın alma opsiyonu.
* **Ödeme hatası:** Kullanıcıya hata mesajı ve destek linki.

---

Bu yapı ile hem BetterPic benzeri görsel işleme sistemini hem de kullanıcı yönetimi + abonelik modelini tek akışta çalıştırabilirsiniz.


## 1) Akış (yüksek seviyede)

1. **Webhook** — Kullanıcı web UI üzerinden fotoğrafı yükler -> sunucu/webhook bu dosyayı alır.
2. **Doğrulama (Validation)** — Dosya tipi, boyut (ör. < 10 MB), NSFW ön taraması.
3. **Geçici depolama / CDN** — Görseli Cloudinary / S3 / benzeri bir yere yükle (erişim linki alın).
4. **AI İstek (Submit request)** — Görsel URL'si ve seçilmiş prompt ile generative API'ye istek at (çoğu provider async çalışır).
5. **Bekleme + Polling** — İşlem süresince (Wait) belli aralıklarla `status` uç noktasını poll et.
6. **Sonucu Al** — İşlem tamamlandığında `GET /requests/{id}` ile çıktı URL'sini al.
7. **Depolama & Thumb** — Üretilen görseli CDN'e kaydet, küçük önizleme (thumbnail) oluştur.
8. **Kullanıcıya Dön** — Frontend'e sonuç URL'si gönder; indirme butonu, varyasyon galeri vb.

---

## 2) Önemli Konfigürasyon & Güvenlik

- **Dosya limitleri:** 1–10 MB, JPEG/PNG/WebP
- **Input validation:** mime-type kontrolü + boyut + yükleme kaynak doğrulama
- **NSFW / Yasa dışı içerik kontrolü:** Göndermeden önce basit NSFW tespiti (third-party lib veya küçük model)
- **Rate limiting & retry:** 429 için exponental backoff (max 5 deneme)
- **Logging / audit:** request\_id ve kullanıcı id eşlemesi
- **Kayıt/retention:** Orijinal + üretim görselleri en az X gün saklama

---

## 3) Prompt Şablonları (KOPYALA-YAPIŞTIR kullanılabilir)

> Her prompt bir `{{subject}}` (kullanıcının yüklediği fotoğrafa dair kısa tanım) ve opsiyonel stil değişkenleri alacak. `NEGATIVE_PROMPT` bölümünü her zaman ekleyin.

### 3.1 Headshot — Profesyonel LinkedIn / CV fotoğrafı

```
Prompt:
"Take the provided photo of {{subject}} and generate a polished, professional headshot suitable for LinkedIn: realistic photorealistic retouch, natural skin texture, remove blemishes but preserve identity, natural eye sharpness, even soft lighting (3/4 frontal), neutral blurred studio background (light grey), tight crop from chest to top of head, 50mm lens look, shallow depth of field. Keep accurate facial features and proportions. No text, no logos, high detail. Output: high-res JPEG, 2048px on longest side."

Negative prompt:
"text, watermark, oversmoothing, extra limbs, double face, lowres, artifacts"
```

### 3.2 Background Replacement — Şeffaf veya farklı arkaplan

```
Prompt:
"Replace the background behind the subject in the provided image with a clean plain background: option 'transparent' or 'studio white' or 'soft gradient (pastel)'. Preserve subject edges and hair detail, avoid haloing. Keep subject colors true-to-original, adjust contrast & color match to foreground. Output: PNG with transparent background (if requested)."

Negative prompt:
"rough edges, halo, loss of hair strands, text, watermark"
```

### 3.3 Creative Stylized — Reklam / Poster / Artistik

```
Prompt:
"Generate a stylized portrait based on the provided photo of {{subject}}: cinematic color grading, dramatic rim light, subtle grain, high contrast, warm teal-orange grade, stylized but photorealistic, maintain face identity, remove background and compose subject centered on poster canvas (vertical). Provide 3 variant styles: 'Cinematic', 'Pop-Art', 'Soft Pastel'. Output JPEG 1200x1800."

Negative prompt:
"cartoonish face distortion, oversaturated skin tones, text overlays"
```

### 3.4 Minimal avatar / profile icon (vector-like)

```
Prompt:
"Create a clean avatar from the provided photo: simplified background, clear silhouette, slight smoothing but keep identity, full-body removed — focus on head & shoulders, high legibility at 200x200 px. Provide PNG with transparent background and an SVG-like flat look."

Negative prompt:
"photographic noise, small face detail loss, watermarks"
```

---

## 4) Örnek Request Body (JSON) — async mode

```json
{
  "prompt": "<BURAYA_PROMPT_KOPYALA>",
  "image_url": "{{uploaded_image_url}}",
  "guidance_scale": 3.5,
  "num_images": 1,
  "output_format": "jpeg",
  "safety_tolerance": 2,
  "seed": null,
  "sync_mode": false
}
```

**Önerilen değerler:** `guidance_scale`: 3.0–7.0 (düşük = daha sadık, yüksek = daha yaratıcı), `safety_tolerance`: provider'a göre 0–3.

---

## 5) n8n Node Örnekleri

**A. Webhook (POST)**

- Path: `betterpic-upload`
- Accept: multipart/form-data `file`

**B. Function / Set**

- Yapılacaklar: Dosya meta verilerini ayıkla, dosya ismini oluştur (userID-timestamp.jpg)

**C. HTTP Request — Upload to Cloud (opsiyonel)**

- Tip: HTTP Request veya Cloudinary n8n node
- Çıktı: `uploaded_image_url`

**D. HTTP Request — AI Submit** (isimlendirme: `Görsel Oluşturucu`)

- Method: POST
- URL: `https://queue.fal.run/fal-ai/flux-pro/kontext`
- Headers: `Authorization: Key {{ $env.FAL_API_KEY }}`
- Body (JSON): yukarıdaki örneği kullanın
- `sync_mode`: false (async)

**E. HTTP Request — Poll Status** (isim: `Durum`)

- URL (expression): `=https://queue.fal.run/fal-ai/flux-pro/requests/{{ $json.request_id }}/status`
- Headers: Authorization same

**F. Wait Node**

- Bekleme: 3–6 saniye ilk sefer, sonra artan aralık (10s, 20s) veya sabit 5s

**G. If Node**

- Condition: `{{$json.status}} == 'COMPLETED'`
- True -> `Sonucu Al`
- False -> tekrar `Durum` (veya hata sonrası sonlandır)

**H. HTTP Request — Get Result** (`Sonucu Al`)

- URL: `https://queue.fal.run/fal-ai/flux-pro/requests/{{ $json.request_id }}`
- Alınan cevap içinde genellikle `outputs` veya `artifacts` bölümü olur; buradan `url` alıp CDN'e kopyalayın.

---

## 6) cURL Örnekleri

### 6.1 İstek Gönder (submit request)

```bash
curl -X POST "https://queue.fal.run/fal-ai/flux-pro/kontext" \
  -H "Authorization: Key FAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "<PROMPT_BURAYA>",
    "image_url": "https://your.cdn.com/uploads/abc.jpg",
    "guidance_scale": 3.5,
    "num_images": 1,
    "output_format": "jpeg",
    "sync_mode": false
  }'
```

Response (örnek): `{ "request_id": "abc-123" }`

### 6.2 Durumu Kontrol Et (poll)

```bash
curl -X GET "https://queue.fal.run/fal-ai/flux-pro/requests/abc-123/status" \
  -H "Authorization: Key FAL_API_KEY"
```

### 6.3 Sonucu Al

```bash
curl -X GET "https://queue.fal.run/fal-ai/flux-pro/requests/abc-123" \
  -H "Authorization: Key FAL_API_KEY"
```

Response içinde `outputs[0].url` veya benzeri alan olabilir — bunu okuyup kaydedin.

---

## 7) UI / UX Önerileri (frontend)

- **Basit ekran:** Büyük `Görsel Yükle` alanı + stil seçiciler (LinkedIn / Avatar / Creative) + `num_variants` seçimi
- **İşlem göstergesi:** Progress bar + yüzde yerine `İşleniyor — bu birkaç saniye sürebilir` (spinner)
- **Varyasyon Galerisi:** Kullanıcıya 3–5 varyasyon göster, beğenilene tıklayıp indir
- **Geri bildirim:** Eğer altta bir sorun olursa 'kalite düşük, lütfen daha yakın çekim kullanın' gibi yararlı uyarılar verin

---

## 8) Hata senaryoları ve çözümler

- **429 Rate limit:** 1s -> 2s -> 4s (exponential backoff) max 5 deneme
- **Invalid image:** Kullanıcıya 400 + açıklayıcı mesaj (örn. "yüklediğiniz dosya desteklenmiyor")
- **NSFW / Policy fail:** İstemciye nazik uyarı, upload iptal
- **Provider hata:** Log kaydı, kullanıcıya "geçici hata" mesajı ve yeniden deneme opsiyonu

---

## 9) İmplementasyon Check-List (kopyala-yapıştır)

-

---

## 10) Hazır Kopyalanabilir Prompt (Örnek — LinkedIn headshot)

```
Take the provided photo of the subject and generate a polished, professional headshot suitable for LinkedIn: photorealistic retouch, maintain identity and skin texture, remove blemishes, natural eye sharpness, soft even studio lighting, neutral blurred grey background, tight crop (chest to top of head), 50mm lens appearance, shallow depth of field. No text, no logos, no watermark. High detail, high resolution JPEG.

Negative prompt: text, watermark, oversmoothing, lowres, artifacts, double face.
```

---

### Son notlar

- Yukarıdaki örnekler ve JSON yapısı, Fal.ai benzeri bir *queue* / async API'ye uyarlanmıştır. Kullandığınız sağlayıcı farklıysa parametre adları (`sync_mode`, `guidance_scale`, `safety_tolerance`) değişebilir — docs'a göre uyarlayın.
- API anahtarını **asla** doğrudan kod içine gömmeyin; n8n credential veya environment variable kullanın.

---


