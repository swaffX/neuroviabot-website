const express = require('express');
const router = express.Router();
const axios = require('axios');

// Bot sunucusu API URL'i
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';

// Get bot stats - Bot sunucusundan direkt çek
router.get('/stats', async (req, res) => {
  try {
    console.log('[Backend API] Fetching stats from bot server:', `${BOT_API_URL}/api/bot/stats`);
    
    // Bot sunucusundan direkt stats çek
    const response = await axios.get(`${BOT_API_URL}/api/bot/stats`, {
      timeout: 5000, // 5 saniye timeout
      headers: {
        'Authorization': `Bearer ${process.env.BOT_API_KEY || 'neuroviabot-secret'}`
      },
      validateStatus: (status) => status === 200 // Sadece 200 OK kabul et
    });
    
    // Veri kontrolü
    if (response.data && response.data.guilds && response.data.users) {
      console.log('[Backend API] ✅ Valid stats from bot server:', response.data);
      res.json(response.data);
    } else {
      console.log('[Backend API] ⚠️ Invalid stats from bot server, using fallback');
      throw new Error('Invalid stats data');
    }
    
  } catch (error) {
    console.error('[Backend API] ❌ Error fetching from bot server:', error.message);
    
    // Fallback: Database'den stats al
    try {
      const db = req.app.get('db');
      const guilds = Array.from(db.data.guilds.values());
      
      let totalUsers = 0;
      guilds.forEach((guild) => {
        if (guild.memberCount) {
          totalUsers += guild.memberCount;
        }
      }); 
      
      // Sadece geçerli veri varsa gönder
      if (guilds.length > 0 && totalUsers > 0) {
        console.log('[Backend API] 📊 Using database fallback - Guilds:', guilds.length, 'Users:', totalUsers);
        
        res.json({
          guilds: guilds.length,
          users: totalUsers,
          commands: 29,
          uptime: 0,
          ping: 0,
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          source: 'database'
        });
      } else {
        // Hiç veri yoksa error döndür, frontend kendi fallback'ini kullanır
        res.status(503).json({ 
          error: 'Bot stats unavailable',
          message: 'Bot server unreachable and no database cache available'
        });
      }
    } catch (dbError) {
      console.error('[Backend API] ❌ Database fallback failed:', dbError);
      res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: 'Unable to fetch bot statistics'
      });
    }
  }
});

// Get global bot statistics (for homepage)
router.get('/stats/global', async (req, res) => {
  try {
    const db = req.app.get('db');
    
    // Calculate NRC in circulation
    let totalNRC = 0;
    if (db.data.neuroCoinBalances) {
      db.data.neuroCoinBalances.forEach((balance) => {
        totalNRC += (balance.wallet || 0) + (balance.bank || 0);
      });
    }
    
    // Count active traders (users with trade history)
    let activeTraders = 0;
    if (db.data.tradeHistory) {
      const traderSet = new Set();
      db.data.tradeHistory.forEach((trade) => {
        traderSet.add(trade.senderId);
        traderSet.add(trade.receiverId);
      });
      activeTraders = traderSet.size;
    }
    
    // Get basic stats from bot
    try {
      const botResponse = await axios.get(`${BOT_API_URL}/api/bot/stats`, {
        timeout: 3000
      });
      
      res.json({
        totalServers: botResponse.data.guilds || 0,
        totalUsers: botResponse.data.users || 0,
        totalCommands: botResponse.data.commands || 39,
        nrcInCirculation: totalNRC,
        activeTraders: activeTraders,
        uptime: botResponse.data.uptime || 0
      });
    } catch (botError) {
      // Fallback to database only
      const guilds = Array.from(db.data.guilds.values());
      let totalUsers = 0;
      guilds.forEach((guild) => {
        if (guild.memberCount) {
          totalUsers += guild.memberCount;
        }
      });
      
      res.json({
        totalServers: guilds.length,
        totalUsers: totalUsers,
        totalCommands: 39,
        nrcInCirculation: totalNRC,
        activeTraders: activeTraders,
        uptime: 0
      });
    }
  } catch (error) {
    console.error('[Global Stats] Error:', error);
    res.status(500).json({ error: 'Failed to fetch global stats' });
  }
});

// Get bot status
router.get('/status', (req, res) => {
  try {
    res.json({
      online: true,
      status: 'online',
      activities: [
        {
          name: 'with 66 servers',
          type: 0,
        },
      ],
    });
  } catch (error) {
    console.error('Error fetching bot status:', error);
    res.status(500).json({ error: 'Failed to fetch bot status' });
  }
});

// Check if bot is in a guild
router.get('/check-guild/:guildId', (req, res) => {
  const { guildId } = req.params;
  
  try {
    const db = req.app.get('db');
    const guild = db.data.guilds.get(guildId);
    const isPresent = !!guild;
    
    res.json({
      guildId,
      botPresent: isPresent,
      ...(isPresent && {
        memberCount: guild.memberCount,
        name: guild.name,
      }),
    });
  } catch (error) {
    console.error('Error checking guild:', error);
    res.status(500).json({ error: 'Failed to check guild' });
  }
});

// Batch check bot presence in multiple guilds
router.post('/check-guilds', (req, res) => {
  const { guildIds } = req.body;
  
  if (!Array.isArray(guildIds)) {
    return res.status(400).json({ error: 'guildIds must be an array' });
  }
  
  try {
    const db = req.app.get('db');
    
    const results = guildIds.map(guildId => {
      const guild = db.data.guilds.get(guildId);
      return {
        guildId,
        botPresent: !!guild,
      };
    });
    
    res.json({ results });
  } catch (error) {
    console.error('Error checking guilds:', error);
    res.status(500).json({ error: 'Failed to check guilds' });
  }
});

module.exports = router;
