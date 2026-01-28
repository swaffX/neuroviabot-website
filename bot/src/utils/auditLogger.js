const { getDatabase } = require('../database/simple-db');
const { logger } = require('./logger');

class AuditLogger {
    constructor() {
        this.db = getDatabase();
        this.io = null; // Socket.IO instance
        this.client = null; // Discord client instance (optional for user enrichment)
        this.recentLogs = new Map(); // For duplicate detection (guildId -> recent logs)
        this.duplicateWindow = 5000; // 5 seconds window for duplicate detection
    }

    /**
     * Set Socket.IO instance for real-time broadcasting
     * @param {Object} io - Socket.IO instance
     */
    setIO(io) {
        this.io = io;
        logger.info('[AuditLogger] Socket.IO instance set for real-time broadcasting');
    }

    /**
     * Set Socket.IO client for emitting to backend
     * @param {Object} socket - Socket.IO client instance
     */
    setSocketClient(socket) {
        this.socketClient = socket;
        logger.info('[AuditLogger] Socket.IO client set for backend communication');
    }

    /**
     * Set Discord client for user enrichment
     * @param {Object} client - Discord.js Client
     */
    setClient(client) {
        this.client = client;
        logger.info('[AuditLogger] Discord client set for user enrichment');
    }

    /**
     * Generate event signature for duplicate detection
     * @param {Object} options - Log options
     * @returns {string} Event signature
     */
    generateSignature(options) {
        const { guildId, action, executor, target } = options;
        const executorId = executor?.id || executor || 'system';
        const targetId = target?.id || target || 'none';
        return `${guildId}:${action}:${executorId}:${targetId}`;
    }

    /**
     * Check if event is duplicate
     * @param {string} signature - Event signature
     * @returns {boolean} True if duplicate
     */
    isDuplicate(signature) {
        if (!this.recentLogs.has(signature)) {
            return false;
        }

        const lastTimestamp = this.recentLogs.get(signature);
        const now = Date.now();

        // If within duplicate window, it's a duplicate
        if (now - lastTimestamp < this.duplicateWindow) {
            return true;
        }

        // Clean up old entry
        this.recentLogs.delete(signature);
        return false;
    }

    /**
     * Record event signature
     * @param {string} signature - Event signature
     */
    recordSignature(signature) {
        this.recentLogs.set(signature, Date.now());

        // Cleanup old signatures periodically
        if (this.recentLogs.size > 1000) {
            const now = Date.now();
            for (const [sig, timestamp] of this.recentLogs.entries()) {
                if (now - timestamp > this.duplicateWindow * 2) {
                    this.recentLogs.delete(sig);
                }
            }
        }
    }

    /**
     * Log an audit event
     * @param {Object} options - Audit log options
     * @param {string} options.guildId - Guild ID
     * @param {string} options.action - Action type (e.g., 'ROLE_CREATE', 'CHANNEL_DELETE')
     * @param {Object} options.executor - User who performed the action
     * @param {Object} options.target - Target of the action
     * @param {Object} options.changes - Changes made
     * @param {string} options.reason - Reason for the action
     */
    async log(options) {
        try {
            const { guildId, action, executor, target, changes, reason } = options;

            if (!guildId || !action) {
                logger.warn('[AuditLogger] Missing required fields: guildId or action');
                return null;
            }

            // Duplicate detection
            const signature = this.generateSignature(options);
            if (this.isDuplicate(signature)) {
                logger.debug(`[AuditLogger] Duplicate event detected: ${signature}`);
                return null; // Skip duplicate
            }

            // Record this event
            this.recordSignature(signature);

            // Prepare executor data with enrichment if necessary
            let executorData = null;
            if (executor) {
                const execId = executor.id || executor;
                let execUsername = executor.tag || executor.username || executor.globalName || null;
                let execAvatar = executor.avatar || null;

                // Enrich from Discord API if missing
                if ((!execUsername || execAvatar === null) && this.client && execId) {
                    try {
                        const user = await this.client.users.fetch(execId);
                        execUsername = execUsername || user.tag || user.username || user.globalName || 'Unknown';
                        execAvatar = execAvatar !== null ? execAvatar : user.avatar || null;
                    } catch (e) {
                        logger.debug('[AuditLogger] Could not enrich executor from API:', e.message);
                    }
                }

                executorData = {
                    id: execId,
                    username: execUsername || 'Unknown',
                    avatar: execAvatar || null,
                };
            }

            const auditEntry = {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                guildId,
                action,
                executor: executorData,
                target: target ? {
                    id: target.id || target,
                    name: target.name || target.username || 'Unknown',
                    type: target.type || 'unknown',
                } : null,
                changes: changes || {},
                reason: reason || null,
                timestamp: new Date().toISOString(),
            };

            // Disable local database storage for audit logs to prevent CPU spikes and redundant storage
            // The backend handles data persistence via Socket.IO events (auditLogStorage.js)
            /* 
            const settings = this.db.getGuildSettings(guildId) || {};
            if (!settings.auditLogs) {
                settings.auditLogs = [];
            }
            settings.auditLogs.unshift(auditEntry);
            if (settings.auditLogs.length > 1000) {
                settings.auditLogs = settings.auditLogs.slice(0, 1000);
            }
            this.db.updateGuildSettings(guildId, settings);
            try { this.db.addAuditLog(guildId, auditEntry); } catch (e) { } 
            */

            logger.debug(`[AuditLogger] Logged action: ${action} in guild ${guildId}`);

            // Broadcast to Socket.IO clients in real-time
            const formattedEntry = {
                id: auditEntry.id,
                type: action,
                userId: auditEntry.executor?.id || 'System',
                targetId: auditEntry.target?.id || null,
                action: this.formatActionName(action),
                details: {
                    executor: auditEntry.executor,
                    target: auditEntry.target,
                    changes: auditEntry.changes,
                    reason: auditEntry.reason,
                },
                // Expose username/avatar at top-level for frontend convenience
                username: auditEntry.executor?.username || 'Unknown',
                avatar: auditEntry.executor?.avatar || null,
                severity: this.getSeverity(action),
                timestamp: auditEntry.timestamp,
            };

            // Try Socket.IO server (if available)
            if (this.io) {
                this.io.to(`guild_${guildId}`).emit('audit_log_entry', formattedEntry);
                logger.debug(`[AuditLogger] Broadcasted audit log to guild_${guildId} via io.to`);
            }

            // Try Socket.IO client (bot to backend)
            if (this.socketClient && this.socketClient.connected) {
                this.socketClient.emit('bot_audit_log_entry', {
                    guildId,
                    entry: formattedEntry
                });
                logger.debug(`[AuditLogger] Emitted audit log to backend via socket client`);
            }

            return auditEntry;
        } catch (error) {
            logger.error('[AuditLogger] Error logging audit:', error);
            return null;
        }
    }

    /**
     * Get audit logs for a guild
     * @param {string} guildId - Guild ID
     * @param {Object} filters - Filter options
     * @returns {Array} Audit log entries
     */
    getLogs(guildId, filters = {}) {
        try {
            const settings = this.db.getGuildSettings(guildId) || {};
            let logs = settings.auditLogs || [];

            // Apply filters
            if (filters.action) {
                logs = logs.filter(log => log.action === filters.action);
            }

            if (filters.userId) {
                logs = logs.filter(log =>
                    log.executor?.id === filters.userId ||
                    log.target?.id === filters.userId
                );
            }

            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                logs = logs.filter(log => new Date(log.timestamp) >= startDate);
            }

            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                logs = logs.filter(log => new Date(log.timestamp) <= endDate);
            }

            // Pagination
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 25;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;

            const paginatedLogs = logs.slice(startIndex, endIndex);

            return {
                logs: paginatedLogs,
                total: logs.length,
                page,
                totalPages: Math.ceil(logs.length / limit),
            };
        } catch (error) {
            logger.error('[AuditLogger] Error getting logs:', error);
            return { logs: [], total: 0, page: 1, totalPages: 0 };
        }
    }

    /**
     * Clear old audit logs (older than specified days)
     * @param {string} guildId - Guild ID
     * @param {number} days - Days to keep
     */
    clearOldLogs(guildId, days = 90) {
        try {
            const settings = this.db.getGuildSettings(guildId) || {};
            if (!settings.auditLogs) return;

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            settings.auditLogs = settings.auditLogs.filter(log =>
                new Date(log.timestamp) >= cutoffDate
            );

            this.db.setGuildSettings(guildId, settings);
            logger.info(`[AuditLogger] Cleared old logs for guild ${guildId}`);
        } catch (error) {
            logger.error('[AuditLogger] Error clearing old logs:', error);
        }
    }

    /**
     * Format action name for display
     * @param {string} action - Action type
     * @returns {string} Formatted action name
     */
    formatActionName(action) {
        const actionNames = {
            'ROLE_CREATE': 'Rol Oluşturuldu',
            'ROLE_UPDATE': 'Rol Güncellendi',
            'ROLE_DELETE': 'Rol Silindi',
            'CHANNEL_CREATE': 'Kanal Oluşturuldu',
            'CHANNEL_UPDATE': 'Kanal Güncellendi',
            'CHANNEL_DELETE': 'Kanal Silindi',
            'MEMBER_BAN': 'Üye Yasaklandı',
            'MEMBER_KICK': 'Üye Atıldı',
            'MEMBER_UNBAN': 'Yasak Kaldırıldı',
            'MEMBER_UPDATE': 'Üye Güncellendi',
            'MEMBER_JOIN': 'Üye Katıldı',
            'MEMBER_LEAVE': 'Üye Ayrıldı',
            'SETTINGS_CHANGE': 'Ayarlar Değiştirildi',
            'MESSAGE_DELETE': 'Mesaj Silindi',
            'MESSAGE_BULK_DELETE': 'Toplu Mesaj Silindi',
            'GUILD_UPDATE': 'Sunucu Güncellendi',
            'EMOJI_CREATE': 'Emoji Oluşturuldu',
            'EMOJI_DELETE': 'Emoji Silindi',
            'EMOJI_UPDATE': 'Emoji Güncellendi',
            'WEBHOOK_CREATE': 'Webhook Oluşturuldu',
            'WEBHOOK_DELETE': 'Webhook Silindi',
            'WEBHOOK_UPDATE': 'Webhook Güncellendi',
            'INVITE_CREATE': 'Davet Oluşturuldu',
            'INVITE_DELETE': 'Davet Silindi',
        };
        return actionNames[action] || action;
    }

    /**
     * Get severity level for action
     * @param {string} action - Action type
     * @returns {string} Severity level
     */
    getSeverity(action) {
        const dangerActions = ['ROLE_DELETE', 'CHANNEL_DELETE', 'MEMBER_BAN', 'MESSAGE_BULK_DELETE', 'WEBHOOK_DELETE', 'EMOJI_DELETE'];
        const warningActions = ['ROLE_UPDATE', 'CHANNEL_UPDATE', 'MEMBER_KICK', 'SETTINGS_CHANGE', 'MEMBER_UPDATE', 'GUILD_UPDATE', 'WEBHOOK_UPDATE', 'EMOJI_UPDATE'];
        const successActions = ['ROLE_CREATE', 'CHANNEL_CREATE', 'MEMBER_JOIN', 'MEMBER_UNBAN', 'EMOJI_CREATE', 'WEBHOOK_CREATE', 'INVITE_CREATE'];

        if (dangerActions.includes(action)) return 'danger';
        if (warningActions.includes(action)) return 'warning';
        if (successActions.includes(action)) return 'success';
        return 'info';
    }
}

// Singleton instance
let auditLoggerInstance = null;

function getAuditLogger() {
    if (!auditLoggerInstance) {
        auditLoggerInstance = new AuditLogger();
    }
    return auditLoggerInstance;
}

module.exports = { getAuditLogger, AuditLogger };
