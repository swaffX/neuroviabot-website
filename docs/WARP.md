# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NeuroViaBot is a full-stack Discord bot application with moderation, economy, leveling, gaming features, and NFT marketplace. The project consists of three main components deployed on VPS via GitHub Actions and webhook system.

**Repository**: https://github.com/kxrk0/neuroviabot-discord

**Tech Stack:**
- **Bot**: Discord.js v14, JSON-based database (simple-db), Node.js v16+, SQLite fallback
- **Backend**: Express.js, MongoDB (Mongoose), Socket.IO, Discord OAuth (Passport.js), Session file store
- **Frontend**: Next.js 15 (React 19), TypeScript, TailwindCSS, Socket.IO client, NextAuth
- **Infrastructure**: PM2 process manager, Caddy reverse proxy, GitHub Actions CI/CD

## CI/CD & Deployment

### GitHub Actions Workflows

The project uses separate GitHub Actions workflows for each component. All workflows trigger on push to `main` branch.

**Active Workflows:**

1. **`.github/workflows/deploy-bot.yml`**
   - Triggers: Changes to `index.js`, `src/**`, `package.json`, or workflow file
   - VPS path: `/root/neuroviabot/bot`
   - Steps: Git pull → Clean deps → `npm install --production` → PM2 restart
   - Service: `neuroviabot`

2. **`.github/workflows/deploy-backend.yml`**
   - Triggers: Changes to `neuroviabot-backend/**` or workflow file
   - VPS path: `/root/neuroviabot/bot/neuroviabot-backend`
   - Steps: Git pull → Clean deps → `npm install --production` → PM2 restart
   - Service: `neuroviabot-backend`

3. **`.github/workflows/deploy-frontend.yml`**
   - Triggers: Changes to `neuroviabot-frontend/**` or workflow file
   - VPS path: `/root/neuroviabot/bot/neuroviabot-frontend`
   - Steps: Git pull → Clean build → `npm install --legacy-peer-deps` → `npm run build` → PM2 restart
   - Service: `neuroviabot-frontend`
   - **Note**: Uses `--legacy-peer-deps` due to React 19 peer dependency conflicts

4. **`.github/workflows/diagnose-frontend.yml`**
   - Manual trigger only (`workflow_dispatch`)
   - Diagnostic tool: Checks Node/NPM versions, disk space, memory, directory structure, PM2 status

**Workflow Features:**
- SSH-based deployment using `appleboy/ssh-action@v1.0.3`
- Automatic retry on git pull failures (uses `git stash` fallback)
- Post-deployment verification (PM2 status checks, log tailing)
- Deployment summaries in GitHub Actions UI
- Secrets: `VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`, `VPS_PORT`

### Webhook Deployment (Alternative)

**Primary deployment method** for stability. Located at `webhook-deploy.js`.

**How it works:**
1. GitHub sends webhook on push to `main`
2. VPS webhook server (port 9000) receives request
3. Validates HMAC SHA256 signature using `SESSION_SECRET`
4. Executes deployment pipeline:
   - Git pull (with stash fallback)
   - Install dependencies for all components
   - Build frontend
   - Restart all PM2 services
   - Save PM2 configuration

**Webhook Configuration:**
- Endpoint: `POST https://neuroviabot.xyz/webhook` (via Caddy proxy on port 80)
- Health check: `GET https://neuroviabot.xyz/health`
- PM2 service: `webhook-deploy`
- Secret validation: Required `SESSION_SECRET` in `.env`

**Why webhook over GitHub Actions?**
Webhook system is more reliable for this VPS setup. GitHub Actions had SSH connection issues (`connection reset by peer`), but both systems are maintained for flexibility.

### VPS Infrastructure

**Process Management (PM2):**
```bash
PM2_ECOSYSTEM.config.js defines 4 services:
- neuroviabot (bot) → /root/neuroviabot/bot
- neuroviabot-backend → /root/neuroviabot/bot/neuroviabot-backend
- neuroviabot-frontend → /root/neuroviabot/bot/neuroviabot-frontend  
- webhook-deploy → /root/neuroviabot/bot/webhook-deploy.js
```

**Reverse Proxy (Caddy):**
- Domain: `neuroviabot.xyz` (with www redirect)
- Frontend: Port 3001 → Catch-all `/*`
- Backend API: Port 5000 → `/api/*` and `/socket.io/*`
- Webhook: Port 9000 → `/webhook` (IP-based on port 80)
- SSL: Auto-managed by Caddy
- Security headers: HSTS, CSP, XSS protection

## Development Commands

### Bot (Root Directory)

```bash
# Start bot in production mode
npm start

# Start bot in development mode with auto-reload
npm run dev

# Lint bot code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Run single test (no tests currently available)
npm test
```

### Backend API (`neuroviabot-backend/`)

```bash
# Start backend server
npm start

# Development mode with nodemon
npm run dev

# Initialize MongoDB database
npm run init-db

# Migrate from SQLite to MongoDB
npm run migrate
```

### Frontend Dashboard (`neuroviabot-frontend/`)

```bash
# Development mode (starts frontend + backend concurrently)
npm run dev

# Frontend only on port 3001 with Turbo
npm run dev:frontend

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Clean build artifacts and dependencies
npm run clean
```

### PM2 Deployment (Production)

```bash
# Start all services (bot, backend, frontend, webhook)
pm2 start PM2-ECOSYSTEM.config.js

# Monitor services
pm2 monit

# View logs
pm2 logs neuroviabot
pm2 logs neuroviabot-backend
pm2 logs neuroviabot-frontend

# Restart specific service
pm2 restart neuroviabot
```

## Architecture Overview

### Bot Architecture

**Entry Point**: `index.js` initializes the Discord client, loads commands/events, and starts the bot.

**Command System:**
- Commands are dynamically loaded from `src/commands/*.js`
- Commands are automatically categorized and registered as Discord slash commands
- All commands use Discord.js SlashCommandBuilder format
- Hot-reloading supported via `commandWatcher.js`
- Command queue system prevents rate limiting (`commandQueueManager.js`)

**Event System:**
- Events in `src/events/*.js` are automatically loaded and registered
- Key events: `ready.js`, `interactionCreate.js`, `messageCreate.js`, `guildMemberAdd.js`
- `interactionCreate.js` handles slash commands, select menus, and feature/permission checks

**Handler Pattern:**

Handlers in `src/handlers/*.js` implement bot feature logic. They are stateless modules called by commands and events.

**Handler Categories:**
- **Core Features**: `moderationHandler.js`, `ticketHandler.js`, `welcomeHandler.js`, `levelingHandler.js`, `verificationHandler.js`
- **Economy System**: `nrcCoinHandler.js`, `investmentHandler.js`, `marketHandler.js`, `tradingHandler.js`
- **NFT & Premium**: `nftHandler.js`, `premiumHandler.js`
- **Gamification**: `questHandler.js`, `questProgressHandler.js`, `achievementHandler.js`, `activityRewardHandler.js`
- **Engagement**: `giveawayHandler.js`, `reactionRoleHandler.js`, `roleReactionHandler.js`
- **Security**: `autoModHandler.js`, `guardHandler.js`, `raidProtectionHandler.js`
- **Automation**: `customCommandHandler.js`, `tempBanScheduler.js`, `backupHandler.js`
- **Analytics**: `analyticsHandler.js`, `serverStatsHandler.js`, `loggingHandler.js`, `auditLogHandler.js`
- **Integration**: `realtimeSync.js` - Syncs data to backend via Socket.IO

**Database Layer:**

**Primary Database: Simple-DB** (`src/database/simple-db.js`)
- **Type**: JSON file-based database with in-memory Map structures
- **Location**: `data/database.json` (auto-created on first run)
- **Backup**: `data/database-backup.json` (automatic on each save)
- **Auto-save**: Every 5 minutes
- **Shared**: Bot and backend use same database instance via singleton pattern

**Data Collections (Maps):**
- User data: `users`, `userEconomy`, `neuroCoinBalances`, `userInventory`, `userProfiles`, `userStats`, `userPremium`
- Guild data: `guilds`, `guildMembers`, `guildSettings`, `guildPremium`, `guildTreasury`, `serverMarketConfig`
- Features: `warnings`, `tickets`, `giveaways`, `customCommands`, `reactionRoles`, `tempBans`
- Economy: `neuroCoinTransactions`, `marketplaceListings`, `tradeHistory`, `investments`, `loans`, `stakingPositions`, `stakingPools`
- NFT: `nftCollections`, `userCollections`, `nftListings`
- Gamification: `achievements`, `dailyStreaks`, `questProgress`, `questTemplates`, `gameStats`, `tournamentHistory`, `activityRewards`
- Moderation: `auditLogs`, `automodSettings`, `automodViolations`
- Content: `cmsContent`, `activityFeed`

**Model Layer** (`src/models/index.js`)
- Wrapper functions over simple-db for cleaner API
- Models: `User`, `Guild`, `GuildMember`, `Economy`, `Warning`, `Settings`, `Ticket`, `Giveaway`, `CustomCommand`
- Provides: `findOrCreate`, `findById`, `update`, `count`, and collection-specific methods
- Helper functions: `getOrCreateUser`, `getOrCreateGuild`, `getDatabaseStats`, `createBackup`

**Sequelize/SQLite** (`src/database/connection.js`)
- Legacy system, still present but `simple-db` is primary
- Used for specific features requiring relational queries
- Location: `src/database/bot_database.sqlite`

**Configuration:**
- Main config: `src/config.js` (economy, moderation, premium settings, feature flags)
- Environment variables: `.env` (DISCORD_TOKEN, DISCORD_CLIENT_ID, etc.)
- Guild-specific features stored in database, not config file

**Utilities:**
- `src/utils/logger.js`: Winston-based logging system
- `src/utils/commandQueueManager.js`: Rate limit protection for command registration
- `src/utils/commandCategorizer.js`: Auto-categorize commands by functionality
- `src/utils/realtime.js`: Real-time sync between bot and backend
- `src/utils/analytics.js`: Event tracking and analytics
- `src/utils/security.js`: Permission and security utilities

### Backend Architecture

**Entry Point**: `neuroviabot-backend/index.js` starts Express server, Socket.IO, and Discord OAuth.

**API Structure:**
- RESTful API endpoints for dashboard communication
- Discord OAuth2 authentication via Passport.js
- Session management with file-based storage (`sessions/`)
- Real-time updates via Socket.IO
- CORS configured for frontend origin

**Database:**
- Primary: MongoDB (Mongoose) for production analytics and user data
- Shared: Simple-db (JSON) synced with main bot for real-time data
- Auto-initialization: `npm run init-db` (creates MongoDB collections)
- Migration: `npm run migrate` (SQLite to MongoDB)

**API Routes** (`neuroviabot-backend/routes/`):
- **Auth**: `auth.js` - Discord OAuth login/logout via Passport
- **Bot**: `bot.js`, `bot-commands.js`, `bot-proxy.js` - Bot status, command execution
- **Guilds**: `guilds.js`, `guild-settings.js`, `guild-management.js` - Server configuration
- **Moderation**: `moderation.js`, `audit-log.js` - Moderation actions and logs
- **Economy**: `neurocoin.js`, `nrc-coin.js`, `nrc-trading.js`, `marketplace.js` - NRC economy system
- **NFT**: `nrc.js`, `nrc-admin.js` - NFT collections and trading
- **Features**: `leveling.js`, `quests.js`, `reaction-roles.js`, `premium.js` - Bot features
- **Dashboard**: `server-stats.js`, `analytics.js`, `database.js` - Statistics and data
- **Content**: `cms.js`, `feedback.js`, `contact.js` - User-generated content
- **Dev**: `developer.js`, `developer-marketplace.js`, `marketplace-requests.js` - Developer portal
- **System**: `health.js`, `diagnostic.js` - Health checks and diagnostics

**Real-time Sync:**
- `socket.js` manages Socket.IO connections
- Bi-directional communication between backend and bot
- Live updates for dashboard (guild stats, moderation actions, economy transactions)

### Frontend Architecture

**Framework**: Next.js 15 with App Router, React 19, TypeScript.

**Key Features:**
- Discord OAuth authentication via NextAuth
- Real-time dashboard updates via Socket.IO
- Server-side rendering and static generation
- TailwindCSS with SCSS design system
- Chart.js and Recharts for data visualization

**Important Directories:**
- `app/`: Next.js 15 App Router pages
- `components/`: Reusable React components
- `lib/`: Utility functions, API clients, NextAuth config
- `public/`: Static assets (images, icons)

**Frontend Pages** (`neuroviabot-frontend/app/`):
- **Public**: `/` (home), `/ozellikler`, `/komutlar`, `/premium`, `/hakkimizda`, `/iletisim`, `/kariyer`, `/blog`
- **Legal**: `/terms`, `/privacy`
- **Dashboard**: `/dashboard` - Main dashboard, `/manage` - Server management
- **Features**: `/servers`, `/leaderboard`, `/quests`, `/marketplace`, `/neurocoin`
- **User**: `/profile`, `/login`
- **Content**: `/geri-bildirim` (feedback), `/destek` (support)
- **Developer**: `/dev`, `/dev-panel`, `/api-dokumantasyon`
- **API**: `/api/*` - NextAuth and API routes

**Data Fetching:**
- SWR for client-side data fetching and caching
- Axios for API requests to backend
- Socket.IO client for real-time updates

## Deployment Considerations

### Environment Variables

**Bot (.env):**
- `DISCORD_TOKEN`: Bot token (required)
- `DISCORD_CLIENT_ID`: Application ID (required)
- `EMBED_COLOR`: Default embed color
- Economy settings: `DAILY_AMOUNT`, `WORK_AMOUNT`, etc.
- Feature flags: `PREMIUM_ENABLED`, `AUTO_MOD`, `LOGGING_ENABLED`

**Backend (neuroviabot-backend/.env):**
- `MONGODB_URI`: MongoDB connection string
- `SESSION_SECRET`: Session encryption key
- `DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET`: OAuth credentials
- `FRONTEND_URL`: Frontend origin for CORS
- `PORT`: Backend port (default 5000)

**Frontend (neuroviabot-frontend/.env.local):**
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXTAUTH_SECRET`: NextAuth encryption key
- `NEXTAUTH_URL`: Frontend URL
- Discord OAuth credentials

### Production Setup

- All services run via PM2 with ecosystem config
- Caddy reverse proxy handles SSL and routing
- Database backups managed by `backupHandler.js`
- Logs stored in `logs/` directory
- Webhook deployment available via `webhook-deploy.js`

## Development Patterns

### Adding a New Command

1. Create file in `src/commands/newcommand.js`
2. Export object with `data` (SlashCommandBuilder) and `execute` function
3. Optionally add `category`, `cooldown`, `permissions` properties
4. Command is auto-loaded and registered on bot restart
5. Implement handler logic in `src/handlers/` if complex

### Adding a New Handler

1. Create file in `src/handlers/newhandler.js`
2. Export functions that can be called by commands/events
3. Import and use in relevant commands or events
4. Handlers should be stateless and use database for persistence

### Database Models

- Define Sequelize models in `src/models/`
- Export model in `src/models/index.js`
- Models auto-sync on bot startup
- Use migrations for schema changes in production

### Real-time Features

- Bot emits events via Socket.IO through backend
- Backend relays to connected dashboard clients
- Frontend listens to specific event channels
- Use `src/utils/realtime.js` for bot-side emission

## Common Issues & Troubleshooting

### Command Registration

**Symptoms**: New commands not appearing in Discord
- Global registration delay: Up to 1 hour
- Solution: Use guild-specific registration for testing
- Manual trigger: `node all-guilds-register.js`
- Check queue: Logs from `commandQueueManager.js`
- Verify: Check `client.commands` collection in bot logs

### Database Issues

**Simple-DB not saving:**
- Check `data/` directory permissions
- Verify auto-save interval is running (every 5 min)
- Manual save: Call `db.saveData()` via bot command
- Check logs for "Database kaydedildi" confirmation

**Data corruption:**
- Automatic backup: `data/database-backup.json`
- Restore: Copy backup to `database.json` and restart
- Bot automatically tries backup on load failure

**MongoDB connection fails (backend):**
- Verify `MONGODB_URI` in backend `.env`
- Run: `npm run init-db` in backend directory
- Fallback: Backend uses simple-db if MongoDB unavailable
- Check: Backend logs show "MongoDB Connected" or "Using Simple-DB"

### Frontend Build Issues

**Build fails with peer dependency errors:**
- React 19 causes peer dependency conflicts
- Always use: `npm install --legacy-peer-deps`
- If persists: Delete `node_modules`, `package-lock.json`, `.next`
- Rebuild: `npm install --legacy-peer-deps && npm run build`

**"Module not found" errors:**
- Check imports use correct case (Windows vs Linux)
- Verify `tsconfig.json` path aliases
- Clear Next.js cache: `rm -rf .next`

**PM2 can't find frontend:**
- Verify `.next` directory exists after build
- Check `PM2-ECOSYSTEM.config.js` paths are absolute
- Ensure Next.js bin exists: `node_modules/.bin/next`

### PM2 Issues

**Service not starting:**
```bash
pm2 logs [service-name]  # Check error logs
pm2 describe [service-name]  # Detailed status
pm2 delete [service-name]  # Remove
pm2 start PM2-ECOSYSTEM.config.js --only [service-name]  # Recreate
```

**High memory usage:**
- Bot default: 500MB limit
- Backend: 400MB limit
- Frontend: 300MB limit
- Edit limits in `PM2-ECOSYSTEM.config.js`
- Restart: `pm2 restart [service-name] --update-env`

**Services not restarting after deployment:**
- Verify PM2 is saved: `pm2 save`
- Check ecosystem config syntax
- Manual restart: `pm2 restart all`
- Logs: Check `/logs/pm2-*.log` files

### GitHub Actions Failures

**SSH connection timeout:**
- Verify `VPS_HOST`, `VPS_SSH_KEY` secrets
- Check VPS firewall allows GitHub IP ranges
- Test SSH manually: `ssh -i key user@host`
- Fallback: Use webhook deployment instead

**Build succeeds but service offline:**
- Check PM2 logs on VPS
- Verify environment variables are set
- Ensure ports 3001, 5000, 9000 are available
- Check Caddy proxy configuration

### Webhook Deployment Issues

**Webhook not triggering:**
- Verify GitHub webhook configured: `https://neuroviabot.xyz/webhook`
- Check webhook secret matches `SESSION_SECRET` in `.env`
- Test: `curl https://neuroviabot.xyz/health`
- Logs: `pm2 logs webhook-deploy`

**Signature validation fails:**
- Ensure `SESSION_SECRET` matches GitHub webhook secret
- Check webhook headers: `X-Hub-Signature-256`
- Verify HMAC SHA256 calculation in `webhook-deploy.js`

### Real-time Sync Issues

**Dashboard not updating:**
- Check Socket.IO connection in browser console
- Verify backend is running: `pm2 status neuroviabot-backend`
- Check CORS: Frontend origin must be in `allowedOrigins`
- Backend logs: Look for Socket.IO connection messages

**Bot changes not reflecting in dashboard:**
- Verify `realtimeSync.js` is emitting events
- Check backend `socket.js` is relaying events
- Ensure database is shared (not separate instances)
- Test: Make change in bot, check `data/database.json`

## Important Development Notes

### Feature Toggle System

**Guild-specific features** are stored in database, NOT in `src/config.js`:
- `config.js` only provides **default values** for new guilds
- Each guild manages its own feature flags in `guildSettings` table
- To check feature status: Query `db.getGuildSettings(guildId)`
- Do NOT rely on `config.features` at runtime (it never changes)

### Shared Database Architecture

**Critical**: Bot and backend share the SAME database instance:
- Both load `src/database/simple-db.js` via singleton pattern
- Changes in bot reflect immediately in backend and vice versa
- File: `data/database.json` (shared read/write)
- Auto-save every 5 minutes prevents data loss
- **Never** create separate database instances

### Real-time Communication

Bot ↔ Backend ↔ Frontend sync via Socket.IO:
1. Bot makes changes to database
2. Bot emits event via `src/utils/realtime.js`
3. Backend receives event and relays to frontend clients
4. Frontend updates UI in real-time
5. Example: Economy transactions, moderation actions, level-ups

### Command Registration

- Commands auto-register on bot startup
- Global commands: Up to 1 hour delay
- Guild commands: Instant (use for testing)
- Queue system prevents rate limiting (`commandQueueManager.js`)
- Manual registration: `node all-guilds-register.js`
- Hot-reload: `commandWatcher.js` detects file changes

### Utility Scripts (`scripts/`)

**Deployment:**
- `vps-setup.sh` - Initial VPS configuration
- `manual-deploy.sh` / `manual-deploy.ps1` - Manual deployment
- `deploy-website.sh` - Frontend deployment helper

**Fixes:**
- `EMERGENCY-FIX.sh` - Emergency repair script
- `fix-frontend-build.sh` - Resolve frontend build issues
- `fix-frontend-pm2.sh` - PM2 frontend service repair
- `rebuild-frontend.sh` - Complete frontend rebuild

**Maintenance:**
- `cleanup.sh` - Clean temporary files
- `backup-old-handlers.sh` - Backup handler files
- `quick-start.sh` - Quick development startup

## Code Style

**Language & Comments:**
- Bot code uses **Turkish comments** (maintain consistency)
- Frontend/Backend: English or Turkish (mixed)
- User-facing messages: Turkish

**Logging:**
- Use Winston logger: `logger.info()`, `logger.error()`, `logger.debug()`
- Never use `console.log()` in production code
- Log levels: ERROR, WARN, INFO, DEBUG

**Async Patterns:**
- Async/await preferred over promise chains
- Always wrap in try-catch with proper error logging
- Example:
  ```javascript
  try {
    await someAsyncOperation();
    logger.info('Operation successful');
  } catch (error) {
    logger.error('Operation failed', error);
    // Handle error
  }
  ```

**Discord Interactions:**
- Ephemeral responses for errors/private info: `{ flags: 64 }` or `{ ephemeral: true }`
- First response: `interaction.reply()`
- Subsequent: `interaction.followUp()`
- Check before replying: `if (!interaction.replied && !interaction.deferred)`
- Defer for long operations: `await interaction.deferReply()`

## Key Architecture Patterns

### Data Flow

```
Discord User Interaction
  ↓
Discord.js Event (interactionCreate)
  ↓
Command Execution (src/commands/*.js)
  ↓
Handler Logic (src/handlers/*.js)
  ↓
Database Update (simple-db)
  ↓
Real-time Emit (realtimeSync.js)
  ↓
Backend Socket.IO (socket.js)
  ↓
Frontend Dashboard Update
```

### Command Structure Template

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  // Command metadata
  data: new SlashCommandBuilder()
    .setName('command-name')
    .setDescription('Command description'),
  
  // Optional properties
  category: 'Category Name',
  cooldown: 5, // seconds
  permissions: ['Administrator'],
  
  // Execution logic
  async execute(interaction) {
    try {
      // Defer if operation takes time
      await interaction.deferReply({ ephemeral: true });
      
      // Business logic
      const result = await someHandler.doSomething();
      
      // Respond
      await interaction.editReply({
        content: 'Success!',
        embeds: [/* ... */]
      });
    } catch (error) {
      logger.error('Command error', error);
      
      const errorMsg = { content: 'An error occurred!', ephemeral: true };
      if (interaction.deferred) {
        await interaction.editReply(errorMsg);
      } else if (!interaction.replied) {
        await interaction.reply(errorMsg);
      }
    }
  }
};
```

### Handler Pattern Template

```javascript
const { logger } = require('../utils/logger');
const db = require('../database/simple-db');

// Stateless functions
async function doSomething(userId, guildId, data) {
  try {
    // Get data from database
    const user = await db.getUser(userId);
    
    // Business logic
    const result = processData(user, data);
    
    // Update database
    await db.updateUser(userId, result);
    
    // Emit real-time event
    const realtime = require('../utils/realtime');
    realtime.emit('user:updated', { userId, guildId, data: result });
    
    return result;
  } catch (error) {
    logger.error('Handler error', error);
    throw error;
  }
}

module.exports = {
  doSomething,
  // ... other functions
};
```

### Real-time Event Emission

**Bot side** (`src/utils/realtime.js`):
```javascript
const realtime = require('../utils/realtime');
realtime.emit('event:name', { data });
```

**Backend receives and relays** (`neuroviabot-backend/socket.js`):
```javascript
io.emit('event:name', { data }); // Broadcast to all clients
```

**Frontend listens** (React component):
```javascript
useEffect(() => {
  socket.on('event:name', (data) => {
    // Update UI
  });
  
  return () => socket.off('event:name');
}, []);
```

## Environment Setup Checklist

### Local Development

1. **Bot (.env)**:
   ```
   DISCORD_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=your_client_id
   EMBED_COLOR=#7289DA
   ```

2. **Backend (neuroviabot-backend/.env)**:
   ```
   MONGODB_URI=mongodb://localhost:27017/neuroviabot
   SESSION_SECRET=random_secret_key
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_CLIENT_SECRET=your_client_secret
   FRONTEND_URL=http://localhost:3001
   PORT=5000
   ```

3. **Frontend (neuroviabot-frontend/.env.local)**:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXTAUTH_SECRET=random_secret_key
   NEXTAUTH_URL=http://localhost:3001
   DISCORD_CLIENT_ID=your_client_id
   DISCORD_CLIENT_SECRET=your_client_secret
   ```

### Production (VPS)

- All services run under PM2
- Caddy handles SSL and reverse proxy
- Environment files must be in place before PM2 start
- Database: `data/database.json` must be writable
- Logs: `/logs/` directory for PM2 logs

## Quick Reference

### Most Used Commands

```bash
# Development
npm run dev              # Start bot with nodemon
cd neuroviabot-backend && npm run dev   # Backend dev mode
cd neuroviabot-frontend && npm run dev  # Frontend + backend

# Production
pm2 start PM2-ECOSYSTEM.config.js      # Start all services
pm2 logs                                # View all logs
pm2 monit                               # Monitor resources
pm2 restart all --update-env            # Restart with new env vars

# Deployment
git push origin main                    # Triggers webhook/GitHub Actions
node all-guilds-register.js             # Register commands

# Troubleshooting
pm2 logs webhook-deploy                 # Check webhook logs
pm2 logs neuroviabot                    # Check bot logs
pm2 describe neuroviabot-frontend       # Detailed service info
tail -f logs/pm2-error.log              # Watch error logs
```

### Important Files

- `index.js` - Bot entry point
- `src/config.js` - Bot configuration (defaults only)
- `src/database/simple-db.js` - Shared database implementation
- `src/models/index.js` - Database model layer
- `PM2-ECOSYSTEM.config.js` - Production process config
- `webhook-deploy.js` - Webhook deployment server
- `Caddyfile` - Reverse proxy configuration
- `.github/workflows/` - CI/CD pipelines

### Key URLs

- **Production**: https://neuroviabot.xyz
- **API**: https://neuroviabot.xyz/api/*
- **Webhook**: https://neuroviabot.xyz/webhook (port 80)
- **Repository**: https://github.com/kxrk0/neuroviabot-discord

---

**Last Updated**: For current project state, always check latest commit and deployment logs.
