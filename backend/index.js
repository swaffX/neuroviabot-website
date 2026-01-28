require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const http = require('http');
const { Server } = require('socket.io');
const { getDatabase } = require('./database/simple-db');
const { getErrorDetector } = require('./utils/errorDetector');
const { getAutoFixer } = require('./utils/autoFixer');
const { connectDB, isMongoConnected, getConnectionStats } = require('./config/database');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Get shared database instance (synced with main bot)
const db = getDatabase();
console.log('[Backend] Database loaded, shared with main bot');
console.log('[Backend] Database path:', db.dbPath);
console.log('[Backend] Guilds in database:', Array.from(db.data.guilds.keys()));

// Make database available to routes
app.set('db', db);

// Initialize Error Detection & Auto-Fixer
const errorDetector = getErrorDetector();
const autoFixer = getAutoFixer();
console.log('[Backend] Error Detection & Auto-Fixer initialized');

// Socket.IO setup
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || 'https://neuroviabot.xyz']
  : ['http://localhost:3001', 'http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  },
});

// Make io available to routes (after initialization)
app.set('io', io);

// Initialize socket module
const { initIO } = require('./socket');
initIO(io);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());
// Ensure SESSION_SECRET is set (or use fallback for development)
if (!process.env.SESSION_SECRET) {
  console.warn('[Backend] WARNING: SESSION_SECRET not set, using default (not secure for production)');
  process.env.SESSION_SECRET = 'UXxunZzBQNpkRIAlCgDGPIdcbSZNemlk';
}

app.use(session({
  store: new FileStore({
    path: './sessions',
    ttl: 7 * 24 * 60 * 60, // 7 days in seconds
    retries: 2,
    secret: process.env.SESSION_SECRET,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  proxy: process.env.NODE_ENV === 'production', // Trust nginx proxy
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    // Don't set domain - let browser handle it automatically
  },
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID || '773539215098249246',
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL || 'https://neuroviabot.xyz/api/auth/callback',
    scope: ['identify', 'email', 'guilds'],
  },
  (accessToken, refreshToken, profile, done) => {
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    return done(null, profile);
  }
));

// Routes
const authRoutes = require('./routes/auth');
const botRoutes = require('./routes/bot');
const botCommandsRoutes = require('./routes/bot-commands');
const guildRoutes = require('./routes/guilds');
const contactRoutes = require('./routes/contact');
const feedbackRoutes = require('./routes/feedback');
const guildManagementRoutes = require('./routes/guild-management');
const marketplaceRoutes = require('./routes/marketplace');
const neuroCoinRoutes = require('./routes/neurocoin');
const questsRoutes = require('./routes/quests');
const levelingRoutes = require('./routes/leveling');
const premiumRoutes = require('./routes/premium');
const reactionRolesRoutes = require('./routes/reaction-roles');
const auditLogRoutes = require('./routes/audit-log');
const analyticsRoutes = require('./routes/analytics');
const developerRoutes = require('./routes/developer');
const cmsRoutes = require('./routes/cms');
const nrcCoinRoutes = require('./routes/nrc-coin');
const nrcAdminRoutes = require('./routes/nrc-admin');
const nrcTradingRoutes = require('./routes/nrc-trading');
const { router: nrcApiRoutes, initDB: initNrcDB } = require('./routes/nrc');
const marketplaceRequestsRoutes = require('./routes/marketplace-requests');
const developerMarketplaceRoutes = require('./routes/developer-marketplace');
const serverStatsRoutes = require('./routes/server-stats');

// Set up Audit Logger with Socket.IO
const { getAuditLogger } = require('../src/utils/auditLogger');
const auditLogger = getAuditLogger();
auditLogger.setIO(io);
console.log('[Backend] Audit Logger configured with Socket.IO');

// Set up Developer Events with Socket.IO
const { initDeveloperEvents } = require('./socket/developerEvents');
initDeveloperEvents(io);
console.log('[Backend] Developer Events configured with Socket.IO');

// Set up NRC Events with Socket.IO
const { initNrcEvents } = require('./socket/nrcEvents');
initNrcEvents(io);
console.log('[Backend] NRC Events configured with Socket.IO');

// Set up Marketplace Events with Socket.IO
const { initMarketplaceEvents } = require('./socket/marketplaceEvents');
initMarketplaceEvents(io);
console.log('[Backend] Marketplace Events configured with Socket.IO');

app.use('/api/auth', authRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/bot-commands', botCommandsRoutes);
app.use('/api/guilds', guildRoutes);
app.use('/api/guild-settings', require('./routes/guild-settings'));
app.use('/api/notifications', require('./routes/guild-settings'));
app.use('/api/guild-management', guildManagementRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/marketplace', marketplaceRequestsRoutes);
app.use('/api/neurocoin', neuroCoinRoutes);
app.use('/api/quests', questsRoutes);
app.use('/api/leveling', levelingRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/reaction-roles', reactionRolesRoutes);
app.use('/api/audit', auditLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/moderation', require('./routes/moderation'));
app.use('/api/dev', developerRoutes);
app.use('/api/dev', developerMarketplaceRoutes);
app.use('/api/nrc', nrcCoinRoutes);
app.use('/api/nrc', nrcAdminRoutes); // Admin routes (requires developer auth)
app.use('/api/nrc', nrcTradingRoutes); // Trading routes

// Initialize NRC API routes with database
initNrcDB(db);
app.use('/api/nrc', nrcApiRoutes); // New NRC expansion routes

// Bot API proxy routes
app.use('/api/bot', require('./routes/bot-proxy'));
app.use('/api/contact', contactRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/server-stats', serverStatsRoutes);

// Health check route
const healthRoutes = require('./routes/health');
app.use('/api/health', healthRoutes);

// Database status endpoint
app.use('/api/database', require('./routes/database'));

// Diagnostic routes (for debugging auth issues)
const diagnosticRoutes = require('./routes/diagnostic');
app.use('/api/diagnostic', diagnosticRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  console.log(`[Socket.IO] Total connected clients: ${io.engine.clientsCount}`);

  // Join guild room with ACK
  socket.on('join_guild', (guildId, ack) => {
    try {
      if (!guildId || guildId === 'unknown') {
        console.warn(`[Socket.IO] Invalid guildId received from client ${socket.id}:`, guildId);
        if (typeof ack === 'function') {
          ack({ success: false, error: 'Invalid guild ID' });
        }
        return;
      }
      
      socket.join(`guild_${guildId}`);
      console.log(`[Socket.IO] ✅ Client ${socket.id} joined guild ${guildId}`);
      
      // Send acknowledgment
      if (typeof ack === 'function') {
        ack({ success: true, guildId });
      }
    } catch (error) {
      console.error(`[Socket.IO] Error joining guild room:`, error);
      if (typeof ack === 'function') {
        ack({ success: false, error: error.message });
      }
    }
  });

  // Leave guild room
  socket.on('leave_guild', (guildId) => {
    try {
      if (!guildId || guildId === 'unknown') {
        return;
      }
      
      socket.leave(`guild_${guildId}`);
      console.log(`[Socket.IO] Client ${socket.id} left guild ${guildId}`);
    } catch (error) {
      console.error(`[Socket.IO] Error leaving guild room:`, error);
    }
  });

  // Settings update from dashboard
  socket.on('settings_update', (data) => {
    const { guildId, settings } = data;
    console.log(`[Socket.IO] Settings update for guild ${guildId}:`, settings);
    
    // Broadcast to all clients in this guild room (including bot)
    io.to(`guild_${guildId}`).emit('settings_changed', {
      guildId,
      settings,
      timestamp: new Date().toISOString(),
    });
  });

  // Web command execution - HTTP API üzerinden
  socket.on('executeCommand', (data) => {
    const { command, guildId, userId, subcommand, params } = data;
    console.log(`[Socket.IO] Web command execution: ${command}${subcommand ? ` ${subcommand}` : ''} for guild ${guildId}`);
    
    // HTTP API üzerinden komut çalıştırma
    // Bu işlem artık doğrudan HTTP endpoint'leri üzerinden yapılacak
  });

  // Broadcast to guild room (from bot)
  socket.on('broadcast_to_guild', (data) => {
    const { guildId, event, data: eventData } = data;
    console.log(`[Socket.IO] Broadcasting to guild ${guildId}: ${event}`);
    console.log(`[Socket.IO] Event data:`, JSON.stringify(eventData, null, 2));
    
    io.to(`guild_${guildId}`).emit(event, eventData);
    console.log(`[Socket.IO] Event broadcasted to guild room guild_${guildId}`);
  });

  // Broadcast globally (from bot)
  socket.on('broadcast_global', (data) => {
    const { event, data: eventData } = data;
    console.log(`[Socket.IO] Broadcasting globally: ${event}`);
    console.log(`[Socket.IO] Global event data:`, JSON.stringify(eventData, null, 2));
    
    io.emit(event, eventData);
    console.log(`[Socket.IO] Global event broadcasted to all clients`);
  });
  
  // Audit log entry from bot
  socket.on('bot_audit_log_entry', (data) => {
    const { guildId, entry } = data;
    console.log(`[Socket.IO] 📋 Audit log entry received for guild ${guildId}:`, entry.action);
    
    // Broadcast to frontend clients in guild room
    io.to(`guild_${guildId}`).emit('audit_log_entry', entry);
    console.log(`[Socket.IO] 📋 Audit log broadcasted to guild_${guildId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

server.listen(PORT, async () => {
  console.log(`[Backend] Server running on http://localhost:${PORT}`);
  console.log(`[Backend] Socket.IO enabled`);
  console.log(`[Backend] Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Connect to MongoDB Atlas
  await connectDB();
  
  // Log MongoDB connection status
  if (isMongoConnected()) {
    const stats = getConnectionStats();
    console.log(`[Backend] MongoDB Atlas connected: ${stats.name}`);
    console.log(`[Backend] Database has ${stats.collections} collections`);
  } else {
    console.log('[Backend] Running with simple-db (JSON database)');
  }
});