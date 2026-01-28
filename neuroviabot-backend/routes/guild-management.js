const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getIO } = require('../socket');

// Bot sunucusu API URL'i
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
const BOT_API_KEY = process.env.BOT_API_KEY || 'neuroviabot-secret';

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// === MEMBER MANAGEMENT ===

// Get all members
router.get('/:guildId/members', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { page = 1, limit = 50, search = '' } = req.query;
    
    console.log(`[Backend API] Fetching members for guild ${guildId}`);
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/guilds/${guildId}/members`, {
      params: { page, limit, search },
      headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
      timeout: 5000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error fetching members:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch members',
      message: error.message 
    });
  }
});

// Kick member
router.post('/:guildId/members/:userId/kick', requireAuth, async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const { reason } = req.body;
    
    console.log(`[Backend API] Kicking member ${userId} from guild ${guildId}`);
    
    const response = await axios.post(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/members/${userId}/kick`,
      { reason, executor: req.user.id },
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        timeout: 5000,
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error kicking member:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to kick member',
      message: error.message 
    });
  }
});

// Ban member
router.post('/:guildId/members/:userId/ban', requireAuth, async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const { reason, deleteMessageDays = 0 } = req.body;
    
    console.log(`[Backend API] Banning member ${userId} from guild ${guildId}`);
    
    const response = await axios.post(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/members/${userId}/ban`,
      { reason, deleteMessageDays, executor: req.user.id },
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        timeout: 5000,
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error banning member:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to ban member',
      message: error.message 
    });
  }
});

// Unban member
router.delete('/:guildId/bans/:userId', requireAuth, async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    
    console.log(`[Backend API] Unbanning member ${userId} from guild ${guildId}`);
    
    const response = await axios.delete(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/bans/${userId}`,
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        data: { executor: req.user.id },
        timeout: 5000,
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error unbanning member:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to unban member',
      message: error.message 
    });
  }
});

// Timeout member
router.post('/:guildId/members/:userId/timeout', requireAuth, async (req, res) => {
  try {
    const { guildId, userId } = req.params;
    const { duration, reason } = req.body;
    
    console.log(`[Backend API] Timing out member ${userId} in guild ${guildId}`);
    
    const response = await axios.post(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/members/${userId}/timeout`,
      { duration, reason, executor: req.user.id },
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        timeout: 5000,
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error timing out member:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to timeout member',
      message: error.message 
    });
  }
});

// Get banned members
router.get('/:guildId/bans', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    console.log(`[Backend API] Fetching bans for guild ${guildId}`);
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/guilds/${guildId}/bans`, {
      headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
      timeout: 5000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error fetching bans:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch bans',
      message: error.message 
    });
  }
});

// === ROLE MANAGEMENT ===

// Get all roles
router.get('/:guildId/roles', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    console.log(`[Backend API] Fetching roles for guild ${guildId}`);
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/guilds/${guildId}/roles`, {
      headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
      timeout: 5000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error fetching roles:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch roles',
      message: error.message 
    });
  }
});

// Create role
router.post('/:guildId/roles', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { name, color, permissions, hoist, mentionable } = req.body;
    
    console.log(`[Backend API] Creating role in guild ${guildId}`);
    
    const response = await axios.post(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/roles`,
      { name, color, permissions, hoist, mentionable, executor: req.user.id },
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        timeout: 5000,
      }
    );
    
    // Emit Socket.IO event for real-time update
    const io = getIO();
    if (io && response.data.role) {
      io.emit('role_created', {
        guildId,
        role: response.data.role
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error creating role:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to create role',
      message: error.message 
    });
  }
});

// Update role
router.patch('/:guildId/roles/:roleId', requireAuth, async (req, res) => {
  try {
    const { guildId, roleId } = req.params;
    const updates = req.body;
    
    console.log(`[Backend API] Updating role ${roleId} in guild ${guildId}`);
    
    const response = await axios.patch(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/roles/${roleId}`,
      { ...updates, executor: req.user.id },
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        timeout: 5000,
      }
    );
    
    // Emit Socket.IO event for real-time update
    const io = getIO();
    if (io && response.data.role) {
      io.emit('role_updated', {
        guildId,
        role: response.data.role
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error updating role:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to update role',
      message: error.message 
    });
  }
});

// Delete role
router.delete('/:guildId/roles/:roleId', requireAuth, async (req, res) => {
  try {
    const { guildId, roleId } = req.params;
    
    console.log(`[Backend API] Deleting role ${roleId} from guild ${guildId}`);
    
    const response = await axios.delete(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/roles/${roleId}`,
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        data: { executor: req.user.id },
        timeout: 5000,
      }
    );
    
    // Emit Socket.IO event for real-time update
    const io = getIO();
    if (io) {
      io.emit('role_deleted', {
        guildId,
        roleId
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error deleting role:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to delete role',
      message: error.message 
    });
  }
});

// Add role to member
router.post('/:guildId/members/:userId/roles/:roleId', requireAuth, async (req, res) => {
  try {
    const { guildId, userId, roleId } = req.params;
    
    console.log(`[Backend API] Adding role ${roleId} to member ${userId} in guild ${guildId}`);
    
    const response = await axios.post(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      { executor: req.user.id },
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        timeout: 5000,
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error adding role to member:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to add role',
      message: error.message 
    });
  }
});

// Remove role from member
router.delete('/:guildId/members/:userId/roles/:roleId', requireAuth, async (req, res) => {
  try {
    const { guildId, userId, roleId } = req.params;
    
    console.log(`[Backend API] Removing role ${roleId} from member ${userId} in guild ${guildId}`);
    
    const response = await axios.delete(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        data: { executor: req.user.id },
        timeout: 5000,
      }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error removing role from member:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to remove role',
      message: error.message 
    });
  }
});

// === CHANNEL MANAGEMENT ===

// Get all channels
router.get('/:guildId/channels', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    console.log(`[Backend API] Fetching channels for guild ${guildId}`);
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/guilds/${guildId}/channels`, {
      headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
      timeout: 5000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error fetching channels:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch channels',
      message: error.message 
    });
  }
});

// Create channel
router.post('/:guildId/channels', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { name, type, topic, nsfw, parent } = req.body;
    
    console.log(`[Backend API] Creating channel in guild ${guildId}`);
    
    const response = await axios.post(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/channels`,
      { name, type, topic, nsfw, parent, executor: req.user.id },
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        timeout: 5000,
      }
    );
    
    // Emit Socket.IO event for real-time update
    const io = getIO();
    if (io && response.data.channel) {
      io.emit('channel_created', {
        guildId,
        channel: response.data.channel
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error creating channel:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to create channel',
      message: error.message 
    });
  }
});

// Update channel
router.patch('/:guildId/channels/:channelId', requireAuth, async (req, res) => {
  try {
    const { guildId, channelId } = req.params;
    const updates = req.body;
    
    console.log(`[Backend API] Updating channel ${channelId} in guild ${guildId}`);
    
    const response = await axios.patch(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/channels/${channelId}`,
      { ...updates, executor: req.user.id },
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        timeout: 5000,
      }
    );
    
    // Emit Socket.IO event for real-time update
    const io = getIO();
    if (io && response.data.channel) {
      io.emit('channel_updated', {
        guildId,
        channel: response.data.channel
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error updating channel:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to update channel',
      message: error.message 
    });
  }
});

// Delete channel
router.delete('/:guildId/channels/:channelId', requireAuth, async (req, res) => {
  try {
    const { guildId, channelId } = req.params;
    
    console.log(`[Backend API] Deleting channel ${channelId} from guild ${guildId}`);
    
    const response = await axios.delete(
      `${BOT_API_URL}/api/bot/guilds/${guildId}/channels/${channelId}`,
      {
        headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
        data: { executor: req.user.id },
        timeout: 5000,
      }
    );
    
    // Emit Socket.IO event for real-time update
    const io = getIO();
    if (io) {
      io.emit('channel_deleted', {
        guildId,
        channelId
      });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error deleting channel:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to delete channel',
      message: error.message 
    });
  }
});

// === AUDIT LOGS ===

// Get audit logs
router.get('/:guildId/audit-logs', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { page = 1, limit = 25, actionType, userId, startDate, endDate } = req.query;
    
    console.log(`[Backend API] Fetching audit logs for guild ${guildId}`);
    
    const response = await axios.get(`${BOT_API_URL}/api/bot/guilds/${guildId}/audit-logs`, {
      params: { page, limit, actionType, userId, startDate, endDate },
      headers: { 'Authorization': `Bearer ${BOT_API_KEY}` },
      timeout: 5000,
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('[Backend API] Error fetching audit logs:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch audit logs',
      message: error.message 
    });
  }
});

module.exports = router;

