# NRC System Phase 2-3: Remaining Features Implementation

## Executive Summary

**Status**: Phase 1 & Phase 2.1-2.3 COMPLETE ✅  
**Current Phase**: Phase 2.4-2.6 & Phase 3  
**Target**: Complete marketplace, quests, games, API, and frontend integration

### Completed So Far (Session 1)
- ✅ Database schema expansion (8 new Maps)
- ✅ NFT/Collection system with 4 collections
- ✅ Premium system (Bronze/Silver/Gold)
- ✅ Investment system (7/30/90 day plans)
- ✅ 23 subcommands across 3 subcommand groups

### Remaining Work Analysis

| Feature | Priority | Complexity | Est. Time | Dependencies |
|---------|----------|------------|-----------|--------------|
| Marketplace Escrow | High | Medium | 2h | NFT handler ✅ |
| Quest System | High | Medium | 2h | Database ✅ |
| Minigames | Medium | High | 3h | Database ✅ |
| Backend API | High | Low | 1h | All handlers ✅ |
| Frontend Pages | Medium | Medium | 2h | Backend API |
| Socket Events | Low | Low | 30m | Backend API |

**Total Estimated Time**: 10.5 hours

---

## Phase 2.4: Marketplace Escrow System

### Objectives
- Enable safe user-to-user NFT trading
- Implement escrow protection
- Add offer/counter-offer system
- Marketplace fee calculation with premium discounts

### Implementation Details

#### Files to Create
1. **`src/handlers/marketHandler.js`**
   - Purchase NFT from marketplace
   - Create offers
   - Accept/reject offers
   - Cancel listings
   - Browse marketplace with filters

2. **`src/utils/escrowManager.js`**
   - Hold funds in escrow
   - Release funds on completion
   - Refund on cancellation
   - Fee calculation with premium discount

#### Subcommand Group: `/nrc market`
```javascript
/nrc market liste         // Browse marketplace listings
/nrc market satın-al     // Purchase listed NFT
/nrc market teklif       // Make offer on listing
/nrc market iptal        // Cancel your listing
/nrc market geçmiş       // Transaction history
```

#### Key Features
- **Escrow Protection**: Buyer pays → funds held → NFT transferred → seller paid
- **Premium Fee Discount**: Bronze 0%, Silver 50%, Gold 100%
- **Offer System**: Buyers can make offers below asking price
- **Search & Filter**: By type, rarity, price range

#### Database Integration
```javascript
// Already exists in simple-db.js
marketplaceListings: Map<listingId, {
  sellerId, itemType, collectionId, itemId,
  price, listedAt, status, offers: []
}>

tradeHistory: Map<tradeId, {
  buyerId, sellerId, itemId, price,
  platformFee, timestamp
}>
```

---

## Phase 2.5: Quest System

### Objectives
- Daily quests that reset every 24h
- Weekly quests that reset every 7 days
- Quest progression tracking
- Reward claiming system

### Implementation Details

#### Files to Create
1. **`src/handlers/questHandler.js`**
   - Initialize default quests
   - Track user progress
   - Check completion
   - Claim rewards
   - Reset daily/weekly quests

2. **`src/utils/questGenerator.js`**
   - Generate dynamic quests
   - Randomize quest parameters
   - Event quest creation

#### Subcommand Group: `/nrc quest`
```javascript
/nrc quest liste      // View active quests
/nrc quest durum      // Check progress
/nrc quest ödül-al    // Claim completed quest rewards
/nrc quest geçmiş     // View completed quests
```

#### Quest Types

**Daily Quests (Reset 00:00 UTC)**
- Send 10 messages → 100 NRC
- Use 3 bot commands → 75 NRC
- Earn 500 XP → 150 NRC
- Spend 500 NRC → 200 NRC

**Weekly Quests (Reset Monday 00:00 UTC)**
- Complete 5 daily quests → 500 NRC
- Make 3 trades → 750 NRC
- Reach level milestone → 1000 NRC
- Win 5 games → 1250 NRC

**Special Event Quests**
- Time-limited (24-72h)
- 5x normal rewards
- Unique objectives

#### Quest Progression Tracking
```javascript
// questProgress Map structure
{
  userId: {
    activeQuests: [
      {
        questId: 'daily_messages',
        progress: 7,
        target: 10,
        reward: 100,
        expiresAt: '2025-10-17T00:00:00Z'
      }
    ],
    completedQuests: ['quest_id_1', 'quest_id_2'],
    dailyStreak: 5,
    lastDailyReset: '2025-10-16T00:00:00Z'
  }
}
```

#### Integration Points
- Message create event → increment message quest
- Command use → increment command quest
- Level up → check level milestone quest
- Trade complete → increment trade quest
- Game win → increment game quest

---

## Phase 2.6: Enhanced Minigames

### Objectives
- Add 4 new games (poker, crash, duel, tournament)
- Enhance existing games (blackjack, slots)
- Implement tournament system
- Track game statistics

### Implementation Details

#### Files to Create
1. **`src/games/poker.js`** - Texas Hold'em
2. **`src/games/crash.js`** - Crash multiplier game
3. **`src/games/duel.js`** - 1v1 battles (RPS, trivia)
4. **`src/games/tournament.js`** - Tournament manager

#### Subcommand Group: `/nrc oyun`
```javascript
/nrc oyun poker       // Texas Hold'em (buy-in)
/nrc oyun crash       // Crash game
/nrc oyun düello      // 1v1 duel
/nrc oyun turnuva     // Join/create tournament
/nrc oyun istatistik  // Game statistics
```

#### Game Mechanics

**Poker (Texas Hold'em)**
- Buy-in: 100-10,000 NRC
- 2-8 players per table
- Winner takes pot (95%, 5% fee)
- Premium users: reduced rake

**Crash**
- Bet amount
- Watch multiplier increase
- Cash out before crash
- Max multiplier: 10x
- House edge: 3%

**Duel**
- Challenge another user
- Stake: 50-5,000 NRC
- Rock-Paper-Scissors or Trivia
- Winner takes all (minus 5% fee)

**Tournament**
- Weekly tournaments
- 100k NRC prize pool
- Top 10 players get rewards
- Entry: 1000 NRC

#### Game Stats Tracking
```javascript
gameStats: Map<userId, {
  totalGamesPlayed: 0,
  totalWins: 0,
  totalLosses: 0,
  biggestWin: 0,
  currentStreak: 0,
  favoriteGame: 'poker',
  lifetimeWinnings: 0,
  lifetimeLosses: 0
}>
```

---

## Phase 3.1: Backend API Endpoints

### Objectives
- Create RESTful API for NRC features
- Enable frontend dashboard integration
- Provide developer API access

### Implementation Details

#### File: `neuroviabot-backend/routes/nrc.js`

**Collections Endpoints**
```javascript
GET  /api/nrc/collections              // List all collections
GET  /api/nrc/collections/:id          // Get collection details
POST /api/nrc/collections/purchase     // Purchase NFT
GET  /api/nrc/user/:userId/collection  // User's NFT inventory
```

**Marketplace Endpoints**
```javascript
GET  /api/nrc/marketplace/listings     // Browse listings
POST /api/nrc/marketplace/create       // Create listing
POST /api/nrc/marketplace/purchase/:id // Purchase listing
POST /api/nrc/marketplace/offer        // Make offer
DELETE /api/nrc/marketplace/:id        // Cancel listing
```

**Premium Endpoints**
```javascript
GET  /api/nrc/premium/plans            // Get all plans
GET  /api/nrc/premium/status/:userId   // User's premium status
POST /api/nrc/premium/subscribe        // Subscribe to premium
DELETE /api/nrc/premium/cancel         // Cancel subscription
```

**Investment Endpoints**
```javascript
GET  /api/nrc/investment/plans         // Get investment plans
GET  /api/nrc/investment/:userId       // User's investments
POST /api/nrc/investment/create        // Create investment
POST /api/nrc/investment/withdraw/:id  // Withdraw investment
```

**Quest Endpoints**
```javascript
GET  /api/nrc/quests/active/:userId    // Active quests
GET  /api/nrc/quests/completed/:userId // Completed quests
POST /api/nrc/quests/claim/:questId    // Claim reward
```

**Game Endpoints**
```javascript
GET  /api/nrc/games/stats/:userId      // Game statistics
GET  /api/nrc/games/leaderboard        // Top players
GET  /api/nrc/tournaments/active       // Active tournaments
POST /api/nrc/tournaments/join         // Join tournament
```

#### Authentication & Middleware
- Use existing `isAuthenticated` middleware
- Add `hasGuildAccess` for guild-specific data
- Rate limiting: 100 requests/15min

---

## Phase 3.2: Frontend Dashboard Pages

### Objectives
- Create beautiful, functional dashboard pages
- Real-time updates via Socket.IO
- Responsive design

### Implementation Details

#### Pages to Create

1. **`app/dashboard/servers/[id]/nrc/page.tsx`**
   - NRC Hub landing page
   - Quick stats overview
   - Feature cards linking to sub-pages

2. **`app/dashboard/servers/[id]/nrc/collections/page.tsx`**
   - Browse NFT collections
   - User's inventory display
   - Purchase modal
   - Rarity filters

3. **`app/dashboard/servers/[id]/nrc/investments/page.tsx`**
   - Active investments table
   - Create investment form
   - Matured investments (ready to withdraw)
   - Charts: Total invested, Expected returns

4. **`app/dashboard/servers/[id]/nrc/quests/page.tsx`**
   - Active quests with progress bars
   - Claim reward buttons
   - Completed quests history
   - Daily/Weekly tabs

5. **`app/dashboard/servers/[id]/nrc/games/page.tsx`**
   - Available games grid
   - User statistics
   - Leaderboards
   - Tournament info

#### Pages to Update

1. **`app/dashboard/servers/[id]/nrc/marketplace/page.tsx`**
   - Add escrow info
   - Offer system UI
   - Filter by type/rarity/price
   - Your listings section

2. **`app/dashboard/premium/page.tsx`**
   - Add NRC payment option
   - Show multiplier benefits
   - Compare tiers visually

#### UI/UX Principles
- Use existing design system (Tailwind + SCSS)
- Cyber/neon theme consistency
- Loading skeletons
- Optimistic UI updates
- Error boundaries

---

## Phase 3.3: Socket.IO Events Integration

### Objectives
- Real-time frontend updates
- Bot ↔ Backend ↔ Frontend sync
- Event broadcasting

### Implementation Details

#### New Socket Events

**Bot → Backend → Frontend**
```javascript
// NFT Events
socket.emit('nrc_nft_purchased', { userId, nftId, price })
socket.emit('nrc_nft_listed', { listingId, sellerId, price })

// Marketplace Events
socket.emit('marketplace_purchase', { listingId, buyerId })
socket.emit('marketplace_offer', { listingId, buyerId, offer })

// Quest Events
socket.emit('quest_completed', { userId, questId, reward })
socket.emit('quest_claimed', { userId, questId, reward })

// Premium Events
socket.emit('premium_activated', { userId, tier })
socket.emit('premium_expired', { userId })

// Investment Events
socket.emit('investment_created', { userId, amount, plan })
socket.emit('investment_matured', { userId, investmentId })
socket.emit('investment_withdrawn', { userId, amount })

// Game Events
socket.emit('game_started', { gameType, players })
socket.emit('game_ended', { gameType, winner, prize })
socket.emit('tournament_started', { tournamentId })
```

#### Frontend Socket Handling
```typescript
// In SocketContext.tsx
socket.on('nrc_nft_purchased', (data) => {
  // Update user collection
  // Show notification
  // Refresh inventory
});

socket.on('quest_completed', (data) => {
  // Show completion animation
  // Enable claim button
  // Update progress
});
```

---

## Implementation Priority & Timeline

### Week 1: Core Marketplace & Quests (HIGH PRIORITY)
**Day 1-2**: Marketplace Escrow
- ✅ Create marketHandler.js
- ✅ Create escrowManager.js
- ✅ Add /nrc market subcommands
- ✅ Test escrow flow

**Day 3-4**: Quest System
- ✅ Create questHandler.js
- ✅ Create questGenerator.js
- ✅ Add /nrc quest subcommands
- ✅ Integrate with events

### Week 2: Games & API (MEDIUM PRIORITY)
**Day 5-7**: Minigames
- ✅ Create 4 new game files
- ✅ Add /nrc oyun subcommands
- ✅ Implement tournament system

**Day 8-9**: Backend API
- ✅ Create routes/nrc.js
- ✅ Implement all endpoints
- ✅ Test with Postman

### Week 3: Frontend & Polish (MEDIUM-LOW PRIORITY)
**Day 10-12**: Frontend Pages
- ✅ Create 5 new dashboard pages
- ✅ Update 2 existing pages
- ✅ Responsive design

**Day 13-14**: Socket Events & Testing
- ✅ Integrate Socket.IO events
- ✅ End-to-end testing
- ✅ Bug fixes

---

## Testing Strategy

### Unit Tests (Per Feature)
- Test handlers in isolation
- Mock database calls
- Edge case coverage

### Integration Tests
- Full flow testing (purchase → escrow → transfer)
- Quest progression tracking
- Game mechanics validation

### Manual Testing Checklist
- [ ] Purchase NFT from marketplace
- [ ] Make offer on listing
- [ ] Complete daily quest
- [ ] Claim quest reward
- [ ] Play poker game
- [ ] Join tournament
- [ ] View stats on dashboard
- [ ] Real-time updates working

---

## Risk Mitigation

### Potential Issues
1. **Discord Command Limit (25)**: Currently at 23, careful with new commands
2. **Database Performance**: Monitor size of gameStats and questProgress
3. **Escrow Security**: Thoroughly test fund holding/release
4. **Real-time Sync**: Handle socket disconnections gracefully

### Solutions
1. Use subcommand groups (already doing)
2. Implement data cleanup cron jobs
3. Comprehensive escrow testing + rollback mechanism
4. Auto-reconnection with exponential backoff (already implemented)

---

## Success Metrics

### Technical KPIs
- [ ] All 6 phases complete
- [ ] Zero critical bugs
- [ ] API response time < 100ms
- [ ] Frontend load time < 2s
- [ ] Socket connection uptime > 99%

### Feature Adoption
- [ ] 50+ marketplace transactions
- [ ] 100+ quests completed
- [ ] 20+ games played
- [ ] 10+ tournament participants
- [ ] 5+ premium subscribers

---

## Next Steps (IMMEDIATE ACTION)

1. **START**: Create marketHandler.js
2. **START**: Create escrowManager.js  
3. **START**: Add /nrc market subcommand group
4. **TEST**: Marketplace purchase flow
5. **CONTINUE**: Quest system implementation

**Let's begin! 🚀**

