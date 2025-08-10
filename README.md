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

## Geliştirme

### Frontend ve Backend'i Ayrı Ayrı Çalıştırma

```bash
# Frontend (port 5173)
npm run dev

# Backend (port 3000)
npm run dev:api
```

### Her İkisini Birlikte Çalıştırma

```bash
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
