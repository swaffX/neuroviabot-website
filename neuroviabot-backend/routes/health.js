const express = require('express');
const router = express.Router();
const { getErrorDetector } = require('../utils/errorDetector');
const { getIO } = require('../socket');
const axios = require('axios');

const startTime = Date.now();
const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';

// GET /api/health - System health check
router.get('/', async (req, res) => {
  try {
    const errorDetector = getErrorDetector();
    const errorStats = errorDetector.getErrorStats();
    
    // Check database
    const db = req.app.get('db');
    const databaseStatus = db ? 'connected' : 'disconnected';
    
    // Check Socket.IO
    const io = getIO();
    const socketStatus = io ? 'active' : 'inactive';
    
    // Check bot connection
    let botStatus = 'unknown';
    try {
      const botResponse = await axios.get(`${BOT_API_URL}/api/bot/stats`, {
        timeout: 3000
      });
      botStatus = botResponse.data ? 'online' : 'offline';
    } catch (error) {
      botStatus = 'offline';
    }
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memoryMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    // Uptime
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const uptimeDays = Math.floor(uptimeSeconds / 86400);
    const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
    const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    // Overall status
    const isHealthy = databaseStatus === 'connected' && 
                      socketStatus === 'active' && 
                      errorStats.totalErrorsLastMinute < 50;
    
    const response = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: Date.now(),
      uptime: {
        seconds: uptimeSeconds,
        formatted: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`
      },
      services: {
        database: databaseStatus,
        bot: botStatus,
        socket: socketStatus
      },
      system: {
        memory: `${memoryMB}MB / ${memoryTotalMB}MB`,
        memoryUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        nodeVersion: process.version,
        platform: process.platform
      },
      errors: {
        last_hour: errorStats.totalErrorsLastMinute,
        by_type: errorStats.errorsByType,
        endpoints_with_errors: errorStats.totalEndpoints
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('[Health] Error checking health:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check system health',
      error: error.message
    });
  }
});

// GET /api/health/detailed - Detailed health information
router.get('/detailed', async (req, res) => {
  try {
    const errorDetector = getErrorDetector();
    const errorStats = errorDetector.getErrorStats();
    const recentErrors = errorDetector.getRecentErrors(20);
    
    const db = req.app.get('db');
    
    res.json({
      ...await getBasicHealth(db),
      errorStats,
      recentErrors,
      database: {
        users: db?.data?.users?.size || 0,
        guilds: db?.data?.guilds?.size || 0,
        neuroCoinBalances: db?.data?.neuroCoinBalances?.size || 0,
        marketplaceListings: db?.data?.marketplaceListings?.size || 0
      }
    });
  } catch (error) {
    console.error('[Health] Error getting detailed health:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get detailed health',
      error: error.message
    });
  }
});

async function getBasicHealth(db) {
  const memUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
  
  // Check bot
  let botStatus = 'unknown';
  try {
    const botResponse = await axios.get(`${BOT_API_URL}/api/bot/stats`, { timeout: 3000 });
    botStatus = botResponse.data ? 'online' : 'offline';
  } catch (error) {
    botStatus = 'offline';
  }
  
  return {
    status: 'healthy',
    timestamp: Date.now(),
    uptime: uptimeSeconds,
    services: {
      database: db ? 'connected' : 'disconnected',
      bot: botStatus,
      socket: getIO() ? 'active' : 'inactive'
    },
    memory: {
      used: Math.round(memUsage.heapUsed / 1024 / 1024),
      total: Math.round(memUsage.heapTotal / 1024 / 1024),
      percent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    }
  };
}

module.exports = router;

