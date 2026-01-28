# 🚀 Deployment Checklist - NeuroViaBot

## ✅ Pre-Deployment Checklist

### 1. Environment Variables
- [ ] `.env` dosyaları tüm servislerde mevcut (bot, backend, frontend)
- [ ] `SESSION_SECRET` güçlü ve unique
- [ ] `MONGODB_URI` production database'e işaret ediyor
- [ ] `DISCORD_CLIENT_SECRET` doğru
- [ ] `FRONTEND_URL` ve `BACKEND_URL` production domain'leri kullanıyor
- [ ] GitHub Secrets tüm gerekli değişkenleri içeriyor

### 2. Database
- [ ] MongoDB Atlas cluster hazır ve çalışıyor
- [ ] Database user ve şifresi oluşturuldu
- [ ] IP whitelist doğru yapılandırıldı (0.0.0.0/0 veya VPS IP)
- [ ] Indexes oluşturuldu (guildId, timestamp, userId)
- [ ] Backup stratejisi belirlendi

### 3. Discord Configuration
- [ ] Bot token aktif
- [ ] Bot gerekli intentlere sahip (Discord Developer Portal)
- [ ] OAuth2 redirect URI'leri doğru: `https://neuroviabot.xyz/api/auth/callback`
- [ ] Bot invite link doğru permissions ile oluşturuldu

### 4. VPS/Server Setup
- [ ] PM2 kurulu ve yapılandırılmış
- [ ] Caddy/Nginx reverse proxy kurulu
- [ ] SSL sertifikaları aktif (HTTPS)
- [ ] Firewall yapılandırılmış (ports: 80, 443, 22)
- [ ] Node.js versiyonu uyumlu (>=16.0.0)

### 5. GitHub Actions
- [ ] Workflow dosyaları aktif (.github/workflows/)
- [ ] Secrets yapılandırıldı (VPS_HOST, VPS_SSH_KEY, etc.)
- [ ] Deploy test edildi (manuel trigger)

### 6. Code Quality
- [ ] Frontend build başarılı (`npm run build`)
- [ ] Backend syntax hataları yok
- [ ] TypeScript type errors yok
- [ ] Console'da critical errors yok

---

## 🔥 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "feat: production ready deployment"
git push origin main
```

### Step 2: Monitor GitHub Actions
- Workflows > Actions sekmesinden deploy status kontrol et
- Her servis için ayrı workflow çalışacak:
  - ✅ deploy-bot.yml
  - ✅ deploy-backend.yml
  - ✅ deploy-frontend.yml

### Step 3: VPS'te Manuel Kontrol (opsiyonel)
```bash
ssh root@your-vps-ip

# PM2 processes kontrol
pm2 list
pm2 logs neuroviabot --lines 50
pm2 logs neuroviabot-backend --lines 50
pm2 logs neuroviabot-frontend --lines 50

# Port kontrolü
netstat -tulpn | grep LISTEN

# Health check
curl http://localhost:5000/api/health
curl http://localhost:3001
```

---

## ✨ Post-Deployment Verification

### 1. Website Check
- [ ] https://neuroviabot.xyz yükleniyor
- [ ] `/manifest.json` → 200 OK
- [ ] Navbar developer badge görünüyor (dev users için)
- [ ] Socket.IO bağlanıyor (Console'da success logs)

### 2. Authentication Flow
- [ ] Discord login butonu çalışıyor
- [ ] OAuth callback başarılı
- [ ] User dropdown görünüyor ve bilgiler doğru
- [ ] Logout çalışıyor

### 3. Dashboard
- [ ] `/servers` → Sunucular listeleniyor
- [ ] `/manage/[serverId]` → Guild management açılıyor
- [ ] Audit log yükleniyor (ilk 50 kayıt)
- [ ] Real-time audit kayıtları akıyor (bot event'inde test et)
- [ ] Socket join_guild ACK alınıyor

### 4. API Endpoints
- [ ] `GET /api/health` → 200 OK
- [ ] `GET /api/guilds` → User guilds dönüyor
- [ ] `GET /api/audit/:guildId` → Logs dönüyor
- [ ] Socket.IO `/socket.io/?EIO=4&transport=websocket` bağlanıyor

### 5. Bot Functionality
- [ ] Bot Discord'da online
- [ ] Slash komutlar çalışıyor (`/ping`, `/help`)
- [ ] Database yazma/okuma çalışıyor
- [ ] Audit log events backend'e ulaşıyor

---

## 🐛 Common Issues & Solutions

### Issue: manifest.json 404
**Solution:** 
```bash
cd neuroviabot-frontend
# Check if file exists
ls public/manifest.json
# If not, create it or pull from git
git pull origin main
npm run build
pm2 restart neuroviabot-frontend
```

### Issue: Socket.IO connection failed
**Solution:**
- Backend CORS origins kontrol et
- Frontend NEXT_PUBLIC_API_URL doğru mu?
- VPS firewall socket.io portunu engelliyor mu?

### Issue: MongoDB connection error
**Solution:**
- MONGODB_URI doğru mu?
- IP whitelist VPS IP'sini içeriyor mu?
- Database user permissions doğru mu?

### Issue: GitHub Actions failing
**Solution:**
- Secrets doğru ayarlandı mı?
- SSH key formatı doğru mu? (newline karakterler)
- VPS SSH port 22 açık mı?

---

## 📊 Monitoring

### Metrics to Watch
- PM2 uptime (should be > 99%)
- CPU usage (should be < 70%)
- Memory usage (restart thresholds: 500MB bot, 400MB backend, 300MB frontend)
- Socket connections count
- API response times
- Error rates in logs

### Log Monitoring
```bash
# Real-time monitoring
pm2 monit

# Recent errors
pm2 logs --err --lines 100

# Specific service
pm2 logs neuroviabot-backend --lines 100 --raw
```

---

## 🔄 Rollback Plan

If something goes wrong:

```bash
# SSH to VPS
ssh root@your-vps-ip

# Check git history
cd /root/neuroviabot/bot
git log --oneline -5

# Rollback to previous commit
git reset --hard <previous-commit-hash>

# Rebuild and restart
cd neuroviabot-frontend
npm install
npm run build
pm2 restart all

# Verify
pm2 logs --lines 50
```

---

## 🎯 Success Criteria

- ✅ All PM2 processes showing "online"
- ✅ No critical errors in logs
- ✅ Website loads in < 3 seconds
- ✅ Socket.IO connects successfully
- ✅ Audit logs real-time updates working
- ✅ All authentication flows working
- ✅ Bot responds to commands
- ✅ No console errors (critical ones)

---

## 📞 Support

If issues persist:
1. Check logs: `pm2 logs --lines 200`
2. Check GitHub Actions output
3. Verify all environment variables
4. Test locally first: `npm run dev`
5. Review MongoDB connection
6. Check VPS resources: `htop`, `df -h`

**Last Updated:** 2025-10-26
