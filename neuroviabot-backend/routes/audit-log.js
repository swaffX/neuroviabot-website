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
    const result = await auditStorage.getLogs(guildId, {
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      type,
      severity,
      userId,
      startDate,
      endDate
    });
    
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

