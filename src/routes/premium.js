const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

const db = getDatabase();

const authenticateBotApi = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// GET /api/bot/premium/user/:userId
router.get('/user/:userId', authenticateBotApi, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get from database
        const premiumData = db.data.userPremium?.get(userId);
        
        if (!premiumData) {
            return res.json({
                success: true,
                premium: {
                    plan: 'free',
                    features: [],
                    expiresAt: null,
                    autoRenew: false,
                    guilds: []
                }
            });
        }

        res.json({
            success: true,
            premium: premiumData
        });
    } catch (error) {
        logger.error('[Premium] Error fetching user premium:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/bot/premium/guild/:guildId
router.get('/guild/:guildId', authenticateBotApi, async (req, res) => {
    try {
        const { guildId } = req.params;
        
        // Get from database
        const premiumData = db.data.guildPremium?.get(guildId);
        
        if (!premiumData) {
            return res.json({
                success: true,
                premium: {
                    plan: 'free',
                    features: [],
                    startDate: null,
                    expiresAt: null,
                    autoRenew: false,
                    paymentMethod: null
                }
            });
        }

        res.json({
            success: true,
            premium: premiumData
        });
    } catch (error) {
        logger.error('[Premium] Error fetching guild premium:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/bot/premium/guild/:guildId/upgrade
router.post('/guild/:guildId/upgrade', authenticateBotApi, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { plan, duration, paymentMethod } = req.body;

        if (!plan || !['pro', 'enterprise'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        const startDate = new Date();
        const expiresAt = new Date();
        
        if (duration === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (duration === 'yearly') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        const premiumData = {
            plan,
            features: getPlanFeatures(plan),
            startDate: startDate.toISOString(),
            expiresAt: expiresAt.toISOString(),
            autoRenew: false,
            paymentMethod: paymentMethod || 'manual'
        };

        if (!db.data.guildPremium) {
            db.data.guildPremium = new Map();
        }
        
        db.data.guildPremium.set(guildId, premiumData);
        db.saveData();

        logger.info(`[Premium] Guild ${guildId} upgraded to ${plan}`);

        res.json({
            success: true,
            premium: premiumData
        });
    } catch (error) {
        logger.error('[Premium] Error upgrading guild:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/bot/premium/user/:userId/upgrade
router.post('/user/:userId/upgrade', authenticateBotApi, async (req, res) => {
    try {
        const { userId } = req.params;
        const { plan, duration, guilds } = req.body;

        if (!plan || !['pro', 'enterprise'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }

        const startDate = new Date();
        const expiresAt = new Date();
        
        if (duration === 'monthly') {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (duration === 'yearly') {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        const premiumData = {
            plan,
            guilds: guilds || [],
            startDate: startDate.toISOString(),
            expiresAt: expiresAt.toISOString(),
            autoRenew: false
        };

        if (!db.data.userPremium) {
            db.data.userPremium = new Map();
        }
        
        db.data.userPremium.set(userId, premiumData);
        db.saveData();

        logger.info(`[Premium] User ${userId} upgraded to ${plan}`);

        res.json({
            success: true,
            premium: premiumData
        });
    } catch (error) {
        logger.error('[Premium] Error upgrading user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to get plan features
function getPlanFeatures(plan) {
    const features = {
        free: [
            'basic_moderation',
            'welcome_messages',
            'economy_system',
            'leveling_system'
        ],
        pro: [
            'basic_moderation',
            'welcome_messages',
            'economy_system',
            'leveling_system',
            'advanced_moderation',
            'reaction_roles',
            'unlimited_commands',
            'advanced_automod',
            'premium_support',
            '2x_neurocoin'
        ],
        enterprise: [
            'basic_moderation',
            'welcome_messages',
            'economy_system',
            'leveling_system',
            'advanced_moderation',
            'reaction_roles',
            'unlimited_commands',
            'advanced_automod',
            'premium_support',
            '5x_neurocoin',
            'priority_response',
            'custom_branding',
            'dedicated_support',
            'advanced_security',
            'custom_integrations'
        ]
    };

    return features[plan] || features.free;
}

// Middleware to check if guild has premium
function checkGuildPremium(guildId, requiredPlan = 'pro') {
    const premiumData = db.data.guildPremium?.get(guildId);
    
    if (!premiumData) return false;
    
    // Check if expired
    if (premiumData.expiresAt && new Date(premiumData.expiresAt) < new Date()) {
        return false;
    }
    
    // Check plan level
    const planLevels = { free: 0, pro: 1, enterprise: 2 };
    return planLevels[premiumData.plan] >= planLevels[requiredPlan];
}

module.exports = { router, checkGuildPremium };

