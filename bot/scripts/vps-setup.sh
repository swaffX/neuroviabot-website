#!/bin/bash

# ==========================================
# 🚀 NeuroViaBot VPS Initial Setup Script
# ==========================================
# Bu script VPS'e ilk kurulumda çalıştırılır

set -e

echo "🚀 Starting NeuroViaBot VPS Setup..."

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 18
echo "🟢 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools
echo "🔧 Installing build tools..."
sudo apt-get install -y build-essential git

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Create directories
echo "📁 Creating project directories..."
mkdir -p /root/neuroviabot/bot
mkdir -p /root/neuroviabot/frontend
mkdir -p /root/neuroviabot/backend

# Setup firewall
echo "🔒 Configuring firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # Frontend
sudo ufw allow 5000  # Backend
sudo ufw --force enable

# Install Nginx (optional)
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx

# Configure Nginx for frontend
echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/neuroviabot << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/neuroviabot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSH key for GitHub
echo "🔑 Setting up SSH key for GitHub..."
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -C "vps@neuroviabot" -f ~/.ssh/id_rsa -N ""
    echo "📋 Add this SSH key to your GitHub repository:"
    cat ~/.ssh/id_rsa.pub
    echo ""
    read -p "Press enter after adding the key to GitHub..."
fi

# Clone repository
echo "📥 Cloning repository..."
cd /root/neuroviabot/bot
git clone git@github.com:kxrk0/neuroviabot-discord.git .

echo "✅ VPS setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Configure .env files in each directory"
echo "2. Run: npm install in bot, frontend, and backend"
echo "3. Setup PM2: pm2 start index.js --name neuroviabot"
echo "4. Save PM2: pm2 save && pm2 startup"
echo "5. Configure domain DNS"
echo ""
