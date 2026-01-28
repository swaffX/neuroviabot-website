const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

// GET /api/quests/available/:userId
router.get('/available/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;
    const response = await axios.get(`${BOT_API_URL}/api/bot/quests/available/${userId}`, {
      headers: { 'x-api-key': BOT_API_KEY },
      params: { type },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[Quests] Error fetching available:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch quests' });
  }
});

// GET /api/quests/progress/:userId
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const response = await axios.get(`${BOT_API_URL}/api/bot/quests/progress/${userId}`, {
      headers: { 'x-api-key': BOT_API_KEY },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[Quests] Error fetching progress:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch progress' });
  }
});

// POST /api/quests/claim/:questId
router.post('/claim/:questId', async (req, res) => {
  try {
    const { questId } = req.params;
    const { userId } = req.body;
    const response = await axios.post(`${BOT_API_URL}/api/bot/quests/claim/${questId}`, {
      userId
    }, {
      headers: { 'x-api-key': BOT_API_KEY },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[Quests] Error claiming:', error.message);
    res.status(500).json({ success: false, error: 'Failed to claim quest' });
  }
});

module.exports = router;

