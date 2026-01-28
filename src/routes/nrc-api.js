// ==========================================
// 💰 NRC Coin Internal API (Bot Side)
// ==========================================
// Provides NRC coin data to backend

const express = require('express');
const router = express.Router();
const {
    getUserNRCBalance,
    addNRCToUser,
    removeNRCFromUser,
    createTrade,
    acceptTrade,
    cancelTrade,
    getGlobalStats,
    getActiveTrades,
    getUserTransactions,
    getTopHolders
} = require('../handlers/nrcCoinHandler');
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
// GET /api/nrc/stats
// Get global NRC statistics
// ==========================================
router.get('/stats', (req, res) => {
    try {
        const stats = getGlobalStats();
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        logger.error('[NRC API] Stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get stats'
        });
    }
});

// ==========================================
// GET /api/nrc/balance/:userId
// Get user's NRC balance
// ==========================================
router.get('/balance/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const balance = getUserNRCBalance(userId);
        
        res.json({
            success: true,
            userId,
            balance
        });
    } catch (error) {
        logger.error('[NRC API] Balance error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get balance'
        });
    }
});

// ==========================================
// GET /api/nrc/transactions/:userId
// Get user's transaction history
// ==========================================
router.get('/transactions/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;
        
        const transactions = getUserTransactions(userId, parseInt(limit));
        
        res.json({
            success: true,
            transactions,
            total: transactions.length
        });
    } catch (error) {
        logger.error('[NRC API] Transactions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get transactions'
        });
    }
});

// ==========================================
// GET /api/nrc/price
// Get current NRC price
// ==========================================
router.get('/price', (req, res) => {
    try {
        const stats = getGlobalStats();
        
        res.json({
            success: true,
            price: stats.currentPrice,
            timestamp: stats.lastUpdate
        });
    } catch (error) {
        logger.error('[NRC API] Price error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get price'
        });
    }
});

// ==========================================
// GET /api/nrc/price-history
// Get price history
// ==========================================
router.get('/price-history', (req, res) => {
    try {
        const { days = 7 } = req.query;
        const stats = getGlobalStats();
        
        const cutoffTime = Date.now() - (parseInt(days) * 24 * 60 * 60 * 1000);
        const history = stats.priceHistory?.filter(p => p.timestamp > cutoffTime) || [];
        
        res.json({
            success: true,
            history,
            days: parseInt(days)
        });
    } catch (error) {
        logger.error('[NRC API] Price history error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get price history'
        });
    }
});

// ==========================================
// POST /api/nrc/trade/create
// Create a P2P trade
// ==========================================
router.post('/trade/create', (req, res) => {
    try {
        const { sellerId, amount, pricePerNRC } = req.body;
        
        if (!sellerId || !amount || !pricePerNRC) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        const trade = createTrade(sellerId, parseFloat(amount), parseFloat(pricePerNRC));
        
        res.json({
            success: true,
            trade
        });
    } catch (error) {
        logger.error('[NRC API] Create trade error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create trade'
        });
    }
});

// ==========================================
// GET /api/nrc/trades
// Get active trades
// ==========================================
router.get('/trades', (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const trades = getActiveTrades(parseInt(limit));
        
        res.json({
            success: true,
            trades,
            total: trades.length
        });
    } catch (error) {
        logger.error('[NRC API] Trades error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get trades'
        });
    }
});

// ==========================================
// POST /api/nrc/trade/accept/:tradeId
// Accept a trade
// ==========================================
router.post('/trade/accept/:tradeId', (req, res) => {
    try {
        const { tradeId } = req.params;
        const { buyerId } = req.body;
        
        if (!buyerId) {
            return res.status(400).json({
                success: false,
                error: 'Buyer ID is required'
            });
        }
        
        const trade = acceptTrade(tradeId, buyerId);
        
        res.json({
            success: true,
            trade
        });
    } catch (error) {
        logger.error('[NRC API] Accept trade error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to accept trade'
        });
    }
});

// ==========================================
// POST /api/nrc/trade/cancel/:tradeId
// Cancel a trade
// ==========================================
router.post('/trade/cancel/:tradeId', (req, res) => {
    try {
        const { tradeId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        
        const trade = cancelTrade(tradeId, userId);
        
        res.json({
            success: true,
            trade
        });
    } catch (error) {
        logger.error('[NRC API] Cancel trade error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to cancel trade'
        });
    }
});

// ==========================================
// GET /api/nrc/leaderboard
// Get top NRC holders
// ==========================================
router.get('/leaderboard', (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const holders = getTopHolders(parseInt(limit));
        
        res.json({
            success: true,
            holders
        });
    } catch (error) {
        logger.error('[NRC API] Leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get leaderboard'
        });
    }
});

// ==========================================
// POST /api/nrc/add (Developer only)
// Add NRC to user (for testing/admin purposes)
// ==========================================
router.post('/add', (req, res) => {
    try {
        const { userId, amount, reason } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'User ID and amount are required'
            });
        }
        
        const newBalance = addNRCToUser(userId, parseFloat(amount), reason || 'Admin grant');
        
        res.json({
            success: true,
            userId,
            amount: parseFloat(amount),
            newBalance
        });
    } catch (error) {
        logger.error('[NRC API] Add NRC error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to add NRC'
        });
    }
});

// ==========================================
// POST /api/nrc/remove (Developer only)
// Remove NRC from user
// ==========================================
router.post('/remove', (req, res) => {
    try {
        const { userId, amount, reason } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({
                success: false,
                error: 'User ID and amount are required'
            });
        }
        
        const newBalance = removeNRCFromUser(userId, parseFloat(amount), reason || 'Admin removal');
        
        res.json({
            success: true,
            userId,
            amount: parseFloat(amount),
            newBalance
        });
    } catch (error) {
        logger.error('[NRC API] Remove NRC error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to remove NRC'
        });
    }
});

module.exports = router;

