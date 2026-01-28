#!/usr/bin/env node
// ==========================================
// Manual Database Initialization Script
// ==========================================
// Run this manually to initialize database and collections

require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/database');

async function main() {
  console.log('🚀 [DB Init] Manual database initialization started...\n');

  try {
    // Connect to MongoDB (this will automatically initialize the database)
    await connectDB();

    console.log('\n✅ [DB Init] Database initialization completed successfully!');
    console.log('📌 [DB Init] You can now use the database in your application.\n');

  } catch (error) {
    console.error('\n❌ [DB Init] Initialization failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await disconnectDB();
    console.log('👋 [DB Init] Disconnected from MongoDB\n');
    process.exit(0);
  }
}

// Run initialization
main();

