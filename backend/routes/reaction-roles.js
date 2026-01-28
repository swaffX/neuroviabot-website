const express = require('express');
const router = express.Router();
const axios = require('axios');

const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
};

// GET /api/reaction-roles/:guildId
router.get('/:guildId', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const response = await axios.get(`${BOT_API_URL}/api/bot/reaction-roles/${guildId}`, {
      headers: { 'x-api-key': BOT_API_KEY },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[ReactionRoles] Error fetching:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch reaction roles' });
  }
});

// POST /api/reaction-roles/:guildId
router.post('/:guildId', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const response = await axios.post(`${BOT_API_URL}/api/bot/reaction-roles/${guildId}`, req.body, {
      headers: { 'x-api-key': BOT_API_KEY },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[ReactionRoles] Error creating:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create reaction role' });
  }
});

// DELETE /api/reaction-roles/:guildId/:configId
router.delete('/:guildId/:configId', requireAuth, async (req, res) => {
  try {
    const { guildId, configId } = req.params;
    const response = await axios.delete(`${BOT_API_URL}/api/bot/reaction-roles/${guildId}/${configId}`, {
      headers: { 'x-api-key': BOT_API_KEY },
      timeout: 10000
    });
    res.json(response.data);
  } catch (error) {
    console.error('[ReactionRoles] Error deleting:', error.message);
    res.status(500).json({ success: false, error: 'Failed to delete reaction role' });
  }
});

module.exports = router;

