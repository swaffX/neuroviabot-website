const { logger } = require('../utils/logger');
const { getDatabase } = require('../database/simple-db');

class TempBanScheduler {
    constructor(client) {
        this.client = client;
        this.db = getDatabase();
        this.checkInterval = 60000; // 1 minute
        this.intervalId = null;
        
        this.startScheduler();
        logger.info('✅ Temporary Ban Scheduler initialized');
    }

    startScheduler() {
        // Initial check on startup
        this.checkExpiredBans();
        
        // Set up interval
        this.intervalId = setInterval(() => {
            this.checkExpiredBans();
        }, this.checkInterval);

        logger.info('[TempBanScheduler] Scheduler started (checking every 60 seconds)');
    }

    async checkExpiredBans() {
        try {
            if (!this.db.data.tempBans) {
                this.db.data.tempBans = new Map();
                return;
            }

            const now = Date.now();
            const expiredBans = [];

            // Find expired bans
            for (const [key, ban] of this.db.data.tempBans) {
                if (ban.expiresAt <= now) {
                    expiredBans.push({ key, ban });
                }
            }

            if (expiredBans.length === 0) return;

            logger.info(`[TempBanScheduler] Found ${expiredBans.length} expired temp bans`);

            // Process expired bans
            for (const { key, ban } of expiredBans) {
                await this.unbanUser(ban.userId, ban.guildId, key);
            }

        } catch (error) {
            logger.error('[TempBanScheduler] Error checking expired bans:', error);
        }
    }

    async unbanUser(userId, guildId, banKey) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            
            if (!guild) {
                logger.warn(`[TempBanScheduler] Guild ${guildId} not found, removing ban record`);
                this.db.data.tempBans.delete(banKey);
                this.db.save();
                return;
            }

            // Unban the user
            await guild.members.unban(userId, 'Temporary ban expired');
            logger.info(`[TempBanScheduler] Unbanned user ${userId} from ${guild.name}`);

            // Remove from database
            this.db.data.tempBans.delete(banKey);
            this.db.save();

            // Log to mod channel if configured
            const modChannel = guild.channels.cache.find(c => 
                c.name.includes('mod-log') || c.name.includes('ban-log')
            );

            if (modChannel) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('⏰ Geçici Yasak Sona Erdi')
                    .setDescription(`<@${userId}> kullanıcısının geçici yasağı otomatik olarak kaldırıldı.`)
                    .addFields(
                        { name: 'Kullanıcı ID', value: userId, inline: true },
                        { name: 'Tarih', value: new Date().toLocaleString('tr-TR'), inline: true }
                    )
                    .setTimestamp();

                await modChannel.send({ embeds: [embed] });
            }

        } catch (error) {
            if (error.code === 10026) {
                // Unknown Ban - user wasn't banned
                logger.warn(`[TempBanScheduler] User ${userId} was not banned, removing record`);
                this.db.data.tempBans.delete(banKey);
                this.db.save();
            } else {
                logger.error(`[TempBanScheduler] Error unbanning user ${userId}:`, error);
            }
        }
    }

    addTempBan(userId, guildId, expiresAt, reason = 'No reason provided') {
        if (!this.db.data.tempBans) {
            this.db.data.tempBans = new Map();
        }

        const key = `${userId}_${guildId}`;
        const ban = {
            userId,
            guildId,
            expiresAt,
            reason,
            createdAt: Date.now()
        };

        this.db.data.tempBans.set(key, ban);
        this.db.save();

        logger.info(`[TempBanScheduler] Added temp ban for ${userId} in ${guildId}, expires at ${new Date(expiresAt).toISOString()}`);
    }

    getTempBan(userId, guildId) {
        if (!this.db.data.tempBans) return null;
        return this.db.data.tempBans.get(`${userId}_${guildId}`) || null;
    }

    removeTempBan(userId, guildId) {
        if (!this.db.data.tempBans) return false;
        
        const key = `${userId}_${guildId}`;
        const existed = this.db.data.tempBans.has(key);
        
        if (existed) {
            this.db.data.tempBans.delete(key);
            this.db.save();
            logger.info(`[TempBanScheduler] Removed temp ban for ${userId} in ${guildId}`);
        }
        
        return existed;
    }

    getAllTempBans(guildId) {
        if (!this.db.data.tempBans) return [];
        
        const bans = [];
        for (const [key, ban] of this.db.data.tempBans) {
            if (ban.guildId === guildId) {
                bans.push({ ...ban, key });
            }
        }
        
        return bans;
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info('[TempBanScheduler] Scheduler stopped');
        }
    }
}

module.exports = TempBanScheduler;

