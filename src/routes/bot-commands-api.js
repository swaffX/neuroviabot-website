// ==========================================
// 📋 Bot Commands API
// ==========================================
// Expose command list and stats to frontend

const express = require('express');
const router = express.Router();
const { getAllCommands, getGuildCommands, toggleGuildCommand, getCommandCategories } = require('../utils/commandRegistry');
const { logger } = require('../utils/logger');

let botClient = null;

function setClient(client) {
    botClient = client;
}

// API Key validation
function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.BOT_API_KEY || 'your-secret-api-key';
    
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
    
    next();
}

// ==========================================
// GET /api/bot-commands/list
// Get all commands with categories and stats
// ==========================================
router.get('/api/bot-commands/list', (req, res) => {
    try {
        if (!botClient) {
            return res.status(503).json({ 
                success: false, 
                error: 'Bot not ready' 
            });
        }

        const commands = getAllCommands(botClient);
        const categories = getCommandCategories();

        // Group by category
        const grouped = commands.reduce((acc, cmd) => {
            if (!acc[cmd.category]) {
                acc[cmd.category] = [];
            }
            acc[cmd.category].push(cmd);
            return acc;
        }, {});

        res.json({ 
            success: true, 
            commands,
            grouped,
            categories,
            total: commands.length 
        });
    } catch (error) {
        logger.error('[Bot Commands API] List error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// GET /api/bot-commands/guild/:guildId
// Get guild-specific commands
// ==========================================
router.get('/api/bot-commands/guild/:guildId', validateApiKey, (req, res) => {
    try {
        const { guildId } = req.params;
        
        if (!botClient) {
            return res.status(503).json({ 
                success: false, 
                error: 'Bot not ready' 
            });
        }

        const commands = getGuildCommands(botClient, guildId);
        const categories = getCommandCategories();

        res.json({ 
            success: true, 
            commands,
            categories,
            total: commands.length 
        });
    } catch (error) {
        logger.error('[Bot Commands API] Guild commands error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// POST /api/bot-commands/guild/:guildId/toggle
// Toggle command for guild
// ==========================================
router.post('/api/bot-commands/guild/:guildId/toggle', validateApiKey, (req, res) => {
    try {
        const { guildId } = req.params;
        const { commandName } = req.body;

        if (!commandName) {
            return res.status(400).json({ 
                success: false, 
                error: 'Command name required' 
            });
        }

        const result = toggleGuildCommand(guildId, commandName);

        res.json({ 
            success: true, 
            ...result
        });
    } catch (error) {
        logger.error('[Bot Commands API] Toggle error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
});

module.exports = { router, setClient };

