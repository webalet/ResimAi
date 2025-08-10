# 🚀 ResimAI Deployment Guide

Bu rehber, ResimAI projesini hem local development hem de production ortamında çalıştırmak için gerekli adımları içerir.

## 📋 İçindekiler

- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [Environment Management](#environment-management)
- [Troubleshooting](#troubleshooting)

## 🏠 Local Development Setup

### 1. Gereksinimler

- Node.js 22.x veya üzeri
- npm veya pnpm
- Git

### 2. Projeyi Klonlama

```bash
git clone <repository-url>
cd ResimAi
npm install
```

### 3. Local Environment Ayarlama

```bash
# Local development environment'ını aktif et
npm run env:local

# Veya manuel olarak
cp .env.local .env
```

### 4. Development Server'ını Başlatma

```bash
# Hem frontend hem backend'i birlikte başlat
npm run dev:local

# Sadece frontend
npm run client:dev:local

# Sadece backend
npm run server:dev:local
```

### 5. Erişim URL'leri

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🌐 Production Deployment

### 1. Sunucu Gereksinimleri

- Ubuntu 20.04+ veya CentOS 8+
- Node.js 22.x
- PM2 (Process Manager)
- Nginx (Reverse Proxy)
- SSL Certificate (Let's Encrypt önerilir)

### 2. Sunucuda Kurulum

```bash
# Projeyi sunucuya klonla
git clone <repository-url>
cd ResimAi
npm install

# Production environment'ını ayarla
npm run env:production

# Veya manuel olarak
cp .env.production .env
```

### 3. Production Build

```bash
# Frontend build
npm run build:prod

# Backend build
npm run build:api
```

### 4. PM2 ile Servis Başlatma

```bash
# PM2 kurulumu (global)
npm install -g pm2

# Servisleri başlat
pm2 start ecosystem.config.cjs

# Servis durumunu kontrol et
pm2 status

# Logları görüntüle
pm2 logs resim-ai-api
```

### 5. Nginx Yapılandırması

`/etc/nginx/sites-available/resim-ai` dosyası:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend static files
    location / {
        root /var/www/ResimAi/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
```

```bash
# Nginx yapılandırmasını aktif et
sudo ln -s /etc/nginx/sites-available/resim-ai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ⚙️ Environment Management

### Environment Dosyaları

- `.env.local` - Local development
- `.env.production` - Production server
- `.env.example` - Template dosyası

### Environment Değiştirme

```bash
# Local environment'a geç
npm run env:local

# Production environment'a geç
npm run env:production

# Mevcut environment'ı kontrol et
npm run env:help
```

### Önemli Environment Variables

```bash
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server Configuration
NODE_ENV=development|production
PORT=3001
API_BASE_URL=http://localhost:3001|http://your-server:3001
FRONTEND_URL=http://localhost:5173|http://your-domain.com
VITE_API_URL=http://localhost:3001|http://your-server:3001

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

## 🔧 Available Scripts

### Development
```bash
npm run dev:local          # Local development (frontend + backend)
npm run client:dev:local   # Sadece frontend (local)
npm run server:dev:local   # Sadece backend (local)
```

### Production
```bash
npm run dev:prod           # Production mode development
npm run build:prod         # Production build
npm run client:dev:prod    # Frontend (production mode)
npm run server:dev:prod    # Backend (production mode)
```

### Environment
```bash
npm run env:local          # Local environment aktif et
npm run env:production     # Production environment aktif et
npm run env:help           # Environment yardımı
```

### Build & Check
```bash
npm run build              # Build (default)
npm run build:local        # Local build
npm run build:prod         # Production build
npm run check              # TypeScript check
npm run lint               # ESLint check
```

## 🐛 Troubleshooting

### Port Çakışması

```bash
# Port 3001'i kullanan process'i bul
netstat -ano | findstr :3001

# Process'i sonlandır (Windows)
taskkill /PID <PID> /F

# Process'i sonlandır (Linux/Mac)
kill -9 <PID>
```

### Environment Sorunları

```bash
# Environment dosyasını kontrol et
cat .env

# Environment variables'ları kontrol et
node -e "console.log(process.env.NODE_ENV)"

# Environment'ı yeniden ayarla
npm run env:local
```

### Database Bağlantı Sorunları

```bash
# Supabase bağlantısını test et
curl -H "apikey: YOUR_ANON_KEY" "YOUR_SUPABASE_URL/rest/v1/"
```

### PM2 Sorunları

```bash
# PM2 process'lerini kontrol et
pm2 status

# Logları kontrol et
pm2 logs resim-ai-api --lines 50

# Process'i yeniden başlat
pm2 restart resim-ai-api

# Tüm process'leri temizle
pm2 delete all
pm2 start ecosystem.config.cjs
```

### Build Sorunları

```bash
# Node modules'ları temizle
rm -rf node_modules package-lock.json
npm install

# TypeScript cache'ini temizle
npx tsc --build --clean

# Dist klasörünü temizle
rm -rf dist
```

## 📝 Notlar

1. **Local Development**: Otomatik olarak `localhost` URL'lerini kullanır
2. **Production**: Sunucu IP'si veya domain'ini kullanır
3. **Environment Switching**: Script'ler otomatik olarak `.env` dosyasını günceller
4. **Hot Reload**: Nodemon `.env*` dosyalarını izler ve değişikliklerde restart yapar
5. **CORS**: Environment'a göre otomatik olarak allowed origins ayarlanır

## 🔐 Güvenlik

- Production'da mutlaka güçlü `JWT_SECRET` kullanın
- Environment dosyalarını `.gitignore`'a ekleyin
- Supabase Service Role Key'i sadece backend'de kullanın
- HTTPS kullanın (Let's Encrypt ile ücretsiz SSL)
- Rate limiting aktif tutun

## 📞 Destek

Sorun yaşadığınızda:

1. Bu rehberdeki troubleshooting bölümünü kontrol edin
2. Logları kontrol edin (`pm2 logs` veya terminal output)
3. Environment variables'ların doğru ayarlandığından emin olun
4. Port çakışması olmadığından emin olun

---

**Happy Coding! 🚀**