// ==========================================
// 🛡️ Moderation API (Bot Side)
// ==========================================
// Internal moderation endpoints

const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');

// API Key validation
function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.BOT_API_KEY || 'your-secret-api-key';
    
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
    
    next();
}

router.use(validateApiKey);

let botClient = null;

function setClient(client) {
    botClient = client;
}

// ==========================================
// POST /api/moderation/:guildId/warn
// Add warning to user
// ==========================================
router.post('/:guildId/warn', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { userId, moderatorId, reason } = req.body;

        if (!botClient || !botClient.moderationHandler) {
            return res.status(503).json({ success: false, error: 'Moderation handler not ready' });
        }

        const result = await botClient.moderationHandler.addWarning(guildId, userId, moderatorId, reason);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('[Moderation API] Warn error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// GET /api/moderation/:guildId/warnings/:userId
// Get user warnings
// ==========================================
router.get('/:guildId/warnings/:userId', async (req, res) => {
    try {
        const { guildId, userId } = req.params;

        if (!botClient || !botClient.moderationHandler) {
            return res.status(503).json({ success: false, error: 'Moderation handler not ready' });
        }

        const warnings = botClient.moderationHandler.getUserWarnings(guildId, userId);

        res.json({
            success: true,
            warnings
        });
    } catch (error) {
        logger.error('[Moderation API] Get warnings error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// DELETE /api/moderation/:guildId/warnings/:warningId
// Remove warning
// ==========================================
router.delete('/:guildId/warnings/:warningId', async (req, res) => {
    try {
        const { guildId, warningId } = req.params;
        const { userId } = req.body;

        if (!botClient || !botClient.moderationHandler) {
            return res.status(503).json({ success: false, error: 'Moderation handler not ready' });
        }

        const result = await botClient.moderationHandler.removeWarning(guildId, userId, parseInt(warningId));

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error('[Moderation API] Remove warning error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// GET /api/moderation/:guildId/history
// Get moderation history
// ==========================================
router.get('/:guildId/history', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { userId, limit = 50 } = req.query;

        if (!botClient || !botClient.moderationHandler) {
            return res.status(503).json({ success: false, error: 'Moderation handler not ready' });
        }

        const history = botClient.moderationHandler.getModerationHistory(guildId, userId, parseInt(limit));

        res.json({
            success: true,
            history
        });
    } catch (error) {
        logger.error('[Moderation API] History error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = { router, setClient };

