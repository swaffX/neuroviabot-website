// ==========================================
// NRC Mongoose Models
// ==========================================
// Mongoose schemas for NRC system with validation

const mongoose = require('mongoose');

// User NRC Data Schema
const UserNRCDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  discordUsername: { type: String, required: true },
  discordAvatar: String,
  balance: { type: Number, default: 0, min: 0 },
  totalEarned: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  level: { type: Number, default: 1, min: 1 },
  experience: { type: Number, default: 0, min: 0 },
  referredBy: String,
  referralCount: { type: Number, default: 0 },
  premiumTier: { type: String, enum: ['free', 'premium', 'vip'], default: 'free' },
  premiumExpiresAt: Date
}, { timestamps: true });

// Indexes for performance
UserNRCDataSchema.index({ balance: -1 }); // Leaderboard
UserNRCDataSchema.index({ rank: 1 });
UserNRCDataSchema.index({ totalEarned: -1 });
UserNRCDataSchema.index({ lastActive: -1 });

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['work', 'daily', 'trade', 'game_win', 'game_loss', 'marketplace_purchase', 'marketplace_sale', 'referral', 'quest', 'achievement', 'premium', 'transfer'],
    required: true 
  },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Achievement Schema
const AchievementSchema = new mongoose.Schema({
  achievementId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['trader', 'earner', 'gamer', 'social'], 
    required: true 
  },
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'], 
    required: true 
  },
  reward: { type: Number, required: true },
  iconUrl: { type: String, required: true },
  requirement: {
    type: { type: String, required: true },
    target: { type: Number, required: true }
  }
});

// User Achievement Progress Schema
const UserAchievementSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  achievementId: { type: String, required: true },
  progress: { type: Number, default: 0 },
  unlockedAt: Date,
  claimed: { type: Boolean, default: false }
});

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

// Quest Schema
const QuestSchema = new mongoose.Schema({
  questId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly'], 
    required: true 
  },
  objective: {
    type: { type: String, required: true },
    target: { type: Number, required: true }
  },
  reward: { type: Number, required: true },
  expiresAt: { type: Date, required: true }
});

// User Quest Progress Schema
const UserQuestSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  questId: { type: String, required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  claimed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now }
});

UserQuestSchema.index({ userId: 1, questId: 1 }, { unique: true });

// Marketplace Listing Schema
const MarketplaceListingSchema = new mongoose.Schema({
  listingId: { type: String, required: true, unique: true },
  sellerId: { type: String, required: true, index: true },
  itemType: { 
    type: String, 
    enum: ['nft', 'role', 'service', 'custom'], 
    required: true 
  },
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  itemDescription: { type: String, required: true },
  itemImage: String,
  price: { type: Number, required: true, min: 1 },
  status: { 
    type: String, 
    enum: ['active', 'sold', 'cancelled'], 
    default: 'active',
    index: true
  },
  listedAt: { type: Date, default: Date.now, index: true },
  soldAt: Date,
  buyerId: String
});

// Game Result Schema
const GameResultSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  gameType: { 
    type: String, 
    enum: ['slots', 'blackjack', 'coinflip'], 
    required: true 
  },
  betAmount: { type: Number, required: true },
  result: { 
    type: String, 
    enum: ['win', 'loss'], 
    required: true 
  },
  payout: { type: Number, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Referral Schema
const ReferralSchema = new mongoose.Schema({
  referralId: { type: String, required: true, unique: true },
  referrerId: { type: String, required: true, index: true },
  referredUserId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'expired'], 
    default: 'pending' 
  },
  reward: { type: Number, required: true },
  rewardClaimed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Activity Feed Schema
const ActivityFeedSchema = new mongoose.Schema({
  activityId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  username: String,
  avatar: String,
  type: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Investment Schema
const InvestmentSchema = new mongoose.Schema({
  investmentId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  apy: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['active', 'completed', 'withdrawn_early'], 
    default: 'active' 
  },
  earnedInterest: { type: Number, default: 0 }
});

// Export models (only create if they don't exist)
module.exports = {
  UserNRCData: mongoose.models.UserNRCData || mongoose.model('UserNRCData', UserNRCDataSchema),
  Transaction: mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema),
  Achievement: mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema),
  UserAchievement: mongoose.models.UserAchievement || mongoose.model('UserAchievement', UserAchievementSchema),
  Quest: mongoose.models.Quest || mongoose.model('Quest', QuestSchema),
  UserQuest: mongoose.models.UserQuest || mongoose.model('UserQuest', UserQuestSchema),
  MarketplaceListing: mongoose.models.MarketplaceListing || mongoose.model('MarketplaceListing', MarketplaceListingSchema),
  GameResult: mongoose.models.GameResult || mongoose.model('GameResult', GameResultSchema),
  Referral: mongoose.models.Referral || mongoose.model('Referral', ReferralSchema),
  ActivityFeed: mongoose.models.ActivityFeed || mongoose.model('ActivityFeed', ActivityFeedSchema),
  Investment: mongoose.models.Investment || mongoose.model('Investment', InvestmentSchema)
};

