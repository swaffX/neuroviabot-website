// ==========================================
// 📋 Bot Commands Proxy Routes
// ==========================================
// Proxy bot commands API to frontend

const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// ==========================================
// GET /api/bot-commands/commands/list
// Get all commands with categories and stats
// ==========================================
router.get('/commands/list', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/bot-commands/list`, {
            timeout: 10000
        });
        res.json(response.data);
    } catch (error) {
        console.error('[Bot Commands] Failed to fetch:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch commands from bot' 
        });
    }
});

// ==========================================
// GET /api/bot-commands/guild/:guildId
// Get guild-specific commands
// ==========================================
router.get('/guild/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        
        const response = await axios.get(
            `${BOT_API_URL}/api/bot-commands/guild/${guildId}`,
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 10000
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('[Bot Commands] Failed to fetch guild commands:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch guild commands' 
        });
    }
});

// ==========================================
// POST /api/bot-commands/guild/:guildId/toggle
// Toggle command for guild
// ==========================================
router.post('/guild/:guildId/toggle', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { commandName } = req.body;
        
        const response = await axios.post(
            `${BOT_API_URL}/api/bot-commands/guild/${guildId}/toggle`,
            { commandName },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 10000
            }
        );
        res.json(response.data);
    } catch (error) {
        console.error('[Bot Commands] Failed to toggle command:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.response?.data?.error || 'Failed to toggle command' 
        });
    }
});

module.exports = router;
