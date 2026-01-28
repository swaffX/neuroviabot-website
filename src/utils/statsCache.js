// ==========================================
// 📊 Merkezi Stats Cache Sistemi
// ==========================================
// Tüm bot istatistiklerini tek bir kaynaktan yönetir

class StatsCache {
    constructor() {
        this.cache = {
            guilds: 0,
            users: 0,
            commands: 0,
            channels: 0,
            uptime: 0,
            lastUpdate: null
        };
        this.client = null;
        this.updateInterval = null;
    }

    // Client'ı set et ve otomatik güncellemeyi başlat
    initialize(client) {
        this.client = client;
        
        // İlk hesaplama
        this.updateStats();
        
        // Her 2 dakikada bir güncelle
        this.updateInterval = setInterval(() => {
            this.updateStats();
        }, 2 * 60 * 1000); // 2 dakika

        console.log('📊 StatsCache başlatıldı - 2 dakikada bir otomatik güncelleme');
    }

    // İstatistikleri güncelle
    updateStats() {
        if (!this.client || !this.client.isReady()) {
            console.log('⚠️ StatsCache: Client hazır değil, güncelleme atlandı');
            return;
        }

        try {
            // Guilds
            this.cache.guilds = this.client.guilds.cache.size;

            // Users - Tüm guild'lerdeki benzersiz kullanıcılar
            const uniqueUsers = new Set();
            this.client.guilds.cache.forEach(guild => {
                // Guild member count kullan (daha doğru)
                if (guild.memberCount) {
                    // Her guild'in member count'unu doğrudan topla
                    // Set kullanmıyoruz çünkü aynı kullanıcı farklı sunucularda olabilir
                } else {
                    // Fallback: cache'den say
                    guild.members.cache.forEach(member => {
                        if (!member.user.bot) {
                            uniqueUsers.add(member.user.id);
                        }
                    });
                }
            });

            // Toplam kullanıcı sayısı (memberCount toplamı)
            let totalUsers = 0;
            this.client.guilds.cache.forEach(guild => {
                totalUsers += guild.memberCount || 0;
            });
            
            this.cache.users = totalUsers;

            // Commands
            this.cache.commands = this.client.commands ? this.client.commands.size : 0;

            // Channels
            this.cache.channels = this.client.channels.cache.size;

            // Uptime
            this.cache.uptime = this.client.uptime;

            // Last update
            this.cache.lastUpdate = new Date().toISOString();

            console.log(`📊 Stats güncellendi: ${this.cache.guilds} guild, ${this.cache.users.toLocaleString()} kullanıcı`);

        } catch (error) {
            console.error('❌ Stats güncelleme hatası:', error);
        }
    }

    // Stats'ı al
    getStats() {
        return {
            ...this.cache,
            ping: this.client ? this.client.ws.ping : 0,
            status: this.client && this.client.isReady() ? 'online' : 'offline'
        };
    }

    // Sadece kullanıcı sayısını al
    getUserCount() {
        return this.cache.users;
    }

    // Sadece guild sayısını al
    getGuildCount() {
        return this.cache.guilds;
    }

    // Stats'ı force update et
    forceUpdate() {
        console.log('🔄 Stats force update...');
        this.updateStats();
        return this.getStats();
    }

    // Cleanup
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('📊 StatsCache kapatıldı');
    }
}

// Singleton instance
const statsCache = new StatsCache();

module.exports = {
    statsCache,
    StatsCache
};

