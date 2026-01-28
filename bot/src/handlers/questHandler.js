// ==========================================
// 🎯 Quest Handler
// ==========================================
// Manages daily/weekly quests and progression tracking

const { EmbedBuilder } = require('discord.js');
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

class QuestHandler {
    constructor() {
        this.initializeQuests();
    }

    // Initialize default quest templates
    initializeQuests() {
        const db = getDatabase();

        // Daily Quests
        const dailyQuests = [
            {
                questId: 'daily_messages',
                name: 'Sohbet Ustası',
                description: '10 mesaj gönder',
                type: 'daily',
                objectiveType: 'send_messages',
                target: 10,
                reward: 100,
                emoji: '💬'
            },
            {
                questId: 'daily_commands',
                name: 'Komut Kullanıcısı',
                description: '3 bot komutu kullan',
                type: 'daily',
                objectiveType: 'use_commands',
                target: 3,
                reward: 75,
                emoji: '🤖'
            },
            {
                questId: 'daily_xp',
                name: 'XP Avcısı',
                description: '500 XP kazan',
                type: 'daily',
                objectiveType: 'earn_xp',
                target: 500,
                reward: 150,
                emoji: '⭐'
            },
            {
                questId: 'daily_spend',
                name: 'Harcama Ustası',
                description: '500 NRC harca',
                type: 'daily',
                objectiveType: 'spend_nrc',
                target: 500,
                reward: 200,
                emoji: '💸'
            }
        ];

        // Weekly Quests
        const weeklyQuests = [
            {
                questId: 'weekly_daily_complete',
                name: 'Günlük Rutin',
                description: '5 günlük görev tamamla',
                type: 'weekly',
                objectiveType: 'complete_daily_quests',
                target: 5,
                reward: 500,
                emoji: '📅'
            },
            {
                questId: 'weekly_trades',
                name: 'Tüccar',
                description: '3 ticaret yap',
                type: 'weekly',
                objectiveType: 'make_trades',
                target: 3,
                reward: 750,
                emoji: '🤝'
            },
            {
                questId: 'weekly_level_milestone',
                name: 'Seviye Yükseliş',
                description: '3 seviye kazan',
                type: 'weekly',
                objectiveType: 'gain_levels',
                target: 3,
                reward: 1000,
                emoji: '📈'
            },
            {
                questId: 'weekly_games',
                name: 'Oyuncu',
                description: '5 oyun kazan',
                type: 'weekly',
                objectiveType: 'win_games',
                target: 5,
                reward: 1250,
                emoji: '🎮'
            }
        ];

        // Store quest templates
        [...dailyQuests, ...weeklyQuests].forEach(quest => {
            if (!db.data.questTemplates.has(quest.questId)) {
                db.data.questTemplates.set(quest.questId, quest);
            }
        });

        db.saveData();

        logger.success('[QuestHandler] Quest templates initialized');
    }

    // Get user's quest progress
    getUserProgress(userId) {
        const db = getDatabase();

        if (!db.data.questProgress.has(userId)) {
            this.initializeUserQuests(userId);
        }

        return db.data.questProgress.get(userId);
    }

    // Initialize quests for new user
    initializeUserQuests(userId) {
        const db = getDatabase();

        const progress = {
            userId,
            activeQuests: [],
            completedQuests: [],
            dailyStreak: 0,
            weeklyStreak: 0,
            lastDailyReset: new Date().toISOString(),
            lastWeeklyReset: new Date().toISOString(),
            totalCompleted: 0
        };

        // Assign daily quests
        for (const [questId, template] of db.data.questTemplates.entries()) {
            if (template.type === 'daily') {
                progress.activeQuests.push({
                    questId,
                    progress: 0,
                    target: template.target,
                    reward: template.reward,
                    startedAt: new Date().toISOString(),
                    expiresAt: this.getNextDailyReset().toISOString(),
                    completed: false
                });
            } else if (template.type === 'weekly') {
                progress.activeQuests.push({
                    questId,
                    progress: 0,
                    target: template.target,
                    reward: template.reward,
                    startedAt: new Date().toISOString(),
                    expiresAt: this.getNextWeeklyReset().toISOString(),
                    completed: false
                });
            }
        }

        db.data.questProgress.set(userId, progress);
        db.saveData();

        return progress;
    }

    // Get next daily reset time (00:00 UTC)
    getNextDailyReset() {
        const now = new Date();
        const reset = new Date(now);
        reset.setUTCHours(24, 0, 0, 0);
        return reset;
    }

    // Get next weekly reset time (Monday 00:00 UTC)
    getNextWeeklyReset() {
        const now = new Date();
        const reset = new Date(now);
        const currentDay = reset.getUTCDay();
        const daysUntilMonday = currentDay === 0 ? 1 : 8 - currentDay;
        reset.setUTCDate(reset.getUTCDate() + daysUntilMonday);
        reset.setUTCHours(0, 0, 0, 0);
        return reset;
    }

    // Check if quests need reset
    checkAndResetQuests(userId) {
        const userProgress = this.getUserProgress(userId);
        const now = new Date();
        const lastDailyReset = new Date(userProgress.lastDailyReset);
        const lastWeeklyReset = new Date(userProgress.lastWeeklyReset);

        let needsReset = false;

        // Check daily reset
        if (now >= this.getNextDailyReset()) {
            this.resetDailyQuests(userId);
            needsReset = true;
        }

        // Check weekly reset
        if (now >= this.getNextWeeklyReset()) {
            this.resetWeeklyQuests(userId);
            needsReset = true;
        }

        return needsReset;
    }

    // Reset daily quests
    resetDailyQuests(userId) {
        const db = getDatabase();
        const userProgress = this.getUserProgress(userId);

        // Check if all daily quests were completed (for streak)
        const dailyQuests = userProgress.activeQuests.filter(q => {
            const template = db.data.questTemplates.get(q.questId);
            return template?.type === 'daily';
        });

        const allCompleted = dailyQuests.every(q => q.completed);

        if (allCompleted && dailyQuests.length > 0) {
            userProgress.dailyStreak += 1;
        } else {
            userProgress.dailyStreak = 0;
        }

        // Remove old daily quests
        userProgress.activeQuests = userProgress.activeQuests.filter(q => {
            const template = db.data.questTemplates.get(q.questId);
            return template?.type !== 'daily';
        });

        // Add new daily quests
        for (const [questId, template] of db.data.questTemplates.entries()) {
            if (template.type === 'daily') {
                userProgress.activeQuests.push({
                    questId,
                    progress: 0,
                    target: template.target,
                    reward: template.reward,
                    startedAt: new Date().toISOString(),
                    expiresAt: this.getNextDailyReset().toISOString(),
                    completed: false
                });
            }
        }

        userProgress.lastDailyReset = new Date().toISOString();

        db.data.questProgress.set(userId, userProgress);
        db.saveData();

        logger.info(`[QuestHandler] Daily quests reset for ${userId}, streak: ${userProgress.dailyStreak}`);
    }

    // Reset weekly quests
    resetWeeklyQuests(userId) {
        const db = getDatabase();
        const userProgress = this.getUserProgress(userId);

        // Check if all weekly quests were completed (for streak)
        const weeklyQuests = userProgress.activeQuests.filter(q => {
            const template = db.data.questTemplates.get(q.questId);
            return template?.type === 'weekly';
        });

        const allCompleted = weeklyQuests.every(q => q.completed);

        if (allCompleted && weeklyQuests.length > 0) {
            userProgress.weeklyStreak += 1;
        } else {
            userProgress.weeklyStreak = 0;
        }

        // Remove old weekly quests
        userProgress.activeQuests = userProgress.activeQuests.filter(q => {
            const template = db.data.questTemplates.get(q.questId);
            return template?.type !== 'weekly';
        });

        // Add new weekly quests
        for (const [questId, template] of db.data.questTemplates.entries()) {
            if (template.type === 'weekly') {
                userProgress.activeQuests.push({
                    questId,
                    progress: 0,
                    target: template.target,
                    reward: template.reward,
                    startedAt: new Date().toISOString(),
                    expiresAt: this.getNextWeeklyReset().toISOString(),
                    completed: false
                });
            }
        }

        userProgress.lastWeeklyReset = new Date().toISOString();

        db.data.questProgress.set(userId, userProgress);
        db.saveData();

        logger.info(`[QuestHandler] Weekly quests reset for ${userId}, streak: ${userProgress.weeklyStreak}`);
    }

    // Increment quest progress
    incrementProgress(userId, objectiveType, amount = 1) {
        this.checkAndResetQuests(userId);
        
        const db = getDatabase();
        const userProgress = this.getUserProgress(userId);
        let anyUpdated = false;

        for (const quest of userProgress.activeQuests) {
            if (quest.completed) continue;

            const template = db.data.questTemplates.get(quest.questId);
            if (!template) continue;

            if (template.objectiveType === objectiveType) {
                quest.progress += amount;
                
                // Check if completed
                if (quest.progress >= quest.target) {
                    quest.progress = quest.target;
                    quest.completed = true;
                    quest.completedAt = new Date().toISOString();
                    
                    logger.info(`[QuestHandler] ${userId} completed quest: ${quest.questId}`);
                }

                anyUpdated = true;
            }
        }

        if (anyUpdated) {
            db.data.questProgress.set(userId, userProgress);
            db.saveData();
        }

        return anyUpdated;
    }

    // Claim quest reward
    async claimReward(userId, questId) {
        const db = getDatabase();
        const userProgress = this.getUserProgress(userId);

        const quest = userProgress.activeQuests.find(q => q.questId === questId);

        if (!quest) {
            throw new Error('Quest bulunamadı!');
        }

        if (!quest.completed) {
            throw new Error('Bu quest henüz tamamlanmadı!');
        }

        if (quest.claimed) {
            throw new Error('Bu quest ödülü zaten alındı!');
        }

        // Give reward
        db.addNeuroCoin(userId, quest.reward, 'quest_reward', {
            questId,
            reward: quest.reward
        });

        // Mark as claimed
        quest.claimed = true;
        quest.claimedAt = new Date().toISOString();

        // Move to completed quests
        userProgress.completedQuests.push({
            questId,
            completedAt: quest.completedAt,
            claimedAt: quest.claimedAt,
            reward: quest.reward
        });

        userProgress.totalCompleted += 1;

        // Update weekly quest progress if this was a daily quest
        const template = db.data.questTemplates.get(questId);
        if (template && template.type === 'daily') {
            this.incrementProgress(userId, 'complete_daily_quests', 1);
        }

        db.data.questProgress.set(userId, userProgress);
        db.saveData();

        logger.info(`[QuestHandler] ${userId} claimed quest reward: ${questId} (+${quest.reward} NRC)`);

        return {
            success: true,
            reward: quest.reward,
            newBalance: db.getNeuroCoinBalance(userId)
        };
    }

    // Create quest list embed
    createQuestListEmbed(userId, username, type = 'all') {
        const db = getDatabase();
        const userProgress = this.getUserProgress(userId);

        const embed = new EmbedBuilder()
            .setColor('#F39C12')
            .setTitle(`🎯 ${username} - Görevler`)
            .setTimestamp();

        // Filter quests by type
        let quests = userProgress.activeQuests;
        if (type !== 'all') {
            quests = quests.filter(q => {
                const template = db.data.questTemplates.get(q.questId);
                return template?.type === type;
            });
        }

        if (quests.length === 0) {
            embed.setDescription('❌ Aktif göreviniz yok!');
            return embed;
        }

        // Separate by type
        const dailyQuests = quests.filter(q => db.data.questTemplates.get(q.questId)?.type === 'daily');
        const weeklyQuests = quests.filter(q => db.data.questTemplates.get(q.questId)?.type === 'weekly');

        // Daily quests section
        if (dailyQuests.length > 0) {
            embed.addFields({
                name: '📅 Günlük Görevler',
                value: dailyQuests.map(q => {
                    const template = db.data.questTemplates.get(q.questId);
                    const progress = `${q.progress}/${q.target}`;
                    const percentage = Math.floor((q.progress / q.target) * 100);
                    const status = q.completed 
                        ? (q.claimed ? '✅' : '🎁') 
                        : `${percentage}%`;
                    
                    return `${template.emoji} **${template.name}** - ${status}\n└ ${progress} • +${q.reward} NRC`;
                }).join('\n\n'),
                inline: false
            });
        }

        // Weekly quests section
        if (weeklyQuests.length > 0) {
            embed.addFields({
                name: '📆 Haftalık Görevler',
                value: weeklyQuests.map(q => {
                    const template = db.data.questTemplates.get(q.questId);
                    const progress = `${q.progress}/${q.target}`;
                    const percentage = Math.floor((q.progress / q.target) * 100);
                    const status = q.completed 
                        ? (q.claimed ? '✅' : '🎁') 
                        : `${percentage}%`;
                    
                    return `${template.emoji} **${template.name}** - ${status}\n└ ${progress} • +${q.reward} NRC`;
                }).join('\n\n'),
                inline: false
            });
        }

        // Streak info
        if (userProgress.dailyStreak > 0 || userProgress.weeklyStreak > 0) {
            const streakText = [];
            if (userProgress.dailyStreak > 0) {
                streakText.push(`🔥 Günlük Streak: **${userProgress.dailyStreak}** gün`);
            }
            if (userProgress.weeklyStreak > 0) {
                streakText.push(`⭐ Haftalık Streak: **${userProgress.weeklyStreak}** hafta`);
            }

            embed.addFields({
                name: '📊 İstatistikler',
                value: streakText.join('\n'),
                inline: false
            });
        }

        embed.setFooter({ text: 'Ödül almak için: /nrc quest ödül-al' });

        return embed;
    }
}

// Singleton instance
let questHandlerInstance = null;

function getQuestHandler() {
    if (!questHandlerInstance) {
        questHandlerInstance = new QuestHandler();
    }
    return questHandlerInstance;
}

module.exports = { QuestHandler, getQuestHandler };

