const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// Cache for balance data (30-second TTL)
const balanceCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// GET /api/neurocoin/balance/:userId
router.get('/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check cache first
    const cached = balanceCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json({ ...cached.data, cached: true });
    }
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/neurocoin/balance/${userId}`, {
      headers: { 'x-api-key': BOT_API_KEY },
      timeout: 10000
    });
    
    // Store in cache
    balanceCache.set(userId, {
      data: response.data,
      timestamp: Date.now()
    });
    
    res.json({ ...response.data, cached: false });
  } catch (error) {
    console.error('[NeuroCoin] Error fetching balance:', error.message);
    console.error('[NeuroCoin] Full error:', error);
    
    // Return cached data if available, even if expired
    const cached = balanceCache.get(req.params.userId);
    if (cached) {
      return res.json({ ...cached.data, cached: true, stale: true });
    }
    
    // Return default balance instead of error
    res.json({
      success: true,
      total: 0,
      available: 0,
      locked: 0,
      lastUpdated: new Date().toISOString(),
      error: 'Could not fetch from bot server'
    });
  }
});

// POST /api/neurocoin/transfer
router.post('/transfer', async (req, res) => {
  try {
    const { fromUserId, toUserId, amount } = req.body;
    const response = await axios.post(`${BOT_API_URL}/api/bot/neurocoin/transfer`, {
      fromUserId, toUserId, amount
    }, {
      headers: { 'x-api-key': BOT_API_KEY },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[NeuroCoin] Error transferring:', error.message);
    res.status(500).json({ success: false, error: 'Failed to transfer' });
  }
});

// GET /api/neurocoin/transactions/:userId
router.get('/transactions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const response = await axios.get(`${BOT_API_URL}/api/bot/neurocoin/transactions/${userId}`, {
      headers: { 'x-api-key': BOT_API_KEY },
      params: { limit },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[NeuroCoin] Error fetching transactions:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

// GET /api/neurocoin/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'total', limit = 100 } = req.query;
    const response = await axios.get(`${BOT_API_URL}/api/bot/neurocoin/leaderboard`, {
      headers: { 'x-api-key': BOT_API_KEY },
      params: { type, limit },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[NeuroCoin] Error fetching leaderboard:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;

