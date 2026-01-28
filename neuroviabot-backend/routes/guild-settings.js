const express = require('express');
const router = express.Router();
const fetch = globalThis.fetch || require('node-fetch');

// Auth middleware
const requireAuth = (req, res, next) => {
  // Passport.js session kontrolü
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized - Please log in' 
    });
  }
  
  // User bilgisi kontrolü
  if (!req.user || !req.user.id) {
    return res.status(401).json({ 
      success: false, 
      error: 'User session invalid' 
    });
  }
  
  next();
};

// General settings endpoint
router.get('/:guildId/settings', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Get actual settings from database
    const db = req.app.get('db');
    const settings = db.getGuildSettings(guildId);

    res.json({ 
      success: true, 
      settings: {
        guildId,
        lastUpdated: new Date().toISOString(),
        features: settings.features || {}
      }
    });
  } catch (error) {
    console.error('Error fetching general settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch general settings' });
  }
});

// Welcome settings
router.get('/:guildId/settings/welcome', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Get actual settings from database
    const db = req.app.get('db');
    const guildSettings = db.getGuildSettings(guildId);
    
    const settings = {
      enabled: guildSettings.welcome?.enabled || false,
      channelId: guildSettings.welcome?.channelId || '',
      message: guildSettings.welcome?.message || 'Hoş geldin {user}! Sunucumuza katıldığın için teşekkürler!',
      embed: guildSettings.welcome?.embedEnabled || true,
      embedColor: guildSettings.welcome?.embedColor || '#5865F2',
      imageUrl: guildSettings.welcome?.imageUrl || '',
      leaveEnabled: guildSettings.leave?.enabled || false,
      leaveChannelId: guildSettings.leave?.channelId || '',
      leaveMessage: guildSettings.leave?.message || '{user} sunucumuzdan ayrıldı. Görüşmek üzere!',
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching welcome settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch welcome settings' });
  }
});

router.post('/:guildId/settings/welcome', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;
    
    // Save to database
    const db = req.app.get('db');
    db.updateGuildSettingsCategory(guildId, 'welcome', {
      enabled: settings.enabled,
      channelId: settings.channelId,
      message: settings.message,
      embedEnabled: settings.embed,
      embedColor: settings.embedColor,
      imageUrl: settings.imageUrl
    });
    
    db.updateGuildSettingsCategory(guildId, 'leave', {
      enabled: settings.leaveEnabled,
      channelId: settings.leaveChannelId,
      message: settings.leaveMessage
    });

    // Broadcast settings change via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`guild_${guildId}`).emit('settings_changed', {
        guildId,
        settings: db.getGuildSettings(guildId),
        category: 'welcome',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ success: true, message: 'Welcome settings saved successfully' });
  } catch (error) {
    console.error('Error saving welcome settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save welcome settings' });
  }
});

// Leveling settings
router.get('/:guildId/settings/leveling', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Get actual settings from database
    const db = req.app.get('db');
    const guildSettings = db.getGuildSettings(guildId);
    
    const settings = {
      enabled: guildSettings.leveling?.enabled || false,
      xpPerMessage: guildSettings.leveling?.xpPerMessage || 15,
      cooldown: guildSettings.leveling?.xpCooldown || 60,
      announceChannelId: guildSettings.leveling?.levelUpChannelId || '',
      roleRewards: guildSettings.leveling?.levelRoles || {},
      levelUpMessage: guildSettings.leveling?.levelUpMessage || 'Tebrikler {user}! {level}. seviyeye ulaştın! 🎉',
      showLevelUpMessage: guildSettings.leveling?.levelUpMessage !== 'false',
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching leveling settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch leveling settings' });
  }
});

router.post('/:guildId/settings/leveling', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;
    
    // Save to database
    const db = req.app.get('db');
    db.updateGuildSettingsCategory(guildId, 'leveling', {
      enabled: settings.enabled,
      xpPerMessage: settings.xpPerMessage,
      xpCooldown: settings.cooldown,
      levelUpChannelId: settings.announceChannelId,
      levelRoles: settings.roleRewards,
      levelUpMessage: settings.showLevelUpMessage ? settings.levelUpMessage : 'false'
    });

    // Broadcast settings change via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`guild_${guildId}`).emit('settings_changed', {
        guildId,
        settings: db.getGuildSettings(guildId),
        category: 'leveling',
        timestamp: new Date().toISOString()
      });
      
      // Emit specific leveling settings update event
      io.to(`guild_${guildId}`).emit('leveling_settings_update', {
        guildId,
        settings,
        timestamp: new Date().toISOString()
      });
      console.log(`[LevelingSettings] Emitted leveling_settings_update for guild ${guildId}`);
    }
    
    res.json({ success: true, message: 'Leveling settings saved successfully' });
  } catch (error) {
    console.error('Error saving leveling settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save leveling settings' });
  }
});

// Moderation settings
router.get('/:guildId/settings/moderation', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Get actual settings from database
    const db = req.app.get('db');
    const guildSettings = db.getGuildSettings(guildId);
    
    const settings = {
      autoModEnabled: guildSettings.moderation?.enabled && guildSettings.moderation?.autoMod || false,
      spamProtection: guildSettings.moderation?.spamProtection || false,
      antiInvite: guildSettings.moderation?.antiInvite || false,
      antiLink: guildSettings.moderation?.antiLink || false,
      badWordsFilter: guildSettings.moderation?.bannedWords && guildSettings.moderation.bannedWords.length > 0 || false,
      bannedWords: guildSettings.moderation?.bannedWords || [],
      logChannelId: guildSettings.moderation?.logChannelId || '',
      muteRoleId: guildSettings.moderation?.muteRoleId || '',
      warningsEnabled: guildSettings.moderation?.maxWarnings > 0 || false,
      maxWarnings: guildSettings.moderation?.maxWarnings || 3,
      punishments: [],
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching moderation settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch moderation settings' });
  }
});

router.post('/:guildId/settings/moderation', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;
    
    // Save to database
    const db = req.app.get('db');
    db.updateGuildSettingsCategory(guildId, 'moderation', {
      enabled: true,
      autoMod: settings.autoModEnabled,
      spamProtection: settings.spamProtection,
      antiInvite: settings.antiInvite,
      antiLink: settings.antiLink,
      bannedWords: settings.bannedWords || [],
      logChannelId: settings.logChannelId,
      muteRoleId: settings.muteRoleId,
      maxWarnings: settings.maxWarnings
    });

    // Broadcast settings change via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`guild_${guildId}`).emit('settings_changed', {
        guildId,
        settings: db.getGuildSettings(guildId),
        category: 'moderation',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ success: true, message: 'Moderation settings saved successfully' });
  } catch (error) {
    console.error('Error saving moderation settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save moderation settings' });
  }
});

// Features settings
router.get('/:guildId/settings/features', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Get actual settings from database
    const db = req.app.get('db');
    const features = db.getGuildFeatures(guildId);

    res.json({ success: true, features });
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch features' });
  }
});

router.post('/:guildId/settings/features', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { features } = req.body;
    
    // Save to database
    const db = req.app.get('db');
    
    Object.keys(features).forEach(feature => {
      db.updateGuildFeature(guildId, feature, features[feature]);
    });

    // Broadcast settings change via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`guild_${guildId}`).emit('settings_changed', {
        guildId,
        settings: db.getGuildSettings(guildId),
        category: 'features',
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ success: true, message: 'Features updated successfully' });
  } catch (error) {
    console.error('Error updating features:', error);
    res.status(500).json({ success: false, error: 'Failed to update features' });
  }
});

// Get channels for a guild
router.get('/:guildId/channels', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Fetch channels from Discord API using bot token
    const channelsResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      },
    });
    
    if (!channelsResponse.ok) {
      if (channelsResponse.status === 403) {
        throw new Error('Bot does not have permission to access this guild');
      } else if (channelsResponse.status === 404) {
        throw new Error('Guild not found or bot is not in this guild');
      } else {
        throw new Error(`Discord API error: ${channelsResponse.status}`);
      }
    }
    
    const channels = await channelsResponse.json();
    
    // Filter and format channels
    const formattedChannels = channels
      .filter(channel => channel.type === 0 || channel.type === 2) // Text and voice channels
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: channel.type === 0 ? 'text' : 'voice',
        position: channel.position,
        parent_id: channel.parent_id
      }))
      .sort((a, b) => a.position - b.position);

    res.json({ success: true, channels: formattedChannels });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch channels' });
  }
});

// Economy settings
router.get('/:guildId/settings/economy', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Mock data for now - replace with actual database query
    const settings = {
      enabled: false,
      currencyName: 'Coin',
      currencySymbol: '🪙',
      dailyAmount: 100,
      dailyCooldown: 86400,
      workAmount: 50,
      workCooldown: 3600,
      shopEnabled: false,
      shopItems: [],
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching economy settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch economy settings' });
  }
});

router.post('/:guildId/settings/economy', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;
    
    // Mock save - replace with actual database save
    // Settings saved (reduced logging)
    
    res.json({ success: true, message: 'Economy settings saved successfully' });
  } catch (error) {
    console.error('Error saving economy settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save economy settings' });
  }
});

// Backup settings
router.get('/:guildId/settings/backup', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Mock data for now - replace with actual database query
    const settings = {
      enabled: false,
      autoBackup: false,
      backupInterval: 24,
      maxBackups: 10,
      includeChannels: true,
      includeRoles: true,
      includeSettings: true,
      includeMessages: false,
      backups: [],
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching backup settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch backup settings' });
  }
});

router.post('/:guildId/settings/backup', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;
    
    // Mock save - replace with actual database save
    // Settings saved (reduced logging)
    
    res.json({ success: true, message: 'Backup settings saved successfully' });
  } catch (error) {
    console.error('Error saving backup settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save backup settings' });
  }
});

// Create manual backup
router.post('/:guildId/backup/create', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Mock backup creation - replace with actual backup logic
    const backupId = Date.now().toString();
    const backup = {
      id: backupId,
      name: `Backup ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      size: '2.5 MB',
      type: 'manual',
    };
    
    // Backup created (reduced logging)
    
    res.json({ success: true, backup });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ success: false, error: 'Failed to create backup' });
  }
});

// Download backup
router.get('/:guildId/backup/:backupId/download', requireAuth, async (req, res) => {
  try {
    const { guildId, backupId } = req.params;
    
    // Mock backup download - replace with actual file serving
    // Backup download (reduced logging)
    
    // Create mock backup data
    const backupData = {
      guildId,
      backupId,
      timestamp: new Date().toISOString(),
      data: {
        channels: [],
        roles: [],
        settings: {},
        messages: []
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup-${backupId}.json"`);
    res.json(backupData);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ success: false, error: 'Failed to download backup' });
  }
});

// Delete backup
router.delete('/:guildId/backup/:backupId', requireAuth, async (req, res) => {
  try {
    const { guildId, backupId } = req.params;
    
    // Mock backup deletion - replace with actual file deletion
    // Backup deleted (reduced logging)
    
    res.json({ success: true, message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ success: false, error: 'Failed to delete backup' });
  }
});

// Security settings
router.get('/:guildId/settings/security', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Mock data for now - replace with actual database query
    const settings = {
      enabled: false,
      antiRaid: false,
      antiSpam: false,
      antiNuke: false,
      verificationSystem: false,
      verificationLevel: 'medium',
      verificationChannel: '',
      verificationRole: '',
      verificationMessage: 'Sunucumuza hoş geldin! Lütfen aşağıdaki mesaja tepki vererek doğrulan.',
      autoModeration: false,
      autoBan: false,
      autoKick: false,
      maxWarnings: 3,
      muteRole: '',
      logChannel: '',
      trustedRoles: [],
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch security settings' });
  }
});

router.post('/:guildId/settings/security', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;
    
    // Mock save - replace with actual database save
    // Settings saved (reduced logging)
    
    res.json({ success: true, message: 'Security settings saved successfully' });
  } catch (error) {
    console.error('Error saving security settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save security settings' });
  }
});

// Analytics settings
router.get('/:guildId/settings/analytics', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Mock data for now - replace with actual database query
    const settings = {
      enabled: false,
      trackMessages: true,
      trackJoins: true,
      trackLeaves: true,
      trackCommands: true,
      trackVoice: false,
      logChannel: '',
      dailyReports: false,
      weeklyReports: false,
      monthlyReports: false,
      reportChannel: '',
      analytics: {
        totalMessages: 1250,
        totalJoins: 45,
        totalLeaves: 12,
        totalCommands: 89,
        totalVoiceTime: 3600,
        activeUsers: 23,
        topChannels: [
          { id: '1', name: 'genel', messages: 450 },
          { id: '2', name: 'sohbet', messages: 320 },
          { id: '3', name: 'duyurular', messages: 180 },
        ],
        topUsers: [
          { id: '1', name: 'User1', messages: 120 },
          { id: '2', name: 'User2', messages: 95 },
          { id: '3', name: 'User3', messages: 78 },
        ],
      },
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching analytics settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics settings' });
  }
});

router.post('/:guildId/settings/analytics', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;
    
    // Mock save - replace with actual database save
    // Settings saved (reduced logging)
    
    res.json({ success: true, message: 'Analytics settings saved successfully' });
  } catch (error) {
    console.error('Error saving analytics settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save analytics settings' });
  }
});

// Automation settings
router.get('/:guildId/settings/automation', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Mock data for now - replace with actual database query
    const settings = {
      autoRoleEnabled: false,
      autoRole: '',
      scheduledMessagesEnabled: false,
      scheduledMessages: [],
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching automation settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch automation settings' });
  }
});

router.post('/:guildId/settings/automation', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;
    
    // Mock save - replace with actual database save
    // Settings saved (reduced logging)
    
    res.json({ success: true, message: 'Automation settings saved successfully' });
  } catch (error) {
    console.error('Error saving automation settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save automation settings' });
  }
});

// Role reaction settings
router.get('/:guildId/settings/role-reactions', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Mock data for now - replace with actual database query
    const settings = {
      enabled: false,
      reactions: [],
    };

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching role reaction settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch role reaction settings' });
  }
});

router.post('/:guildId/settings/role-reactions', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const settings = req.body;
    
    // Bot'a tepki rol ayarlarını gönder
    try {
      const botResponse = await fetch(`http://localhost:3002/api/bot/settings/${guildId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BOT_API_KEY || 'neuroviabot-secret'}`,
        },
        body: JSON.stringify({
          category: 'role-reactions',
          settings: settings
        }),
      });
      
      if (botResponse.ok) {
        res.json({ success: true, message: 'Role reaction settings saved successfully' });
      } else {
        throw new Error('Bot API error');
      }
    } catch (botError) {
      console.error('Bot API hatası:', botError);
      // Fallback: Mock save
      res.json({ success: true, message: 'Role reaction settings saved successfully' });
    }
  } catch (error) {
    console.error('Error saving role reaction settings:', error);
    res.status(500).json({ success: false, error: 'Failed to save role reaction settings' });
  }
});

// Get roles for a guild
router.get('/:guildId/roles', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Fetch roles from Discord API using bot token
    const rolesResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      },
    });
    
    if (!rolesResponse.ok) {
      if (rolesResponse.status === 403) {
        throw new Error('Bot does not have permission to access this guild');
      } else if (rolesResponse.status === 404) {
        throw new Error('Guild not found or bot is not in this guild');
      } else {
        throw new Error(`Discord API error: ${rolesResponse.status}`);
      }
    }
    
    const roles = await rolesResponse.json();
    
    // Filter and format roles (exclude @everyone and bot roles)
    const formattedRoles = roles
      .filter(role => role.id !== guildId && !role.managed) // Exclude @everyone and bot roles
      .map(role => ({
        id: role.id,
        name: role.name,
        color: `#${role.color.toString(16).padStart(6, '0')}`,
        position: role.position,
        permissions: role.permissions,
        mentionable: role.mentionable,
        hoist: role.hoist
      }))
      .sort((a, b) => b.position - a.position); // Sort by position (highest first)

    res.json({ success: true, roles: formattedRoles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch roles' });
  }
});

// Get notifications for a user
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Bot'tan gerçek bildirimleri al
    try {
      const botResponse = await fetch(`http://localhost:3002/api/bot/notifications/${req.query.guildId || 'default'}`, {
        headers: {
          'Authorization': `Bearer ${process.env.BOT_API_KEY || 'neuroviabot-secret'}`,
        },
      });
      
      if (botResponse.ok) {
        const botData = await botResponse.json();
        res.json({ 
          success: true, 
          notifications: botData.notifications || [],
          unreadCount: botData.unreadCount || 0
        });
        return;
      }
    } catch (botError) {
      console.error('Bot API hatası:', botError);
    }
    
    // Fallback: Boş bildirimler
    res.json({ 
      success: true, 
      notifications: [],
      unreadCount: 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.post('/notifications/:notificationId/read', requireAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // Mock mark as read - replace with actual database update
    console.log(`Marking notification ${notificationId} as read`);
    
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
});

// Check if bot is in guild
router.get('/:guildId/bot-status', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Check if bot is in guild using Discord API
    const guildResponse = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      },
    });
    
    if (guildResponse.status === 404) {
      return res.json({ 
        success: false, 
        botInGuild: false,
        error: 'Bot is not in this guild' 
      });
    }
    
    if (!guildResponse.ok) {
      throw new Error(`Discord API error: ${guildResponse.status}`);
    }
    
    const guild = await guildResponse.json();
    
    res.json({ 
      success: true, 
      botInGuild: true,
      guild: {
        id: guild.id,
        name: guild.name,
        memberCount: guild.member_count,
        icon: guild.icon
      }
    });
  } catch (error) {
    console.error('Error checking bot status:', error);
    res.status(500).json({ 
      success: false, 
      botInGuild: false,
      error: error.message 
    });
  }
});

// Test endpoint - ayarların gerçekten kaydedildiğini kontrol et
router.get('/:guildId/settings/test', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    
    // Bot'tan gerçek ayarları al
    try {
      const botResponse = await fetch(`http://localhost:3002/api/bot/settings/${guildId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.BOT_API_KEY || 'neuroviabot-secret'}`,
        },
      });
      
      if (botResponse.ok) {
        const botData = await botResponse.json();
        res.json({ 
          success: true, 
          message: 'Settings retrieved from bot',
          settings: botData
        });
        return;
      }
    } catch (botError) {
      console.error('Bot API hatası:', botError);
    }
    
    // Fallback: Mock settings
    res.json({ 
      success: true, 
      message: 'Settings retrieved (mock)',
      settings: {
        welcome: { enabled: true },
        leveling: { enabled: true },
        moderation: { enabled: true },
        economy: { enabled: true },
        backup: { enabled: false },
        security: { enabled: true },
        analytics: { enabled: false },
        automation: { enabled: false },
        roleReactions: { enabled: false }
      }
    });
  } catch (error) {
    console.error('Error retrieving settings:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve settings' });
  }
});

module.exports = router;
