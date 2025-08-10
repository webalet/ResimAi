# ResimAI Sunucu Deployment Rehberi

## 1. Sunucu Hazırlığı

### Sistem Gereksinimleri
- Ubuntu 20.04+ veya CentOS 8+
- Node.js 18+ (önerilen: 22.x)
- PM2 Process Manager
- Nginx (Reverse Proxy)
- SSL Sertifikası (Let's Encrypt)
- Git

### Temel Paketlerin Kurulumu
```bash
# Ubuntu için
sudo apt update
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx

# Node.js 22.x kurulumu
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 kurulumu
sudo npm install -g pm2
```

## 2. Proje Klonlama ve Kurulum

```bash
# Proje dizinine git
cd /var/www

# Repository'yi klonla
sudo git clone https://github.com/webalet/ResimAi.git
sudo chown -R $USER:$USER ResimAi
cd ResimAi

# Dependencies kurulumu
npm install
```

## 3. Environment Variables Kurulumu

```bash
# Production environment dosyası oluştur
cp .env.example .env.production

# .env.production dosyasını düzenle
nano .env.production
```

### .env.production İçeriği:
```env
# Server Configuration
NODE_ENV=production
PORT=3001
API_BASE_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_here

# N8N Webhook Configuration
N8N_WEBHOOK_URL=your_n8n_webhook_url

# CORS Origins
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## 4. Build İşlemi

```bash
# Frontend build
npm run build

# TypeScript build (API için)
npm run build:api
```

## 5. PM2 Konfigürasyonu

### ecosystem.config.js dosyası oluştur:
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'resim-ai-api',
    script: 'api/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: '.env.production',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### PM2 ile uygulamayı başlat:
```bash
# Log dizini oluştur
mkdir -p logs

# PM2 ile başlat
pm2 start ecosystem.config.js

# PM2'yi sistem başlangıcına ekle
pm2 startup
pm2 save
```

## 6. Nginx Konfigürasyonu

```bash
# Nginx konfigürasyon dosyası oluştur
sudo nano /etc/nginx/sites-available/resim-ai
```

### Nginx Konfigürasyonu:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Static files
    location / {
        root /var/www/ResimAi/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### Nginx'i etkinleştir:
```bash
# Site'ı etkinleştir
sudo ln -s /etc/nginx/sites-available/resim-ai /etc/nginx/sites-enabled/

# Default site'ı kaldır
sudo rm /etc/nginx/sites-enabled/default

# Nginx konfigürasyonunu test et
sudo nginx -t

# Nginx'i yeniden başlat
sudo systemctl restart nginx
```

## 7. SSL Sertifikası Kurulumu

```bash
# Let's Encrypt SSL sertifikası al
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Otomatik yenileme için cron job ekle
sudo crontab -e
# Aşağıdaki satırı ekle:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 8. Firewall Konfigürasyonu

```bash
# UFW firewall'ı etkinleştir
sudo ufw enable

# Gerekli portları aç
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 80
sudo ufw allow 443

# Firewall durumunu kontrol et
sudo ufw status
```

## 9. Monitoring ve Loglar

```bash
# PM2 durumunu kontrol et
pm2 status
pm2 logs

# Nginx loglarını kontrol et
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Sistem kaynaklarını izle
pm2 monit
```

## 10. Güncelleme İşlemi

```bash
# Proje dizinine git
cd /var/www/ResimAi

# Son değişiklikleri çek
git pull origin main

# Dependencies'leri güncelle
npm install

# Build işlemi
npm run build
npm run build:api

# PM2'yi yeniden başlat
pm2 restart resim-ai-api

# Nginx'i reload et
sudo nginx -s reload
```

## 11. Backup Stratejisi

```bash
# Günlük backup scripti oluştur
sudo nano /usr/local/bin/backup-resim-ai.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/resim-ai"
PROJECT_DIR="/var/www/ResimAi"

mkdir -p $BACKUP_DIR

# Proje dosyalarını yedekle
tar -czf $BACKUP_DIR/resim-ai-$DATE.tar.gz -C /var/www ResimAi

# Eski yedekleri temizle (30 günden eski)
find $BACKUP_DIR -name "resim-ai-*.tar.gz" -mtime +30 -delete

echo "Backup completed: resim-ai-$DATE.tar.gz"
```

```bash
# Script'i çalıştırılabilir yap
sudo chmod +x /usr/local/bin/backup-resim-ai.sh

# Günlük backup için cron job ekle
sudo crontab -e
# Aşağıdaki satırı ekle:
# 0 2 * * * /usr/local/bin/backup-resim-ai.sh
```

## 12. Performans Optimizasyonu

### Node.js Optimizasyonu:
```bash
# PM2 cluster mode kullan (ecosystem.config.js'de zaten ayarlı)
# Memory limit ayarla
# Log rotation aktif et
pm2 install pm2-logrotate
```

### Nginx Optimizasyonu:
```nginx
# /etc/nginx/nginx.conf'a ekle
worker_processes auto;
worker_connections 1024;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Client body size
client_max_body_size 10M;
```

## 13. Güvenlik Önlemleri

```bash
# Fail2ban kurulumu
sudo apt install fail2ban

# SSH güvenliği
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no (key-based auth kullan)
# PermitRootLogin no

# Sistem güncellemeleri
sudo apt update && sudo apt upgrade -y

# Otomatik güvenlik güncellemeleri
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## 14. Test ve Doğrulama

```bash
# API health check
curl https://yourdomain.com/health

# Frontend erişim testi
curl -I https://yourdomain.com

# SSL sertifikası kontrolü
ssl-cert-check -c yourdomain.com

# PM2 durumu
pm2 status

# Nginx durumu
sudo systemctl status nginx
```

## Önemli Notlar:

1. **Domain Name**: `yourdomain.com` yerine gerçek domain adınızı kullanın
2. **Environment Variables**: Tüm gizli anahtarları güvenli şekilde saklayın
3. **Database**: Supabase bağlantı bilgilerini doğru şekilde ayarlayın
4. **N8N Webhook**: Webhook URL'ini doğru şekilde yapılandırın
5. **Monitoring**: Sistem kaynaklarını düzenli olarak izleyin
6. **Backup**: Düzenli yedekleme yapın
7. **Security**: Güvenlik güncellemelerini takip edin

## Sorun Giderme:

- **502 Bad Gateway**: PM2 servisinin çalıştığını kontrol edin
- **SSL Hatası**: Certbot sertifikasını yenileyin
- **API Bağlantı Hatası**: Environment variables'ları kontrol edin
- **Yüksek Memory Kullanımı**: PM2 restart yapın
- **Slow Response**: Nginx cache ayarlarını kontrol edin

Bu rehber ile ResimAI uygulamanızı production sunucusunda başarıyla çalıştırabilirsiniz.