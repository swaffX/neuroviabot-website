// ==========================================
// 🔧 Developer Bot API (Internal)
// ==========================================
// Provides access to bot internals for developer panel

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');
const os = require('os');
const fs = require('fs');
const path = require('path');

// API Key validation middleware
function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.BOT_API_KEY || 'your-secret-api-key';
    
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({
            success: false,
            error: 'Invalid API key'
        });
    }
    
    next();
}

router.use(validateApiKey);

// Store client reference
let botClient = null;
let commandWatcher = null;

function setClient(client) {
    botClient = client;
}

function setCommandWatcher(watcher) {
    commandWatcher = watcher;
}

// ==========================================
// GET /api/dev-bot/stats
// Get bot statistics
// ==========================================
router.get('/stats', (req, res) => {
    try {
        if (!botClient) {
            return res.status(503).json({ success: false, error: 'Bot not ready' });
        }

        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        const stats = {
            uptime: process.uptime(),
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                rss: Math.round(memUsage.rss / 1024 / 1024), // MB
                external: Math.round(memUsage.external / 1024 / 1024) // MB
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            system: {
                platform: os.platform(),
                arch: os.arch(),
                totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024), // GB
                freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024), // GB
                cpuCount: os.cpus().length,
                nodeVersion: process.version
            },
            bot: {
                guilds: botClient.guilds.cache.size,
                users: botClient.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
                channels: botClient.channels.cache.size,
                ping: botClient.ws.ping,
                readyAt: botClient.readyAt,
                shard: botClient.shard ? {
                    id: botClient.shard.id,
                    count: botClient.shard.count
                } : null
            }
        };

        res.json({ success: true, stats });
    } catch (error) {
        logger.error('[Dev API] Stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get stats' });
    }
});

// ==========================================
// GET /api/dev-bot/guilds
// Get all guilds
// ==========================================
router.get('/guilds', (req, res) => {
    try {
        if (!botClient) {
            return res.status(503).json({ success: false, error: 'Bot not ready' });
        }

        const guilds = botClient.guilds.cache.map(guild => ({
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL(),
            memberCount: guild.memberCount,
            ownerId: guild.ownerId,
            channels: guild.channels.cache.size,
            roles: guild.roles.cache.size,
            joinedAt: guild.joinedAt,
            premium: guild.premiumTier,
            features: guild.features
        }));

        res.json({ success: true, guilds });
    } catch (error) {
        logger.error('[Dev API] Guilds error:', error);
        res.status(500).json({ success: false, error: 'Failed to get guilds' });
    }
});

// ==========================================
// GET /api/dev-bot/commands
// Get all commands with usage stats
// ==========================================
router.get('/commands', (req, res) => {
    try {
        if (!botClient) {
            return res.status(503).json({ success: false, error: 'Bot not ready' });
        }

        const commands = [];
        for (const [name, cmd] of botClient.commands) {
            commands.push({
                name: cmd.data.name,
                description: cmd.data.description,
                category: cmd.category || 'general',
                options: cmd.data.options?.length || 0,
                permissions: cmd.data.default_member_permissions,
                dmPermission: cmd.data.dm_permission,
                usageCount: cmd.usageCount || 0
            });
        }

        res.json({ 
            success: true, 
            commands,
            total: commands.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('[Dev API] Commands error:', error);
        res.status(500).json({ success: false, error: 'Failed to get commands' });
    }
});

// ==========================================
// POST /api/dev-bot/commands/refresh
// Force refresh command list
// ==========================================
router.post('/commands/refresh', async (req, res) => {
    try {
        if (!botClient) {
            return res.status(503).json({ success: false, error: 'Bot not ready' });
        }

        if (!commandWatcher) {
            return res.status(503).json({ success: false, error: 'Command watcher not initialized' });
        }

        // Force refresh
        const result = await commandWatcher.forceRefresh();
        
        logger.info('[Dev API] Command refresh completed:', result);
        res.json(result);
    } catch (error) {
        logger.error('[Dev API] Command refresh error:', error);
        res.status(500).json({ success: false, error: 'Failed to refresh commands' });
    }
});

// ==========================================
// POST /api/dev-bot/commands/:name/toggle
// Enable/disable a command
// ==========================================
router.post('/commands/:name/toggle', (req, res) => {
    try {
        const { name } = req.params;
        const { enabled } = req.body;

        if (!botClient) {
            return res.status(503).json({ success: false, error: 'Bot not ready' });
        }

        const command = botClient.commands.get(name);
        if (!command) {
            return res.status(404).json({ success: false, error: 'Command not found' });
        }

        command.enabled = enabled;

        logger.info(`[Dev API] Command ${name} ${enabled ? 'enabled' : 'disabled'}`);
        res.json({ success: true, command: name, enabled });
    } catch (error) {
        logger.error('[Dev API] Command toggle error:', error);
        res.status(500).json({ success: false, error: 'Failed to toggle command' });
    }
});

// ==========================================
// GET /api/dev-bot/database/schema
// Get database schema
// ==========================================
router.get('/database/schema', (req, res) => {
    try {
        const db = getDatabase();
        
        const schema = {};
        for (const [key, value] of Object.entries(db.data)) {
            if (value instanceof Map) {
                schema[key] = {
                    type: 'Map',
                    size: value.size,
                    sample: value.size > 0 ? Object.fromEntries([...value.entries()].slice(0, 1)) : null
                };
            }
        }

        res.json({ success: true, schema });
    } catch (error) {
        logger.error('[Dev API] Schema error:', error);
        res.status(500).json({ success: false, error: 'Failed to get schema' });
    }
});

// ==========================================
// POST /api/dev-bot/database/backup
// Create database backup
// ==========================================
router.post('/database/backup', (req, res) => {
    try {
        const db = getDatabase();
        const backupName = `backup-${Date.now()}.json`;
        const backupPath = path.join(__dirname, '..', '..', 'data', 'backups', backupName);

        // Ensure backups directory exists
        const backupsDir = path.dirname(backupPath);
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        // Create backup
        db.saveData();
        const dbPath = db.dbPath;
        fs.copyFileSync(dbPath, backupPath);

        logger.info(`[Dev API] Database backup created: ${backupName}`);
        res.json({ 
            success: true, 
            backup: backupName,
            path: backupPath,
            size: fs.statSync(backupPath).size
        });
    } catch (error) {
        logger.error('[Dev API] Backup error:', error);
        res.status(500).json({ success: false, error: 'Failed to create backup' });
    }
});

// ==========================================
// POST /api/dev-bot/system/restart
// Restart bot (requires PM2)
// ==========================================
router.post('/system/restart', (req, res) => {
    try {
        logger.warn('[Dev API] Bot restart requested');
        
        res.json({ 
            success: true, 
            message: 'Bot restarting...',
            restartTime: Date.now()
        });

        // Give time for response to be sent
        setTimeout(() => {
            process.exit(0); // PM2 will auto-restart
        }, 1000);
    } catch (error) {
        logger.error('[Dev API] Restart error:', error);
        res.status(500).json({ success: false, error: 'Failed to restart' });
    }
});

// ==========================================
// POST /api/dev-bot/system/clear-cache
// Clear all caches
// ==========================================
router.post('/system/clear-cache', (req, res) => {
    try {
        if (!botClient) {
            return res.status(503).json({ success: false, error: 'Bot not ready' });
        }

        // Clear command cache
        botClient.commands.forEach(cmd => {
            if (cmd.cooldowns) {
                cmd.cooldowns.clear();
            }
        });

        // Clear guild cache
        botClient.guilds.cache.clear();
        botClient.channels.cache.clear();
        botClient.users.cache.clear();

        logger.info('[Dev API] All caches cleared');
        res.json({ success: true, message: 'Caches cleared successfully' });
    } catch (error) {
        logger.error('[Dev API] Clear cache error:', error);
        res.status(500).json({ success: false, error: 'Failed to clear cache' });
    }
});

// ==========================================
// POST /api/dev-bot/system/sync-commands
// Force sync slash commands
// ==========================================
router.post('/system/sync-commands', async (req, res) => {
    try {
        if (!botClient) {
            return res.status(503).json({ success: false, error: 'Bot not ready' });
        }

        const { REST } = require('@discordjs/rest');
        const { Routes } = require('discord-api-types/v10');

        const commands = [];
        botClient.commands.forEach(cmd => {
            commands.push(cmd.data.toJSON());
        });

        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

        await rest.put(
            Routes.applicationCommands(botClient.user.id),
            { body: commands }
        );

        logger.info(`[Dev API] Synced ${commands.length} commands`);
        res.json({ success: true, syncedCommands: commands.length });
    } catch (error) {
        logger.error('[Dev API] Sync commands error:', error);
        res.status(500).json({ success: false, error: 'Failed to sync commands' });
    }
});

// ==========================================
// GET /api/dev-bot/logs
// Get recent logs
// ==========================================
router.get('/logs', (req, res) => {
    try {
        const { limit = 100 } = req.query;
        const logsPath = path.join(__dirname, '..', 'logs', 'combined.log');

        if (!fs.existsSync(logsPath)) {
            return res.json({ success: true, logs: [] });
        }

        const logs = fs.readFileSync(logsPath, 'utf8')
            .split('\n')
            .filter(line => line.trim())
            .slice(-parseInt(limit))
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { message: line, level: 'info', timestamp: new Date().toISOString() };
                }
            });

        res.json({ success: true, logs });
    } catch (error) {
        logger.error('[Dev API] Logs error:', error);
        res.status(500).json({ success: false, error: 'Failed to get logs' });
    }
});

// ==========================================
// NEW ENDPOINTS FOR DEVELOPER PANEL
// ==========================================

// ==========================================
// POST /api/dev-bot/commands/:name/update
// Update command properties
// ==========================================
router.post('/commands/:name/update', (req, res) => {
    try {
        const { name } = req.params;
        const updates = req.body;

        if (!botClient) {
            return res.status(503).json({ success: false, error: 'Bot not ready' });
        }

        const command = botClient.commands.get(name);
        if (!command) {
            return res.status(404).json({ success: false, error: 'Command not found' });
        }

        // Apply updates
        Object.assign(command, updates);

        logger.info(`[Dev API] Command ${name} updated:`, updates);
        res.json({ success: true, command: name, updates });
    } catch (error) {
        logger.error('[Dev API] Command update error:', error);
        res.status(500).json({ success: false, error: 'Failed to update command' });
    }
});

// ==========================================
// GET /api/dev-bot/stats/realtime
// Get real-time bot statistics (extended)
// ==========================================
router.get('/stats/realtime', (req, res) => {
    try {
        if (!botClient) {
            return res.status(503).json({ success: false, error: 'Bot not ready' });
        }

        const memUsage = process.memoryUsage();
        
        const stats = {
            guilds: botClient.guilds.cache.size,
            users: botClient.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
            channels: botClient.channels.cache.size,
            commands: botClient.commands.size,
            ping: botClient.ws.ping,
            uptime: process.uptime(),
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024)
            },
            timestamp: Date.now()
        };

        res.json({ success: true, stats });
    } catch (error) {
        logger.error('[Dev API] Real-time stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to get real-time stats' });
    }
});

// ==========================================
// GET /api/dev-bot/system/health
// Get system health status
// ==========================================
router.get('/system/health', (req, res) => {
    try {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        const health = {
            status: 'healthy',
            bot: {
                ready: botClient ? botClient.isReady() : false,
                ping: botClient ? botClient.ws.ping : -1,
                uptime: process.uptime()
            },
            system: {
                platform: os.platform(),
                arch: os.arch(),
                nodeVersion: process.version,
                memory: {
                    total: Math.round(os.totalmem() / 1024 / 1024 / 1024),
                    free: Math.round(os.freemem() / 1024 / 1024 / 1024),
                    used: Math.round(memUsage.rss / 1024 / 1024)
                },
                cpu: {
                    count: os.cpus().length,
                    usage: cpuUsage,
                    loadAvg: os.loadavg()
                }
            },
            timestamp: Date.now()
        };

        // Determine overall health status
        if (!botClient || !botClient.isReady()) {
            health.status = 'degraded';
        } else if (botClient.ws.ping > 500) {
            health.status = 'warning';
        }

        res.json({ success: true, health });
    } catch (error) {
        logger.error('[Dev API] System health error:', error);
        res.status(500).json({ 
            success: false, 
            health: { status: 'error', error: error.message }
        });
    }
});

// ==========================================
// GET /api/dev-bot/system/errors
// Get error logs and auto-fix status
// ==========================================
router.get('/system/errors', (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const errorLogsPath = path.join(__dirname, '..', 'logs', 'error.log');

        if (!fs.existsSync(errorLogsPath)) {
            return res.json({ success: true, errors: [] });
        }

        const errors = fs.readFileSync(errorLogsPath, 'utf8')
            .split('\n')
            .filter(line => line.trim())
            .slice(-parseInt(limit))
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return { 
                        message: line, 
                        level: 'error', 
                        timestamp: new Date().toISOString() 
                    };
                }
            });

        res.json({ success: true, errors, total: errors.length });
    } catch (error) {
        logger.error('[Dev API] System errors error:', error);
        res.status(500).json({ success: false, error: 'Failed to get system errors' });
    }
});

// ==========================================
// POST /api/dev-bot/database/restore
// Restore database from backup
// ==========================================
router.post('/database/restore', (req, res) => {
    try {
        const { backupId } = req.body;

        if (!backupId) {
            return res.status(400).json({ success: false, error: 'Backup ID is required' });
        }

        const backupPath = path.join(__dirname, '..', '..', 'data', 'backups', backupId);
        
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({ success: false, error: 'Backup not found' });
        }

        const db = getDatabase();
        const dbPath = db.dbPath;

        // Create safety backup of current database
        const safetyBackupName = `pre-restore-${Date.now()}.json`;
        const safetyBackupPath = path.join(__dirname, '..', '..', 'data', 'backups', safetyBackupName);
        fs.copyFileSync(dbPath, safetyBackupPath);

        // Restore from backup
        fs.copyFileSync(backupPath, dbPath);

        // Reload database
        db.loadData();

        logger.info(`[Dev API] Database restored from: ${backupId}`);
        res.json({ 
            success: true, 
            restored: backupId,
            safetyBackup: safetyBackupName
        });
    } catch (error) {
        logger.error('[Dev API] Restore error:', error);
        res.status(500).json({ success: false, error: 'Failed to restore database' });
    }
});

// ==========================================
// GET /api/dev-bot/status
// Get bot status
// ==========================================
router.get('/status', (req, res) => {
    try {
        if (!botClient) {
            return res.json({ 
                success: true, 
                status: 'offline',
                message: 'Bot client not initialized'
            });
        }

        res.json({ 
            success: true, 
            status: botClient.isReady() ? 'online' : 'connecting',
            user: {
                id: botClient.user?.id,
                username: botClient.user?.username,
                tag: botClient.user?.tag
            },
            ping: botClient.ws.ping,
            uptime: process.uptime(),
            readyAt: botClient.readyAt
        });
    } catch (error) {
        logger.error('[Dev API] Status error:', error);
        res.status(500).json({ success: false, error: 'Failed to get bot status' });
    }
});

module.exports = { router, setClient, setCommandWatcher };

