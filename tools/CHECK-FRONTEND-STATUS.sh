#!/bin/bash

# ==========================================
# 🔍 Frontend Status Check
# ==========================================

echo "🔍 Frontend durumu kontrol ediliyor..."
echo ""

# PM2 status
echo "📊 PM2 Status:"
pm2 list | grep neuroviabot-frontend

echo ""
echo "📂 Frontend klasörü:"
cd /root/neuroviabot-website/frontend
pwd

echo ""
echo "📄 next.config.js içeriği:"
cat next.config.js | head -20

echo ""
echo "📁 .next klasörü var mı?"
if [ -d ".next" ]; then
    echo "✅ .next klasörü var"
    ls -lh .next/BUILD_ID 2>/dev/null && echo "✅ BUILD_ID var" || echo "❌ BUILD_ID yok"
else
    echo "❌ .next klasörü YOK"
fi

echo ""
echo "📋 Frontend Logs (son 30 satır):"
pm2 logs neuroviabot-frontend --lines 30 --nostream

echo ""
echo "🌐 Port 3001 dinleniyor mu?"
lsof -i:3001 | head -5

echo ""
echo "✅ Kontrol tamamlandı!"

