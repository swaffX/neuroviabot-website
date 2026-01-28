// ==========================================
// 📊 Analytics API Routes
// ==========================================
// Real-time server analytics and activity tracking

const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// ==========================================
// GET /api/analytics/:guildId/activity
// Get guild activity (last 24 hours)
// ==========================================
router.get('/:guildId/activity', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { hours = 24 } = req.query;

        const response = await axios.get(`${BOT_API_URL}/api/analytics/${guildId}/activity`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { hours },
            timeout: 5000
        });

        res.json(response.data);
    } catch (error) {
        console.error('[Analytics] Activity error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity data'
        });
    }
});

// ==========================================
// GET /api/analytics/:guildId/activity/live
// Get real-time activity feed
// ==========================================
router.get('/:guildId/activity/live', async (req, res) => {
    try {
        const { guildId } = req.params;

        const response = await axios.get(`${BOT_API_URL}/api/analytics/${guildId}/activity/live`, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 5000
        });

        res.json(response.data);
    } catch (error) {
        console.error('[Analytics] Live activity error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch live activity'
        });
    }
});

// ==========================================
// GET /api/analytics/:guildId/commands
// Get command usage stats
// ==========================================
router.get('/:guildId/commands', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { days = 7 } = req.query;

        const response = await axios.get(`${BOT_API_URL}/api/analytics/${guildId}/commands`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { days },
            timeout: 5000
        });

        res.json(response.data);
    } catch (error) {
        console.error('[Analytics] Commands error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch command stats'
        });
    }
});

// ==========================================
// GET /api/analytics/:guildId/members
// Get member activity stats
// ==========================================
router.get('/:guildId/members', async (req, res) => {
    try {
        const { guildId } = req.params;

        const response = await axios.get(`${BOT_API_URL}/api/analytics/${guildId}/members`, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 5000
        });

        res.json(response.data);
    } catch (error) {
        console.error('[Analytics] Members error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch member stats'
        });
    }
});

module.exports = router;
