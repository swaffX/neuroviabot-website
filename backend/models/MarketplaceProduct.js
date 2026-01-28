// ==========================================
// Marketplace Product Models
// ==========================================
// Mongoose schemas for marketplace product requests and approved products

const mongoose = require('mongoose');

// ==========================================
// Pending Product Request Schema
// ==========================================
const PendingProductRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true, index: true },
  guildId: { type: String, required: true, index: true },
  guildName: String,
  guildIcon: String,
  createdBy: { type: String, required: true, index: true }, // User ID
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

// Indexes for performance
PendingProductRequestSchema.index({ guildId: 1, status: 1 });
PendingProductRequestSchema.index({ createdBy: 1, status: 1 });
PendingProductRequestSchema.index({ createdAt: -1 });

// Update timestamp on save
PendingProductRequestSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ==========================================
// Approved Marketplace Product Schema
// ==========================================
const MarketplaceProductSchema = new mongoose.Schema({
  productId: { type: String, required: true, unique: true, index: true },
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

// Indexes for performance
MarketplaceProductSchema.index({ storeType: 1, isActive: 1, isPublished: 1 });
MarketplaceProductSchema.index({ guildId: 1, isActive: 1 });
MarketplaceProductSchema.index({ category: 1 });
MarketplaceProductSchema.index({ ownerId: 1 });
MarketplaceProductSchema.index({ publishedAt: -1 });

// Update timestamp on save
MarketplaceProductSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ==========================================
// Marketplace Order Schema
// ==========================================
const MarketplaceOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true, index: true },
  productId: { type: String, required: true, index: true },
  
  // Buyer & Seller
  buyerId: { type: String, required: true, index: true },
  buyerUsername: String,
  sellerId: { type: String, required: true, index: true },
  sellerUsername: String,
  
  // Guild
  guildId: String,
  guildName: String,
  
  // Product snapshot at time of purchase
  productSnapshot: {
    title: String,
    description: String,
    category: String,
    icon: String,
    images: [String],
    deliveryType: String,
    deliveryData: mongoose.Schema.Types.Mixed,
  },
  
  // Price
  price: { type: Number, required: true }, // Price at time of purchase
  
  // Status
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled', 'refunded', 'failed'], 
    default: 'pending',
    index: true 
  },
  
  // Delivery
  deliveredAt: Date,
  deliveryProof: String, // Screenshot or log
  deliveryNote: String,
  
  // Transaction
  transactionId: String, // NRC transaction ID
  
  // Refund
  refundedAt: Date,
  refundReason: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for performance
MarketplaceOrderSchema.index({ buyerId: 1, status: 1 });
MarketplaceOrderSchema.index({ sellerId: 1, status: 1 });
MarketplaceOrderSchema.index({ guildId: 1 });
MarketplaceOrderSchema.index({ createdAt: -1 });

// Update timestamp on save
MarketplaceOrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ==========================================
// Export Models
// ==========================================
const PendingProductRequest = mongoose.model('PendingProductRequest', PendingProductRequestSchema);
const MarketplaceProduct = mongoose.model('MarketplaceProduct', MarketplaceProductSchema);
const MarketplaceOrder = mongoose.model('MarketplaceOrder', MarketplaceOrderSchema);

module.exports = {
  PendingProductRequest,
  MarketplaceProduct,
  MarketplaceOrder,
  PendingProductRequestSchema,
  MarketplaceProductSchema,
  MarketplaceOrderSchema,
};

