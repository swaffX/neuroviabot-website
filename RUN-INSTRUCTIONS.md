# 🚀 Discord Bot - Tek Komut Çalıştırma Kılavuzu

## 📋 Sistem Gereksinimleri
✅ **Tüm modüller yüklenmiş - eksik modül yok!**
- Node.js 16+ ✅
- NPM ✅
- Tüm dependencies ✅

## 🎯 TEK KOMUTLA ÇALIŞTıRMA

### **Windows Kullanıcıları İçin (ÖNERİLEN)**

#### **Seçenek 1: Batch Script (En Kolay)**
```cmd
start-all.bat
```

#### **Seçenek 2: PowerShell Script**
```powershell
.\start-all.ps1
```

#### **Seçenek 3: NPM Script**
```cmd
npm run start-all-win
```

### **Cross-Platform (Windows/Mac/Linux)**

#### **Node.js Script (Her yerde çalışır)**
```bash
npm run start-all
```
veya
```bash
node start-system.js
```

---

## 🛑 SISTEMLERI DURDURMA

### **Windows**
```cmd
stop-all.bat
```
veya
```powershell
.\stop-all.ps1
```
veya
```cmd
npm run stop-all
```

### **Cross-Platform**
- Node.js script çalışıyorsa: **Ctrl+C**

---

## 🌐 Çalıştırılan Sistemler

| Sistem | Port | URL |
|--------|------|-----|
| **Discord Bot** | - | Discord'da online |
| **Backend API** | 3001 | http://localhost:3001 |
| **Frontend Panel** | 3002 | http://localhost:3002 |
| **Socket.IO** | 3001 | ws://localhost:3001 |
| **Database** | - | SQLite (otomatik) |

---

## 📝 Çalıştırma Sırası

1. **Eski processler temizlenir**
2. **Backend + Bot başlatılır** (10 saniye beklenir)
3. **Frontend başlatılır**
4. **Tüm sistemler hazır!**

---

## 💡 İpuçları

### ✅ **Başarılı Çalıştırma İşaretleri:**
- Backend penceresinde: `✅ Bot tamamen hazır ve çalışıyor!`
- Frontend penceresinde: `webpack compiled successfully`
- Discord'da bot **online** görünüyor
- Web panele http://localhost:3002 üzerinden erişim mümkün

### ⚠️ **Sorun Giderme:**
- **Port conflict**: Diğer uygulamaları kapatın (özellikle port 3001, 3002)
- **Backend başlamıyor**: `config.json` dosyasını kontrol edin
- **Frontend açılmıyor**: Browser'da http://localhost:3002 adresine gidin
- **Bot offline**: Discord token'ı kontrol edin

### 🔧 **Manuel Kontrol:**
```bash
# Çalışan processler
netstat -ano | findstr :3001
netstat -ano | findstr :3002

# Port kontrol
lsof -i :3001  # Mac/Linux
lsof -i :3002  # Mac/Linux
```

---

## 🎮 Kullanım

### **Web Dashboard**
1. http://localhost:3002 adresine git
2. Discord ile giriş yap
3. Bot'unu yönet!

### **Discord Komutları**
- `/help` - Tüm komutları görüntüle
- `/stats` - Bot istatistikleri
- `/play <şarkı>` - Müzik çal
- `/economy daily` - Günlük ödül
- `/shop` - Mağaza

---

## 📊 Sistem Dosyaları

```
📁 Proje Kökü/
├── 🚀 start-all.bat          # Windows Batch Script
├── 🚀 start-all.ps1          # PowerShell Script  
├── 🚀 start-system.js        # Cross-platform Node.js
├── 🛑 stop-all.bat           # Windows Stop Script
├── 🛑 stop-all.ps1           # PowerShell Stop Script
├── 📋 package.json           # NPM Scripts eklendi
└── 📖 RUN-INSTRUCTIONS.md    # Bu dosya
```

---

## ⚡ Hızlı Başlangıç

```cmd
# 1. Terminal açın
# 2. Proje klasörüne gidin
cd C:\Users\zeyne\Desktop\dc

# 3. Tek komutla çalıştırın
start-all.bat

# 4. Web panele erişin
# http://localhost:3002
```

**🎉 İşte bu kadar! Tüm sistemleriniz çalışıyor!** ✅
