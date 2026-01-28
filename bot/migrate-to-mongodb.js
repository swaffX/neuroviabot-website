// ==========================================
// 🔄 NeuroViaBot - MongoDB Migration Script
// ==========================================
// One-time script to migrate data from simple-db to MongoDB
// Run: node scripts/migrate-to-mongodb.js

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB Models
const ActivityFeed = require('./src/models/ActivityFeed');
const Analytics = require('./src/models/Analytics');
const Investment = require('./src/models/Investment');
const { QuestTemplate, QuestProgress } = require('./src/models/Quest');
const NRCUser = require('./src/models/NRCUser');
const User = require('./src/models/User');
const Guild = require('./src/models/Guild');
const GuildSettings = require('./src/models/GuildSettings');

// Database paths
const DB_PATH = path.join(__dirname, 'data/database.json');
const BACKUP_PATH = path.join(__dirname, 'data/database_backup_before_migration.json');


async function connectMongoDB() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI not set in environment');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
}

async function loadSimpleDB() {
    if (!fs.existsSync(DB_PATH)) {
        throw new Error(`Database file not found: ${DB_PATH}`);
    }

    // Create backup
    console.log('📦 Creating backup...');
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log(`✅ Backup created: ${BACKUP_PATH}`);

    // Load data
    const rawData = fs.readFileSync(DB_PATH, 'utf8');
    const data = JSON.parse(rawData);

    console.log('✅ Loaded simple-db data');
    return data;
}

async function migrateUsers(data) {
    console.log('\n👤 Migrating users...');

    if (!data.users) {
        console.log('⚠️ No users data found, skipping');
        return 0;
    }

    const users = Object.entries(data.users);
    let count = 0;

    for (const [userId, userData] of users) {
        try {
            await User.findOneAndUpdate(
                { odasi: userId },
                {
                    $set: {
                        odasi: userId,
                        username: userData.username || 'Unknown',
                        ...userData
                    }
                },
                { upsert: true }
            );
            count++;
        } catch (error) {
            console.error(`❌ Error migrating user ${userId}:`, error.message);
        }
    }

    console.log(`✅ Migrated ${count}/${users.length} users`);
    return count;
}

async function migrateNRCBalances(data) {
    console.log('\n💰 Migrating NRC balances...');

    if (!data.nrcBalances) {
        console.log('⚠️ No NRC balances found, skipping');
        return 0;
    }

    const balances = Object.entries(data.nrcBalances);
    let count = 0;

    for (const [userId, balance] of balances) {
        try {
            await NRCUser.findOneAndUpdate(
                { odasi: userId },
                {
                    $set: {
                        odasi: userId,
                        balance: balance || 0,
                        bank: data.nrcBankBalances?.[userId] || 0
                    }
                },
                { upsert: true }
            );
            count++;
        } catch (error) {
            console.error(`❌ Error migrating NRC balance for ${userId}:`, error.message);
        }
    }

    console.log(`✅ Migrated ${count}/${balances.length} NRC balances`);
    return count;
}

async function migrateActivityFeed(data) {
    console.log('\n📊 Migrating activity feed...');

    if (!data.activityFeed) {
        console.log('⚠️ No activity feed found, skipping');
        return 0;
    }

    const activities = Object.entries(data.activityFeed);
    let count = 0;

    for (const [activityId, activity] of activities) {
        try {
            await ActivityFeed.findOneAndUpdate(
                { activityId },
                {
                    $set: {
                        activityId,
                        type: activity.type || 'unknown',
                        userId: activity.userId,
                        username: activity.username || 'Unknown',
                        amount: activity.amount || 0,
                        details: activity.details || {},
                        timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date()
                    }
                },
                { upsert: true }
            );
            count++;
        } catch (error) {
            console.error(`❌ Error migrating activity ${activityId}:`, error.message);
        }
    }

    console.log(`✅ Migrated ${count}/${activities.length} activities`);
    return count;
}

async function migrateGuilds(data) {
    console.log('\n🏰 Migrating guilds...');

    if (!data.guilds) {
        console.log('⚠️ No guilds data found, skipping');
        return 0;
    }

    const guilds = Object.entries(data.guilds);
    let count = 0;

    for (const [guildId, guildData] of guilds) {
        try {
            await Guild.findOneAndUpdate(
                { guildId },
                {
                    $set: {
                        guildId,
                        name: guildData.name || 'Unknown Server',
                        ...guildData
                    }
                },
                { upsert: true }
            );
            count++;
        } catch (error) {
            console.error(`❌ Error migrating guild ${guildId}:`, error.message);
        }
    }

    console.log(`✅ Migrated ${count}/${guilds.length} guilds`);
    return count;
}

async function migrateGuildSettings(data) {
    console.log('\n⚙️ Migrating guild settings...');

    if (!data.settings) {
        console.log('⚠️ No guild settings found, skipping');
        return 0;
    }

    const settings = Object.entries(data.settings);
    let count = 0;

    for (const [guildId, settingsData] of settings) {
        try {
            await GuildSettings.findOneAndUpdate(
                { guildId },
                {
                    $set: {
                        guildId,
                        ...settingsData
                    }
                },
                { upsert: true }
            );
            count++;
        } catch (error) {
            console.error(`❌ Error migrating settings for ${guildId}:`, error.message);
        }
    }

    console.log(`✅ Migrated ${count}/${settings.length} guild settings`);
    return count;
}

async function main() {
    console.log('==========================================');
    console.log('🔄 NeuroViaBot - MongoDB Migration');
    console.log('==========================================\n');

    try {
        // Connect to MongoDB
        await connectMongoDB();

        // Load simple-db data
        const data = await loadSimpleDB();

        // Show data summary
        console.log('\n📋 Data Summary:');
        console.log(`   Users: ${Object.keys(data.users || {}).length}`);
        console.log(`   Guilds: ${Object.keys(data.guilds || {}).length}`);
        console.log(`   NRC Balances: ${Object.keys(data.nrcBalances || {}).length}`);
        console.log(`   Activities: ${Object.keys(data.activityFeed || {}).length}`);
        console.log(`   Settings: ${Object.keys(data.settings || {}).length}`);

        // Run migrations
        const stats = {
            users: await migrateUsers(data),
            nrcBalances: await migrateNRCBalances(data),
            activities: await migrateActivityFeed(data),
            guilds: await migrateGuilds(data),
            settings: await migrateGuildSettings(data)
        };

        // Summary
        console.log('\n==========================================');
        console.log('📊 Migration Summary');
        console.log('==========================================');
        console.log(`   Users: ${stats.users}`);
        console.log(`   NRC Balances: ${stats.nrcBalances}`);
        console.log(`   Activities: ${stats.activities}`);
        console.log(`   Guilds: ${stats.guilds}`);
        console.log(`   Settings: ${stats.settings}`);
        console.log('==========================================\n');

        console.log('✅ Migration completed successfully!');
        console.log('📝 Backup saved to:', BACKUP_PATH);
        console.log('\n⚠️ Next steps:');
        console.log('   1. Verify data in MongoDB');
        console.log('   2. Test bot functionality');
        console.log('   3. After confirming, optionally remove simple-db dependency');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB');
    }
}

main();
