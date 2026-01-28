// ==========================================
// 🤖 NeuroViaBot - Analytics & Monitoring
// ==========================================

const { logger } = require('./logger');
const db = require('../database/simple-db');

class AnalyticsManager {
    constructor() {
        this.metrics = {
            commands: new Map(),
            guilds: new Map(),
            users: new Map(),
            errors: new Map(),
            performance: [],
            system: {
                startTime: Date.now(),
                totalCommands: 0,
                totalMessages: 0,
                totalErrors: 0,
                uptime: 0
            }
        };
        
        this.setupPeriodicReports();
    }

    // Command analytics
    trackCommand(commandName, userId, guildId, executionTime, success = true) {
        try {
            const timestamp = Date.now();
            
            // Command metrics
            if (!this.metrics.commands.has(commandName)) {
                this.metrics.commands.set(commandName, {
                    totalUses: 0,
                    successCount: 0,
                    errorCount: 0,
                    avgExecutionTime: 0,
                    totalExecutionTime: 0,
                    uniqueUsers: new Set(),
                    uniqueGuilds: new Set(),
                    firstUsed: timestamp,
                    lastUsed: timestamp
                });
            }

            const cmdStats = this.metrics.commands.get(commandName);
            cmdStats.totalUses++;
            cmdStats.totalExecutionTime += executionTime;
            cmdStats.avgExecutionTime = cmdStats.totalExecutionTime / cmdStats.totalUses;
            cmdStats.uniqueUsers.add(userId);
            cmdStats.uniqueGuilds.add(guildId);
            cmdStats.lastUsed = timestamp;

            if (success) {
                cmdStats.successCount++;
            } else {
                cmdStats.errorCount++;
            }

            // Guild metrics
            if (!this.metrics.guilds.has(guildId)) {
                this.metrics.guilds.set(guildId, {
                    commandCount: 0,
                    uniqueUsers: new Set(),
                    mostUsedCommands: new Map(),
                    firstActivity: timestamp,
                    lastActivity: timestamp,
                    errorRate: 0
                });
            }

            const guildStats = this.metrics.guilds.get(guildId);
            guildStats.commandCount++;
            guildStats.uniqueUsers.add(userId);
            guildStats.lastActivity = timestamp;
            
            const currentCommandCount = guildStats.mostUsedCommands.get(commandName) || 0;
            guildStats.mostUsedCommands.set(commandName, currentCommandCount + 1);

            // User metrics
            if (!this.metrics.users.has(userId)) {
                this.metrics.users.set(userId, {
                    commandCount: 0,
                    uniqueGuilds: new Set(),
                    favoriteCommands: new Map(),
                    firstActivity: timestamp,
                    lastActivity: timestamp,
                    avgExecutionTime: 0
                });
            }

            const userStats = this.metrics.users.get(userId);
            userStats.commandCount++;
            userStats.uniqueGuilds.add(guildId);
            userStats.lastActivity = timestamp;
            
            const currentUserCommandCount = userStats.favoriteCommands.get(commandName) || 0;
            userStats.favoriteCommands.set(commandName, currentUserCommandCount + 1);

            // System metrics
            this.metrics.system.totalCommands++;

        } catch (error) {
            logger.error('Analytics tracking error', error);
        }
    }

    // Error analytics
    trackError(errorType, commandName, userId, guildId, errorMessage) {
        try {
            const timestamp = Date.now();
            
            if (!this.metrics.errors.has(errorType)) {
                this.metrics.errors.set(errorType, {
                    count: 0,
                    affectedCommands: new Set(),
                    affectedUsers: new Set(),
                    affectedGuilds: new Set(),
                    firstOccurrence: timestamp,
                    lastOccurrence: timestamp,
                    examples: []
                });
            }

            const errorStats = this.metrics.errors.get(errorType);
            errorStats.count++;
            errorStats.affectedCommands.add(commandName);
            errorStats.affectedUsers.add(userId);
            errorStats.affectedGuilds.add(guildId);
            errorStats.lastOccurrence = timestamp;

            // Store examples (max 10)
            if (errorStats.examples.length < 10) {
                errorStats.examples.push({
                    command: commandName,
                    user: userId,
                    guild: guildId,
                    message: errorMessage.substring(0, 200),
                    timestamp: timestamp
                });
            }

            this.metrics.system.totalErrors++;

        } catch (error) {
            logger.error('Error analytics tracking failed', error);
        }
    }

    // Performance tracking
    trackPerformance(operation, duration, metadata = {}) {
        try {
            this.metrics.performance.push({
                operation: operation,
                duration: duration,
                timestamp: Date.now(),
                metadata: metadata
            });

            // Keep only last 1000 performance records
            if (this.metrics.performance.length > 1000) {
                this.metrics.performance.shift();
            }

            // Alert on slow operations
            if (duration > 10000) { // 10 seconds
                logger.warn(`Slow operation detected: ${operation}`, {
                    duration: duration,
                    metadata: metadata
                });
            }

        } catch (error) {
            logger.error('Performance tracking error', error);
        }
    }

    // Message analytics
    trackMessage(userId, guildId, channelId, messageLength, hasAttachments = false) {
        try {
            this.metrics.system.totalMessages++;

            // Guild message tracking
            if (this.metrics.guilds.has(guildId)) {
                const guildStats = this.metrics.guilds.get(guildId);
                guildStats.messageCount = (guildStats.messageCount || 0) + 1;
                guildStats.avgMessageLength = guildStats.avgMessageLength || 0;
                guildStats.avgMessageLength = (guildStats.avgMessageLength + messageLength) / 2;
            }

            // User message tracking
            if (this.metrics.users.has(userId)) {
                const userStats = this.metrics.users.get(userId);
                userStats.messageCount = (userStats.messageCount || 0) + 1;
            }

        } catch (error) {
            logger.debug('Message analytics tracking error', error);
        }
    }

    // Get analytics data
    getCommandStats(commandName) {
        const stats = this.metrics.commands.get(commandName);
        if (!stats) return null;

        return {
            name: commandName,
            totalUses: stats.totalUses,
            successRate: ((stats.successCount / stats.totalUses) * 100).toFixed(2),
            avgExecutionTime: Math.round(stats.avgExecutionTime),
            uniqueUsers: stats.uniqueUsers.size,
            uniqueGuilds: stats.uniqueGuilds.size,
            firstUsed: stats.firstUsed,
            lastUsed: stats.lastUsed
        };
    }

    getTopCommands(limit = 10) {
        const commands = Array.from(this.metrics.commands.entries())
            .map(([name, stats]) => ({
                name: name,
                uses: stats.totalUses,
                successRate: ((stats.successCount / stats.totalUses) * 100).toFixed(2)
            }))
            .sort((a, b) => b.uses - a.uses)
            .slice(0, limit);

        return commands;
    }

    getGuildStats(guildId) {
        const stats = this.metrics.guilds.get(guildId);
        if (!stats) return null;

        const topCommands = Array.from(stats.mostUsedCommands.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return {
            guildId: guildId,
            commandCount: stats.commandCount,
            messageCount: stats.messageCount || 0,
            uniqueUsers: stats.uniqueUsers.size,
            topCommands: topCommands,
            firstActivity: stats.firstActivity,
            lastActivity: stats.lastActivity
        };
    }

    getUserStats(userId) {
        const stats = this.metrics.users.get(userId);
        if (!stats) return null;

        const favoriteCommands = Array.from(stats.favoriteCommands.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        return {
            userId: userId,
            commandCount: stats.commandCount,
            messageCount: stats.messageCount || 0,
            uniqueGuilds: stats.uniqueGuilds.size,
            favoriteCommands: favoriteCommands,
            firstActivity: stats.firstActivity,
            lastActivity: stats.lastActivity
        };
    }

    getSystemStats() {
        const now = Date.now();
        const uptime = now - this.metrics.system.startTime;
        
        // Performance averages
        const recentPerformance = this.metrics.performance.slice(-100);
        const avgPerformance = recentPerformance.length > 0 ? 
            recentPerformance.reduce((sum, p) => sum + p.duration, 0) / recentPerformance.length : 0;

        return {
            uptime: uptime,
            totalCommands: this.metrics.system.totalCommands,
            totalMessages: this.metrics.system.totalMessages,
            totalErrors: this.metrics.system.totalErrors,
            uniqueUsers: this.metrics.users.size,
            activeGuilds: this.metrics.guilds.size,
            avgPerformance: Math.round(avgPerformance),
            errorRate: this.metrics.system.totalCommands > 0 ? 
                ((this.metrics.system.totalErrors / this.metrics.system.totalCommands) * 100).toFixed(2) : '0.00',
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage()
        };
    }

    getErrorStats() {
        const errors = Array.from(this.metrics.errors.entries())
            .map(([type, stats]) => ({
                type: type,
                count: stats.count,
                affectedCommands: stats.affectedCommands.size,
                affectedUsers: stats.affectedUsers.size,
                affectedGuilds: stats.affectedGuilds.size,
                firstOccurrence: stats.firstOccurrence,
                lastOccurrence: stats.lastOccurrence
            }))
            .sort((a, b) => b.count - a.count);

        return errors;
    }

    // Export data for external analytics
    exportData() {
        const data = {
            timestamp: Date.now(),
            system: this.getSystemStats(),
            topCommands: this.getTopCommands(20),
            errors: this.getErrorStats(),
            performance: {
                recent: this.metrics.performance.slice(-100),
                avg: this.metrics.performance.length > 0 ? 
                    this.metrics.performance.reduce((sum, p) => sum + p.duration, 0) / this.metrics.performance.length : 0
            }
        };

        return data;
    }

    // Periodic reports
    setupPeriodicReports() {
        // Hourly report
        setInterval(() => {
            this.generateHourlyReport();
        }, 3600000); // 1 hour

        // Daily report
        setInterval(() => {
            this.generateDailyReport();
        }, 86400000); // 24 hours

        // Weekly cleanup
        setInterval(() => {
            this.cleanupOldData();
        }, 604800000); // 7 days
    }

    generateHourlyReport() {
        try {
            const stats = this.getSystemStats();
            const topCommands = this.getTopCommands(5);
            const errors = this.getErrorStats().slice(0, 3);

            logger.info('Hourly Analytics Report', {
                uptime: Math.round(stats.uptime / 3600000) + ' hours',
                commandsPerHour: Math.round(stats.totalCommands / (stats.uptime / 3600000)),
                errorRate: stats.errorRate + '%',
                topCommands: topCommands.map(c => c.name).join(', '),
                activeGuilds: stats.activeGuilds,
                uniqueUsers: stats.uniqueUsers
            });

        } catch (error) {
            logger.error('Hourly report generation error', error);
        }
    }

    generateDailyReport() {
        try {
            const stats = this.getSystemStats();
            const data = this.exportData();
            
            logger.success('Daily Analytics Report', {
                totalCommands: stats.totalCommands,
                totalMessages: stats.totalMessages,
                errorRate: stats.errorRate,
                activeGuilds: stats.activeGuilds,
                uniqueUsers: stats.uniqueUsers,
                avgPerformance: stats.avgPerformance + 'ms',
                memoryUsage: Math.round(stats.memoryUsage.heapUsed / 1024 / 1024) + 'MB'
            });

            // Save daily report to database
            db.data.analytics = db.data.analytics || new Map();
            const reportId = `daily-${new Date().toISOString().split('T')[0]}`;
            db.data.analytics.set(reportId, data);

        } catch (error) {
            logger.error('Daily report generation error', error);
        }
    }

    // Cleanup old data
    cleanupOldData() {
        try {
            const now = Date.now();
            const maxAge = 604800000; // 7 days

            // Cleanup performance data older than 7 days
            this.metrics.performance = this.metrics.performance.filter(
                p => now - p.timestamp < maxAge
            );

            // Cleanup inactive guilds (no activity in 30 days)
            for (const [guildId, stats] of this.metrics.guilds) {
                if (now - stats.lastActivity > 2592000000) { // 30 days
                    this.metrics.guilds.delete(guildId);
                }
            }

            // Cleanup inactive users (no activity in 30 days)
            for (const [userId, stats] of this.metrics.users) {
                if (now - stats.lastActivity > 2592000000) { // 30 days
                    this.metrics.users.delete(userId);
                }
            }

            logger.info('Analytics data cleanup completed');

        } catch (error) {
            logger.error('Analytics cleanup error', error);
        }
    }

    // Health check
    getHealthStatus() {
        const stats = this.getSystemStats();
        const issues = [];

        // Check error rate
        if (parseFloat(stats.errorRate) > 5.0) {
            issues.push(`High error rate: ${stats.errorRate}%`);
        }

        // Check memory usage
        const memoryMB = stats.memoryUsage.heapUsed / 1024 / 1024;
        if (memoryMB > 500) {
            issues.push(`High memory usage: ${Math.round(memoryMB)}MB`);
        }

        // Check performance
        if (stats.avgPerformance > 5000) {
            issues.push(`Slow performance: ${stats.avgPerformance}ms`);
        }

        return {
            status: issues.length === 0 ? 'healthy' : 'warning',
            issues: issues,
            uptime: stats.uptime,
            lastCheck: Date.now()
        };
    }
}

// Singleton instance
const analytics = new AnalyticsManager();

module.exports = {
    AnalyticsManager,
    analytics
};
