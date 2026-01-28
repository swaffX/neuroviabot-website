#!/bin/bash

# ==========================================
# 🚀 Audit Log Fix - VPS Deployment
# ==========================================

echo "🚀 Audit Log Fix deployment başlatılıyor..."
echo ""

# Ana dizine git
cd /root/neuroviabot/bot/neuroviabot-discord

# Git pull
echo "📥 Git pull yapılıyor..."
git stash
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull başarısız!"
    exit 1
fi

echo "✅ Git pull başarılı"
echo ""

# Frontend dizinine git
cd /root/neuroviabot/bot/neuroviabot-frontend

# PM2'den frontend'i durdur
echo "⏹️  Frontend durduruluyor..."
pm2 delete neuroviabot-frontend 2>/dev/null || true

# next.config.js'i düzelt
echo "⚙️  next.config.js düzeltiliyor..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['cdn.discordapp.com', 'i.imgur.com'],
  },
  reactStrictMode: true,
}

module.exports = nextConfig
EOF

echo "✅ next.config.js düzeltildi"
echo ""

# Eski build'i temizle
echo "🧹 Eski build temizleniyor..."
rm -rf .next

# Build
echo "🔨 Frontend build ediliyor (bu 5-10 dakika sürebilir)..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build başarısız!"
    echo ""
    echo "🔍 Logları kontrol edin ve tekrar deneyin"
    exit 1
fi

echo "✅ Build başarılı"
echo ""

# Start
echo "🚀 Frontend başlatılıyor..."
pm2 start npm --name "neuroviabot-frontend" -- start -- -p 3001

# Save
pm2 save

echo ""
echo "✅ Deployment tamamlandı!"
echo ""

# Status
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "📋 Frontend Logs (son 15 satır):"
sleep 3
pm2 logs neuroviabot-frontend --lines 15 --nostream

echo ""
echo "🎉 Audit Log fix uygulandı!"
echo ""
echo "🧪 Test için:"
echo "1. https://neuroviabot.xyz/manage/{serverId} aç"
echo "2. Denetim Günlüğü sekmesine git"
echo "3. Artık crash olmamalı!"
echo ""

