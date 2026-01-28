// ==========================================
// 🪙 NeuroCoin Economy Migration Script
// ==========================================
// Converts old economy system to NeuroCoin (NRC)
// Conversion rate: 1 old coin = 10 NRC

const { getDatabase } = require('./src/database/simple-db');
const { logger } = require('./src/utils/logger');

const CONVERSION_RATE = 10;

async function migrateEconomy() {
    console.log('🚀 Starting NeuroCoin Economy Migration...\n');
    
    const db = getDatabase();
    
    // Create backup first
    console.log('📦 Creating database backup...');
    const backupFile = db.createBackup();
    if (backupFile) {
        console.log(`✅ Backup created: ${backupFile}\n`);
    } else {
        console.log('⚠️  Warning: Could not create backup, continuing anyway...\n');
    }
    
    // Get old economy data
    const oldEconomy = db.data.userEconomy;
    console.log(`📊 Found ${oldEconomy.size} users in old economy system\n`);
    
    if (oldEconomy.size === 0) {
        console.log('ℹ️  No users to migrate. Starting fresh with NeuroCoin!\n');
        console.log('✅ Migration complete!\n');
        return;
    }
    
    let migratedCount = 0;
    let totalOldCoins = 0;
    let totalNewNRC = 0;
    
    console.log('💰 Converting balances...\n');
    
    for (const [userId, oldData] of oldEconomy) {
        const oldBalance = oldData.balance || 0;
        const oldBank = oldData.bank || 0;
        const oldTotal = oldBalance + oldBank;
        
        const newBalance = {
            wallet: oldBalance * CONVERSION_RATE,
            bank: oldBank * CONVERSION_RATE,
            total: oldTotal * CONVERSION_RATE,
            lastDaily: oldData.lastDaily || null,
            lastWork: oldData.lastWork || null,
        };
        
        db.data.neuroCoinBalances.set(userId, newBalance);
        
        // Record migration transaction
        db.recordTransaction('system', userId, newBalance.total, 'migration', {
            oldBalance,
            oldBank,
            conversionRate: CONVERSION_RATE,
            migratedAt: new Date().toISOString()
        });
        
        migratedCount++;
        totalOldCoins += oldTotal;
        totalNewNRC += newBalance.total;
        
        console.log(`  ✓ User ${userId}: ${oldTotal} coins → ${newBalance.total} NRC`);
    }
    
    // Save changes
    db.saveData();
    
    console.log('\n📈 Migration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Users migrated:     ${migratedCount}`);
    console.log(`  Total old coins:    ${totalOldCoins.toLocaleString()}`);
    console.log(`  Total new NRC:      ${totalNewNRC.toLocaleString()}`);
    console.log(`  Conversion rate:    1:${CONVERSION_RATE}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📝 Notes:');
    console.log('  - Old economy data is preserved (not deleted)');
    console.log('  - All transactions are recorded');
    console.log('  - Users can now use NeuroCoin (NRC)');
    console.log('  - Update your economy commands to use new system\n');
    
    console.log('🎉 Welcome to the NeuroCoin era!\n');
}

// Run migration
if (require.main === module) {
    migrateEconomy()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateEconomy, CONVERSION_RATE };

