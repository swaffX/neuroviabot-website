# 🚀 VPS Frontend Build - Quick Fix Guide

## Error: `next: not found`

This means Node.js dependencies aren't installed.

## Solution: Install Dependencies & Build

```bash
cd /root/neuroviabot/bot/neuroviabot-frontend

# 1. Install all dependencies (this will take 2-3 minutes)
npm install

# 2. Build for production
npm run build

# 3. Restart with PM2
pm2 restart neuroviabot-frontend

# 4. Check status
pm2 status
pm2 logs neuroviabot-frontend --lines 30
```

## Alternative: One-Line Fix

```bash
cd /root/neuroviabot/bot/neuroviabot-frontend && npm install && npm run build && pm2 restart neuroviabot-frontend
```

## If npm install fails with EACCES errors:

```bash
# Clean cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Expected Success Output

After `npm install`:
```
added 500+ packages in 2m
```

After `npm run build`:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB         92.1 kB
...
○  (Static)  automatically rendered as static HTML
```

## Verify Frontend is Running

```bash
# Check PM2 process
pm2 list

# Should show:
# neuroviabot-frontend │ online

# Test the frontend
curl http://localhost:3001

# Should return HTML (not error)
```

## If PM2 shows error after restart:

```bash
# Check logs for specific error
pm2 logs neuroviabot-frontend --lines 50

# Common issues:
# 1. Port 3001 already in use → pm2 delete neuroviabot-frontend && pm2 start npm --name neuroviabot-frontend -- start -p 3001
# 2. .next not found → npm run build (again)
# 3. Permission error → sudo chown -R $USER:$USER /root/neuroviabot/bot/neuroviabot-frontend
```

## Complete Fresh Start (if all else fails):

```bash
cd /root/neuroviabot/bot
git pull origin main

cd neuroviabot-frontend
rm -rf node_modules package-lock.json .next
npm install
npm run build

pm2 delete neuroviabot-frontend
pm2 start npm --name neuroviabot-frontend -- start -p 3001
pm2 save
```

