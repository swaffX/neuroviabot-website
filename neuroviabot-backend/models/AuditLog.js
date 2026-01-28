const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    index: true,
    enum: [
      'MEMBER_JOIN',
      'MEMBER_LEAVE',
      'MEMBER_BAN',
      'MEMBER_KICK',
      'ROLE_CREATE',
      'ROLE_UPDATE',
      'ROLE_DELETE',
      'CHANNEL_CREATE',
      'CHANNEL_UPDATE',
      'CHANNEL_DELETE',
      'SETTINGS_CHANGE',
      'MESSAGE_DELETE',
      'GUILD_UPDATE',
      'OTHER'
    ]
  },
  action: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String
  },
  avatar: {
    type: String
  },
  targetId: {
    type: String
  },
  severity: {
    type: String,
    required: true,
    enum: ['info', 'warning', 'danger', 'success'],
    default: 'info'
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  executor: {
    id: String,
    username: String,
    discriminator: String,
    bot: { type: Boolean, default: false }
  },
  target: {
    id: String,
    username: String,
    type: {
      type: String,
      enum: ['user', 'channel', 'role', 'message', 'guild', 'other']
    }
  },
  changes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  reason: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ guildId: 1, timestamp: -1 });
auditLogSchema.index({ guildId: 1, action: 1, timestamp: -1 });
auditLogSchema.index({ 'executor.id': 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }); // For cleanup queries

// Static method to log an action
auditLogSchema.statics.logAction = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('[AuditLog] Failed to save:', error);
    throw error;
  }
};

// Static method to get logs with pagination
auditLogSchema.statics.getLogs = async function(guildId, options = {}) {
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

  const query = { guildId };

  if (action) query.action = action;
  if (type) query.type = type;
  if (severity) query.severity = severity;
  if (userId) {
    // Check both old format (executor.id) and new format (userId)
    query.$or = [
      { userId },
      { 'executor.id': userId }
    ];
  }
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  try {
    const [logs, total] = await Promise.all([
      this.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.countDocuments(query)
    ]);
    
    // Transform logs to match frontend expectations
    const transformedLogs = logs.map(log => ({
      id: log._id.toString(),
      type: log.type || 'OTHER',
      userId: log.userId || log.executor?.id || 'unknown',
      username: log.username || log.executor?.username || 'Unknown',
      avatar: log.avatar || log.executor?.avatar || null,
      targetId: log.targetId || log.target?.id,
      action: log.action,
      details: log.details || log.metadata || {},
      severity: log.severity || 'info',
      timestamp: log.timestamp || log.createdAt
    }));

    return {
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('[AuditLog] Error in getLogs:', error);
    throw error;
  }
};

// Static method to cleanup old logs (optional, for data retention)
auditLogSchema.statics.cleanupOldLogs = async function(daysToKeep = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await this.deleteMany({
    timestamp: { $lt: cutoffDate }
  });

  console.log(`[AuditLog] Cleaned up ${result.deletedCount} old logs`);
  return result.deletedCount;
};

// Export stats for a guild
auditLogSchema.statics.getStats = async function(guildId) {
  const stats = await this.aggregate([
    { $match: { guildId } },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = await this.countDocuments({ guildId });

  return {
    total,
    byAction: stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  };
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
