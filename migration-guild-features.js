#!/usr/bin/env node

/**
 * NeuroViaBot - Guild Features Migration
 * Mevcut tüm guild'lere default features ayarlarını atar
 */

const { getDatabase } = require('./src/database/simple-db');
const config = require('./src/config');

console.log('🚀 Guild Features Migration başlatılıyor...\n');

try {
    const db = getDatabase();
    
    let updateCount = 0;
    let skipCount = 0;
    
    // Tüm guild'leri kontrol et
    db.data.settings.forEach((settings, guildId) => {
        if (!settings.features) {
            // Features yoksa default değerleri ekle
            settings.features = { ...config.features };
            db.updateGuildSettings(guildId, settings);
            console.log(`✅ Features eklendi: Guild ${guildId}`);
            updateCount++;
        } else {
            console.log(`⏭️  Features zaten mevcut: Guild ${guildId}`);
            skipCount++;
        }
    });
    
    // Değişiklikleri kaydet
    db.saveData();
    
    console.log('\n📊 Migration Özeti:');
    console.log(`   - Güncellenen guild'ler: ${updateCount}`);
    console.log(`   - Atlanan guild'ler: ${skipCount}`);
    console.log(`   - Toplam guild: ${updateCount + skipCount}`);
    console.log('\n✅ Migration tamamlandı!');
    
} catch (error) {
    console.error('❌ Migration hatası:', error);
    process.exit(1);
}

