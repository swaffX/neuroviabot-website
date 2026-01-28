const fs = require('fs').promises;
const path = require('path');

class AuditLogStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '../data/audit-logs');
    this.maxLogsPerGuild = 1000; // Maximum logs to keep per guild
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      this.initialized = true;
      console.log('[AuditLog] Storage initialized:', this.dataDir);
    } catch (error) {
      console.error('[AuditLog] Failed to initialize storage:', error);
      throw error;
    }
  }

  getFilePath(guildId) {
    return path.join(this.dataDir, `${guildId}.json`);
  }

  async readGuildLogs(guildId) {
    try {
      const filePath = this.getFilePath(guildId);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { guildId, logs: [] };
      }
      throw error;
    }
  }

  async writeGuildLogs(guildId, logs) {
    const filePath = this.getFilePath(guildId);
    await fs.writeFile(filePath, JSON.stringify({ guildId, logs }, null, 2));
  }

  async logAction(logData) {
    await this.init();

    const { guildId } = logData;
    if (!guildId) {
      throw new Error('guildId is required');
    }

    // Read existing logs
    const guildData = await this.readGuildLogs(guildId);

    // Check for duplicates if ID exists
    if (logData.id) {
      const exists = guildData.logs.some(log => log.id === logData.id);
      if (exists) {
        // console.log(`[AuditLog] Skipping duplicate log: ${logData.id}`);
        return null; // Skip if already exists
      }
    }

    // Create new log entry
    const logEntry = {
      id: logData.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: logData.type || 'OTHER',
      action: logData.action,
      userId: logData.userId || logData.executor?.id || 'unknown',
      username: logData.username || logData.executor?.username || 'Unknown',
      avatar: logData.avatar || logData.executor?.avatar || null,
      targetId: logData.targetId || logData.target?.id,
      severity: logData.severity || 'info',
      details: logData.details || logData.metadata || {},
      executor: logData.executor,
      target: logData.target,
      changes: logData.changes,
      reason: logData.reason,
      timestamp: logData.timestamp || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Add to logs array
    guildData.logs.unshift(logEntry); // Add to beginning

    // Sort by timestamp just in case
    guildData.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Keep only the most recent logs
    if (guildData.logs.length > this.maxLogsPerGuild) {
      guildData.logs = guildData.logs.slice(0, this.maxLogsPerGuild);
    }

    // Write back to file
    await this.writeGuildLogs(guildId, guildData.logs);

    return logEntry;
  }

  async getLogs(guildId, options = {}) {
    await this.init();

    const {
      page = 1,
      limit = 50,
      action,
      type,
      severity,
      userId,
      startDate,
      endDate
    } = options;

    // Read all logs for guild
    const guildData = await this.readGuildLogs(guildId);
    let logs = guildData.logs || [];

    // --- SELF-HEALING: Remove duplicates based on ID ---
    const seenIds = new Set();
    const uniqueLogs = [];
    let hasDuplicates = false;

    for (const log of logs) {
      if (!seenIds.has(log.id)) {
        seenIds.add(log.id);
        uniqueLogs.push(log);
      } else {
        hasDuplicates = true;
      }
    }

    if (hasDuplicates) {
      console.log(`[AuditLog] Removing duplicates for guild ${guildId} (Original: ${logs.length}, Unique: ${uniqueLogs.length})`);
      logs = uniqueLogs;
      // Save flattened/cleaned logs back to storage asynchronously to fix the file
      this.writeGuildLogs(guildId, logs).catch(err => console.error('Error rewriting cleaned logs:', err));
    }
    // ---------------------------------------------------

    // Apply filters
    if (action) {
      logs = logs.filter(log => log.action === action);
    }
    if (type) {
      logs = logs.filter(log => log.type === type);
    }
    if (severity) {
      logs = logs.filter(log => log.severity === severity);
    }
    if (userId) {
      logs = logs.filter(log =>
        log.userId === userId || log.executor?.id === userId
      );
    }
    if (startDate) {
      const start = new Date(startDate);
      logs = logs.filter(log => new Date(log.timestamp) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      logs = logs.filter(log => new Date(log.timestamp) <= end);
    }

    // Calculate pagination
    const total = logs.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedLogs = logs.slice(skip, skip + limit);

    return {
      logs: paginatedLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    };
  }

  async getStats(guildId) {
    await this.init();

    const guildData = await this.readGuildLogs(guildId);
    const logs = guildData.logs || [];

    // Count by action
    const byAction = {};
    logs.forEach(log => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
    });

    // Count by type
    const byType = {};
    logs.forEach(log => {
      byType[log.type] = (byType[log.type] || 0) + 1;
    });

    // Count by severity
    const bySeverity = {};
    logs.forEach(log => {
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
    });

    return {
      total: logs.length,
      byAction,
      byType,
      bySeverity
    };
  }

  async cleanupOldLogs(daysToKeep = 90) {
    await this.init();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let totalDeleted = 0;

    // Read all guild files
    const files = await fs.readdir(this.dataDir);

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const guildId = file.replace('.json', '');
      const guildData = await this.readGuildLogs(guildId);

      const originalCount = guildData.logs.length;
      guildData.logs = guildData.logs.filter(log =>
        new Date(log.timestamp) >= cutoffDate
      );

      const deletedCount = originalCount - guildData.logs.length;
      if (deletedCount > 0) {
        await this.writeGuildLogs(guildId, guildData.logs);
        totalDeleted += deletedCount;
      }
    }

    console.log(`[AuditLog] Cleaned up ${totalDeleted} old logs`);
    return totalDeleted;
  }

  async exportLogs(guildId, format = 'json') {
    await this.init();

    const guildData = await this.readGuildLogs(guildId);
    const logs = guildData.logs || [];

    if (format === 'csv') {
      // Convert to CSV
      const headers = ['ID', 'Type', 'Action', 'User', 'Target', 'Severity', 'Timestamp'];
      const rows = logs.map(log => [
        log.id,
        log.type,
        log.action,
        log.username,
        log.targetId || '',
        log.severity,
        log.timestamp
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      return csv;
    }

    // Default: JSON format
    return JSON.stringify(logs, null, 2);
  }
}

// Singleton instance
let instance = null;

function getAuditLogStorage() {
  if (!instance) {
    instance = new AuditLogStorage();
  }
  return instance;
}

module.exports = {
  getAuditLogStorage,
  AuditLogStorage
};
