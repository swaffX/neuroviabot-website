// ==========================================
// 🪙 NeuroViaBot - NRC User Model (MongoDB)
// ==========================================
// User economy data for NeuroCoin system

const mongoose = require('mongoose');

const NRCUserSchema = new mongoose.Schema({
    // Discord Information
    odasi: { type: String, required: true },      // Discord User ID
    odaId: { type: String, required: true },      // Discord Guild ID
    username: { type: String },

    // Economy - NeuroCoin (NRC)
    balance: { type: Number, default: 0 },        // Cüzdan (wallet)
    bank: { type: Number, default: 0 },           // Banka
    lastDaily: { type: Date, default: null },
    lastWork: { type: Date, default: null },
    dailyStreak: { type: Number, default: 0 },

    // Inventory System
    inventory: [{
        itemId: { type: String, required: true },
        amount: { type: Number, default: 1 }
    }],
    activePet: { type: String, default: null },

    // Level System
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalVoiceMinutes: { type: Number, default: 0 },

    // Career System
    career: {
        job: { type: String, default: null },
        level: { type: Number, default: 1 },
        xp: { type: Number, default: 0 },
        lastWorkTime: { type: Date, default: null },
        totalEarnings: { type: Number, default: 0 }
    },

    // Quest System
    quests: [{
        questId: { type: String },
        progress: { type: Number, default: 0 },
        target: { type: Number },
        isCompleted: { type: Boolean, default: false },
        isClaimed: { type: Boolean, default: false }
    }],
    lastQuestReset: { type: Date, default: null },

    // Achievements
    achievements: [{
        id: { type: String },
        unlockedAt: { type: Date, default: Date.now }
    }],

    // Game Statistics
    stats: {
        totalBets: { type: Number, default: 0 },
        totalWins: { type: Number, default: 0 },
        totalLosses: { type: Number, default: 0 },
        biggestWin: { type: Number, default: 0 },
        totalEarned: { type: Number, default: 0 },
        totalWork: { type: Number, default: 0 },
        totalDuelsWon: { type: Number, default: 0 },
        gamesPlayed: { type: Number, default: 0 },
        winStreak: { type: Number, default: 0 },
        maxWinStreak: { type: Number, default: 0 }
    },

    // Profile Customization
    reputation: { type: Number, default: 0 },
    bio: { type: String, default: 'Hakkımda bir şey yazılmamış.' },
    profileColor: { type: String, default: '#8B5CF6' },
    badges: [{ type: String }],

    // Premium Status
    premium: {
        active: { type: Boolean, default: false },
        tier: { type: String, enum: ['bronze', 'silver', 'gold', null], default: null },
        expiresAt: { type: Date, default: null }
    },

    // Registration Info
    isRegistered: { type: Boolean, default: false },
    registeredAt: { type: Date, default: null },
    registeredBy: { type: String, default: null }

}, { timestamps: true });

// Compound index for fast queries
NRCUserSchema.index({ odasi: 1, odaId: 1 }, { unique: true });
// Leaderboard indexes
NRCUserSchema.index({ odaId: 1, balance: -1 });
NRCUserSchema.index({ odaId: 1, 'stats.totalWins': -1 });

// Static method: Find or create user
NRCUserSchema.statics.findOrCreate = async function (userId, guildId, username = null) {
    let user = await this.findOne({ odasi: userId, odaId: guildId });
    if (!user) {
        user = await this.create({
            odasi: userId,
            odaId: guildId,
            username: username
        });
    }
    return user;
};

// Get total balance (wallet + bank)
NRCUserSchema.virtual('totalBalance').get(function () {
    return this.balance + this.bank;
});

// Calculate level from XP
NRCUserSchema.methods.calculateLevel = function () {
    return Math.floor(0.1 * Math.sqrt(this.xp));
};

module.exports = mongoose.models.NRCUser || mongoose.model('NRCUser', NRCUserSchema);
