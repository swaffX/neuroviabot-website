<!-- 0545a770-c5df-45a3-ba51-ff9d1cc27cb0 f935bc05-8879-43ec-ba87-0cdf34a0c351 -->
# Phase 3 Commit & Phase 4: Developer Bot Management Panel

## Step 1: Commit & Push Phase 3

Commit message:

```
feat: Phase 3 Complete - NRC Economy Full Trading Ecosystem

- Add /trade command with P2P trading & escrow
- Add /invest command with staking & loan system  
- Update shop with 25+ NRC items (cosmetic, boost, feature, collectible, utility)
- Add marketplace tax & guild treasury system
- Add Economy Dashboard Panel (frontend)
- Add economy API endpoints
- Update database with staking, loan, treasury support
```

Files to commit:

- `src/commands/trade.js` (new)
- `src/commands/invest.js` (new)
- `src/commands/shop.js` (updated)
- `src/database/simple-db.js` (updated)
- `src/routes/marketplace.js` (updated)
- `src/routes/economy-api.js` (new)
- `src/handlers/tradingHandler.js` (existing)
- `src/events/interactionCreate.js` (updated)
- `neuroviabot-frontend/components/dashboard/EconomyPanel.tsx` (new)
- `index.js` (updated)
- `PHASE-3-ECONOMY-COMPLETE.md` (new)

## Step 2: Phase 4.1 - Secure Access Control

Create developer authentication middleware:

**File:** `neuroviabot-backend/middleware/developerAuth.js`

```javascript
const DEVELOPER_IDS = ['315875588906680330', '413081778031427584'];

function requireDeveloper(req, res, next) {
    const userId = req.session?.user?.id || req.headers['x-user-id'];
    
    if (!DEVELOPER_IDS.includes(userId)) {
        return res.status(403).json({ 
            success: false, 
            error: 'Developer access required' 
        });
    }
    
    next();
}
```

**File:** `neuroviabot-frontend/components/layout/DeveloperMenu.tsx`

- Check if current user ID is in developer list
- Show "Bot Yönetim Paneli" menu item in profile dropdown
- Hide from non-developers

## Step 3: Phase 4.2 - Bot Management Dashboard (Backend)

Create developer API routes:

**File:** `neuroviabot-backend/routes/developer.js`

Endpoints:

- `GET /api/dev/bot-stats` - Bot uptime, memory, CPU, latency, shards
- `GET /api/dev/guilds` - All guilds with member counts, features
- `GET /api/dev/commands` - All commands with usage stats
- `POST /api/dev/commands/:name/toggle` - Enable/disable command
- `POST /api/dev/commands/:name/update` - Edit command description
- `GET /api/dev/database/schema` - Get all table schemas
- `POST /api/dev/database/query` - Execute read query
- `POST /api/dev/database/backup` - Create database backup
- `POST /api/dev/database/restore` - Restore from backup
- `POST /api/dev/system/restart` - Restart bot
- `POST /api/dev/system/clear-cache` - Clear all caches
- `POST /api/dev/system/sync-commands` - Force sync slash commands
- `GET /api/dev/logs` - Get recent logs (last 100)
- `GET /api/dev/logs/download` - Download full log file

**File:** `src/routes/developer-bot-api.js` (bot side)

- Mirror endpoints to access bot internals
- Get process.memoryUsage(), process.uptime()
- Access client.guilds, client.commands
- Implement restart logic with process.exit(0) and PM2 auto-restart
- Cache management functions

## Step 4: Phase 4.3 - Real-time Socket Infrastructure

Add Socket.IO events for real-time monitoring:

**File:** `neuroviabot-backend/socket/developerEvents.js`

Events to emit:

- `dev:bot_stats` - Every 5s (memory, CPU, uptime, guilds count)
- `dev:command_executed` - Real-time command logs
- `dev:error_occurred` - Error notifications with stack trace
- `dev:guild_joined` / `dev:guild_left` - Guild events
- `dev:database_query` - Query execution results

**File:** `index.js` (bot)

- Emit command execution via Socket.IO
- Emit errors to developer channel
- Emit guild join/leave events

## Step 5: Phase 4.4 - Frontend Dashboard Pages

Create developer panel pages:

**Page:** `neuroviabot-frontend/app/dev/page.tsx`

- Overview dashboard with key metrics
- Quick actions: restart bot, clear cache, sync commands
- Recent errors list
- Guild join/leave activity

**Page:** `neuroviabot-frontend/app/dev/bot-stats/page.tsx`

- Real-time bot metrics (Socket.IO)
- Memory usage graph (Chart.js)
- CPU usage chart
- Uptime counter
- Shard information (if applicable)
- Latency to Discord API

**Page:** `neuroviabot-frontend/app/dev/commands/page.tsx`

- List all commands with filters
- Usage statistics per command
- Enable/disable toggles
- Edit command descriptions
- Create new commands (advanced)

**Page:** `neuroviabot-frontend/app/dev/database/page.tsx`

- Schema viewer (tables, columns, types)
- Query builder interface with SQL editor
- Execute read-only queries
- View query results in table
- Backup/restore controls with confirmation dialogs
- Recent query history

**Page:** `neuroviabot-frontend/app/dev/guilds/page.tsx`

- All guilds list with search/filter
- Guild details: members, channels, roles count
- Quick actions: view settings, manage features
- Bulk settings template application
- Premium guild management

**Page:** `neuroviabot-frontend/app/dev/logs/page.tsx`

- Real-time log viewer (Socket.IO stream)
- Filter by level (info, warn, error)
- Search logs
- Download full log file
- Auto-scroll toggle

## Step 6: Components & Integration

**Component:** `neuroviabot-frontend/components/dev/SystemControls.tsx`

- Restart Bot button (with confirmation)
- Clear Cache button
- Force Sync Commands button
- Download Logs button
- Each action shows loading state and success/error toast

**Component:** `neuroviabot-frontend/components/dev/QueryBuilder.tsx`

- SQL query editor with syntax highlighting
- Table/column autocomplete
- Execute button with loading state
- Results table with pagination
- Export results as JSON/CSV

**Component:** `neuroviabot-frontend/components/dev/MetricsChart.tsx`

- Real-time line chart for memory/CPU
- Uses recharts or chart.js
- Updates every 5s via Socket.IO
- Color-coded thresholds (green < 70%, yellow < 90%, red >= 90%)

## Step 7: Security & Testing

- Add rate limiting to developer endpoints (max 10 requests/min)
- Implement audit logging for all developer actions
- Add confirmation dialogs for destructive actions (restart, restore)
- Test Socket.IO reconnection on bot restart
- Validate SQL queries to prevent harmful operations
- Test backup/restore functionality
- Verify access control for non-developer users

## Files Summary

**New Files:**

- `neuroviabot-backend/middleware/developerAuth.js`
- `neuroviabot-backend/routes/developer.js`
- `neuroviabot-backend/socket/developerEvents.js`
- `src/routes/developer-bot-api.js`
- `neuroviabot-frontend/app/dev/page.tsx`
- `neuroviabot-frontend/app/dev/bot-stats/page.tsx`
- `neuroviabot-frontend/app/dev/commands/page.tsx`
- `neuroviabot-frontend/app/dev/database/page.tsx`
- `neuroviabot-frontend/app/dev/guilds/page.tsx`
- `neuroviabot-frontend/app/dev/logs/page.tsx`
- `neuroviabot-frontend/components/layout/DeveloperMenu.tsx`
- `neuroviabot-frontend/components/dev/SystemControls.tsx`
- `neuroviabot-frontend/components/dev/QueryBuilder.tsx`
- `neuroviabot-frontend/components/dev/MetricsChart.tsx`

**Updated Files:**

- `neuroviabot-backend/index.js` (register developer routes)
- `index.js` (bot - emit developer events)
- Layout component (add developer menu)

### To-dos

- [x] Commit Phase 3 changes with detailed message and push to GitHub
- [x] Create developer authentication middleware with ID whitelist
- [x] Create developer API routes (bot stats, commands, database, system controls)
- [x] Create bot-side developer API for internal access
- [x] Implement real-time Socket.IO events for developer monitoring
- [x] Create 6 developer panel pages (overview, stats, commands, database, guilds, logs)
- [x] Create developer UI components (SystemControls, QueryBuilder, MetricsChart)
- [x] Add DeveloperMenu to layout with access control
- [x] Add rate limiting, audit logging, and validation to developer endpoints