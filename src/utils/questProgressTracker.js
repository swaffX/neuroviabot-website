// ==========================================
// 🎯 Quest Progress Tracker
// ==========================================
// Automatically track quest progress from events

const { getDatabase } = require('../database/simple-db');
const { logger } = require('./logger');

class QuestProgressTracker {
    constructor() {
        this.userMessageCount = new Map(); // userId -> count (daily)
        this.userVoiceTime = new Map(); // userId -> start time
    }

    /**
     * Track message for quest progress
     * @param {string} userId - User ID
     * @param {string} guildId - Guild ID
     */
    async trackMessage(userId, guildId) {
        try {
            const db = getDatabase();

            // Get or create quest progress
            let progress = db.data.questProgress.get(userId) || {
                activeQuests: [],
                completedQuests: [],
                dailyStreak: 0,
                lastReset: new Date().toISOString()
            };

            // Track message count for today
            const count = (this.userMessageCount.get(userId) || 0) + 1;
            this.userMessageCount.set(userId, count);

            // Update quest progress
            progress.activeQuests.forEach(quest => {
                if (quest.type === 'message' && quest.progress < quest.target) {
                    quest.progress += 1;
                    
                    if (quest.progress >= quest.target) {
                        logger.info(`[Quest] ${userId} completed message quest: ${quest.questId}`);
                    }
                }
            });

            db.data.questProgress.set(userId, progress);
            db.saveData();

        } catch (error) {
            logger.error('[Quest Tracker] Error tracking message:', error);
        }
    }

    /**
     * Track voice activity for quest progress
     * @param {string} userId - User ID
     * @param {string} guildId - Guild ID
     * @param {boolean} joined - Did user join voice?
     */
    async trackVoiceActivity(userId, guildId, joined) {
        try {
            const db = getDatabase();

            if (joined) {
                // User joined voice - record start time
                this.userVoiceTime.set(userId, Date.now());
            } else {
                // User left voice - calculate duration
                const startTime = this.userVoiceTime.get(userId);
                if (!startTime) return;

                const duration = Math.floor((Date.now() - startTime) / 1000 / 60); // minutes
                this.userVoiceTime.delete(userId);

                // Get or create quest progress
                let progress = db.data.questProgress.get(userId) || {
                    activeQuests: [],
                    completedQuests: [],
                    dailyStreak: 0,
                    lastReset: new Date().toISOString()
                };

                // Update quest progress
                progress.activeQuests.forEach(quest => {
                    if (quest.type === 'voice' && quest.progress < quest.target) {
                        quest.progress += duration;
                        
                        if (quest.progress >= quest.target) {
                            logger.info(`[Quest] ${userId} completed voice quest: ${quest.questId}`);
                        }
                    }
                });

                db.data.questProgress.set(userId, progress);
                db.saveData();
            }

        } catch (error) {
            logger.error('[Quest Tracker] Error tracking voice activity:', error);
        }
    }

    /**
     * Track game played for quest progress
     * @param {string} userId - User ID
     * @param {string} guildId - Guild ID
     */
    async trackGamePlayed(userId, guildId) {
        try {
            const db = getDatabase();

            // Get or create quest progress
            let progress = db.data.questProgress.get(userId) || {
                activeQuests: [],
                completedQuests: [],
                dailyStreak: 0,
                lastReset: new Date().toISOString()
            };

            // Update quest progress
            progress.activeQuests.forEach(quest => {
                if (quest.type === 'game' && quest.progress < quest.target) {
                    quest.progress += 1;
                    
                    if (quest.progress >= quest.target) {
                        logger.info(`[Quest] ${userId} completed game quest: ${quest.questId}`);
                    }
                }
            });

            db.data.questProgress.set(userId, progress);
            db.saveData();

        } catch (error) {
            logger.error('[Quest Tracker] Error tracking game:', error);
        }
    }

    /**
     * Track trade for quest progress
     * @param {string} userId - User ID
     * @param {string} guildId - Guild ID
     */
    async trackTrade(userId, guildId) {
        try {
            const db = getDatabase();

            // Get or create quest progress
            let progress = db.data.questProgress.get(userId) || {
                activeQuests: [],
                completedQuests: [],
                dailyStreak: 0,
                lastReset: new Date().toISOString()
            };

            // Update quest progress
            progress.activeQuests.forEach(quest => {
                if (quest.type === 'trade' && quest.progress < quest.target) {
                    quest.progress += 1;
                    
                    if (quest.progress >= quest.target) {
                        logger.info(`[Quest] ${userId} completed trade quest: ${quest.questId}`);
                    }
                }
            });

            db.data.questProgress.set(userId, progress);
            db.saveData();

        } catch (error) {
            logger.error('[Quest Tracker] Error tracking trade:', error);
        }
    }

    /**
     * Track level up for quest progress
     * @param {string} userId - User ID
     * @param {string} guildId - Guild ID
     * @param {number} newLevel - New level
     */
    async trackLevelUp(userId, guildId, newLevel) {
        try {
            const db = getDatabase();

            // Get or create quest progress
            let progress = db.data.questProgress.get(userId) || {
                activeQuests: [],
                completedQuests: [],
                dailyStreak: 0,
                lastReset: new Date().toISOString()
            };

            // Update quest progress
            progress.activeQuests.forEach(quest => {
                if (quest.type === 'level' && quest.progress < quest.target) {
                    quest.progress = newLevel;
                    
                    if (quest.progress >= quest.target) {
                        logger.info(`[Quest] ${userId} completed level quest: ${quest.questId}`);
                    }
                }
            });

            db.data.questProgress.set(userId, progress);
            db.saveData();

        } catch (error) {
            logger.error('[Quest Tracker] Error tracking level up:', error);
        }
    }

    /**
     * Reset daily counters
     */
    resetDailyCounters() {
        this.userMessageCount.clear();
        logger.info('[Quest Tracker] Daily counters reset');
    }
}

// Singleton instance
let questProgressTrackerInstance = null;

function getQuestProgressTracker() {
    if (!questProgressTrackerInstance) {
        questProgressTrackerInstance = new QuestProgressTracker();
    }
    return questProgressTrackerInstance;
}

module.exports = { QuestProgressTracker, getQuestProgressTracker };

