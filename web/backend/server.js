const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { sequelize } = require('../../database/connection');
const { Guild, User, GuildMember, Ticket, Warning, Giveaway, ModerationCase } = require('../../models');
const { logger } = require('../../utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3002'
    ],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for legal pages
app.use('/public', express.static('web/backend/public'));

// Direct routes for Discord Application Settings
app.get('/terms-of-service', (req, res) => {
    res.sendFile('terms-of-service.html', { root: 'web/backend/public' });
});

app.get('/privacy-policy', (req, res) => {
    res.sendFile('privacy-policy.html', { root: 'web/backend/public' });
});

// Alternative routes
app.get('/terms', (req, res) => {
    res.sendFile('terms-of-service.html', { root: 'web/backend/public' });
});

app.get('/privacy', (req, res) => {
    res.sendFile('privacy-policy.html', { root: 'web/backend/public' });
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    }
});

app.use('/api/', limiter);

// Auth rate limiting (daha sıkı)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED'
    }
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required', code: 'TOKEN_REQUIRED' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token', code: 'TOKEN_INVALID' });
        }
        req.user = user;
        next();
    });
};

// Discord OAuth helper (basic implementation)
const getDiscordUser = async (accessToken) => {
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Discord user');
        }

        return await response.json();
    } catch (error) {
        logger.error('Discord API error', error);
        return null;
    }
};

const getUserGuilds = async (accessToken) => {
    try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch Discord guilds');
        }

        return await response.json();
    } catch (error) {
        logger.error('Discord Guilds API error', error);
        return [];
    }
};

// Routes

// API Root endpoint
app.get('/api', (req, res) => {
    res.json({ 
        name: 'Discord Bot Dashboard API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/health',
            'POST /api/auth/discord',
            'GET /api/user',
            'GET /api/guilds',
            'GET /api/guild/:id',
            'GET /api/stats'
        ]
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Discord OAuth login
app.post('/api/auth/discord', authLimiter, async (req, res) => {
    try {
        const { access_token } = req.body;

        if (!access_token) {
            return res.status(400).json({ error: 'Access token is required', code: 'TOKEN_REQUIRED' });
        }

        // Discord kullanıcı bilgilerini al
        const discordUser = await getDiscordUser(access_token);
        if (!discordUser) {
            return res.status(401).json({ error: 'Invalid Discord token', code: 'INVALID_DISCORD_TOKEN' });
        }

        // Kullanıcının guild'larını al
        const discordGuilds = await getUserGuilds(access_token);
        const managedGuilds = discordGuilds.filter(guild => 
            (guild.permissions & 0x20) === 0x20 || // MANAGE_GUILD
            (guild.permissions & 0x8) === 0x8     // ADMINISTRATOR
        );

        // Database'de kullanıcıyı bul/oluştur
        const [user, created] = await User.findOrCreate({
            where: { id: discordUser.id },
            defaults: {
                username: discordUser.username,
                discriminator: discordUser.discriminator,
                globalName: discordUser.global_name,
                avatar: discordUser.avatar,
                dashboardAccess: true
            }
        });

        if (!created) {
            // Kullanıcı bilgilerini güncelle
            await user.update({
                username: discordUser.username,
                discriminator: discordUser.discriminator,
                globalName: discordUser.global_name,
                avatar: discordUser.avatar,
                lastSeen: new Date()
            });
        }

        // JWT token oluştur
        const token = jwt.sign(
            { 
                userId: discordUser.id,
                username: discordUser.username,
                avatar: discordUser.avatar
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: discordUser.id,
                username: discordUser.username,
                discriminator: discordUser.discriminator,
                avatar: discordUser.avatar,
                managedGuilds: managedGuilds.length
            }
        });

    } catch (error) {
        logger.error('Discord auth error', error);
        res.status(500).json({ error: 'Authentication failed', code: 'AUTH_FAILED' });
    }
});

// Get user info
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
        }

        res.json({
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            globalName: user.globalName,
            avatar: user.avatar,
            premium: user.premium,
            dashboardAccess: user.dashboardAccess
        });

    } catch (error) {
        logger.error('Get user error', error);
        res.status(500).json({ error: 'Failed to get user info', code: 'GET_USER_FAILED' });
    }
});

// Get user's guilds
app.get('/api/guilds', authenticateToken, async (req, res) => {
    try {
        // Bot'un bulunduğu guild'ları al
        const botGuilds = global.client ? Array.from(global.client.guilds.cache.values()) : [];
        
        // Database'den guild ayarlarını al
        const guildSettings = await Guild.findAll({
            where: {
                id: botGuilds.map(g => g.id)
            }
        });

        const guildsWithSettings = botGuilds.map(guild => {
            const settings = guildSettings.find(s => s.id === guild.id);
            return {
                id: guild.id,
                name: guild.name,
                icon: guild.iconURL(),
                memberCount: guild.memberCount,
                ownerId: guild.ownerId,
                hasBot: true,
                settings: settings || null
            };
        });

        res.json({
            guilds: guildsWithSettings,
            count: guildsWithSettings.length
        });

    } catch (error) {
        logger.error('Get guilds error', error);
        res.status(500).json({ error: 'Failed to get guilds', code: 'GET_GUILDS_FAILED' });
    }
});

// Get guild details
app.get('/api/guild/:guildId', authenticateToken, async (req, res) => {
    try {
        const { guildId } = req.params;

        // Bot'un guild'de olup olmadığını kontrol et
        const botGuild = global.client ? global.client.guilds.cache.get(guildId) : null;
        if (!botGuild) {
            return res.status(404).json({ error: 'Guild not found or bot not in guild', code: 'GUILD_NOT_FOUND' });
        }

        // Guild ayarlarını al
        const guildSettings = await Guild.findOne({ where: { id: guildId } });

        // Guild istatistiklerini al
        const stats = await Promise.all([
            GuildMember.count({ where: { guildId } }),
            Ticket.count({ where: { guildId, status: 'open' } }),
            Warning.count({ where: { guildId, active: true } }),
            Giveaway.count({ where: { guildId, status: 'active' } }),
            ModerationCase.count({ where: { guildId } })
        ]);

        res.json({
            id: botGuild.id,
            name: botGuild.name,
            icon: botGuild.iconURL(),
            memberCount: botGuild.memberCount,
            ownerId: botGuild.ownerId,
            settings: guildSettings,
            stats: {
                members: stats[0],
                activeTickets: stats[1],
                activeWarnings: stats[2],
                activeGiveaways: stats[3],
                totalModerationCases: stats[4]
            }
        });

    } catch (error) {
        logger.error('Get guild details error', error);
        res.status(500).json({ error: 'Failed to get guild details', code: 'GET_GUILD_FAILED' });
    }
});

// Update guild settings
app.put('/api/guild/:guildId/settings', authenticateToken, async (req, res) => {
    try {
        const { guildId } = req.params;
        const settings = req.body;

        // Bot'un guild'de olup olmadığını kontrol et
        const botGuild = global.client ? global.client.guilds.cache.get(guildId) : null;
        if (!botGuild) {
            return res.status(404).json({ error: 'Guild not found or bot not in guild', code: 'GUILD_NOT_FOUND' });
        }

        // Guild ayarlarını güncelle
        const [guild, created] = await Guild.findOrCreate({
            where: { id: guildId },
            defaults: {
                name: botGuild.name,
                ...settings
            }
        });

        if (!created) {
            await guild.update(settings);
        }

        res.json({
            success: true,
            message: 'Guild settings updated successfully',
            settings: guild
        });

    } catch (error) {
        logger.error('Update guild settings error', error);
        res.status(500).json({ error: 'Failed to update guild settings', code: 'UPDATE_SETTINGS_FAILED' });
    }
});

// Get guild statistics
app.get('/api/guild/:guildId/stats', authenticateToken, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { period = '7d' } = req.query;

        // Zaman aralığını belirle
        let startDate = new Date();
        switch (period) {
            case '24h':
                startDate.setHours(startDate.getHours() - 24);
                break;
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            default:
                startDate.setDate(startDate.getDate() - 7);
        }

        // İstatistikleri al
        const stats = await Promise.all([
            // Yeni üyeler
            GuildMember.count({
                where: {
                    guildId,
                    createdAt: { [sequelize.Sequelize.Op.gte]: startDate }
                }
            }),
            // Yeni ticket'lar
            Ticket.count({
                where: {
                    guildId,
                    createdAt: { [sequelize.Sequelize.Op.gte]: startDate }
                }
            }),
            // Moderasyon işlemleri
            ModerationCase.count({
                where: {
                    guildId,
                    createdAt: { [sequelize.Sequelize.Op.gte]: startDate }
                }
            }),
            // Aktif çekilişler
            Giveaway.count({
                where: {
                    guildId,
                    status: 'active'
                }
            })
        ]);

        res.json({
            period,
            stats: {
                newMembers: stats[0],
                newTickets: stats[1],
                moderationActions: stats[2],
                activeGiveaways: stats[3]
            }
        });

    } catch (error) {
        logger.error('Get guild stats error', error);
        res.status(500).json({ error: 'Failed to get guild statistics', code: 'GET_STATS_FAILED' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Express error', err);
    res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        code: 'ENDPOINT_NOT_FOUND'
    });
});

// Server başlatma fonksiyonu
const startServer = () => {
    return new Promise((resolve, reject) => {
        const server = app.listen(PORT, (err) => {
            if (err) {
                reject(err);
            } else {
                logger.success(`🌐 Web Panel Backend çalışıyor: http://localhost:${PORT}`);
                resolve(server);
            }
        });
    });
};

// Global client referansı için
let globalClient = null;

const setClient = (client) => {
    globalClient = client;
    global.client = client;
};

// Socket.IO setup
const { Server } = require('socket.io');
let io;

function setupSocketIO(server) {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            // Verify JWT token here if needed
            next();
        } else {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected to dashboard:', socket.id);

        socket.on('join_guild_room', ({ guildId }) => {
            socket.join(`guild_${guildId}`);
            console.log(`Socket ${socket.id} joined guild room: ${guildId}`);
        });

        socket.on('leave_guild_room', ({ guildId }) => {
            socket.leave(`guild_${guildId}`);
            console.log(`Socket ${socket.id} left guild room: ${guildId}`);
        });

        socket.on('request_guild_stats', async ({ guildId }) => {
            if (globalClient) {
                const guild = globalClient.guilds.cache.get(guildId);
                if (guild) {
                    const stats = await getRealtimeGuildStats(guild);
                    socket.emit('guild_stats_update', stats);
                }
            }
        });

        socket.on('request_bot_stats', async () => {
            if (globalClient) {
                const stats = await getRealtimeBotStats();
                socket.emit('bot_status_update', stats);
            }
        });

        socket.on('ping', (timestamp) => {
            socket.emit('pong', timestamp);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected from dashboard:', socket.id);
        });
    });

    return io;
}

async function getRealtimeGuildStats(guild) {
    return {
        memberCount: guild.memberCount,
        onlineMembers: guild.members.cache.filter(member => member.presence?.status !== 'offline').size,
        channels: guild.channels.cache.size,
        roles: guild.roles.cache.size,
        lastActivity: new Date()
    };
}

async function getRealtimeBotStats() {
    if (!globalClient) return {};
    
    return {
        guilds: globalClient.guilds.cache.size,
        users: globalClient.users.cache.size,
        uptime: process.uptime(),
        ping: globalClient.ws.ping,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date()
    };
}

// Additional API endpoints for dashboard

// Get guild tickets
app.get('/api/guild/:id/tickets', authenticateToken, async (req, res) => {
    try {
        const { Ticket } = require('../../models');
        const tickets = await Ticket.findAll({
            where: { guildId: req.params.id },
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json(tickets);
    } catch (error) {
        logger.error('Get tickets error', error);
        res.status(500).json({ error: error.message });
    }
});

// Get guild giveaways
app.get('/api/guild/:id/giveaways', authenticateToken, async (req, res) => {
    try {
        const { Giveaway } = require('../../models');
        const giveaways = await Giveaway.findAll({
            where: { guildId: req.params.id },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        res.json(giveaways);
    } catch (error) {
        logger.error('Get giveaways error', error);
        res.status(500).json({ error: error.message });
    }
});

// Get guild moderation cases
app.get('/api/guild/:id/moderation', authenticateToken, async (req, res) => {
    try {
        const { ModerationCase } = require('../../models');
        const cases = await ModerationCase.findAll({
            where: { guildId: req.params.id },
            order: [['timestamp', 'DESC']],
            limit: 50
        });
        res.json(cases);
    } catch (error) {
        logger.error('Get moderation cases error', error);
        res.status(500).json({ error: error.message });
    }
});

// Get guild economy data
app.get('/api/guild/:id/economy', authenticateToken, async (req, res) => {
    try {
        const { GuildMember } = require('../../models');
        const members = await GuildMember.findAll({
            where: { guildId: req.params.id },
            order: [['balance', 'DESC']],
            limit: 20,
            attributes: ['userId', 'nickname', 'balance', 'lastDaily', 'lastWork']
        });
        res.json(members);
    } catch (error) {
        logger.error('Get economy data error', error);
        res.status(500).json({ error: error.message });
    }
});

// Get guild leveling data
app.get('/api/guild/:id/leveling', authenticateToken, async (req, res) => {
    try {
        const { GuildMember } = require('../../models');
        const members = await GuildMember.findAll({
            where: { guildId: req.params.id },
            order: [['level', 'DESC'], ['xp', 'DESC']],
            limit: 20,
            attributes: ['userId', 'nickname', 'xp', 'level']
        });
        res.json(members);
    } catch (error) {
        logger.error('Get leveling data error', error);
        res.status(500).json({ error: error.message });
    }
});

// Get bot statistics
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        const stats = await getRealtimeBotStats();
        res.json(stats);
    } catch (error) {
        logger.error('Get bot stats error', error);
        res.status(500).json({ error: error.message });
    }
});

// Broadcast functions for real-time updates
function broadcastToGuild(guildId, event, data) {
    if (io) {
        io.to(`guild_${guildId}`).emit(event, data);
    }
}

function broadcastGlobally(event, data) {
    if (io) {
        io.emit(event, data);
    }
}

module.exports = {
    app,
    startServer,
    setClient,
    setupSocketIO,
    broadcastToGuild,
    broadcastGlobally
};
