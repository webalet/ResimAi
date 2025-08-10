# ResimAI - AI Image Processing Platform

Bu proje, AI tabanlı resim işleme platformudur. React + TypeScript + Vite frontend'i ve Express.js backend'i ile geliştirilmiştir.

## Özellikler

- 🖼️ Resim yükleme ve işleme
- 🤖 AI tabanlı resim dönüştürme (Fal.media entegrasyonu)
- 🔗 n8n workflow entegrasyonu
- 📡 Webhook test sayfası
- 🌐 Localtunnel ile dış erişim

## Kurulum

```bash
npm install
```

## 🚀 Hızlı Başlangıç

### 1. Environment Ayarlama

```bash
# Local development için
npm run env:local

# Production için
npm run env:production

# Environment yardımı
npm run env:help
```

### 2. Development Server Başlatma

```bash
# Local development (önerilen)
npm run dev:local

# Production mode development
npm run dev:prod
```

## Geliştirme

### Environment Management

Proje artık hem local hem production ortamında çalışacak şekilde yapılandırılmıştır:

- **Local Development**: `http://localhost:3001` (API) ve `http://localhost:5173` (Frontend)
- **Production**: Sunucu IP'si veya domain kullanır

### Frontend ve Backend'i Ayrı Ayrı Çalıştırma

```bash
# Local development
npm run client:dev:local  # Frontend (port 5173)
npm run server:dev:local  # Backend (port 3001)

# Production mode
npm run client:dev:prod   # Frontend (production mode)
npm run server:dev:prod   # Backend (production mode)
```

### Her İkisini Birlikte Çalıştırma

```bash
# Local development (önerilen)
npm run dev:local

# Production mode
npm run dev:prod

# Eski yöntem (hala çalışır)
npm run dev:full
```

## n8n Callback Entegrasyonu

n8n'den gelen callback isteklerini almak için backend'inizi dış dünyaya açmanız gerekir:

### 1. Localtunnel Kurulumu

```bash
npm install -g localtunnel
```

### 2. Tunnel Başlatma

```bash
lt --port 3000
```

Bu komut size şuna benzer bir URL verecektir: `https://icy-chairs-prove.loca.lt`

### 3. n8n Konfigürasyonu

n8n HTTP Request node'unuzda:
- **URL**: `https://your-tunnel-url.loca.lt/api/images/callback`
- **Method**: POST
- **Body**: JSON formatında işlenmiş resim verisi

### 4. Test Etme

Webhook test sayfasını kullanarak callback endpoint'inizi test edebilirsiniz:
`http://localhost:5173/webhook-test`

## Environment Variables

Proje aşağıdaki environment dosyalarını kullanır:

- `.env.local` - Local development ayarları
- `.env.production` - Production ayarları
- `.env.example` - Örnek environment dosyası

### Gerekli Environment Variables

```bash
# API Configuration
NODE_ENV=development|production
API_BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
FAL_API_KEY=your_fal_api_key

# n8n Integration
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

## 📦 Production Deployment

Detaylı deployment rehberi için `DEPLOYMENT.md` dosyasına bakın.

### Hızlı Production Build

```bash
# Environment ayarla
npm run env:production

# Build
npm run build:prod
npm run build:api

# Production'da çalıştır
npm run start:prod
```

## API Endpoints

- `POST /api/images/upload` - Resim yükleme
- `GET /api/images` - Tüm resimleri listele
- `POST /api/images/callback` - n8n callback endpoint'i

## Teknolojiler

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, TypeScript, Supabase
- **AI**: Fal.media API
- **Workflow**: n8n
- **Tunneling**: Localtunnel
- **Environment Management**: cross-env, dotenv

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  extends: [
    // other configs...
    // Enable lint rules for React
    reactX.configs['recommended-typescript'],
    // Enable lint rules for React DOM
    reactDom.configs.recommended,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```
