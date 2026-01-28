# 🧪 Console Hataları Test Adımları

## 📋 Ön Hazırlık

### 1. Backend Sunucusu Restart
```bash
cd neuroviabot-backend
npm run dev
```

**Beklenen Çıktı:**
```
✅ Server running on port 3001
✅ Socket.IO initialized
✅ Database connected
```

### 2. Bot Sunucu Kontrolü
```bash
# PM2 ile kontrol
pm2 list

# Eğer çalışmıyorsa
pm2 start ecosystem.config.js
pm2 logs neuroviabot --lines 20
```

---

## 🔍 Test 1: Session & Auth Diagnostic

### Adım 1: Session Check (Public)
```bash
curl http://localhost:3001/api/diagnostic/session-check \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -v
```

**Beklenen:**
```json
{
  "success": true,
  "data": {
    "hasSession": true,
    "hasUser": true,
    "userId": "413081778031427584",
    "isAuthenticated": true
  }
}
```

### Adım 2: Full Diagnostic (Developer Only)
```bash
curl http://localhost:3001/api/diagnostic/full-diagnostic \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -v
```

**Beklenen:**
- 200 OK response
- Full session data
- Developer info

**Eğer 401 alırsanız:**
- Session cookie eksik veya geçersiz
- Login olun ve tekrar deneyin

---

## 🔍 Test 2: Developer API Endpoints

### Test 2.1: Check Developer Access
```bash
curl http://localhost:3001/api/dev/check-access \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Beklenen:**
```json
{
  "success": true,
  "hasDeveloperAccess": true,
  "userId": "413081778031427584"
}
```

### Test 2.2: Bot Stats Real-Time
```bash
curl http://localhost:3001/api/dev/bot/stats/real-time \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Beklenen:**
```json
{
  "success": true,
  "stats": {
    "guilds": 73,
    "users": 92490,
    ...
  }
}
```

### Test 2.3: System Health
```bash
curl http://localhost:3001/api/dev/system/health \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Beklenen:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    ...
  }
}
```

---

## 🔍 Test 3: Guild Roles Endpoint

### Test 3.1: Backend → Bot API (Manuel)
```bash
# Bot API'yi direkt test et
curl http://localhost:3002/api/bot/guilds/749628705873068145/roles \
  -H "Authorization: Bearer neuroviabot-secret"
```

**Beklenen:**
```json
{
  "roles": [
    {
      "id": "...",
      "name": "Admin",
      "color": 16711680,
      ...
    }
  ],
  "total": 5
}
```

**Eğer 401 alırsanız:**
- BOT_API_KEY yanlış
- Check `.env` files

**Eğer 404 alırsanız:**
- Bot guild'e erişemiyor
- Guild ID doğru mu kontrol et

**Eğer 500 alırsanız:**
- Bot logs kontrol et: `pm2 logs neuroviabot`

### Test 3.2: Backend Proxy Test
```bash
curl http://localhost:3001/api/guild-management/749628705873068145/roles \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Beklenen:**
- Aynı response (roles listesi)

---

## 🔍 Test 4: NRC Admin Endpoints

### Test 4.1: NRC Supply
```bash
curl http://localhost:3001/api/nrc/admin/supply \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Beklenen:**
```json
{
  "success": true,
  "supply": {
    "total": 1000000,
    "circulating": 50000,
    ...
  }
}
```

### Test 4.2: NRC Analytics
```bash
curl http://localhost:3001/api/nrc/admin/analytics \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

**Beklenen:**
```json
{
  "success": true,
  "analytics": {
    ...
  }
}
```

---

## 🌐 Test 5: Frontend Browser Test

### Adım 1: Login
1. `https://neuroviabot.xyz/login` adresine git
2. Discord ile giriş yap
3. Developer ID'nin `413081778031427584` olduğunu doğrula

### Adım 2: Developer Panel
1. `https://neuroviabot.xyz/dashboard/developer` adresine git
2. Console'u aç (F12)
3. Network tab'ını aç

### Adım 3: Console Kontrolü
**Beklenen:** ✅ Temiz console (hatasız)

**Eğer hata varsa:**
- `401 Unauthorized` → Session problemi
- `500 Server Error` → Backend/Bot API problemi
- `Failed to fetch` → Network/CORS problemi

### Adım 4: Network Tab İnceleme
**Developer API Calls:**
- ✅ `/api/dev/bot/stats/real-time` - 200 OK
- ✅ `/api/dev/system/health` - 200 OK
- ✅ `/api/dev/bot/commands` - 200 OK
- ✅ `/api/nrc/admin/analytics` - 200 OK
- ✅ `/api/nrc/admin/supply` - 200 OK

**Guild Management:**
- ✅ `/api/guild-management/:guildId/roles` - 200 OK

---

## 🐛 Troubleshooting

### Problem 1: 401 Unauthorized (Devam Ediyorsa)

**Çözüm A: Session Cookie**
```javascript
// Browser console'da
document.cookie
// connect.sid cookie var mı kontrol et
```

**Çözüm B: Re-login**
1. Logout yap
2. Browser cache temizle
3. Tekrar login ol

**Çözüm C: Backend Logs**
```bash
cd neuroviabot-backend
tail -f logs/app.log | grep "Dev Auth"
```

### Problem 2: Guild Roles 500 Error

**Çözüm A: Bot Sunucu**
```bash
pm2 logs neuroviabot --lines 50 | grep "guild-management"
```

**Çözüm B: Guild Access**
- Bot'un guild'e erişimi var mı?
- Bot online mı?

**Çözüm C: API Key**
```bash
# Backend .env
cat neuroviabot-backend/.env | grep BOT_API_KEY

# Root .env
cat .env | grep BOT_API_KEY

# İkisi de aynı olmalı
```

### Problem 3: Frontend Infinite Loading

**Çözüm A: CORS**
```bash
# Backend logs
tail -f logs/app.log | grep CORS
```

**Çözüm B: Socket.IO**
```javascript
// Browser console'da
io.connect()
```

---

## ✅ Başarı Kriterleri

### Backend Health Check
- [ ] Backend çalışıyor (port 3001)
- [ ] Bot sunucu çalışıyor (port 3002)
- [ ] Socket.IO bağlantısı aktif
- [ ] Database bağlantısı aktif

### Auth & Session
- [ ] Session cookie mevcut
- [ ] User authenticated
- [ ] Developer access granted
- [ ] `/api/diagnostic/session-check` 200 OK

### API Endpoints
- [ ] All `/api/dev/*` endpoints 200 OK
- [ ] All `/api/nrc/admin/*` endpoints 200 OK
- [ ] Guild roles endpoint 200 OK
- [ ] No 401/403 errors

### Frontend
- [ ] Console temiz (no errors)
- [ ] Developer panel açılıyor
- [ ] Real-time stats güncelleniyor
- [ ] Guild roles yükleniyor

---

## 📝 Test Sonuç Raporu

**Tarih:** ___________
**Tester:** ___________

### Test Sonuçları
| Test | Status | Not |
|------|--------|-----|
| Backend Restart | ⬜ Pass / ⬜ Fail | |
| Session Diagnostic | ⬜ Pass / ⬜ Fail | |
| Developer Auth | ⬜ Pass / ⬜ Fail | |
| Guild Roles | ⬜ Pass / ⬜ Fail | |
| NRC Admin | ⬜ Pass / ⬜ Fail | |
| Frontend Console | ⬜ Pass / ⬜ Fail | |

### Sorunlar
1. ___________
2. ___________
3. ___________

### Çözümler
1. ___________
2. ___________
3. ___________

---

**Son Güncelleme:** 2025-10-16 23:58

