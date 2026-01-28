#!/bin/bash
# Rebuild Next.js Frontend for Production

echo "🔨 Rebuilding Next.js Frontend..."
cd /root/neuroviabot/bot/neuroviabot-frontend

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building production bundle..."
NODE_ENV=production npm run build

echo "✅ Frontend build complete!"
echo "🔄 Restarting PM2 process..."
pm2 restart neuroviabot-frontend

echo "✨ Done! Frontend should now be running."

