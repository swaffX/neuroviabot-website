// ==========================================
// 🤖 NeuroViaBot - Security & Rate Limiting
// ==========================================

const { logger } = require('./logger');

class SecurityManager {
    constructor() {
        this.rateLimits = new Map();
        this.suspiciousUsers = new Map();
        this.spamDetector = new Map();
        this.blacklistedUsers = new Set();
        this.trustedUsers = new Set();
        
        // Rate limit configs
        this.limits = {
            commands: { max: 10, window: 60000 }, // 10 commands per minute
            messages: { max: 20, window: 30000 }, // 20 messages per 30 seconds
            joins: { max: 5, window: 60000 }, // 5 guild joins per minute
            reactions: { max: 30, window: 60000 } // 30 reactions per minute
        };

        this.setupCleanupInterval();
    }

    // Rate limiting
    isRateLimited(userId, type = 'commands') {
        const limit = this.limits[type];
        if (!limit) return false;

        const key = `${userId}:${type}`;
        const now = Date.now();
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, { count: 1, resetTime: now + limit.window });
            return false;
        }

        const userLimit = this.rateLimits.get(key);
        
        if (now > userLimit.resetTime) {
            userLimit.count = 1;
            userLimit.resetTime = now + limit.window;
            return false;
        }

        userLimit.count++;
        
        if (userLimit.count > limit.max) {
            this.flagSuspiciousActivity(userId, type, userLimit.count);
            return true;
        }

        return false;
    }

    // Spam detection
    detectSpam(message) {
        const userId = message.author.id;
        const content = message.content;
        const now = Date.now();

        // Initialize user spam data
        if (!this.spamDetector.has(userId)) {
            this.spamDetector.set(userId, {
                messages: [],
                duplicates: new Map(),
                capsCount: 0,
                mentionCount: 0
            });
        }

        const userData = this.spamDetector.get(userId);
        
        // Add message to history
        userData.messages.push({
            content: content,
            timestamp: now,
            channelId: message.channel.id
        });

        // Keep only last 10 messages
        if (userData.messages.length > 10) {
            userData.messages.shift();
        }

        // Analyze spam patterns
        const spamScore = this.calculateSpamScore(userData, message);
        
        if (spamScore > 70) {
            this.flagSuspiciousActivity(userId, 'spam', spamScore);
            return { isSpam: true, score: spamScore, reason: this.getSpamReason(userData) };
        }

        return { isSpam: false, score: spamScore };
    }

    calculateSpamScore(userData, message) {
        let score = 0;
        const content = message.content;
        const now = Date.now();

        // 1. Message frequency (30 points max)
        const recentMessages = userData.messages.filter(m => now - m.timestamp < 10000);
        if (recentMessages.length > 5) score += 30;
        else if (recentMessages.length > 3) score += 20;
        else if (recentMessages.length > 2) score += 10;

        // 2. Duplicate content (25 points max)
        const duplicateKey = content.substring(0, 50);
        const duplicateCount = userData.duplicates.get(duplicateKey) || 0;
        userData.duplicates.set(duplicateKey, duplicateCount + 1);
        
        if (duplicateCount > 3) score += 25;
        else if (duplicateCount > 2) score += 15;
        else if (duplicateCount > 1) score += 8;

        // 3. Excessive caps (15 points max)
        const capsPercentage = (content.match(/[A-Z]/g) || []).length / content.length;
        if (content.length > 10) {
            if (capsPercentage > 0.7) score += 15;
            else if (capsPercentage > 0.5) score += 10;
            else if (capsPercentage > 0.3) score += 5;
        }

        // 4. Excessive mentions (20 points max)
        const mentionCount = (content.match(/<@[!&]?\d+>/g) || []).length;
        if (mentionCount > 5) score += 20;
        else if (mentionCount > 3) score += 15;
        else if (mentionCount > 2) score += 10;

        // 5. Link spam (10 points max)
        const linkCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;
        if (linkCount > 2) score += 10;
        else if (linkCount > 1) score += 5;

        return Math.min(score, 100);
    }

    getSpamReason(userData) {
        const reasons = [];
        
        if (userData.messages.filter(m => Date.now() - m.timestamp < 10000).length > 5) {
            reasons.push('Excessive message frequency');
        }
        
        for (const [content, count] of userData.duplicates) {
            if (count > 3) {
                reasons.push('Duplicate message spam');
                break;
            }
        }
        
        return reasons.length > 0 ? reasons.join(', ') : 'General spam detection';
    }

    // Invite link detection
    detectInviteLinks(content) {
        const inviteRegex = /discord\.gg\/[a-zA-Z0-9]+|discord\.com\/invite\/[a-zA-Z0-9]+|discordapp\.com\/invite\/[a-zA-Z0-9]+/gi;
        const invites = content.match(inviteRegex);
        
        return {
            hasInvites: invites && invites.length > 0,
            invites: invites || [],
            count: invites ? invites.length : 0
        };
    }

    // Suspicious activity flagging
    flagSuspiciousActivity(userId, type, severity) {
        const key = userId;
        const now = Date.now();

        if (!this.suspiciousUsers.has(key)) {
            this.suspiciousUsers.set(key, {
                flags: [],
                score: 0,
                firstFlag: now,
                lastFlag: now
            });
        }

        const userData = this.suspiciousUsers.get(key);
        userData.flags.push({
            type: type,
            severity: severity,
            timestamp: now
        });
        
        userData.score += this.getSeverityScore(type, severity);
        userData.lastFlag = now;

        // Log suspicious activity
        logger.warn(`Suspicious activity detected: ${userId}`, {
            type: type,
            severity: severity,
            totalScore: userData.score,
            flags: userData.flags.length
        });

        // Auto-action thresholds
        if (userData.score > 200) {
            this.autoModerate(userId, 'high_risk', userData);
        } else if (userData.score > 100) {
            this.autoModerate(userId, 'moderate_risk', userData);
        }

        return userData;
    }

    getSeverityScore(type, severity) {
        const scores = {
            'commands': severity * 2,
            'messages': severity * 1.5,
            'spam': severity,
            'joins': severity * 3,
            'reactions': severity * 0.5
        };
        
        return scores[type] || severity;
    }

    // Auto-moderation actions
    async autoModerate(userId, riskLevel, userData) {
        try {
            logger.warn(`Auto-moderating user: ${userId} (${riskLevel})`, {
                score: userData.score,
                flags: userData.flags.length,
                firstFlag: userData.firstFlag,
                lastFlag: userData.lastFlag
            });

            // Add to blacklist temporarily
            if (riskLevel === 'high_risk') {
                this.blacklistedUsers.add(userId);
                
                // Remove from blacklist after 1 hour
                setTimeout(() => {
                    this.blacklistedUsers.delete(userId);
                    logger.info(`User removed from blacklist: ${userId}`);
                }, 3600000);
            }

            // Notify admins (implement webhook or channel notification)
            await this.notifyModerators(userId, riskLevel, userData);

        } catch (error) {
            logger.error('Auto-moderation error', error);
        }
    }

    // Permission checking
    hasPermission(member, requiredPermission) {
        if (!member || !member.permissions) return false;
        
        // Bot owner bypass
        if (this.trustedUsers.has(member.id)) return true;
        
        return member.permissions.has(requiredPermission);
    }

    // Blacklist management
    isBlacklisted(userId) {
        return this.blacklistedUsers.has(userId);
    }

    blacklistUser(userId, reason = 'Manual blacklist') {
        this.blacklistedUsers.add(userId);
        logger.warn(`User blacklisted: ${userId}`, { reason });
    }

    unblacklistUser(userId) {
        const removed = this.blacklistedUsers.delete(userId);
        if (removed) {
            logger.info(`User removed from blacklist: ${userId}`);
        }
        return removed;
    }

    // Trust system
    trustUser(userId) {
        this.trustedUsers.add(userId);
        logger.info(`User added to trusted list: ${userId}`);
    }

    untrustUser(userId) {
        return this.trustedUsers.delete(userId);
    }

    // Content filtering
    filterContent(content) {
        const warnings = [];
        const filtered = content;

        // Check for excessive caps
        const capsPercentage = (content.match(/[A-Z]/g) || []).length / content.length;
        if (content.length > 10 && capsPercentage > 0.6) {
            warnings.push('Excessive capitals');
        }

        // Check for repetitive characters
        const repeatRegex = /(.)\1{4,}/g;
        if (repeatRegex.test(content)) {
            warnings.push('Repetitive characters');
        }

        // Check for excessive emojis
        const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu) || []).length;
        if (emojiCount > 10) {
            warnings.push('Excessive emojis');
        }

        return {
            content: filtered,
            warnings: warnings,
            needsModeration: warnings.length > 0
        };
    }

    // Cleanup old data
    setupCleanupInterval() {
        setInterval(() => {
            this.cleanupOldData();
        }, 300000); // Every 5 minutes
    }

    cleanupOldData() {
        const now = Date.now();
        const maxAge = 3600000; // 1 hour

        // Cleanup rate limits
        for (const [key, data] of this.rateLimits) {
            if (now > data.resetTime) {
                this.rateLimits.delete(key);
            }
        }

        // Cleanup spam detector data
        for (const [userId, data] of this.spamDetector) {
            data.messages = data.messages.filter(m => now - m.timestamp < maxAge);
            
            // Remove old duplicates
            for (const [content, count] of data.duplicates) {
                if (Math.random() < 0.1) { // Randomly cleanup 10% of entries
                    data.duplicates.delete(content);
                }
            }
            
            if (data.messages.length === 0 && data.duplicates.size === 0) {
                this.spamDetector.delete(userId);
            }
        }

        // Cleanup suspicious users (keep for 24 hours)
        for (const [userId, data] of this.suspiciousUsers) {
            if (now - data.lastFlag > 86400000) { // 24 hours
                this.suspiciousUsers.delete(userId);
            }
        }

        logger.debug('Security data cleanup completed');
    }

    // Notify moderators
    async notifyModerators(userId, riskLevel, userData) {
        try {
            // This would integrate with webhook system or mod channel
            logger.warn(`MODERATOR ALERT: User ${userId} flagged as ${riskLevel}`, {
                score: userData.score,
                flags: userData.flags.map(f => f.type).join(', ')
            });
        } catch (error) {
            logger.error('Moderator notification error', error);
        }
    }

    // Get user statistics
    getUserStats(userId) {
        return {
            rateLimited: Array.from(this.rateLimits.keys()).filter(k => k.startsWith(userId)).length > 0,
            suspicious: this.suspiciousUsers.has(userId),
            blacklisted: this.blacklistedUsers.has(userId),
            trusted: this.trustedUsers.has(userId),
            spamScore: this.spamDetector.has(userId) ? 
                this.calculateSpamScore(this.spamDetector.get(userId), { content: '', author: { id: userId } }) : 0
        };
    }

    // System statistics
    getSystemStats() {
        return {
            rateLimitedUsers: this.rateLimits.size,
            suspiciousUsers: this.suspiciousUsers.size,
            blacklistedUsers: this.blacklistedUsers.size,
            trustedUsers: this.trustedUsers.size,
            spamTrackedUsers: this.spamDetector.size
        };
    }
}

// Singleton instance
const security = new SecurityManager();

module.exports = {
    SecurityManager,
    security
};
