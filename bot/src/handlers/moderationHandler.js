// ==========================================
// 🛡️ Advanced Moderation Handler
// ==========================================
// Comprehensive moderation system with warnings, mutes, appeals

const { EmbedBuilder } = require('discord.js');
const { logger } = require('../utils/logger');
const { getDatabase } = require('../database/simple-db');

class ModerationHandler {
    constructor(client) {
        this.client = client;
        this.db = getDatabase();
    }

    /**
     * Add warning to user
     */
    async addWarning(guildId, userId, moderatorId, reason) {
        try {
            const settings = this.db.getGuildSettings(guildId);
            if (!settings.moderation) settings.moderation = {};
            if (!settings.moderation.warnings) settings.moderation.warnings = new Map();

            const userWarnings = settings.moderation.warnings.get(userId) || [];
            
            const warning = {
                id: Date.now(),
                moderatorId,
                reason,
                timestamp: Date.now()
            };

            userWarnings.push(warning);
            settings.moderation.warnings.set(userId, userWarnings);
            
            this.db.setGuildSettings(guildId, settings);

            // Check for auto-punishment
            const maxWarnings = settings.moderation.maxWarnings || 3;
            if (userWarnings.length >= maxWarnings) {
                await this.applyAutoPunishment(guildId, userId, userWarnings.length);
            }

            logger.info(`[Moderation] Warning added: ${userId} in ${guildId} - Reason: ${reason}`);
            
            return {
                success: true,
                warningId: warning.id,
                totalWarnings: userWarnings.length,
                maxWarnings
            };
        } catch (error) {
            logger.error('[Moderation] Warning error:', error);
            throw error;
        }
    }

    /**
     * Apply auto-punishment based on warning count
     */
    async applyAutoPunishment(guildId, userId, warningCount) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;

            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) return;

            const settings = this.db.getGuildSettings(guildId);
            const punishments = settings.moderation?.punishments || {
                3: 'timeout',
                5: 'kick',
                7: 'ban'
            };

            const punishment = punishments[warningCount];
            if (!punishment) return;

            switch (punishment) {
                case 'timeout':
                    await member.timeout(24 * 60 * 60 * 1000, `Auto-punishment: ${warningCount} warnings`);
                    break;
                case 'kick':
                    await member.kick(`Auto-punishment: ${warningCount} warnings`);
                    break;
                case 'ban':
                    await member.ban({ reason: `Auto-punishment: ${warningCount} warnings` });
                    break;
            }

            logger.info(`[Moderation] Auto-punishment applied: ${punishment} for ${userId}`);
        } catch (error) {
            logger.error('[Moderation] Auto-punishment error:', error);
        }
    }

    /**
     * Remove warning
     */
    async removeWarning(guildId, userId, warningId) {
        try {
            const settings = this.db.getGuildSettings(guildId);
            if (!settings.moderation?.warnings) return { success: false };

            const userWarnings = settings.moderation.warnings.get(userId) || [];
            const updatedWarnings = userWarnings.filter(w => w.id !== warningId);
            
            settings.moderation.warnings.set(userId, updatedWarnings);
            this.db.setGuildSettings(guildId, settings);

            return { success: true, remainingWarnings: updatedWarnings.length };
        } catch (error) {
            logger.error('[Moderation] Remove warning error:', error);
            throw error;
        }
    }

    /**
     * Get user warnings
     */
    getUserWarnings(guildId, userId) {
        const settings = this.db.getGuildSettings(guildId);
        return settings.moderation?.warnings?.get(userId) || [];
    }

    /**
     * Create moderation case
     */
    async createCase(guildId, data) {
        try {
            const settings = this.db.getGuildSettings(guildId);
            if (!settings.moderation) settings.moderation = {};
            if (!settings.moderation.cases) settings.moderation.cases = [];

            const caseData = {
                id: settings.moderation.cases.length + 1,
                type: data.type, // ban, kick, mute, warn
                userId: data.userId,
                moderatorId: data.moderatorId,
                reason: data.reason,
                duration: data.duration,
                timestamp: Date.now(),
                active: true
            };

            settings.moderation.cases.push(caseData);
            this.db.setGuildSettings(guildId, settings);

            return caseData;
        } catch (error) {
            logger.error('[Moderation] Create case error:', error);
            throw error;
        }
    }

    /**
     * Get moderation history
     */
    getModerationHistory(guildId, userId = null, limit = 50) {
        const settings = this.db.getGuildSettings(guildId);
        let cases = settings.moderation?.cases || [];

        if (userId) {
            cases = cases.filter(c => c.userId === userId || c.moderatorId === userId);
        }

        return cases.slice(-limit).reverse();
    }
}

module.exports = ModerationHandler;


