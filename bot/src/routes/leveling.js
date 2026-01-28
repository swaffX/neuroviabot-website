const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

// Client reference
let client = null;

function setClient(clientInstance) {
    client = clientInstance;
}

// Bot API authentication
const authenticateBotApi = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== (process.env.BOT_API_KEY || 'neuroviabot-secret')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
};

// Helper function to calculate level from XP
function calculateLevel(xp) {
    // Formula: level = floor(sqrt(xp / 100))
    return Math.floor(Math.sqrt(xp / 100));
}

// Helper function to calculate XP needed for next level
function xpForNextLevel(level) {
    return Math.pow(level + 1, 2) * 100;
}

// GET /api/bot/leveling/:guildId/users - Get all user levels in guild
router.get('/:guildId/users', authenticateBotApi, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        
        const db = getDatabase();
        const userLevels = db.getUserLevels(guildId);
        
        if (!userLevels || userLevels.size === 0) {
            return res.json({
                success: true,
                users: [],
                total: 0,
                page: parseInt(page),
                limit: parseInt(limit)
            });
        }
        
        // Convert to array and add calculated fields
        const usersArray = Array.from(userLevels.entries()).map(([userId, data]) => {
            const level = calculateLevel(data.xp);
            const nextLevelXP = xpForNextLevel(level);
            const currentLevelXP = level > 0 ? xpForNextLevel(level - 1) : 0;
            const progress = ((data.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
            
            return {
                userId,
                xp: data.xp,
                level,
                nextLevelXP,
                progress: Math.round(progress),
                lastMessageAt: data.lastMessageAt || null
            };
        });
        
        // Sort by XP (descending)
        usersArray.sort((a, b) => b.xp - a.xp);
        
        // Paginate
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = usersArray.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            users: paginatedUsers,
            total: usersArray.length,
            page: parseInt(page),
            limit: parseInt(limit)
        });
        
    } catch (error) {
        logger.error('Error fetching guild users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/bot/leveling/:guildId/user/:userId - Get specific user level
router.get('/:guildId/user/:userId', authenticateBotApi, async (req, res) => {
    try {
        const { guildId, userId } = req.params;
        
        const db = getDatabase();
        const userLevel = db.getUserLevel(guildId, userId);
        
        if (!userLevel) {
            return res.json({
                success: true,
                userId,
                xp: 0,
                level: 0,
                nextLevelXP: 100,
                progress: 0,
                rank: null
            });
        }
        
        const level = calculateLevel(userLevel.xp);
        const nextLevelXP = xpForNextLevel(level);
        const currentLevelXP = level > 0 ? xpForNextLevel(level - 1) : 0;
        const progress = ((userLevel.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        
        // Calculate rank
        const allUsers = db.getUserLevels(guildId);
        const sortedUsers = Array.from(allUsers.entries())
            .sort((a, b) => b[1].xp - a[1].xp);
        const rank = sortedUsers.findIndex(([id]) => id === userId) + 1;
        
        res.json({
            success: true,
            userId,
            xp: userLevel.xp,
            level,
            nextLevelXP,
            currentLevelXP,
            progress: Math.round(progress),
            rank: rank || null,
            totalUsers: allUsers.size,
            lastMessageAt: userLevel.lastMessageAt || null
        });
        
    } catch (error) {
        logger.error('Error fetching user level:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/bot/leveling/:guildId/leaderboard - Top users
router.get('/:guildId/leaderboard', authenticateBotApi, async (req, res) => {
    try {
        const { guildId } = req.params;
        const { limit = 100 } = req.query;
        
        const db = getDatabase();
        const userLevels = db.getUserLevels(guildId);
        
        if (!userLevels || userLevels.size === 0) {
            return res.json({
                success: true,
                leaderboard: []
            });
        }
        
        // Get guild to fetch user info
        const guild = client ? client.guilds.cache.get(guildId) : null;
        
        // Convert to array and add calculated fields
        const usersArray = await Promise.all(
            Array.from(userLevels.entries()).map(async ([userId, data]) => {
                const level = calculateLevel(data.xp);
                const nextLevelXP = xpForNextLevel(level);
                const currentLevelXP = level > 0 ? xpForNextLevel(level - 1) : 0;
                const progress = ((data.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
                
                // Try to get user info
                let username = 'Unknown User';
                let avatar = null;
                
                if (guild) {
                    try {
                        const member = await guild.members.fetch(userId).catch(() => null);
                        if (member) {
                            username = member.user.username;
                            avatar = member.user.displayAvatarURL({ format: 'png', size: 128 });
                        }
                    } catch (err) {
                        // User not in guild anymore
                    }
                }
                
                return {
                    userId,
                    username,
                    avatar,
                    xp: data.xp,
                    level,
                    nextLevelXP,
                    progress: Math.round(progress)
                };
            })
        );
        
        // Sort by XP (descending) and limit
        usersArray.sort((a, b) => b.xp - a.xp);
        const leaderboard = usersArray.slice(0, parseInt(limit)).map((user, index) => ({
            ...user,
            rank: index + 1
        }));
        
        res.json({
            success: true,
            leaderboard
        });
        
    } catch (error) {
        logger.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/bot/leveling/:guildId/user/:userId/reset - Reset user XP
router.post('/:guildId/user/:userId/reset', authenticateBotApi, async (req, res) => {
    try {
        const { guildId, userId } = req.params;
        
        const db = getDatabase();
        db.resetUserLevel(guildId, userId);
        
        logger.info(`[Leveling] Reset XP for user ${userId} in guild ${guildId}`);
        
        res.json({
            success: true,
            message: 'User XP reset successfully'
        });
        
    } catch (error) {
        logger.error('Error resetting user XP:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = { router, setClient };

