#!/bin/bash
# Frontend Build Fix Script
# Cleans corrupted node_modules and rebuilds Next.js app

set -e

echo "🔧 Starting Frontend Build Fix..."

FRONTEND_DIR="/root/neuroviabot/bot/neuroviabot-frontend"

cd "$FRONTEND_DIR"

echo "📦 Stopping PM2 process..."
pm2 stop neuroviabot-frontend || true

echo "🗑️  Cleaning corrupted node_modules..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json

echo "📥 Installing dependencies (this may take 2-3 minutes)..."
npm install

echo "🛠️  Building Next.js production bundle..."
npm run build

echo "🚀 Starting PM2 process..."
pm2 restart neuroviabot-frontend || pm2 start npm --name neuroviabot-frontend -- start -- -p 3001

echo "✅ Frontend build complete!"
echo ""
echo "📊 Check status:"
echo "   pm2 status"
echo "   pm2 logs neuroviabot-frontend --lines 30"

