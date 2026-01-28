// ==========================================
// 💰 NRC Coin Admin API (Developer Only)
// ==========================================
// Developer-only NRC coin management endpoints

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { requireDeveloper } = require('../middleware/developerAuth');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// Apply developer authentication to all routes
router.use(requireDeveloper);

// ==========================================
// GET /api/nrc/admin/supply
// Get and manage total supply
// ==========================================
router.get('/admin/supply', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/nrc/stats`, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 5000
        });
        
        const stats = response.data.stats;
        
        res.json({
            success: true,
            supply: {
                total: stats.totalSupply,
                circulating: stats.circulatingSupply,
                max: stats.config.maxSupply,
                percentage: (stats.totalSupply / stats.config.maxSupply) * 100
            }
        });
    } catch (error) {
        console.error('[NRC Admin] Supply error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch supply data'
        });
    }
});

// ==========================================
// POST /api/nrc/admin/inflation
// Update inflation rate
// ==========================================
router.post('/admin/inflation', async (req, res) => {
    try {
        const { rate } = req.body;
        
        if (typeof rate !== 'number' || rate < 0 || rate > 1) {
            return res.status(400).json({
                success: false,
                error: 'Invalid inflation rate (must be between 0 and 1)'
            });
        }
        
        // TODO: Implement inflation rate update in bot
        
        res.json({
            success: true,
            message: 'Inflation rate updated (requires bot restart to apply)',
            newRate: rate
        });
    } catch (error) {
        console.error('[NRC Admin] Inflation error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to update inflation rate'
        });
    }
});

// ==========================================
// POST /api/nrc/admin/events
// Create economic event (price surge/crash)
// ==========================================
router.post('/admin/events', async (req, res) => {
    try {
        const { type, magnitude, duration } = req.body;
        
        if (!['surge', 'crash', 'stable'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid event type (must be: surge, crash, or stable)'
            });
        }
        
        // TODO: Implement economic events in bot
        
        res.json({
            success: true,
            event: {
                type,
                magnitude: magnitude || 0.2,
                duration: duration || 3600000, // 1 hour default
                createdAt: Date.now()
            }
        });
    } catch (error) {
        console.error('[NRC Admin] Event error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to create economic event'
        });
    }
});

// ==========================================
// POST /api/nrc/admin/freeze/:userId
// Freeze/unfreeze user's NRC account
// ==========================================
router.post('/admin/freeze/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { frozen, reason } = req.body;
        
        // TODO: Implement account freeze in bot
        
        res.json({
            success: true,
            userId,
            frozen: frozen !== false,
            reason: reason || 'Admin action',
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('[NRC Admin] Freeze error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to freeze account'
        });
    }
});

// ==========================================
// POST /api/nrc/admin/add
// Add NRC to user (admin grant)
// ==========================================
router.post('/admin/add', async (req, res) => {
    try {
        const { userId, amount, reason } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'User ID and amount are required'
            });
        }
        
        const response = await axios.post(
            `${BOT_API_URL}/api/nrc/add`,
            { userId, amount, reason: reason || 'Admin grant' },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC Admin] Add NRC error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to add NRC'
        });
    }
});

// ==========================================
// POST /api/nrc/admin/remove
// Remove NRC from user (admin removal)
// ==========================================
router.post('/admin/remove', async (req, res) => {
    try {
        const { userId, amount, reason } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'User ID and amount are required'
            });
        }
        
        const response = await axios.post(
            `${BOT_API_URL}/api/nrc/remove`,
            { userId, amount, reason: reason || 'Admin removal' },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC Admin] Remove NRC error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to remove NRC'
        });
    }
});

// ==========================================
// GET /api/nrc/admin/analytics
// Get NRC analytics and insights
// ==========================================
router.get('/admin/analytics', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/nrc/stats`, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 5000
        });
        
        const stats = response.data.stats;
        
        // Calculate analytics
        const analytics = {
            totalSupply: stats.totalSupply,
            circulatingSupply: stats.circulatingSupply,
            currentPrice: stats.currentPrice,
            totalTransactions: stats.totalTransactions,
            totalTrades: stats.totalTrades,
            activeTrades: stats.activeTrades,
            priceChange24h: calculatePriceChange(stats.priceHistory, 24),
            priceChange7d: calculatePriceChange(stats.priceHistory, 168),
            velocity: stats.circulatingSupply > 0 ? stats.totalTransactions / stats.circulatingSupply : 0
        };
        
        res.json({
            success: true,
            analytics
        });
    } catch (error) {
        console.error('[NRC Admin] Analytics error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch analytics'
        });
    }
});

function calculatePriceChange(priceHistory, hours) {
    if (!priceHistory || priceHistory.length === 0) return 0;
    
    const now = Date.now();
    const cutoff = now - (hours * 60 * 60 * 1000);
    
    const recentPrices = priceHistory.filter(p => p.timestamp > cutoff);
    
    if (recentPrices.length < 2) return 0;
    
    const oldPrice = recentPrices[0].price;
    const currentPrice = recentPrices[recentPrices.length - 1].price;
    
    return ((currentPrice - oldPrice) / oldPrice) * 100;
}

module.exports = router;

