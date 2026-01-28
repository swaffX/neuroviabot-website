<!-- 94c11824-0b50-4dc2-90c6-ed20cd137a27 d2f50874-7434-4768-b615-ae6ef7a5dbe9 -->
# NRC Marketplace System Implementation Plan

## Overview

Create a complete marketplace ecosystem where server owners can request products through their dashboard, developers can approve/deny requests, and approved products appear instantly on the marketplace. The marketplace will have two sections: Main Store (site features) and Server Stores (guild-specific products).

---

## Phase 1: Database Schema & Models

### 1.1 Create Mongoose Schemas

**File: `neuroviabot-backend/models/MarketplaceProduct.js`**

Create two schemas:

```javascript
// Pending Product Request Schema
const PendingProductRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true, index: true },
  guildName: String,
  guildIcon: String,
  createdBy: { type: String, required: true }, // User ID
  creatorUsername: String,
  creatorAvatar: String,
  
  // Product Details (for ProductCard 4 steps)
  category: { type: String, enum: ['role', 'custom'], required: true },
  
  // Step 1: Title, Icon, Image
  title: { type: String, required: true, maxlength: 100 },
  icon: String, // Emoji or HeroIcon name
  images: [String], // Array of URLs for carousel
  
  // Step 2: Description
  description: { type: String, required: true, maxlength: 500 },
  
  // Step 3: Price & Seller Info
  price: { type: Number, required: true, min: 10, max: 100000 },
  seller: String, // Display name for seller
  
  // Step 4: Delivery Details
  deliveryType: { type: String, enum: ['instant', 'manual'], default: 'manual' },
  deliveryData: {
    roleId: String, // For role category
    roleName: String,
    roleColor: String,
    duration: Number, // Days (0 = permanent)
    customInstructions: String,
  },
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'denied'], 
    default: 'pending',
    index: true 
  },
  
  // Developer Review
  reviewedBy: String, // Developer user ID
  reviewedAt: Date,
  reviewNote: String, // Reason for approval/denial
  
  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

// Approved Marketplace Product Schema
const MarketplaceProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  requestId: String, // Link to original request
  
  // Guild & Store Type
  storeType: { type: String, enum: ['main', 'server'], required: true, index: true },
  guildId: String, // Only for server stores
  guildName: String,
  guildIcon: String,
  
  ownerId: String, // Creator user ID
  ownerUsername: String,
  
  // Product Details (same as request)
  category: { type: String, enum: ['role', 'custom'], required: true },
  title: { type: String, required: true },
  icon: String,
  images: [String],
  description: { type: String, required: true },
  price: { type: Number, required: true },
  seller: String,
  
  deliveryType: String,
  deliveryData: mongoose.Schema.Types.Mixed,
  
  // Status & Stats
  isActive: { type: Boolean, default: true, index: true },
  isPublished: { type: Boolean, default: false, index: true }, // Owner must publish after approval
  isFeatured: { type: Boolean, default: false },
  
  views: { type: Number, default: 0 },
  purchases: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  publishedAt: Date,
  updatedAt: { type: Date, default: Date.now },
});
```

### 1.2 Add Indexes

- `PendingProductRequest`: guildId, createdBy, status, createdAt
- `MarketplaceProduct`: storeType, guildId, isActive, isPublished, category

---

## Phase 2: Backend API Endpoints

### 2.1 Product Request Routes

**File: `neuroviabot-backend/routes/marketplace-requests.js`**

```javascript
// POST /api/marketplace/requests - Create product request
// GET /api/marketplace/requests/:guildId - Get guild's requests
// GET /api/marketplace/requests/:requestId - Get single request
// PUT /api/marketplace/requests/:requestId - Update request (before approval)
// DELETE /api/marketplace/requests/:requestId - Cancel request

// GET /api/marketplace/requests/:guildId/pending - Pending requests for guild
// GET /api/marketplace/requests/:guildId/approved - Approved but unpublished
```

### 2.2 Developer Approval Routes

**File: `neuroviabot-backend/routes/developer-marketplace.js`**

```javascript
// GET /api/dev/marketplace/pending - All pending requests (with filters)
// POST /api/dev/marketplace/approve/:requestId - Approve request
// POST /api/dev/marketplace/deny/:requestId - Deny request
// GET /api/dev/marketplace/stats - Request statistics
```

### 2.3 Marketplace Public Routes

**File: Update `neuroviabot-backend/routes/marketplace.js`**

```javascript
// GET /api/marketplace/main - Main store products
// GET /api/marketplace/servers - List servers with stores (with search)
// GET /api/marketplace/server/:guildId - Server store products
// POST /api/marketplace/purchase/:productId - Purchase product
```

### 2.4 Middleware: Developer Auth

**File: `neuroviabot-backend/middleware/developerAuth.js`**

Already exists, use for developer routes.

---

## Phase 3: Socket.IO Real-Time Notifications

### 3.1 Marketplace Events

**File: `neuroviabot-backend/socket/marketplaceEvents.js`**

```javascript
// Events to emit:
// - 'marketplace:request:created' -> To developers
// - 'marketplace:request:approved' -> To guild owner
// - 'marketplace:request:denied' -> To guild owner
// - 'marketplace:product:published' -> To all marketplace viewers
// - 'marketplace:product:purchased' -> To seller
```

### 3.2 Notification System

Create notification badge system for:

- Dashboard navbar (guild owner)
- Developer portal navbar (developers)

---

## Phase 4: Dashboard Integration

### 4.1 Add Marketplace to Server Dashboard Sidebar

**File: `neuroviabot-frontend/app/dashboard/[serverId]/page.tsx`**

Update `categories` array:

```typescript
{
  id: 'marketplace',
  name: 'Marketplace',
  description: 'Sunucunuz için ürün oluşturun ve satış yapın',
  icon: ShoppingBagIcon,
  color: 'from-emerald-500 to-teal-500',
  premium: false,
  link: `/dashboard/${serverId}/marketplace` // Redirect to management page
}
```

### 4.2 Create Marketplace Management Page

**File: `neuroviabot-frontend/app/dashboard/[serverId]/marketplace/page.tsx`**

Sections:

1. **Header Stats**: Total requests, approved, pending, denied, total revenue
2. **Quick Actions**: "Create Product Request" button
3. **Tabs**: 

   - Pending Approval (yellow badge with count)
   - Approved - Awaiting Publish (green badge)
   - Published & Active (success)
   - Denied (with reasons)

4. **Product Cards**: List all products in card format with status badges

### 4.3 Create Product Request Form

**File: `neuroviabot-frontend/components/dashboard/marketplace/ProductRequestForm.tsx`**

Multi-step form (4 steps matching ProductCard):

- Step 1: Category, Title, Icon, Images
- Step 2: Description
- Step 3: Price, Seller Name
- Step 4: Delivery Type, Delivery Data (role selector, duration, custom instructions)

Use Framer Motion for step transitions, same glassmorphism style as NRC pages.

---

## Phase 5: Developer Portal - Product Requests

### 5.1 Add "Product Requests" to Dev Portal

**File: `neuroviabot-frontend/app/dev/page.tsx`**

Add navigation card:

```tsx
<Link href="/dev/marketplace-requests" className="bg-gray-800 hover:bg-gray-750...">
  <ShoppingBagIcon />
  <h3>Product Requests</h3>
  <p>Approve/deny marketplace products</p>
  {pendingCount > 0 && <Badge>{pendingCount}</Badge>}
</Link>
```

### 5.2 Create Product Requests Page

**File: `neuroviabot-frontend/app/dev/marketplace-requests/page.tsx`**

Features:

- **Filters**: Status (pending/all), Guild, Date range, Category
- **Sort**: Newest, oldest, price high/low
- **Request Card**: 
  - Product preview (all 4 steps)
  - Guild info (name, icon, member count)
  - Requester info (username, avatar)
  - Price validation indicator (too high/low/reasonable)
  - Content moderation flags (if any)
  - Approve button (green, opens confirmation modal)
  - Deny button (red, opens reason input modal)
- **Bulk Actions**: Approve multiple, deny multiple
- **Stats Dashboard**: Total requests, approval rate, average response time

### 5.3 Request Detail Modal

**File: `neuroviabot-frontend/components/dev/marketplace/RequestDetailModal.tsx`**

Show full product preview as it will appear on marketplace, with:

- All images in carousel
- Full description
- Delivery details
- Guild reputation score (if available)
- Requester history (previous requests)
- Approve/Deny actions with note input

---

## Phase 6: Marketplace Frontend Updates

### 6.1 Update Main Marketplace Page

**File: `neuroviabot-frontend/app/nrc/marketplace/page.tsx`**

Add tabs at the top:

- **Ana Mağaza** (Main Store)
- **Sunucu Mağazası** (Server Store)

**Main Store Tab:**

- Show site-provided products (storeType: 'main')
- Pre-populated products (e.g., Premium Bot Features, Special Roles, etc.)

**Server Store Tab:**

- Search bar: "Sunucu ara..."
- Server cards grid (product card style but for guilds):
  - Guild icon
  - Guild name
  - Member count
  - Product count
  - "Mağazaya Git" button
- Click opens: `/nrc/marketplace/server/:guildId`

### 6.2 Create Server Store Page

**File: `neuroviabot-frontend/app/nrc/marketplace/server/[guildId]/page.tsx`**

Hero section:

- Guild banner/icon
- Guild name
- Stats (products, sales, rating)
- "Go Back to Servers" button

Product grid:

- Show only published products for this guild
- Use existing ProductCard component
- Real-time updates via Socket.IO

---

## Phase 7: Notification & Real-Time Updates

### 7.1 Dashboard Notifications

**File: `neuroviabot-frontend/components/dashboard/NotificationBell.tsx`**

Create notification bell component for dashboard navbar showing:

- Product request approved
- Product request denied
- New purchase
- Low stock alert

### 7.2 Developer Portal Notifications

Similar notification bell for `/dev` pages showing:

- New product request submitted
- Request awaiting review for X days

### 7.3 Socket.IO Integration

**Files:**

- `neuroviabot-frontend/hooks/useMarketplaceSocket.tsx`
- `neuroviabot-backend/socket/marketplaceEvents.js`

Listen for events and update UI in real-time.

---

## Phase 8: Purchase Flow

### 8.1 Update Buy Button Handler

**File: `neuroviabot-frontend/app/nrc/marketplace/page.tsx`**

When "Buy Now" clicked:

1. Check user balance (NRC)
2. Show confirmation modal with delivery info
3. Create order (POST /api/marketplace/purchase/:productId)
4. Deduct NRC from buyer
5. Add NRC to seller (guild owner)
6. If instant delivery & role: Give role via Discord bot API
7. If manual: Notify seller
8. Show success message with delivery instructions

### 8.2 Order Management

Create order tracking system for buyers and sellers.

---

## Phase 9: SCSS Styling

### 9.1 Create Marketplace Dashboard Styles

**File: `neuroviabot-frontend/styles/pages/_marketplace-dashboard.scss`**

Use same theme as NRC pages:

- Dark background (#0f1018)
- Glassmorphism cards
- Purple/blue gradients
- Smooth animations
- Float effects on cards

### 9.2 Create Product Request Form Styles

**File: `neuroviabot-frontend/styles/components/_product-request-form.scss`**

Multi-step form with:

- Progress indicator
- Step transitions (slide)
- Input focus effects
- Image upload preview
- Form validation feedback

### 9.3 Create Developer Request Review Styles

**File: `neuroviabot-frontend/styles/pages/_dev-marketplace.scss`**

Dark theme for developer portal with:

- Request cards with hover effects
- Status badges (pending, approved, denied)
- Filter sidebar
- Modal overlays

---

## Phase 10: Testing & Edge Cases

### 10.1 Validation

- Price limits (10-100,000 NRC)
- Image URL validation
- XSS prevention in descriptions
- Role existence check (Discord API)

### 10.2 Error Handling

- Request submission failures
- Approval/denial failures
- Purchase failures (insufficient balance)
- Delivery failures (role not found)

### 10.3 Rate Limiting

- Max 5 product requests per guild per day
- Max 3 pending requests per guild

---

## Implementation Order

1. Phase 1: Database schemas (30 min)
2. Phase 2: Backend API routes (1-2 hours)
3. Phase 3: Socket.IO events (30 min)
4. Phase 4: Dashboard integration (1-2 hours)
5. Phase 5: Developer portal pages (2-3 hours)
6. Phase 6: Marketplace frontend (2-3 hours)
7. Phase 7: Notifications & real-time (1 hour)
8. Phase 8: Purchase flow (1-2 hours)
9. Phase 9: SCSS styling (1-2 hours)
10. Phase 10: Testing (1 hour)

**Total Estimated Time:** 12-18 hours

---

## Key Files to Create

Backend:

- `models/MarketplaceProduct.js`
- `routes/marketplace-requests.js`
- `routes/developer-marketplace.js`
- `socket/marketplaceEvents.js`

Frontend:

- `app/dashboard/[serverId]/marketplace/page.tsx`
- `components/dashboard/marketplace/ProductRequestForm.tsx`
- `components/dashboard/marketplace/ProductCard.tsx`
- `components/dashboard/NotificationBell.tsx`
- `app/dev/marketplace-requests/page.tsx`
- `components/dev/marketplace/RequestDetailModal.tsx`
- `components/dev/marketplace/RequestCard.tsx`
- `app/nrc/marketplace/server/[guildId]/page.tsx`
- `hooks/useMarketplaceSocket.tsx`

Styles:

- `styles/pages/_marketplace-dashboard.scss`
- `styles/components/_product-request-form.scss`
- `styles/pages/_dev-marketplace.scss`

---

## Database Collections

MongoDB:

- `pendingrequests` (PendingProductRequest schema)
- `marketplaceproducts` (MarketplaceProduct schema)
- `marketplaceorders` (reuse existing or create new)

---

## Critical Implementation Notes

1. All product requests auto-saved to database (even if denied/pending)
2. Developer approval moves from `pendingrequests` to `marketplaceproducts` with `isPublished: false`
3. Guild owner must click "Publish" in dashboard for product to go live
4. Real-time Socket.IO notifications for all status changes
5. URL structure: `/nrc/marketplace/server/:guildId` for server stores
6. Search functionality for finding servers with stores
7. Only categories: 'role' and 'custom' (no items or services)
8. Server owner determines price (no admin override)
9. Product card carousel uses same component as main marketplace

### To-dos

- [ ] Implement dynamic price calculation algorithm in backend with volume, supply/demand, and activity factors
- [ ] Create price API endpoints (current, history, stats) in nrc.js routes
- [ ] Add nrc_price_updated socket event with 30s interval emission
- [ ] Create NRCContext for global state management with price, activities, and stats
- [ ] Enhance useSocket hook with NRC-specific event listeners
- [ ] Create Coin3D component with CSS 3D transforms, rotation, and reflection
- [ ] Build hero section with glassmorphic price display, animated background, and particles
- [ ] Implement PriceChart component with recharts library and time period selector
- [ ] Create StatsDashboard with 4x2 grid of animated glass cards showing key metrics
- [ ] Build LiveTradingFeed component with real-time activity cards and socket integration
- [ ] Enhance TradingPanel with quick actions, balance display, and recent transactions
- [ ] Update ActivityCard and ActivityFilters with enhanced styling and animations
- [ ] Create comprehensive _nrc-coin.scss with glassmorphism, premium dark mode, and animations
- [ ] Complete page.tsx rewrite integrating all components with proper layout and structure
- [ ] Implement responsive design for mobile, tablet, and desktop layouts
- [ ] Test all real-time features, animations, and performance optimizations