// ==========================================
// 🤝 NRC Trading Routes
// ==========================================
// P2P Trading with Offer/Counter-offer system

const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// ==========================================
// GET /api/nrc/trades/:userId
// Get user's trade offers
// ==========================================
router.get('/trades/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const response = await axios.get(
            `${BOT_API_URL}/api/nrc/trades/${userId}`,
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('[NRC Trading] Get trades error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trades'
        });
    }
});

// ==========================================
// POST /api/nrc/trade/offer
// Send trade offer
// ==========================================
router.post('/trade/offer', async (req, res) => {
    try {
        const { fromUserId, toUserId, amount, message } = req.body;

        if (!fromUserId || !toUserId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid trade offer data'
            });
        }

        const response = await axios.post(
            `${BOT_API_URL}/api/nrc/trade/offer`,
            { fromUserId, toUserId, amount, message },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('[NRC Trading] Send offer error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to send trade offer'
        });
    }
});

// ==========================================
// POST /api/nrc/trade/accept
// Accept trade offer
// ==========================================
router.post('/trade/accept', async (req, res) => {
    try {
        const { tradeId, userId } = req.body;

        const response = await axios.post(
            `${BOT_API_URL}/api/nrc/trade/accept`,
            { tradeId, userId },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('[NRC Trading] Accept error:', error.message);
        res.status(500).json({
            success: false,
            error: error.response?.data?.error || 'Failed to accept trade'
        });
    }
});

// ==========================================
// POST /api/nrc/trade/reject
// Reject trade offer
// ==========================================
router.post('/trade/reject', async (req, res) => {
    try {
        const { tradeId, userId } = req.body;

        const response = await axios.post(
            `${BOT_API_URL}/api/nrc/trade/reject`,
            { tradeId, userId },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('[NRC Trading] Reject error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to reject trade'
        });
    }
});

// ==========================================
// POST /api/nrc/trade/counter
// Counter trade offer
// ==========================================
router.post('/trade/counter', async (req, res) => {
    try {
        const { tradeId, userId, counterAmount } = req.body;

        if (!counterAmount || counterAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid counter offer amount'
            });
        }

        const response = await axios.post(
            `${BOT_API_URL}/api/nrc/trade/counter`,
            { tradeId, userId, counterAmount },
            {
                headers: { 'x-api-key': BOT_API_KEY },
                timeout: 5000
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('[NRC Trading] Counter offer error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to send counter offer'
        });
    }
});

module.exports = router;

