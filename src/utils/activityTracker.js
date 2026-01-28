// ==========================================
// 📊 Activity Tracker Utility
// ==========================================
// Central utility for tracking NRC activities

/**
 * Track NFT purchase activity
 * @param {object} params - Activity parameters
 */
async function trackNFTPurchase({ userId, username, serverId, serverName, itemName, itemType, amount, rarity }) {
    try {
        const io = getIO();
        if (!io) return;

        const { emitActivity } = require('../../neuroviabot-backend/socket/nrcEvents');
        
        const activity = {
            type: 'nft_purchase',
            userId,
            username,
            avatar: await getDiscordAvatar(userId),
            serverId,
            serverName,
            serverIcon: serverId ? await getServerIcon(serverId) : null,
            details: {
                itemName,
                itemType,
                rarity
            },
            amount,
            visibility: 'public'
        };

        emitActivity(io, activity);
    } catch (error) {
        console.error('[Activity Tracker] NFT Purchase error:', error);
    }
}

/**
 * Track marketplace trade activity
 * @param {object} params - Activity parameters
 */
async function trackMarketplaceTrade({ buyerId, buyerName, sellerId, sellerName, serverId, serverName, itemName, price }) {
    try {
        const io = getIO();
        if (!io) return;

        const { emitActivity } = require('../../neuroviabot-backend/socket/nrcEvents');
        
        const activity = {
            type: 'marketplace_trade',
            userId: buyerId,
            username: buyerName,
            avatar: await getDiscordAvatar(buyerId),
            serverId,
            serverName,
            serverIcon: serverId ? await getServerIcon(serverId) : null,
            details: {
                buyerId,
                buyerName,
                sellerId,
                sellerName,
                itemName
            },
            amount: price,
            visibility: 'public'
        };

        emitActivity(io, activity);
    } catch (error) {
        console.error('[Activity Tracker] Marketplace Trade error:', error);
    }
}

/**
 * Track premium activation
 * @param {object} params - Activity parameters
 */
async function trackPremiumActivation({ userId, username, serverId, serverName, tier, duration, cost }) {
    try {
        const io = getIO();
        if (!io) return;

        const { emitActivity } = require('../../neuroviabot-backend/socket/nrcEvents');
        
        const activity = {
            type: 'premium_activated',
            userId,
            username,
            avatar: await getDiscordAvatar(userId),
            serverId,
            serverName,
            serverIcon: serverId ? await getServerIcon(serverId) : null,
            details: {
                tier,
                duration
            },
            amount: cost,
            visibility: 'public'
        };

        emitActivity(io, activity);
    } catch (error) {
        console.error('[Activity Tracker] Premium Activation error:', error);
    }
}

/**
 * Track investment creation
 * @param {object} params - Activity parameters
 */
async function trackInvestment({ userId, username, amount, duration, apy }) {
    try {
        const io = getIO();
        if (!io) return;

        const { emitActivity } = require('../../neuroviabot-backend/socket/nrcEvents');
        
        const activity = {
            type: 'investment_created',
            userId,
            username,
            avatar: await getDiscordAvatar(userId),
            details: {
                duration,
                apy
            },
            amount,
            visibility: 'public'
        };

        emitActivity(io, activity);
    } catch (error) {
        console.error('[Activity Tracker] Investment error:', error);
    }
}

/**
 * Track game win (big wins only > 1000 NRC)
 * @param {object} params - Activity parameters
 */
async function trackGameWin({ userId, username, game, winAmount, multiplier }) {
    try {
        // Only track big wins (> 1000 NRC)
        if (winAmount < 1000) return;

        const io = getIO();
        if (!io) return;

        const { emitActivity } = require('../../neuroviabot-backend/socket/nrcEvents');
        
        const activity = {
            type: 'game_win',
            userId,
            username,
            avatar: await getDiscordAvatar(userId),
            details: {
                game,
                multiplier
            },
            amount: winAmount,
            visibility: 'public'
        };

        emitActivity(io, activity);
    } catch (error) {
        console.error('[Activity Tracker] Game Win error:', error);
    }
}

/**
 * Track quest completion (high-value only > 500 NRC)
 * @param {object} params - Activity parameters
 */
async function trackQuestCompletion({ userId, username, questName, reward }) {
    try {
        // Only track high-value quests (> 500 NRC)
        if (reward < 500) return;

        const io = getIO();
        if (!io) return;

        const { emitActivity } = require('../../neuroviabot-backend/socket/nrcEvents');
        
        const activity = {
            type: 'quest_completed',
            userId,
            username,
            avatar: await getDiscordAvatar(userId),
            details: {
                questName
            },
            amount: reward,
            visibility: 'public'
        };

        emitActivity(io, activity);
    } catch (error) {
        console.error('[Activity Tracker] Quest Completion error:', error);
    }
}

/**
 * Get Socket.IO instance
 */
function getIO() {
    try {
        const { getIO } = require('../../neuroviabot-backend/socket');
        return getIO();
    } catch (error) {
        return null;
    }
}

/**
 * Get Discord avatar URL
 * @param {string} userId - User ID
 * @returns {string} Avatar URL
 */
async function getDiscordAvatar(userId) {
    try {
        const client = global.discordClient;
        if (!client) {
            return `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`;
        }

        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) {
            return `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`;
        }

        return user.displayAvatarURL({ format: 'png', size: 128 });
    } catch (error) {
        return `https://cdn.discordapp.com/embed/avatars/0.png`;
    }
}

/**
 * Get server icon URL
 * @param {string} serverId - Server ID
 * @returns {string|null} Icon URL
 */
async function getServerIcon(serverId) {
    try {
        const client = global.discordClient;
        if (!client) return null;

        const guild = await client.guilds.fetch(serverId).catch(() => null);
        if (!guild) return null;

        return guild.iconURL({ format: 'png', size: 64 });
    } catch (error) {
        return null;
    }
}

module.exports = {
    trackNFTPurchase,
    trackMarketplaceTrade,
    trackPremiumActivation,
    trackInvestment,
    trackGameWin,
    trackQuestCompletion
};

