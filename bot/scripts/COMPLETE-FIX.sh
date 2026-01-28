#!/bin/bash
# 🔧 Complete System Fix - Tüm sorunları çöz

echo "🚀 NeuroViaBot - Komple Sistem Düzeltmesi"
echo "=========================================="

cd /root/neuroviabot/bot

echo ""
echo "1️⃣ Analytics startTime hatası düzeltiliyor..."
# analytics.js'de startTime tanımla
sed -i 's/system: {/system: {\n                startTime: Date.now(),/' src/utils/analytics.js

echo ""
echo "2️⃣ Database path kontrolü..."
# Database dosyası kontrolü
if [ -f "data/database.json" ]; then
    echo "✅ Database bulundu: data/database.json"
    echo "📊 Database boyutu: $(du -h data/database.json | cut -f1)"
else
    echo "❌ Database bulunamadı, yeni oluşturuluyor..."
    mkdir -p data
    echo '{"guilds":{},"members":{},"settings":{}}' > data/database.json
fi

echo ""
echo "3️⃣ Level komutu deprecated uyarısı düzeltiliyor..."
# ephemeral yerine flags kullan
sed -i 's/ephemeral: true/flags: [4096]/g' src/commands/level.js

echo ""
echo "4️⃣ Bot servisi restart..."
pm2 restart neuroviabot

echo ""
echo "5️⃣ Test için logları göster..."
sleep 2
pm2 logs neuroviabot --lines 15 --nostream

echo ""
echo "✅ Düzeltmeler tamamlandı!"
echo ""
echo "📝 SONRAKI ADIMLAR:"
echo "1. Discord'da /level rank komutunu test et"
echo "2. https://neuroviabot.xyz/manage sayfasında ayar değiştir"
echo "3. pm2 logs neuroviabot ile bot loglarını izle"

