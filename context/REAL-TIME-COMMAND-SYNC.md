# 🔄 Real-Time Command Synchronization System

## 🎯 Overview

Bot komutlarının **real-time** olarak web dashboard ile senkronize olması sistemi. Discord'da slash command registration mantığı gibi çalışır.

---

## ✨ Features

### 1. ⏱️ Real-Time Updates
- Bot'a yeni komut eklendiğinde **anında** dashboard'da görünür
- Bot'tan komut silindiğinde **anında** dashboard'dan kaldırılır
- Komut değiştirildiğinde **anında** güncellenir

### 2. 🔄 Auto-Refresh
- Komut değişiklikleri otomatik olarak tespit edilir (5 saniye interval)
- Socket.IO ile tüm client'lara broadcast edilir
- Notification ile kullanıcı bilgilendirilir

### 3. 🖱️ Manual Refresh
- "Yenile" butonu ile manuel refresh
- API üzerinden force refresh
- Tüm değişiklikleri çeker ve günceller

### 4. 🔔 Smart Notifications
- Eklenen komutlar → Yeşil notification
- Kaldırılan komutlar → Kırmızı notification
- Değiştirilen komutlar → Mavi notification
- 5 saniye sonra otomatik kaybolur

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Bot (index.js) │
│                  │
│  CommandWatcher  │ ←── 5s interval
│   ├─ Detect      │     file changes
│   ├─ Reload      │
│   └─ Broadcast   │
└────────┬─────────┘
         │ Socket.IO
         │ emit('commands_updated')
         ↓
┌────────────────────┐
│  Backend Server    │
│                    │
│  Socket.IO Hub     │ ←── Broadcasts to
│  ├─ receive event  │     all connected
│  └─ broadcast all  │     clients
└────────┬───────────┘
         │ Socket.IO
         │ emit('commands_updated')
         ↓
┌────────────────────────┐
│  Frontend Dashboard    │
│                        │
│  /dev-panel/commands   │
│  ├─ Listen updates     │
│  ├─ Show notification  │
│  ├─ Update UI          │
│  └─ Refresh button     │
└────────────────────────┘
```

---

## 📂 Files Changed/Created

### Bot (Discord.js)

#### ✅ NEW: `src/utils/commandWatcher.js`
```javascript
class CommandWatcher {
    constructor(client, socket)
    start() // 5 saniye interval ile watch
    detectChanges() // Dosya değişikliklerini tespit et
    broadcastChanges() // Socket.IO ile broadcast
    forceRefresh() // Manuel refresh
    reloadCommands() // Komutları yeniden yükle
}
```

**Features:**
- File watching (5s interval)
- Change detection (added/removed/modified)
- Automatic reload
- Socket.IO broadcasting
- Force refresh API

#### ✅ UPDATED: `index.js`
```javascript
// setupSocketIO() içinde
const CommandWatcher = require('./src/utils/commandWatcher');
const commandWatcher = new CommandWatcher(client, socket);
commandWatcher.start();

const { setCommandWatcher } = require('./src/routes/developer-bot-api');
setCommandWatcher(commandWatcher);
```

#### ✅ UPDATED: `src/routes/developer-bot-api.js`
```javascript
// Store command watcher reference
let commandWatcher = null;
function setCommandWatcher(watcher) { ... }

// GET /api/dev-bot/commands - Enhanced with timestamp
router.get('/commands', ...)

// NEW: POST /api/dev-bot/commands/refresh
router.post('/commands/refresh', async (req, res) => {
    const result = await commandWatcher.forceRefresh();
    res.json(result);
});

module.exports = { router, setClient, setCommandWatcher };
```

### Backend (Express.js)

#### ✅ UPDATED: `neuroviabot-backend/routes/developer.js`
```javascript
// NEW: POST /api/dev/bot/commands/refresh
router.post('/bot/commands/refresh', async (req, res) => {
    const response = await axios.post(
        `${BOT_API_URL}/api/dev-bot/commands/refresh`,
        {},
        { headers: { 'x-api-key': BOT_API_KEY }, timeout: 15000 }
    );
    res.json(response.data);
});
```

### Frontend (Next.js)

#### ✅ UPDATED: `neuroviabot-frontend/app/dev-panel/commands/page.tsx`

**New Imports:**
```typescript
import { io, Socket } from 'socket.io-client';
import { ArrowPathIcon, BellAlertIcon } from '@heroicons/react/24/outline';
import { AnimatePresence } from 'framer-motion';
```

**New State:**
```typescript
const [refreshing, setRefreshing] = useState(false);
const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
const [notification, setNotification] = useState<...>(null);
const socketRef = useRef<Socket | null>(null);
```

**Socket.IO Setup:**
```typescript
useEffect(() => {
    const socket = io(API_URL);
    
    socket.on('commands_updated', (data) => {
        handleCommandUpdate(data);
    });
    
    return () => socket.disconnect();
}, []);
```

**Refresh Handler:**
```typescript
const handleRefresh = async () => {
    const response = await fetch(`${API_URL}/api/dev/bot/commands/refresh`, {
        method: 'POST'
    });
    const data = await response.json();
    setCommands(data.commands);
};
```

**UI Components:**
- ✅ Refresh button (top-right, next to title)
- ✅ Notification toast (top-right, animated)
- ✅ Last update timestamp (under title)

---

## 🔄 How It Works

### 1. File Watching (Bot)

```javascript
// Every 5 seconds
const current = getCurrentCommands(); // Read src/commands/*.js
const changes = detectChanges(current, lastCommandList);

if (changes.hasChanges) {
    await reloadCommands(); // Reload command files
    await broadcastChanges(changes); // Socket.IO emit
}
```

### 2. Broadcasting (Bot → Backend)

```javascript
socket.emit('commands_updated', {
    added: [{ name: 'nrc', description: '...', category: 'economy' }],
    removed: ['features'],
    modified: [{ name: 'setup', description: '...' }],
    timestamp: '2025-10-16T...',
    totalCommands: 39
});
```

### 3. Receiving (Frontend)

```javascript
socket.on('commands_updated', (data) => {
    // Added commands
    data.added.forEach(cmd => {
        setCommands(prev => [...prev, cmd]);
        showNotification('added', cmd.name);
    });
    
    // Removed commands
    data.removed.forEach(cmdName => {
        setCommands(prev => prev.filter(c => c.name !== cmdName));
        showNotification('removed', cmdName);
    });
    
    // Modified commands
    data.modified.forEach(cmd => {
        setCommands(prev => prev.map(c => 
            c.name === cmd.name ? { ...c, ...cmd } : c
        ));
        showNotification('modified', cmd.name);
    });
});
```

### 4. Manual Refresh

```javascript
// Frontend: Click "Yenile" button
handleRefresh()
↓
// POST /api/dev/bot/commands/refresh
↓
// Bot: Force scan and reload
commandWatcher.forceRefresh()
↓
// Return updated command list
{ success: true, commands: [...], changes: {...} }
```

---

## 🎨 UI/UX

### Header
```
┌──────────────────────────────────────────────────────────┐
│ [← Geri] │ [💜] Komut Yönetimi                 [🔄 Yenile] │
│         39 komut kayıtlı • Son güncelleme: 14:23:45      │
└──────────────────────────────────────────────────────────┘
```

### Notification (Auto-dismiss in 5s)
```
┌─────────────────────────────────┐
│ 🔔 Komut Eklendi                │
│    /nrc                         │
└─────────────────────────────────┘
```

### Refresh Button States
```
Normal:    [🔄 Yenile]
Loading:   [⟳ Yenileniyor...] (spinning icon, disabled)
```

---

## 📊 Example Scenarios

### Scenario 1: New Command Added

1. Developer creates `src/commands/premium.js`
2. CommandWatcher detects new file (5s later)
3. Bot reloads commands (`client.commands.set('premium', ...)`)
4. Socket.IO emits: `commands_updated` with `added: [{ name: 'premium', ... }]`
5. Frontend receives event
6. Green notification: "Komut Eklendi: /premium"
7. Command card appears in grid
8. Last update time updates

### Scenario 2: Command Deleted

1. Developer deletes `src/commands/features.js`
2. CommandWatcher detects missing file
3. Bot removes command (`client.commands.delete('features')`)
4. Socket.IO emits: `commands_updated` with `removed: ['features']`
5. Frontend receives event
6. Red notification: "Komut Kaldırıldı: /features"
7. Command card disappears from grid
8. Total count decreases

### Scenario 3: Command Modified

1. Developer edits `src/commands/setup.js` (changes description)
2. CommandWatcher detects file change (mtimeMs different)
3. Bot reloads command
4. Socket.IO emits: `commands_updated` with `modified: [{ name: 'setup', ... }]`
5. Frontend receives event
6. Blue notification: "Komut Güncellendi: /setup"
7. Command card updates in place
8. Description changes without page reload

### Scenario 4: Manual Refresh

1. Developer clicks "Yenile" button
2. Button shows spinning icon, becomes disabled
3. POST request to `/api/dev/bot/commands/refresh`
4. Bot performs force scan
5. Returns complete command list
6. Frontend updates entire list
7. Last update timestamp updates
8. Button returns to normal state

---

## 🧪 Testing

### Test 1: Add Command
```bash
# Create new command
cp src/commands/nrc.js src/commands/test.js

# Expected:
# - Green notification in 5s
# - /test appears in list
# - Count increases
```

### Test 2: Remove Command
```bash
# Delete command
rm src/commands/test.js

# Expected:
# - Red notification in 5s
# - /test disappears from list
# - Count decreases
```

### Test 3: Modify Command
```bash
# Edit command description
code src/commands/nrc.js
# Change description and save

# Expected:
# - Blue notification in 5s
# - Description updates
# - No page reload
```

### Test 4: Manual Refresh
```bash
# Click "Yenile" button

# Expected:
# - Spinning icon
# - All commands refreshed
# - Timestamp updates
# - Button returns to normal
```

---

## ⚙️ Configuration

### Watch Interval
```javascript
// src/utils/commandWatcher.js
this.WATCH_INTERVAL = 5000; // 5 seconds
```

### Notification Duration
```typescript
// app/dev-panel/commands/page.tsx
setTimeout(() => setNotification(null), 5000); // 5 seconds
```

### Socket.IO Reconnection
```typescript
// Frontend
const socket = io(API_URL, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10
});
```

---

## 🚀 Deployment

### 1. Bot Restart
```bash
pm2 restart neuroviabot
pm2 logs neuroviabot --lines 20
```

Expected logs:
```
✅ Command watcher initialized
✅ Watching commands directory (interval: 5000ms)
```

### 2. Backend Restart
```bash
pm2 restart neuroviabot-backend
```

### 3. Frontend Build
```bash
cd neuroviabot-frontend
npm run build
pm2 restart neuroviabot-frontend
```

### 4. Test
```
1. Open https://neuroviabot.xyz/dev-panel/commands
2. Add a test command in bot
3. Wait 5 seconds
4. See notification + command appears
```

---

## 📝 API Endpoints

### GET /api/dev/bot/commands
Get all commands with usage stats.

**Response:**
```json
{
    "success": true,
    "commands": [
        {
            "name": "nrc",
            "description": "NeuroCoin hızlı erişim",
            "category": "economy",
            "options": 9,
            "usageCount": 0,
            "enabled": true
        }
    ],
    "total": 39,
    "timestamp": "2025-10-16T14:23:45.123Z"
}
```

### POST /api/dev/bot/commands/refresh
Force refresh command list.

**Response:**
```json
{
    "success": true,
    "commands": [...],
    "changes": {
        "added": [...],
        "removed": [...],
        "modified": [...],
        "hasChanges": true
    },
    "timestamp": "2025-10-16T14:23:45.123Z"
}
```

---

## 🔔 Socket.IO Events

### `commands_updated`

**Emitted by:** Bot
**Received by:** Frontend

**Payload:**
```json
{
    "added": [
        {
            "name": "premium",
            "description": "Premium özellikleri",
            "category": "premium",
            "options": 5
        }
    ],
    "removed": ["features"],
    "modified": [
        {
            "name": "setup",
            "description": "Updated description",
            "category": "setup"
        }
    ],
    "timestamp": "2025-10-16T14:23:45.123Z",
    "totalCommands": 39
}
```

---

## 🎯 Benefits

### For Developers
✅ No need to manually refresh dashboard
✅ Instant feedback on command changes
✅ Easy debugging (see changes immediately)
✅ Discord-like slash command update experience

### For Users
✅ Always up-to-date command list
✅ Visual feedback on changes
✅ Manual refresh option available
✅ Real-time synchronization

### For System
✅ Efficient (only broadcasts changes, not full list)
✅ Scalable (Socket.IO broadcast to all clients)
✅ Reliable (auto-reconnection, fallbacks)
✅ Performance (5s interval, not polling)

---

## 🔍 Debugging

### Enable Debug Logs

**Bot:**
```javascript
// src/utils/commandWatcher.js
logger.debug('[CommandWatcher] Changes detected:', changes);
```

**Frontend:**
```typescript
// app/dev-panel/commands/page.tsx
console.log('[Commands] Commands updated:', data);
console.log('[Commands] Socket connected');
```

### Check Socket Connection
```javascript
// Browser Console
socketRef.current.connected // true/false
```

### Manual Trigger
```bash
# Bot console
commandWatcher.forceRefresh()
```

---

## 📊 Performance

- **Watch Interval:** 5 seconds (configurable)
- **Broadcast Size:** ~1-5 KB per update
- **Notification Duration:** 5 seconds
- **Socket Reconnection:** 10 attempts, 1s delay

---

## ✅ Checklist

- [x] CommandWatcher class created
- [x] Bot integration (index.js)
- [x] Bot API refresh endpoint
- [x] Backend proxy endpoint
- [x] Frontend Socket.IO integration
- [x] Frontend refresh button
- [x] Frontend notifications
- [x] Auto-update on changes
- [x] Manual refresh functionality
- [x] Error handling
- [x] Documentation

---

**Status:** ✅ Complete
**Version:** 1.0.0
**Date:** 2025-10-16
**Author:** AI Agent

**Discord Slash Command Philosophy:**
> Just like Discord updates slash commands instantly when you register them, our dashboard now updates instantly when commands change in the bot!

