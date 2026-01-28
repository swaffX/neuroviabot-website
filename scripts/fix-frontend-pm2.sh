#!/bin/bash
# ==========================================
# 🔧 Fix Frontend PM2 Configuration
# ==========================================
# This script fixes the "next: not found" error
# by properly configuring PM2 to use the local next binary

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Fixing Frontend PM2 Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Navigate to project root
cd /root/neuroviabot/bot || exit 1

# Pull latest changes (includes fixed PM2 config)
echo "📥 Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

# Navigate to frontend directory
cd neuroviabot-frontend || exit 1

# Ensure dependencies are installed
echo "📦 Installing/updating dependencies..."
npm install

# Build the application
echo "🏗️ Building frontend..."
npm run build

# Stop and delete existing PM2 process
echo "🛑 Stopping old PM2 process..."
pm2 stop neuroviabot-frontend 2>/dev/null || true
pm2 delete neuroviabot-frontend 2>/dev/null || true

# Go back to project root for ecosystem config
cd /root/neuroviabot/bot

# Start with updated ecosystem config
echo "🚀 Starting with updated config..."
pm2 start PM2-ECOSYSTEM.config.js --only neuroviabot-frontend

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Wait for startup
sleep 5

# Show status
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Frontend Fix Applied!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status neuroviabot-frontend

# Show logs
echo ""
echo "📋 Recent Logs:"
pm2 logs neuroviabot-frontend --lines 20 --nostream

# Health check
echo ""
echo "🔍 Health Check:"
if pm2 status | grep -q "neuroviabot-frontend.*online"; then
  echo "✅ Frontend is ONLINE and healthy!"
  exit 0
else
  echo "❌ Frontend is NOT running properly"
  pm2 logs neuroviabot-frontend --lines 50 --nostream
  exit 1
fi

