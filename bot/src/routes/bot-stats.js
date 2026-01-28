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

module.exports = { router, setClient };
