#!/bin/bash

# 🚨 ACIL FIX - Tüm Sorunları Çöz

cd /root/neuroviabot/bot

echo "🔥 1. guardHandler'ı tamamen sil..."
rm -f src/handlers/guardHandler.js
ls -la src/handlers/ | grep guard

echo ""
echo "📥 2. Git güncellemesi..."
git pull origin main

echo ""
echo "📦 3. Socket.IO client kur..."
npm install socket.io-client

echo ""
echo "🔍 4. .env kontrol..."
cat .env | grep BACKEND_URL
if ! grep -q "BACKEND_URL" .env; then
    echo "BACKEND_URL=http://localhost:5000" >> .env
    echo "✅ BACKEND_URL eklendi"
fi

echo ""
echo "🏗️  5. Frontend build..."
cd neuroviabot-frontend
npm run build
cd ..

echo ""
echo "🔄 6. Tüm PM2 servisleri restart..."
pm2 restart all

echo ""
echo "⏳ 3 saniye bekleniyor..."
sleep 3

echo ""
echo "📊 6. Bot logları (Backend bağlantısı):"
pm2 logs neuroviabot --lines 50 | grep -E "Backend|Socket|bağlanıldı" | tail -5

echo ""
echo "📊 7. Bot logları (Hatalar):"
pm2 logs neuroviabot --err --lines 20 | tail -10

echo ""
echo "✅ İşlem tamamlandı!"
echo ""
echo "🧪 TEST:"
echo "1. https://neuroviabot.xyz/manage → Leveling ayarını değiştir"
echo "2. pm2 logs neuroviabot --lines 0"
echo "3. 'settings_changed' event'ini gör"

