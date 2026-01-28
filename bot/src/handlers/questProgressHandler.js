// ==========================================
// 🗺️ Quest Progress Tracking Handler
// ==========================================
// Automatically tracks user progress on quests

const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

class QuestProgressHandler {
    constructor(client) {
        this.client = client;
        this.setupListeners();
        this.resetDailyQuests();
    }

    setupListeners() {
        // Message tracking
        this.client.on('messageCreate', (message) => this.handleMessage(message));
        
        // Reaction tracking
        this.client.on('messageReactionAdd', (reaction, user) => this.handleReaction(reaction, user));
        
        // Voice tracking (use existing voice tracking from activityRewardHandler)
        this.client.on('voiceStateUpdate', (oldState, newState) => this.handleVoiceUpdate(oldState, newState));
        
        logger.info('[QuestProgress] Listeners initialized');
    }

    async handleMessage(message) {
        if (message.author.bot || !message.guild) return;

        const db = getDatabase();
        const userId = message.author.id;
        
        // Update daily message quest
        this.updateQuestProgress(userId, 'daily_messages_10', 1);
    }

    async handleReaction(reaction, user) {
        if (user.bot) return;

        // Fetch partial reaction
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                return;
            }
        }

        const message = reaction.message;
        if (!message.guild || message.author.id === user.id) return;

        const db = getDatabase();
        
        // Update daily reaction quest
        this.updateQuestProgress(user.id, 'daily_reactions_5', 1);
    }

    handleVoiceUpdate(oldState, newState) {
        const userId = newState.id;
        
        // User joined voice
        if (!oldState.channel && newState.channel) {
            // Start tracking
            if (!this.voiceStartTimes) this.voiceStartTimes = new Map();
            this.voiceStartTimes.set(userId, Date.now());
        }
        
        // User left voice
        else if (oldState.channel && !newState.channel) {
            if (!this.voiceStartTimes) return;
            
            const startTime = this.voiceStartTimes.get(userId);
            if (startTime) {
                const duration = Math.floor((Date.now() - startTime) / 60000); // minutes
                this.updateQuestProgress(userId, 'daily_voice_30', duration);
                this.voiceStartTimes.delete(userId);
            }
        }
    }

    updateQuestProgress(userId, questId, increment = 1) {
        const db = getDatabase();
        const userProgress = db.data.questProgress.get(userId) || {};
        
        if (!userProgress[questId]) {
            userProgress[questId] = {
                current: 0,
                completed: false,
                claimed: false,
                startedAt: new Date().toISOString()
            };
        }

        const progress = userProgress[questId];
        
        // Don't update if already completed
        if (progress.completed) return;

        // Increment progress
        progress.current += increment;

        // Get quest details
        const quest = this.getQuestById(questId);
        if (!quest) return;

        // Check if completed
        if (progress.current >= quest.target) {
            progress.current = quest.target;
            progress.completed = true;
            progress.completedAt = new Date().toISOString();
            
            logger.info(`[QuestProgress] User ${userId} completed quest ${questId}`);
            
            // Notify user (optional - can send DM or emit event)
            this.notifyQuestComplete(userId, quest);
        }

        // Save progress
        userProgress[questId] = progress;
        db.data.questProgress.set(userId, userProgress);
        db.saveData();
    }

    async notifyQuestComplete(userId, quest) {
        try {
            const user = await this.client.users.fetch(userId);
            if (!user) return;

            await user.send({
                embeds: [{
                    color: 0x8B5CF6,
                    title: '🎉 Görev Tamamlandı!',
                    description: `**${quest.name}** görevini tamamladınız!\n\n**Ödül:** ${quest.reward} NRC ${quest.badge ? `+ ${quest.badge}` : ''}\n\nÖdülünüzü almak için \`/quest claim ${quest.id}\` komutunu kullanın.`,
                    timestamp: new Date()
                }]
            });
        } catch (error) {
            // User has DMs disabled or other error
            logger.debug(`[QuestProgress] Could not notify user ${userId}: ${error.message}`);
        }
    }

    getQuestById(questId) {
        const allQuests = [
            // Daily Quests
            { id: 'daily_messages_10', type: 'daily', name: '💬 Sohbet Ustası', target: 10, reward: 500, badge: null },
            { id: 'daily_reactions_5', type: 'daily', name: '👍 Tepki Göster', target: 5, reward: 300, badge: null },
            { id: 'daily_voice_30', type: 'daily', name: '🎤 Sesli Sohbet', target: 30, reward: 800, badge: null },

            // Weekly Quests
            { id: 'weekly_earn_5000', type: 'weekly', name: '💰 Zenginlik Yolu', target: 5000, reward: 2000, badge: '🏆 Zengin' },
            { id: 'weekly_trades_3', type: 'weekly', name: '🤝 Tüccar', target: 3, reward: 1500, badge: '🛒 Tüccar' },
            { id: 'weekly_games_10', type: 'weekly', name: '🎮 Oyuncu', target: 10, reward: 1000, badge: null },

            // Achievement Quests
            { id: 'achievement_level_50', type: 'achievement', name: '⭐ Seviye 50', target: 50, reward: 10000, badge: '⭐ Efsane' },
            { id: 'achievement_marketplace_10', type: 'achievement', name: '🛍️ Koleksiyoncu', target: 10, reward: 5000, badge: '🛍️ Koleksiyoncu' },
            { id: 'achievement_streak_30', type: 'achievement', name: '🔥 Sadık Kullanıcı', target: 30, reward: 15000, badge: '🔥 Sadık' }
        ];

        return allQuests.find(q => q.id === questId);
    }

    resetDailyQuests() {
        // Reset daily quests at midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const msUntilMidnight = tomorrow - now;

        setTimeout(() => {
            this.performDailyReset();
            
            // Set up daily interval
            setInterval(() => {
                this.performDailyReset();
            }, 24 * 60 * 60 * 1000); // 24 hours
        }, msUntilMidnight);

        logger.info(`[QuestProgress] Daily reset scheduled in ${Math.floor(msUntilMidnight / 1000 / 60)} minutes`);
    }

    performDailyReset() {
        const db = getDatabase();
        const allUsers = Array.from(db.data.questProgress.keys());

        for (const userId of allUsers) {
            const userProgress = db.data.questProgress.get(userId);
            
            // Reset daily quests
            const dailyQuestIds = ['daily_messages_10', 'daily_reactions_5', 'daily_voice_30'];
            
            for (const questId of dailyQuestIds) {
                if (userProgress[questId]) {
                    delete userProgress[questId];
                }
            }

            db.data.questProgress.set(userId, userProgress);
        }

        db.saveData();
        logger.info('[QuestProgress] Daily quests reset completed');
    }

    // Track NeuroCoin earnings for weekly quest
    trackEarnings(userId, amount) {
        this.updateQuestProgress(userId, 'weekly_earn_5000', amount);
    }

    // Track trades for weekly quest
    trackTrade(userId) {
        this.updateQuestProgress(userId, 'weekly_trades_3', 1);
    }

    // Track games for weekly quest
    trackGame(userId) {
        this.updateQuestProgress(userId, 'weekly_games_10', 1);
    }

    // Track marketplace purchases for achievement
    trackMarketplacePurchase(userId) {
        this.updateQuestProgress(userId, 'achievement_marketplace_10', 1);
    }

    // Track level for achievement
    trackLevel(userId, level) {
        if (level >= 50) {
            this.updateQuestProgress(userId, 'achievement_level_50', level);
        }
    }

    // Track streak for achievement
    trackStreak(userId, streak) {
        if (streak >= 30) {
            this.updateQuestProgress(userId, 'achievement_streak_30', streak);
        }
    }
}

module.exports = QuestProgressHandler;

