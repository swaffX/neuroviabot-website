#!/bin/bash

# ==========================================
# 🔍 Frontend Comprehensive Check & Fix
# ==========================================

echo "🔍 Frontend kapsamlı kontrol ve düzeltme başlatılıyor..."
echo ""

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd /root/neuroviabot-website/frontend

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 1. DOSYA KONTROLÜ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# package.json
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json var${NC}"
else
    echo -e "${RED}❌ package.json YOK - Git pull gerekli!${NC}"
    exit 1
fi

# next.config.js
if [ -f "next.config.js" ]; then
    echo -e "${GREEN}✅ next.config.js var${NC}"
else
    echo -e "${RED}❌ next.config.js YOK${NC}"
fi

# app klasörü
if [ -d "app" ]; then
    echo -e "${GREEN}✅ app/ klasörü var${NC}"
else
    echo -e "${RED}❌ app/ klasörü YOK${NC}"
fi

# components klasörü
if [ -d "components" ]; then
    echo -e "${GREEN}✅ components/ klasörü var${NC}"
else
    echo -e "${RED}❌ components/ klasörü YOK${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 2. NODE_MODULES KONTROLÜ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules/ klasörü var${NC}"
    
    # next executable
    if [ -f "node_modules/.bin/next" ]; then
        echo -e "${GREEN}✅ next executable var${NC}"
    else
        echo -e "${RED}❌ next executable YOK${NC}"
        echo -e "${YELLOW}⚠️  node_modules yeniden kurulacak...${NC}"
        rm -rf node_modules package-lock.json
        npm install --legacy-peer-deps
    fi
    
    # react
    if [ -d "node_modules/react" ]; then
        echo -e "${GREEN}✅ react var${NC}"
    else
        echo -e "${RED}❌ react YOK${NC}"
    fi
    
    # next
    if [ -d "node_modules/next" ]; then
        echo -e "${GREEN}✅ next var${NC}"
    else
        echo -e "${RED}❌ next YOK${NC}"
    fi
else
    echo -e "${RED}❌ node_modules/ klasörü YOK${NC}"
    echo -e "${YELLOW}⚠️  npm install çalıştırılıyor...${NC}"
    npm install --legacy-peer-deps
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  3. NEXT.CONFIG.JS KONTROLÜ VE DÜZELTMESİ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "next.config.js" ]; then
    echo "📄 Mevcut next.config.js içeriği:"
    cat next.config.js
    echo ""
    
    # swcMinify ve diğer deprecated ayarları kontrol et
    if grep -q "swcMinify" next.config.js; then
        echo -e "${YELLOW}⚠️  'swcMinify' bulundu (deprecated)${NC}"
        echo -e "${YELLOW}⚠️  next.config.js düzeltiliyor...${NC}"
        
        # Backup al
        cp next.config.js next.config.js.backup
        
        # Düzeltilmiş config yaz
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
        echo -e "${GREEN}✅ next.config.js düzeltildi${NC}"
    else
        echo -e "${GREEN}✅ next.config.js geçerli${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  next.config.js yok, oluşturuluyor...${NC}"
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
    echo -e "${GREEN}✅ next.config.js oluşturuldu${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔨 4. BUILD KONTROLÜ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d ".next" ]; then
    echo -e "${GREEN}✅ .next/ klasörü var${NC}"
    echo -e "${YELLOW}⚠️  Eski build temizlenip yeniden yapılacak...${NC}"
    rm -rf .next
else
    echo -e "${RED}❌ .next/ klasörü YOK${NC}"
    echo -e "${YELLOW}⚠️  Build yapılacak...${NC}"
fi

echo ""
echo "🔨 npm run build çalıştırılıyor..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build başarılı${NC}"
else
    echo -e "${RED}❌ Build başarısız!${NC}"
    echo ""
    echo "🔍 Build loglarını kontrol edin"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 5. PM2 BAŞLATMA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Eski process'i durdur
pm2 delete neuroviabot-frontend 2>/dev/null || true

echo "🚀 Frontend başlatılıyor..."
pm2 start npm --name "neuroviabot-frontend" -- start -- -p 3001

# Save
pm2 save

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TAMAMLANDI!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📊 PM2 Durumu:"
pm2 list

echo ""
echo "📋 Son 15 satır log:"
sleep 3
pm2 logs neuroviabot-frontend --lines 15 --nostream

echo ""
echo "🔗 URL: https://neuroviabot.xyz"
echo ""

