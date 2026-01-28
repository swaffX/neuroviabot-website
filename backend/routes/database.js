// ==========================================
// Database Status & Info Routes
// ==========================================

const express = require('express');
const router = express.Router();
const { isMongoConnected, getConnectionStats, getDatabaseStats } = require('../config/database');
const { getDatabase } = require('../database/simple-db');
const { checkDatabaseHealth } = require('../config/db-init');

/**
 * GET /api/database/status
 * Get database connection status and statistics
 */
router.get('/status', async (req, res) => {
  try {
    const simpleDb = getDatabase();
    const mongoConnected = isMongoConnected();
    
    // Get MongoDB stats if connected
    let mongoStats = null;
    if (mongoConnected) {
      mongoStats = await getDatabaseStats();
    }
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      databases: {
        simpleDB: {
          active: true,
          path: simpleDb.dbPath,
          stats: {
            guilds: simpleDb.data.guilds?.size || 0,
            users: simpleDb.data.users?.size || 0,
            activityFeed: simpleDb.data.activityFeed?.size || 0,
          }
        },
        mongodb: mongoConnected ? {
          active: true,
          ...getConnectionStats(),
          documentStats: mongoStats
        } : {
          active: false,
          message: 'MongoDB not connected'
        }
      },
      primaryDatabase: mongoConnected ? 'MongoDB Atlas' : 'SimpleDB (JSON)'
    };

    res.json(response);
  } catch (error) {
    console.error('[Database Status] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get database status'
    });
  }
});

/**
 * GET /api/database/health
 * Quick health check endpoint
 */
router.get('/health', async (req, res) => {
  const mongoConnected = isMongoConnected();
  const simpleDbActive = true; // SimpleDB is always active
  
  // Check MongoDB health if connected
  let mongoHealth = null;
  if (mongoConnected) {
    mongoHealth = await checkDatabaseHealth();
  }
  
  if (mongoConnected || simpleDbActive) {
    res.json({
      success: true,
      status: 'healthy',
      mongodb: mongoConnected ? {
        connected: true,
        healthy: mongoHealth?.healthy || false,
        message: mongoHealth?.message || 'OK'
      } : {
        connected: false,
        healthy: false,
        message: 'Not connected'
      },
      simpledb: {
        active: true,
        healthy: true,
        message: 'OK'
      }
    });
  } else {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'No database connection available'
    });
  }
});

module.exports = router;

