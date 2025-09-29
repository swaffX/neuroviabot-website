/**
 * Real-time güncelleme sistemi
 * Web dashboard ve diğer bileşenlere anlık güncellemeler gönderir
 */

class RealtimeUpdates {
    constructor() {
        this.broadcastToGuild = null;
        this.broadcastGlobally = null;
    }

    // Global broadcast fonksiyonlarını set et
    setBroadcastFunctions(broadcastToGuild, broadcastGlobally) {
        this.broadcastToGuild = broadcastToGuild;
        this.broadcastGlobally = broadcastGlobally;
    }

    /**
     * Ekonomi güncellemesi gönder
     */
    economyUpdate(guildId, userId, data) {
        if (!this.broadcastToGuild) return;
        
        this.broadcastToGuild(guildId, 'economy_update', {
            userId,
            data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Seviye güncellemesi gönder
     */
    levelUpdate(guildId, userId, data) {
        if (!this.broadcastToGuild) return;
        
        this.broadcastToGuild(guildId, 'level_update', {
            userId,
            data,
            timestamp: new Date().toISOString()
        });

        // Önemli level up'ları global'a da gönder
        if (data.levelUp && data.newLevel % 10 === 0) {
            this.broadcastGlobally('milestone_level_up', {
                guildId,
                userId,
                level: data.newLevel,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Moderasyon işlemi güncellemesi
     */
    moderationUpdate(guildId, data) {
        if (!this.broadcastToGuild) return;
        
        this.broadcastToGuild(guildId, 'moderation_update', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Müzik sistemi güncellemesi
     */
    musicUpdate(guildId, data) {
        if (!this.broadcastToGuild) return;
        
        this.broadcastToGuild(guildId, 'music_update', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Ticket sistemi güncellemesi
     */
    ticketUpdate(guildId, data) {
        if (!this.broadcastToGuild) return;
        
        this.broadcastToGuild(guildId, 'ticket_update', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Çekiliş güncellemesi
     */
    giveawayUpdate(guildId, data) {
        if (!this.broadcastToGuild) return;
        
        this.broadcastToGuild(guildId, 'giveaway_update', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Sunucu istatistik güncellemesi
     */
    serverStatsUpdate(guildId, stats) {
        if (!this.broadcastToGuild) return;
        
        this.broadcastToGuild(guildId, 'server_stats_update', {
            stats,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Kullanıcı aktivite güncellemesi
     */
    userActivityUpdate(guildId, userId, activity) {
        if (!this.broadcastToGuild) return;
        
        this.broadcastToGuild(guildId, 'user_activity_update', {
            userId,
            activity,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Bot status güncellemesi (global)
     */
    botStatusUpdate(status) {
        if (!this.broadcastGlobally) return;
        
        this.broadcastGlobally('bot_status_update', {
            status,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Güvenlik uyarısı (anti-raid, spam detection vb.)
     */
    securityAlert(guildId, alert) {
        if (!this.broadcastToGuild) return;
        
        this.broadcastToGuild(guildId, 'security_alert', {
            ...alert,
            priority: 'high',
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Kullanıcı katılım/ayrılım güncellemesi
     */
    memberUpdate(guildId, data) {
        if (!this.broadcastToGuild) return;
        
        this.broadcastToGuild(guildId, 'member_update', {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Sistem bildirimi (bakım, güncelleme vb.)
     */
    systemNotification(message, type = 'info') {
        if (!this.broadcastGlobally) return;
        
        this.broadcastGlobally('system_notification', {
            message,
            type, // info, warning, error, success
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Dashboard aktif kullanıcıları için heartbeat
     */
    heartbeat() {
        if (!this.broadcastGlobally) return;
        
        this.broadcastGlobally('heartbeat', {
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });
    }
}

// Singleton instance
const realtimeUpdates = new RealtimeUpdates();

module.exports = {
    RealtimeUpdates,
    realtimeUpdates
};
