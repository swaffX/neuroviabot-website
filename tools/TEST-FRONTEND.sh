#!/bin/bash

echo "🧪 FRONTEND TEST & STATUS CHECK"
echo "================================"

cd /root/neuroviabot/bot/neuroviabot-frontend

echo ""
echo "1️⃣ PM2 Durumu:"
pm2 status

echo ""
echo "2️⃣ Frontend Info:"
pm2 info neuroviabot-frontend | grep -E "status|uptime|restarts|cpu|memory"

echo ""
echo "3️⃣ Next.js Versiyonu:"
npm list next | head -3

echo ""
echo "4️⃣ Build Klasörü:"
ls -lah .next/ | head -10

echo ""
echo "5️⃣ Son 50 Log (Temiz):"
pm2 logs neuroviabot-frontend --lines 50 --nostream

echo ""
echo "6️⃣ Port Kontrolü:"
netstat -tulpn | grep 3001 || ss -tulpn | grep 3001

echo ""
echo "7️⃣ Frontend Health Check:"
sleep 3
curl -s -o /dev/null -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" http://localhost:3001/

echo ""
echo "✅ Test Tamamlandı!"
echo ""
echo "🌐 Frontend URL: http://194.105.5.37:3001"
echo "📊 Manage Panel: http://194.105.5.37:3001/manage"
echo ""
echo "🔍 Denetim Günlüğü'nü test etmek için:"
echo "   1. http://194.105.5.37:3001/manage adresine git"
echo "   2. Bir sunucu seç"
echo "   3. 'Denetim Günlüğü' sekmesine tıkla"
echo "   4. Hata olup olmadığını kontrol et"

