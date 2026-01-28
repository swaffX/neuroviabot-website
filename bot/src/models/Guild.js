// ==========================================
// 🏰 NeuroViaBot - Guild Model (MongoDB)
// ==========================================

const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    prefix: { type: String, default: '!' },
    premium: { type: Boolean, default: false },
    premiumUntil: { type: Date },
    language: { type: String, default: 'tr' },
    timezone: { type: String, default: 'Europe/Istanbul' },

    // Channel Settings
    welcomeChannelId: { type: String },
    leaveChannelId: { type: String },
    logChannelId: { type: String },
    modLogChannelId: { type: String },
    ticketCategoryId: { type: String },
    ticketLogChannelId: { type: String },
    verificationChannelId: { type: String },
    rulesChannelId: { type: String },

    // Role Settings
    muteRoleId: { type: String },
    memberRoleId: { type: String },
    botRoleId: { type: String },
    ticketSupportRoleId: { type: String },
    moderatorRoleId: { type: String },
    adminRoleId: { type: String },

    // Systems Status
    welcomeEnabled: { type: Boolean, default: false },
    leaveEnabled: { type: Boolean, default: false },
    autoRoleEnabled: { type: Boolean, default: false },
    ticketEnabled: { type: Boolean, default: false },
    moderationEnabled: { type: Boolean, default: true },
    economyEnabled: { type: Boolean, default: false },
    levelingEnabled: { type: Boolean, default: false },
    verificationEnabled: { type: Boolean, default: false },

    // Stats
    memberCount: { type: Number, default: 0 },
    ownerId: { type: String },
    joinedAt: { type: Date, default: Date.now },

    // Logging Options
    messageLogsEnabled: { type: Boolean, default: true },
    voiceLogsEnabled: { type: Boolean, default: true },
    memberLogsEnabled: { type: Boolean, default: true },
    roleLogsEnabled: { type: Boolean, default: true },
    channelLogsEnabled: { type: Boolean, default: true }

}, { timestamps: true });

module.exports = mongoose.models.Guild || mongoose.model('Guild', GuildSchema);
