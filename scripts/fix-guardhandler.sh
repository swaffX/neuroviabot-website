#!/bin/bash

# 🔧 Fix GuardHandler - Remove Old Auto-Mod Handler

REPO_PATH="/root/neuroviabot/bot"

echo "🔍 Eski guardHandler.js dosyasını siliyorum..."
cd $REPO_PATH

# guardHandler.js'i sil (backup zaten var)
rm -f src/handlers/guardHandler.js

echo "✅ guardHandler.js silindi!"
echo ""
echo "📋 Kalan handler'lar:"
ls -lah src/handlers/

echo ""
echo "🔄 PM2'yi yeniden başlatıyorum..."
pm2 restart neuroviabot

echo ""
echo "📊 PM2 durumu:"
pm2 status

echo ""
echo "✅ İşlem tamamlandı!"
echo "📝 Hata loglarını kontrol etmek için: pm2 logs neuroviabot --err --lines 10"

