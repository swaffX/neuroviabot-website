# 🚀 GitHub Actions Deployment System

Bu proje akıllı bir GitHub Actions deployment sistemi kullanır. Her servis için ayrı workflow'lar vardır ve sadece değişen servisler otomatik olarak deploy edilir.

## 📋 Workflow'lar

### 1. 🤖 Bot Deployment (`deploy-bot.yml`)
**Tetiklenir:** Sadece bot dosyalarında değişiklik olduğunda
- `index.js`
- `src/**` (tüm bot kaynak kodları)
- `package.json`
- `package-lock.json`

**İşlem Süresi:** ~30 saniye

**Manuel Tetikleme:**
```bash
# GitHub Actions sekmesinde "🤖 Deploy Bot Only" > "Run workflow"
```

---

### 2. ⚙️ Backend Deployment (`deploy-backend.yml`)
**Tetiklenir:** Sadece backend dosyalarında değişiklik olduğunda
- `neuroviabot-backend/**`

**İşlem Süresi:** ~30 saniye

**Manuel Tetikleme:**
```bash
# GitHub Actions sekmesinde "⚙️ Deploy Backend Only" > "Run workflow"
```

---

### 3. 🌐 Frontend Deployment (`deploy-frontend.yml`)
**Tetiklenir:** Sadece frontend dosyalarında değişiklik olduğunda
- `neuroviabot-frontend/**`

**İşlem Süresi:** ~2-3 dakika (build süresi dahil)

**Manuel Tetikleme:**
```bash
# GitHub Actions sekmesinde "🌐 Deploy Frontend Only" > "Run workflow"
```

---

### 4. 🚀 Full Deployment (`deploy.yml`)
**Tetiklenir:** 
- Manuel olarak tetiklendiğinde
- Ana workflow dosyasında değişiklik olduğunda
- Root package.json değiştiğinde

**İşlem Süresi:** ~3-4 dakika

**Manuel Tetikleme:**
```bash
# GitHub Actions sekmesinde "🚀 Deploy All Services" > "Run workflow"
```

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: Bot kodunda değişiklik yaptım
```bash
# Değişiklik: src/commands/ping.js
git add src/commands/ping.js
git commit -m "Update ping command"
git push
# ✅ Sadece Bot Workflow çalışır (~30 saniye)
```

### Senaryo 2: Frontend'de tasarım değişikliği
```bash
# Değişiklik: neuroviabot-frontend/app/page.tsx
git add neuroviabot-frontend/app/page.tsx
git commit -m "Update homepage design"
git push
# ✅ Sadece Frontend Workflow çalışır (~2-3 dakika)
```

### Senaryo 3: Backend API'sinde endpoint ekleme
```bash
# Değişiklik: neuroviabot-backend/routes/guilds.js
git add neuroviabot-backend/routes/guilds.js
git commit -m "Add new guild endpoint"
git push
# ✅ Sadece Backend Workflow çalışır (~30 saniye)
```

### Senaryo 4: Tüm servisleri birden deploy etmek istiyorum
```bash
# GitHub Actions > 🚀 Deploy All Services > Run workflow
# ✅ Tüm servisler deploy edilir (~3-4 dakika)
```

---

## 📊 Deployment İşlem Adımları

### Bot Deployment
1. ✅ VPS'e SSH bağlantısı
2. 📥 Git pull (sadece bot dosyaları)
3. 🗑️ Eski node_modules temizleme
4. 📦 npm install --production
5. 🔄 PM2 restart neuroviabot
6. ✅ Durum kontrolü ve log gösterimi

### Backend Deployment
1. ✅ VPS'e SSH bağlantısı
2. 📥 Git pull (sadece backend dosyaları)
3. 🗑️ Eski node_modules temizleme
4. 📦 npm install --production
5. 🔄 PM2 restart neuroviabot-backend
6. ✅ Durum kontrolü ve log gösterimi

### Frontend Deployment
1. ✅ VPS'e SSH bağlantısı
2. 📥 Git pull (sadece frontend dosyaları)
3. 🗑️ .next ve node_modules temizleme
4. 📦 npm install
5. 🏗️ npm run build (Next.js production build)
6. 🔄 PM2 restart neuroviabot-frontend
7. ✅ Durum kontrolü ve log gösterimi

---

## 🔧 GitHub Secrets Gereksinimleri

Workflow'ların çalışması için aşağıdaki secrets gereklidir:

```
VPS_HOST=194.105.5.37
VPS_USERNAME=root
VPS_SSH_KEY=<private SSH key>
VPS_PORT=22
```

Secrets'ı eklemek için:
1. GitHub Repository > Settings > Secrets and variables > Actions
2. "New repository secret" butonuna tıklayın
3. Her secret'ı tek tek ekleyin

---

## 📈 Avantajlar

✅ **Hız**: Sadece değişen servis deploy edilir
✅ **Verimlilik**: Gereksiz build ve restart işlemi yapılmaz
✅ **Güvenilirlik**: Her servis bağımsız deploy edilir
✅ **Esneklik**: Manuel veya otomatik tetikleme
✅ **Görünürlük**: Her deployment için detaylı log ve özet

---

## 🐛 Sorun Giderme

### SSH Bağlantı Hatası
```
Error: ssh: handshake failed: EOF
```
**Çözüm:** GitHub Secrets'ta `VPS_SSH_KEY` doğru ayarlanmış mı kontrol edin.

### Build Hatası
```
Error: npm run build failed
```
**Çözüm:** Lokal olarak `npm run build` çalıştırıp hataları kontrol edin.

### PM2 Restart Başarısız
```
Error: Process not found
```
**Çözüm:** VPS'te `pm2 list` komutuyla process isimlerini kontrol edin.

---

## 📝 Notlar

- **Paralel Deployment:** Birden fazla workflow aynı anda çalışabilir
- **Rollback:** Hata durumunda `git revert` yapıp tekrar push edebilirsiniz
- **Monitoring:** GitHub Actions sekmesinden tüm deployment geçmişini görebilirsiniz
- **Logs:** Her deployment'ın sonunda PM2 logları otomatik gösterilir

---

## 🔗 İlgili Dosyalar

- `.github/workflows/deploy-bot.yml` - Bot workflow
- `.github/workflows/deploy-backend.yml` - Backend workflow
- `.github/workflows/deploy-frontend.yml` - Frontend workflow
- `.github/workflows/deploy.yml` - Full deployment workflow

---

**Son Güncelleme:** 2025-10-12

