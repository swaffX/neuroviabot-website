const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/simple-db');
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

// GET /api/bot/reaction-roles/:guildId
router.get('/:guildId', authenticateBotApi, async (req, res) => {
    try {
        const { guildId } = req.params;
        const db = getDatabase();
        
        const guildSettings = db.getGuildSettings(guildId) || {};
        const reactionRoles = guildSettings.reactionRoles || [];
        
        res.json({
            success: true,
            guildId,
            reactionRoles,
            total: reactionRoles.length,
        });
    } catch (error) {
        logger.error('[ReactionRoles] Error fetching:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/bot/reaction-roles/:guildId
router.post('/:guildId', authenticateBotApi, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { messageId, channelId, emoji, roleId, executor } = req.body;
        
        if (!messageId || !channelId || !emoji || !roleId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: messageId, channelId, emoji, roleId' 
            });
        }
        
        const db = getDatabase();
        const guildSettings = db.getGuildSettings(guildId) || {};
        const reactionRoles = guildSettings.reactionRoles || [];
        
        // Add new reaction role
        const newReactionRole = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            messageId,
            channelId,
            emoji,
            roleId,
            enabled: true,
            createdAt: new Date().toISOString(),
        };
        
        reactionRoles.push(newReactionRole);
        guildSettings.reactionRoles = reactionRoles;
        db.setGuildSettings(guildId, guildSettings);
        
        // Add reaction to message
        if (client) {
            try {
                const guild = client.guilds.cache.get(guildId);
                if (guild) {
                    const channel = guild.channels.cache.get(channelId);
                    if (channel) {
                        const message = await channel.messages.fetch(messageId);
                        await message.react(emoji);
                    }
                }
            } catch (err) {
                logger.warn('[ReactionRoles] Could not add reaction to message:', err.message);
            }
        }
        
        // Broadcast to frontend
        if (client && client.socket && client.socket.connected) {
            client.socket.emit('broadcast_to_guild', {
                guildId: guildId,
                event: 'reaction_role_added',
                data: {
                    reactionRole: newReactionRole,
                    executor: executor,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        
        logger.info(`[ReactionRoles] Added reaction role for guild ${guildId}`);
        res.json({ success: true, reactionRole: newReactionRole });
    } catch (error) {
        logger.error('[ReactionRoles] Error creating:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/bot/reaction-roles/:guildId/:configId
router.delete('/:guildId/:configId', authenticateBotApi, async (req, res) => {
    try {
        const { guildId, configId } = req.params;
        const { executor } = req.body;
        
        const db = getDatabase();
        const guildSettings = db.getGuildSettings(guildId) || {};
        const reactionRoles = guildSettings.reactionRoles || [];
        
        const index = reactionRoles.findIndex(rr => rr.id === configId);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Reaction role not found' });
        }
        
        const removed = reactionRoles.splice(index, 1)[0];
        guildSettings.reactionRoles = reactionRoles;
        db.setGuildSettings(guildId, guildSettings);
        
        // Broadcast to frontend
        if (client && client.socket && client.socket.connected) {
            client.socket.emit('broadcast_to_guild', {
                guildId: guildId,
                event: 'reaction_role_removed',
                data: {
                    configId: configId,
                    executor: executor,
                    timestamp: new Date().toISOString(),
                },
            });
        }
        
        logger.info(`[ReactionRoles] Removed reaction role ${configId} from guild ${guildId}`);
        res.json({ success: true, message: 'Reaction role removed successfully' });
    } catch (error) {
        logger.error('[ReactionRoles] Error deleting:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = { router, setClient };

