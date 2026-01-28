#!/bin/bash

# ==========================================
# 🌐 NeuroViaBot Website Deployment Script
# ==========================================
# Bu script frontend ve backend'i VPS'te deploy eder

set -e

echo "🚀 Starting NeuroViaBot Website Deployment..."

# Renk kodları
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Frontend deployment
echo -e "${BLUE}📦 Deploying Frontend...${NC}"
cd /root/neuroviabot/bot/frontend

# Temizlik
echo -e "${YELLOW}🧹 Cleaning frontend...${NC}"
rm -rf .next node_modules

# Dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install

# Build
echo -e "${BLUE}🏗️ Building Next.js...${NC}"
npm run build

# PM2 restart
echo -e "${GREEN}🔄 Restarting frontend with PM2...${NC}"
pm2 delete neuroviabot-frontend 2>/dev/null || true
pm2 start npm --name neuroviabot-frontend -- start \
    --max-memory-restart 300M \
    --time \
    --log-date-format "YYYY-MM-DD HH:mm:ss"

# Backend deployment
echo -e "${BLUE}⚙️ Deploying Backend...${NC}"
cd /root/neuroviabot/bot/backend

# Temizlik
echo -e "${YELLOW}🧹 Cleaning backend...${NC}"
rm -rf node_modules

# Dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
npm install --production

# PM2 restart
echo -e "${GREEN}🔄 Restarting backend with PM2...${NC}"
pm2 delete neuroviabot-backend 2>/dev/null || true
pm2 start index.js --name neuroviabot-backend \
    --max-memory-restart 400M \
    --time \
    --log-date-format "YYYY-MM-DD HH:mm:ss"

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Website deployment completed!${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
pm2 status

echo ""
echo -e "${BLUE}🌐 Website URLs:${NC}"
echo "  Frontend: https://neuroviabot.xyz"
echo "  Backend:  https://neuroviabot.xyz/api"
echo ""
echo -e "${BLUE}📝 Useful commands:${NC}"
echo "  pm2 logs neuroviabot-frontend    # Frontend logs"
echo "  pm2 logs neuroviabot-backend     # Backend logs"
echo "  pm2 restart all                  # Restart all services"
echo ""
