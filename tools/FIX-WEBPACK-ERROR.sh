#!/bin/bash

echo "🔧 WEBPACK ERROR FIX - Node Modules Temizleme"
echo "=============================================="

cd /root/neuroviabot/bot/neuroviabot-frontend

echo ""
echo "1️⃣ PM2'yi durduruyor..."
pm2 delete neuroviabot-frontend 2>/dev/null || true

echo ""
echo "2️⃣ Tüm cache ve build dosyalarını temizliyor..."
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json
rm -rf .npm
rm -rf ~/.npm

echo ""
echo "3️⃣ Next.js'i stabil versiyona düşürüyor (14.2.13)..."
# package.json'da next versiyonunu değiştir
sed -i 's/"next": ".*"/"next": "^14.2.13"/' package.json

echo "✅ package.json güncellendi - Next.js 14.2.13"
echo ""
grep '"next":' package.json

echo ""
echo "4️⃣ Temiz kurulum yapılıyor (bu 1-2 dakika sürebilir)..."
npm install --legacy-peer-deps --force

if [ $? -ne 0 ]; then
    echo "❌ npm install başarısız!"
    echo "Node versiyonunu kontrol ediyoruz..."
    node -v
    npm -v
    exit 1
fi

echo ""
echo "5️⃣ Build başlatılıyor..."
npm run build

BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
    echo ""
    echo "❌ BUILD BAŞARISIZ!"
    echo ""
    echo "🔍 Next.js versiyonu:"
    npm list next
    echo ""
    echo "🔍 Node versiyonu:"
    node -v
    exit 1
fi

echo ""
echo "✅ BUILD BAŞARILI!"

echo ""
echo "6️⃣ Frontend başlatılıyor..."
pm2 start npm --name "neuroviabot-frontend" -- start -- -p 3001

echo ""
echo "7️⃣ PM2 kaydediliyor..."
pm2 save

echo ""
echo "✅ İŞLEM TAMAMLANDI!"
echo ""
pm2 status

echo ""
echo "📋 Frontend logları:"
pm2 logs neuroviabot-frontend --lines 20 --nostream

echo ""
echo "🎉 Frontend hazır: http://194.105.5.37:3001"

