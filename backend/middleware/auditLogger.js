// ==========================================
// 📝 Audit Logger Middleware
// ==========================================
// Log all developer actions for security

const fs = require('fs');
const path = require('path');

const AUDIT_LOG_PATH = path.join(__dirname, '..', 'logs', 'audit.log');

// Ensure logs directory exists
const logsDir = path.dirname(AUDIT_LOG_PATH);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log audit entry
 */
function logAudit(entry) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        ...entry
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
        fs.appendFileSync(AUDIT_LOG_PATH, logLine);
    } catch (error) {
        console.error('[Audit Logger] Failed to write audit log:', error);
    }
}

/**
 * Middleware to log developer actions
 */
function auditLoggerMiddleware(req, res, next) {
    const userId = req.session?.user?.id || req.headers['x-user-id'];
    const originalSend = res.send;

    // Capture response
    res.send = function (data) {
        const entry = {
            userId,
            ip: req.ip || req.connection.remoteAddress,
            method: req.method,
            path: req.path,
            body: req.body,
            statusCode: res.statusCode,
            response: typeof data === 'string' ? JSON.parse(data) : data
        };

        logAudit(entry);
        
        return originalSend.call(this, data);
    };

    next();
}

/**
 * Get recent audit logs
 */
function getAuditLogs(limit = 100) {
    try {
        if (!fs.existsSync(AUDIT_LOG_PATH)) {
            return [];
        }

        const logs = fs.readFileSync(AUDIT_LOG_PATH, 'utf8')
            .split('\n')
            .filter(line => line.trim())
            .slice(-limit)
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(log => log !== null);

        return logs;
    } catch (error) {
        console.error('[Audit Logger] Failed to read audit logs:', error);
        return [];
    }
}

module.exports = {
    logAudit,
    auditLoggerMiddleware,
    getAuditLogs
};

