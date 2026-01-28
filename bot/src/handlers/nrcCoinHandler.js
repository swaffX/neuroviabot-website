// ==========================================
// 💰 NRC Coin Handler
// ==========================================
// Global NRC coin economy management system
// UPDATED: Now uses MongoDB via mongoService

const mongoService = require('../database/mongoService');
const { logger } = require('../utils/logger');

// Global NRC Coin Configuration
const NRC_CONFIG = {
    name: 'NRC Coin',
    symbol: 'NRC',
    initialSupply: 1000000, // 1 million NRC
    maxSupply: 10000000, // 10 million NRC
    inflationRate: 0.02, // 2% per year
    basePrice: 100, // Base price in server currency
    priceVolatility: 0.1, // 10% price volatility
    tradingFeePercent: 0.05, // 5% trading fee
    levelReward: 10, // NRC reward per level up (fixed)
    dailyReward: 5, // Daily claim reward (fixed)
};

// In-memory cache for performance
let globalStats = {
    totalSupply: NRC_CONFIG.initialSupply,
    circulatingSupply: 0,
    currentPrice: NRC_CONFIG.basePrice,
    priceHistory: [],
    totalTransactions: 0,
    totalTrades: 0,
    lastUpdate: Date.now()
};

// Active trades (P2P marketplace) - kept in memory for speed
const activeTrades = new Map();

/**
 * Initialize NRC Coin system
 */
async function initializeNRCSystem() {
    logger.info('[NRC Coin] Initializing NRC Coin economy system...');

    // Ensure MongoDB is connected
    if (!mongoService.isReady()) {
        await mongoService.connect();
    }

    // Start price update interval (every 5 minutes)
    setInterval(updateNRCPrice, 5 * 60 * 1000);

    // Start daily inflation (every 24 hours)
    setInterval(applyDailyInflation, 24 * 60 * 60 * 1000);

    logger.info('[NRC Coin] NRC Coin system initialized successfully');
}

/**
 * Update NRC price with simulated volatility
 */
async function updateNRCPrice() {
    // Calculate price change based on market activity and volatility
    const volatility = NRC_CONFIG.priceVolatility;
    const priceChange = (Math.random() - 0.5) * 2 * volatility * globalStats.currentPrice;

    // Update current price
    const oldPrice = globalStats.currentPrice;
    globalStats.currentPrice = Math.max(10, globalStats.currentPrice + priceChange); // Minimum 10

    // Add to price history
    const pricePoint = {
        price: globalStats.currentPrice,
        timestamp: Date.now(),
        change: globalStats.currentPrice - oldPrice
    };

    globalStats.priceHistory.push(pricePoint);

    // Keep only last 7 days of price history
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    globalStats.priceHistory = globalStats.priceHistory.filter(p => p.timestamp > sevenDaysAgo);

    // Broadcast price update via Socket.IO
    if (global.io) {
        global.io.emit('nrc:price_update', pricePoint);
    }

    logger.debug(`[NRC Coin] Price updated: ${oldPrice.toFixed(2)} -> ${globalStats.currentPrice.toFixed(2)}`);
}

/**
 * Apply daily inflation to NRC supply
 */
function applyDailyInflation() {
    // Calculate daily inflation amount
    const dailyInflation = (NRC_CONFIG.inflationRate / 365) * globalStats.totalSupply;

    // Check if we haven't reached max supply
    if (globalStats.totalSupply + dailyInflation <= NRC_CONFIG.maxSupply) {
        globalStats.totalSupply += dailyInflation;
        logger.info(`[NRC Coin] Daily inflation applied: +${dailyInflation.toFixed(2)} NRC (Total: ${globalStats.totalSupply.toFixed(2)})`);
    }
}

/**
 * Get user's NRC balance
 */
async function getUserNRCBalance(userId) {
    return await mongoService.getNeuroCoinBalance(userId);
}

/**
 * Add NRC to user's balance
 */
async function addNRCToUser(userId, amount, reason = 'unknown', details = {}) {
    const result = await mongoService.addNeuroCoin(userId, amount, reason, details);
    globalStats.circulatingSupply += amount;
    globalStats.totalTransactions++;

    logger.info(`[NRC Coin] Added ${amount} NRC to user ${userId} (Reason: ${reason})`);

    return result?.balance || 0;
}

/**
 * Remove NRC from user's balance
 */
async function removeNRCFromUser(userId, amount, reason = 'unknown', details = {}) {
    const currentBalance = await getUserNRCBalance(userId);

    if (currentBalance < amount) {
        throw new Error('Insufficient NRC balance');
    }

    const result = await mongoService.removeNeuroCoin(userId, amount, reason, details);
    globalStats.circulatingSupply -= amount;
    globalStats.totalTransactions++;

    logger.info(`[NRC Coin] Removed ${amount} NRC from user ${userId} (Reason: ${reason})`);

    return result?.balance || 0;
}

/**
 * Create a P2P trade offer
 */
async function createTrade(sellerId, amount, pricePerNRC) {
    const sellerBalance = await getUserNRCBalance(sellerId);

    if (sellerBalance < amount) {
        throw new Error('Insufficient NRC balance to create trade');
    }

    const tradeId = Date.now() + Math.random().toString(36).substring(7);

    const trade = {
        id: tradeId,
        sellerId,
        amount,
        pricePerNRC,
        totalPrice: amount * pricePerNRC,
        status: 'active',
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };

    activeTrades.set(tradeId, trade);

    // Lock seller's NRC
    await removeNRCFromUser(sellerId, amount, `Trade created: ${tradeId}`);

    // Broadcast new trade
    if (global.io) {
        global.io.emit('nrc:trade_created', trade);
    }

    logger.info(`[NRC Coin] Trade created: ${amount} NRC for ${trade.totalPrice} by ${sellerId}`);

    return trade;
}

/**
 * Accept a P2P trade
 */
async function acceptTrade(tradeId, buyerId) {
    const trade = activeTrades.get(tradeId);

    if (!trade) {
        throw new Error('Trade not found');
    }

    if (trade.status !== 'active') {
        throw new Error('Trade is not active');
    }

    if (trade.sellerId === buyerId) {
        throw new Error('Cannot buy your own trade');
    }

    // Calculate trading fee
    const fee = Math.floor(trade.amount * NRC_CONFIG.tradingFeePercent);
    const buyerReceives = trade.amount - fee;

    // Transfer NRC to buyer
    await addNRCToUser(buyerId, buyerReceives, `Trade accepted: ${tradeId}`);

    // Fee goes to circulating supply reduction
    globalStats.circulatingSupply -= fee;

    // Mark trade as completed
    trade.status = 'completed';
    trade.buyerId = buyerId;
    trade.completedAt = Date.now();

    activeTrades.delete(tradeId);
    globalStats.totalTrades++;

    // Broadcast trade completion
    if (global.io) {
        global.io.emit('nrc:trade_completed', trade);
    }

    logger.info(`[NRC Coin] Trade ${tradeId} completed: ${buyerId} bought ${buyerReceives} NRC (${fee} fee)`);

    return trade;
}

/**
 * Cancel a trade
 */
async function cancelTrade(tradeId, userId) {
    const trade = activeTrades.get(tradeId);

    if (!trade) {
        throw new Error('Trade not found');
    }

    if (trade.sellerId !== userId) {
        throw new Error('Only seller can cancel this trade');
    }

    // Return NRC to seller
    await addNRCToUser(trade.sellerId, trade.amount, `Trade cancelled: ${tradeId}`);

    // Mark trade as cancelled
    trade.status = 'cancelled';
    trade.cancelledAt = Date.now();

    activeTrades.delete(tradeId);

    logger.info(`[NRC Coin] Trade ${tradeId} cancelled by ${userId}`);

    return trade;
}

/**
 * Get global NRC statistics
 */
function getGlobalStats() {
    return {
        ...globalStats,
        config: NRC_CONFIG,
        activeTrades: activeTrades.size
    };
}

/**
 * Get active trades
 */
function getActiveTrades(limit = 50) {
    return Array.from(activeTrades.values())
        .filter(trade => trade.status === 'active' && trade.expiresAt > Date.now())
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
}

/**
 * Get user's transaction history
 */
async function getUserTransactions(userId, limit = 50) {
    const feed = await mongoService.getActivityFeed({ userId, limit });
    return feed;
}

/**
 * Get top NRC holders
 */
async function getTopHolders(limit = 10) {
    return await mongoService.getNRCLeaderboard(limit);
}

/**
 * Initialize NRC Coin handler
 */
async function init(client) {
    logger.info('[NRC Coin] Handler initialized');
    await initializeNRCSystem();

    // Start price update interval (every hour)
    setInterval(() => {
        updateNRCPrice();
    }, 3600000); // 1 hour
}

module.exports = {
    init,
    initializeNRCSystem,
    getUserNRCBalance,
    addNRCToUser,
    removeNRCFromUser,
    createTrade,
    acceptTrade,
    cancelTrade,
    getGlobalStats,
    getActiveTrades,
    getUserTransactions,
    getTopHolders,
    updateNRCPrice,
    NRC_CONFIG
};
