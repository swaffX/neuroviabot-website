// ==========================================
// 🤖 NeuroViaBot - Investment MongoDB Model
// ==========================================
// Stores NRC investment/staking data

const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
    // Investment identification
    investmentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // User info
    userId: {
        type: String,
        required: true,
        index: true
    },

    // Investment details
    type: {
        type: String,
        enum: ['savings', 'staking', 'lending', 'liquidity'],
        default: 'savings',
        index: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    // APY and returns
    apy: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },

    expectedReturn: {
        type: Number,
        default: 0
    },

    earnedInterest: {
        type: Number,
        default: 0
    },

    // Duration
    duration: {
        type: Number, // in days
        required: true
    },

    startDate: {
        type: Date,
        default: Date.now
    },

    endDate: {
        type: Date,
        required: true,
        index: true
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'completed', 'withdrawn_early', 'cancelled'],
        default: 'active',
        index: true
    },

    withdrawnAt: {
        type: Date,
        default: null
    },

    // Penalty for early withdrawal
    earlyWithdrawalPenalty: {
        type: Number,
        default: 0.25 // 25% penalty
    }
}, {
    timestamps: true,
    collection: 'investments'
});

// Compound indexes
investmentSchema.index({ userId: 1, status: 1 });
investmentSchema.index({ endDate: 1, status: 1 });

// Virtual: isMatured
investmentSchema.virtual('isMatured').get(function () {
    return new Date() >= this.endDate;
});

// Virtual: daysRemaining
investmentSchema.virtual('daysRemaining').get(function () {
    const now = new Date();
    const diff = this.endDate - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Static methods
investmentSchema.statics.createInvestment = async function (data) {
    const investmentId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + data.duration * 24 * 60 * 60 * 1000);
    const expectedReturn = data.amount * (1 + data.apy / 100);

    const investment = new this({
        investmentId,
        userId: data.userId,
        type: data.type || 'savings',
        amount: data.amount,
        apy: data.apy,
        expectedReturn,
        duration: data.duration,
        startDate,
        endDate,
        status: 'active'
    });

    return await investment.save();
};

investmentSchema.statics.getUserInvestments = async function (userId, status = null) {
    const query = { userId };
    if (status) query.status = status;

    return await this.find(query).sort({ createdAt: -1 }).lean();
};

investmentSchema.statics.getMaturedInvestments = async function () {
    return await this.find({
        status: 'active',
        endDate: { $lte: new Date() }
    }).lean();
};

investmentSchema.statics.withdrawInvestment = async function (investmentId, forceEarly = false) {
    const investment = await this.findOne({ investmentId });
    if (!investment) return null;

    const now = new Date();
    const isMatured = now >= investment.endDate;

    let totalReturn = investment.amount;
    let penalty = 0;
    let interest = 0;

    if (isMatured) {
        // Full interest earned
        interest = investment.expectedReturn - investment.amount;
        totalReturn = investment.expectedReturn;
    } else if (forceEarly) {
        // Early withdrawal with penalty
        penalty = Math.floor(investment.amount * investment.earlyWithdrawalPenalty);
        totalReturn = investment.amount - penalty;
    } else {
        return null; // Cannot withdraw yet
    }

    investment.status = isMatured ? 'completed' : 'withdrawn_early';
    investment.earnedInterest = interest;
    investment.withdrawnAt = now;
    await investment.save();

    return {
        investment,
        principal: investment.amount,
        interest,
        penalty,
        totalReturn
    };
};

investmentSchema.statics.getTotalStaked = async function (userId = null) {
    const match = { status: 'active' };
    if (userId) match.userId = userId;

    const result = await this.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return result[0]?.total || 0;
};

const Investment = mongoose.model('Investment', investmentSchema);

module.exports = Investment;
