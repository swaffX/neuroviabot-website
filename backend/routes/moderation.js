// ==========================================
// 🛡️ Moderation API Routes
// ==========================================
// Advanced moderation system endpoints

const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// ==========================================
// POST /api/moderation/:guildId/warn
// Add warning to user
// ==========================================
router.post('/:guildId/warn', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { userId, moderatorId, reason } = req.body;

        const response = await axios.post(
            `${BOT_API_URL}/api/moderation/${guildId}/warn`,
            { userId, moderatorId, reason },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('[Moderation] Warn error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to add warning'
        });
    }
});

// ==========================================
// GET /api/moderation/:guildId/warnings/:userId
// Get user warnings
// ==========================================
router.get('/:guildId/warnings/:userId', async (req, res) => {
    try {
        const { guildId, userId } = req.params;

        const response = await axios.get(`${BOT_API_URL}/api/moderation/${guildId}/warnings/${userId}`, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 5000
        });

        res.json(response.data);
    } catch (error) {
        console.error('[Moderation] Get warnings error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get warnings'
        });
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

        const response = await axios.delete(
            `${BOT_API_URL}/api/moderation/${guildId}/warnings/${warningId}`,
            {
                headers: { 'x-api-key': BOT_API_KEY },
                data: { userId },
                timeout: 5000
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('[Moderation] Remove warning error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to remove warning'
        });
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

        const response = await axios.get(`${BOT_API_URL}/api/moderation/${guildId}/history`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { userId, limit },
            timeout: 5000
        });

        res.json(response.data);
    } catch (error) {
        console.error('[Moderation] History error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get moderation history'
        });
    }
});

module.exports = router;
