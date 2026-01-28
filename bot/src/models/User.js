// ==========================================
// 👤 NeuroViaBot - User Model (MongoDB)
// ==========================================

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    odasi: { type: String, required: true, unique: true, index: true }, // Discord User ID
    username: { type: String, required: true },
    discriminator: { type: String },
    globalName: { type: String },
    avatar: { type: String },

    // Global Settings
    premium: { type: Boolean, default: false },
    premiumUntil: { type: Date },
    language: { type: String, default: 'tr' },
    blacklisted: { type: Boolean, default: false },
    blacklistReason: { type: String },

    // Global Economy (Legacy/Sync)
    globalBalance: { type: Number, default: 0 },
    globalBank: { type: Number, default: 0 },
    globalLastDaily: { type: Date },
    globalLastWork: { type: Date },
    globalInventory: { type: Array, default: [] },

    // Global Statistics
    totalCommands: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalVoiceTime: { type: Number, default: 0 }, // ms
    totalMusicTime: { type: Number, default: 0 }, // ms

    // Global Achievements
    achievements: { type: Array, default: [] },

    // API Access
    apiKey: { type: String, unique: true, sparse: true },
    dashboardAccess: { type: Boolean, default: false },

    // Activity
    lastSeen: { type: Date, default: Date.now },
    lastGuild: { type: String },

    // Metadata
    badges: { type: Array, default: [] },
    rewards: { type: Array, default: [] }

}, { timestamps: true });

// Leaderboard and utility indexes
UserSchema.index({ premium: 1 });
UserSchema.index({ globalBalance: -1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
