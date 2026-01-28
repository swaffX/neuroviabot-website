// ==========================================
// NRC Database Schema Types
// ==========================================
// TypeScript interfaces for all NRC data structures

// User NRC Data
export interface UserNRCData {
  userId: string;
  discordUsername: string;
  discordAvatar: string | null;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalTrades: number;
  rank: number;
  joinedAt: Date;
  lastActive: Date;
  level: number;
  experience: number;
  referredBy: string | null;
  referralCount: number;
  premiumTier: 'free' | 'premium' | 'vip';
  premiumExpiresAt: Date | null;
}

// Transaction
export interface NRCTransaction {
  transactionId: string;
  userId: string;
  type: 'work' | 'daily' | 'trade' | 'game_win' | 'game_loss' | 'marketplace_purchase' | 'marketplace_sale' | 'referral' | 'quest' | 'achievement' | 'premium' | 'transfer';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  metadata: Record<string, any>;
  timestamp: Date;
}

// Achievement
export interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  category: 'trader' | 'earner' | 'gamer' | 'social';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  reward: number;
  iconUrl: string;
  requirement: {
    type: string;
    target: number;
  };
}

// User Achievement Progress
export interface UserAchievement {
  userId: string;
  achievementId: string;
  progress: number;
  unlockedAt: Date | null;
  claimed: boolean;
}

// Quest
export interface Quest {
  questId: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  objective: {
    type: string;
    target: number;
  };
  reward: number;
  expiresAt: Date;
}

// User Quest Progress
export interface UserQuest {
  userId: string;
  questId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  startedAt: Date;
}

// Marketplace Listing
export interface MarketplaceListing {
  listingId: string;
  sellerId: string;
  itemType: 'nft' | 'role' | 'service' | 'custom';
  itemId: string;
  itemName: string;
  itemDescription: string;
  itemImage: string | null;
  price: number;
  status: 'active' | 'sold' | 'cancelled';
  listedAt: Date;
  soldAt: Date | null;
  buyerId: string | null;
}

// Game Result
export interface GameResult {
  gameId: string;
  userId: string;
  gameType: 'slots' | 'blackjack' | 'coinflip';
  betAmount: number;
  result: 'win' | 'loss';
  payout: number;
  metadata: Record<string, any>;
  timestamp: Date;
}

// Referral
export interface Referral {
  referralId: string;
  referrerId: string;
  referredUserId: string;
  status: 'pending' | 'active' | 'expired';
  reward: number;
  rewardClaimed: boolean;
  createdAt: Date;
}

// Activity Feed Item
export interface ActivityFeedItem {
  activityId: string;
  userId: string;
  username?: string;
  avatar?: string | null;
  type: string;
  amount: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Premium Subscription
export interface PremiumSubscription {
  subscriptionId: string;
  userId: string;
  tier: 'free' | 'premium' | 'vip';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled';
}

// Investment
export interface Investment {
  investmentId: string;
  userId: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  apy: number;
  status: 'active' | 'completed' | 'withdrawn_early';
  earnedInterest: number;
}

