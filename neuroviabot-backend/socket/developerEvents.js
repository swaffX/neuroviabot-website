// ==========================================
// 🔌 Developer Socket.IO Events
// ==========================================
// Real-time updates for developer panel

const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

const DEVELOPER_IDS = ['315875588906680330', '413081778031427584'];

let statsInterval = null;
let io = null;

/**
 * Initialize developer events
 */
function initDeveloperEvents(socketIO) {
    io = socketIO;
    console.log('[Developer Events] Initialized');

    // Start real-time stats broadcast (every 5 seconds)
    if (!statsInterval) {
        statsInterval = setInterval(broadcastBotStats, 5000);
    }

    // Socket.IO connection handler
    io.on('connection', (socket) => {
        const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

        // Only emit to developers
        if (!DEVELOPER_IDS.includes(userId)) {
            return;
        }

        console.log(`[Developer Events] Developer connected: ${userId}`);

        // Send initial stats on connect
        broadcastBotStats(socket);

        // Listen for developer actions
        socket.on('dev:request_logs', async (data) => {
            try {
                const response = await axios.get(`${BOT_API_URL}/api/dev-bot/logs`, {
                    headers: { 'x-api-key': BOT_API_KEY },
                    params: { limit: data.limit || 100 },
                    timeout: 10000
                });

                socket.emit('dev:logs_response', response.data);
            } catch (error) {
                socket.emit('dev:error', { message: 'Failed to fetch logs' });
            }
        });

        socket.on('dev:request_schema', async () => {
            try {
                const response = await axios.get(`${BOT_API_URL}/api/dev-bot/database/schema`, {
                    headers: { 'x-api-key': BOT_API_KEY },
                    timeout: 10000
                });

                socket.emit('dev:schema_response', response.data);
            } catch (error) {
                socket.emit('dev:error', { message: 'Failed to fetch schema' });
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Developer Events] Developer disconnected: ${userId}`);
        });
        
        // New events for developer panel
        socket.on('developer:command_update', (data) => {
            // Broadcast command update to all developers
            io.to('developers').emit('developer:command_updated', data);
        });
        
        socket.on('developer:request_bot_status', async () => {
            try {
                const response = await axios.get(`${BOT_API_URL}/api/dev-bot/status`, {
                    headers: { 'x-api-key': BOT_API_KEY },
                    timeout: 5000
                });
                socket.emit('developer:bot_status', response.data);
            } catch (error) {
                socket.emit('dev:error', { message: 'Failed to fetch bot status' });
            }
        });
        
        socket.on('developer:request_health', async () => {
            try {
                const response = await axios.get(`${BOT_API_URL}/api/dev-bot/system/health`, {
                    headers: { 'x-api-key': BOT_API_KEY },
                    timeout: 5000
                });
                socket.emit('developer:health_update', response.data);
            } catch (error) {
                socket.emit('dev:error', { message: 'Failed to fetch system health' });
            }
        });
        
        socket.on('developer:request_errors', async (data) => {
            try {
                const response = await axios.get(`${BOT_API_URL}/api/dev-bot/system/errors`, {
                    headers: { 'x-api-key': BOT_API_KEY },
                    params: { limit: data?.limit || 50 },
                    timeout: 5000
                });
                socket.emit('developer:errors_update', response.data);
            } catch (error) {
                socket.emit('dev:error', { message: 'Failed to fetch errors' });
            }
        });
        
        socket.on('developer:request_realtime_stats', async () => {
            try {
                const response = await axios.get(`${BOT_API_URL}/api/dev-bot/stats/realtime`, {
                    headers: { 'x-api-key': BOT_API_KEY },
                    timeout: 5000
                });
                socket.emit('developer:stats_update', response.data);
            } catch (error) {
                socket.emit('dev:error', { message: 'Failed to fetch realtime stats' });
            }
        });
    });
}

/**
 * Broadcast bot stats to all connected developers
 */
async function broadcastBotStats(specificSocket = null) {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/dev-bot/stats`, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 5000
        });

        const statsData = {
            ...response.data,
            timestamp: Date.now()
        };

        if (specificSocket) {
            // Send to specific socket
            specificSocket.emit('dev:bot_stats', statsData);
        } else if (io) {
            // Broadcast to all developers
            DEVELOPER_IDS.forEach(devId => {
                io.to(`user:${devId}`).emit('dev:bot_stats', statsData);
            });
        }
    } catch (error) {
        // Silently fail if bot is not reachable
        if (error.code !== 'ECONNREFUSED') {
            console.error('[Developer Events] Stats broadcast error:', error.message);
        }
    }
}

/**
 * Emit command execution event
 */
function emitCommandExecuted(data) {
    if (!io) return;

    DEVELOPER_IDS.forEach(devId => {
        io.to(`user:${devId}`).emit('dev:command_executed', {
            command: data.command,
            user: data.user,
            guild: data.guild,
            success: data.success,
            timestamp: Date.now()
        });
    });
}

/**
 * Emit error event
 */
function emitError(error, context = {}) {
    if (!io) return;

    DEVELOPER_IDS.forEach(devId => {
        io.to(`user:${devId}`).emit('dev:error_occurred', {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            context,
            timestamp: Date.now()
        });
    });
}

/**
 * Emit guild join event
 */
function emitGuildJoined(guild) {
    if (!io) return;

    DEVELOPER_IDS.forEach(devId => {
        io.to(`user:${devId}`).emit('dev:guild_joined', {
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            timestamp: Date.now()
        });
    });
}

/**
 * Emit guild leave event
 */
function emitGuildLeft(guild) {
    if (!io) return;

    DEVELOPER_IDS.forEach(devId => {
        io.to(`user:${devId}`).emit('dev:guild_left', {
            id: guild.id,
            name: guild.name,
            timestamp: Date.now()
        });
    });
}

/**
 * Emit database query result
 */
function emitDatabaseQuery(query, results) {
    if (!io) return;

    DEVELOPER_IDS.forEach(devId => {
        io.to(`user:${devId}`).emit('dev:database_query', {
            query,
            results,
            timestamp: Date.now()
        });
    });
}

/**
 * Cleanup on shutdown
 */
function cleanup() {
    if (statsInterval) {
        clearInterval(statsInterval);
        statsInterval = null;
    }
}

module.exports = {
    initDeveloperEvents,
    emitCommandExecuted,
    emitError,
    emitGuildJoined,
    emitGuildLeft,
    emitDatabaseQuery,
    cleanup
};

