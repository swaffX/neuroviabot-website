# MongoDB Atlas Bağlantısı ve Kullanımı

## 🎯 Genel Bakış

Backend artık MongoDB Atlas ile entegre! Hem mevcut **simple-db (JSON)** hem de **MongoDB Atlas** beraber çalışıyor.

---

## 🚀 Hızlı Başlangıç

### 1. Ortam Değişkenleri Hazır

`.env` dosyasında MongoDB URI'niz zaten ekli:

```env
MONGODB_URI=mongodb+srv://irealfrex:Maviaslan2004@cluster0.lhso3di.mongodb.net/neuroviabot?retryWrites=true&w=majority
```

### 2. Backend'i Başlatın

```bash
cd neuroviabot-backend
npm start
```

Backend başladığında otomatik olarak MongoDB'ye bağlanmaya çalışacak ve database'i initialize edecek:

```
✅ [MongoDB] Successfully connected to MongoDB Atlas
📊 [MongoDB] Database: neuroviabot
🔄 [DB Init] Checking database and collections...
   ✅ Created collection: usernrcdatas
   ✅ Created collection: transactions
   ✅ Created collection: achievements
   ... (diğer koleksiyonlar)
✅ [DB Init] Database initialization complete!
   - Created: 11 collections
   - Existing: 0 collections
   - Total: 11 collections ready

🌱 [DB Init] Seeding initial achievements...
   ✅ Seeded 4 achievements
🌱 [DB Init] Seeding initial quests...
   ✅ Seeded 2 quests
✅ [DB Init] Seed data check complete

📊 [MongoDB] Database Statistics:
   - Users: 0
   - Transactions: 0
   - Achievements: 4
   - Quests: 2
   - Marketplace Listings: 0
   - Game Results: 0
   - Referrals: 0
   - Activity Feed: 0
```

---

## 📊 Bağlantı Durumunu Kontrol Etme

### API Endpoint'leri

**1. Database Status:**
```bash
GET http://localhost:5000/api/database/status
```

Response:
```json
{
  "success": true,
  "timestamp": "2024-01-20T10:30:00.000Z",
  "databases": {
    "simpleDB": {
      "active": true,
      "path": "/path/to/database.json",
      "stats": {
        "guilds": 45,
        "users": 1234,
        "activityFeed": 5678
      }
    },
    "mongodb": {
      "active": true,
      "connected": true,
      "readyState": 1,
      "host": "cluster0.lhso3di.mongodb.net",
      "name": "neuroviabot",
      "collections": 11,
      "documentStats": {
        "users": 0,
        "transactions": 0,
        "achievements": 4,
        "quests": 2,
        "marketplaceListings": 0,
        "gameResults": 0,
        "referrals": 0,
        "activityFeed": 0
      }
    }
  },
  "primaryDatabase": "MongoDB Atlas"
}
```

**2. Health Check:**
```bash
GET http://localhost:5000/api/database/health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "mongodb": {
    "connected": true,
    "healthy": true,
    "message": "Database is operational"
  },
  "simpledb": {
    "active": true,
    "healthy": true,
    "message": "OK"
  }
}
```

---

## 🔧 Database Initialization

### Otomatik Initialization

Backend her başlatıldığında **otomatik olarak**:
1. ✅ MongoDB'ye bağlanır
2. ✅ Database'in varlığını kontrol eder
3. ✅ Yoksa "neuroviabot" database'ini oluşturur
4. ✅ 11 koleksiyonu oluşturur
5. ✅ Index'leri oluşturur
6. ✅ Seed data'yı ekler (achievements, quests)
7. ✅ İstatistikleri gösterir

**Hiçbir şey yapmanıza gerek yok!** Sadece backend'i başlatın:

```bash
npm start
```

### Manuel Initialization (Opsiyonel)

Backend'i başlatmadan sadece database'i initialize etmek isterseniz:

```bash
npm run init-db
```

Bu komut:
- MongoDB'ye bağlanır
- Database ve koleksiyonları oluşturur
- Seed data'yı ekler
- Bağlantıyı kapatır

### Oluşturulan Koleksiyonlar

1. **usernrcdatas** - Kullanıcı NRC verileri
2. **transactions** - İşlem geçmişi
3. **achievements** - Başarılar
4. **userachievements** - Kullanıcı başarı ilerlemeleri
5. **quests** - Görevler
6. **userquests** - Kullanıcı görev ilerlemeleri
7. **marketplacelistings** - Marketplace ilanları
8. **gameresults** - Oyun sonuçları
9. **referrals** - Referans sistemi
10. **activityfeeds** - Aktivite feed'i
11. **investments** - Yatırımlar

### Seed Data

Backend ilk çalıştırıldığında otomatik olarak ekler:

**Achievements (4 adet):**
- First Trade (Common)
- High Roller (Rare)
- Whale Status (Legendary)
- Social Butterfly (Epic)

**Quests (2 adet):**
- Daily Worker (Daily)
- Weekly Trader (Weekly)

---

## 🔄 Veri Migration (Simple-DB → MongoDB)

Mevcut JSON verilerini MongoDB'ye migrate etmek için:

```bash
cd neuroviabot-backend
npm run migrate
```

Bu komut:
- ✅ Simple-DB'deki tüm NRC kullanıcı verilerini MongoDB'ye kopyalar
- ✅ Activity feed'i migrate eder
- ✅ İstatistikleri gösterir
- ⚠️ **Not:** Simple-DB hâlâ aktif kalır!

---

## 🏗️ Database Schema

Backend'de zaten hazır schema'lar var:

### Mongoose Models
- `UserNRCData` - Kullanıcı NRC bilgileri
- `Transaction` - İşlem geçmişi
- `Achievement` - Başarılar
- `UserAchievement` - Kullanıcı başarıları
- `Quest` - Görevler
- `UserQuest` - Kullanıcı görevleri
- `MarketplaceListing` - Marketplace ilanları
- `GameResult` - Oyun sonuçları
- `Referral` - Referanslar
- `ActivityFeed` - Aktivite feed'i
- `Investment` - Yatırımlar

Tüm modeller: `neuroviabot-backend/models/NRC.js`

---

## 🔧 Yapılandırma

### Bağlantı Seçenekleri

`neuroviabot-backend/config/database.js` dosyasında:

```javascript
await mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### Hata Yönetimi

MongoDB bağlantısı başarısız olursa:
- ⚠️ Warning gösterilir
- ✅ Simple-DB devreye girer
- 🔄 Sistem çalışmaya devam eder

---

## 🎨 Kullanım Örnekleri

### Backend Route'larında MongoDB Kullanımı

```javascript
const { UserNRCData } = require('../models/NRC');

// Kullanıcı verisi çekme
const user = await UserNRCData.findOne({ userId: '123456789' });

// Leaderboard sorgulama
const topUsers = await UserNRCData
  .find()
  .sort({ balance: -1 })
  .limit(10);

// Kullanıcı güncelleme
await UserNRCData.findOneAndUpdate(
  { userId: '123456789' },
  { $inc: { balance: 100 } },
  { upsert: true }
);
```

---

## 📦 Yüklü Paketler

✅ `mongoose@8.19.1` - MongoDB ODM
✅ Tüm gerekli bağımlılıklar yüklü

---

## 🔐 Güvenlik

- ✅ Connection string .env dosyasında
- ✅ .gitignore ile korunuyor
- ⚠️ Production'da güçlü şifre kullanın

---

## 🐛 Sorun Giderme

### MongoDB'ye bağlanamıyorum

1. **Internet bağlantısını kontrol edin**
2. **MongoDB Atlas IP whitelist'i kontrol edin:**
   - Atlas Dashboard → Network Access
   - IP'nizi ekleyin veya `0.0.0.0/0` (tüm IP'ler)

3. **Connection string'i kontrol edin:**
   ```bash
   echo $MONGODB_URI
   ```

4. **Manuel test:**
   ```bash
   mongosh "mongodb+srv://irealfrex:Maviaslan2004@cluster0.lhso3di.mongodb.net/neuroviabot"
   ```

### Simple-DB'den MongoDB'ye geçiş

```bash
# 1. Migration'ı çalıştırın
npm run migrate

# 2. Backend'i yeniden başlatın
npm start

# 3. Status'u kontrol edin
curl http://localhost:5000/api/database/status
```

---

## 🎉 Sonuç

Artık sisteminizde:
- ✅ MongoDB Atlas bağlantısı aktif
- ✅ Simple-DB yedek olarak çalışıyor
- ✅ Otomatik failover (MongoDB çökerse Simple-DB devreye girer)
- ✅ Migration hazır
- ✅ API endpoint'leri hazır

**Happy coding! 🚀**

