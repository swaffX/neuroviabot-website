#!/bin/bash

# Fix Deploy Script - Frontend Build and PM2 Restart
# Bu script frontend build problemini çözer ve servisleri yeniden başlatır

set -e

echo "🚀 Fix Deploy Script Başlatılıyor..."

# Repository path
REPO_PATH="/root/neuroviabot/bot"

echo "📁 Repository: $REPO_PATH"

# Navigate to repository
cd $REPO_PATH

echo "🔄 Git pull..."
git pull origin main

echo "📦 Bot dependencies..."
npm install --omit=dev

echo "🌐 Frontend build..."
cd neuroviabot-frontend

# Clean old build
echo "🧹 Cleaning old build..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build
echo "🔨 Building frontend..."
NODE_ENV=production npm run build

# Prune dev dependencies
echo "🧹 Pruning dev dependencies..."
npm prune --production

cd ..

echo "⚙️ Backend dependencies..."
cd neuroviabot-backend
npm install --omit=dev
cd ..

echo "🔄 Restarting PM2 services..."

# Stop all services
pm2 stop all

# Start bot
pm2 start PM2-ECOSYSTEM.config.js --only neuroviabot

# Start backend
pm2 start PM2-ECOSYSTEM.config.js --only neuroviabot-backend

# Start frontend
pm2 start PM2-ECOSYSTEM.config.js --only neuroviabot-frontend

# Save PM2 configuration
pm2 save

echo "📊 PM2 Status:"
pm2 status

echo "✅ Deploy completed successfully!"
echo "🌐 Frontend: http://194.105.5.37:3001"
echo "🔧 Backend: http://194.105.5.37:5000"

