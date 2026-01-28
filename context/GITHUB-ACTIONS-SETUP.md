# GitHub Actions Deployment Setup

## 🎯 Özet
Webhook server yerine GitHub Actions kullanarak otomatik deployment kurulumu.

## ✅ Avantajlar
- ✨ Daha güvenli (SSH key based authentication)
- 📊 Deploy history GitHub'da görünür
- 🔄 Manuel deployment yapabilme (workflow_dispatch)
- 🚀 Webhook server'a gerek yok
- 📝 Detaylı deployment logs
- 🔐 GitHub Secrets ile güvenli secret management

---

## 📋 Kurulum Adımları

### 1️⃣ VPS'de SSH Key Oluştur

VPS'de şu komutları çalıştır:

```bash
# Deployment için özel SSH key oluştur
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# Public key'i authorized_keys'e ekle
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Private key'i göster (GitHub'a ekleyeceğiz)
cat ~/.ssh/github_actions_deploy
```

**🔐 ÖNEMLİ:** Private key'i (`~/.ssh/github_actions_deploy`) kopyala, GitHub Secrets'a ekleyeceğiz.

---

### 2️⃣ GitHub Secrets Ekle

GitHub repo'na git:
👉 **https://github.com/kxrk0/neuroviabot-discord/settings/secrets/actions**

**"New repository secret"** butonuna tıklayıp şu 4 secret'ı ekle:

#### 🔑 VPS_SSH_KEY
- **Name:** `VPS_SSH_KEY`
- **Value:** Yukarıdaki private key'in tamamı (BEGIN ve END satırları dahil)
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

#### 🖥️ VPS_HOST
- **Name:** `VPS_HOST`
- **Value:** `194.105.5.37`

#### 👤 VPS_USERNAME
- **Name:** `VPS_USERNAME`
- **Value:** `root`

#### 🔌 VPS_PORT
- **Name:** `VPS_PORT`
- **Value:** `22`

---

### 3️⃣ Webhook Server'ı Devre Dışı Bırak

VPS'de şu komutları çalıştır:

```bash
# Webhook server'ı durdur ve PM2'den kaldır
pm2 delete webhook-deploy
pm2 save

# Caddy config'den webhook kısmını kaldır (opsiyonel)
# Port 80'i sadece dashboard için kullanacaksan gerekli
```

---

### 4️⃣ Test Et

GitHub Actions'ı test etmek için:

1. **Otomatik Test:** Herhangi bir değişiklik push et:
   ```bash
   git commit --allow-empty -m "Test GitHub Actions deployment"
   git push origin main
   ```

2. **Manuel Test:** GitHub'dan manuel çalıştır:
   - Git: https://github.com/kxrk0/neuroviabot-discord/actions
   - "Deploy to VPS" workflow'una tıkla
   - "Run workflow" butonuna bas

3. **Deployment Logları:** 
   - GitHub Actions sekmesinde deployment'ı izle
   - VPS'de: `pm2 logs` ile servisleri kontrol et

---

## 📊 GitHub Actions Workflow Özellikleri

### Tetikleme
- ✅ Her `main` branch'e push'ta otomatik
- ✅ Manuel deployment (workflow_dispatch)

### Deployment Adımları
1. 📥 Git pull (hard reset)
2. 📦 Bot dependencies
3. 📦 Backend dependencies
4. 🌐 Frontend build
5. 🔄 PM2 restart (tüm servisler)
6. 📊 Status kontrolü

### Süre
- ⏱️ Ortalama: 2-3 dakika
- 🚀 Webhook'tan biraz daha yavaş ama çok daha güvenli

---

## 🔍 Troubleshooting

### SSH Connection Failed
```bash
# VPS'de SSH key izinlerini kontrol et
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chmod 600 ~/.ssh/github_actions_deploy
```

### Permission Denied
```bash
# VPS kullanıcı adını kontrol et
whoami  # root olmalı
```

### Git Pull Failed
```bash
# VPS'de git durumunu kontrol et
cd /root/neuroviabot/bot
git status
git reset --hard origin/main
```

---

## 🎯 Sonraki Adımlar

1. ✅ Webhook server'ı kaldır (`webhook-deploy.js`, `pm2 delete webhook-deploy`)
2. ✅ Caddy config'den webhook route'larını kaldır (opsiyonel)
3. ✅ GitHub webhook'unu devre dışı bırak/sil
4. ✅ `.env` dosyasından `WEBHOOK_PORT` ve `SESSION_SECRET` kaldır (opsiyonel)

---

## 📝 Notlar

- GitHub Actions runner'lar GitHub'ın sunucularında çalışır (ücretsiz)
- Public repo için sınırsız, private repo için aylık limit var
- Deployment history GitHub'da saklanır (log'lar 90 gün)
- Her push'ta otomatik deploy olur, dikkatli kullan!
- Staging branch ekleyip production'dan ayırabilirsin

---

## 🚀 İleri Seviye

### Staging Environment
```yaml
on:
  push:
    branches:
      - main      # Production
      - staging   # Test
```

### Conditional Deployment
```yaml
if: contains(github.event.head_commit.message, '[deploy]')
```

### Slack/Discord Notification
```yaml
- name: Notify Discord
  uses: sarisia/actions-status-discord@v1
  if: always()
```

