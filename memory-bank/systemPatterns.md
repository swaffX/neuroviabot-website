# System Patterns - NeuroViaBot

## 🏗️ Sistem Mimarisi

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Discord Platform                         │
│                  (User Interactions)                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 NeuroViaBot (Discord Bot)                    │
│  ┌─────────────┬──────────────┬──────────────┬────────────┐ │
│  │ Commands    │ Events       │ Handlers     │ Utils      │ │
│  │ (39 files)  │ (7 files)    │ (23 files)   │ (16 files) │ │
│  └─────────────┴──────────────┴──────────────┴────────────┘ │
│                         │                                     │
│                    Socket.IO ←→ Backend API                  │
│                         │                                     │
│                    Simple-DB (Shared)                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API (Express.js)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes (25+): Auth, Guild, Economy, Premium, etc.   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Middleware: Auth, Rate Limit, Error Handler          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Socket.IO Server ←→ Frontend Dashboard                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│           Frontend Dashboard (Next.js 14)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pages: Dashboard, Servers, Premium, Leaderboard      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Components: UI, Dashboard, Auth, Layout               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Context: User, NeuroCoin, Socket, Theme              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Temel Teknik Kararlar

### 1. Database: Simple-DB (JSON-based)

**Karar**: File-based JSON database kullanımı  
**Neden**: 
- Kolay deployment (no external DB service)
- Yeterli performans (Maps kullanımı)
- Otomatik backup
- Human-readable format

**Trade-offs**:
- ✅ Basit ve bakımı kolay
- ✅ Zero config
- ❌ Scalability limiti (but enough for current scale)
- ❌ No complex queries

**Implementation**:
```javascript
// database/simple-db.js
class SimpleDB {
  constructor() {
    this.data = {
      guilds: new Map(),
      users: new Map(),
      settings: new Map(),
      economy: new Map(),
      leveling: new Map(),
      // ... 15+ Maps
    };
  }
  
  saveData() {
    // Atomic write with temp file
    fs.writeFileSync(tempPath, JSON.stringify(serialized));
    fs.renameSync(tempPath, this.dbPath);
  }
}
```

### 2. Real-time Communication: Socket.IO

**Karar**: Socket.IO bidirectional communication  
**Neden**:
- Real-time bot ↔ dashboard sync
- Event-driven architecture
- Room-based broadcasting (per guild)
- Auto reconnection

**Pattern**:
```javascript
// Bot → Backend → Frontend
client.socket.emit('broadcast_to_guild', {
  guildId,
  event: 'member_join',
  data: { userId, username }
});

// Frontend → Backend → Bot
socket.emit('settings_update', {
  guildId,
  settings: { leveling: { enabled: true } }
});
```

### 3. Command Pattern: Slash Commands

**Karar**: Discord.js SlashCommandBuilder  
**Neden**:
- Modern Discord UI
- Type safety ve validation
- Auto-complete support
- Better UX than prefix commands

**Structure**:
```javascript
// src/commands/[command].js
module.exports = {
  data: new SlashCommandBuilder()
    .setName('command')
    .setDescription('Description'),
  
  category: 'Category', // Auto-categorized
  
  async execute(interaction) {
    // Command logic
  }
};
```

### 4. Handler Pattern: Event-Driven

**Karar**: Dedicated handlers for each system  
**Neden**:
- Separation of concerns
- Easy to maintain and extend
- Reusable across commands
- Centralized logic

**Handler Types**:
- **Event Handlers**: Discord events (messageCreate, interactionCreate)
- **Feature Handlers**: Business logic (levelingHandler, economyHandler)
- **System Handlers**: Infrastructure (loggingHandler, backupHandler)

### 5. Authentication: Discord OAuth 2.0

**Karar**: Passport.js + Discord Strategy  
**Neden**:
- No password management
- Automatic guild access verification
- User profile readily available
- Standard OAuth flow

**Flow**:
```
User → /login → Discord Auth → Callback → Session → Dashboard
```

## 🔧 Kullanımdaki Tasarım Kalıpları

### 1. Singleton Pattern

**Kullanım**: Database, Logger, Stats Cache  
**Örnek**:
```javascript
// database/simple-db.js
let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new SimpleDB();
  }
  return dbInstance;
}
```

### 2. Observer Pattern

**Kullanım**: Socket.IO events, Discord events  
**Örnek**:
```javascript
// Events subscribe to Discord
client.on('guildMemberAdd', async (member) => {
  // Multiple handlers notified
  await loggingHandler.handleMemberJoin(member);
  await welcomeHandler.handleMemberJoin(member);
  realtimeSync.memberJoin(member);
});
```

### 3. Strategy Pattern

**Kullanım**: Command execution, moderation actions  
**Örnek**:
```javascript
// Different strategies for different moderation types
const strategies = {
  ban: (guild, user, reason) => guild.members.ban(user, { reason }),
  kick: (guild, user, reason) => guild.members.kick(user, { reason }),
  timeout: (guild, user, duration) => member.timeout(duration)
};
```

### 4. Factory Pattern

**Kullanım**: Embed creation, API responses  
**Örnek**:
```javascript
// utils/embedFactory.js
class EmbedFactory {
  static success(title, description) {
    return new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(title)
      .setDescription(description);
  }
  
  static error(title, description) {
    return new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(title)
      .setDescription(description);
  }
}
```

### 5. Middleware Pattern

**Kullanım**: Express routes, permission checks  
**Örnek**:
```javascript
// middleware/auth.js
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Usage
app.get('/api/guilds', isAuthenticated, (req, res) => {
  // Handler
});
```

### 6. Proxy Pattern

**Kullanım**: Bot API proxy, caching  
**Örnek**:
```javascript
// Backend proxies requests to Bot API
app.post('/api/bot/:guildId/command', async (req, res) => {
  const botApiUrl = process.env.BOT_API_URL;
  const response = await axios.post(
    `${botApiUrl}/api/bot/${req.params.guildId}/command`,
    req.body
  );
  res.json(response.data);
});
```

## 🔗 Bileşen İlişkileri

### Discord Bot Bileşenleri

```
index.js (Main Entry)
    │
    ├─→ Commands (39)
    │   └─→ Execute on interaction
    │
    ├─→ Events (7)
    │   ├─→ ready.js
    │   ├─→ interactionCreate.js
    │   ├─→ messageCreate.js
    │   ├─→ guildMemberAdd.js
    │   ├─→ guildMemberRemove.js
    │   ├─→ guildCreate.js
    │   └─→ guildDelete.js
    │
    ├─→ Handlers (23)
    │   ├─→ Feature Handlers (leveling, economy, etc.)
    │   └─→ System Handlers (logging, backup, etc.)
    │
    ├─→ Models (11)
    │   └─→ Simple-DB interface
    │
    └─→ Utils (16)
        ├─→ Security
        ├─→ Analytics
        ├─→ Logger
        └─→ Stats Cache
```

### Backend API Bileşenleri

```
neuroviabot-backend/index.js
    │
    ├─→ Routes (25+)
    │   ├─→ auth.js (Discord OAuth)
    │   ├─→ guilds.js (Guild data)
    │   ├─→ neurocoin.js (NRC balance)
    │   ├─→ leveling.js (XP & levels)
    │   ├─→ premium.js (Premium plans)
    │   └─→ ... (20+ more)
    │
    ├─→ Middleware
    │   ├─→ developerAuth.js
    │   ├─→ rateLimiter.js
    │   ├─→ errorHandler.js
    │   └─→ auditLogger.js
    │
    ├─→ Socket.IO
    │   ├─→ Guild rooms
    │   ├─→ Bot connection
    │   └─→ Frontend connections
    │
    └─→ Database (Shared Simple-DB)
```

### Frontend Dashboard Bileşenleri

```
neuroviabot-frontend/
    │
    ├─→ app/ (Pages - App Router)
    │   ├─→ page.tsx (Homepage)
    │   ├─→ login/page.tsx
    │   ├─→ dashboard/
    │   │   ├─→ page.tsx
    │   │   └─→ servers/[id]/page.tsx
    │   ├─→ premium/page.tsx
    │   └─→ leaderboard/[guildId]/page.tsx
    │
    ├─→ components/
    │   ├─→ dashboard/ (28 components)
    │   ├─→ layout/ (6 components)
    │   ├─→ auth/ (2 components)
    │   └─→ ui/ (13 components)
    │
    ├─→ contexts/
    │   ├─→ UserContext.tsx
    │   ├─→ NeuroCoinContext.tsx
    │   ├─→ SocketContext.tsx
    │   └─→ ThemeContext.tsx
    │
    ├─→ lib/
    │   ├─→ api.ts (Axios client)
    │   ├─→ auth.ts (NextAuth)
    │   └─→ discord.ts (Discord helpers)
    │
    └─→ styles/
        ├─→ themes.css
        └─→ *.scss (13 SCSS files)
```

## 🚀 Kritik Uygulama Yolları

### 1. Slash Command Execution Flow

```
User types /command in Discord
    ↓
Discord sends interaction event
    ↓
Bot receives in interactionCreate.js
    ↓
Command validation (exists? permissions? cooldown?)
    ↓
Command.execute(interaction)
    ↓
Business logic in command file
    ↓
May call handlers (leveling, economy, etc.)
    ↓
May update database (Simple-DB)
    ↓
May broadcast via Socket.IO
    ↓
Reply to interaction (embed)
    ↓
May log to audit log
```

### 2. Real-time Settings Update Flow

```
User changes setting in Dashboard
    ↓
Frontend → PUT /api/guild-settings/:guildId
    ↓
Backend validates & saves to database
    ↓
Backend emits Socket.IO event: 'settings_changed'
    ↓
Bot receives event via Socket.IO
    ↓
Bot updates local cache
    ↓
Bot applies new settings immediately
    ↓
Frontend receives event via Socket.IO
    ↓
Frontend updates UI (optimistic + confirmed)
```

### 3. Member Join Flow

```
User joins Discord server
    ↓
Bot receives 'guildMemberAdd' event
    ↓
Multiple handlers triggered:
    ├─→ loggingHandler.logMemberJoin()
    │   └─→ Sends log to log channel
    ├─→ welcomeHandler.handleMemberJoin()
    │   └─→ Sends welcome message
    ├─→ verificationHandler.handleJoin()
    │   └─→ Assigns verification role
    └─→ realtimeSync.memberJoin()
        └─→ Broadcasts to frontend via Socket.IO
            ↓
        Frontend updates member count in real-time
```

### 4. Economy Transaction Flow

```
User uses /daily command
    ↓
Command validates cooldown
    ↓
Generate random amount (100-500 NRC)
    ↓
economyHandler.addBalance(userId, amount)
    ↓
Database updates user balance
    ↓
questProgressHandler.checkProgress(userId, 'daily')
    ↓
achievementHandler.checkAchievement(userId, 'first_daily')
    ↓
Reply with success embed
    ↓
Socket.IO broadcasts 'balance_update'
    ↓
Frontend NeuroCoin badge updates in real-time
```

### 5. Premium Purchase Flow

```
User selects premium plan in Dashboard
    ↓
Frontend → POST /api/premium/purchase
    ↓
Backend checks user balance
    ↓
Deducts NRC from user
    ↓
Adds premium to userPremium Map
    ↓
Sets expiry date (30 days)
    ↓
Audit log records transaction
    ↓
Socket.IO broadcasts 'premium_activated'
    ↓
Bot receives event and updates cache
    ↓
Frontend shows success + new badge
```

## 🔐 Security Patterns

### 1. Rate Limiting

```javascript
// Per-user command cooldowns
const cooldowns = new Map();

if (cooldowns.has(userId)) {
  const expirationTime = cooldowns.get(userId) + cooldownAmount;
  if (now < expirationTime) {
    return interaction.reply('⏰ Cooldown active');
  }
}

cooldowns.set(userId, now);
```

### 2. Permission Validation

```javascript
// Check Discord permissions
if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
  return interaction.reply('❌ Admin only');
}

// Check bot permissions
if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
  return interaction.reply('❌ Bot needs Manage Roles permission');
}
```

### 3. Input Validation

```javascript
// Validate slash command options
const amount = interaction.options.getInteger('amount');

if (amount < 10 || amount > 10000) {
  return interaction.reply('❌ Amount must be between 10 and 10,000');
}
```

### 4. Authentication

```javascript
// Backend API auth middleware
function isAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Guild access validation
function hasGuildAccess(req, res, next) {
  const guildId = req.params.guildId;
  const userGuilds = req.user.guilds;
  
  if (!userGuilds.some(g => g.id === guildId)) {
    return res.status(403).json({ error: 'No access to this guild' });
  }
  
  next();
}
```

## 📊 Data Flow Patterns

### 1. Database Synchronization

- **Single Source of Truth**: Simple-DB instance shared between bot and backend
- **Atomic Writes**: Temp file + rename for atomic updates
- **Auto-save**: Debounced saves on every mutation
- **Backup**: Hourly backups to `data/database-backup.json`

### 2. Caching Strategy

```javascript
// Stats cache (30s TTL)
const statsCache = {
  data: null,
  lastUpdate: null,
  
  get() {
    if (!this.data || Date.now() - this.lastUpdate > 30000) {
      this.refresh();
    }
    return this.data;
  },
  
  refresh() {
    this.data = calculateStats();
    this.lastUpdate = Date.now();
  }
};
```

### 3. Error Handling

```javascript
// Graceful degradation
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error);
  
  // Fallback behavior
  return defaultValue;
}

// Global error handler
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', error);
  // Don't crash, just log
});
```

## 🎯 Key Architectural Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Monorepo | All code in one repo | Larger repo size |
| Simple-DB | No external DB needed | Scale limitations |
| Socket.IO | Real-time bidirectional | Extra complexity |
| PM2 | Process management | Memory overhead |
| Next.js 14 | Latest features, App Router | Learning curve |
| Hybrid JS/TS | Gradual migration | Type safety gaps |
| GitHub Actions | Integrated CI/CD | GitHub dependency |
| VPS Deployment | Full control | Manual maintenance |

