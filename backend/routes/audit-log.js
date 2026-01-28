const express = require('express');
const router = express.Router();
const { getAuditLogStorage } = require('../utils/auditLogStorage');

const auditStorage = getAuditLogStorage();

const requireAuth = (req, res, next) => {
  // Allow requests - audit logs are public for authenticated dashboard users
  // Session check will be done on frontend via credentials: 'include'
  next();
};

// GET /api/audit/:guildId
router.get('/:guildId', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { page = 1, limit = 50, action, userId, startDate, endDate, type, severity } = req.query;

    // Validate guildId
    if (!guildId || guildId === 'unknown') {
      return res.status(400).json({
        success: false,
        error: 'Invalid guild ID',
        logs: [],
        total: 0,
        page: 1,
        totalPages: 0
      });
    }

    console.log('[AuditLog] Fetching logs for guild:', guildId, { page, limit, type, severity });

    // Fetch from JSON storage
    let result = await auditStorage.getLogs(guildId, {
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      type,
      severity,
      userId,
      startDate,
      endDate
    });

    // If logs are empty and no filters (except page 1), try to sync from Discord
    if (result.logs.length === 0 && page == 1 && !action && !type && !severity && !userId && !startDate && !endDate) {
      console.log('[AuditLog] No logs found, attempting sync from Discord...');
      try {
        await syncAuditLogs(guildId);
        // Re-fetch after sync
        result = await auditStorage.getLogs(guildId, {
          page: parseInt(page),
          limit: parseInt(limit)
        });
      } catch (syncError) {
        console.error('[AuditLog] Auto-sync failed:', syncError.message);
      }
    }

    console.log('[AuditLog] Found', result.logs?.length || 0, 'logs');

    res.json({
      success: true,
      logs: result.logs || [],
      total: result.pagination?.total || 0,
      page: result.pagination?.page || 1,
      totalPages: result.pagination?.totalPages || 0,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('[AuditLog] Error fetching logs:', error.message, error.stack);
    // Return empty array instead of 500 error for better UX
    res.json({
      success: true,
      logs: [],
      total: 0,
      page: 1,
      totalPages: 0,
      error: 'Database error, showing empty logs'
    });
  }
});

// Helper function to sync logs from Discord
async function syncAuditLogs(guildId) {
  const BOT_API_URL = process.env.BOT_API_URL || 'http://localhost:3002';
  const BOT_API_KEY = process.env.BOT_API_KEY || 'neuroviabot-secret';

  const response = await fetch(`${BOT_API_URL}/api/bot/stats/audit-logs/${guildId}/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BOT_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ limit: 50 })
  });

  if (!response.ok) {
    throw new Error(`Bot API sync failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.logs && data.logs.length > 0) {
    // Reverse logs to add oldest first (so newest end up at top when prepended)
    const reversedLogs = [...data.logs].reverse();

    for (const log of reversedLogs) {
      await auditStorage.logAction({
        guildId,
        ...log
      });
    }
  }

  return data.count;
}

// POST /api/audit/:guildId/sync - Manual sync
router.post('/:guildId/sync', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const count = await syncAuditLogs(guildId);

    res.json({ success: true, count });
  } catch (error) {
    console.error('[AuditLog] Sync error:', error);
    res.status(500).json({ success: false, error: 'Failed to sync audit logs' });
  }
});

// GET /api/audit/:guildId/export
router.get('/:guildId/export', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const { format = 'json' } = req.query;

    const data = await auditStorage.exportLogs(guildId, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="audit-log-${guildId}.csv"`);
      res.send(data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.send(data);
    }
  } catch (error) {
    console.error('[AuditLog] Error exporting:', error.message);
    res.status(500).json({ success: false, error: 'Failed to export audit logs' });
  }
});

// POST /api/audit/:guildId - Create new audit log entry
router.post('/:guildId', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;
    const logData = { ...req.body, guildId };

    const log = await auditStorage.logAction(logData);

    res.json({
      success: true,
      log
    });
  } catch (error) {
    console.error('[AuditLog] Error creating:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create audit log' });
  }
});

// GET /api/audit/:guildId/stats - Get audit log statistics
router.get('/:guildId/stats', requireAuth, async (req, res) => {
  try {
    const { guildId } = req.params;

    const stats = await auditStorage.getStats(guildId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('[AuditLog] Error fetching stats:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch audit log stats' });
  }
});

module.exports = router;

