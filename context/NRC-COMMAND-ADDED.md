# 🪙 /nrc Komutu Eklendi

## 🎯 Özellik

Kullanıcıların NeuroCoin bakiyelerine ve işlemlerine **hızlı erişim** için kısa ve kullanıcı dostu `/nrc` komutu eklendi.

## ✨ Komutlar

### 💰 Bakiye ve Kazanç
| Komut | Açıklama | Cooldown |
|-------|----------|----------|
| `/nrc bakiye [@kullanıcı]` | NRC bakiyeni görüntüle | - |
| `/nrc günlük` | Günlük ödül al (500-1000 NRC + streak bonus) | 24 saat |
| `/nrc çalış` | Çalışıp NRC kazan (200-500 NRC) | 4 saat |

### 💸 Transfer ve Banka
| Komut | Açıklama |
|-------|----------|
| `/nrc gönder <@kullanıcı> <miktar>` | Başka kullanıcıya NRC gönder |
| `/nrc yatır <miktar>` | Bankaya NRC yatır (güvenli sakla) |
| `/nrc çek <miktar>` | Bankadan NRC çek |

### 📊 Sıralama ve Profil
| Komut | Açıklama |
|-------|----------|
| `/nrc sıralama [tür]` | Zenginlik sıralaması (Toplam/Cüzdan/Banka) |
| `/nrc profil [@kullanıcı]` | Detaylı NRC profili ve istatistikler |

### ❓ Yardım
| Komut | Açıklama |
|-------|----------|
| `/nrc yardım` | NRC sistemi hakkında detaylı bilgi |

---

## 🎨 Öne Çıkan Özellikler

### 1. Interactive Buttons
**Bakiye görüntülerken:**
```
[🎁 Günlük] [💼 Çalış] [🏆 Sıralama]
```
Hızlı erişim butonları ile tek tıkla işlem!

### 2. Streak Sistemi
```
🔥 Daily Streak: 7 gün
💰 Streak Bonusu: +350 NRC
```
Her gün giriş yaparak bonus kazan (max 500 NRC)!

### 3. Zengin İstatistikler
- 📈 Sunucu genelinde sıralama
- 💎 Zenginlik oranı (%)
- 📜 Son 5 işlem geçmişi
- 🔥 Daily streak sayacı
- 💸 Transfer sayısı

### 4. Çalışma Sistemi
6 farklı iş türü:
- 💻 Yazılım Geliştirme
- 🛡️ Discord Moderasyonu
- 🎨 Grafik Tasarım
- 📝 İçerik Oluşturma
- 🎵 Müzik Prodüksiyonu
- 🤖 Bot Geliştirme

---

## 📊 Karşılaştırma

### Öncesi ❌
```
/economy balance
/economy daily
/economy work
/economy transfer
/economy deposit
/economy withdraw
/economy leaderboard
```
**Sorun:** Çok uzun, hatırlanması zor

### Sonrası ✅
```
/nrc bakiye
/nrc günlük
/nrc çalış
/nrc gönder
/nrc yatır
/nrc çek
/nrc sıralama
```
**Çözüm:** Kısa, Türkçe, hatırlanması kolay!

---

## 🎯 Örnek Kullanım

### Bakiye Kontrolü
```
/nrc bakiye
```
**Çıktı:**
```
💰 OguuZ00 - NeuroCoin Bakiyesi

💵 Cüzdan: 5,230 NRC
🏦 Banka: 15,600 NRC
📊 Toplam: 20,830 NRC
📈 Zenginlik Oranı: %2.45
💎 Sıralama: #12

[🎁 Günlük] [💼 Çalış] [🏆 Sıralama]
```

### Günlük Ödül (Streak ile)
```
/nrc günlük
```
**Çıktı:**
```
🎁 Günlük Ödül Alındı!

💰 Temel Ödül: 750 NRC
🔥 Streak Bonusu: 350 NRC (7 gün)
🎉 Toplam: 1,100 NRC
💵 Yeni Bakiye: 6,330 NRC

24 saat sonra tekrar gelebilirsiniz!
```

### Çalışma
```
/nrc çalış
```
**Çıktı:**
```
💻 Çalıştınız!
Yazılım Geliştirme yaptınız ve kazandınız!

💰 Kazanç: 450 NRC
💵 Yeni Bakiye: 6,780 NRC

4 saat sonra tekrar çalışabilirsiniz!
```

### Transfer
```
/nrc gönder @Arkadaş 1000
```
**Çıktı:**
```
✅ Transfer Başarılı
Arkadaş kullanıcısına NRC gönderildi!

💸 Gönderilen: 1,000 NRC
💵 Kalan Bakiye: 5,780 NRC
```

### Sıralama
```
/nrc sıralama
```
**Çıktı:**
```
🏆 NeuroCoin Sıralaması - 💰 Toplam Bakiye

🥇 Zengin Kullanıcı - 150,000 NRC
🥈 Varsıl Kullanıcı - 89,500 NRC
🥉 Paralı Kullanıcı - 45,200 NRC
4. Normal Kullanıcı - 28,900 NRC
...

📍 Sizin Sıralamanız
#12 - 20,830 NRC
```

### Profil
```
/nrc profil
```
**Çıktı:**
```
👤 OguuZ00 - NRC Profil

💰 Toplam Bakiye: 20,830 NRC
💵 Cüzdan: 5,780 NRC
🏦 Banka: 15,050 NRC
📈 Sıralama: #12
🔥 Daily Streak: 7 gün
💸 Transfer Sayısı: 5

📜 Son 5 İşlem
📥 500 NRC - daily
📤 1,000 NRC - transfer
📥 450 NRC - work
...
```

---

## 🔧 Teknik Detaylar

### Dosya
`src/commands/nrc.js` (Yeni)

### Özellikler
- ✅ Economy feature check (dual mode)
- ✅ Bot check (botlara işlem yapılamaz)
- ✅ Self-transfer check (kendine gönderme engellendi)
- ✅ Balance validation (yetersiz bakiye kontrolü)
- ✅ Cooldown system (günlük, çalışma)
- ✅ Streak tracking (günlük streak bonusu)
- ✅ Transaction recording (işlem geçmişi)
- ✅ Interactive buttons (hızlı erişim)
- ✅ Error handling (detaylı hata mesajları)
- ✅ Localization (Türkçe)

### Database Operations
- `getNeuroCoinBalance()` - Bakiye al
- `neuroCoinBalances.set()` - Bakiye güncelle
- `dailyStreaks.set()` - Streak kaydet
- `recordTransaction()` - İşlem kaydet
- `getUserTransactions()` - İşlem geçmişi
- `saveData()` - Veritabanı kaydet

---

## 🎉 Avantajlar

### Kullanıcılar İçin
✅ Kısa ve hatırlanması kolay
✅ Türkçe komutlar
✅ Interactive buttons
✅ Streak sistemi ile bonus
✅ Detaylı istatistikler
✅ Görsel embed'ler

### Geliştiriciler İçin
✅ Modüler kod yapısı
✅ Error handling
✅ Transaction logging
✅ Feature toggle desteği
✅ Kolay genişletilebilir

---

## 📋 Checklist

- [x] `/nrc bakiye` - Bakiye görüntüleme
- [x] `/nrc günlük` - Günlük ödül + streak
- [x] `/nrc çalış` - Çalışma sistemi
- [x] `/nrc gönder` - Transfer
- [x] `/nrc yatır` - Bankaya yatırma
- [x] `/nrc çek` - Bankadan çekme
- [x] `/nrc sıralama` - Leaderboard
- [x] `/nrc profil` - Profil + stats
- [x] `/nrc yardım` - Yardım menüsü
- [x] Interactive buttons
- [x] Streak sistemi
- [x] Economy feature check
- [x] Error handling
- [x] Transaction logging

---

## 🚀 Deployment

### Bot Restart Gerekli
```bash
pm2 restart neuroviabot
pm2 logs neuroviabot --lines 20
```

### Beklenen Log
```
✅ Loaded command: nrc [economy]
✅ Loaded 39 commands successfully
```

### Test
```
/nrc bakiye
/nrc günlük
/nrc çalış
/nrc sıralama
```

---

## 📝 Notlar

1. `/economy` komutu hala çalışıyor (geriye uyumluluk)
2. `/nrc` daha kısa ve kullanıcı dostu
3. Her iki komut da aynı database'i kullanıyor
4. Economy feature kapalıysa her ikisi de çalışmaz
5. Web dashboard'dan feature açılabilir

---

**Durum:** ✅ Hazır
**Dosya:** `src/commands/nrc.js`
**Komut Sayısı:** 9 subcommand
**LOC:** ~750 satır

**Son Güncelleme:** 2025-10-16

