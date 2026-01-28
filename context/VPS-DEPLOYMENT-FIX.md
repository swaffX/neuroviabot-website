# 🚀 VPS Deployment Fix Guide

## Current Issue: Frontend Not Building

The Next.js frontend is failing because it's trying to run in production mode without a build.

**Error:**
```
Error: Could not find a production build in the '.next' directory. 
Try building your app with 'next build' before starting the production server.
```

## Quick Fix (Run on VPS)

### Option 1: Use Deployment Script (Recommended)

```bash
cd /root/neuroviabot/bot
chmod +x scripts/rebuild-frontend.sh
./scripts/rebuild-frontend.sh
```

### Option 2: Manual Steps

```bash
# 1. Navigate to frontend directory
cd /root/neuroviabot/bot/neuroviabot-frontend

# 2. Pull latest changes
git pull origin main

# 3. Install dependencies
npm install

# 4. Build for production
NODE_ENV=production npm run build

# 5. Restart PM2
pm2 restart neuroviabot-frontend
```

## Full System Restart

If you want to restart everything cleanly:

```bash
cd /root/neuroviabot/bot

# Pull latest code
git pull origin main

# Install bot dependencies
npm install

# Install backend dependencies
cd neuroviabot-backend
npm install
cd ..

# Build and install frontend
cd neuroviabot-frontend
npm install
NODE_ENV=production npm run build
cd ..

# Restart all PM2 processes
pm2 restart all

# Check status
pm2 status
pm2 logs
```

## PM2 Ecosystem Configuration

Your PM2 should be configured like this:

```javascript
// PM2-ECOSYSTEM.config.js
module.exports = {
  apps: [
    {
      name: 'neurovia-bot',
      script: './index.js',
      cwd: '/root/neuroviabot/bot',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'neurovia-backend',
      script: './index.js',
      cwd: '/root/neuroviabot/bot/neuroviabot-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'neuroviabot-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/root/neuroviabot/bot/neuroviabot-frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
```

## Verification Steps

After deployment, verify everything is working:

```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs --lines 50

# Test bot API
curl http://localhost:3002/api/bot/stats

# Test backend API
curl http://localhost:3000/api/health

# Test frontend
curl http://localhost:3001

# Check processes
pm2 list
```

## Common Issues & Solutions

### Issue 1: Build Fails Due to TypeScript Errors
```bash
# Fix: Update dependencies
cd neuroviabot-frontend
npm install --legacy-peer-deps
npm run build
```

### Issue 2: Port Already in Use
```bash
# Find process using port
lsof -ti:3001

# Kill it
kill -9 $(lsof -ti:3001)

# Restart PM2
pm2 restart neuroviabot-frontend
```

### Issue 3: Out of Memory During Build
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### Issue 4: Permission Denied
```bash
# Fix permissions
chmod +x scripts/*.sh
chmod -R 755 /root/neuroviabot/bot
```

## Environment Variables Check

Make sure these are set on your VPS:

```bash
# In /root/neuroviabot/bot/.env
DISCORD_TOKEN=your_token_here
DISCORD_CLIENT_ID=your_client_id
BOT_API_KEY=your_api_key
FRONTEND_URL=https://neuroviabot.xyz
BOT_API_URL=http://localhost:3002

# In /root/neuroviabot/bot/neuroviabot-backend/.env
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_secret
DISCORD_CALLBACK_URL=https://neuroviabot.xyz/api/auth/callback
SESSION_SECRET=your_session_secret
BOT_API_URL=http://localhost:3002
BOT_API_KEY=your_api_key

# In /root/neuroviabot/bot/neuroviabot-frontend/.env
NEXT_PUBLIC_API_URL=https://neuroviabot.xyz
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_client_id
```

## Monitoring

Keep an eye on your services:

```bash
# Real-time logs
pm2 logs

# Specific service logs
pm2 logs neurovia-bot
pm2 logs neurovia-backend
pm2 logs neuroviabot-frontend

# Monitor resources
pm2 monit

# Save PM2 configuration
pm2 save
```

## Auto-Restart on Server Reboot

```bash
# Generate startup script
pm2 startup

# Follow the command it gives you (usually something like):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# Save current process list
pm2 save
```

## Emergency Rollback

If something breaks:

```bash
# Go back to previous commit
cd /root/neuroviabot/bot
git log --oneline -5  # See last 5 commits
git checkout <previous-commit-hash>

# Rebuild
./scripts/rebuild-frontend.sh

# Restart
pm2 restart all
```

---

## 📞 Need Help?

If issues persist:
1. Check `pm2 logs` for detailed errors
2. Verify all environment variables are set
3. Ensure ports 3000, 3001, 3002 are not blocked
4. Check disk space: `df -h`
5. Check memory: `free -h`

