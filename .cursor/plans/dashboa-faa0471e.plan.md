<!-- faa0471e-4c8d-4c0c-a983-40090512c438 f735ccb7-f82f-47e6-861e-c2a2cfc22bb3 -->
# Comprehensive NeuroViaBot System Upgrade

## Phase 1: Core System Fixes & Real-time Infrastructure

### 1.1 Audit Log Real-time Integration

- **File**: `neuroviabot-frontend/components/dashboard/AuditLog.tsx`
- Already has Socket.IO integration for `audit_log_entry` events
- Verify data flow from bot → backend → frontend via Socket.IO
- Test with role/channel CRUD operations to ensure logs appear instantly

### 1.2 Leveling System - Announcement Channel Real-time Fix

- **File**: `neuroviabot-frontend/components/dashboard/LevelingSettings.tsx`
- Add Socket.IO listener for `leveling_settings_update` event
- Emit event from backend when announcement channel is changed
- Update channel dropdown to refresh when new channels are created

### 1.3 Reaction Roles - Bot Message System (Choice 1A)

- **Bot**: `src/handlers/reactionRoleHandler.js`
- Implement command to create reaction role message (bot sends embed)
- Add emoji to bot's message automatically
- Listen for reactions on bot messages only
- Grant/remove roles based on reaction add/remove events
- **Frontend**: `neuroviabot-frontend/components/dashboard/RoleReactionSettings.tsx`
- UI to create reaction role setups (select channel, create message, add emoji-role pairs)
- Real-time preview of the message before sending
- List existing reaction role messages with edit/delete options

### 1.4 Duplicate Log Prevention System

- **Bot Events**: `src/events/guildMemberAdd.js`, `guildMemberRemove.js`
- Add debounce mechanism to prevent duplicate event firing
- Implement event deduplication with timestamp tracking
- Create central event handler with duplicate detection

## Phase 2: Advanced Moderation System (Choice 4C)

### 2.1 Auto-Moderation Features

- **New File**: `src/handlers/autoModHandler.js`
- Anti-spam system (message rate limiting per user)
- Link filtering (whitelist/blacklist)
- Word filter with custom blocked words list
- Auto-action: mute, kick, ban based on violation severity
- **Database Schema**: Add to `simple-db`
- `automod_settings` per guild
- `automod_violations` tracking
- `filter_words`, `filter_links` arrays

### 2.2 Manual Moderation Tools

- **Enhance**: `src/commands/moderation.js`
- Warning system with `/warn`, `/warnings`, `/clearwarns`
- Temporary ban with auto-unban scheduler
- Timed mute system
- Case numbering for all mod actions
- **New Component**: `neuroviabot-frontend/components/dashboard/ModerationPanel.tsx`
- View all active cases (warns, bans, mutes)
- Mod action history per user
- Quick actions: mute, kick, ban from panel
- Case management: appeal, dismiss, edit

### 2.3 Advanced Protection

- **New Handler**: `src/handlers/raidProtectionHandler.js`
- Raid detection (multiple joins in short time)
- Verification system (require button click/captcha before access)
- Lockdown mode (auto-lock server on raid detection)
- **New Model**: `src/models/ModerationNote.js`
- Mod notes for users (visible only to moderators)
- Note categories: warning, info, suspicious
- **Frontend Integration**: Real-time mod log display in `AuditLog` component

## Phase 3: NRC Economy - Full Trading Ecosystem (Choice 2C)

### 3.1 NRC Core System Enhancements

- **NRC Earning Mechanisms**:
- Activity-based rewards: messages (5-15 NRC), voice time (10 NRC/min), reactions (2-5 NRC)
- Daily login bonuses with streak multipliers (Day 1: 100 NRC, Day 7: 500 NRC, Day 30: 2000 NRC)
- Quest completion rewards (50-1000 NRC based on difficulty)
- Event participation (special events: 500-5000 NRC)
- Leveling rewards (100 NRC × level number)
- Achievement unlocks (50-2000 NRC per achievement)

- **NRC Security & Anti-abuse**:
- Rate limiting per user (max earnings per hour/day)
- Anti-spam detection (similar message content, rapid messaging)
- Fraud detection for trades (unusual patterns, rapid transfers)
- Transaction logging with rollback capability
- Automated suspension for suspicious accounts

### 3.2 Global Trading Network

- **New File**: `src/handlers/tradingHandler.js`
- **P2P Trading Features**:
- Direct user-to-user NRC trades with escrow
- Trade offers with expiration timers (5min, 15min, 1hr, 24hr)
- Counter-offer system (negotiate amounts)
- Trade history with search/filter
- Reputation system (successful trades increase trust score)
- Dispute resolution system (freeze trades for review)

- **Trade Types**:
- Simple NRC exchange (user A ↔ user B)
- Item + NRC trades (inventory items + currency)
- Multi-party trades (up to 4 users)
- Auction system (bid with NRC, auto-outbid notifications)

- **Backend API**: `neuroviabot-backend/routes/trading.js`
- `/api/trading/create` - Create trade offer
- `/api/trading/accept/:id` - Accept trade
- `/api/trading/counter/:id` - Counter-offer
- `/api/trading/history/:userId` - User trade history
- `/api/trading/reputation/:userId` - Get user trade reputation
- `/api/trading/auctions` - Browse active auctions

### 3.3 Inter-Server Marketplace

- **Enhance**: `src/routes/marketplace.js`
- **Marketplace Features**:
- Cross-server global marketplace (all users can list/buy)
- Server-exclusive marketplaces (guild-specific items)
- Categories: Cosmetics, Boosts, Features, Collectibles, Limited Edition
- Advanced search: price range, item type, seller rating, availability
- Watchlist/favorites for items
- Price history graphs (track item value trends)
- "Make an Offer" feature for negotiable listings

- **Guild Marketplace Controls**:
- Server owners set marketplace tax (0-10%)
- Tax revenue goes to guild treasury
- Guild treasury funds: server boosts, events, giveaways
- Whitelist/blacklist sellers
- Featured listings (premium guilds get top placement)
- Marketplace moderation (report scams)

- **Database Schema**:
- `marketplace_listings`: `id`, `guildId`, `userId`, `itemType`, `itemName`, `description`, `price`, `quantity`, `listed_at`, `expires_at`, `featured`, `negotiable`
- `marketplace_transactions`: `id`, `listingId`, `buyerId`, `sellerId`, `amount`, `tax`, `timestamp`, `status`
- `guild_treasury`: `guildId`, `balance`, `total_earned`, `transactions`

### 3.4 NRC Shop System - Special Items & Features

- **New File**: `src/commands/nrc-shop.js`
- **Shop Categories**:

**Profile Customization** (50-500 NRC):

- Custom profile badges (Verified, OG, Whale, Trader, etc.)
- Profile banners (animated, themed, seasonal)
- Name colors/effects (gradient, glow, rainbow)
- Custom profile backgrounds
- Profile frames/borders

**Server Boosts** (1000-5000 NRC):

- XP multiplier boost (1.5x-3x for 24h-7d)
- NRC earnings boost (2x for server, 12-48h)
- Custom emoji slots (+5-20 slots)
- Channel unlock (temporary VIP channels)
- Role cosmetics (animated role icons)

**Exclusive Features** (500-10000 NRC):

- Extra custom command slots (+3-10 commands)
- Quest slots (+2-5 simultaneous quests)
- Inventory expansion (+10-50 slots)
- Private marketplace (invite-only trading)
- Bot command cooldown reduction (50%-90%)
- Custom welcome messages with embeds

**Collectibles & Limited Items**:

- Seasonal items (Halloween, Christmas, Summer)
- Event-exclusive items (NFT-style, limited quantity)
- Legendary items (extremely rare, high prestige)
- Trading cards (collect sets for bonuses)

- **Frontend**: `neuroviabot-frontend/app/nrc-shop/page.tsx`
- Browse shop with filters (category, price, availability)
- Real-time stock updates (Socket.IO)
- Preview items before purchase
- Gift items to other users (with personal message)
- Wishlist feature
- Purchase history
- Daily deals/flash sales section

### 3.5 NRC Investment & Growth Systems

- **New File**: `src/handlers/investmentHandler.js`
- **NRC Staking System**:
- Lock NRC for periods (7d, 30d, 90d, 365d)
- Earn interest (APY: 5%-20% based on duration)
- Early withdrawal penalty (10%-30% fee)
- Compound interest option (auto-reinvest)
- Staking leaderboard (highest stakers get perks)

- **NRC Lottery & Games**:
- Daily lottery (buy tickets with NRC, jackpot builds)
- Raffles (limited entries, guaranteed winners)
- Coin flip, dice games, slots (with house edge limits)
- Poker tournaments (entry fee, prize pool)
- Prediction markets (bet on events)

- **NRC Loans & Credit**:
- Borrow NRC from bot (with interest)
- Peer-to-peer lending (users lend to each other)
- Credit score based on repayment history
- Collateral system (stake items/assets)
- Auto-repayment from earnings

### 3.6 Economy Dashboard Panel

- **New Component**: `neuroviabot-frontend/components/dashboard/EconomyPanel.tsx`
- **Server Configuration**:
- Activity reward rates (message, voice, reaction NRC)
- Daily/weekly NRC caps per user
- Marketplace tax rate (0-10%)
- Guild treasury management
- Leaderboard settings (display options)

- **Economy Statistics**:
- Total NRC in circulation (server + global)
- Richest users (top 10 leaderboard)
- Most active traders
- Treasury balance & history
- Transaction volume graphs (daily/weekly/monthly)
- Inflation/deflation metrics

- **Admin Controls** (Server Owners):
- Gift NRC to users (events, giveaways)
- Adjust user balances (corrections)
- View transaction logs
- Freeze suspicious accounts
- Configure quest rewards
- Set marketplace features (enable/disable categories)

- **Developer-Only Controls** (NRC Base Value):
- Global NRC exchange rate (bot owners only)
- Server as a "Federal Reserve" (mint/burn NRC)
- Economic health monitoring
- Anti-inflation measures
- Market manipulation detection

### 3.7 NRC API & Integration

- **Backend Routes**: `neuroviabot-backend/routes/nrc-economy.js`
- `/api/nrc/balance/:userId` - Get user balance
- `/api/nrc/transfer` - Transfer NRC between users
- `/api/nrc/earnings/:userId` - Earnings breakdown
- `/api/nrc/leaderboard/:guildId` - Server leaderboard
- `/api/nrc/global-stats` - Global NRC statistics
- `/api/nrc/treasury/:guildId` - Guild treasury info
- `/api/nrc/stake` - Create staking position
- `/api/nrc/loans` - Loan management

- **Webhook Integration**:
- Send NRC via external apps (Discord webhooks)
- Integrate with other bots (cross-bot economy)
- API keys for third-party access
- Rate limiting & authentication

## Phase 4: Developer Bot Management Panel (Choice 3C)

### 4.1 Secure Access Control

- **File**: `neuroviabot-backend/middleware/developerAuth.js`
- Check user ID against whitelist: `['315875588906680330', '413081778031427584']`
- Return 403 if unauthorized
- **Frontend**: `neuroviabot-frontend/components/layout/DeveloperMenu.tsx`
- Add to profile dropdown (visible only for developer IDs)
- "Bot Yönetim Paneli" menu item

### 4.2 Bot Management Dashboard

- **New Page**: `neuroviabot-frontend/app/dev/bot-management/page.tsx`
- **Bot Statistics**: Uptime, memory usage, CPU, latency, shard info
- **Guild Overview**: Total guilds, users, commands executed (last 24h)
- **Command Management**:
- List all commands with usage stats
- Enable/disable commands globally
- Edit command descriptions
- Create new commands (advanced)
- **Database Tools**:
- View table schemas
- Query builder interface
- Backup/restore database
- **System Controls**:
- Restart bot
- Clear caches
- Force sync commands
- View/download logs

### 4.3 Advanced Socket Infrastructure

- **New File**: `neuroviabot-backend/routes/developer.js`
- Real-time bot metrics via Socket.IO
- Command execution logs streamed live
- Database query results
- System alerts (errors, high memory, etc.)
- **Socket Events**:
- `dev:bot_stats` - Bot metrics every 5s
- `dev:command_executed` - Real-time command logs
- `dev:error_occurred` - Error notifications
- `dev:guild_update` - Guild join/leave events

### 4.4 Frontend Control Panel

- **Component**: `neuroviabot-frontend/components/dev/GuildSettings.tsx`
- Bulk edit guild settings (apply template to multiple servers)
- View all users in database with filters
- Manage premium subscriptions
- Whitelist/blacklist users or guilds

## Phase 5: Bot Commands Synchronization

### 5.1 Command Optimization

- **Review**: All files in `src/commands/`
- Remove unused/deprecated commands
- Ensure all commands have proper descriptions
- Add missing commands to registration
- **File**: `src/utils/commandRegistrar.js`
- Verify all commands are registered
- Remove legacy economy commands (keep only NRC system)

### 5.2 Dashboard Integration

- **Update**: `/komutlar` page
- Fetch command list from bot API: `/api/bot/commands`
- Group by category (Economy, Moderation, Fun, Utility, etc.)
- Show usage stats per command
- Live command search/filter

## Phase 6: Frontend Content Updates

### 6.1 Features Page Update

- **File**: `neuroviabot-frontend/app/ozellikler/page.tsx`
- Update features list to match current bot capabilities
- Add: NRC Economy, Trading Network, Advanced Moderation, Raid Protection
- Remove deprecated features

### 6.2 Feedback System Real-time (Choice 5C)

- **Backend**: `neuroviabot-backend/routes/feedback.js`
- `/api/feedback/submit` - Accept feedback from website form
- `/api/feedback/discord/:channelId` - Fetch from Discord feedback channel
- Merge both sources
- **Discord Integration**: `src/handlers/feedbackHandler.js`
- Listen to messages in designated feedback channel
- Parse and store in database
- **Frontend**: `neuroviabot-frontend/app/geri-bildirim/page.tsx`
- Replace mock data with real-time API data
- Update categories to match current features
- Add feedback submission form

### 6.3 Analytics Dashboard - Real-time Graphs (Choice 6C)

- **Component**: `neuroviabot-frontend/components/dashboard/AnalyticsDashboard.tsx`
- Replace in "Genel Bakış" section
- Use Chart.js or Recharts for graphs
- **Metrics**:
- Message activity (last 7/30 days) - line chart
- Voice channel activity - bar chart
- Member join/leave trend - area chart
- Top active hours heatmap
- Channel activity breakdown - pie chart
- User behavior analytics
- Predictive growth metrics (AI-based forecast)
- **Backend API**: `/api/bot/analytics/:guildId/advanced`
- Aggregate data from `analyticsHandler`
- Calculate trends and predictions

### 6.4 Homepage Redesign

- **File**: `neuroviabot-frontend/app/page.tsx`
- Redesign "Neler Yapabilirsin?" section
- Update icons: 
- Command icon: `CommandLineIcon` (already correct)
- Server icon: `Cog6ToothIcon` for settings
- Keep user icon as is
- Feature cards with hover animations
- Add testimonials section

## Phase 7: UI/UX Improvements

### 7.1 Member Management - Username Fix

- **Component**: `neuroviabot-frontend/components/dashboard/MemberManagement.tsx`
- Detect discriminator: if `#0`, hide it (new Discord username system)
- Display: `username` only, not `username#0`
- Fetch from Discord API to get updated usernames

### 7.2 Real-time Channel/Role Updates

- **File**: `neuroviabot-frontend/components/dashboard/ChannelManager.tsx`
- Add Socket.IO listener for `channel_created`, `channel_updated`, `channel_deleted`
- Update channel list without refresh
- Smooth animation when new channel appears
- **File**: `neuroviabot-frontend/components/dashboard/RoleEditor.tsx`
- Add Socket.IO listener for `role_created`, `role_updated`, `role_deleted`
- Update role list without refresh
- **Backend**: Emit Socket events when CRUD operations occur in `guild-management.js`

### 7.3 Branding Consistency

- **Global Replace**: `NeuroViaBot` → `Neurovia`
- Files: All frontend components, pages, and text content
- Exclude: code comments, variable names, file names

### 7.4 Language System Fix

- **File**: `neuroviabot-frontend/contexts/LanguageContext.tsx` (create if missing)
- Implement i18n with proper translations
- Detect incomplete translations and fallback to Turkish
- Fix flag display: English = 🇬🇧 (GB flag, not US)
- **Files to translate**: All `.tsx` files with user-facing text
- Create `locales/tr.json` and `locales/en.json`

### 7.5 Footer Pages

- **Create pages** for Footer links (styled with current theme):
- `/hakkimizda` - About page
- `/kariyer` - Careers page (under "Şirket")
- `/blog` - Blog page
- `/api-dokumantasyon` - API docs (under "Kaynaklar")
- `/destek` - Support page
- Update Footer component to link to these pages

### 7.6 Navigation Cleanup

- **File**: `neuroviabot-frontend/app/servers/page.tsx`
- Remove "Sunucu Yönetimi" button from navbar (duplicate)
- Keep only in sidebar navigation

## Phase 8: Backend Error Detection System

### 8.1 Automated Error Monitoring

- **New File**: `neuroviabot-backend/utils/errorDetector.js`
- Monitor all API routes for errors
- Track error frequency per endpoint
- Send alerts when error rate exceeds threshold
- Log errors to database with context
- **Integration**: Add middleware to all Express routes
- Wrap route handlers in try-catch
- Report errors to errorDetector
- Return user-friendly error messages

### 8.2 Health Check System

- **Endpoint**: `/api/health`
- Check database connection
- Verify bot connection
- Test Socket.IO
- Return status + uptime
- **Dashboard**: `neuroviabot-frontend/app/dev/system-health/page.tsx`
- Display health metrics
- Historical uptime graph
- Recent errors list

## Phase 9: Auto-Update System for Frontend

### 9.1 Dynamic Feature Detection

- **New File**: `neuroviabot-frontend/utils/featureSync.js`
- Fetch bot commands and features from API
- Compare with frontend feature list
- Detect missing or deprecated features
- Generate update report
- **Cron Job**: Run daily to check for sync issues
- Send notification to developers if discrepancies found

### 9.2 Content Management System

- **Database Table**: `cms_content`
- Store dynamic content (features, commands, descriptions)
- Admin panel to edit without code changes
- **API**: `/api/cms/:section`
- Fetch content for homepage, features page, etc.
- Update content from developer panel

## Implementation Order

1. **Critical Fixes** (Phase 1): Real-time systems, duplicate prevention
2. **Moderation & Economy** (Phases 2-3): Core feature expansions
3. **Developer Tools** (Phase 4): Bot management panel
4. **Content Updates** (Phases 5-6): Commands sync, analytics, feedback
5. **UI/UX Polish** (Phase 7): Branding, language, navigation
6. **Monitoring** (Phase 8): Error detection, health checks
7. **Automation** (Phase 9): Auto-update, CMS

## Testing Strategy

- Test each Socket.IO event with manual trigger
- Verify developer panel access control
- Load test trading system with concurrent users
- Check all language translations for completeness
- Validate error detection with intentional errors
- Ensure no mock data remains in production

### To-dos

- [ ] Create analytics tracking system with message, join/leave, command, and voice tracking
- [ ] Implement audit logger utility and integrate into all CRUD operations
- [ ] Update ServerOverview component with real Discord data
- [ ] Add all missing Socket.IO event listeners to frontend components
- [ ] Implement premium database schema and real data endpoints
- [ ] Remove mock data from RoleReactionSettings and use real API calls
- [ ] Integrate ColorPicker, PermissionSelector, EmojiPicker, ConfirmDialog into components
- [ ] Create reusable SearchBar component
- [ ] Perform functional, performance, and error handling testing