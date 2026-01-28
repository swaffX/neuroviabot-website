# 🔧 Frontend Build Hatası Çözümü

## 🐛 Hata

```
Error: Could not find a production build in the '.next' directory.
Try building your app with 'next build' before starting the production server.
```

## 🔍 Sebep

- Frontend `next start` çalışıyor ama `.next` klasörü yok
- Production build yapılmamış
- PM2 restart edildiğinde build olmadan start oluyor

## ✅ Hızlı Çözüm

### VPS'de (SSH ile):

```bash
# 1. Frontend dizinine git
cd /root/neuroviabot/bot/neuroviabot-frontend

# 2. .next klasörünü kontrol et
ls -la .next

# 3. Build yap
npm run build

# 4. PM2 restart
pm2 restart neuroviabot-frontend

# 5. Status kontrol
pm2 status
pm2 logs neuroviabot-frontend --lines 20
```

## 🎯 Beklenen Çıktı

Build sırasında:
```
> neuroviabot-dashboard@1.0.0 build
> next build

   ▲ Next.js 14.2.33

   Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (15/15)
 ✓ Collecting build traces
 ✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         95.3 kB
├ ○ /api/auth/[...nextauth]              0 B                0 B
├ ○ /dashboard                           10.1 kB        105.2 kB
└ ○ /login                               3.8 kB         93.9 kB

...

✓ Build successful
```

Restart sonrası:
```
13|neuroviabot-frontend  |   ▲ Next.js 14.2.33
13|neuroviabot-frontend  |   - Local:        http://localhost:3001
13|neuroviabot-frontend  |
13|neuroviabot-frontend  |  ✓ Starting...
13|neuroviabot-frontend  |  ✓ Ready in 1.2s
```

## 🔄 Kalıcı Çözüm: PM2 Ecosystem Güncelleme

PM2 restart edildiğinde otomatik build yapması için:

**Dosya:** `PM2-ECOSYSTEM.config.js` veya ecosystem dosyası

```javascript
{
  name: 'neuroviabot-frontend',
  script: 'npm',
  args: 'start',
  cwd: '/root/neuroviabot/bot/neuroviabot-frontend',
  
  // EKLE:
  post_update: ['npm install', 'npm run build'],
  
  // Ya da alternatif: start_mode script
  // script: './start-frontend.sh'
}
```

**Veya start script oluştur:**

```bash
# start-frontend.sh
#!/bin/bash
cd /root/neuroviabot/bot/neuroviabot-frontend

# Check if .next exists
if [ ! -d ".next" ]; then
    echo "🏗️ .next not found, building..."
    npm run build
fi

# Start Next.js
npm start
```

## 🚫 Önleme

GitHub Actions workflow'u zaten build yapıyor:
```yaml
# .github/workflows/deploy-frontend.yml
- name: 🏗️ Build Frontend
  script: |
    cd /root/neuroviabot/bot/neuroviabot-frontend
    npm run build
```

Ama manuel restart edildiğinde build yok.

## 📋 Checklist

- [ ] VPS'ye SSH bağlan
- [ ] Frontend dizinine git
- [ ] `npm run build` çalıştır
- [ ] PM2 restart et
- [ ] Logs kontrol et
- [ ] https://neuroviabot.xyz test et

## ⚠️ Not

Bu hata sadece **manuel restart** veya **PM2 crash** sonrası oluyor.
GitHub Actions deployment'ları otomatik build yapıyor, sorun yok.

---

**Son Güncelleme:** 2025-10-16
**Durum:** Manuel build gerekiyor

