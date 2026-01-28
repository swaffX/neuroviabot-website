<!-- fc41fb8e-3e46-4ba6-9a28-e2aae1d60bb9 8f1f1960-b49b-4b73-af47-e5f7ba8bbc57 -->
# NRC Coin Live Activity Feed - Implementation Plan

## 🎯 Amaç

NRC Coin sayfasını (https://neuroviabot.xyz/nrc-coin) gerçek zamanlı aktivite akışı ile dinamik bir trading merkezi haline getirmek.

## 📋 Özellikler

### 1. Real-time Activity Feed (Öncelik: Yüksek)

**Canlı İşlem Akışı:**

- NFT satın alımları (kim, hangi NFT, fiyat, sunucu)
- Marketplace trades (alıcı, satıcı, item, fiyat)
- Premium subscription aktivasyonları
- Investment yatırımları ve çekimleri
- Oyun kazançları (büyük kazançlar showcase)
- Quest tamamlamaları (önemli ödüller)

**Gösterim Formatı:**

```
[Discord Avatar] @username - Sunucu: ServerName
→ Legendary Avatar Frame satın aldı (5000 NRC)
→ 2 saniye önce
```

### 2. Discord Avatar Integration

**Avatar Gösterimi:**

- Circular Discord profile pictures
- Sunucu ikonu ile kombinasyon
- Smooth fade-in animations
- Hover effects (kullanıcı bilgisi tooltip)

**Avatar Kaynağı:**

- Discord API üzerinden avatar fetch
- Fallback: Discord default avatar generator
- Caching mechanism

### 3. Gelişmiş UI/UX Tasarımı

**Ana Bileşenler:**

#### A) Hero Section

- Live NRC price ticker (real-time)
- 24h volume, transactions
- Animated background (particles/gradient)
- Call-to-action buttons

#### B) Live Activity Feed (Merkezi Özellik)

- Auto-scrolling feed
- Kategorize filtreler (All, NFT, Trading, Gaming, Premium)
- Smooth slide-in animations
- Gradient borders
- Activity icons

#### C) Statistics Dashboard

- Total transactions (24h, 7d, all-time)
- Top spenders
- Most traded items
- Server activity leaderboard

#### D) Market Overview

- Active marketplace listings (carousel)
- Trending NFTs
- Hot deals

#### E) Recent Transactions Table

- Sortable columns
- Pagination
- Export data (CSV)

### 4. Animation & Interactions

**Animations:**

- Slide-in from right (new activities)
- Pulse effect on new transaction
- Smooth scroll
- Hover scale effects
- Loading skeletons

**Transitions:**

- Framer Motion variants
- Stagger animations for lists
- Page transitions

### 5. Real-time Integration

**Socket.IO Events (Backend → Frontend):**

```javascript
// NFT Purchase
socket.emit('nrc_activity', {
  type: 'nft_purchase',
  userId: '123',
  username: 'john_doe',
  avatar: 'https://cdn.discordapp.com/...',
  serverId: '456',
  serverName: 'NeuroVia Community',
  serverIcon: 'https://...',
  itemName: 'Legendary Avatar Frame',
  itemType: 'nft',
  amount: 5000,
  timestamp: Date.now()
})

// Marketplace Trade
socket.emit('nrc_activity', {
  type: 'marketplace_trade',
  buyer: { id, username, avatar },
  seller: { id, username, avatar },
  serverId, serverName, serverIcon,
  itemName: 'Epic Trading Card #42',
  price: 2500,
  timestamp: Date.now()
})

// Premium Activation
socket.emit('nrc_activity', {
  type: 'premium_activated',
  userId, username, avatar,
  serverId, serverName, serverIcon,
  tier: 'gold',
  duration: 30, // days
  cost: 50000,
  timestamp: Date.now()
})

// Investment
socket.emit('nrc_activity', {
  type: 'investment_created',
  userId, username, avatar,
  amount: 10000,
  duration: 90, // days
  apy: 35,
  timestamp: Date.now()
})

// Game Win (big wins only, e.g., >1000 NRC)
socket.emit('nrc_activity', {
  type: 'game_win',
  userId, username, avatar,
  game: 'Crash',
  winAmount: 5000,
  multiplier: 5.5,
  timestamp: Date.now()
})

// Quest Completion (high-value only)
socket.emit('nrc_activity', {
  type: 'quest_completed',
  userId, username, avatar,
  questName: 'Weekly Master Quest',
  reward: 1000,
  timestamp: Date.now()
})
```

## 🏗️ Implementation Structure

### Backend Changes

**Files to Modify:**

```
neuroviabot-backend/socket/nrcEvents.js - New activity events
neuroviabot-backend/routes/nrc.js - Activity history endpoint
src/handlers/nftHandler.js - Emit activity on purchase
src/handlers/marketHandler.js - Emit activity on trade
src/handlers/premiumHandler.js - Emit activity on subscription
src/handlers/investmentHandler.js - Emit activity on investment
src/games/crash.js - Emit on big wins
src/games/duel.js - Emit on big wins
src/handlers/questHandler.js - Emit on completion
```

**New API Endpoints:**

```
GET /api/nrc/activity/live - Get recent activities (last 50)
GET /api/nrc/activity/stats - Activity statistics
GET /api/nrc/discord/avatar/:userId - Fetch Discord avatar (proxy)
GET /api/nrc/discord/server/:serverId - Fetch server info (proxy)
```

### Frontend Changes

**New Components:**

```
neuroviabot-frontend/components/nrc/LiveActivityFeed.tsx
neuroviabot-frontend/components/nrc/ActivityCard.tsx
neuroviabot-frontend/components/nrc/DiscordAvatar.tsx
neuroviabot-frontend/components/nrc/ServerBadge.tsx
neuroviabot-frontend/components/nrc/ActivityFilters.tsx
neuroviabot-frontend/components/nrc/StatsGrid.tsx
neuroviabot-frontend/components/nrc/MarketCarousel.tsx
neuroviabot-frontend/components/nrc/TransactionTable.tsx
```

**Update Existing:**

```
neuroviabot-frontend/app/nrc-coin/page.tsx - Complete redesign
neuroviabot-frontend/app/nrc-coin/nrc-coin.scss - New styles
neuroviabot-frontend/contexts/SocketContext.tsx - Activity listeners
```

### Database Schema

**New Collection:**

```javascript
activityFeed: Map<activityId, {
  type: 'nft_purchase' | 'marketplace_trade' | 'premium_activated' | 
        'investment_created' | 'game_win' | 'quest_completed',
  userId: string,
  username: string,
  avatar: string,
  serverId?: string,
  serverName?: string,
  serverIcon?: string,
  details: object, // type-specific data
  amount?: number,
  timestamp: Date,
  visibility: 'public' | 'server_only' // privacy control
}>
```

**Activity Retention:**

- Keep last 1000 activities in memory
- Archive older activities to database
- Auto-cleanup after 30 days

## 🎨 Design Specifications

### Color Palette

```scss
// Primary NRC colors
$nrc-gold: #FFD700;
$nrc-amber: #FFA500;
$nrc-dark: #0F0F14;
$nrc-card: rgba(255, 255, 255, 0.05);

// Activity type colors
$activity-nft: #E91E63;        // Pink
$activity-trade: #2ECC71;      // Green
$activity-premium: #FFD700;    // Gold
$activity-investment: #3498DB; // Blue
$activity-game: #9B59B6;       // Purple
$activity-quest: #F39C12;      // Orange
```

### Layout

```
┌─────────────────────────────────────────────────────┐
│            HERO SECTION (Full Width)                │
│  NRC Logo | Price | 24h Change | Volume | Stats     │
└─────────────────────────────────────────────────────┘
┌──────────────────────┬──────────────────────────────┐
│                      │                              │
│  LIVE ACTIVITY FEED  │    STATISTICS DASHBOARD      │
│  (Left, 60%)         │    (Right, 40%)              │
│                      │                              │
│  [Filter Tabs]       │  📊 24h Volume               │
│                      │  📈 Total Transactions       │
│  [Activity Cards]    │  👥 Active Users             │
│  - Auto scroll       │  🔥 Trending Items           │
│  - Smooth animations │                              │
│  - Discord avatars   │  [Top Spenders List]         │
│  - Server badges     │                              │
│                      │  [Server Activity Chart]     │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│         MARKET OVERVIEW (Carousel)                  │
│  [Active Listings] → [Trending NFTs] → [Hot Deals]  │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│    RECENT TRANSACTIONS TABLE (Full Width)           │
│  Time | User | Server | Type | Item | Amount | ...  │
└─────────────────────────────────────────────────────┘
```

### Activity Card Design

```tsx
<motion.div
  initial={{ x: 100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  className="activity-card"
>
  <div className="activity-header">
    {/* Discord Avatar with Server Badge */}
    <div className="avatar-stack">
      <img src={userAvatar} className="user-avatar" />
      {serverIcon && (
        <img src={serverIcon} className="server-badge" />
      )}
    </div>
    
    <div className="activity-details">
      <div className="user-info">
        @{username} · {serverName}
      </div>
      <div className="activity-action">
        {activityText}
      </div>
    </div>
    
    <div className="activity-value">
      {amount.toLocaleString()} NRC
    </div>
  </div>
  
  <div className="activity-timestamp">
    {timeAgo}
  </div>
</motion.div>
```

## 📦 Dependencies

**New Packages:**

```json
{
  "react-virtualized": "^9.22.5",  // For performance (1000+ items)
  "date-fns": "^3.0.0",             // Time formatting
  "recharts": "^2.10.0"             // Charts for stats
}
```

## 🔐 Privacy & Security

**User Privacy:**

- Option to hide activity (user settings)
- Server-only visibility option
- Anonymize sensitive transactions

**Rate Limiting:**

- Limit activity feed updates (max 10/sec)
- Throttle API calls
- Cache Discord avatars (1 hour TTL)

## 🧪 Testing Checklist

- [ ] Real-time activity appears instantly
- [ ] Discord avatars load correctly
- [ ] Server badges display properly
- [ ] Filters work (All, NFT, Trading, etc.)
- [ ] Smooth animations (no janky scrolling)
- [ ] Responsive on mobile
- [ ] Performance with 1000+ activities
- [ ] Socket connection resilience
- [ ] Fallback for failed avatar loads

## 📈 Success Metrics

- Activity feed updates within 500ms
- 60fps smooth animations
- Avatar load time < 1s
- Page load < 2s
- Mobile responsive
- Accessibility (ARIA labels)

## 🚀 Deployment

1. Backend updates first (API + Socket events)
2. Test Socket.IO events
3. Frontend build & deploy
4. Monitor real-time performance
5. Gather user feedback

---

## Todo List

**Phase 1: Backend Foundation**

- [ ] Add `activityFeed` Map to database schema
- [ ] Create activity emission helpers in `nrcEvents.js`
- [ ] Add activity API endpoints (`/api/nrc/activity/*`)
- [ ] Implement Discord avatar proxy endpoint
- [ ] Add activity tracking to all handlers (NFT, Market, Premium, etc.)

**Phase 2: Frontend Core**

- [ ] Create `LiveActivityFeed` component
- [ ] Create `ActivityCard` component with animations
- [ ] Create `DiscordAvatar` component with fallback
- [ ] Implement Socket.IO listener for activities
- [ ] Add activity filtering (tabs)

**Phase 3: UI Enhancement**

- [ ] Redesign hero section with live stats
- [ ] Create statistics dashboard
- [ ] Build market overview carousel
- [ ] Design transaction table with sorting
- [ ] Add loading skeletons

**Phase 4: Polish & Optimization**

- [ ] Implement virtualization for performance
- [ ] Add smooth scroll behavior
- [ ] Optimize avatar caching
- [ ] Test on mobile devices
- [ ] Add accessibility features

**Phase 5: Testing & Deployment**

- [ ] Test real-time updates
- [ ] Verify all activity types display correctly
- [ ] Performance testing (1000+ items)
- [ ] Cross-browser testing
- [ ] Deploy to production

### To-dos

- [ ] Database schema: activityFeed Map ekle, activity retention logic
- [ ] Socket.IO: nrc_activity event emitters, all handlers integrate
- [ ] API endpoints: /activity/live, /activity/stats, Discord avatar proxy
- [ ] React components: LiveActivityFeed, ActivityCard, DiscordAvatar, Filters
- [ ] Socket.IO listeners: real-time activity feed updates
- [ ] NRC Coin page redesign: Hero, Stats, Feed, Market carousel, Table
- [ ] Framer Motion: slide-in, pulse, smooth scroll, loading skeletons
- [ ] Performance: virtualization, caching, debouncing, mobile responsive
- [ ] Testing: real-time, cross-browser, mobile, accessibility → Deploy