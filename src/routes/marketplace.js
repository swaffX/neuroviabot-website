// ==========================================
// 🛒 Marketplace Bot Server Routes
// ==========================================
// Handles marketplace operations on the bot server

const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/simple-db');
const { logger } = require('../utils/logger');

// API Key middleware
const API_KEY = process.env.BOT_API_KEY || 'your-secret-api-key';

function requireApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== API_KEY) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    next();
}

router.use(requireApiKey);

// ==========================================
// GET /api/bot/marketplace/global
// Get all global marketplace listings
// ==========================================
router.get('/global', (req, res) => {
    try {
        const { type, rarity, minPrice, maxPrice, search, sort = 'newest', page = 1, limit = 20 } = req.query;
        
        const db = getDatabase();
        let listings = db.getMarketplaceListings('global', {
            type,
            rarity,
            minPrice: minPrice ? parseInt(minPrice) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
            search
        });
        
        // Sort
        listings = sortListings(listings, sort);
        
        // Paginate
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedListings = listings.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            listings: paginatedListings,
            total: listings.length,
            page: parseInt(page),
            totalPages: Math.ceil(listings.length / limit)
        });
    } catch (error) {
        logger.error('[Marketplace] Error fetching global listings:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// GET /api/bot/marketplace/server/:guildId
// Get server-specific marketplace listings
// ==========================================
router.get('/server/:guildId', (req, res) => {
    try {
        const { guildId } = req.params;
        const { type, rarity, minPrice, maxPrice, search, sort = 'newest', page = 1, limit = 20 } = req.query;
        
        const db = getDatabase();
        let listings = db.getMarketplaceListings(guildId, {
            type,
            rarity,
            minPrice: minPrice ? parseInt(minPrice) : undefined,
            maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
            search
        });
        
        // Sort
        listings = sortListings(listings, sort);
        
        // Paginate
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedListings = listings.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            listings: paginatedListings,
            total: listings.length,
            page: parseInt(page),
            totalPages: Math.ceil(listings.length / limit)
        });
    } catch (error) {
        logger.error('[Marketplace] Error fetching server listings:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// POST /api/bot/marketplace/list
// Create a new marketplace listing
// ==========================================
router.post('/list', (req, res) => {
    try {
        const { userId, item, price, guildId } = req.body;
        
        if (!userId || !item || !price) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        const db = getDatabase();
        const result = db.createListing(userId, item, price, guildId || 'global');
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.json(result);
    } catch (error) {
        logger.error('[Marketplace] Error creating listing:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// POST /api/bot/marketplace/purchase/:listingId
// Purchase a marketplace item
// ==========================================
router.post('/purchase/:listingId', (req, res) => {
    try {
        const { listingId } = req.params;
        const { buyerId } = req.body;
        
        if (!buyerId) {
            return res.status(400).json({
                success: false,
                error: 'Missing buyerId'
            });
        }
        
        const db = getDatabase();
        const listing = db.data.marketplaceListings.get(listingId);
        
        if (!listing) {
            return res.status(400).json({
                success: false,
                error: 'Listing not found'
            });
        }
        
        // Get marketplace config for tax
        const config = db.getServerMarketConfig(listing.guildId);
        const taxRate = config.tax || 0; // 0-10%
        const taxAmount = Math.floor(listing.price * (taxRate / 100));
        const sellerAmount = listing.price - taxAmount;
        
        // Purchase listing
        const result = db.purchaseListing(listingId, buyerId);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        // Add tax to guild treasury
        if (taxAmount > 0 && listing.guildId !== 'global') {
            if (!db.data.guildTreasury) {
                db.data.guildTreasury = new Map();
            }
            
            const treasury = db.data.guildTreasury.get(listing.guildId) || {
                balance: 0,
                totalEarned: 0,
                transactions: []
            };
            
            treasury.balance += taxAmount;
            treasury.totalEarned += taxAmount;
            treasury.transactions.push({
                type: 'marketplace_tax',
                amount: taxAmount,
                listingId,
                timestamp: new Date().toISOString()
            });
            
            // Keep only last 100 transactions
            if (treasury.transactions.length > 100) {
                treasury.transactions = treasury.transactions.slice(-100);
            }
            
            db.data.guildTreasury.set(listing.guildId, treasury);
            db.saveData();
        }
        
        res.json({
            ...result,
            tax: {
                rate: taxRate,
                amount: taxAmount,
                sellerReceived: sellerAmount
            }
        });
    } catch (error) {
        logger.error('[Marketplace] Error purchasing item:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// DELETE /api/bot/marketplace/listing/:listingId
// Cancel a marketplace listing
// ==========================================
router.delete('/listing/:listingId', (req, res) => {
    try {
        const { listingId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'Missing userId'
            });
        }
        
        const db = getDatabase();
        const listing = db.data.marketplaceListings.get(listingId);
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                error: 'Listing not found'
            });
        }
        
        if (listing.seller !== userId) {
            return res.status(403).json({
                success: false,
                error: 'You can only cancel your own listings'
            });
        }
        
        db.data.marketplaceListings.delete(listingId);
        db.saveData();
        
        res.json({
            success: true,
            message: 'Listing canceled successfully'
        });
    } catch (error) {
        logger.error('[Marketplace] Error canceling listing:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// GET /api/bot/marketplace/user/:userId
// Get user's marketplace listings
// ==========================================
router.get('/user/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { status = 'active' } = req.query;
        
        const db = getDatabase();
        const allListings = Array.from(db.data.marketplaceListings.values());
        
        let userListings = allListings.filter(listing => listing.seller === userId);
        
        if (status === 'active') {
            userListings = userListings.filter(listing => listing.status === 'active');
        } else if (status === 'sold') {
            userListings = userListings.filter(listing => listing.status === 'sold');
        }
        
        res.json({
            success: true,
            listings: userListings,
            total: userListings.length
        });
    } catch (error) {
        logger.error('[Marketplace] Error fetching user listings:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// GET /api/bot/marketplace/transactions/:userId
// Get user's transaction history
// ==========================================
router.get('/transactions/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;
        
        const db = getDatabase();
        const transactions = db.getUserTransactions(userId, parseInt(limit));
        
        // Filter marketplace transactions
        const marketplaceTransactions = transactions.filter(tx => 
            tx.type === 'marketplace_purchase' || tx.type === 'marketplace_sale'
        );
        
        res.json({
            success: true,
            transactions: marketplaceTransactions,
            total: marketplaceTransactions.length
        });
    } catch (error) {
        logger.error('[Marketplace] Error fetching transactions:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// POST /api/bot/marketplace/offer
// Make an offer on a listing (P2P trading)
// ==========================================
router.post('/offer', (req, res) => {
    try {
        const { listingId, buyerId, offerAmount, message } = req.body;
        
        if (!listingId || !buyerId || !offerAmount) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        const db = getDatabase();
        const listing = db.data.marketplaceListings.get(listingId);
        
        if (!listing) {
            return res.status(404).json({
                success: false,
                error: 'Listing not found'
            });
        }
        
        if (listing.status !== 'active') {
            return res.status(400).json({
                success: false,
                error: 'Listing is not active'
            });
        }
        
        // Create offer
        const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const offer = {
            id: offerId,
            listingId,
            buyerId,
            offerAmount,
            message: message || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        // Store offer (you might want a separate Map for offers)
        if (!listing.offers) {
            listing.offers = [];
        }
        listing.offers.push(offer);
        
        db.data.marketplaceListings.set(listingId, listing);
        db.saveData();
        
        res.json({
            success: true,
            offer
        });
    } catch (error) {
        logger.error('[Marketplace] Error making offer:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// GET /api/bot/marketplace/config/:guildId
// Get server marketplace configuration
// ==========================================
router.get('/config/:guildId', (req, res) => {
    try {
        const { guildId } = req.params;
        
        const db = getDatabase();
        const config = db.getServerMarketConfig(guildId);
        
        res.json({
            success: true,
            config
        });
    } catch (error) {
        logger.error('[Marketplace] Error fetching config:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// POST /api/bot/marketplace/config/:guildId
// Update server marketplace configuration
// ==========================================
router.post('/config/:guildId', (req, res) => {
    try {
        const { guildId } = req.params;
        const { config } = req.body;
        
        if (!config) {
            return res.status(400).json({
                success: false,
                error: 'Missing config'
            });
        }
        
        const db = getDatabase();
        db.updateServerMarketConfig(guildId, config);
        
        res.json({
            success: true,
            config: db.getServerMarketConfig(guildId)
        });
    } catch (error) {
        logger.error('[Marketplace] Error updating config:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// GET /api/bot/marketplace/treasury/:guildId
// Get guild treasury info
// ==========================================
router.get('/treasury/:guildId', (req, res) => {
    try {
        const { guildId } = req.params;
        
        const db = getDatabase();
        if (!db.data.guildTreasury) {
            db.data.guildTreasury = new Map();
        }
        
        const treasury = db.data.guildTreasury.get(guildId) || {
            balance: 0,
            totalEarned: 0,
            transactions: []
        };
        
        res.json({
            success: true,
            treasury
        });
    } catch (error) {
        logger.error('[Marketplace] Error fetching treasury:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// POST /api/bot/marketplace/treasury/:guildId/withdraw
// Withdraw from guild treasury (admin only)
// ==========================================
router.post('/treasury/:guildId/withdraw', (req, res) => {
    try {
        const { guildId } = req.params;
        const { amount, userId, reason } = req.body;
        
        if (!amount || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        const db = getDatabase();
        if (!db.data.guildTreasury) {
            db.data.guildTreasury = new Map();
        }
        
        const treasury = db.data.guildTreasury.get(guildId);
        
        if (!treasury || treasury.balance < amount) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient treasury balance'
            });
        }
        
        // Deduct from treasury
        treasury.balance -= amount;
        treasury.transactions.push({
            type: 'withdrawal',
            amount: -amount,
            userId,
            reason: reason || 'Admin withdrawal',
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 transactions
        if (treasury.transactions.length > 100) {
            treasury.transactions = treasury.transactions.slice(-100);
        }
        
        db.data.guildTreasury.set(guildId, treasury);
        db.saveData();
        
        res.json({
            success: true,
            newBalance: treasury.balance,
            withdrawnAmount: amount
        });
    } catch (error) {
        logger.error('[Marketplace] Error withdrawing from treasury:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// POST /api/bot/marketplace/treasury/:guildId/deposit
// Deposit to guild treasury
// ==========================================
router.post('/treasury/:guildId/deposit', (req, res) => {
    try {
        const { guildId } = req.params;
        const { amount, userId, reason } = req.body;
        
        if (!amount || !userId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }
        
        const db = getDatabase();
        
        // Deduct from user
        const balance = db.getNeuroCoinBalance(userId);
        if (balance.wallet < amount) {
            return res.status(400).json({
                success: false,
                error: 'Insufficient balance'
            });
        }
        
        db.updateNeuroCoinBalance(userId, -amount, 'wallet');
        
        // Add to treasury
        if (!db.data.guildTreasury) {
            db.data.guildTreasury = new Map();
        }
        
        const treasury = db.data.guildTreasury.get(guildId) || {
            balance: 0,
            totalEarned: 0,
            transactions: []
        };
        
        treasury.balance += amount;
        treasury.totalEarned += amount;
        treasury.transactions.push({
            type: 'deposit',
            amount,
            userId,
            reason: reason || 'User deposit',
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 transactions
        if (treasury.transactions.length > 100) {
            treasury.transactions = treasury.transactions.slice(-100);
        }
        
        db.data.guildTreasury.set(guildId, treasury);
        db.saveData();
        
        res.json({
            success: true,
            newBalance: treasury.balance,
            depositedAmount: amount
        });
    } catch (error) {
        logger.error('[Marketplace] Error depositing to treasury:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ==========================================
// Helper Functions
// ==========================================

function sortListings(listings, sort) {
    switch (sort) {
        case 'newest':
            return listings.sort((a, b) => new Date(b.listed) - new Date(a.listed));
        case 'oldest':
            return listings.sort((a, b) => new Date(a.listed) - new Date(b.listed));
        case 'price_low':
            return listings.sort((a, b) => a.price - b.price);
        case 'price_high':
            return listings.sort((a, b) => b.price - a.price);
        case 'ending_soon':
            return listings.sort((a, b) => {
                if (!a.expires) return 1;
                if (!b.expires) return -1;
                return new Date(a.expires) - new Date(b.expires);
            });
        default:
            return listings;
    }
}

module.exports = { router, requireApiKey };

