// ==========================================
// 💎 NRC Socket.IO Events
// ==========================================
// Real-time events for NRC system

/**
 * Initialize NRC-related Socket.IO events
 * @param {Server} io - Socket.IO server instance
 */
function initNrcEvents(io) {
    console.log('[NRC Socket] Initializing NRC event listeners...');

    // These are emitted by the bot to notify frontend
    // Frontend listens to these events for real-time updates

    // Event naming convention: nrc_<action>
    // Example: nrc_balance_updated, nrc_nft_purchased, etc.

    // Start price update interval (every 30 seconds)
    startPriceUpdateInterval(io);

    console.log('[NRC Socket] NRC event listeners initialized');
}

/**
 * Start interval for price updates
 * Updates price every 30 seconds and broadcasts to all clients
 * @param {Server} io - Socket.IO instance
 */
function startPriceUpdateInterval(io) {
    const nrcRoutes = require('../routes/nrc');

    // Update price immediately
    updateAndBroadcastPrice(io, nrcRoutes);

    // Then update every 30 seconds
    setInterval(() => {
        updateAndBroadcastPrice(io, nrcRoutes);
    }, 30000); // 30 seconds

    console.log('[NRC Socket] Price update interval started (30s)');
}

/**
 * Calculate new price and broadcast to clients
 * @param {Server} io - Socket.IO instance
 * @param {object} nrcRoutes - NRC routes module with price functions
 */
function updateAndBroadcastPrice(io, nrcRoutes) {
    try {
        // Calculate new price
        const newPrice = nrcRoutes.calculateDynamicPrice();
        const oldPrice = nrcRoutes.getCurrentPrice();

        // Update current price
        nrcRoutes.setCurrentPrice(newPrice);

        // Update price history
        nrcRoutes.updatePriceHistory(newPrice);

        // Calculate change
        const change = newPrice - oldPrice;
        const changePercent = oldPrice > 0 ? (change / oldPrice) * 100 : 0;

        // Broadcast to all connected clients
        io.emit('nrc_price_updated', {
            price: parseFloat(newPrice.toFixed(4)),
            change: parseFloat(change.toFixed(4)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            timestamp: new Date().toISOString()
        });

        console.log(`[NRC Price] Updated: $${newPrice.toFixed(4)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`);
    } catch (error) {
        console.error('[NRC Price] Error updating price:', error);
    }
}

/**
 * Emit activity to live feed
 * @param {Server} io - Socket.IO instance
 * @param {object} activity - Activity data
 */
function emitActivity(io, activity) {
    const { getDatabase } = require('../database/simple-db');
    const db = getDatabase();

    // Generate activity ID
    const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in database
    const activityData = {
        ...activity,
        activityId,
        timestamp: activity.timestamp || new Date().toISOString()
    };

    db.data.activityFeed.set(activityId, activityData);

    // Keep only last 1000 activities
    const activities = Array.from(db.data.activityFeed.entries());
    if (activities.length > 1000) {
        // Sort by timestamp and remove oldest
        activities.sort((a, b) => new Date(b[1].timestamp) - new Date(a[1].timestamp));
        activities.slice(1000).forEach(([id]) => db.data.activityFeed.delete(id));
    }

    db.saveData();

    // Broadcast to all connected clients
    io.emit('nrc_activity', activityData);

    console.log(`[NRC Activity] ${activity.type} - ${activity.userId || 'Unknown'}`);
}

/**
 * Emit balance update to specific user
 * @param {Server} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {object} balance - New balance
 */
function emitBalanceUpdate(io, userId, balance) {
    io.emit('nrc_balance_updated', {
        userId,
        balance,
        timestamp: new Date().toISOString()
    });
}

/**
 * Emit NFT purchase event
 * @param {Server} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {string} collectionId - Collection ID
 * @param {string} itemId - Item ID
 * @param {number} price - Purchase price
 */
function emitNftPurchase(io, userId, collectionId, itemId, price) {
    io.emit('nrc_nft_purchased', {
        userId,
        collectionId,
        itemId,
        price,
        timestamp: new Date().toISOString()
    });
}

/**
 * Emit marketplace listing added
 * @param {Server} io - Socket.IO instance
 * @param {object} listing - Listing data
 */
function emitMarketplaceListing(io, listing) {
    io.emit('nrc_marketplace_listing_added', {
        listing,
        timestamp: new Date().toISOString()
    });
}

/**
 * Emit marketplace purchase
 * @param {Server} io - Socket.IO instance
 * @param {string} listingId - Listing ID
 * @param {string} buyerId - Buyer ID
 * @param {string} sellerId - Seller ID
 * @param {number} price - Sale price
 */
function emitMarketplacePurchase(io, listingId, buyerId, sellerId, price) {
    io.emit('nrc_marketplace_listing_sold', {
        listingId,
        buyerId,
        sellerId,
        price,
        timestamp: new Date().toISOString()
    });
}

/**
 * Emit quest completion
 * @param {Server} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {string} questId - Quest ID
 * @param {number} reward - Reward amount
 */
function emitQuestCompleted(io, userId, questId, reward) {
    io.emit('nrc_quest_completed', {
        userId,
        questId,
        reward,
        timestamp: new Date().toISOString()
    });
}

/**
 * Emit premium activation
 * @param {Server} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {string} tier - Premium tier
 */
function emitPremiumActivated(io, userId, tier) {
    io.emit('nrc_premium_activated', {
        userId,
        tier,
        timestamp: new Date().toISOString()
    });
}

/**
 * Emit investment matured
 * @param {Server} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {string} investmentId - Investment ID
 * @param {number} earned - Interest earned
 */
function emitInvestmentMatured(io, userId, investmentId, earned) {
    io.emit('nrc_investment_matured', {
        userId,
        investmentId,
        earned,
        timestamp: new Date().toISOString()
    });
}

/**
 * Emit investment withdrawal
 * @param {Server} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {string} investmentId - Investment ID
 * @param {number} totalReturn - Total return amount
 */
function emitInvestmentWithdrawal(io, userId, investmentId, totalReturn) {
    io.emit('nrc_investment_withdrawn', {
        userId,
        investmentId,
        totalReturn,
        timestamp: new Date().toISOString()
    });
}

/**
 * Emit game result (win/loss)
 * @param {Server} io - Socket.IO instance
 * @param {string} userId - User ID
 * @param {string} gameType - Game type
 * @param {boolean} won - Did user win?
 * @param {number} amount - Win/loss amount
 */
function emitGameResult(io, userId, gameType, won, amount) {
    io.emit('nrc_game_result', {
        userId,
        gameType,
        won,
        amount,
        timestamp: new Date().toISOString()
    });
}

/**
 * Emit duel challenge
 * @param {Server} io - Socket.IO instance
 * @param {string} challengerId - Challenger ID
 * @param {string} opponentId - Opponent ID
 * @param {string} challengeId - Challenge ID
 * @param {number} stake - Stake amount
 */
function emitDuelChallenge(io, challengerId, opponentId, challengeId, stake) {
    io.emit('nrc_duel_challenge', {
        challengerId,
        opponentId,
        challengeId,
        stake,
        timestamp: new Date().toISOString()
    });
}

/**
 * Emit duel result
 * @param {Server} io - Socket.IO instance
 * @param {string} duelId - Duel ID
 * @param {string} winnerId - Winner ID (or null for draw)
 * @param {number} winnings - Winnings amount
 */
function emitDuelResult(io, duelId, winnerId, winnings) {
    io.emit('nrc_duel_result', {
        duelId,
        winnerId,
        winnings,
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    initNrcEvents,
    emitActivity,
    emitBalanceUpdate,
    emitNftPurchase,
    emitMarketplaceListing,
    emitMarketplacePurchase,
    emitQuestCompleted,
    emitPremiumActivated,
    emitInvestmentMatured,
    emitInvestmentWithdrawal,
    emitGameResult,
    emitDuelChallenge,
    emitDuelResult
};

