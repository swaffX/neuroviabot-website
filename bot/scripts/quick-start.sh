#!/bin/bash

# ==========================================
# 🚀 NeuroViaBot Quick Start Script
# ==========================================
# Repository klonlandıktan sonra VPS'te çalıştırın

set -e

echo "🚀 NeuroViaBot Quick Start..."

# PM2 kurulu mu kontrol et
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
else
    echo "✅ PM2 already installed"
fi

# Bot klasörüne git
cd /root/neuroviabot/bot

# Dependencies kur
echo "📦 Installing dependencies..."
npm install --production

# .env dosyası var mı kontrol et
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env file from template..."
    
    cat > .env << 'EOF'
# Discord Bot Configuration
DISCORD_TOKEN=your_token_here
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret

# Bot Settings
EMBED_COLOR=#0099ff
DEFAULT_VOLUME=50
MAX_QUEUE_SIZE=100

# Spotify (optional)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

# Economy Settings
DAILY_AMOUNT=100
WORK_AMOUNT=50
CRIME_AMOUNT=200
MAX_BET=1000
MIN_BET=10

# System
NODE_ENV=production
LOGGING_ENABLED=true
LOG_LEVEL=info
FILE_LOGGING=true
EOF
    
    echo "⚠️  Please edit .env file with your actual credentials:"
    echo "    nano .env"
    echo ""
    read -p "Press enter after editing .env file..."
fi

# PM2 ile botu başlat
echo "🤖 Starting bot with PM2..."

# Eski process'i durdur (varsa)
pm2 delete neuroviabot 2>/dev/null || true

# Yeni process başlat
pm2 start index.js --name neuroviabot \
    --max-memory-restart 500M \
    --time \
    --log-date-format "YYYY-MM-DD HH:mm:ss" \
    --merge-logs \
    --out-file logs/pm2-out.log \
    --error-file logs/pm2-error.log

# PM2'yi kaydet
pm2 save

# PM2 startup ayarla
echo "🔧 Setting up PM2 startup..."
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ Bot started successfully!"
echo ""
echo "📊 Useful commands:"
echo "  pm2 status                 # Bot durumunu göster"
echo "  pm2 logs neuroviabot       # Logları izle"
echo "  pm2 restart neuroviabot    # Botu yeniden başlat"
echo "  pm2 stop neuroviabot       # Botu durdur"
echo "  pm2 monit                  # Real-time monitoring"
echo ""
echo "🎉 Bot is now running 24/7!"
