// ==========================================
// 💰 NRC Coin API Routes
// ==========================================
// Public NRC coin endpoints

const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// ==========================================
// GET /api/nrc/global-stats
// Get global NRC statistics
// ==========================================
router.get('/global-stats', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/nrc/stats`, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 5000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC API] Global stats error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch global stats'
        });
    }
});

// ==========================================
// GET /api/nrc/transactions/:userId
// Get user's transaction history
// ==========================================
router.get('/transactions/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;
        
        const response = await axios.get(`${BOT_API_URL}/api/nrc/transactions/${userId}`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { limit },
            timeout: 5000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC API] Transactions error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch transactions'
        });
    }
});

// ==========================================
// GET /api/nrc/balance/:userId
// Get user's NRC balance
// ==========================================
router.get('/balance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const response = await axios.get(`${BOT_API_URL}/api/nrc/balance/${userId}`, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 5000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC API] Balance error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch balance'
        });
    }
});

// ==========================================
// GET /api/nrc/market/price
// Get current NRC price
// ==========================================
router.get('/market/price', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/nrc/price`, {
            headers: { 'x-api-key': BOT_API_KEY },
            timeout: 5000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC API] Price error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch price'
        });
    }
});

// ==========================================
// GET /api/nrc/market/history
// Get price history
// ==========================================
router.get('/market/history', async (req, res) => {
    try {
        const { days = 7 } = req.query;
        
        const response = await axios.get(`${BOT_API_URL}/api/nrc/price-history`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { days },
            timeout: 5000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC API] Price history error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch price history'
        });
    }
});

// ==========================================
// POST /api/nrc/trading/create
// Create a P2P trade
// ==========================================
router.post('/trading/create', async (req, res) => {
    try {
        const { sellerId, amount, pricePerNRC } = req.body;
        
        if (!sellerId || !amount || !pricePerNRC) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        const response = await axios.post(
            `${BOT_API_URL}/api/nrc/trade/create`,
            { sellerId, amount, pricePerNRC },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC API] Create trade error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to create trade'
        });
    }
});

// ==========================================
// GET /api/nrc/trading/list
// Get active trades
// ==========================================
router.get('/trading/list', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        const response = await axios.get(`${BOT_API_URL}/api/nrc/trades`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { limit },
            timeout: 5000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC API] Trades list error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trades'
        });
    }
});

// ==========================================
// POST /api/nrc/trading/accept/:tradeId
// Accept a trade
// ==========================================
router.post('/trading/accept/:tradeId', async (req, res) => {
    try {
        const { tradeId } = req.params;
        const { buyerId } = req.body;
        
        if (!buyerId) {
            return res.status(400).json({
                success: false,
                error: 'Buyer ID is required'
            });
        }
        
        const response = await axios.post(
            `${BOT_API_URL}/api/nrc/trade/accept/${tradeId}`,
            { buyerId },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC API] Accept trade error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to accept trade'
        });
    }
});

// ==========================================
// POST /api/nrc/trading/cancel/:tradeId
// Cancel a trade
// ==========================================
router.post('/trading/cancel/:tradeId', async (req, res) => {
    try {
        const { tradeId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }
        
        const response = await axios.post(
            `${BOT_API_URL}/api/nrc/trade/cancel/${tradeId}`,
            { userId },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC API] Cancel trade error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to cancel trade'
        });
    }
});

// ==========================================
// GET /api/nrc/leaderboard
// Get top NRC holders
// ==========================================
router.get('/leaderboard', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        const response = await axios.get(`${BOT_API_URL}/api/nrc/leaderboard`, {
            headers: { 'x-api-key': BOT_API_KEY },
            params: { limit },
            timeout: 5000
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('[NRC API] Leaderboard error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard'
        });
    }
});

module.exports = router;

