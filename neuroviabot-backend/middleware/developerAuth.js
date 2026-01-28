// ==========================================
// 🔐 Developer Authentication Middleware
// ==========================================
// Sadece belirtilen developer ID'lere erişim izni verir

const DEVELOPER_IDS = ['315875588906680330', '413081778031427584'];

/**
 * Developer authentication middleware
 * Checks if user is authorized developer
 */
function requireDeveloper(req, res, next) {
    try {
        // Session'dan user bilgisini al (multiple sources)
        const userId = req.user?.id || req.session?.passport?.user?.id || req.session?.user?.id || req.headers['x-user-id'];
        
        // Debug logging
        console.log('[Dev Auth] Auth check:', {
            hasReqUser: !!req.user,
            reqUserId: req.user?.id,
            hasSession: !!req.session,
            sessionUserId: req.session?.user?.id,
            passportUserId: req.session?.passport?.user?.id,
            isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
            finalUserId: userId
        });

        if (!userId) {
            console.log('[Dev Auth] No user ID found - authentication required');
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
                message: 'You must be logged in to access this resource'
            });
        }

        // Developer ID kontrolü
        if (!DEVELOPER_IDS.includes(userId)) {
            console.log(`[Dev Auth] Unauthorized access attempt by user ${userId}`);
            return res.status(403).json({
                success: false,
                error: 'Forbidden',
                message: 'You do not have developer access',
                userId: userId,
                allowedIds: DEVELOPER_IDS
            });
        }

        console.log(`[Dev Auth] ✅ Developer access granted to ${userId}`);
        
        // Developer bilgisini request'e ekle
        req.developer = {
            id: userId,
            username: req.user?.username || req.session?.user?.username || 'Unknown'
        };

        next();
    } catch (error) {
        console.error('[Dev Auth] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            details: error.message
        });
    }
}

/**
 * Check if user is developer (without blocking)
 */
function isDeveloper(userId) {
    return DEVELOPER_IDS.includes(userId);
}

/**
 * Get developer IDs
 */
function getDeveloperIds() {
    return [...DEVELOPER_IDS];
}

module.exports = {
    requireDeveloper,
    isDeveloper,
    getDeveloperIds,
    DEVELOPER_IDS
};
