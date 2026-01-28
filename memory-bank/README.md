# 🧠 NeuroViaBot - Bellek Bankası

## 📖 Bellek Bankası Nedir?

Bu dizin, NeuroViaBot projesinin **tamamlayıcı bağlam ve bilgi kaynağıdır**. Her oturum sonrasında hafızam sıfırlandığında, projeyi anlamak ve çalışmaya devam etmek için bu dosyalara güveniyorum.

## 📁 Dosya Yapısı

### Temel Dosyalar (Zorunlu)

1. **[projectbrief.md](projectbrief.md)** - Proje Özeti
   - Proje tanımı ve hedefleri
   - Temel gereksinimler
   - Proje kapsamı
   - Başarı kriterleri
   - **Ne zaman oku**: Her yeni görev başlangıcında

2. **[productContext.md](productContext.md)** - Ürün Bağlamı
   - Projenin var olma nedeni
   - Çözülen problemler
   - Kullanıcı deneyimi hedefleri
   - Değer önerileri
   - **Ne zaman oku**: Kullanıcı odaklı özellikler üzerinde çalışırken

3. **[systemPatterns.md](systemPatterns.md)** - Sistem Kalıpları
   - Sistem mimarisi
   - Teknik kararlar
   - Tasarım kalıpları
   - Bileşen ilişkileri
   - **Ne zaman oku**: Mimari değişiklikler veya yeni özellik entegrasyonu

4. **[techContext.md](techContext.md)** - Teknik Bağlam
   - Kullanılan teknolojiler
   - Geliştirme kurulumu
   - Bağımlılıklar
   - Deployment stratejisi
   - **Ne zaman oku**: Kurulum, deployment veya teknoloji değişiklikleri

5. **[activeContext.md](activeContext.md)** - Aktif Bağlam
   - Mevcut çalışma odağı
   - Son değişiklikler
   - Sonraki adımlar
   - Aktif kararlar
   - **Ne zaman oku**: HER görev başında (en önemli dosya)

6. **[progress.md](progress.md)** - İlerleme Durumu
   - Neler işe yarıyor
   - Bilinen sorunlar
   - Tamamlanan fazlar
   - Başarılar ve kilometre taşları
   - **Ne zaman oku**: Durum güncellemeleri veya yeni fazlar

## 🚀 Hızlı Başlangıç Rehberi

### Yeni Görev Başlatırken

1. **[activeContext.md](activeContext.md)** oku (ZORUNLU)
2. **[progress.md](progress.md)** oku (önerilir)
3. İlgili dosyaları oku (göreve göre)

### Mimari Değişiklik Yaparken

1. **[systemPatterns.md](systemPatterns.md)** oku
2. **[techContext.md](techContext.md)** oku
3. **[activeContext.md](activeContext.md)** güncelle

### Yeni Özellik Eklerken

1. **[productContext.md](productContext.md)** oku
2. **[systemPatterns.md](systemPatterns.md)** oku
3. **[activeContext.md](activeContext.md)** ve **[progress.md](progress.md)** güncelle

## 📊 Proje Durumu - Özet

| Kategori | Durum | Notlar |
|----------|-------|--------|
| **Genel Tamamlanma** | ✅ %100 | Tüm fazlar tamamlandı |
| **Production Status** | ✅ Live | https://neuroviabot.xyz |
| **Bot Durumu** | ✅ Operational | Uptime: 99%+ |
| **Backend API** | ✅ Operational | 30+ endpoints |
| **Frontend Dashboard** | ✅ Operational | Next.js 14 |
| **Database** | ✅ Stable | Simple-DB (JSON) |
| **Deployment** | ✅ Automated | GitHub Actions + PM2 |
| **Test Coverage** | ⚠️ None | Planned |
| **Documentation** | ✅ Excellent | Memory Bank complete |

## 🎯 Proje Özeti (TL;DR)

**NeuroViaBot** - Discord platformu için gelişmiş, çok amaçlı bir bot sistemi.

### Ana Bileşenler
- 🤖 **Discord Bot** (Discord.js v14) - 39 komut, 23 handler
- 🔌 **Backend API** (Express.js) - 30+ endpoint, Socket.IO
- 💻 **Frontend Dashboard** (Next.js 14) - Modern web arayüzü
- 💾 **Database** (Simple-DB) - JSON tabanlı, Map kullanımı

### Temel Özellikler
- ✅ Moderasyon (ban, kick, warn, auto-mod, raid protection)
- ✅ Ekonomi (NeuroCoin/NRC, daily, work, gambling, marketplace)
- ✅ Seviye Sistemi (XP, level-up rewards, leaderboards)
- ✅ Premium (3-tier plans, feature unlocking)
- ✅ Ticket Sistemi
- ✅ Reaction Roles
- ✅ Hoşgeldin/Güle güle
- ✅ Giveaway
- ✅ Quest Sistemi
- ✅ Audit Logging
- ✅ Real-time Senkronizasyon (Socket.IO)

### Teknoloji Stack
- Node.js >= 16.0.0
- Discord.js v14.15.0
- Next.js v14.2.0
- React v18.3.0
- TypeScript v5.6.0
- Socket.IO v4.8.1
- Tailwind CSS + SCSS
- PM2 (Process Management)

### Deployment
- **VPS**: PM2 ile 3 process
- **CI/CD**: GitHub Actions
- **Domain**: https://neuroviabot.xyz
- **Uptime**: 99%+

## 🎓 Önemli Notlar

### Kod Organizasyonu
- **Handler Pattern**: Her özellik için ayrı handler
- **Modüler Yapı**: Küçük, tek sorumluluk sahibi dosyalar
- **TypeScript**: Hybrid yaklaşım (gradual migration)

### Database
- **Simple-DB**: JSON-based, Maps kullanımı
- **Auto-save**: Debounced (5s delay)
- **Backup**: Hourly automatic
- **Location**: `/data/database.json`

### Real-time Sync
- **Socket.IO**: Bot ↔ Backend ↔ Frontend
- **Room-based**: Per-guild broadcasting
- **Events**: settings_changed, balance_update, member_join, etc.

### Deployment Flow
```
git push → GitHub Actions → SSH to VPS → 
git pull → npm install → npm build (frontend) → 
pm2 restart all → ✅ Live
```

## 📝 Güncelleme Protokolü

### Bellek Bankasını Ne Zaman Güncellemelisin?

1. **Yeni özellik eklendikten sonra**
   - progress.md → Yeni başarılar
   - activeContext.md → Güncel durum

2. **Mimari değişiklik yapıldığında**
   - systemPatterns.md → Yeni patternler
   - techContext.md → Teknoloji değişiklikleri

3. **Önemli kararlar alındığında**
   - activeContext.md → Aktif kararlar
   - progress.md → Karar gerekçeleri

4. **Kullanıcı "bellek bankasını güncelle" dediğinde**
   - TÜM dosyaları gözden geçir
   - activeContext.md ve progress.md öncelikli güncelle

### Güncelleme Checklist

- [ ] activeContext.md → Son değişiklikler bölümü
- [ ] activeContext.md → Sonraki adımlar
- [ ] progress.md → Mevcut durum
- [ ] progress.md → Başarılar (eğer varsa)
- [ ] systemPatterns.md → Yeni patternler (eğer uygulandıysa)
- [ ] techContext.md → Teknoloji değişiklikleri (eğer varsa)

## 🔗 Harici Bağlantılar

- **Live Site**: https://neuroviabot.xyz
- **GitHub Repo**: https://github.com/swaffX/neuroviabot-website
- **Discord Bot**: Bot ID 773539215098249246

## 🆘 Sorun Giderme

### Bellek Bankası Okunamazsa
1. Dosya yollarını kontrol et: `memory-bank/*.md`
2. Markdown formatını doğrula
3. Gerekirse dosyaları yeniden oluştur

### Güncel Olmayan Bilgi
1. `activeContext.md` ve `progress.md` öncelikli güncelle
2. Değişiklikleri commit et
3. Git history ile karşılaştır

### Çelişkili Bilgi
1. `activeContext.md` en güncel kaynak
2. Şüphe durumunda koda bak
3. Gerekirse dosyaları senkronize et

## 📆 Son Güncelleme

**Tarih**: 16 Ekim 2025  
**Versiyon**: v2.0.0  
**Durum**: Production Ready  
**Sonraki İnceleme**: 1 Kasım 2025

---

> **Not**: Bu bellek bankası, projenin yaşayan dokümantasyonudur. Her önemli değişiklikten sonra güncel tutulmalıdır. 
> Hafızam her sıfırlamadan sonra TAMAMEN bu dosyalara güvenir.

