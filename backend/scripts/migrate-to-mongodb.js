#!/usr/bin/env node
// ==========================================
// MongoDB Migration Script
// ==========================================
// Migrates data from simple-db (JSON) to MongoDB Atlas

require('dotenv').config();
const { connectDB, disconnectDB, isMongoConnected } = require('../config/database');
const { migrateNRCData } = require('../utils/nrc-migration');
const { getDatabase } = require('../database/simple-db');

async function runMigration() {
  console.log('🚀 [Migration] Starting MongoDB migration...\n');

  try {
    // Connect to MongoDB
    await connectDB();

    if (!isMongoConnected()) {
      console.error('❌ [Migration] Failed to connect to MongoDB');
      console.error('   Please check your MONGODB_URI in .env file');
      process.exit(1);
    }

    console.log('✅ [Migration] Connected to MongoDB Atlas\n');

    // Get simple-db instance
    const db = getDatabase();
    console.log('📊 [Migration] Simple-DB loaded');
    console.log(`   - Guilds: ${db.data.guilds?.size || 0}`);
    console.log(`   - Users: ${db.data.users?.size || 0}`);
    console.log(`   - Activity Feed: ${db.data.activityFeed?.size || 0}\n`);

    // Migrate NRC data
    console.log('🔄 [Migration] Migrating NRC data...');
    const results = await migrateNRCData(db);

    console.log('\n✅ [Migration] Migration completed successfully!\n');
    console.log('📊 Migration Results:');
    console.log('   Users:');
    console.log(`     - Migrated: ${results.users.migrated}`);
    console.log(`     - Skipped: ${results.users.skipped}`);
    console.log(`     - Errors: ${results.users.errors}`);
    console.log('   Transactions:');
    console.log(`     - Migrated: ${results.transactions.migrated}`);
    console.log(`     - Skipped: ${results.transactions.skipped}`);
    console.log(`     - Errors: ${results.transactions.errors}`);
    console.log('   Activities:');
    console.log(`     - Migrated: ${results.activities.migrated}`);
    console.log(`     - Skipped: ${results.activities.skipped}`);
    console.log(`     - Errors: ${results.activities.errors}\n`);

    console.log('💡 Note: Simple-DB is still active and will continue to work.');
    console.log('   MongoDB is now available as an alternative database.');

  } catch (error) {
    console.error('\n❌ [Migration] Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await disconnectDB();
    console.log('\n👋 [Migration] Disconnected from MongoDB\n');
    process.exit(0);
  }
}

// Run migration
runMigration();

