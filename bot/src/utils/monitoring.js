const { getDatabase } = require('../database/simple-db');
const { logger } = require('./logger');

class MonitoringService {
    constructor() {
        this.metrics = {
            neuroCoinTransactions: 0,
            marketplacePurchases: 0,
            questsCompleted: 0,
            achievementsUnlocked: 0,
            gamesPlayed: 0,
            activeUsers: new Set(),
            errors: []
        };

        this.startMonitoring();
    }

    startMonitoring() {
        // Log metrics every 5 minutes
        setInterval(() => {
            this.logMetrics();
        }, 5 * 60 * 1000);

        // Reset daily metrics at midnight
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow - now;

        setTimeout(() => {
            this.resetDailyMetrics();
            setInterval(() => {
                this.resetDailyMetrics();
            }, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);

        logger.info('[Monitoring] Service started');
    }

    trackTransaction(userId, amount, type) {
        this.metrics.neuroCoinTransactions++;
        this.metrics.activeUsers.add(userId);
    }

    trackMarketplacePurchase(userId, amount) {
        this.metrics.marketplacePurchases++;
        this.metrics.activeUsers.add(userId);
    }

    trackQuestCompletion(userId, questId) {
        this.metrics.questsCompleted++;
        this.metrics.activeUsers.add(userId);
    }

    trackAchievement(userId, achievementId) {
        this.metrics.achievementsUnlocked++;
        this.metrics.activeUsers.add(userId);
    }

    trackGame(userId, game, won) {
        this.metrics.gamesPlayed++;
        this.metrics.activeUsers.add(userId);
    }

    trackError(error, context) {
        this.metrics.errors.push({
            error: error.message,
            context,
            timestamp: new Date().toISOString()
        });

        // Keep only last 100 errors
        if (this.metrics.errors.length > 100) {
            this.metrics.errors.shift();
        }
    }

    logMetrics() {
        const db = getDatabase();
        const stats = db.getStats();

        logger.info('[Monitoring] Metrics Report:', {
            neuroCoinTransactions: this.metrics.neuroCoinTransactions,
            marketplacePurchases: this.metrics.marketplacePurchases,
            questsCompleted: this.metrics.questsCompleted,
            achievementsUnlocked: this.metrics.achievementsUnlocked,
            gamesPlayed: this.metrics.gamesPlayed,
            activeUsers: this.metrics.activeUsers.size,
            totalUsers: stats.users,
            totalGuilds: stats.guilds,
            errorCount: this.metrics.errors.length
        });
    }

    resetDailyMetrics() {
        this.metrics.neuroCoinTransactions = 0;
        this.metrics.marketplacePurchases = 0;
        this.metrics.questsCompleted = 0;
        this.metrics.achievementsUnlocked = 0;
        this.metrics.gamesPlayed = 0;
        this.metrics.activeUsers.clear();
        this.metrics.errors = [];

        logger.info('[Monitoring] Daily metrics reset');
    }

    getMetrics() {
        return {
            ...this.metrics,
            activeUsers: this.metrics.activeUsers.size
        };
    }
}

let monitoringService = null;

function getMonitoringService() {
    if (!monitoringService) {
        monitoringService = new MonitoringService();
    }
    return monitoringService;
}

module.exports = { getMonitoringService };

