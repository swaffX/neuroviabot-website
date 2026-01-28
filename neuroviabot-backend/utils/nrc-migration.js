// ==========================================
// NRC Data Migration Helper
// ==========================================
// Helper functions to migrate data from simple-db to Mongoose
// Maintains backward compatibility with existing JSON database

const NRCModels = require('../models/NRC');

/**
 * Migrate NRC data from simple-db to Mongoose
 * @param {Object} db - Simple-db instance
 * @returns {Promise<Object>} Migration results
 */
async function migrateNRCData(db) {
  if (!db || !db.data) {
    throw new Error('Invalid database instance');
  }

  const results = {
    users: { migrated: 0, skipped: 0, errors: 0 },
    transactions: { migrated: 0, skipped: 0, errors: 0 },
    activities: { migrated: 0, skipped: 0, errors: 0 }
  };

  try {
    console.log('[NRC Migration] Starting data migration...');

    // Migrate Users
    if (db.data.users) {
      for (const [userId, userData] of db.data.users.entries()) {
        try {
          await NRCModels.UserNRCData.findOneAndUpdate(
            { userId },
            {
              userId,
              discordUsername: userData.username || `User${userId.substring(0, 4)}`,
              discordAvatar: userData.avatar || null,
              balance: userData.balance || 0,
              totalEarned: userData.totalEarned || 0,
              totalSpent: userData.totalSpent || 0,
              totalTrades: userData.totalTrades || 0,
              rank: userData.rank || 0,
              joinedAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
              lastActive: new Date(),
              level: userData.level || 1,
              experience: userData.experience || 0,
              referredBy: userData.referredBy || null,
              referralCount: userData.referralCount || 0,
              premiumTier: userData.premiumTier || 'free',
              premiumExpiresAt: userData.premiumExpiresAt ? new Date(userData.premiumExpiresAt) : null
            },
            { upsert: true, new: true }
          );
          results.users.migrated++;
        } catch (error) {
          console.error(`[NRC Migration] Error migrating user ${userId}:`, error.message);
          results.users.errors++;
        }
      }
    }

    // Migrate Activity Feed
    if (db.data.activityFeed) {
      for (const [activityId, activity] of db.data.activityFeed.entries()) {
        try {
          await NRCModels.ActivityFeed.findOneAndUpdate(
            { activityId },
            {
              activityId,
              userId: activity.userId,
              username: activity.username,
              avatar: activity.avatar,
              type: activity.type,
              amount: activity.amount || 0,
              metadata: activity.metadata || {},
              timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date()
            },
            { upsert: true, new: true }
          );
          results.activities.migrated++;
        } catch (error) {
          console.error(`[NRC Migration] Error migrating activity ${activityId}:`, error.message);
          results.activities.errors++;
        }
      }
    }

    console.log('[NRC Migration] Migration completed:', results);
    return results;
  } catch (error) {
    console.error('[NRC Migration] Migration failed:', error);
    throw error;
  }
}

/**
 * Sync a single user to Mongoose
 * @param {string} userId - User ID
 * @param {Object} userData - User data from simple-db
 * @returns {Promise<Object>} Mongoose document
 */
async function syncUserToMongoose(userId, userData) {
  try {
    return await NRCModels.UserNRCData.findOneAndUpdate(
      { userId },
      {
        userId,
        discordUsername: userData.username || `User${userId.substring(0, 4)}`,
        discordAvatar: userData.avatar || null,
        balance: userData.balance || 0,
        totalEarned: userData.totalEarned || 0,
        totalSpent: userData.totalSpent || 0,
        totalTrades: userData.totalTrades || 0,
        rank: userData.rank || 0,
        lastActive: new Date(),
        level: userData.level || 1,
        experience: userData.experience || 0,
        referredBy: userData.referredBy || null,
        referralCount: userData.referralCount || 0,
        premiumTier: userData.premiumTier || 'free',
        premiumExpiresAt: userData.premiumExpiresAt ? new Date(userData.premiumExpiresAt) : null
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`[NRC Migration] Error syncing user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Check if Mongoose is available
 * @returns {boolean} True if Mongoose is connected
 */
function isMongooseAvailable() {
  const mongoose = require('mongoose');
  return mongoose.connection.readyState === 1;
}

module.exports = {
  migrateNRCData,
  syncUserToMongoose,
  isMongooseAvailable
};

