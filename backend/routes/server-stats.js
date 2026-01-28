// ==========================================
// 🌐 Backend - Server Stats Routes
// ==========================================

const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';

// Middleware to check authentication
const requireAuth = (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Get server stats settings
router.get('/:guildId/settings', requireAuth, async (req, res) => {
    try {
        const { guildId } = req.params;

        const response = await axios.get(`${BOT_API_URL}/api/bot/server-stats/${guildId}/settings`, {
            timeout: 5000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Server stats settings getirme hatası:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message
        });
    }
});

// Update server stats settings
router.post('/:guildId/settings', requireAuth, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { settings } = req.body;

        const response = await axios.post(`${BOT_API_URL}/api/bot/server-stats/${guildId}/settings`, {
            settings
        }, {
            timeout: 5000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Server stats settings güncelleme hatası:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message
        });
    }
});

// Toggle server stats
router.post('/:guildId/toggle', requireAuth, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { enabled } = req.body;

        const response = await axios.post(`${BOT_API_URL}/api/bot/server-stats/${guildId}/toggle`, {
            enabled
        }, {
            timeout: 10000 // Channel creation can take time
        });

        res.json(response.data);

    } catch (error) {
        console.error('Server stats toggle hatası:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message
        });
    }
});

// Setup server stats channels
router.post('/:guildId/setup', requireAuth, async (req, res) => {
    try {
        const { guildId } = req.params;

        const response = await axios.post(`${BOT_API_URL}/api/bot/server-stats/${guildId}/setup`, {}, {
            timeout: 15000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Server stats setup hatası:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message
        });
    }
});

// Update channel names
router.post('/:guildId/channel-names', requireAuth, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { channelNames } = req.body;

        const response = await axios.post(`${BOT_API_URL}/api/bot/server-stats/${guildId}/channel-names`, {
            channelNames
        }, {
            timeout: 10000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Kanal ismi güncelleme hatası:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message
        });
    }
});

// Force update stats
router.post('/:guildId/update', requireAuth, async (req, res) => {
    try {
        const { guildId } = req.params;

        const response = await axios.post(`${BOT_API_URL}/api/bot/server-stats/${guildId}/update`, {}, {
            timeout: 5000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Stats güncelleme hatası:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message
        });
    }
});

// Get current stats
router.get('/:guildId/current', requireAuth, async (req, res) => {
    try {
        const { guildId } = req.params;

        const response = await axios.get(`${BOT_API_URL}/api/bot/server-stats/${guildId}/current`, {
            timeout: 5000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Stats getirme hatası:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message
        });
    }
});

// Delete server stats
router.delete('/:guildId', requireAuth, async (req, res) => {
    try {
        const { guildId } = req.params;

        const response = await axios.delete(`${BOT_API_URL}/api/bot/server-stats/${guildId}`, {
            timeout: 10000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Server stats silme hatası:', error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.error || error.message
        });
    }
});

module.exports = router;

