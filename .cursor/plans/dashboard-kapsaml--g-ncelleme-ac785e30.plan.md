<!-- ac785e30-3d0c-4592-add7-27ed18d788b2 16b889f2-843a-4049-80b1-ca27acfce056 -->
# Discord Bot Dashboard - Kapsamlı Güncelleme Planı

## Özet

Bu plan, NeuroViaBot dashboard sisteminin kapsamlı güncellemesini içerir. Öncelik sırasına göre: (1) Yeni özellikler (developer paneli + NRC coin), (2) Real-time sistemler, (3) Bug düzeltmeleri, (4) İçerik güncellemeleri, (5) Frontend iyileştirmeleri.

---

## Faz 1: Developer Paneli & Bot Yönetimi (Öncelik 1)

### 1.1 Developer Authentication Middleware

**Dosya:** `neuroviabot-backend/middleware/developerAuth.js` (yeni)

- Developer ID kontrolü middleware'i oluştur (315875588906680330 ve 413081778031427584)
- Session bazlı yetkilendirme sistemi
- Token tabanlı API authentication

### 1.2 Developer API Endpoints

**Dosya:** `neuroviabot-backend/routes/developer.js` (mevcut, genişlet)

- `/api/dev/bot/commands` - Komut listesi ve düzenleme
- `/api/dev/bot/commands/:id/toggle` - Komut aktif/pasif
- `/api/dev/bot/commands/:id/update` - Komut özellikleri güncelleme
- `/api/dev/bot/stats/real-time` - Real-time bot istatistikleri
- `/api/dev/system/health` - Sistem sağlığı
- `/api/dev/system/errors` - Hata logları ve otomatik düzeltme
- `/api/dev/database/backup` - Database yedekleme
- `/api/dev/database/restore` - Database geri yükleme
- `/api/dev/frontend/access` - Frontend erişim kontrolü

### 1.3 Developer Socket Events

**Dosya:** `neuroviabot-backend/socket/developerEvents.js` (mevcut, genişlet)

- `developer:command_update` - Komut güncellemeleri
- `developer:bot_status` - Bot durumu değişiklikleri
- `developer:error_detected` - Hata tespiti
- `developer:stats_update` - İstatistik güncellemeleri

### 1.4 Bot Commands API (Bot Tarafı)

**Dosya:** `src/routes/developer-bot-api.js` (mevcut, genişlet)

- Komut listesini API'den al
- Komut özelliklerini güncelle
- Bot'u yeniden başlat
- Cache temizleme
- Error detection ve auto-fix sistemi

### 1.5 Frontend - Developer Panel UI

**Dosya:** `neuroviabot-frontend/app/dev-panel/page.tsx` (yeni)

- Developer paneli ana sayfası
- Navbar'da profil simgesine tıklandığında görünür menü seçeneği
- Tam ekran dashboard layout
- Sidebar navigation: Bot İstatistikleri, Komut Yönetimi, Sistem Sağlığı, Hata Yönetimi, Database Yönetimi

**Alt Sayfalar:**

- `neuroviabot-frontend/app/dev-panel/commands/page.tsx` - Komut yönetimi
- `neuroviabot-frontend/app/dev-panel/stats/page.tsx` - Real-time bot istatistikleri
- `neuroviabot-frontend/app/dev-panel/health/page.tsx` - Sistem sağlığı
- `neuroviabot-frontend/app/dev-panel/errors/page.tsx` - Hata yönetimi ve auto-fix
- `neuroviabot-frontend/app/dev-panel/database/page.tsx` - Database yönetimi

### 1.6 Developer Access Control Component

**Dosya:** `neuroviabot-frontend/components/DeveloperOnly.tsx` (yeni)

- Developer ID kontrolü
- Erişim reddi ekranı
- Loading states

---

## Faz 2: NRC Coin Ekonomi Sistemi Genişletmesi (Öncelik 1)

### 2.1 NRC Coin Backend Infrastructure

**Dosya:** `src/handlers/nrcCoinHandler.js` (yeni)

- Global NRC coin ekonomisi yönetimi
- P2P trading sistemi
- Market maker algoritması
- Price volatility simulation
- Transaction history

### 2.2 NRC Coin API Endpoints

**Dosya:** `neuroviabot-backend/routes/nrc-coin.js` (yeni)

- `/api/nrc/global-stats` - Global NRC istatistikleri
- `/api/nrc/transactions` - Transaction geçmişi
- `/api/nrc/market/price` - Anlık fiyat
- `/api/nrc/market/history` - Fiyat geçmişi
- `/api/nrc/trading/create` - P2P trade oluşturma
- `/api/nrc/trading/list` - Aktif trade'ler
- `/api/nrc/trading/accept/:id` - Trade kabul etme

### 2.3 NRC Coin Developer Management

**Dosya:** `neuroviabot-backend/routes/nrc-admin.js` (yeni, developer only)

- `/api/nrc/admin/supply` - Toplam arz kontrolü
- `/api/nrc/admin/inflation` - Enflasyon ayarları
- `/api/nrc/admin/events` - Özel ekonomik eventler
- `/api/nrc/admin/freeze` - Hesap dondurma (abuse)

### 2.4 Frontend - NRC Coin Ana Sayfa

**Dosya:** `neuroviabot-frontend/app/nrc-coin/page.tsx` (yeni, bağımsız)

- Navbar'da ayrı "NRC Coin" linki
- Global NRC istatistikleri
- Price chart (real-time)
- Top holders leaderboard
- Trading marketplace
- Transaction feed

### 2.5 Frontend - NRC Coin Developer Panel

**Dosya:** `neuroviabot-frontend/app/dev-panel/nrc-management/page.tsx` (yeni)

- Supply management
- Inflation rate ayarları
- Economic events oluşturma
- Abuse detection ve önleme
- Global statistics

### 2.6 Economy Settings Integration (Manage Page)

**Dosya:** `neuroviabot-frontend/app/manage/[serverId]/page.tsx` (güncelle)

- Sol sidebar'a "Ekonomi" kategorisi ekle
- Ekonomi ayarları bileşeni oluştur

**Dosya:** `neuroviabot-frontend/components/dashboard/EconomySettings.tsx` (güncelle)

- Level atlama NRC coin kazanma (sabit, ayarlanamaz)
- Daily reward ayarları
- Shop item fiyatları
- NRC/Sunucu para birimi exchange rate (read-only)

### 2.7 NRC Coin Socket Events

**Dosya:** `neuroviabot-backend/socket.js` (güncelle)

- `nrc:price_update` - Fiyat güncellemeleri
- `nrc:trade_created` - Yeni trade
- `nrc:trade_completed` - Trade tamamlandı
- `nrc:global_stats` - Global istatistik güncellemesi

---

## Faz 3: Real-Time Sistem Güncellemeleri (Öncelik 2)

### 3.1 Denetim Günlüğü Real-Time

**Dosya:** `src/utils/auditLogger.js` (güncelle)

- Real-time audit log kayıtları
- Socket.IO entegrasyonu
- Duplicate log tespiti ve önleme
- Log kategorileri: member_join, member_leave, role_change, channel_change, message_delete, etc.

**Dosya:** `neuroviabot-frontend/components/dashboard/AuditLog.tsx` (güncelle)

- Real-time log akışı
- Filter ve search
- Auto-scroll son loglara
- Export functionality

### 3.2 Seviye Sistemi Duyuru Kanalı Real-Time

**Dosya:** `src/handlers/levelingHandler.js` (güncelle - line 130-191)

- Level up olaylarını Socket.IO ile broadcast et
- `level_up` eventi oluştur
- Duyuru kanalı ayarlarını kontrol et
- Real-time notification gönder

**Dosya:** `neuroviabot-frontend/components/dashboard/LevelingSettings.tsx` (güncelle)

- Real-time level up notifications
- Duyuru kanalı seçimi
- Test notification butonu

### 3.3 Aktivite Grafiği Real-Time

**Dosya:** `neuroviabot-backend/routes/analytics.js` (yeni)

- `/api/analytics/:guildId/activity` - Son 24 saat aktivite
- `/api/analytics/:guildId/activity/live` - Real-time aktivite

**Dosya:** `neuroviabot-frontend/components/dashboard/ServerOverview.tsx` (güncelle)

- Real-time aktivite grafiği (Chart.js veya Recharts)
- Son 24 saat mesaj aktivitesi
- Kullanıcı aktivitesi
- Komut kullanımı

### 3.4 Kanal/Rol/Üye Yönetimi Real-Time

**Dosya:** `src/handlers/realtimeSync.js` (yeni)

- Discord API'den webhook dinleme
- Yeni kanal/rol/üye eventlerini yakala
- Socket.IO ile frontend'e broadcast

**Dosya:** `neuroviabot-frontend/components/dashboard/ChannelManager.tsx` (güncelle)

- Yeni kanal eklendiğinde otomatik liste güncelleme
- Smooth fade-in animasyonu

**Dosya:** `neuroviabot-frontend/components/dashboard/RoleEditor.tsx` (güncelle)

- Yeni rol eklendiğinde otomatik liste güncelleme

**Dosya:** `neuroviabot-frontend/components/dashboard/MemberManagement.tsx` (güncelle)

- Yeni üye katıldığında otomatik liste güncelleme

### 3.5 Socket.IO Event Consolidation

**Dosya:** `neuroviabot-backend/socket.js` (güncelle)

- Tüm real-time eventleri merkezi yönet
- Event rate limiting
- Connection management

---

## Faz 4: Bug Düzeltmeleri (Öncelik 3)

### 4.1 Tepki Rolleri Tam İşlevsellik

**Dosya:** `src/handlers/reactionRoleHandler.js` (güncelle - lines 28-99, 101-171)

- `createReactionRoleMessage` fonksiyonunu kontrol et
- Emoji ekleme işlemini garanti et (lines 60-68)
- `handleReactionAdd` ve `handleReactionRemove` fonksiyonlarını test et
- Partial reaction fetch sorununu düzelt (lines 103-106, 140-143)
- Custom emoji desteği ekle (ID kontrolü)

**Test Senaryoları:**

1. Reaction role mesajı oluştur
2. Bot emoji'yi mesaja ekler mi?
3. Kullanıcı emoji'ye tıkladığında rol veriliyor mu?
4. Kullanıcı emoji'yi kaldırdığında rol kaldırılıyor mu?

### 4.2 Duplike Log Tespiti ve Önleme

**Dosya:** `src/handlers/loggingHandler.js` (güncelle)

- Event deduplication sistemi
- Son 5 saniye içinde aynı event kontrolü
- Event signature (userId + eventType + timestamp hash)
- Duplicate event filtresi

**Dosya:** `index.js` (güncelle - lines 321-365)

- Event listener'ları kontrol et
- Birden fazla listener olup olmadığını tespit et
- Event handler'ları optimize et

### 4.3 Discord #0 Username Fix

**Dosya:** `neuroviabot-frontend/components/dashboard/MemberManagement.tsx` (güncelle)

- Discriminator === '0' kontrolü
- Yeni Discord username sistemi (discriminator olmadan)
- Display format: discriminator varsa göster, yoksa sadece username

**Dosya:** `neuroviabot-frontend/app/page.tsx` (güncelle - line 541-543)

- User profil dropdown'da aynı kontrolü uygula

---

## Faz 5: Moderasyon Sistemi Detaylandırma (Öncelik 3)

### 5.1 Moderasyon Handler Genişletme

**Dosya:** `src/handlers/moderationHandler.js` (yeni veya genişlet)

- Warning sistemi
- Mute/timeout sistemi
- Ban/kick nedenleri
- Appeal sistemi
- Moderation history

### 5.2 Auto-Mod Genişletme

**Dosya:** `src/handlers/autoModHandler.js` (güncelle)

- Spam detection iyileştirme
- Link filtering
- Invite link blocker
- Caps lock filter
- Mass mention protection
- Image/attachment scanning

### 5.3 Moderasyon Dashboard Bileşeni

**Dosya:** `neuroviabot-frontend/components/dashboard/ModerationSettings.tsx` (güncelle)

- Detaylı moderasyon ayarları
- Warning threshold ayarları
- Auto-punishment rules
- Whitelisted roles/channels
- Moderation log viewer

---

## Faz 6: Bot Komutları Dashboard Senkronizasyonu (Öncelik 3)

### 6.1 Komut Kategorileme ve Filtreleme

**Dosya:** `src/utils/commandRegistry.js` (yeni)

- Tüm komutları kategorilere ayır
- Dashboard'da gösterilecek/gösterilmeyecek komutları filtrele
- Komut metadata (category, description, usage, permissions)

### 6.2 Dashboard-Bot Komut Senkronizasyonu

**Dosya:** `neuroviabot-backend/routes/bot-commands.js` (güncelle)

- Bot'tan aktif komut listesini al
- Dashboard ayarlarına göre komutları filtrele
- Komut enable/disable durumlarını senkronize et

**Dosya:** `src/routes/bot-commands-api.js` (güncelle)

- `/api/bot-commands/list` - Filtrelenmiş komut listesi
- `/api/bot-commands/:name/toggle` - Komut aktif/pasif

### 6.3 Frontend Komut Yönetimi

**Dosya:** `neuroviabot-frontend/components/dashboard/BotCommands.tsx` (güncelle)

- Kategorilere göre komut listesi
- Toggle switches (enable/disable)
- Sadece gerekli komutları göster
- Permission requirements

---

## Faz 7: İçerik Güncellemeleri (Öncelik 4)

### 7.1 Komutlar Sayfası Güncelleme

**Dosya:** `neuroviabot-frontend/app/komutlar/page.tsx` (güncelle)

- Mevcut 39 komutu listele (src/commands/ klasöründen)
- Güncel komut açıklamaları
- Kategorilere göre grupla
- Her komutun kullanımı ve örnekleri

**Komut Listesi:**
admin, automod, backup, blackjack, clear, coinflip, custom, dice, economy, features, giveaway, guard, help, inventory, invest, leaderboard, level, lottery, market-config, moderation, ping, premium, profile, quest, queue-status, quicksetup, racing, reaction-roles, role, roulette, setup, shop, slots, stats, ticket, trade, verify, welcome

### 7.2 Özellikler Sayfası Güncelleme

**Dosya:** `neuroviabot-frontend/app/ozellikler/page.tsx` (güncelle)

- Güncel özellikleri listele
- Her özellik için detaylı açıklama
- Screenshot'lar veya GIF'ler
- Kategori bazlı gruplandırma

**Özellikler:**

- Müzik Sistemi
- Moderasyon (Auto-mod, Warning, Ban/Kick)
- Ekonomi (NRC Coin, P2P Trading, Shop, Casino)
- Seviye Sistemi (XP, Level Rewards)
- Tepki Rolleri
- Otomasyon (Auto-role, Scheduled Messages)
- Güvenlik (Guard, Verification, Raid Protection)
- Yedekleme
- Ticket System
- Giveaway
- Analytics
- Premium Features

### 7.3 Geri Bildirim Sayfası Güncelleme

**Dosya:** `neuroviabot-frontend/app/geri-bildirim/page.tsx` (güncelle)

- Mock verilerini kaldır
- Real-time feedback sistemi
- Database'e feedback kaydetme

**Dosya:** `neuroviabot-backend/routes/feedback.js` (güncelle)

- `/api/feedback/submit` - Feedback gönderme
- `/api/feedback/list` - Feedback listesi (admin)
- `/api/feedback/stats` - Bu ay istatistikleri

**Dosya:** `src/handlers/feedbackHandler.js` (güncelle veya yeni)

- Feedback kategorileri: Müzik, Moderasyon, Ekonomi, Seviye, Tepki Rolleri, Otomasyon, Güvenlik, Genel
- Rating sistemi
- Comment sistemi

### 7.4 Footer Sayfaları Oluşturma

**Yeni Sayfalar:**

- `neuroviabot-frontend/app/hakkimizda/page.tsx` (güncelle/detaylandır)
- `neuroviabot-frontend/app/blog/page.tsx` (güncelle/detaylandır)
- `neuroviabot-frontend/app/kariyer/page.tsx` (güncelle/detaylandır)
- `neuroviabot-frontend/app/api-dokumantasyon/page.tsx` (güncelle/detaylandır)
- `neuroviabot-frontend/app/destek/page.tsx` (güncelle/detaylandır)

**İçerik:**

- Hakkımızda: Ekip, misyon, vizyon
- Blog: Bot güncellemeleri, özellik duyuruları
- Kariyer: Pozisyonlar, başvuru formu
- API Dokümantasyonu: Bot API endpoint'leri
- Destek: FAQ, Discord sunucu linki, iletişim

---

## Faz 8: Frontend İyileştirmeleri (Öncelik 5)

### 8.1 Ana Sayfa "Neler Yapabilirsin?" Yeniden Tasarım

**Dosya:** `neuroviabot-frontend/app/page.tsx` (güncelle - lines 1120-1475)

- Modern card layout
- Hover effects
- Güncel özellikler
- Icon'lar ve görsel tasarım
- Smooth animations

### 8.2 Ana Sayfa Buton İkonları Düzenleme

**Dosya:** `neuroviabot-frontend/app/page.tsx` (güncelle - lines 865-943)

- Komut butonu: `CommandLineIcon` ekle
- Sunucu butonu: `ServerIcon` ekle
- Kullanıcı butonu: Mevcut icon koru

### 8.3 Dil Sistemi İyileştirme

**Dosya:** `neuroviabot-frontend/app/page.tsx` (güncelle - line 454, 495)

- İngilizce flag emoji düzelt: '🇬🇧' yerine 'EN' yazısı veya doğru flag
- Tüm sayfalarda çoklu dil desteği kontrolü

**Yeni Dosya:** `neuroviabot-frontend/lib/i18n.ts` (yeni)

- Translation sistemi
- Language context
- Tüm sayfalarda kullanılacak translations

**Güncellenecek Dosyalar:**

- Her sayfa için translation ekleme
- `components/` altındaki bileşenlere translation

### 8.4 Navbar'dan "Sunucu Yönetimi" Butonu Kaldırma

**Dosya:** `neuroviabot-frontend/app/servers/page.tsx` (güncelle)

- Layout ve navigation kontrolü
- "Sunucu Yönetimi" linkini kaldır (navbar'da zaten var)

### 8.5 Frontend Güncelleme Otomasyonu

**Dosya:** `neuroviabot-frontend/lib/contentSync.ts` (yeni)

- Bot komutlarını otomatik senkronize et
- Özellik listesini otomatik güncelle
- Version tracking
- Change detection

---

## Faz 9: Backend Hata Tespiti ve Otomatik Düzeltme (Öncelik 5)

### 9.1 Error Detection Service

**Dosya:** `neuroviabot-backend/utils/errorDetector.js` (yeni veya genişlet)

- Error pattern detection
- Common error fixes
- Automatic retry logic
- Health checks

### 9.2 Auto-Fix Stratejileri

**Stratejiler:**

1. Database connection errors → Reconnect
2. Discord API rate limits → Queue management
3. Socket.IO disconnects → Auto-reconnect
4. Memory leaks → Garbage collection
5. Unhandled promise rejections → Log ve graceful handling

### 9.3 Error Dashboard

**Dosya:** `neuroviabot-frontend/app/dev-panel/errors/page.tsx` (Faz 1'de oluşturuldu, detaylandır)

- Error logs listesi
- Auto-fix history
- Manual fix options
- Error statistics

### 9.4 Monitoring Integration

**Dosya:** `neuroviabot-backend/utils/monitoring.js` (yeni)

- Error rate tracking
- Response time monitoring
- Resource usage (CPU, memory)
- Alert sistemi (Discord webhook)

---

## Faz 10: Testing & QA

### 10.1 Socket.IO Event Testing

- Tüm real-time event'leri test et
- Connection/disconnection senaryoları
- Multiple client scenarios

### 10.2 Developer Panel Access Testing

- Developer ID kontrolü
- Unauthorized access attempts
- API endpoint permissions

### 10.3 NRC Coin Trading Testing

- P2P trading flow
- Price calculation
- Transaction rollback senaryoları

### 10.4 Reaction Roles Testing

- Emoji ekleme/kaldırma
- Rol verme/kaldırma
- Multiple reaction roles aynı mesajda

### 10.5 Duplicate Log Testing

- Aynı event'in birden fazla gönderilmediğini kontrol et
- Event deduplication sistemini test et

---

## Teknoloji Stack & Bağımlılıklar

**Mevcut:**

- Backend: Express.js, Socket.IO
- Frontend: Next.js, React, Tailwind CSS, Framer Motion
- Database: Simple-DB (Map-based)
- Bot: Discord.js v14

**Eklenecek:**

- Chart.js veya Recharts (aktivite grafikleri)
- i18next (çoklu dil)
- Winston (logging)

---

## Implementation Notes

1. **Socket.IO Events:** Tüm real-time özellikler Socket.IO üzerinden yönetilecek
2. **Developer Access:** Sadece belirtilen 2 Discord ID erişebilir
3. **NRC Coin:** Tamamen bağımsız bir bölüm, navbar'da ayrı link
4. **Reaction Roles:** Tam çift yönlü (emoji ekle/kaldır = rol ver/kaldır)
5. **Footer Pages:** Tam sayfa olarak detaylı içerikle
6. **Backend Errors:** Otomatik tespit ve düzeltme sistemi
7. **No Mock Data:** Her zaman real-time ve gerçek veriler

---

## Dosya Değişiklikleri Özeti

**Yeni Dosyalar (~25):**

- Backend: 8 yeni route/middleware dosyası
- Frontend: 12 yeni sayfa/component
- Bot: 5 yeni handler/utility dosyası

**Güncellenecek Dosyalar (~30):**

- Backend: 8 dosya
- Frontend: 15 dosya
- Bot: 7 dosya

**Toplam Etkilenen Dosya:** ~55 dosya

### To-dos

- [ ] Developer authentication middleware ve access control oluştur
- [ ] Developer panel backend API endpoints oluştur
- [ ] Developer panel Socket.IO events yapılandır
- [ ] Developer panel frontend UI oluştur
- [ ] NRC coin backend infrastructure ve API endpoints oluştur
- [ ] NRC coin developer management API oluştur
- [ ] NRC coin ana sayfa ve developer paneli UI oluştur
- [ ] Manage sayfasına Ekonomi kategorisi ekle
- [ ] Denetim günlüğü real-time ve duplicate prevention
- [ ] Seviye sistemi duyuru kanalı real-time çalışması
- [ ] Aktivite grafiği real-time güncelleme
- [ ] Kanal/Rol/Üye yönetimi real-time refresh
- [ ] Tepki rolleri tam işlevsellik (emoji ekle/kaldır, rol ver/kaldır)
- [ ] Duplike log gönderimi tespiti ve önleme
- [ ] Discord #0 username sorunu düzeltme
- [ ] Moderasyon sistemini detaylandırma
- [ ] Bot komutları dashboard senkronizasyonu
- [ ] /komutlar sayfası güncelleme
- [ ] /ozellikler sayfası güncelleme
- [ ] /geri-bildirim sayfası real-time güncelleme
- [ ] Footer sayfaları detaylı içerik oluşturma
- [ ] Ana sayfa 'Neler Yapabilirsin?' yeniden tasarım
- [ ] Ana sayfa buton ikonları düzenleme
- [ ] Çoklu dil sistemi iyileştirme ve tam entegrasyon
- [ ] /servers sayfasından 'Sunucu Yönetimi' butonu kaldırma
- [ ] Frontend otomatik güncelleme sistemi
- [ ] Backend otomatik hata tespit sistemi
- [ ] Backend otomatik hata düzeltme stratejileri
- [ ] Monitoring ve alert sistemi entegrasyonu
- [ ] Tüm sistemlerin test edilmesi ve QA