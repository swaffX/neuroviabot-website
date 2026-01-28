const { ActivityType } = require('discord.js');
const { logger } = require('../utils/logger');
const CommandRegistrar = require('../utils/commandRegistrar');

module.exports = {
    name: 'clientReady',
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} olarak giriş yapıldı!`);
        console.log(`🎵 Bot hazır!`);
        
        // Stats cache'den gerçek sayıları al
        const stats = client.statsCache.getStats();
        console.log(`📊 ${stats.guilds} sunucuda aktif`);
        console.log(`👥 ${stats.users.toLocaleString()} kullanıcıya hizmet veriyor`);
        
        // Mevcut guild'leri database'e yükle
        loadExistingGuilds(client);
        
        // Bot status'unu ayarla - Merkezi stats cache kullan
        let activityIndex = 0;
        function updateActivity() {
            try {
                // Stats cache'den REAL-TIME veri al
                const stats = client.statsCache.getStats();
                
                // Rotate between website, stats and maintenance notice
                const activities = [
                    `neuroviabot.xyz 🌐`,
                    `${stats.users.toLocaleString()} kullanıcı | ${stats.guilds} sunucu 📊`,
                    `🎮 ${stats.guilds} sunucuda oynatılıyor`
                ];
                
                const activityText = activities[activityIndex];
                activityIndex = (activityIndex + 1) % activities.length;
                
                client.user.setActivity(activityText, { 
                    type: ActivityType.Streaming,
                    url: 'https://www.twitch.tv/swaffval'
                });
                
            } catch (error) {
                console.error('❌ Activity güncelleme hatası:', error);
            }
        }
        
        // İlk activity'i ayarla
        updateActivity();
        
        // REAL-TIME güncelleme: Her 10 saniyede bir activity değiştir
        setInterval(() => {
            updateActivity();
        }, 10000); // 10 saniye
        
        // Guild join/leave event'lerinde stats cache'i güncelle
        client.on('guildCreate', () => {
            client.statsCache.forceUpdate();
            setTimeout(() => updateActivity(), 1000);
        });
        
        client.on('guildDelete', () => {
            client.statsCache.forceUpdate();
            setTimeout(() => updateActivity(), 1000);
        });
        
        console.log('🚀 Bot tamamen hazır ve çalışıyor!');
        
        // Global client reference for API proxies
        global.discordClient = client;
        console.log('🔗 Discord client global olarak kaydedildi');
        
        // Otomatik komut kaydı - Discord API rate limit nedeniyle geçici olarak devre dışı
        // registerCommands(client);
    },
};

// Otomatik komut kaydı
async function registerCommands(client) {
    try {
        // 5 saniye bekle - bot tamamen hazır olsun
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        logger.info('🔄 Otomatik komut kaydı başlatılıyor...');
        const registrar = new CommandRegistrar(client);
        await registrar.autoRegister();
    } catch (error) {
        logger.error('Otomatik komut kaydı hatası', error);
    }
}

// Mevcut guild'leri database'e yükle
function loadExistingGuilds(client) {
    try {
        const db = require('../database/simple-db');
        let loadedCount = 0;
        
        console.log(`🔄 Mevcut ${client.guilds.cache.size} guild database'e yükleniyor...`);
        
        client.guilds.cache.forEach(guild => {
            const guildData = {
                name: guild.name,
                memberCount: guild.memberCount,
                ownerId: guild.ownerId,
                region: guild.preferredLocale,
                joinedAt: new Date().toISOString(),
                features: guild.features || [],
                boostLevel: guild.premiumTier || 0,
                boostCount: guild.premiumSubscriptionCount || 0,
                icon: guild.icon,
                active: true
            };
            
            db.getOrCreateGuild(guild.id, guildData);
            loadedCount++;
        });
        
        console.log(`✅ ${loadedCount} guild database'e yüklendi`);
        logger.success(`Bot başlangıcında ${loadedCount} guild database'e yüklendi`);
        
    } catch (error) {
        console.error('❌ Guild yükleme hatası:', error);
        logger.error('Guild yükleme hatası', error);
    }
}

