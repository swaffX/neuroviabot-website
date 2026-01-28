// ==========================================
// MongoDB Connection Configuration
// ==========================================

const mongoose = require('mongoose');
const { initializeNRCDatabase, getDatabaseStats } = require('./db-init');

let isConnected = false;

/**
 * Connect to MongoDB Atlas
 */
async function connectDB() {
  if (isConnected) {
    console.log('✅ [MongoDB] Already connected');
    return;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      console.warn('⚠️  [MongoDB] MONGODB_URI not set, skipping connection');
      return;
    }

    console.log('🔄 [MongoDB] Connecting to MongoDB Atlas...');

    await mongoose.connect(MONGODB_URI, {
      // Connection options for MongoDB Atlas
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log('✅ [MongoDB] Successfully connected to MongoDB Atlas');
    console.log(`📊 [MongoDB] Database: ${mongoose.connection.name}`);

    // Initialize database (create collections if they don't exist)
    try {
      const initResult = await initializeNRCDatabase();
      
      // Get and display database stats
      const stats = await getDatabaseStats();
      if (stats) {
        console.log('📊 [MongoDB] Database Statistics:');
        console.log(`   - Users: ${stats.users}`);
        console.log(`   - Transactions: ${stats.transactions}`);
        console.log(`   - Achievements: ${stats.achievements}`);
        console.log(`   - Quests: ${stats.quests}`);
        console.log(`   - Marketplace Listings: ${stats.marketplaceListings}`);
        console.log(`   - Game Results: ${stats.gameResults}`);
        console.log(`   - Referrals: ${stats.referrals}`);
        console.log(`   - Activity Feed: ${stats.activityFeed}\n`);
      }
    } catch (initError) {
      console.error('⚠️  [MongoDB] Database initialization warning:', initError.message);
      console.log('   Database connection is active but initialization had issues.\n');
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ [MongoDB] Connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  [MongoDB] Disconnected from MongoDB Atlas');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ [MongoDB] Reconnected to MongoDB Atlas');
      isConnected = true;
    });

  } catch (error) {
    console.error('❌ [MongoDB] Connection failed:', error.message);
    console.warn('⚠️  [MongoDB] Continuing with simple-db (JSON database)');
    isConnected = false;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ [MongoDB] Disconnected successfully');
  } catch (error) {
    console.error('❌ [MongoDB] Disconnect error:', error);
  }
}

/**
 * Check if MongoDB is connected
 */
function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

/**
 * Get MongoDB connection stats
 */
function getConnectionStats() {
  if (!isConnected) {
    return { connected: false };
  }

  return {
    connected: true,
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    collections: Object.keys(mongoose.connection.collections).length
  };
}

module.exports = {
  connectDB,
  disconnectDB,
  isMongoConnected,
  getConnectionStats,
  getDatabaseStats
};

