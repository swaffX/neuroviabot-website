// ==========================================
// 🛡️ Rate Limiter Middleware
// ==========================================
// Protect API endpoints from abuse

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for developer endpoints
 * 100 requests per minute per IP (increased for real-time polling)
 */
const developerLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Increased from 10 to 100 for polling endpoints
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for local development
        if (process.env.NODE_ENV === 'development') {
            return req.ip === '::1' || req.ip === '127.0.0.1';
        }
        
        // Skip rate limiting for known developers (optional - less secure but convenient)
        const DEVELOPER_IDS = ['315875588906680330', '413081778031427584'];
        const userId = req.user?.id || req.session?.passport?.user?.id || req.session?.user?.id;
        if (userId && DEVELOPER_IDS.includes(userId)) {
            console.log(`[Rate Limiter] Bypassing for developer ${userId}`);
            return true; // Skip rate limit for developers
        }
        
        return false;
    }
});

/**
 * Rate limiter for database operations
 * 20 requests per minute (increased for developers)
 */
const databaseLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // Increased from 5 to 20
    message: {
        success: false,
        error: 'Too many database requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip for developers
        const DEVELOPER_IDS = ['315875588906680330', '413081778031427584'];
        const userId = req.user?.id || req.session?.passport?.user?.id || req.session?.user?.id;
        return userId && DEVELOPER_IDS.includes(userId);
    }
});

/**
 * Rate limiter for system control operations
 * 10 requests per minute (increased for developers)
 */
const systemControlLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Increased from 3 to 10
    message: {
        success: false,
        error: 'Too many system control requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip for developers
        const DEVELOPER_IDS = ['315875588906680330', '413081778031427584'];
        const userId = req.user?.id || req.session?.passport?.user?.id || req.session?.user?.id;
        return userId && DEVELOPER_IDS.includes(userId);
    }
});

module.exports = {
    developerLimiter,
    databaseLimiter,
    systemControlLimiter
};

