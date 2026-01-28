// ==========================================
// 🤖 NeuroViaBot - Quest MongoDB Model
// ==========================================
// Stores quest templates and user progress

const mongoose = require('mongoose');

// Quest Template Schema
const questTemplateSchema = new mongoose.Schema({
    questId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ''
    },

    type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'special', 'achievement'],
        default: 'daily',
        index: true
    },

    category: {
        type: String,
        enum: ['messages', 'voice', 'economy', 'social', 'games', 'moderation'],
        default: 'messages'
    },

    objectives: [{
        type: {
            type: String,
            required: true
        },
        target: {
            type: Number,
            required: true
        },
        description: String
    }],

    reward: {
        nrc: { type: Number, default: 0 },
        xp: { type: Number, default: 0 },
        items: [{ type: String }],
        badge: { type: String, default: null }
    },

    requirements: {
        minLevel: { type: Number, default: 0 },
        premiumOnly: { type: Boolean, default: false }
    },

    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    resetInterval: {
        type: Number, // hours (24 for daily, 168 for weekly)
        default: 24
    }
}, {
    timestamps: true,
    collection: 'quest_templates'
});

// User Quest Progress Schema
const questProgressSchema = new mongoose.Schema({
    // User info
    userId: {
        type: String,
        required: true,
        index: true
    },

    // Quest reference
    questId: {
        type: String,
        required: true,
        index: true
    },

    // Progress tracking
    progress: [{
        objectiveIndex: Number,
        current: { type: Number, default: 0 },
        target: Number,
        completed: { type: Boolean, default: false }
    }],

    // Status
    status: {
        type: String,
        enum: ['active', 'completed', 'claimed', 'expired'],
        default: 'active',
        index: true
    },

    // Dates
    startedAt: {
        type: Date,
        default: Date.now
    },

    completedAt: {
        type: Date,
        default: null
    },

    claimedAt: {
        type: Date,
        default: null
    },

    expiresAt: {
        type: Date,
        index: true
    },

    // Streak tracking
    dailyStreak: {
        type: Number,
        default: 0
    },

    lastDailyReset: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: 'quest_progress'
});

// Compound indexes
questProgressSchema.index({ userId: 1, questId: 1 }, { unique: true });
questProgressSchema.index({ userId: 1, status: 1 });

// Virtual: isComplete
questProgressSchema.virtual('isComplete').get(function () {
    return this.progress.every(p => p.completed);
});

// Static methods for QuestTemplate
questTemplateSchema.statics.getActiveQuests = async function (type = null) {
    const query = { isActive: true };
    if (type) query.type = type;
    return await this.find(query).lean();
};

questTemplateSchema.statics.getDailyQuests = async function () {
    return await this.find({ isActive: true, type: 'daily' }).lean();
};

questTemplateSchema.statics.getWeeklyQuests = async function () {
    return await this.find({ isActive: true, type: 'weekly' }).lean();
};

// Static methods for QuestProgress
questProgressSchema.statics.getUserProgress = async function (userId) {
    return await this.find({
        userId,
        status: { $in: ['active', 'completed'] }
    }).lean();
};

questProgressSchema.statics.getOrCreateProgress = async function (userId, questId, questTemplate) {
    let progress = await this.findOne({ userId, questId });

    if (!progress) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + (questTemplate.resetInterval || 24));

        progress = new this({
            userId,
            questId,
            progress: questTemplate.objectives.map((obj, index) => ({
                objectiveIndex: index,
                current: 0,
                target: obj.target,
                completed: false
            })),
            status: 'active',
            expiresAt
        });
        await progress.save();
    }

    return progress;
};

questProgressSchema.statics.updateProgress = async function (userId, questId, objectiveIndex, amount = 1) {
    const progress = await this.findOne({ userId, questId, status: 'active' });
    if (!progress) return null;

    const objective = progress.progress.find(p => p.objectiveIndex === objectiveIndex);
    if (!objective || objective.completed) return progress;

    objective.current = Math.min(objective.current + amount, objective.target);
    objective.completed = objective.current >= objective.target;

    // Check if all objectives are complete
    if (progress.progress.every(p => p.completed)) {
        progress.status = 'completed';
        progress.completedAt = new Date();
    }

    await progress.save();
    return progress;
};

questProgressSchema.statics.claimReward = async function (userId, questId) {
    const progress = await this.findOne({ userId, questId, status: 'completed' });
    if (!progress) return null;

    progress.status = 'claimed';
    progress.claimedAt = new Date();
    await progress.save();

    return progress;
};

questProgressSchema.statics.resetExpiredQuests = async function () {
    const now = new Date();
    return await this.updateMany(
        { status: 'active', expiresAt: { $lt: now } },
        { $set: { status: 'expired' } }
    );
};

const QuestTemplate = mongoose.model('QuestTemplate', questTemplateSchema);
const QuestProgress = mongoose.model('QuestProgress', questProgressSchema);

module.exports = { QuestTemplate, QuestProgress };
