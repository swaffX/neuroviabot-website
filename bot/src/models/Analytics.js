// ==========================================
// 🤖 NeuroViaBot - Analytics MongoDB Model
// ==========================================
// Stores server analytics data

const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
    // Server identification
    guildId: {
        type: String,
        required: true,
        index: true
    },

    // Time period
    date: {
        type: Date,
        required: true,
        index: true
    },
    period: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly'],
        default: 'daily',
        index: true
    },

    // Message statistics
    messages: {
        total: { type: Number, default: 0 },
        byChannel: { type: Map, of: Number, default: new Map() },
        byUser: { type: Map, of: Number, default: new Map() }
    },

    // Voice statistics
    voice: {
        totalMinutes: { type: Number, default: 0 },
        byChannel: { type: Map, of: Number, default: new Map() },
        byUser: { type: Map, of: Number, default: new Map() },
        peakConcurrent: { type: Number, default: 0 }
    },

    // Member statistics
    members: {
        joined: { type: Number, default: 0 },
        left: { type: Number, default: 0 },
        totalAtEnd: { type: Number, default: 0 }
    },

    // Command usage
    commands: {
        total: { type: Number, default: 0 },
        byCommand: { type: Map, of: Number, default: new Map() }
    },

    // Economy statistics
    economy: {
        nrcEarned: { type: Number, default: 0 },
        nrcSpent: { type: Number, default: 0 },
        trades: { type: Number, default: 0 },
        marketplaceSales: { type: Number, default: 0 }
    },

    // Moderation statistics
    moderation: {
        warnings: { type: Number, default: 0 },
        kicks: { type: Number, default: 0 },
        bans: { type: Number, default: 0 },
        mutes: { type: Number, default: 0 },
        automodActions: { type: Number, default: 0 }
    },

    // Activity peaks
    peaks: {
        hourlyActivity: { type: Map, of: Number, default: new Map() },
        mostActiveHour: { type: Number, default: 0 },
        mostActiveDay: { type: Number, default: 0 }
    }
}, {
    timestamps: true,
    collection: 'analytics'
});

// Compound indexes
analyticsSchema.index({ guildId: 1, date: -1 });
analyticsSchema.index({ guildId: 1, period: 1, date: -1 });

// Static methods
analyticsSchema.statics.getOrCreate = async function (guildId, date, period = 'daily') {
    const startOfPeriod = new Date(date);
    if (period === 'daily') {
        startOfPeriod.setHours(0, 0, 0, 0);
    } else if (period === 'hourly') {
        startOfPeriod.setMinutes(0, 0, 0);
    }

    let analytics = await this.findOne({
        guildId,
        date: startOfPeriod,
        period
    });

    if (!analytics) {
        analytics = new this({
            guildId,
            date: startOfPeriod,
            period
        });
        await analytics.save();
    }

    return analytics;
};

analyticsSchema.statics.incrementMessage = async function (guildId, channelId, userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.findOneAndUpdate(
        { guildId, date: today, period: 'daily' },
        {
            $inc: {
                'messages.total': 1,
                [`messages.byChannel.${channelId}`]: 1,
                [`messages.byUser.${userId}`]: 1
            }
        },
        { upsert: true, new: true }
    );
};

analyticsSchema.statics.incrementVoice = async function (guildId, channelId, userId, minutes) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.findOneAndUpdate(
        { guildId, date: today, period: 'daily' },
        {
            $inc: {
                'voice.totalMinutes': minutes,
                [`voice.byChannel.${channelId}`]: minutes,
                [`voice.byUser.${userId}`]: minutes
            }
        },
        { upsert: true, new: true }
    );
};

analyticsSchema.statics.incrementCommand = async function (guildId, commandName) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.findOneAndUpdate(
        { guildId, date: today, period: 'daily' },
        {
            $inc: {
                'commands.total': 1,
                [`commands.byCommand.${commandName}`]: 1
            }
        },
        { upsert: true, new: true }
    );
};

analyticsSchema.statics.getGuildStats = async function (guildId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return await this.find({
        guildId,
        date: { $gte: startDate },
        period: 'daily'
    }).sort({ date: -1 }).lean();
};

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
