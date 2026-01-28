#!/bin/bash

# Renkler
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   🚀 NeuroViaBot VPS Kurulum Sihirbazı v1.0    ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# 1. Klasör Yapısı Kontrolü
BASE_DIR="/root/neuroviabot-website"
if [ ! -d "$BASE_DIR" ]; then
    echo -e "${YELLOW}📂 Proje klasörü bulunamadı, oluşturuluyor...${NC}"
    cd /root
    git clone https://github.com/swaffX/neuroviabot-website.git
    cd $BASE_DIR
else
    echo -e "${GREEN}✅ Proje klasörü bulundu.${NC}"
    cd $BASE_DIR
    echo -e "${YELLOW}⬇️ Güncellemeler çekiliyor...${NC}"
    git pull
fi

# 2. Node.js Sürüm Kontrolü
echo -e "\n${BLUE}🔍 Node.js sürümü kontrol ediliyor...${NC}"
NODE_VERSION=$(node -v)
echo -e "Mevcut sürüm: ${GREEN}$NODE_VERSION${NC}"
# Burada gerekirse versiyon uyarısı yapılabilir

# 3. Backend Kurulumu
echo -e "\n${BLUE}⚙️ Backend (API) hazırlanıyor...${NC}"
cd $BASE_DIR/backend
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ Backend .env dosyası eksik! Örnekten oluşturuluyor...${NC}"
    cp .env.example .env
    echo -e "${RED}!!! LÜTFEN BİRAZDAN AÇILACAK EKRANDA KENDİ BİLGİLERİNİ GİR !!!${NC}"
    echo "5 saniye içinde nano editörü açılacak..."
    sleep 5
    nano .env
fi
echo "📦 Backend paketleri yükleniyor..."
npm install --legacy-peer-deps

# 4. Bot Kurulumu
echo -e "\n${BLUE}🤖 Discord Bot hazırlanıyor...${NC}"
cd $BASE_DIR/bot
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ Bot .env dosyası eksik! Örnekten oluşturuluyor...${NC}"
    cp .env.example .env
    echo -e "${RED}!!! LÜTFEN BİRAZDAN AÇILACAK EKRANDA BOT TOKEN'INI GİR !!!${NC}"
    echo "5 saniye içinde nano editörü açılacak..."
    sleep 5
    nano .env
fi
echo "📦 Bot paketleri yükleniyor..."
npm install --legacy-peer-deps

# 5. Frontend Kurulumu
echo -e "\n${BLUE}🌐 Frontend (Web Sitesi) hazırlanıyor...${NC}"
cd $BASE_DIR/frontend
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠️ Frontend .env.local dosyası eksik! Örnekten oluşturuluyor...${NC}"
    cp .env.example .env.local
    # Frontend genellikle public variable'lar kullanır, çok kritik değilse nano açmayabiliriz
    # ama yine de emin olmak için açalım
    echo -e "${YELLOW}Frontend ayarlarını kontrol etmek ister misin? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
        nano .env.local
    fi
fi
echo "📦 Frontend paketleri yükleniyor..."
npm install --legacy-peer-deps

echo "🏗️ Frontend inşa ediliyor (Build)... Bu işlem biraz sürebilir."
npm run build

# 6. PM2 Başlatma
echo -e "\n${BLUE}🚀 Servisler başlatılıyor...${NC}"

# Öncekileri temizle
pm2 delete all 2>/dev/null

# Backend
cd $BASE_DIR/backend
pm2 start index.js --name "neurovia-backend"

# Bot
cd $BASE_DIR/bot
pm2 start index.js --name "neurovia-bot"

# Frontend
cd $BASE_DIR/frontend
pm2 start npm --name "neurovia-web" -- start -- -p 3001

echo -e "\n${BLUE}💾 PM2 Listesi Kaydediliyor...${NC}"
pm2 save

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}🎉 KURULUM TAMAMLANDI! 🎉${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "Durum:"
pm2 list
echo -e "\nLogları izlemek için: ${YELLOW}pm2 logs${NC}"
