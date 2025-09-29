# 🚀 Discord Bot Website - Production Deployment Guide

Bu rehber, Discord bot website'inizi Vercel ile canlıya alma adımlarını içerir.

## 🛠️ Ön Gereksinimler

- ✅ Node.js 18+ yüklü olması
- ✅ Git yüklü olması  
- ✅ Discord Application oluşturulmuş olması
- ✅ GitHub hesabınız olması
- ✅ Vercel hesabınız olması (ücretsiz)

## 📋 Deployment Adımları

### 1. 🔧 Vercel CLI Kurulumu

```bash
# Vercel CLI'yi global olarak yükle
npm install -g vercel

# Vercel'e giriş yap
vercel login
```

### 2. 📁 GitHub Repository Oluşturma

```bash
# Git repository başlat (website dizininde)
git init

# Dosyaları staging'e ekle
git add .

# İlk commit
git commit -m "🚀 Initial commit - Discord Bot Website"

# GitHub'da yeni repository oluştur (public veya private)
# Sonra remote ekle:
git remote add origin https://github.com/KULLANICI_ADINIZ/discord-bot-website.git

# GitHub'a push et
git branch -M main
git push -u origin main
```

### 3. 🌐 Vercel'e Deploy Etme

```bash
# Vercel'e deploy et
vercel

# Deployment sırasında sorulan sorular:
# ? Set up and deploy "C:\path\to\website"? Y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? N
# ? What's your project's name? discord-bot-website
# ? In which directory is your code located? ./
```

### 4. 🔑 Environment Variables Ayarlama

Vercel dashboard'da (https://vercel.com/dashboard) proje ayarlarına git:

**Settings → Environment Variables** sekmesinden şunları ekle:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_DISCORD_CLIENT_ID` | `YOUR_DISCORD_CLIENT_ID` | Production, Preview, Development |
| `DISCORD_CLIENT_SECRET` | `YOUR_DISCORD_CLIENT_SECRET` | Production, Preview, Development |
| `DISCORD_REDIRECT_URI` | `https://yourapp.vercel.app/auth/callback` | Production |
| `DISCORD_REDIRECT_URI` | `https://yourapp-preview.vercel.app/auth/callback` | Preview |
| `JWT_SECRET` | `your-super-strong-random-jwt-secret` | Production, Preview, Development |
| `API_BASE_URL` | `https://your-backend-api.com` | Production, Preview, Development |
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-backend-api.com` | Production, Preview, Development |

**Güçlü JWT Secret Oluşturma:**
```bash
# Node.js ile random string oluştur
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. 🔄 Yeniden Deploy Etme

Environment variables ekledikten sonra:

```bash
# Production deploy
vercel --prod
```

### 6. 🌐 Custom Domain Bağlama (Opsiyonel)

**Vercel Dashboard → Settings → Domains** sekmesinden:

1. **Domain ekle:** `yourdomain.com`
2. **DNS ayarlarını yap:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.19.61
   ```
3. **SSL sertifikası otomatik aktif olur**

### 7. 🔧 Discord Application Settings Güncelleme

**Discord Developer Portal** (https://discord.com/developers/applications) → **Your App** → **OAuth2**:

**Redirect URIs ekle/güncelle:**
```
https://yourapp.vercel.app/auth/callback
https://www.yourdomain.com/auth/callback (custom domain varsa)
```

**Valid OAuth2 redirects:**
- ✅ Development: `http://localhost:3000/auth/callback`
- ✅ Production: `https://yourapp.vercel.app/auth/callback`
- ✅ Custom Domain: `https://yourdomain.com/auth/callback`

### 8. 📄 Legal Pages Güncelleme

**Discord App Settings → General Information:**

```
Terms of Service URL: https://yourapp.vercel.app/terms
Privacy Policy URL: https://yourapp.vercel.app/privacy
```

## 🧪 Testing Checklist

### ✅ Pre-Deploy Test
- [ ] `npm run build` locally başarılı
- [ ] `npm run start` ile production build test edildi
- [ ] Environment variables doğru ayarlandı
- [ ] Discord OAuth redirect URLs güncellendi

### ✅ Post-Deploy Test
- [ ] Ana sayfa yükleniyor (`https://yourapp.vercel.app`)
- [ ] Discord giriş çalışıyor
- [ ] Sunucu listesi görüntüleniyor
- [ ] Bot davet linki çalışıyor
- [ ] Mobile responsive çalışıyor
- [ ] SEO meta tags görüntüleniyor

## 🔍 Debugging

### Vercel Logs
```bash
# Production logs
vercel logs

# Specific deployment logs  
vercel logs --url https://yourapp.vercel.app
```

### Common Issues

**1. Environment Variables Yüklenmedi:**
```bash
# Vercel env'leri kontrol et
vercel env ls
```

**2. Build Error:**
```bash
# Local build test et
npm run build

# Clean ve tekrar dene
npm run clean
npm install
npm run build
```

**3. Discord OAuth Error:**
- Discord App Settings'de redirect URI'ların doğru olduğunu kontrol et
- HTTPS kullandığından emin ol (production'da)

## 🚀 Automated Deployment

### GitHub Actions (Opsiyonel)

`.github/workflows/deploy.yml` oluştur:
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID}}
          vercel-project-id: ${{ secrets.PROJECT_ID}}
          vercel-args: '--prod'
```

## 📊 Performance & Monitoring

### Vercel Analytics
- Vercel Dashboard'da Analytics aktif et
- Core Web Vitals izle
- Traffic analytics gör

### Recommended Monitoring
- **Uptime:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry
- **Analytics:** Google Analytics, Plausible

## 🔐 Security Best Practices

### Production Checklist
- [x] HTTPS enforced (Vercel otomatik)
- [x] Secure headers added (vercel.json)
- [x] Environment variables güvenli
- [x] JWT secrets strong
- [x] CORS properly configured
- [x] No sensitive data in client-side code

### Security Headers (vercel.json'da tanımlı)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "origin-when-cross-origin" }
      ]
    }
  ]
}
```

## 📈 Scaling Considerations

### Vercel Limits (Free Tier)
- **Bandwidth:** 100GB/month
- **Serverless Functions:** 100GB-hours compute
- **Deployments:** Unlimited
- **Domains:** Unlimited

### Upgrade Triggers
- High traffic (>100GB bandwidth)
- Need advanced analytics
- Custom deployment regions
- Priority support

---

## 🆘 Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Discord Developer Portal:** https://discord.com/developers/docs

## 📞 Contact

Deployment sırasında sorun yaşarsan:
1. Vercel logs kontrol et
2. GitHub Issues aç
3. Discord sunucumuzdan destek al

---

**🎉 Başarılı deployment sonrası website'in canlıda!**

**Production URL:** `https://yourapp.vercel.app`
