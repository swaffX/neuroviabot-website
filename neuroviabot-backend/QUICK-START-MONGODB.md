# ⚡ MongoDB Quick Start

## 🎯 Hızlı Başlangıç

```bash
cd neuroviabot-backend
npm start
```

**O kadar!** Backend başladığında:
- ✅ MongoDB Atlas'a bağlanır
- ✅ "neuroviabot" database'i otomatik oluşturulur
- ✅ 11 koleksiyon otomatik hazırlanır
- ✅ Index'ler oluşturulur
- ✅ Örnek veriler eklenir
- ✅ İstatistikler gösterilir

---

## 📊 Kontrol

### Browser'da
```
http://localhost:5000/api/database/status
```

### Terminal'de
```bash
curl http://localhost:5000/api/database/health
```

---

## 🗂️ Oluşturulan Koleksiyonlar

1. **usernrcdatas** - Kullanıcılar
2. **transactions** - İşlemler
3. **achievements** - Başarılar
4. **userachievements** - Kullanıcı başarıları
5. **quests** - Görevler
6. **userquests** - Kullanıcı görevleri
7. **marketplacelistings** - Marketplace
8. **gameresults** - Oyun sonuçları
9. **referrals** - Referanslar
10. **activityfeeds** - Aktivite
11. **investments** - Yatırımlar

---

## 🔄 Komutlar

```bash
npm start          # Backend başlat (otomatik init)
npm run init-db    # Sadece DB initialize et
npm run migrate    # Simple-DB → MongoDB migration
```

---

## 🌱 İlk Çalıştırmada Eklenen Veriler

- ✅ 4 Achievement
- ✅ 2 Quest

Sonraki çalıştırmalarda mevcut veriler korunur.

---

## 📝 Detaylı Dokümantasyon

- **DATABASE-AUTO-INIT.md** - Tam sistem açıklaması
- **MONGODB-SETUP.md** - MongoDB kurulum ve kullanım

---

## ⚡ Hızlı Test

```bash
# 1. Backend'i başlat
npm start

# 2. Başka bir terminalde status kontrol et
curl http://localhost:5000/api/database/status

# 3. MongoDB Compass ile bağlan
# mongodb+srv://irealfrex:Maviaslan2004@cluster0.lhso3di.mongodb.net/neuroviabot
```

✅ **Done!** Database hazır, kullanmaya başlayabilirsin! 🚀

