// ==========================================
// 🤖 NeuroViaBot - ActivityFeed MongoDB Model
// ==========================================
// Stores all NRC economy activities for live feed

const mongoose = require('mongoose');

const activityFeedSchema = new mongoose.Schema({
    // Activity identification
    activityId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Activity type
    type: {
        type: String,
        required: true,
        enum: [
            'daily', 'work', 'trade', 'marketplace_sale', 'marketplace_purchase',
            'casino_win', 'casino_loss', 'transfer', 'tip', 'quest_complete',
            'achievement', 'level_up', 'investment', 'staking', 'loan',
            'earn', 'spend', 'reward', 'penalty', 'nft_purchase', 'nft_sale'
        ],
        index: true
    },

    // User info
    userId: {
        type: String,
        required: true,
        index: true
    },
    username: {
        type: String,
        default: 'Unknown'
    },
    avatar: {
        type: String,
        default: null
    },

    // Server info (optional - some activities are global)
    serverId: {
        type: String,
        default: null,
        index: true
    },
    serverName: {
        type: String,
        default: null
    },
    serverIcon: {
        type: String,
        default: null
    },

    // Activity details
    amount: {
        type: Number,
        default: 0
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Visibility
    visibility: {
        type: String,
        enum: ['public', 'private', 'server'],
        default: 'public'
    },

    // Timestamps
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true,
    collection: 'activity_feed'
});

// Compound indexes for efficient queries
activityFeedSchema.index({ userId: 1, timestamp: -1 });
activityFeedSchema.index({ serverId: 1, timestamp: -1 });
activityFeedSchema.index({ type: 1, timestamp: -1 });
activityFeedSchema.index({ timestamp: -1 }); // For live feed sorting

// TTL index - auto-delete activities older than 30 days
activityFeedSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static methods
activityFeedSchema.statics.addActivity = async function (activityData) {
    const activity = new this({
        activityId: activityData.activityId || `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: activityData.type,
        userId: activityData.userId,
        username: activityData.username || 'Unknown',
        avatar: activityData.avatar || null,
        serverId: activityData.serverId || null,
        serverName: activityData.serverName || null,
        serverIcon: activityData.serverIcon || null,
        amount: activityData.amount || 0,
        details: activityData.details || {},
        visibility: activityData.visibility || 'public',
        timestamp: activityData.timestamp || new Date()
    });

    return await activity.save();
};

activityFeedSchema.statics.getLiveFeed = async function (options = {}) {
    const { limit = 50, type = null, serverId = null, userId = null } = options;

    const query = {};
    if (type && type !== 'all') query.type = type;
    if (serverId) query.serverId = serverId;
    if (userId) query.userId = userId;

    return await this.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
};

activityFeedSchema.statics.getStats = async function () {
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [total, last24h, last7d, typeBreakdown, volume24h] = await Promise.all([
        this.countDocuments(),
        this.countDocuments({ timestamp: { $gt: dayAgo } }),
        this.countDocuments({ timestamp: { $gt: weekAgo } }),
        this.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]),
        this.aggregate([
            { $match: { timestamp: { $gt: dayAgo } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
    ]);

    return {
        totalActivities: total,
        last24h,
        last7d,
        typeBreakdown: typeBreakdown.reduce((acc, t) => {
            acc[t._id] = t.count;
            return acc;
        }, {}),
        volume24h: volume24h[0]?.total || 0
    };
};

const ActivityFeed = mongoose.model('ActivityFeed', activityFeedSchema);

module.exports = ActivityFeed;
