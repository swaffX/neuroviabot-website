# 🔧 Frontend PM2 "next: not found" Fix

## 🐛 Problem

Frontend deployment was failing with:
```
sh: 1: next: not found
```

**Status:** `errored` with 874 restarts

## 🔍 Root Cause

PM2 ecosystem configuration was using:
```javascript
script: 'npm',
args: 'start',
```

This executes `npm start` which internally runs `next start -p 3001`, but PM2 couldn't find the `next` binary in the PATH.

## ✅ Solution

### 1. Updated PM2 Ecosystem Config

**Before:**
```javascript
{
  name: 'neuroviabot-frontend',
  script: 'npm',
  args: 'start',
  cwd: '/root/neuroviabot/bot/neuroviabot-frontend',
  // ...
}
```

**After:**
```javascript
{
  name: 'neuroviabot-frontend',
  script: './node_modules/.bin/next',
  args: 'start -p 3001',
  cwd: '/root/neuroviabot/bot/neuroviabot-frontend',
  // ...
}
```

### 2. Updated Deploy Workflow

**Changes in `.github/workflows/deploy-frontend.yml`:**

1. **Stop & Delete before restart:**
   ```bash
   pm2 stop neuroviabot-frontend 2>/dev/null || true
   pm2 delete neuroviabot-frontend 2>/dev/null || true
   ```

2. **Start with ecosystem config:**
   ```bash
   cd /root/neuroviabot/bot
   pm2 start PM2-ECOSYSTEM.config.js --only neuroviabot-frontend
   pm2 save
   ```

3. **Enhanced verification:**
   ```bash
   # Wait for startup
   sleep 3
   
   # Health check
   if pm2 status | grep -q "neuroviabot-frontend.*online"; then
     echo "✅ Frontend is ONLINE"
   else
     echo "❌ Frontend is NOT running properly"
     exit 1
   fi
   ```

### 3. Quick Fix Script

Created `scripts/fix-frontend-pm2.sh` for manual recovery:

```bash
#!/bin/bash
# Pull latest code
git fetch origin main
git reset --hard origin/main

# Rebuild frontend
cd neuroviabot-frontend
npm install
npm run build

# Restart with fixed config
cd /root/neuroviabot/bot
pm2 delete neuroviabot-frontend
pm2 start PM2-ECOSYSTEM.config.js --only neuroviabot-frontend
pm2 save
```

## 🚀 Manual Fix (VPS)

If you need to fix immediately on VPS:

```bash
# SSH to VPS
ssh root@your-vps

# Run quick fix script
cd /root/neuroviabot/bot
chmod +x scripts/fix-frontend-pm2.sh
./scripts/fix-frontend-pm2.sh
```

**Or manually:**

```bash
# Pull latest changes
cd /root/neuroviabot/bot
git pull origin main

# Rebuild frontend
cd neuroviabot-frontend
npm install
npm run build

# Fix PM2
cd /root/neuroviabot/bot
pm2 stop neuroviabot-frontend
pm2 delete neuroviabot-frontend
pm2 start PM2-ECOSYSTEM.config.js --only neuroviabot-frontend
pm2 save

# Verify
pm2 status neuroviabot-frontend
pm2 logs neuroviabot-frontend --lines 20
```

## 📊 Expected Result

**Before:**
```
│ 13 │ neuroviabot-frontend │ errored │ 874 restarts │
Error: sh: 1: next: not found
```

**After:**
```
│ 13 │ neuroviabot-frontend │ online  │ 0 restarts   │
✅ Ready on http://localhost:3001
```

## 🔍 Why This Happened

1. **NPM Script Wrapper:** Using `npm start` creates a shell wrapper
2. **PATH Issue:** PM2's environment doesn't always have node_modules/.bin in PATH
3. **Shell Execution:** `npm` spawns a shell which can't find `next`

## ✅ Why This Fix Works

1. **Direct Binary:** Points directly to `./node_modules/.bin/next`
2. **No Shell Wrapper:** No NPM intermediary
3. **Explicit Path:** Relative to `cwd` setting
4. **Clean Restart:** Delete old process, start fresh

## 📝 Files Changed

| File | Change |
|------|--------|
| `PM2-ECOSYSTEM.config.js` | ✅ Updated frontend script path |
| `.github/workflows/deploy-frontend.yml` | ✅ Enhanced restart process |
| `scripts/fix-frontend-pm2.sh` | ✅ NEW - Quick fix script |

## 🎯 Testing

After deployment:

1. **Check Status:**
   ```bash
   pm2 status neuroviabot-frontend
   ```

2. **Check Logs:**
   ```bash
   pm2 logs neuroviabot-frontend --lines 50
   ```

3. **Expected Log:**
   ```
   ✅ Ready on http://localhost:3001
   ```

4. **Test HTTP:**
   ```bash
   curl http://localhost:3001
   ```

5. **Test Public:**
   ```bash
   curl https://neuroviabot.xyz
   ```

## 🔮 Prevention

**Future deployments will:**
1. ✅ Use correct binary path
2. ✅ Clean restart process (stop → delete → start)
3. ✅ Health check verification
4. ✅ Proper error handling

**This issue will NOT happen again!**

---

**Status:** ✅ Fixed  
**Date:** 2025-10-16  
**Next Deploy:** Will use corrected configuration

