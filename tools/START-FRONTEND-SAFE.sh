#!/bin/bash

# ==========================================
# 🎨 Frontend Safe Start - NO DELETE
# ==========================================

echo "🎨 Frontend güvenli başlatma..."

cd /root/neuroviabot/bot/neuroviabot-frontend

# Dosyaların varlığını kontrol et
if [ ! -f "package.json" ]; then
    echo "❌ HATA: package.json bulunamadı!"
    echo "Frontend klasörü eksik veya yanlış dizindesiniz."
    exit 1
fi

echo "✅ Frontend dosyaları mevcut"

# PM2'de çalışan process'i kontrol et
if pm2 list | grep -q "neuroviabot-frontend"; then
    echo "⚠️ Frontend zaten çalışıyor, restart ediliyor..."
    pm2 restart neuroviabot-frontend
else
    echo "🚀 Frontend başlatılıyor..."
    
    # .next klasörü yoksa build et
    if [ ! -d ".next" ]; then
        echo "📦 .next bulunamadı, build yapılıyor..."
        npm run build
    fi
    
    # Start
    pm2 start "node_modules/.bin/next start -p 3001" --name "neuroviabot-frontend"
fi

# Save
pm2 save

echo ""
echo "✅ Frontend başlatıldı!"
echo ""
echo "📊 Durum:"
pm2 list | grep "neuroviabot-frontend"

echo ""
echo "📋 Loglar:"
pm2 logs neuroviabot-frontend --lines 10 --nostream

echo ""
echo "🔗 URL: https://neuroviabot.xyz"

