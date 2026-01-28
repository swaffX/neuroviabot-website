# 🚀 Deployment Sistemi

## Mevcut Durum

Frontend deployment **webhook sistemi** ile otomatik olarak yapılmaktadır.

### Neden GitHub Actions Kullanmıyoruz?

❌ **SSH Connection Issues**: GitHub Actions runner'ları VPS'e SSH bağlantısı kurarken `connection reset by peer` hatası alıyordu.

✅ **Webhook Çözümü Daha Stabil**: Webhook deployment sistemi daha güvenilir ve hatasız çalışıyor.

## 📡 Webhook Deployment Sistemi

### Nasıl Çalışır?

1. **GitHub'a Push** → `main` branch'e kod push edilir
2. **Webhook Tetiklenir** → GitHub otomatik webhook gönderir
3. **VPS Alır** → VPS'teki webhook server isteği alır
4. **Otomatik Deploy** → Kod çekilir, build edilir, PM2 restart olur

### Webhook Server

- **Konum**: VPS `/root/neuroviabot/bot/webhook-deploy.js`
- **Port**: 9000
- **Proxy**: Caddy reverse proxy üzerinden erişilebilir
- **PM2 Process**: `webhook-deploy`

### Deployment Adımları

```bash
# VPS'te webhook server çalışıyor
pm2 status webhook-deploy

# Webhook endpoint
POST https://neuroviabot.xyz/webhook

# GitHub webhook ayarları
Payload URL: https://neuroviabot.xyz/webhook
Content type: application/json
Secret: <SESSION_SECRET>
Events: Just the push event
```

## 🔄 Manuel Deployment

Gerekirse manuel deployment yapabilirsiniz:

```bash
# VPS'e SSH ile bağlanın
ssh root@your-vps-ip

# Repository'ye gidin
cd /root/neuroviabot/bot

# Kodu çekin
git pull origin main

# Frontend build
cd neuroviabot-frontend
npm install
npm run build

# PM2 restart
pm2 restart neuroviabot-frontend
```

## 📊 Deployment Logları

```bash
# VPS'te webhook logs
pm2 logs webhook-deploy

# Frontend logs
pm2 logs neuroviabot-frontend

# Backend logs
pm2 logs neuroviabot-backend

# Bot logs
pm2 logs neuroviabot
```

## ⚙️ GitHub Actions (Disabled)

Aşağıdaki workflow dosyaları devre dışı bırakılmıştır:

- ❌ `deploy-frontend.yml.disabled` - SSH connection issues
- ✅ `deploy-backend.yml` - Backend için aktif (opsiyonel)
- ✅ `deploy-bot.yml` - Bot için aktif (opsiyonel)

## 🛡️ Güvenlik

- Webhook secret `SESSION_SECRET` ile korunuyor
- HMAC SHA256 signature verification
- Sadece `main` branch push'ları tetikliyor
- Caddy HTTPS encryption

## 📝 Not

GitHub Actions SSH problemleri nedeniyle webhook sistemi tercih edilmiştir. Bu sistem production'da sorunsuz çalışmaktadır.

Webhook deployment hakkında daha fazla bilgi için: `webhook-deploy.js` dosyasına bakın.

