// ==========================================
// 💰 Economy Bot API
// ==========================================

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

// API Key validation middleware
function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.BOT_API_KEY || 'your-secret-api-key';
    
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({
            success: false,
            error: 'Invalid API key'
        });
    }
    
    next();
}

router.use(validateApiKey);

// ==========================================
// GET /api/bot/economy/stats/:guildId
// Get economy statistics for a guild
// ==========================================
router.get('/stats/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const db = getDatabase();

        // Calculate total circulation
        let totalCirculation = 0;
        const userBalances = [];

        for (const [userId, balance] of db.data.neuroCoinBalances) {
            totalCirculation += balance.total;
            userBalances.push({
                userId,
                balance: balance.total
            });
        }

        // Sort by balance for richest users
        userBalances.sort((a, b) => b.balance - a.balance);

        // Get top traders
        const tradeCounts = new Map();
        const transactions = Array.from(db.data.neuroCoinTransactions.values());
        
        for (const tx of transactions) {
            if (tx.type === 'trade_sent' || tx.type === 'trade_received') {
                const userId = tx.from === 'system' ? tx.to : tx.from;
                tradeCounts.set(userId, (tradeCounts.get(userId) || 0) + 1);
            }
        }

        const topTraders = Array.from(tradeCounts.entries())
            .map(([userId, count]) => ({ userId, tradeCount: count }))
            .sort((a, b) => b.tradeCount - a.tradeCount)
            .slice(0, 10);

        // Get treasury
        if (!db.data.guildTreasury) {
            db.data.guildTreasury = new Map();
        }
        
        const treasury = db.data.guildTreasury.get(guildId) || {
            balance: 0,
            totalEarned: 0,
            transactions: []
        };

        // Calculate transaction volume
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);
        const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);

        let dailyVolume = 0;
        let weeklyVolume = 0;
        let monthlyVolume = 0;

        for (const tx of transactions) {
            const txTime = new Date(tx.timestamp).getTime();
            if (txTime >= oneMonthAgo) {
                monthlyVolume += tx.amount;
                if (txTime >= oneWeekAgo) {
                    weeklyVolume += tx.amount;
                    if (txTime >= oneDayAgo) {
                        dailyVolume += tx.amount;
                    }
                }
            }
        }

        res.json({
            totalCirculation,
            richestUsers: userBalances.slice(0, 10).map(u => ({
                userId: u.userId,
                username: 'User', // Should fetch from Discord API
                balance: u.balance
            })),
            topTraders: topTraders.map(t => ({
                userId: t.userId,
                username: 'User', // Should fetch from Discord API
                tradeCount: t.tradeCount
            })),
            treasury,
            transactionVolume: {
                daily: dailyVolume,
                weekly: weeklyVolume,
                monthly: monthlyVolume
            }
        });
    } catch (error) {
        logger.error('Economy stats error', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch economy stats'
        });
    }
});

// ==========================================
// GET /api/bot/economy/config/:guildId
// Get economy configuration for a guild
// ==========================================
router.get('/config/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const db = getDatabase();
        
        const settings = db.getGuildSettings(guildId);
        const economyConfig = settings.economy || {};
        const marketConfig = db.getServerMarketConfig(guildId);

        res.json({
            messageReward: economyConfig.messageReward || 5,
            voiceReward: economyConfig.voiceReward || 10,
            reactionReward: economyConfig.reactionReward || 2,
            dailyCap: economyConfig.dailyCap || 1000,
            weeklyCap: economyConfig.weeklyCap || 5000,
            marketplaceTax: marketConfig.tax || 0,
            questRewardsEnabled: economyConfig.questRewardsEnabled !== false
        });
    } catch (error) {
        logger.error('Economy config get error', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch economy config'
        });
    }
});

// ==========================================
// POST /api/bot/economy/config/:guildId
// Update economy configuration for a guild
// ==========================================
router.post('/config/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { config } = req.body;
        
        if (!config) {
            return res.status(400).json({
                success: false,
                error: 'Missing config'
            });
        }

        const db = getDatabase();
        const settings = db.getGuildSettings(guildId);
        
        // Update economy settings
        settings.economy = {
            ...settings.economy,
            messageReward: config.messageReward,
            voiceReward: config.voiceReward,
            reactionReward: config.reactionReward,
            dailyCap: config.dailyCap,
            weeklyCap: config.weeklyCap,
            questRewardsEnabled: config.questRewardsEnabled
        };

        db.setGuildSettings(guildId, settings);

        // Update marketplace config
        db.updateServerMarketConfig(guildId, {
            tax: config.marketplaceTax
        });

        res.json({
            success: true,
            config
        });
    } catch (error) {
        logger.error('Economy config update error', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update economy config'
        });
    }
});

// ==========================================
// GET /api/bot/economy/leaderboard/:guildId
// Get NRC leaderboard for a guild
// ==========================================
router.get('/leaderboard/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { type = 'total', limit = 10 } = req.query;
        
        const db = getDatabase();
        const balances = [];

        for (const [userId, balance] of db.data.neuroCoinBalances) {
            balances.push({
                userId,
                wallet: balance.wallet,
                bank: balance.bank,
                total: balance.total
            });
        }

        // Sort by type
        balances.sort((a, b) => b[type] - a[type]);

        res.json({
            success: true,
            leaderboard: balances.slice(0, parseInt(limit))
        });
    } catch (error) {
        logger.error('Economy leaderboard error', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard'
        });
    }
});

// ==========================================
// POST /api/bot/economy/gift
// Gift NRC to a user (admin only)
// ==========================================
router.post('/gift', async (req, res) => {
    try {
        const { userId, amount, reason } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const db = getDatabase();
        db.updateNeuroCoinBalance(userId, amount, 'wallet');
        
        db.recordTransaction('system', userId, amount, 'admin_gift', {
            reason: reason || 'Admin gift'
        });

        db.saveData();

        const newBalance = db.getNeuroCoinBalance(userId);

        res.json({
            success: true,
            newBalance
        });
    } catch (error) {
        logger.error('Economy gift error', error);
        res.status(500).json({
            success: false,
            error: 'Failed to gift NRC'
        });
    }
});

// ==========================================
// POST /api/bot/economy/adjust
// Adjust user balance (admin only)
// ==========================================
router.post('/adjust', async (req, res) => {
    try {
        const { userId, amount, type, reason } = req.body;
        
        if (!userId || amount === undefined || !type) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        const db = getDatabase();
        db.updateNeuroCoinBalance(userId, amount, type);
        
        db.recordTransaction('system', userId, amount, 'admin_adjustment', {
            reason: reason || 'Admin adjustment',
            adjustmentType: type
        });

        db.saveData();

        const newBalance = db.getNeuroCoinBalance(userId);

        res.json({
            success: true,
            newBalance
        });
    } catch (error) {
        logger.error('Economy adjust error', error);
        res.status(500).json({
            success: false,
            error: 'Failed to adjust balance'
        });
    }
});

module.exports = router;

