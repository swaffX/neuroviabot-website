#!/bin/bash

# ==========================================
# 🚨 Frontend Acil Düzeltme
# ==========================================

echo "🚨 Frontend acil düzeltme başlatılıyor..."

# 1. Errored process'i durdur
echo "⏹️  Hatalı process durduruluyor..."
pm2 delete neuroviabot-frontend

# 2. Klasöre git
cd /root/neuroviabot/bot/neuroviabot-frontend

# 3. Dosyaları kontrol et
echo ""
echo "📁 Dosya kontrolü:"
if [ -f "package.json" ]; then
    echo "✅ package.json var"
else
    echo "❌ package.json YOK - Git pull gerekli!"
    exit 1
fi

# 4. node_modules kontrolü
echo ""
if [ -d "node_modules" ]; then
    echo "📦 node_modules var"
    
    # next executable kontrolü
    if [ -f "node_modules/.bin/next" ]; then
        echo "✅ next executable var"
    else
        echo "⚠️ next executable YOK - Reinstall gerekli"
        rm -rf node_modules
        echo "📦 npm install çalıştırılıyor..."
        npm install --legacy-peer-deps
    fi
else
    echo "❌ node_modules YOK - Install gerekli"
    echo "📦 npm install çalıştırılıyor..."
    npm install --legacy-peer-deps
fi

# 5. .next kontrolü
echo ""
if [ -d ".next" ]; then
    echo "✅ .next klasörü var"
else
    echo "⚠️ .next YOK - Build gerekli"
    echo "🔨 npm run build çalıştırılıyor..."
    npm run build
fi

# 6. Frontend'i başlat
echo ""
echo "🚀 Frontend başlatılıyor..."
pm2 start npm --name "neuroviabot-frontend" -- start -- -p 3001

# 7. Save
pm2 save

echo ""
echo "✅ İşlem tamamlandı!"
echo ""
echo "📊 PM2 Durumu:"
pm2 list

echo ""
echo "📋 Son 20 satır log:"
sleep 2
pm2 logs neuroviabot-frontend --lines 20 --nostream

