#!/bin/bash

# ==========================================
# 🚀 Manual Deploy Script for VPS
# ==========================================
# Usage: ./scripts/manual-deploy.sh [bot|frontend|all]
# ==========================================

set -e

DEPLOY_TYPE="${1:-all}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting Manual Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Deploy Type: $DEPLOY_TYPE"
echo ""

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main
echo "✅ Code updated"
echo ""

# Deploy Bot
if [ "$DEPLOY_TYPE" = "bot" ] || [ "$DEPLOY_TYPE" = "all" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🤖 Deploying Discord Bot"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    echo "📦 Installing bot dependencies..."
    npm install --production
    
    echo "🔄 Restarting bot service..."
    pm2 restart neuroviabot --update-env
    sleep 3
    
    echo "💾 Saving PM2 configuration..."
    pm2 save
    
    echo "✅ Bot deployed successfully!"
    echo ""
fi

# Deploy Frontend
if [ "$DEPLOY_TYPE" = "frontend" ] || [ "$DEPLOY_TYPE" = "all" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🌐 Deploying Frontend"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd neuroviabot-frontend
    
    echo "📦 Installing frontend dependencies..."
    npm install
    
    echo "🏗️ Building frontend..."
    npm run build
    
    echo "🔄 Restarting frontend service..."
    pm2 restart neuroviabot-frontend --update-env
    sleep 3
    
    cd ..
    
    echo "✅ Frontend deployed successfully!"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETED!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Services Status:"
pm2 status

echo ""
echo "🎉 All done! Your services are running."
