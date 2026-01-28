// ==========================================
// 🤖 NeuroViaBot - MongoDB Service Layer
// ==========================================
// Replaces simple-db with MongoDB operations
// Provides same API interface for easy migration

const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

// Import MongoDB Models
const ActivityFeed = require('../models/ActivityFeed');
const Analytics = require('../models/Analytics');
const Investment = require('../models/Investment');
const { QuestTemplate, QuestProgress } = require('../models/Quest');

// Import existing Mongoose models
const User = require('../models/User');
const Guild = require('../models/Guild');
const GuildMember = require('../models/GuildMember');
const GuildSettings = require('../models/GuildSettings');
const NRCUser = require('../models/NRCUser');
const Warning = require('../models/Warning');
const Ticket = require('../models/Ticket');
const Giveaway = require('../models/Giveaway');
const CustomCommand = require('../models/CustomCommand');
const ModerationCase = require('../models/ModerationCase');

// Connection state
let isConnected = false;

/**
 * Initialize MongoDB connection
 */
async function connect() {
    if (isConnected) return true;

    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        logger.error('[MongoService] MONGODB_URI not set in environment');
        throw new Error('MongoDB URI is required');
    }

    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        logger.success('[MongoService] Connected to MongoDB Atlas');

        // Setup connection event handlers
        mongoose.connection.on('error', (err) => {
            logger.error('[MongoService] Connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('[MongoService] Disconnected');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            logger.success('[MongoService] Reconnected');
            isConnected = true;
        });

        return true;
    } catch (error) {
        logger.error('[MongoService] Connection failed:', error.message);
        throw error;
    }
}

/**
 * Check connection status
 */
function isReady() {
    return isConnected && mongoose.connection.readyState === 1;
}

// ==========================================
// User Operations
// ==========================================

async function getUser(userId) {
    if (!isReady()) return null;
    return await User.findOne({ odasi: userId }).lean();
}

async function createUser(userId, userData = {}) {
    if (!isReady()) return null;
    const user = new User({
        odasi: userId,
        username: userData.username || 'Unknown',
        ...userData
    });
    return await user.save();
}

async function getOrCreateUser(userId, userData = {}) {
    let user = await getUser(userId);
    if (!user) {
        user = await createUser(userId, userData);
    }
    return user;
}

async function updateUser(userId, updates) {
    if (!isReady()) return null;
    return await User.findOneAndUpdate(
        { odasi: userId },
        { $set: updates },
        { new: true, upsert: true }
    ).lean();
}

// ==========================================
// Guild Operations
// ==========================================

async function getGuild(guildId) {
    if (!isReady()) return null;
    return await Guild.findOne({ guildId }).lean();
}

async function createGuild(guildId, guildData = {}) {
    if (!isReady()) return null;
    const guild = new Guild({
        guildId,
        name: guildData.name || 'Unknown Server',
        ...guildData
    });
    return await guild.save();
}

async function getOrCreateGuild(guildId, guildData = {}) {
    let guild = await getGuild(guildId);
    if (!guild) {
        guild = await createGuild(guildId, guildData);
    }
    return guild;
}

async function updateGuild(guildId, updates) {
    if (!isReady()) return null;
    return await Guild.findOneAndUpdate(
        { guildId },
        { $set: updates },
        { new: true, upsert: true }
    ).lean();
}

// ==========================================
// Guild Settings Operations
// ==========================================

async function getGuildSettings(guildId) {
    if (!isReady()) return {};
    const settings = await GuildSettings.findOne({ guildId }).lean();
    return settings || {};
}

async function updateGuildSettings(guildId, updates) {
    if (!isReady()) return null;
    return await GuildSettings.findOneAndUpdate(
        { guildId },
        { $set: updates, guildId },
        { new: true, upsert: true }
    ).lean();
}

// ==========================================
// NRC Coin Operations
// ==========================================

async function getNeuroCoinBalance(userId) {
    if (!isReady()) return 0;
    const user = await NRCUser.findOne({ odasi: userId }).lean();
    return user?.balance || 0;
}

async function getNeuroCoinUser(userId) {
    if (!isReady()) return null;
    return await NRCUser.findOne({ odasi: userId }).lean();
}

async function getOrCreateNRCUser(userId, userData = {}) {
    if (!isReady()) return null;

    let user = await NRCUser.findOne({ odasi: userId });
    if (!user) {
        user = new NRCUser({
            odasi: userId,
            username: userData.username || 'Unknown',
            balance: userData.balance || 0,
            bank: userData.bank || 0,
            totalEarned: 0,
            totalSpent: 0,
            lastDaily: null,
            lastWork: null,
            dailyStreak: 0
        });
        await user.save();
    }
    return user;
}

async function addNeuroCoin(userId, amount, reason = 'unknown', details = {}) {
    if (!isReady()) return null;

    const user = await getOrCreateNRCUser(userId);
    const newBalance = Math.max(0, (user.balance || 0) + amount);

    const updates = {
        balance: newBalance,
        $inc: {
            totalEarned: amount > 0 ? amount : 0,
            totalSpent: amount < 0 ? Math.abs(amount) : 0
        }
    };

    const updated = await NRCUser.findOneAndUpdate(
        { odasi: userId },
        updates,
        { new: true }
    );

    // Log activity
    await addActivity({
        type: amount > 0 ? 'earn' : 'spend',
        userId,
        username: user.username,
        amount: Math.abs(amount),
        details: { reason, ...details }
    });

    return updated;
}

async function removeNeuroCoin(userId, amount, reason = 'unknown', details = {}) {
    return await addNeuroCoin(userId, -Math.abs(amount), reason, details);
}

async function setNeuroCoinBalance(userId, amount) {
    if (!isReady()) return null;
    return await NRCUser.findOneAndUpdate(
        { odasi: userId },
        { $set: { balance: Math.max(0, amount) } },
        { new: true, upsert: true }
    );
}

async function getNRCLeaderboard(limit = 10) {
    if (!isReady()) return [];
    return await NRCUser.find({})
        .sort({ balance: -1 })
        .limit(limit)
        .lean();
}

// ==========================================
// Activity Feed Operations
// ==========================================

async function addActivity(activityData) {
    if (!isReady()) return null;
    return await ActivityFeed.addActivity(activityData);
}

async function getActivityFeed(options = {}) {
    if (!isReady()) return [];
    return await ActivityFeed.getLiveFeed(options);
}

async function getActivityStats() {
    if (!isReady()) return {};
    return await ActivityFeed.getStats();
}

// ==========================================
// Analytics Operations
// ==========================================

async function incrementMessage(guildId, channelId, userId) {
    if (!isReady()) return;
    await Analytics.incrementMessage(guildId, channelId, userId);
}

async function incrementVoice(guildId, channelId, userId, minutes) {
    if (!isReady()) return;
    await Analytics.incrementVoice(guildId, channelId, userId, minutes);
}

async function incrementCommand(guildId, commandName) {
    if (!isReady()) return;
    await Analytics.incrementCommand(guildId, commandName);
}

async function getGuildAnalytics(guildId, days = 7) {
    if (!isReady()) return [];
    return await Analytics.getGuildStats(guildId, days);
}

// ==========================================
// Investment Operations
// ==========================================

async function createInvestment(data) {
    if (!isReady()) return null;
    return await Investment.createInvestment(data);
}

async function getUserInvestments(userId, status = null) {
    if (!isReady()) return [];
    return await Investment.getUserInvestments(userId, status);
}

async function withdrawInvestment(investmentId, forceEarly = false) {
    if (!isReady()) return null;
    return await Investment.withdrawInvestment(investmentId, forceEarly);
}

// ==========================================
// Quest Operations
// ==========================================

async function getActiveQuests(type = null) {
    if (!isReady()) return [];
    return await QuestTemplate.getActiveQuests(type);
}

async function getUserQuestProgress(userId) {
    if (!isReady()) return [];
    return await QuestProgress.getUserProgress(userId);
}

async function updateQuestProgress(userId, questId, objectiveIndex, amount = 1) {
    if (!isReady()) return null;
    return await QuestProgress.updateProgress(userId, questId, objectiveIndex, amount);
}

async function claimQuestReward(userId, questId) {
    if (!isReady()) return null;
    return await QuestProgress.claimReward(userId, questId);
}

// ==========================================
// Warning Operations
// ==========================================

async function addWarning(userId, guildId, moderatorId, reason) {
    if (!isReady()) return null;
    const warning = new Warning({
        odasi: userId,
        guildId,
        moderatorId,
        reason,
        createdAt: new Date()
    });
    return await warning.save();
}

async function getUserWarnings(userId, guildId) {
    if (!isReady()) return [];
    return await Warning.find({ odasi: userId, guildId }).sort({ createdAt: -1 }).lean();
}

async function removeWarning(warningId) {
    if (!isReady()) return false;
    const result = await Warning.deleteOne({ _id: warningId });
    return result.deletedCount > 0;
}

// ==========================================
// Ticket Operations
// ==========================================

async function createTicket(ticketData) {
    if (!isReady()) return null;
    const ticket = new Ticket(ticketData);
    return await ticket.save();
}

async function getTicket(ticketId) {
    if (!isReady()) return null;
    return await Ticket.findById(ticketId).lean();
}

async function getTicketByChannel(channelId) {
    if (!isReady()) return null;
    return await Ticket.findOne({ channelId }).lean();
}

async function updateTicket(ticketId, updates) {
    if (!isReady()) return null;
    return await Ticket.findByIdAndUpdate(ticketId, updates, { new: true }).lean();
}

// ==========================================
// Giveaway Operations
// ==========================================

async function createGiveaway(giveawayData) {
    if (!isReady()) return null;
    const giveaway = new Giveaway(giveawayData);
    return await giveaway.save();
}

async function getGiveaway(giveawayId) {
    if (!isReady()) return null;
    return await Giveaway.findById(giveawayId).lean();
}

async function getGiveawayByMessage(messageId) {
    if (!isReady()) return null;
    return await Giveaway.findOne({ messageId }).lean();
}

async function getActiveGiveaways() {
    if (!isReady()) return [];
    return await Giveaway.find({
        status: 'active',
        endTime: { $gt: new Date() }
    }).lean();
}

async function updateGiveaway(giveawayId, updates) {
    if (!isReady()) return null;
    return await Giveaway.findByIdAndUpdate(giveawayId, updates, { new: true }).lean();
}

// ==========================================
// Custom Command Operations
// ==========================================

async function createCustomCommand(commandData) {
    if (!isReady()) return null;
    const command = new CustomCommand({
        ...commandData,
        name: commandData.name.toLowerCase()
    });
    return await command.save();
}

async function getCustomCommand(guildId, name) {
    if (!isReady()) return null;
    return await CustomCommand.findOne({ guildId, name: name.toLowerCase() }).lean();
}

async function getGuildCustomCommands(guildId) {
    if (!isReady()) return [];
    return await CustomCommand.find({ guildId }).lean();
}

async function deleteCustomCommand(guildId, name) {
    if (!isReady()) return false;
    const result = await CustomCommand.deleteOne({ guildId, name: name.toLowerCase() });
    return result.deletedCount > 0;
}

// ==========================================
// Stats & Utilities
// ==========================================

async function getStats() {
    if (!isReady()) return {};

    const [users, guilds, nrcUsers, activities, investments] = await Promise.all([
        User.countDocuments(),
        Guild.countDocuments(),
        NRCUser.countDocuments(),
        ActivityFeed.countDocuments(),
        Investment.countDocuments({ status: 'active' })
    ]);

    return {
        users,
        guilds,
        nrcUsers,
        activities,
        activeInvestments: investments
    };
}

// Backward compatibility - saveData does nothing in MongoDB (auto-persisted)
function saveData() {
    // No-op: MongoDB auto-persists
    return true;
}

// ==========================================
// Export Service
// ==========================================

module.exports = {
    // Connection
    connect,
    isReady,
    mongoose,

    // User operations
    getUser,
    createUser,
    getOrCreateUser,
    updateUser,

    // Guild operations
    getGuild,
    createGuild,
    getOrCreateGuild,
    updateGuild,

    // Guild settings
    getGuildSettings,
    updateGuildSettings,

    // NRC operations
    getNeuroCoinBalance,
    getNeuroCoinUser,
    getOrCreateNRCUser,
    addNeuroCoin,
    removeNeuroCoin,
    setNeuroCoinBalance,
    getNRCLeaderboard,

    // Activity feed
    addActivity,
    getActivityFeed,
    getActivityStats,

    // Analytics
    incrementMessage,
    incrementVoice,
    incrementCommand,
    getGuildAnalytics,

    // Investments
    createInvestment,
    getUserInvestments,
    withdrawInvestment,

    // Quests
    getActiveQuests,
    getUserQuestProgress,
    updateQuestProgress,
    claimQuestReward,

    // Warnings
    addWarning,
    getUserWarnings,
    removeWarning,

    // Tickets
    createTicket,
    getTicket,
    getTicketByChannel,
    updateTicket,

    // Giveaways
    createGiveaway,
    getGiveaway,
    getGiveawayByMessage,
    getActiveGiveaways,
    updateGiveaway,

    // Custom commands
    createCustomCommand,
    getCustomCommand,
    getGuildCustomCommands,
    deleteCustomCommand,

    // Stats & utilities
    getStats,
    saveData,

    // Models (for direct access if needed)
    models: {
        User,
        Guild,
        GuildMember,
        GuildSettings,
        NRCUser,
        Warning,
        Ticket,
        Giveaway,
        CustomCommand,
        ModerationCase,
        ActivityFeed,
        Analytics,
        Investment,
        QuestTemplate,
        QuestProgress
    }
};
