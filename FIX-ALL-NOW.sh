#!/bin/bash

echo "🔧 KOMPLE DÜZELTME - Bot + Frontend"
echo "===================================="

echo ""
echo "📊 Mevcut Durum:"
pm2 status

echo ""
echo "1️⃣ Bot'u kontrol et ve yeniden başlat..."
cd /root/neuroviabot/bot

# Bot çalışıyor mu?
BOT_STATUS=$(pm2 list | grep neuroviabot | grep -v backend | grep -v frontend | grep -v webhook)
echo "Bot durumu: $BOT_STATUS"

# Bot'u yeniden başlat
pm2 restart neuroviabot

echo "✅ Bot yeniden başlatıldı"

echo ""
echo "2️⃣ Frontend dizinine git..."
cd /root/neuroviabot/bot/neuroviabot-frontend

echo ""
echo "3️⃣ Git'ten son değişiklikleri çek..."
git fetch origin main
git checkout origin/main -- components/dashboard/AuditLog.tsx

echo "✅ AuditLog.tsx güncellendi"

echo ""
echo "4️⃣ Dosyayı doğrula..."
if grep -q "const fetchLogs = useCallback" components/dashboard/AuditLog.tsx; then
    echo "✅ fetchLogs useCallback kullanıyor"
else
    echo "❌ useCallback yok - Manuel düzeltme gerekiyor!"
fi

if grep -q "filter.type, filter.userId" components/dashboard/AuditLog.tsx; then
    echo "✅ Primitive dependencies var"
else
    echo "❌ Primitive dependencies yok - Manuel düzeltme gerekiyor!"
fi

echo ""
echo "5️⃣ Frontend'i durdur..."
pm2 delete neuroviabot-frontend 2>/dev/null || true

echo ""
echo "6️⃣ .next klasörünü temizle..."
rm -rf .next

echo ""
echo "7️⃣ Build yap..."
npm run build

BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
    echo "❌ BUILD BAŞARISIZ!"
    echo "Logları kontrol edin:"
    npm run build 2>&1 | tail -50
    exit 1
fi

echo "✅ Build başarılı!"

echo ""
echo "8️⃣ Frontend'i başlat..."
pm2 start npm --name "neuroviabot-frontend" -- start -- -p 3001

echo ""
echo "9️⃣ PM2 kaydet..."
pm2 save

echo ""
echo "🔟 5 saniye bekle (servisler başlasın)..."
sleep 5

echo ""
echo "✅ TAMAMLANDI!"
echo ""
pm2 status

echo ""
echo "📋 Bot Logları (son 20 satır):"
pm2 logs neuroviabot --lines 20 --nostream | tail -20

echo ""
echo "📋 Frontend Logları (son 20 satır):"
pm2 logs neuroviabot-frontend --lines 20 --nostream | tail -20

echo ""
echo "🌐 Frontend: http://194.105.5.37:3001"
echo ""
echo "🔴 ÖNEMLİ: Tarayıcıda HARD REFRESH yap!"
echo "   Chrome: Ctrl+Shift+R veya Ctrl+F5"
echo "   Firefox: Ctrl+Shift+R"
echo ""
echo "Sonra Denetim Günlüğü sayfasını aç ve kontrol et!"

