// ==========================================
// 🤖 NeuroViaBot - Server Stats API Routes
// ==========================================

const express = require('express');
const router = express.Router();

let botClient = null;

function setClient(client) {
    botClient = client;
}

// Get server stats settings
router.get('/:guildId/settings', async (req, res) => {
    try {
        const { guildId } = req.params;

        if (!botClient || !botClient.serverStatsHandler) {
            return res.status(503).json({
                success: false,
                error: 'Bot servisi kullanılamıyor'
            });
        }

        const settings = botClient.serverStatsHandler.getGuildStatsSettings(guildId);

        res.json({
            success: true,
            settings
        });

    } catch (error) {
        console.error('Server stats settings getirme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update server stats settings
router.post('/:guildId/settings', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { settings } = req.body;

        if (!botClient || !botClient.serverStatsHandler) {
            return res.status(503).json({
                success: false,
                error: 'Bot servisi kullanılamıyor'
            });
        }

        const updatedSettings = botClient.serverStatsHandler.saveGuildStatsSettings(guildId, settings);

        // Socket.IO ile frontend'e bildir
        if (botClient.socket) {
            botClient.socket.emit('broadcast_to_guild', {
                guildId,
                event: 'server_stats_settings_updated',
                data: {
                    settings: updatedSettings,
                    timestamp: new Date().toISOString()
                }
            });
        }

        res.json({
            success: true,
            settings: updatedSettings
        });

    } catch (error) {
        console.error('Server stats settings güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Toggle server stats (enable/disable)
router.post('/:guildId/toggle', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { enabled } = req.body;

        if (!botClient || !botClient.serverStatsHandler) {
            return res.status(503).json({
                success: false,
                error: 'Bot servisi kullanılamıyor'
            });
        }

        const result = await botClient.serverStatsHandler.toggleStats(guildId, enabled);

        // Socket.IO ile frontend'e bildir
        if (result.success && botClient.socket) {
            botClient.socket.emit('broadcast_to_guild', {
                guildId,
                event: 'server_stats_toggled',
                data: {
                    enabled,
                    timestamp: new Date().toISOString()
                }
            });
        }

        res.json(result);

    } catch (error) {
        console.error('Server stats toggle hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Setup stats channels
router.post('/:guildId/setup', async (req, res) => {
    try {
        const { guildId } = req.params;

        if (!botClient || !botClient.serverStatsHandler) {
            return res.status(503).json({
                success: false,
                error: 'Bot servisi kullanılamıyor'
            });
        }

        const guild = botClient.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({
                success: false,
                error: 'Sunucu bulunamadı'
            });
        }

        const result = await botClient.serverStatsHandler.setupStatsChannels(guild);

        if (result.success) {
            // Auto update'i başlat
            botClient.serverStatsHandler.startAutoUpdate(guildId);
        }

        res.json(result);

    } catch (error) {
        console.error('Server stats setup hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update channel names
router.post('/:guildId/channel-names', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { channelNames } = req.body;

        if (!botClient || !botClient.serverStatsHandler) {
            return res.status(503).json({
                success: false,
                error: 'Bot servisi kullanılamıyor'
            });
        }

        const result = await botClient.serverStatsHandler.updateChannelNames(guildId, channelNames);

        res.json(result);

    } catch (error) {
        console.error('Kanal ismi güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Force update stats channels
router.post('/:guildId/update', async (req, res) => {
    try {
        const { guildId } = req.params;

        if (!botClient || !botClient.serverStatsHandler) {
            return res.status(503).json({
                success: false,
                error: 'Bot servisi kullanılamıyor'
            });
        }

        const guild = botClient.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({
                success: false,
                error: 'Sunucu bulunamadı'
            });
        }

        const result = await botClient.serverStatsHandler.updateStatsChannels(guild);

        res.json(result);

    } catch (error) {
        console.error('Stats güncelleme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get current stats
router.get('/:guildId/current', async (req, res) => {
    try {
        const { guildId } = req.params;

        if (!botClient) {
            return res.status(503).json({
                success: false,
                error: 'Bot servisi kullanılamıyor'
            });
        }

        const guild = botClient.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({
                success: false,
                error: 'Sunucu bulunamadı'
            });
        }

        const stats = await botClient.serverStatsHandler.calculateStats(guild);

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Stats getirme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete server stats
router.delete('/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;

        if (!botClient || !botClient.serverStatsHandler) {
            return res.status(503).json({
                success: false,
                error: 'Bot servisi kullanılamıyor'
            });
        }

        const guild = botClient.guilds.cache.get(guildId);
        if (!guild) {
            return res.status(404).json({
                success: false,
                error: 'Sunucu bulunamadı'
            });
        }

        const result = await botClient.serverStatsHandler.removeStatsChannels(guild);

        res.json(result);

    } catch (error) {
        console.error('Server stats silme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = { router, setClient };

