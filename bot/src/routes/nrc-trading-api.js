// ==========================================
// 🤝 NRC Trading API (Bot Side)
// ==========================================
// P2P Trading with Escrow protection

const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const { getDatabase } = require('../database/simple-db');
const { getNRCBalance, addNRCToUser, removeNRCFromUser } = require('../handlers/nrcCoinHandler');

// API Key validation
function validateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.BOT_API_KEY || 'your-secret-api-key';
    
    if (!apiKey || apiKey !== validApiKey) {
        return res.status(401).json({ success: false, error: 'Invalid API key' });
    }
    
    next();
}

router.use(validateApiKey);

const db = getDatabase();

// Initialize trades storage
if (!db.data.trades) {
    db.data.trades = new Map();
}

// ==========================================
// GET /api/nrc/trades/:userId
// Get user's trade offers
// ==========================================
router.get('/trades/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        
        const allTrades = Array.from(db.data.trades.values());
        
        const received = allTrades.filter(t => 
            t.to.userId === userId && t.status === 'pending'
        );
        
        const sent = allTrades.filter(t => 
            t.from.userId === userId && t.status === 'pending'
        );
        
        const history = allTrades.filter(t => 
            (t.from.userId === userId || t.to.userId === userId) && 
            t.status !== 'pending'
        ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 20);

        res.json({
            success: true,
            received,
            sent,
            history
        });
    } catch (error) {
        logger.error('[NRC Trading] Get trades error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// POST /api/nrc/trade/offer
// Send trade offer
// ==========================================
router.post('/trade/offer', (req, res) => {
    try {
        const { fromUserId, toUserId, amount, message } = req.body;

        // Validation
        if (!fromUserId || !toUserId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid trade data'
            });
        }

        // Check balance
        const balance = getNRCBalance(fromUserId);
        if (balance < amount) {
            return res.status(400).json({
                success: false,
                error: 'Yetersiz bakiye'
            });
        }

        // Lock funds (escrow)
        removeNRCFromUser(fromUserId, amount, `Trade offer to ${toUserId}`);

        // Create trade offer
        const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const trade = {
            id: tradeId,
            from: {
                userId: fromUserId,
                username: 'User', // Will be filled from bot client
                avatar: ''
            },
            to: {
                userId: toUserId,
                username: 'User',
                avatar: ''
            },
            amount,
            message: message || '',
            status: 'pending',
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            escrow: amount // Locked amount
        };

        db.data.trades.set(tradeId, trade);
        db.save();

        logger.info(`[NRC Trading] Offer sent: ${fromUserId} → ${toUserId} (${amount} NRC)`);

        res.json({
            success: true,
            trade
        });
    } catch (error) {
        logger.error('[NRC Trading] Send offer error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// POST /api/nrc/trade/accept
// Accept trade offer
// ==========================================
router.post('/trade/accept', (req, res) => {
    try {
        const { tradeId, userId } = req.body;

        const trade = db.data.trades.get(tradeId);
        
        if (!trade) {
            return res.status(404).json({
                success: false,
                error: 'Trade not found'
            });
        }

        if (trade.to.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        if (trade.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Trade already processed'
            });
        }

        // Transfer funds from escrow to recipient
        addNRCToUser(trade.to.userId, trade.escrow, `Trade from ${trade.from.userId}`);

        // Update trade status
        trade.status = 'accepted';
        trade.completedAt = Date.now();
        
        db.data.trades.set(tradeId, trade);
        db.save();

        logger.info(`[NRC Trading] Trade accepted: ${tradeId}`);

        res.json({
            success: true,
            trade
        });
    } catch (error) {
        logger.error('[NRC Trading] Accept error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// POST /api/nrc/trade/reject
// Reject trade offer
// ==========================================
router.post('/trade/reject', (req, res) => {
    try {
        const { tradeId, userId } = req.body;

        const trade = db.data.trades.get(tradeId);
        
        if (!trade) {
            return res.status(404).json({
                success: false,
                error: 'Trade not found'
            });
        }

        if (trade.to.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        if (trade.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Trade already processed'
            });
        }

        // Refund escrowed funds
        addNRCToUser(trade.from.userId, trade.escrow, 'Trade refund');

        // Update trade status
        trade.status = 'rejected';
        trade.completedAt = Date.now();
        
        db.data.trades.set(tradeId, trade);
        db.save();

        logger.info(`[NRC Trading] Trade rejected: ${tradeId}`);

        res.json({
            success: true,
            trade
        });
    } catch (error) {
        logger.error('[NRC Trading] Reject error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// POST /api/nrc/trade/counter
// Counter trade offer
// ==========================================
router.post('/trade/counter', (req, res) => {
    try {
        const { tradeId, userId, counterAmount } = req.body;

        const trade = db.data.trades.get(tradeId);
        
        if (!trade) {
            return res.status(404).json({
                success: false,
                error: 'Trade not found'
            });
        }

        if (trade.to.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        if (trade.status !== 'pending') {
            return res.status(400).json({
                success: false,
                error: 'Trade already processed'
            });
        }

        if (!counterAmount || counterAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid counter amount'
            });
        }

        // Update trade with counter offer
        trade.status = 'countered';
        trade.counterOffer = counterAmount;
        trade.counterAt = Date.now();
        
        db.data.trades.set(tradeId, trade);
        db.save();

        logger.info(`[NRC Trading] Counter offer: ${tradeId} (${counterAmount} NRC)`);

        res.json({
            success: true,
            trade
        });
    } catch (error) {
        logger.error('[NRC Trading] Counter error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;

