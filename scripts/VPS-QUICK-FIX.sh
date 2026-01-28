#!/bin/bash

# 🔧 Quick Fix - Senkronizasyon Sorununu Çöz

cd /root/neuroviabot/bot

echo "📥 1. Git pull..."
git pull origin main

echo "📦 2. Socket.IO client kur..."
npm install socket.io-client

echo "🔍 3. .env kontrol..."
if ! grep -q "BACKEND_URL" .env; then
    echo "BACKEND_URL=http://localhost:5000" >> .env
    echo "✅ BACKEND_URL eklendi"
else
    echo "✅ BACKEND_URL mevcut"
fi

echo "🔄 4. PM2 restart..."
pm2 restart neuroviabot

echo ""
echo "📊 5. Bot loglarını kontrol et:"
pm2 logs neuroviabot --lines 20 | grep -E "Backend|Socket|settings_changed"

echo ""
echo "✅ İşlem tamamlandı!"
echo ""
echo "📝 Test için:"
echo "1. https://neuroviabot.xyz/manage → Ayar değiştir"
echo "2. pm2 logs neuroviabot --lines 0"
echo "3. 'Ayarlar güncellendi' mesajını gör"

