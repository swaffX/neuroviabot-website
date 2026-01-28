// ==========================================
// MongoDB Database Initialization
// ==========================================
// Automatically creates database and collections if they don't exist

const NRCModels = require('../models/NRC');

/**
 * Initialize NRC Database and Collections
 * Creates database if doesn't exist and ensures all collections are ready
 */
async function initializeNRCDatabase() {
  try {
    console.log('🔄 [DB Init] Checking database and collections...');

    // Get all model names
    const models = [
      { name: 'UserNRCData', model: NRCModels.UserNRCData },
      { name: 'Transaction', model: NRCModels.Transaction },
      { name: 'Achievement', model: NRCModels.Achievement },
      { name: 'UserAchievement', model: NRCModels.UserAchievement },
      { name: 'Quest', model: NRCModels.Quest },
      { name: 'UserQuest', model: NRCModels.UserQuest },
      { name: 'MarketplaceListing', model: NRCModels.MarketplaceListing },
      { name: 'GameResult', model: NRCModels.GameResult },
      { name: 'Referral', model: NRCModels.Referral },
      { name: 'ActivityFeed', model: NRCModels.ActivityFeed },
      { name: 'Investment', model: NRCModels.Investment }
    ];

    let createdCollections = 0;
    let existingCollections = 0;

    for (const { name, model } of models) {
      try {
        // Check if collection exists
        const collectionName = model.collection.name;
        const collections = await model.db.db.listCollections({ name: collectionName }).toArray();
        
        if (collections.length === 0) {
          // Collection doesn't exist, create it
          await model.createCollection();
          console.log(`   ✅ Created collection: ${collectionName}`);
          createdCollections++;
        } else {
          console.log(`   ℹ️  Collection exists: ${collectionName}`);
          existingCollections++;
        }

        // Ensure indexes are created
        await model.createIndexes();
        
      } catch (error) {
        // If collection already exists, that's fine
        if (error.code === 48) {
          console.log(`   ℹ️  Collection exists: ${model.collection.name}`);
          existingCollections++;
        } else {
          console.error(`   ⚠️  Error with ${name}:`, error.message);
        }
      }
    }

    console.log('✅ [DB Init] Database initialization complete!');
    console.log(`   - Created: ${createdCollections} collections`);
    console.log(`   - Existing: ${existingCollections} collections`);
    console.log(`   - Total: ${models.length} collections ready\n`);

    // Initialize seed data if collections are empty
    await seedInitialData();

    return {
      success: true,
      created: createdCollections,
      existing: existingCollections,
      total: models.length
    };

  } catch (error) {
    console.error('❌ [DB Init] Database initialization failed:', error.message);
    throw error;
  }
}

/**
 * Seed initial data (Achievements, Quests, etc.)
 * Only runs if collections are empty
 */
async function seedInitialData() {
  try {
    console.log('🌱 [DB Init] Checking seed data...');

    // Check if achievements exist
    const achievementCount = await NRCModels.Achievement.countDocuments();
    
    if (achievementCount === 0) {
      console.log('   🌱 Seeding initial achievements...');
      
      const achievements = [
        {
          achievementId: 'first_trade',
          name: 'First Trade',
          description: 'Complete your first NRC trade',
          category: 'trader',
          rarity: 'common',
          reward: 100,
          iconUrl: '💰',
          requirement: { type: 'trades', target: 1 }
        },
        {
          achievementId: 'high_roller',
          name: 'High Roller',
          description: 'Win 1000 NRC in games',
          category: 'gamer',
          rarity: 'rare',
          reward: 500,
          iconUrl: '🎰',
          requirement: { type: 'game_winnings', target: 1000 }
        },
        {
          achievementId: 'whale_status',
          name: 'Whale Status',
          description: 'Accumulate 10,000 NRC',
          category: 'earner',
          rarity: 'legendary',
          reward: 2000,
          iconUrl: '👑',
          requirement: { type: 'balance', target: 10000 }
        },
        {
          achievementId: 'social_butterfly',
          name: 'Social Butterfly',
          description: 'Refer 5 friends',
          category: 'social',
          rarity: 'epic',
          reward: 1000,
          iconUrl: '🦋',
          requirement: { type: 'referrals', target: 5 }
        }
      ];

      await NRCModels.Achievement.insertMany(achievements);
      console.log(`   ✅ Seeded ${achievements.length} achievements`);
    } else {
      console.log(`   ℹ️  ${achievementCount} achievements already exist`);
    }

    // Check if quests exist
    const questCount = await NRCModels.Quest.countDocuments();
    
    if (questCount === 0) {
      console.log('   🌱 Seeding initial quests...');
      
      const quests = [
        {
          questId: 'daily_worker',
          name: 'Daily Worker',
          description: 'Use /work command 10 times',
          type: 'daily',
          objective: { type: 'work', target: 10 },
          reward: 500,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        },
        {
          questId: 'weekly_trader',
          name: 'Weekly Trader',
          description: 'Complete 20 trades this week',
          type: 'weekly',
          objective: { type: 'trades', target: 20 },
          reward: 2000,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      ];

      await NRCModels.Quest.insertMany(quests);
      console.log(`   ✅ Seeded ${quests.length} quests`);
    } else {
      console.log(`   ℹ️  ${questCount} quests already exist`);
    }

    console.log('✅ [DB Init] Seed data check complete\n');

  } catch (error) {
    console.error('⚠️  [DB Init] Seed data error:', error.message);
    // Don't throw error, seeding is not critical
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    const stats = {};
    
    stats.users = await NRCModels.UserNRCData.countDocuments();
    stats.transactions = await NRCModels.Transaction.countDocuments();
    stats.achievements = await NRCModels.Achievement.countDocuments();
    stats.quests = await NRCModels.Quest.countDocuments();
    stats.marketplaceListings = await NRCModels.MarketplaceListing.countDocuments();
    stats.gameResults = await NRCModels.GameResult.countDocuments();
    stats.referrals = await NRCModels.Referral.countDocuments();
    stats.activityFeed = await NRCModels.ActivityFeed.countDocuments();

    return stats;
  } catch (error) {
    console.error('[DB Stats] Error:', error);
    return null;
  }
}

/**
 * Check database health
 */
async function checkDatabaseHealth() {
  try {
    // Try to perform a simple query
    await NRCModels.UserNRCData.findOne().limit(1);
    return { healthy: true, message: 'Database is operational' };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
}

module.exports = {
  initializeNRCDatabase,
  seedInitialData,
  getDatabaseStats,
  checkDatabaseHealth
};

