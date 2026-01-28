const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
};

// GET /api/leveling/:guildId/users - Get all user levels in guild
router.get('/:guildId/users', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/leveling/${guildId}/users`, {
      headers: { 'x-api-key': BOT_API_KEY },
      params: { page, limit },
      timeout: 10000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Leveling] Error fetching users:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// GET /api/leveling/:guildId/user/:userId - Get specific user level
router.get('/:guildId/user/:userId', requireAuth, async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/leveling/${guildId}/user/${userId}`, {
      headers: { 'x-api-key': BOT_API_KEY },
      timeout: 10000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Leveling] Error fetching user:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// GET /api/leveling/:guildId/leaderboard - Top 100 users
router.get('/:guildId/leaderboard', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { limit = 100 } = req.query;
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/leveling/${guildId}/leaderboard`, {
      headers: { 'x-api-key': BOT_API_KEY },
      params: { limit },
      timeout: 10000
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Leveling] Error fetching leaderboard:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
  }
});

// POST /api/leveling/:guildId/user/:userId/reset - Reset user XP (admin only)
router.post('/:guildId/user/:userId/reset', requireAuth, async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    
    const response = await axios.post(
      `${BOT_API_URL}/api/bot/leveling/${guildId}/user/${userId}/reset`,
      {},
      {
        headers: { 'x-api-key': BOT_API_KEY },
        timeout: 10000
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[Leveling] Error resetting user:', error.message);
    res.status(500).json({ success: false, error: 'Failed to reset user' });
  }
});

module.exports = router;

