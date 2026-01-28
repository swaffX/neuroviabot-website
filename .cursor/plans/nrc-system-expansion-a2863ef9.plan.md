<!-- a2863ef9-0330-41ff-8709-17ca14e31704 ef9cf851-8a77-4ff5-adfe-f4377589bc34 -->
# NRC System - Complete Expansion & Optimization

## Phase 1: Command Consolidation & Instant Sync (Priority: Critical)

### 1.1 Merge /economy into /nrc

**Goal:** Replace /economy with unified /nrc command

**Files to Modify:**

- `src/commands/nrc.js` - Merge all economy subcommands
- `src/commands/economy.js` - Mark as deprecated, redirect to /nrc
- `src/utils/commandWatcher.js` - Enable instant sync with chokidar

**Key Changes:**

```javascript
// nrc.js - Add missing subcommands from economy.js
.addSubcommand('leaderboard') // from economy
.addSubcommand('stats')       // from economy  
.addSubcommand('convert')     // from economy
.addSubcommand('portfolio')   // from economy (already exists)
```

**Redirect Strategy:**

```javascript
// economy.js - Keep for backward compatibility
async execute(interaction) {
    const embed = new EmbedBuilder()
        .setTitle('Command Moved')
        .setDescription('Use /nrc instead of /economy')
        .addField('New Command', `/nrc ${subcommand}`)
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
```

### 1.2 Instant Command Sync System

**Goal:** Real-time Discord slash command registration

**Implementation:**

- Replace interval-based watcher with `chokidar` file watcher
- Auto-sync to Discord on file change detection
- Hybrid mode: Auto on startup + instant on change

**Files to Create/Modify:**

```
src/utils/commandWatcher.js - Add chokidar integration
src/utils/instantCommandSync.js - NEW: Instant sync handler
index.js - Initialize instant watcher on startup
```

**Key Logic:**

```javascript
// chokidar watch
chokidar.watch('src/commands/*.js').on('change', async (path) => {
    await reloadCommand(path);
    await syncToDiscord();      // Instant Discord API sync
    await broadcastToFrontend(); // Socket.IO broadcast
});
```

### 1.3 Enhanced Frontend Integration

**Goal:** Robust real-time command tracking in dashboard

**Files to Modify:**

```
neuroviabot-frontend/app/dev-panel/commands/page.tsx
neuroviabot-backend/routes/developer.js
src/routes/developer-bot-api.js
```

**Enhancements:**

- WebSocket heartbeat (30s ping/pong)
- Automatic reconnection with exponential backoff
- Command diff visualization (added/removed/modified)
- Cache invalidation on updates
- Optimistic UI updates

---

## Phase 2: NRC Core Expansion (Priority: High)

### 2.1 NFT/Collection System

**Goal:** Digital collectibles purchasable with NRC

**Files to Create:**

```
src/commands/nrc-collection.js - /nrc collection subcommands
src/handlers/nftHandler.js - NFT management logic
src/database/schemas/nft.js - NFT data structures
```

**Features:**

- Avatar frames (100-5000 NRC)
- Trading cards (50-10000 NRC, rarities: Common, Rare, Epic, Legendary)
- Badges/Achievements (unlockable with NRC)
- Profile customization items
- Marketplace listing/trading

**Database Schema:**

```javascript
nftCollections: Map(), // collectionId -> { name, items, prices }
userCollections: Map(), // userId -> { ownedItems, favoriteItem }
nftListings: Map(),    // listingId -> { sellerId, itemId, price }
```

### 2.2 Premium Features System

**Goal:** NRC-powered premium subscriptions

**Files to Create:**

```
src/commands/nrc-premium.js - /nrc premium subcommands
src/handlers/premiumHandler.js - Premium features logic
src/middleware/premiumCheck.js - Feature gating
```

**Premium Tiers:**

- Bronze: 5000 NRC/month (2x daily rewards, custom color)
- Silver: 15000 NRC/month (3x daily, VIP badge, custom prefix)
- Gold: 50000 NRC/month (5x daily, all features, priority support)

**Premium-Locked Features:**

- Custom bot prefix per user
- Extended bank capacity (+50%)
- Exclusive collectibles
- Trading fee reduction (50% off)
- Special channels/roles access

### 2.3 Investment & Staking System

**Goal:** Earn passive NRC income

**Files to Create:**

```
src/commands/nrc-invest.js - /nrc invest/stake subcommands
src/handlers/investmentHandler.js - Interest calculations
src/utils/stakingEngine.js - Staking rewards engine
```

**Features:**

- **Fixed Deposits:** Lock NRC for 7/30/90 days, earn 5%/15%/35% APY
- **Staking Pools:** Stake in community pools, earn based on pool performance
- **Dividend System:** Hold 10k+ NRC, earn 0.1% daily from server treasury

**Database Schema:**

```javascript
investments: Map(), // investmentId -> { userId, amount, startDate, endDate, apy }
stakingPools: Map(), // poolId -> { totalStaked, participants, rewards }
```

### 2.4 Marketplace System

**Goal:** User-to-user NRC economy

**Files to Create:**

```
src/commands/nrc-market.js - /nrc market subcommands
src/handlers/marketHandler.js - Listing/trading logic
src/utils/escrowManager.js - Safe trading escrow
```

**Features:**

- List items for sale (NRC price)
- Browse marketplace by category
- Offer/counter-offer system
- Escrow protection (5% platform fee)
- Trade history tracking

**Categories:**

- Collectibles (NFTs, cards, badges)
- Services (custom commands, artwork commissions)
- Premium time (users can gift premium)
- Custom roles/channels (server owners can sell access)

### 2.5 Quest & Daily Challenges

**Goal:** Gamified NRC earning

**Files to Create:**

```
src/commands/nrc-quest.js - /nrc quest subcommands
src/handlers/questHandler.js - Quest progression tracking
src/utils/questGenerator.js - Dynamic quest generation
```

**Quest Types:**

- Daily Quests (reset 24h): Send 10 messages (100 NRC), Voice 30min (200 NRC)
- Weekly Quests: Participate in 5 games (500 NRC), Trade 3 items (750 NRC)
- Special Events: Limited-time quests with 5x rewards
- Achievement Unlocks: Complete quest chains for unique badges

**Database Schema:**

```javascript
questProgress: Map(), // userId -> { activeQuests, completedQuests, streak }
questTemplates: Map(), // questId -> { objectives, rewards, duration }
```

### 2.6 Enhanced Minigames

**Goal:** More ways to win/lose NRC

**Files to Create:**

```
src/commands/nrc-games.js - /nrc games hub
src/games/poker.js - NEW: Texas Hold'em
src/games/crash.js - NEW: Crash game
src/games/duel.js - NEW: 1v1 NRC battles
src/games/tournament.js - NEW: Tournaments with prize pools
```

**New Games:**

- **Poker:** Buy-in tournaments (100-10000 NRC), winner takes pot
- **Crash:** Bet NRC, cash out before crash (multiplier game)
- **Duels:** Challenge users to NRC battles (rock-paper-scissors, trivia)
- **Tournaments:** Weekly events with 100k NRC prize pools

**Existing Games to Enhance:**

- Blackjack: Add insurance, double down
- Slots: Add progressive jackpot
- Racing: Multiplayer races with betting

### 2.7 VIP Subscription System

**Goal:** Recurring NRC subscriptions

**Files to Create:**

```
src/commands/nrc-vip.js - /nrc vip subcommands
src/handlers/vipHandler.js - Subscription management
src/utils/subscriptionEngine.js - Auto-renewal logic
```

**VIP Plans:**

- **Starter VIP:** 2000 NRC/month
  - 1.5x daily rewards
  - Access to VIP lounge channel
  - VIP badge

- **Pro VIP:** 8000 NRC/month
  - 3x daily rewards
  - Free marketplace listings (no 5% fee)
  - Priority quest slots
  - Custom embed colors

- **Elite VIP:** 25000 NRC/month
  - 5x all rewards
  - Exclusive NFT airdrops
  - Private voice channels
  - Custom role creation

**Auto-Renewal:**

- Check balances daily at midnight UTC
- Auto-deduct subscription fee
- Grace period: 3 days before cancellation
- Notifications: 7 days before renewal, on renewal, on cancellation

---

## Phase 3: Database & Infrastructure (Priority: High)

### 3.1 Database Schema Expansion

**File:** `src/database/simple-db.js`

**New Maps to Add:**

```javascript
nftCollections: Map(),      // collectionId -> collection data
userCollections: Map(),     // userId -> owned NFTs
nftListings: Map(),         // listingId -> marketplace listing
investments: Map(),         // investmentId -> investment position
stakingPools: Map(),        // poolId -> staking pool
questProgress: Map(),       // userId -> quest data
questTemplates: Map(),      // questId -> quest definition
vipSubscriptions: Map(),    // userId -> subscription data
gameStats: Map(),           // userId -> game statistics
tournamentHistory: Map(),   // tournamentId -> results
serverTreasury: Map(),      // guildId -> treasury balance
```

### 3.2 Transaction System Enhancement

**Goal:** Comprehensive transaction tracking

**New Transaction Types:**

```javascript
// Existing: daily, work, transfer, deposit, withdraw
// New: nft_purchase, premium_purchase, market_sale, market_purchase,
//      investment_create, investment_mature, staking_deposit, staking_withdraw,
//      quest_reward, game_win, game_loss, subscription_renewal, escrow_hold, escrow_release
```

### 3.3 Migration System

**File:** `src/utils/migrationHandler.js` (NEW)

**Purpose:** Migrate existing economy data to new NRC schema

**Migration Script:**

```javascript
async function migrateToNRCv2() {
    // 1. Backup existing data
    // 2. Convert old economy balances to NRC
    // 3. Initialize new schemas with defaults
    // 4. Preserve user transaction history
    // 5. Set migration flag
}
```

---

## Phase 4: Frontend Dashboard Enhancements (Priority: Medium)

### 4.1 NRC Management Panel

**New Pages:**

```
neuroviabot-frontend/app/dashboard/servers/[id]/nrc/page.tsx
neuroviabot-frontend/app/dashboard/servers/[id]/nrc/marketplace/page.tsx
neuroviabot-frontend/app/dashboard/servers/[id]/nrc/collections/page.tsx
neuroviabot-frontend/app/dashboard/servers/[id]/nrc/leaderboard/page.tsx
```

**Features:**

- Real-time NRC balance display
- Transaction history with filters
- Marketplace browsing/purchasing
- Collection showcase
- Investment portfolio view
- Quest tracker
- VIP subscription management

### 4.2 Admin Controls

**Page:** `neuroviabot-frontend/app/dashboard/servers/[id]/nrc/admin/page.tsx`

**Server Owner Features:**

- Enable/disable NRC features per server
- Set custom NRC rewards (daily/work amounts)
- Create server-exclusive NFTs
- Configure marketplace fees
- Manage server treasury
- Create custom quests
- Tournament organization

### 4.3 Analytics Dashboard

**Page:** `neuroviabot-frontend/app/dashboard/servers/[id]/nrc/analytics/page.tsx`

**Charts/Stats:**

- NRC circulation over time
- Top earners/spenders
- Marketplace activity
- Game statistics
- Quest completion rates
- Subscription revenue

---

## Phase 5: API & Backend Updates (Priority: High)

### 5.1 New API Endpoints

**File:** `neuroviabot-backend/routes/nrc.js` (NEW)

**Endpoints:**

```
GET    /api/nrc/balance/:userId
POST   /api/nrc/transfer
GET    /api/nrc/transactions/:userId
GET    /api/nrc/leaderboard/:guildId

GET    /api/nrc/marketplace/listings
POST   /api/nrc/marketplace/create
POST   /api/nrc/marketplace/purchase/:listingId

GET    /api/nrc/collections/:userId
POST   /api/nrc/collections/purchase

GET    /api/nrc/investments/:userId
POST   /api/nrc/invest/create
POST   /api/nrc/invest/withdraw/:investmentId

GET    /api/nrc/quests/active/:userId
POST   /api/nrc/quests/claim/:questId

GET    /api/nrc/vip/status/:userId
POST   /api/nrc/vip/subscribe
DELETE /api/nrc/vip/cancel

GET    /api/nrc/admin/treasury/:guildId
POST   /api/nrc/admin/mint (dev only)
POST   /api/nrc/admin/burn (dev only)
```

### 5.2 WebSocket Events

**File:** `neuroviabot-backend/index.js`

**New Socket.IO Events:**

```javascript
// Emit to clients
socket.emit('nrc_balance_updated', { userId, newBalance })
socket.emit('nrc_transaction', { transaction })
socket.emit('marketplace_listing_added', { listing })
socket.emit('marketplace_listing_sold', { listingId, buyer })
socket.emit('quest_completed', { userId, questId, reward })
socket.emit('vip_status_changed', { userId, tier, status })
socket.emit('tournament_started', { tournamentId, details })
```

---

## Phase 6: Testing & Deployment (Priority: Critical)

### 6.1 Unit Tests

**Files to Create:**

```
tests/nrc/balance.test.js
tests/nrc/marketplace.test.js
tests/nrc/investments.test.js
tests/nrc/quests.test.js
tests/nrc/vip.test.js
tests/sync/commandSync.test.js
```

### 6.2 Integration Tests

**Scenarios:**

- Purchase NFT → verify balance deduction → check inventory
- Create marketplace listing → purchase → verify escrow → release funds
- Subscribe to VIP → auto-renewal → cancellation
- Complete quest → claim reward → verify balance
- Invest NRC → wait maturity → withdraw with interest

### 6.3 Load Testing

**Tools:** Artillery.io

**Test Cases:**

- 100 concurrent /nrc balance requests
- 50 marketplace transactions/second
- 1000 quest claim requests simultaneously

### 6.4 Deployment Checklist

- [ ] Database backup before migration
- [ ] Run migration script (dry-run first)
- [ ] Deploy bot with new commands
- [ ] Sync commands to Discord (instant)
- [ ] Deploy backend API updates
- [ ] Deploy frontend dashboard updates
- [ ] Monitor logs for errors (24h)
- [ ] Verify real-time sync working
- [ ] Test critical paths (purchase, trade, invest)
- [ ] Announce new features to users

---

## Implementation Priority Order

### Week 1: Foundation (Phase 1)

1. Command consolidation (/economy → /nrc)
2. Instant command sync with chokidar
3. Enhanced frontend integration
4. Database schema expansion

**Deliverable:** /nrc fully functional, instant Discord sync working

### Week 2: Core Features (Phase 2.1-2.3)

1. NFT/Collection system
2. Premium features
3. Investment/Staking system

**Deliverable:** Users can buy NFTs, subscribe to premium, earn interest

### Week 3: Economy Expansion (Phase 2.4-2.7)

1. Marketplace system
2. Quest system
3. Enhanced minigames
4. VIP subscriptions

**Deliverable:** Full NRC economy ecosystem live

### Week 4: Frontend & Polish (Phase 4-6)

1. Dashboard pages for all features
2. API endpoints
3. Testing
4. Deployment

**Deliverable:** Production-ready system with full dashboard

---

## Technical Specifications

### Instant Command Sync Architecture

```
File Change (src/commands/*.js)
  ↓
Chokidar Detects Change (< 100ms)
  ↓
Parse Command File → Extract Metadata
  ↓
Update Bot Memory (client.commands.set)
  ↓
Sync to Discord API (REST.put)
  ↓
Broadcast to Frontend (Socket.IO)
  ↓
Frontend Updates UI (< 500ms total)
```

### NRC Transaction Flow

```
User Action (/nrc buy-nft)
  ↓
Check Balance (simple-db.js)
  ↓
Deduct NRC → Add NFT to Inventory
  ↓
Record Transaction (with metadata)
  ↓
Update Database (atomic operation)
  ↓
Emit Socket Event (real-time update)
  ↓
Update Frontend Balance Display
```

### Database Constraints

- Max NRC per user: 10,000,000,000 (10B)
- Transaction history retention: 90 days (then archive)
- Quest completion cache: 30 days
- Investment lock periods: 7/30/90 days (non-negotiable)
- VIP grace period: 3 days

### Performance Targets

- Command sync latency: < 500ms (file change to Discord)
- Balance query: < 50ms
- Marketplace search: < 200ms (with pagination)
- Quest claim: < 100ms
- Frontend dashboard load: < 2s (initial), < 500ms (updates)

---

## Risk Mitigation

### Data Loss Prevention

- Hourly database backups
- Transaction log (append-only)
- Migration rollback scripts
- Dry-run mode for all admin operations

### Economy Balance

- Daily NRC mint cap: 1,000,000 per server
- Marketplace fee (5%) prevents inflation
- Investment maturity prevents instant liquidity
- Quest rewards scale with server activity

### Security

- Escrow system for trades (prevent scams)
- Rate limiting on expensive operations
- Admin-only minting/burning
- Transaction verification (double-spend prevention)

### Scalability

- Pagination for large datasets (leaderboards, marketplace)
- Caching for frequently accessed data (balances, collections)
- Database indexing for fast queries
- Socket.IO room-based broadcasting (per-guild isolation)

---

## Documentation Requirements

### User Documentation

- `/nrc help` - Command guide
- Web dashboard tutorial
- NFT collection catalog
- Quest achievement list
- VIP tier comparison

### Developer Documentation

- API reference (all endpoints)
- Database schema diagrams
- Transaction flow charts
- Migration guide
- Testing procedures

---

## Success Metrics

### Week 1

- [ ] /nrc visible in Discord autocomplete
- [ ] Frontend shows new commands within 5 seconds of change
- [ ] Zero command registration errors

### Week 2

- [ ] 50+ NFTs purchased
- [ ] 10+ premium subscriptions active
- [ ] 100,000+ NRC in investments

### Week 4

- [ ] 500+ marketplace transactions
- [ ] 1,000+ quests completed
- [ ] 50+ VIP subscribers
- [ ] 5,000+ NRC earned from games
- [ ] Dashboard page views: 10,000+

---

## Rollback Plan

If critical issues arise:

1. Stop bot (PM2 stop neuroviabot)
2. Restore database backup
3. Revert to previous command set
4. Clear Discord command cache
5. Redeploy stable version
6. Investigate issue in staging environment

### To-dos

- [ ] Merge /economy into /nrc command with all subcommands
- [ ] Implement chokidar-based instant command sync to Discord
- [ ] Enhance frontend Socket.IO integration with heartbeat and reconnection
- [ ] Expand database schema for new NRC features
- [ ] Implement NFT/Collection system with marketplace integration
- [ ] Create premium features system with tier-based benefits
- [ ] Build investment and staking system with APY calculation
- [ ] Develop user-to-user marketplace with escrow protection
- [ ] Implement quest system with daily/weekly challenges
- [ ] Expand minigames with poker, crash, duels, tournaments
- [ ] Create VIP subscription system with auto-renewal
- [ ] Build migration system for existing economy data
- [ ] Create NRC management dashboard pages in frontend
- [ ] Build admin control panel for NRC configuration
- [ ] Implement analytics dashboard with charts and stats
- [ ] Create comprehensive NRC API endpoints in backend
- [ ] Implement WebSocket events for real-time NRC updates
- [ ] Write unit and integration tests for all NRC features
- [ ] Deploy NRC system to production with monitoring