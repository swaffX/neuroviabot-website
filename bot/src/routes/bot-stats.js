const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

let client = null;

function setClient(clientInstance) {
    client = clientInstance;
}

const authenticateBotApi = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey || apiKey !== (process.env.BOT_API_KEY || 'neuroviabot-secret')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    next();
};

// GET /api/bot/stats/:guildId - Real guild stats
router.get('/:guildId', authenticateBotApi, async (req, res) => {
    try {
        const { guildId } = req.params;

        if (!client) {
            return res.status(503).json({ error: 'Bot not ready' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        // REAL data from Discord
        const stats = {
            memberCount: guild.memberCount,
            onlineMembers: guild.members.cache.filter(m =>
                m.presence?.status && m.presence.status !== 'offline'
            ).size,
            channelCount: guild.channels.cache.size,
            roleCount: guild.roles.cache.size,
            textChannels: guild.channels.cache.filter(c => c.type === 0).size,
            voiceChannels: guild.channels.cache.filter(c => c.type === 2).size,
            categories: guild.channels.cache.filter(c => c.type === 4).size,
            botJoinedAt: guild.joinedAt ? guild.joinedAt.toISOString() : null,
            guildCreatedAt: guild.createdAt.toISOString(),
            ownerId: guild.ownerId,
            boostLevel: guild.premiumTier,
            boostCount: guild.premiumSubscriptionCount || 0,
            verificationLevel: guild.verificationLevel,
            afkTimeout: guild.afkTimeout,
            afkChannelId: guild.afkChannelId,
            systemChannelId: guild.systemChannelId,
            rulesChannelId: guild.rulesChannelId,
        };

        res.json({
            success: true,
            guildId,
            stats,
            timestamp: Date.now(),
        });

        logger.debug(`[BotStats] Fetched stats for guild ${guildId}`);
    } catch (error) {
        logger.error('[BotStats] Error fetching stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/bot/guilds/:guildId - Get guild info (name, icon, memberCount)
router.get('/guild/:guildId', authenticateBotApi, async (req, res) => {
    try {
        const { guildId } = req.params;

        if (!client) {
            return res.status(503).json({ error: 'Bot not ready' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        // Return fresh guild info from Discord cache
        res.json({
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            memberCount: guild.memberCount,
            ownerId: guild.ownerId,
            description: guild.description,
            banner: guild.banner,
            splash: guild.splash,
            vanityURLCode: guild.vanityURLCode,
            premiumTier: guild.premiumTier,
            premiumSubscriptionCount: guild.premiumSubscriptionCount || 0,
        });

        logger.debug(`[BotStats] Fetched guild info for ${guildId}`);
    } catch (error) {
        logger.error('[BotStats] Error fetching guild info:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/bot/audit-logs/:guildId/sync - Sync audit logs from Discord
router.post('/audit-logs/:guildId/sync', authenticateBotApi, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { limit = 100, before } = req.body;

        if (!client) {
            return res.status(503).json({ error: 'Bot not ready' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        // Check permission
        if (!guild.members.me.permissions.has('ViewAuditLog')) {
            return res.status(403).json({ error: 'Missing ViewAuditLog permission' });
        }

        // Fetch audit logs from Discord
        const fetchOptions = { limit: parseInt(limit) };
        if (before) {
            fetchOptions.before = before;
        }

        const auditLogs = await guild.fetchAuditLogs(fetchOptions);

        // Return processed logs
        const logs = auditLogs.entries.map(entry => {
            let actionType = 'OTHER';
            let actionName = 'Bilinmeyen İşlem';

            // Map common actions
            if (entry.action >= 0 && entry.action <= 9) actionType = 'GUILD_UPDATE';
            else if (entry.action >= 10 && entry.action <= 19) actionType = 'CHANNEL_CREATE';
            else if (entry.action >= 20 && entry.action <= 29) actionType = 'MEMBER_KICK';
            else if (entry.action >= 30 && entry.action <= 39) actionType = 'ROLE_CREATE';
            else if (entry.action >= 40 && entry.action <= 49) actionType = 'INVITE_CREATE';
            else if (entry.action >= 50 && entry.action <= 59) actionType = 'WEBHOOK_CREATE';
            else if (entry.action >= 60 && entry.action <= 69) actionType = 'EMOJI_CREATE';
            else if (entry.action >= 70 && entry.action <= 79) actionType = 'MESSAGE_DELETE';
            else if (entry.action >= 80 && entry.action <= 89) actionType = 'INTEGRATION_CREATE';

            // Refine specific actions
            const actionMap = {
                1: 'Sunucu Güncellendi',
                10: 'Kanal Oluşturuldu', 11: 'Kanal Güncellendi', 12: 'Kanal Silindi',
                20: 'Üye Atıldı', 22: 'Üye Yasaklandı', 23: 'Yasak Kaldırıldı', 24: 'Üye Güncellendi', 25: 'Rol Eklendi/Kaldırıldı',
                30: 'Rol Oluşturuldu', 31: 'Rol Güncellendi', 32: 'Rol Silindi',
                72: 'Mesaj Silindi'
            };

            // Map types for frontend
            const typeMap = {
                10: 'CHANNEL_CREATE', 11: 'CHANNEL_UPDATE', 12: 'CHANNEL_DELETE',
                20: 'MEMBER_KICK', 22: 'MEMBER_BAN', 23: 'MEMBER_UNBAN', 24: 'MEMBER_UPDATE', 25: 'MEMBER_ROLE_UPDATE',
                30: 'ROLE_CREATE', 31: 'ROLE_UPDATE', 32: 'ROLE_DELETE',
                72: 'MESSAGE_DELETE'
            };

            actionName = actionMap[entry.action] || `İşlem ${entry.action}`;
            const mappedType = typeMap[entry.action] || actionType;

            return {
                id: entry.id,
                type: mappedType,
                action: actionName,
                userId: entry.executor?.id,
                username: entry.executor?.username,
                avatar: entry.executor?.avatar,
                targetId: entry.target?.id,
                timestamp: entry.createdAt.toISOString(),
                reason: entry.reason,
                details: {
                    executor: {
                        id: entry.executor?.id,
                        username: entry.executor?.username,
                        avatar: entry.executor?.avatar,
                        discriminator: entry.executor?.discriminator
                    },
                    target: entry.target ? {
                        id: entry.target.id,
                        name: entry.target.username || entry.target.name || entry.target.tag,
                        type: entry.targetType
                    } : null,
                    changes: entry.changes?.reduce((acc, change) => {
                        acc[change.key] = { old: change.old, new: change.new };
                        return acc;
                    }, {}),
                    reason: entry.reason
                },
                severity: getSeverity(mappedType)
            };
        });

        res.json({
            success: true,
            count: logs.length,
            logs
        });

        logger.info(`Synced ${logs.length} audit logs for guild ${guildId}`);
    } catch (error) {
        logger.error('[BotStats] Error syncing audit logs:', error);
        res.status(500).json({ error: error.message });
    }
});

function getSeverity(type) {
    const danger = ['CHANNEL_DELETE', 'ROLE_DELETE', 'MEMBER_BAN', 'MEMBER_KICK', 'GUILD_UPDATE'];
    const warning = ['CHANNEL_UPDATE', 'ROLE_UPDATE', 'MEMBER_UPDATE', 'MEMBER_ROLE_UPDATE'];
    const success = ['CHANNEL_CREATE', 'ROLE_CREATE', 'MEMBER_UNBAN'];

    if (danger.includes(type)) return 'danger';
    if (warning.includes(type)) return 'warning';
    if (success.includes(type)) return 'success';
    return 'info';
}

// POST /api/bot/audit-logs/:guildId/sync - Sync audit logs from Discord
router.post('/audit-logs/:guildId/sync', authenticateBotApi, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { limit = 100, before } = req.body; // Default limit increased to 100, added before parameter

        if (!client) {
            return res.status(503).json({ error: 'Bot not ready' });
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({ error: 'Guild not found' });
        }

        // Check permission
        if (!guild.members.me.permissions.has('ViewAuditLog')) {
            return res.status(403).json({ error: 'Missing ViewAuditLog permission' });
        }

        // Fetch audit logs from Discord
        const fetchOptions = { limit: parseInt(limit) };
        if (before) {
            fetchOptions.before = before;
        }

        const auditLogs = await guild.fetchAuditLogs(fetchOptions);

        // Return processed logs
        const logs = auditLogs.entries.map(entry => {
            let actionType = 'OTHER';
            let actionName = 'Bilinmeyen İşlem';

            // Map common actions
            if (entry.action >= 0 && entry.action <= 9) actionType = 'GUILD_UPDATE';
            else if (entry.action >= 10 && entry.action <= 19) actionType = 'CHANNEL_CREATE';
            else if (entry.action >= 20 && entry.action <= 29) actionType = 'MEMBER_KICK';
            else if (entry.action >= 30 && entry.action <= 39) actionType = 'ROLE_CREATE';
            else if (entry.action >= 40 && entry.action <= 49) actionType = 'INVITE_CREATE';
            else if (entry.action >= 50 && entry.action <= 59) actionType = 'WEBHOOK_CREATE';
            else if (entry.action >= 60 && entry.action <= 69) actionType = 'EMOJI_CREATE';
            else if (entry.action >= 70 && entry.action <= 79) actionType = 'MESSAGE_DELETE';
            else if (entry.action >= 80 && entry.action <= 89) actionType = 'INTEGRATION_CREATE';

            // Refine specific actions
            const actionMap = {
                1: 'Sunucu Güncellendi',
                10: 'Kanal Oluşturuldu', 11: 'Kanal Güncellendi', 12: 'Kanal Silindi',
                20: 'Üye Atıldı', 22: 'Üye Yasaklandı', 23: 'Yasak Kaldırıldı', 24: 'Üye Güncellendi', 25: 'Rol Eklendi/Kaldırıldı',
                30: 'Rol Oluşturuldu', 31: 'Rol Güncellendi', 32: 'Rol Silindi',
                72: 'Mesaj Silindi'
            };

            // Map types for frontend
            const typeMap = {
                10: 'CHANNEL_CREATE', 11: 'CHANNEL_UPDATE', 12: 'CHANNEL_DELETE',
                20: 'MEMBER_KICK', 22: 'MEMBER_BAN', 23: 'MEMBER_UNBAN', 24: 'MEMBER_UPDATE', 25: 'MEMBER_ROLE_UPDATE',
                30: 'ROLE_CREATE', 31: 'ROLE_UPDATE', 32: 'ROLE_DELETE',
                72: 'MESSAGE_DELETE'
            };

            actionName = actionMap[entry.action] || `İşlem ${entry.action}`;
            const mappedType = typeMap[entry.action] || actionType;

            return {
                id: entry.id,
                type: mappedType,
                action: actionName,
                userId: entry.executor?.id,
                username: entry.executor?.username,
                avatar: entry.executor?.avatar,
                targetId: entry.target?.id,
                timestamp: entry.createdAt.toISOString(),
                reason: entry.reason,
                details: {
                    executor: {
                        id: entry.executor?.id,
                        username: entry.executor?.username,
                        avatar: entry.executor?.avatar,
                        discriminator: entry.executor?.discriminator
                    },
                    target: entry.target ? {
                        id: entry.target.id,
                        name: entry.target.username || entry.target.name || entry.target.tag,
                        type: entry.targetType
                    } : null,
                    changes: entry.changes?.reduce((acc, change) => {
                        acc[change.key] = { old: change.old, new: change.new };
                        return acc;
                    }, {}),
                    reason: entry.reason
                },
                severity: getSeverity(mappedType)
            };
        });

        res.json({
            success: true,
            count: logs.length,
            logs
        });

        logger.info(`Synced ${logs.length} audit logs for guild ${guildId}`);
    } catch (error) {
        logger.error('[BotStats] Error syncing audit logs:', error);
        res.status(500).json({ error: error.message });
    }
});

function getSeverity(type) {
    const danger = ['CHANNEL_DELETE', 'ROLE_DELETE', 'MEMBER_BAN', 'MEMBER_KICK', 'GUILD_UPDATE'];
    const warning = ['CHANNEL_UPDATE', 'ROLE_UPDATE', 'MEMBER_UPDATE', 'MEMBER_ROLE_UPDATE'];
    const success = ['CHANNEL_CREATE', 'ROLE_CREATE', 'MEMBER_UNBAN'];

    if (danger.includes(type)) return 'danger';
    if (warning.includes(type)) return 'warning';
    if (success.includes(type)) return 'success';
    return 'info';
}

module.exports = { router, setClient };
