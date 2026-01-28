# Tech Context - NeuroViaBot

## 🛠️ Kullanılan Teknolojiler

### Core Technologies

#### 1. Discord Bot (Backend)
- **Discord.js**: v14.15.0 - Discord API wrapper
- **Node.js**: >=16.0.0 - Runtime environment
- **Express.js**: v4.19.0 - HTTP API server
- **Socket.IO Client**: v4.7.0 - Real-time communication

#### 2. Backend API
- **Express.js**: v4.18.2 - Web framework
- **Socket.IO Server**: v4.8.1 - WebSocket server
- **Passport.js**: v0.7.0 - Authentication middleware
- **Passport-Discord**: v0.1.4 - Discord OAuth strategy

#### 3. Frontend Dashboard
- **Next.js**: v14.2.0 - React framework (App Router)
- **React**: v18.3.0 - UI library
- **TypeScript**: v5.6.0 - Type safety
- **Tailwind CSS**: v3.4.0 - Utility-first CSS
- **SCSS/Sass**: v1.69.5 - CSS preprocessor
- **Framer Motion**: v11.0.0 - Animation library

### Supporting Libraries

#### Bot Dependencies
```json
{
  "axios": "^1.7.0",           // HTTP client
  "cron": "^4.3.3",             // Scheduled tasks
  "dotenv": "^16.4.0",          // Environment variables
  "moment": "^2.30.0",          // Date/time handling
  "sequelize": "^6.35.1",       // ORM (legacy, not actively used)
  "sqlite3": "^5.1.6",          // SQLite driver (legacy)
  "winston": "^3.12.0"          // Logging
}
```

#### Frontend Dependencies
```json
{
  "@headlessui/react": "^2.0.0",      // UI components
  "@heroicons/react": "^2.1.0",       // Icons
  "chart.js": "^4.5.1",               // Charts
  "react-chartjs-2": "^5.3.0",        // React Chart.js wrapper
  "date-fns": "^3.0.0",               // Date utilities
  "next-auth": "^4.24.0",             // Authentication
  "recharts": "^2.15.4",              // Alternative charts
  "swr": "^2.2.0",                    // Data fetching
  "clsx": "^2.1.0"                    // Class name utility
}
```

#### Backend Dependencies
```json
{
  "cors": "^2.8.5",                   // CORS middleware
  "express-rate-limit": "^7.1.5",     // Rate limiting
  "express-session": "^1.17.3",       // Session management
  "session-file-store": "^1.5.0"      // File-based sessions
}
```

## 🚀 Geliştirme Kurulumu

### Ön Gereksinimler

1. **Node.js** >= 16.0.0
2. **npm** >= 8.0.0
3. **Git**
4. **Discord Bot Token** (Discord Developer Portal)
5. **Discord OAuth Credentials** (Client ID, Client Secret)

### Local Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/swaffX/neuroviabot-website.git
cd neuroviabot-website
```

#### 2. Install Dependencies

```bash
# Root (Bot)
npm install

# Backend
cd neuroviabot-backend
npm install

# Frontend
cd ../neuroviabot-frontend
npm install
```

#### 3. Environment Variables

**Root `.env` (Bot)**
```bash
# Discord Bot
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=773539215098249246

# Backend Connection
BACKEND_URL=http://localhost:5000
BOT_API_PORT=3002

# Optional
EMBED_COLOR=#7289DA
DAILY_AMOUNT=100
WORK_AMOUNT=50
```

**Backend `.env`**
```bash
# Server
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3001

# Discord OAuth
DISCORD_CLIENT_ID=773539215098249246
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_CALLBACK_URL=http://localhost:3001/api/auth/callback

# Session
SESSION_SECRET=your_session_secret
```

**Frontend `.env.local`**
```bash
# Next.js
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your_nextauth_secret

# Discord OAuth (NextAuth)
DISCORD_CLIENT_ID=773539215098249246
DISCORD_CLIENT_SECRET=your_client_secret
```

#### 4. Start Development Servers

**Terminal 1 - Bot:**
```bash
npm run dev
# or
node index.js
```

**Terminal 2 - Backend:**
```bash
cd neuroviabot-backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd neuroviabot-frontend
npm run dev
```

### Development URLs

- **Bot API**: http://localhost:3002
- **Backend API**: http://localhost:5000
- **Frontend Dashboard**: http://localhost:3001

## 🏗️ Build ve Deployment

### Build Commands

#### Frontend Build
```bash
cd neuroviabot-frontend
npm run build
npm start  # Production server
```

#### Bot/Backend
No build step needed (Node.js runtime)

### Production Deployment (PM2)

**PM2 Ecosystem Config** (`PM2-ECOSYSTEM.config.js`)
```javascript
module.exports = {
  apps: [
    {
      name: 'neuroviabot',
      script: './index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'neuroviabot-backend',
      script: './neuroviabot-backend/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M'
    },
    {
      name: 'neuroviabot-frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001',
      cwd: './neuroviabot-frontend',
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
```

**PM2 Commands:**
```bash
# Start all
pm2 start PM2-ECOSYSTEM.config.js

# Restart specific app
pm2 restart neuroviabot
pm2 restart neuroviabot-backend
pm2 restart neuroviabot-frontend

# View logs
pm2 logs neuroviabot
pm2 logs neuroviabot-backend
pm2 logs neuroviabot-frontend

# Monitor
pm2 monit

# Save and auto-start on reboot
pm2 save
pm2 startup
```

### GitHub Actions CI/CD

**Workflow** (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /root/neuroviabot
            git pull origin main
            npm install --production
            cd neuroviabot-backend && npm install --production
            cd ../neuroviabot-frontend && npm install --production && npm run build
            pm2 restart all
```

## 🔧 Teknik Kısıtlamalar

### Discord API Limits

1. **Rate Limits**
   - 50 requests per second (global)
   - Per-route rate limits (varies)
   - 5 concurrent identify requests

2. **Message Limits**
   - 2000 characters per message
   - 10 embeds per message
   - 25 fields per embed
   - 6000 characters total embed length

3. **Command Limits**
   - 100 global slash commands
   - 100 guild-specific slash commands per guild
   - 25 options per command
   - 10 sub-command groups per command

### Application Limits

1. **Database (Simple-DB)**
   - Single JSON file (not distributed)
   - Memory-based (all data in RAM)
   - ~100MB recommended max size
   - Single-process write lock

2. **Socket.IO**
   - Connection per client
   - No horizontal scaling (single server)
   - Room-based broadcasting only

3. **PM2**
   - Memory limits per process
   - No clustering (instances: 1)
   - Single VPS deployment

### Browser Compatibility

- **Chrome**: >= 90
- **Firefox**: >= 88
- **Safari**: >= 14
- **Edge**: >= 90
- **Mobile**: iOS Safari >= 14, Chrome Android >= 90

## 📦 Bağımlılıklar

### Runtime Dependencies

**Critical (Required):**
- discord.js
- express
- socket.io / socket.io-client
- next
- react
- passport / passport-discord

**Important (High Value):**
- axios (HTTP client)
- dotenv (env vars)
- framer-motion (animations)
- tailwindcss (styling)

**Optional (Nice to Have):**
- winston (logging)
- chart.js (analytics)
- moment (dates)

### Dev Dependencies

```json
{
  "nodemon": "^3.0.2",          // Auto-restart (dev)
  "eslint": "^8.57.0",          // Linting
  "concurrently": "^8.2.2",     // Run multiple commands
  "@types/node": "^20.0.0",     // TypeScript types
  "@types/react": "^18.3.0"     // React types
}
```

## 🧰 Araç Kullanım Kalıpları

### Logging Pattern

**Winston Logger:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Usage
logger.info('Bot started');
logger.error('Error occurred', { error: err.message });
```

### API Client Pattern (Frontend)

**Axios Instance:**
```typescript
// lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Data Fetching Pattern (SWR)

```typescript
import useSWR from 'swr';

function useGuildData(guildId: string) {
  const { data, error, mutate } = useSWR(
    `/api/guilds/${guildId}`,
    fetcher,
    {
      refreshInterval: 30000, // 30s
      revalidateOnFocus: false
    }
  );

  return {
    guild: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
}
```

### Socket Connection Pattern

**Frontend Socket Context:**
```typescript
const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
  withCredentials: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Connected to backend');
  socket.emit('join_guild', guildId);
});

socket.on('settings_changed', (data) => {
  // Update local state
  setSettings(data.settings);
});
```

## 🔐 Environment Configuration

### Required Environment Variables

#### Bot (.env)
```
DISCORD_TOKEN=required
DISCORD_CLIENT_ID=required
BACKEND_URL=optional (default: http://localhost:5000)
```

#### Backend (.env)
```
DISCORD_CLIENT_ID=required
DISCORD_CLIENT_SECRET=required
DISCORD_CALLBACK_URL=required
SESSION_SECRET=required
FRONTEND_URL=optional (default: http://localhost:3001)
PORT=optional (default: 5000)
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=required
DISCORD_CLIENT_ID=required
DISCORD_CLIENT_SECRET=required
NEXTAUTH_URL=required
NEXTAUTH_SECRET=required
```

### Optional Environment Variables

#### Bot
```
EMBED_COLOR=#7289DA
DAILY_AMOUNT=100
WORK_AMOUNT=50
MAX_BET=1000
LOG_LEVEL=INFO
BOT_API_PORT=3002
```

#### Backend
```
NODE_ENV=production
RATE_LIMIT=100
```

## 🗄️ Database Structure

### Simple-DB Schema

```javascript
{
  data: {
    // Core Collections (Maps)
    guilds: Map<guildId, GuildData>,
    users: Map<userId, UserData>,
    guildMembers: Map<`${guildId}_${userId}`, MemberData>,
    
    // Feature Collections
    settings: Map<guildId, SettingsData>,
    economy: Map<userId, EconomyData>,
    leveling: Map<`${guildId}_${userId}`, LevelingData>,
    
    // Systems
    auditLogs: Map<logId, AuditLog>,
    userPremium: Map<userId, PremiumData>,
    guildPremium: Map<guildId, PremiumData>,
    
    // Marketplace & Trading
    marketListings: Map<listingId, Listing>,
    tradeHistory: Map<tradeId, Trade>,
    
    // Quests & Achievements
    quests: Map<questId, Quest>,
    userQuests: Map<`${userId}_${questId}`, QuestProgress>,
    achievements: Map<achievementId, Achievement>,
    
    // Moderation
    warnings: Map<warningId, Warning>,
    moderationCases: Map<caseId, ModerationCase>,
    tempBans: Map<banId, TempBan>,
    
    // Features
    tickets: Map<ticketId, Ticket>,
    giveaways: Map<giveawayId, Giveaway>,
    reactionRoles: Map<messageId, ReactionRoleData>,
    customCommands: Map<`${guildId}_${commandName}`, CustomCommand>
  }
}
```

## 🧪 Testing Strategy

### Manual Testing (Current)
- Local development testing
- Production smoke tests
- Feature testing in test Discord server

### Future Testing (Planned)
- Jest unit tests
- Integration tests (Supertest)
- E2E tests (Playwright)
- Load testing

## 📊 Performance Considerations

### Optimization Strategies

1. **Caching**
   - Stats cache (30s TTL)
   - SWR client-side caching
   - Database query results

2. **Code Splitting**
   - Next.js automatic code splitting
   - Dynamic imports for heavy components
   - Route-based splitting

3. **Image Optimization**
   - Next.js Image component
   - WebP format
   - Lazy loading

4. **Database**
   - Map-based lookups (O(1))
   - Debounced saves (5s delay)
   - Atomic writes

5. **API**
   - Rate limiting
   - Pagination for large datasets
   - Compression (gzip)

## 🔄 Version Control & Deployment

### Git Workflow

```
main branch (production)
    ↓
Feature branches
    ↓
Commit → Push → GitHub Actions → Deploy to VPS
```

### Deployment Flow

```
git push origin main
    ↓
GitHub Actions triggered
    ↓
SSH into VPS
    ↓
git pull
    ↓
npm install (all 3 projects)
    ↓
npm run build (frontend only)
    ↓
pm2 restart all
    ↓
✅ Deployment complete
```

## 📚 Documentation

### Code Documentation
- Inline comments (Turkish)
- JSDoc for complex functions
- Type definitions (TypeScript)

### External Documentation
- README.md files (each project)
- Deployment guides (DEPLOYMENT.md, VPS-SETUP-GUIDE.md)
- API documentation (in progress)
- User guides (planned)

### Memory Bank (This)
- Architecture documentation
- Technical decisions
- Patterns and practices
- Project context

