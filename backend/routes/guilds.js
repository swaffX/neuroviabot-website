const express = require('express');
const router = express.Router();
const fetch = globalThis.fetch || require('node-fetch');
const { getDatabase } = require('../database/simple-db');

// Get shared database instance (same as bot uses)
const db = getDatabase();

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get user guilds with bot presence
router.get('/user', requireAuth, async (req, res) => {
  try {
    const accessToken = req.user.accessToken;
    const db = req.app.get('db');
    
    // Fetch user's guilds from Discord API
    const guildsResponse = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!guildsResponse.ok) {
      return res.status(guildsResponse.status).json({ error: 'Failed to fetch guilds' });
    }
    
    const guilds = await guildsResponse.json();
    
    // Filter guilds where user has ADMINISTRATOR permission (0x8)
    const adminGuilds = guilds.filter(guild => {
      const permissions = BigInt(guild.permissions);
      return guild.owner || (permissions & BigInt(0x8)) === BigInt(0x8);
    });
    
    // Get bot guild IDs from database
    const botGuildIds = Array.from(db.data.guilds.keys());
    
    // Bot guild info (reduced logging)
    
    // Check bot presence via Discord API for each guild
    const enhancedGuilds = await Promise.all(adminGuilds.map(async (guild) => {
      const botGuild = db.data.guilds.get(guild.id);
      let botPresent = botGuildIds.includes(guild.id);
      
      // Double-check via Discord API if not found in database
      if (!botPresent) {
        try {
          const botCheckResponse = await fetch(`https://discord.com/api/v10/guilds/${guild.id}`, {
            headers: {
              'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
            },
          });
          
          if (botCheckResponse.ok) {
            botPresent = true;
            // Bot found via Discord API (reduced logging)
            
            // Add to database if not present
            if (!botGuild) {
              const guildData = {
                name: guild.name,
                memberCount: 0, // Will be updated later
                ownerId: guild.owner ? req.user.id : null,
                icon: guild.icon,
                active: true,
                joinedAt: new Date().toISOString()
              };
              db.getOrCreateGuild(guild.id, guildData);
              // Added to database (reduced logging)
            }
          }
        } catch (error) {
          // Discord API check failed (reduced logging)
        }
      }
      
      // Guild processed (reduced logging)
      
      return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        owner: guild.owner,
        permissions: guild.permissions,
        botPresent: botPresent,
        memberCount: botGuild?.memberCount || null,
      };
    }));
    
    res.json(enhancedGuilds);
  } catch (error) {
    console.error('Error fetching user guilds:', error);
    res.status(500).json({ error: 'Failed to fetch user guilds' });
  }
});

// Get guild features - Automatic detection of enabled features
router.get('/:guildId/features', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const db = req.app.get('db');
    const guildData = db.data.guilds.get(guildId);
    
    if (!guildData) {
      return res.status(404).json({ error: 'Guild not found' });
    }
    
    // Get settings from database
    const settings = guildData.settings || {};
    const serverStats = guildData.serverStats || {};
    
    // Build features object
    const features = {
      welcome: {
        enabled: settings.welcome?.enabled || false,
        configured: !!(settings.welcome?.channelId)
      },
      moderation: {
        enabled: settings.moderation?.enabled || false,
        autoMod: settings.moderation?.autoMod || false,
        warnings: settings.moderation?.warnings?.enabled || false
      },
      leveling: {
        enabled: settings.leveling?.enabled || false,
        xpSystem: settings.leveling?.xpPerMessage > 0 || false,
        roleRewards: (settings.leveling?.rewards?.length || 0) > 0
      },
      economy: {
        enabled: settings.economy?.enabled || false,
        nrcCoins: settings.economy?.nrcCoins?.enabled || false,
        serverCurrency: settings.economy?.currency?.enabled || false
      },
      serverStats: {
        enabled: serverStats.enabled || false,
        channelsCreated: !!(serverStats.channelIds?.members && serverStats.channelIds?.bots),
        autoUpdate: serverStats.autoUpdate || false
      },
      auditLog: {
        enabled: settings.auditLog?.enabled || false,
        logChannel: settings.auditLog?.channelId || null
      },
      reactionRoles: {
        enabled: settings.reactionRoles?.enabled || false,
        panels: settings.reactionRoles?.panels?.length || 0
      },
      automation: {
        enabled: settings.automation?.enabled || false,
        autoRole: settings.automation?.autoRole?.enabled || false,
        scheduled: (settings.automation?.scheduledMessages?.length || 0) > 0
      },
      backup: {
        enabled: settings.backup?.enabled || false,
        backupCount: settings.backup?.backups?.length || 0
      },
      security: {
        enabled: settings.security?.enabled || false,
        guard: settings.security?.guard?.enabled || false,
        verification: settings.security?.verification?.enabled || false
      },
      premium: {
        active: guildData.premium?.active || false,
        tier: guildData.premium?.tier || null,
        features: guildData.premium?.features || []
      }
    };
    
    res.json({ features });
  } catch (error) {
    console.error('Error fetching guild features:', error);
    res.status(500).json({ error: 'Failed to fetch guild features' });
  }
});

// Get guild stats
router.get('/:guildId/stats', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    // TODO: Fetch from actual Discord bot client
    // const guild = client.guilds.cache.get(guildId);
    // Return real stats when bot is in guild
    
    res.json({
      memberCount: 0,
      onlineMembers: 0,
      totalCommands: 0,
      dailyMessages: 0,
    });
  } catch (error) {
    console.error('Error fetching guild stats:', error);
    res.status(500).json({ error: 'Failed to fetch guild stats' });
  }
});

// Get guild info
router.get('/:guildId', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    const db = req.app.get('db');
    const guild = db.data.guilds.get(guildId);
    
    if (!guild) {
      return res.status(404).json({ 
        error: 'Guild not found',
        message: 'Bot is not in this guild'
      });
    }
    
    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      memberCount: guild.memberCount,
      ownerId: guild.ownerId,
      description: guild.description,
    });
  } catch (error) {
    console.error('Error fetching guild:', error);
    res.status(500).json({ error: 'Failed to fetch guild' });
  }
});

// Get guild channels
router.get('/:guildId/channels', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    // Fetch channels from Discord API
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch channels' });
    }
    
    const channels = await response.json();
    
    // Filter text channels and sort by position
    const textChannels = channels
      .filter(channel => channel.type === 0 || channel.type === 5) // Text and announcement
      .sort((a, b) => a.position - b.position)
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type,
        position: channel.position,
        parent_id: channel.parent_id,
      }));
    
    res.json(textChannels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// Get guild roles
router.get('/:guildId/roles', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    // Fetch roles from Discord API
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: {
        'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch roles' });
    }
    
    const roles = await response.json();
    
    // Sort by position (highest first)
    const sortedRoles = roles
      .sort((a, b) => b.position - a.position)
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position,
        permissions: role.permissions,
        mentionable: role.mentionable,
      }));
    
    res.json(sortedRoles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get all guild settings
router.get('/:guildId/settings', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    // Get settings from bot database
    const settings = db.getGuildSettings(guildId);
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update specific category settings
router.put('/:guildId/settings/:category', requireAuth, async (req, res) => {
  const { guildId, category } = req.params;
  const updates = req.body;
  
  try {
    // Update in bot database
    const settings = db.updateGuildSettingsCategory(guildId, category, updates);
    
    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`guild_${guildId}`).emit('settings_changed', {
        guildId,
        category,
        settings: settings[category],
        timestamp: new Date().toISOString(),
      });
    }
    
    res.json({ [category]: settings[category] });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get specific category settings
router.get('/:guildId/settings/:category', requireAuth, async (req, res) => {
  const { guildId, category } = req.params;
  
  try {
    const settings = guildSettings.get(guildId) || {};
    const categorySettings = settings[category];
    
    if (!categorySettings) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(categorySettings);
  } catch (error) {
    console.error('Error fetching category settings:', error);
    res.status(500).json({ error: 'Failed to fetch category settings' });
  }
});

// Bulk update settings (PUT)
router.put('/:guildId/settings', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const updates = req.body;
  
  try {
    // Update in bot database
    const settings = db.updateGuildSettings(guildId, updates);
    
    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`guild_${guildId}`).emit('settings_changed', {
        guildId,
        settings,
        timestamp: new Date().toISOString(),
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});



// Bulk update settings (POST) - for frontend compatibility
router.post('/:guildId/settings', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  const updates = req.body;
  
  try {
    // Update in bot database
    const settings = db.updateGuildSettings(guildId, updates);
    
    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`guild_${guildId}`).emit('settings_changed', {
        guildId,
        settings,
        timestamp: new Date().toISOString(),
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Reset settings to defaults
router.post('/:guildId/settings/reset', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  
  try {
    // Remove from storage
    guildSettings.delete(guildId);
    
    // TODO: Delete from database
    // await GuildSettings.findOneAndDelete({ guildId });
    
    res.json({ success: true, message: 'Settings reset to defaults' });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

module.exports = router;
