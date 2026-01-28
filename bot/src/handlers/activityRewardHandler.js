// ==========================================
// 🎯 Activity-Based NeuroCoin Reward System
// ==========================================
// Users earn NRC through:
// - Messages (1-5 NRC per message, 1 min cooldown)
// - Voice activity (10-20 NRC per minute)
// - Reactions (5-10 NRC per reaction)
// - Server boost multipliers

const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

class ActivityRewardHandler {
    constructor(client) {
        this.client = client;
        this.voiceTracking = new Map(); // userId -> { joinTime, guildId }
        this.setupListeners();
        this.startVoiceRewardInterval();
    }

    setupListeners() {
        // Message rewards
        this.client.on('messageCreate', (message) => this.handleMessageReward(message));
        
        // Reaction rewards
        this.client.on('messageReactionAdd', (reaction, user) => this.handleReactionReward(reaction, user));
        
        // Voice tracking
        this.client.on('voiceStateUpdate', (oldState, newState) => this.handleVoiceStateUpdate(oldState, newState));
        
        logger.info('[ActivityReward] Listeners initialized');
    }

    async handleMessageReward(message) {
        // Ignore bots
        if (message.author.bot) return;
        
        // Ignore DMs
        if (!message.guild) return;

        const db = getDatabase();
        const settings = db.getGuildSettings(message.guild.id);
        
        // Check if economy is enabled
        if (!settings.economy?.enabled) return;

        const userId = message.author.id;
        const guildId = message.guild.id;

        // Check cooldown (1 minute)
        const lastReward = db.getLastActivityReward(userId);
        const now = Date.now();
        
        if (now - lastReward < 60000) return; // 1 min cooldown

        // Calculate reward
        const baseReward = Math.floor(Math.random() * 5) + 1; // 1-5 NRC
        const multiplier = await this.getServerMultiplier(guildId, message.member);
        const finalReward = Math.floor(baseReward * multiplier);

        // Award NRC
        db.updateNeuroCoinBalance(userId, finalReward, 'wallet');
        db.setLastActivityReward(userId, now);
        
        // Record transaction
        db.recordTransaction('system', userId, finalReward, 'activity', {
            type: 'message',
            guildId,
            multiplier
        });

        logger.debug(`[ActivityReward] ${message.author.username} earned ${finalReward} NRC from message`);
    }

    async handleReactionReward(reaction, user) {
        // Ignore bots
        if (user.bot) return;
        
        // Ignore partial reactions
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                return;
            }
        }

        const message = reaction.message;
        if (!message.guild) return;

        const db = getDatabase();
        const settings = db.getGuildSettings(message.guild.id);
        
        // Check if economy is enabled
        if (!settings.economy?.enabled) return;

        // Don't reward self-reactions
        if (message.author.id === user.id) return;

        const userId = user.id;
        const guildId = message.guild.id;

        // Check cooldown (30 seconds for reactions)
        const lastReward = db.getLastActivityReward(userId);
        const now = Date.now();
        
        if (now - lastReward < 30000) return; // 30 sec cooldown

        // Calculate reward (5-10 NRC)
        const baseReward = Math.floor(Math.random() * 6) + 5; // 5-10 NRC
        const member = await message.guild.members.fetch(userId).catch(() => null);
        const multiplier = member ? await this.getServerMultiplier(guildId, member) : 1;
        const finalReward = Math.floor(baseReward * multiplier);

        // Award NRC
        db.updateNeuroCoinBalance(userId, finalReward, 'wallet');
        db.setLastActivityReward(userId, now);
        
        // Record transaction
        db.recordTransaction('system', userId, finalReward, 'activity', {
            type: 'reaction',
            guildId,
            emoji: reaction.emoji.name,
            multiplier
        });

        logger.debug(`[ActivityReward] ${user.username} earned ${finalReward} NRC from reaction`);
    }

    handleVoiceStateUpdate(oldState, newState) {
        const userId = newState.id;
        const guildId = newState.guild.id;

        // User joined voice
        if (!oldState.channel && newState.channel) {
            this.voiceTracking.set(userId, {
                joinTime: Date.now(),
                guildId: guildId,
                channelId: newState.channel.id
            });
            logger.debug(`[ActivityReward] ${userId} joined voice in ${guildId}`);
        }
        
        // User left voice
        else if (oldState.channel && !newState.channel) {
            const tracking = this.voiceTracking.get(userId);
            if (tracking) {
                this.awardVoiceReward(userId, tracking);
                this.voiceTracking.delete(userId);
            }
            logger.debug(`[ActivityReward] ${userId} left voice in ${guildId}`);
        }
        
        // User switched channels (award for old channel, start tracking new)
        else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            const tracking = this.voiceTracking.get(userId);
            if (tracking) {
                this.awardVoiceReward(userId, tracking);
            }
            
            this.voiceTracking.set(userId, {
                joinTime: Date.now(),
                guildId: guildId,
                channelId: newState.channel.id
            });
            logger.debug(`[ActivityReward] ${userId} switched voice channels in ${guildId}`);
        }
    }

    async awardVoiceReward(userId, tracking) {
        const db = getDatabase();
        const settings = db.getGuildSettings(tracking.guildId);
        
        // Check if economy is enabled
        if (!settings.economy?.enabled) return;

        const now = Date.now();
        const duration = now - tracking.joinTime;
        const minutes = Math.floor(duration / 60000);

        // Minimum 1 minute to earn reward
        if (minutes < 1) return;

        // Calculate reward (10-20 NRC per minute)
        const rewardPerMinute = Math.floor(Math.random() * 11) + 10; // 10-20 NRC
        const guild = this.client.guilds.cache.get(tracking.guildId);
        const member = guild ? await guild.members.fetch(userId).catch(() => null) : null;
        const multiplier = member ? await this.getServerMultiplier(tracking.guildId, member) : 1;
        const finalReward = Math.floor(rewardPerMinute * minutes * multiplier);

        // Award NRC
        db.updateNeuroCoinBalance(userId, finalReward, 'wallet');
        
        // Record transaction
        db.recordTransaction('system', userId, finalReward, 'activity', {
            type: 'voice',
            guildId: tracking.guildId,
            minutes,
            multiplier
        });

        logger.debug(`[ActivityReward] ${userId} earned ${finalReward} NRC from ${minutes} minutes in voice`);
    }

    startVoiceRewardInterval() {
        // Award voice rewards every 5 minutes for active users
        setInterval(() => {
            const now = Date.now();
            
            for (const [userId, tracking] of this.voiceTracking.entries()) {
                const duration = now - tracking.joinTime;
                const minutes = Math.floor(duration / 60000);
                
                // Award every 5 minutes
                if (minutes >= 5) {
                    this.awardVoiceReward(userId, tracking);
                    
                    // Reset tracking
                    this.voiceTracking.set(userId, {
                        joinTime: now,
                        guildId: tracking.guildId,
                        channelId: tracking.channelId
                    });
                }
            }
        }, 5 * 60 * 1000); // Check every 5 minutes

        logger.info('[ActivityReward] Voice reward interval started (5 min)');
    }

    async getServerMultiplier(guildId, member) {
        let multiplier = 1.0;

        // Server boost multiplier
        if (member && member.premiumSince) {
            multiplier += 1.0; // 2x for boosters
        }

        // Role-based multipliers (can be configured per server)
        const db = getDatabase();
        const settings = db.getGuildSettings(guildId);
        
        if (settings.economy?.multiplierRoles && member) {
            for (const [roleId, roleMultiplier] of Object.entries(settings.economy.multiplierRoles)) {
                if (member.roles.cache.has(roleId)) {
                    multiplier += roleMultiplier;
                }
            }
        }

        return multiplier;
    }

    // Manual cleanup on bot shutdown
    async cleanup() {
        logger.info('[ActivityReward] Cleaning up voice tracking...');
        
        // Award remaining voice rewards
        for (const [userId, tracking] of this.voiceTracking.entries()) {
            await this.awardVoiceReward(userId, tracking);
        }
        
        this.voiceTracking.clear();
        logger.info('[ActivityReward] Cleanup complete');
    }
}

module.exports = ActivityRewardHandler;

