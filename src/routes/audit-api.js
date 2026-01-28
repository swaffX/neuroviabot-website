// ==========================================
// 📋 Audit Log API Routes
// ==========================================

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/simple-db');

// Get audit logs for a guild
router.get('/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { page = 1, limit = 50, type, userId, startDate, endDate } = req.query;
        
        const db = getDatabase();
        
        const filters = {};
        if (type) filters.type = type;
        if (userId) filters.userId = userId;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        
        filters.page = parseInt(page);
        filters.limit = parseInt(limit);
        
        const result = db.getAuditLogs(guildId, filters);
        
        // Transform logs to match frontend format
        const transformedLogs = result.logs.map(log => {
            // Extract executor info
            const executorId = log.executor?.id || log.userId || 'System';
            const executorUsername = log.executor?.username || log.username || 'Unknown User';
            const executorAvatar = log.executor?.avatar || log.avatar || null;
            
            return {
                id: log.id,
                type: log.action || log.type,
                userId: executorId,
                targetId: log.target?.id || log.targetId || null,
                action: log.action ? formatActionName(log.action) : (log.action || 'Unknown Action'),
                details: {
                    executor: log.executor,
                    target: log.target,
                    changes: log.changes || {},
                    reason: log.reason,
                },
                severity: getSeverity(log.action || log.type),
                timestamp: log.timestamp,
                username: executorUsername,
                avatar: executorAvatar,
            };
        });
        
        res.json({
            success: true,
            logs: transformedLogs,
            total: result.total,
            page: result.page,
            totalPages: result.totalPages,
            limit: result.limit
        });
        
    } catch (error) {
        console.error('Audit logs getirme hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Helper function to format action names
function formatActionName(action) {
    const actionNames = {
        'ROLE_CREATE': 'Rol Oluşturuldu',
        'ROLE_UPDATE': 'Rol Güncellendi',
        'ROLE_DELETE': 'Rol Silindi',
        'CHANNEL_CREATE': 'Kanal Oluşturuldu',
        'CHANNEL_UPDATE': 'Kanal Güncellendi',
        'CHANNEL_DELETE': 'Kanal Silindi',
        'MEMBER_BAN': 'Üye Yasaklandı',
        'MEMBER_KICK': 'Üye Atıldı',
        'MEMBER_UPDATE': 'Üye Güncellendi',
        'MEMBER_JOIN': 'Üye Katıldı',
        'MEMBER_LEAVE': 'Üye Ayrıldı',
        'MEMBER_UNBAN': 'Yasak Kaldırıldı',
        'SETTINGS_CHANGE': 'Ayarlar Değiştirildi',
        'MESSAGE_DELETE': 'Mesaj Silindi',
        'MESSAGE_BULK_DELETE': 'Toplu Mesaj Silindi',
        'GUILD_UPDATE': 'Sunucu Güncellendi',
    };
    return actionNames[action] || action;
}

// Helper function to get severity
function getSeverity(action) {
    const dangerActions = ['ROLE_DELETE', 'CHANNEL_DELETE', 'MEMBER_BAN', 'MESSAGE_BULK_DELETE'];
    const warningActions = ['ROLE_UPDATE', 'CHANNEL_UPDATE', 'MEMBER_KICK', 'SETTINGS_CHANGE', 'MEMBER_UPDATE', 'GUILD_UPDATE'];
    const successActions = ['ROLE_CREATE', 'CHANNEL_CREATE', 'MEMBER_JOIN', 'MEMBER_UNBAN'];
    
    if (dangerActions.includes(action)) return 'danger';
    if (warningActions.includes(action)) return 'warning';
    if (successActions.includes(action)) return 'success';
    return 'info';
}

// Export audit logs
router.get('/:guildId/export', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { format = 'json' } = req.query;
        
        const db = getDatabase();
        const result = db.getAuditLogs(guildId, { limit: 10000 });
        
        if (format === 'csv') {
            // Convert to CSV
            let csv = 'ID,Action,Type,User ID,Target ID,Timestamp,Details\n';
            
            result.logs.forEach(log => {
                const details = JSON.stringify(log.details).replace(/"/g, '""');
                csv += `"${log.id}","${log.action}","${log.type}","${log.userId}","${log.targetId || ''}","${log.timestamp}","${details}"\n`;
            });
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="audit-log-${guildId}.csv"`);
            res.send(csv);
        } else {
            // JSON format
            res.json({
                success: true,
                logs: result.logs,
                exported: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('Audit logs export hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Clear old audit logs (older than X days)
router.delete('/:guildId/cleanup', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { days = 90 } = req.query;
        
        const db = getDatabase();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
        
        db.cleanupOldAuditLogs(cutoffDate);
        
        res.json({
            success: true,
            message: `Audit logs older than ${days} days cleaned up`
        });
        
    } catch (error) {
        console.error('Audit logs cleanup hatası:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;

